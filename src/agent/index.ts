import { ToolLoopAgent as Agent, Output, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { config } from '../config.js';
import { SYSTEM_PROMPT } from './prompts.js';
import { verifyTotals } from './tools.js';
import type { ParsedReceipt } from '../state/conversation.js';

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
  categories: z.record(z.string(), categoryBreakdownSchema),
  originalTotal: z.number(),
  hasUnclearItems: z.boolean().optional().default(false),
  hasMissingItems: z.boolean().optional().default(false),
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
      categories: output.categories as ParsedReceipt['categories'],
      originalTotal: output.originalTotal,
      hasUnclearItems: output.hasUnclearItems ?? false,
      hasMissingItems: output.hasMissingItems ?? false,
    };

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
