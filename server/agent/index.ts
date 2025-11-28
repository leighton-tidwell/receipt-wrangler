import { openai } from '@ai-sdk/openai';
import { Output, stepCountIs, ToolLoopAgent as Agent } from 'ai';
import { z } from 'zod';

import { SYSTEM_PROMPT } from '@/server/agent/prompts.js';
import { verifyTotals } from '@/server/agent/tools.js';
import { config } from '@/server/config.js';
import type { ParsedReceipt } from '@/server/state/conversation.js';

const receiptItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  taxable: z.boolean(),
  unclear: z.boolean().optional().default(false),
});

const categoryBreakdownSchema = z.object({
  items: z.array(receiptItemSchema),
  subtotal: z.number(),
  fees: z.number(),
  tax: z.number(),
  total: z.number(),
});

const receiptResponseSchema = z.object({
  storeName: z.string(),
  date: z.string(),
  missingStoreName: z.boolean(),
  missingDate: z.boolean(),
  categories: z.record(z.string(), categoryBreakdownSchema),
  originalTotal: z.number(),
  hasUnclearItems: z.boolean().optional().default(false),
  hasMissingItems: z.boolean().optional().default(false),
  giftCardAmount: z.number().optional().default(0), // Gift card payment in cents
  giftCardCategory: z.string().optional(), // User-specified category to apply gift card to first
});

// Ensure OpenAI API key is set
process.env.OPENAI_API_KEY = config.openaiApiKey;

const receiptAgent = new Agent({
  model: openai('gpt-5-mini'),
  instructions: SYSTEM_PROMPT,
  tools: { verifyTotals },
  output: Output.object({ schema: receiptResponseSchema }),
  stopWhen: stepCountIs(5),
});

interface AgentResponse {
  parsedReceipt: ParsedReceipt | null;
  error: string | null;
}

/**
 * Applies gift card deduction to category totals.
 * If a specific category is specified, applies to that category first.
 * If the gift card exceeds that category's total, or no category is specified,
 * distributes evenly across all categories with items.
 */
function applyGiftCardDeduction(receipt: ParsedReceipt): void {
  let remainingGiftCard = receipt.giftCardAmount ?? 0;
  if (remainingGiftCard <= 0) return;

  // Get categories that have items (non-empty)
  const categoriesWithItems = Object.entries(receipt.categories).filter(
    ([, breakdown]) => breakdown.items.length > 0
  );

  if (categoriesWithItems.length === 0) return;

  // If user specified a category, apply to that first
  if (receipt.giftCardCategory) {
    const targetCategory = categoriesWithItems.find(
      ([key]) => key.toLowerCase() === receipt.giftCardCategory?.toLowerCase()
    );

    if (targetCategory) {
      const [key, breakdown] = targetCategory;
      const deduction = Math.min(remainingGiftCard, breakdown.total);
      breakdown.total -= deduction;
      remainingGiftCard -= deduction;

      console.log(
        `[GiftCard] Applied ${deduction} cents to ${key}, remaining: ${remainingGiftCard}`
      );

      // If we've used up the gift card, we're done
      if (remainingGiftCard <= 0) return;

      // Remove this category from the list for even distribution of remainder
      const idx = categoriesWithItems.findIndex(([k]) => k === key);
      if (idx !== -1) categoriesWithItems.splice(idx, 1);
    }
  }

  // Distribute remaining gift card evenly across all (remaining) categories
  if (remainingGiftCard > 0 && categoriesWithItems.length > 0) {
    // Calculate even split (handle rounding by giving extra cents to first categories)
    const perCategory = Math.floor(remainingGiftCard / categoriesWithItems.length);
    let extraCents = remainingGiftCard % categoriesWithItems.length;

    for (const [key, breakdown] of categoriesWithItems) {
      // Add an extra cent to first few categories to handle rounding
      const thisDeduction = Math.min(perCategory + (extraCents > 0 ? 1 : 0), breakdown.total);
      if (extraCents > 0) extraCents--;

      breakdown.total -= thisDeduction;
      console.log(`[GiftCard] Applied ${thisDeduction} cents evenly to ${key}`);
    }
  }
}

export async function processReceipt(
  imageUrls: string[],
  textContent: string | null,
  userGuidance: string | null
): Promise<AgentResponse> {
  try {
    // Build the prompt text
    let promptText = 'Please categorize this receipt.';
    if (textContent) {
      promptText += `\n\nReceipt text:\n${textContent}`;
    }
    if (userGuidance) {
      promptText += `\n\nUser instructions: ${userGuidance}`;
    }

    // Build the message content array
    type MessageContent = Array<{ type: 'text'; text: string } | { type: 'image'; image: URL }>;
    const content: MessageContent = [{ type: 'text', text: promptText }];

    // Add images if present
    for (const url of imageUrls) {
      content.push({ type: 'image', image: new URL(url) });
    }

    const result = await receiptAgent.generate({
      messages: [
        {
          role: 'user' as const,
          content,
        },
      ],
    });

    // Log agent execution details
    console.log('[Agent] Steps:', result.steps?.length ?? 0);
    if (result.steps) {
      for (const [i, step] of result.steps.entries()) {
        console.log(`[Agent] Step ${i + 1}:`, {
          toolCalls:
            step.toolCalls?.map((tc) => ({
              name: tc.toolName,
              input: 'input' in tc ? tc.input : undefined,
            })) ?? [],
          toolResults: step.toolResults?.length ?? 0,
          finishReason: step.finishReason,
        });
      }
    }
    console.log('[Agent] Final output received:', !!result.output);

    const output = result.output;
    if (!output) {
      throw new Error('No output received from agent');
    }

    const receipt: ParsedReceipt = {
      storeName: output.storeName,
      date: output.date,
      missingStoreName: output.missingStoreName,
      missingDate: output.missingDate,
      categories: output.categories as ParsedReceipt['categories'],
      originalTotal: output.originalTotal,
      hasUnclearItems: output.hasUnclearItems ?? false,
      hasMissingItems: output.hasMissingItems ?? false,
      giftCardAmount: output.giftCardAmount ?? 0,
      giftCardCategory: output.giftCardCategory,
    };

    // Apply gift card deduction to categories
    if (receipt.giftCardAmount && receipt.giftCardAmount > 0) {
      applyGiftCardDeduction(receipt);
    }

    return {
      parsedReceipt: receipt,
      error: null,
    };
  } catch (error) {
    console.error('Error processing receipt:', error);
    return {
      parsedReceipt: null,
      error: 'An error occurred processing the receipt. Please try again.',
    };
  }
}
