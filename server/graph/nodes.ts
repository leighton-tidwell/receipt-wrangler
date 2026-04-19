import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { END, interrupt } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

import { SYSTEM_PROMPT } from '@/server/agent/prompts.js';
import { config } from '@/server/config.js';
import { ReceiptGraphStateType } from '@/server/graph/state.js';
import type { ParsedReceipt } from '@/server/state/conversation.js';
import { receiptResponseSchema } from '@/shared/receipt-schema.js';

process.env.OPENAI_API_KEY = config.openaiApiKey;

const parserModel = new ChatOpenAI({
  model: 'gpt-5-mini',
  apiKey: config.openaiApiKey,
}).withStructuredOutput(receiptResponseSchema, { name: 'receipt' });

/**
 * Collects images across multiple turns. Interrupts after each arrival so the
 * transport (Telegram / web) can surface a "Done adding" button. Resume payload:
 *   - { addImages: string[], guidance?: string } → keep collecting, interrupt again
 *   - { done: true }                              → proceed to parsing
 *   - { cancel: true }                            → abort
 */
export async function collectImagesNode(state: ReceiptGraphStateType) {
  // Web channel uploads all images at once — skip collection loop.
  if (state.channel === 'web' || state.textContent) {
    return { collectionDone: true };
  }

  const resume = interrupt({
    type: 'collect_images',
    imageCount: state.pendingImages.length,
    prompt:
      state.pendingImages.length === 0
        ? 'Send one or more receipt photos.'
        : `Got ${state.pendingImages.length} image${state.pendingImages.length === 1 ? '' : 's'}. Send more or tap Done.`,
    actions: [
      { id: 'done', label: 'Done ✅', disabled: state.pendingImages.length === 0 },
      { id: 'cancel', label: 'Cancel ❌' },
    ],
  });

  if (resume?.cancel) {
    return { cancelled: true, collectionDone: false };
  }
  if (resume?.done && state.pendingImages.length > 0) {
    return { collectionDone: true };
  }
  if (resume?.addImages?.length) {
    const combinedGuidance = resume.guidance
      ? state.userGuidance
        ? `${state.userGuidance}\n${resume.guidance}`
        : resume.guidance
      : state.userGuidance;
    return {
      pendingImages: resume.addImages,
      userGuidance: combinedGuidance,
      collectionDone: false,
    };
  }
  return { collectionDone: false };
}

export function routeAfterCollect(state: ReceiptGraphStateType) {
  if (state.cancelled) return END;
  if (state.collectionDone) return 'parseReceipt';
  return 'collectImages';
}

export async function parseReceiptNode(state: ReceiptGraphStateType) {
  const parts: Array<
    { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
  > = [];

  let promptText = 'Please categorize this receipt.';
  if (state.textContent) promptText += `\n\nReceipt text:\n${state.textContent}`;
  if (state.userGuidance) promptText += `\n\nUser instructions: ${state.userGuidance}`;
  parts.push({ type: 'text', text: promptText });

  for (const url of state.pendingImages) {
    parts.push({ type: 'image_url', image_url: { url } });
  }

  try {
    const output = await parserModel.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage({ content: parts }),
    ]);

    const receipt: ParsedReceipt = {
      storeName: output.storeName,
      date: output.date,
      missingStoreName: output.missingStoreName,
      missingDate: output.missingDate,
      categories: output.categories as ParsedReceipt['categories'],
      originalTotal: output.originalTotal,
      hasUnclearItems: output.hasUnclearItems ?? false,
      hasMissingItems: output.hasMissingItems ?? false,
      credit: output.credit
        ? {
            amount: output.credit.amount,
            targetCategory: output.credit.targetCategory ?? undefined,
          }
        : undefined,
    };
    return { parsedReceipt: receipt };
  } catch (err) {
    console.error('[parseReceipt] error:', err);
    return { parsedReceipt: null };
  }
}

/**
 * Surfaces a confirmation choice via interrupt. Resume payload:
 *   - { decision: 'approve' }
 *   - { decision: 'edit', corrections: string }
 *   - { decision: 'reject' }
 */
export async function awaitConfirmationNode(state: ReceiptGraphStateType) {
  if (!state.parsedReceipt) {
    return { confirmationResult: 'reject' as const };
  }

  const resume = interrupt({
    type: 'confirm_receipt',
    parsedReceipt: state.parsedReceipt,
    prompt: 'Review the parsed receipt and choose an action.',
    actions: [
      { id: 'approve', label: 'Approve ✅' },
      { id: 'edit', label: 'Edit ✏️' },
      { id: 'reject', label: 'Reject ❌' },
    ],
  });

  const decision: 'approve' | 'edit' | 'reject' = resume?.decision ?? 'reject';

  if (decision === 'edit' && resume?.corrections) {
    const combined = state.userGuidance
      ? `${state.userGuidance}\n\nCorrections: ${resume.corrections}`
      : resume.corrections;
    return { confirmationResult: decision, userGuidance: combined };
  }

  return { confirmationResult: decision };
}

export function routeAfterConfirmation(state: ReceiptGraphStateType) {
  if (state.confirmationResult === 'approve') return 'send';
  if (state.confirmationResult === 'edit') return 'parseReceipt';
  return END;
}
