import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { config } from "../config.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import type { ParsedReceipt } from "../state/conversation.js";

// Ensure OpenAI API key is set
process.env.OPENAI_API_KEY = config.openaiApiKey;

interface AgentResponse {
  parsedReceipt: ParsedReceipt | null;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  error: string | null;
}

export async function processReceipt(
  imageUrls: string[],
  textContent: string | null,
  userGuidance: string | null
): Promise<AgentResponse> {
  try {
    // Build the content array for the message
    const content: Array<{ type: "text" } & { text: string } | { type: "image"; image: URL }> = [];

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

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content,
        },
      ],
      maxOutputTokens: 4096,
    });

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        parsedReceipt: null,
        needsClarification: false,
        clarificationQuestion: null,
        error: "Could not parse receipt. Please try again with a clearer image.",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.needsClarification) {
      return {
        parsedReceipt: null,
        needsClarification: true,
        clarificationQuestion: parsed.clarificationQuestion,
        error: null,
      };
    }

    // Convert to our ParsedReceipt type
    const receipt: ParsedReceipt = {
      storeName: parsed.storeName,
      date: parsed.date,
      categories: parsed.categories,
      originalTotal: parsed.originalTotal,
    };

    return {
      parsedReceipt: receipt,
      needsClarification: false,
      clarificationQuestion: null,
      error: null,
    };
  } catch (error) {
    console.error("Error processing receipt:", error);
    return {
      parsedReceipt: null,
      needsClarification: false,
      clarificationQuestion: null,
      error: "An error occurred processing the receipt. Please try again.",
    };
  }
}

export async function processClarificationResponse(
  originalImages: string[],
  originalText: string | null,
  originalGuidance: string | null,
  clarificationAnswer: string
): Promise<AgentResponse> {
  // Re-process with the clarification answer as additional guidance
  const combinedGuidance = originalGuidance
    ? `${originalGuidance}\n\nAdditional clarification: ${clarificationAnswer}`
    : clarificationAnswer;

  return processReceipt(originalImages, originalText, combinedGuidance);
}
