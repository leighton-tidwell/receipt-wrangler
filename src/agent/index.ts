import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { config } from "../config.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import type { ParsedReceipt } from "../state/conversation.js";

const receiptItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  taxable: z.boolean(),
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
});

// Ensure OpenAI API key is set
process.env.OPENAI_API_KEY = config.openaiApiKey;

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
    // Build the content array for the message
    const content: Array<
      ({ type: "text" } & { text: string }) | { type: "image"; image: URL }
    > = [];

    // Add any text content (pasted receipt or user message)
    let promptText = "Please categorize this receipt.";
    if (textContent) {
      promptText += `\n\nReceipt text:\n${textContent}`;
    }
    if (userGuidance) {
      promptText += `\n\nUser instructions: ${userGuidance}`;
    }
    content.push({ type: "text", text: promptText });

    // Add images
    for (const url of imageUrls) {
      content.push({ type: "image", image: new URL(url) });
    }

    const { object } = await generateObject({
      model: openai("gpt-5-mini"),
      schema: receiptResponseSchema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    const receipt: ParsedReceipt = {
      storeName: object.storeName,
      date: object.date,
      categories: object.categories as ParsedReceipt["categories"],
      originalTotal: object.originalTotal,
    };

    return {
      parsedReceipt: receipt,
      error: null,
    };
  } catch (error) {
    console.error("Error processing receipt:", error);
    return {
      parsedReceipt: null,
      error: "An error occurred processing the receipt. Please try again.",
    };
  }
}
