import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

import { SYSTEM_PROMPT } from '@/server/agent/prompts.js';
import { config } from '@/server/config.js';
import type { ParsedReceipt } from '@/server/state/conversation.js';
import { receiptResponseSchema } from '@/shared/receipt-schema.js';

process.env.OPENAI_API_KEY = config.openaiApiKey;

const parserModel = new ChatOpenAI({
  model: 'gpt-5-mini',
  apiKey: config.openaiApiKey,
}).withStructuredOutput(receiptResponseSchema, { name: 'receipt' });

interface AgentResponse {
  parsedReceipt: ParsedReceipt | null;
  error: string | null;
}

/**
 * Stateless receipt parser. Used directly by the web flow and by the
 * parseReceipt graph node (via the same ChatOpenAI instance). Kept as a
 * thin wrapper so the web upload routes don't need to know about the graph.
 */
export async function processReceipt(
  imageUrls: string[],
  textContent: string | null,
  userGuidance: string | null
): Promise<AgentResponse> {
  try {
    let promptText = 'Please categorize this receipt.';
    if (textContent) promptText += `\n\nReceipt text:\n${textContent}`;
    if (userGuidance) promptText += `\n\nUser instructions: ${userGuidance}`;

    const parts: Array<
      { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
    > = [{ type: 'text', text: promptText }];
    for (const url of imageUrls) {
      parts.push({ type: 'image_url', image_url: { url } });
    }

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

    return { parsedReceipt: receipt, error: null };
  } catch (error) {
    console.error('Error processing receipt:', error);
    return {
      parsedReceipt: null,
      error: 'An error occurred processing the receipt. Please try again.',
    };
  }
}
