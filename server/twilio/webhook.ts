import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { processReceipt } from '@/server/agent/index.js';
import { config } from '@/server/config.js';
import {
  getConversation,
  type ParsedReceipt,
  resetConversation,
  updateConversation,
} from '@/server/state/conversation.js';
import { sendToReceiver, sendToSender } from '@/server/twilio/send.js';
import { formatConfirmationMessage, formatFinalSummary } from '@/server/utils/format.js';

// Ensure OpenAI API key is set
process.env.OPENAI_API_KEY = config.openaiApiKey;

const storeInfoSchema = z.object({
  storeName: z
    .string()
    .nullable()
    .describe('The store name if provided by the user, or null if not mentioned'),
  date: z
    .string()
    .nullable()
    .describe('The date if provided by the user (in any format), or null if not mentioned'),
});

function buildStoreInfoPrompt(receipt: ParsedReceipt): string {
  const needed: string[] = [];
  if (receipt.missingStoreName) needed.push('store name');
  if (receipt.missingDate) needed.push('date');
  const example =
    receipt.missingStoreName && receipt.missingDate
      ? 'HEB, 11/26/25'
      : receipt.missingStoreName
        ? 'HEB'
        : '11/26/25';
  return `I couldn't detect the ${needed.join(' or ')}. Please reply with the ${needed.join(' and ')} (e.g., "${example}").`;
}

async function parseStoreInfoWithLLM(
  text: string,
  receipt: ParsedReceipt
): Promise<{ storeName: string | null; date: string | null }> {
  const needing: string[] = [];
  if (receipt.missingStoreName) needing.push('store name');
  if (receipt.missingDate) needing.push('date');

  const today = new Date();
  const currentDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear().toString().slice(-2)}`;

  const { object } = await generateObject({
    model: openai('gpt-5-nano'),
    schema: storeInfoSchema,
    prompt: `The user was asked to provide the ${needing.join(' and ')} for a receipt. Extract the information from their response.

Today's date is ${currentDate}.

User's response: "${text}"

Extract the store name and/or date if provided. Return null for any field not mentioned.
If a date is provided, convert it to MM/DD/YY format (e.g., "11/26/25"). Handle relative dates like "today" or "yesterday" using today's date.`,
  });

  return object;
}

interface TwilioWebhookBody {
  From: string;
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
  MediaUrl1?: string;
  MediaUrl2?: string;
  MediaUrl3?: string;
  MediaUrl4?: string;
  MediaUrl5?: string;
  MediaUrl6?: string;
  MediaUrl7?: string;
  MediaUrl8?: string;
  MediaUrl9?: string;
}

function getMediaUrls(body: TwilioWebhookBody): string[] {
  const urls: string[] = [];
  const numMedia = parseInt(body.NumMedia, 10);

  for (let i = 0; i < numMedia; i++) {
    const key = `MediaUrl${i}` as keyof TwilioWebhookBody;
    const url = body[key];
    if (url) {
      urls.push(url);
    }
  }

  return urls;
}

function isConfirmation(text: string): boolean {
  const confirmWords = [
    'yes',
    'yep',
    'yeah',
    'y',
    'confirm',
    'looks good',
    'good',
    'correct',
    'ok',
    'okay',
    'send it',
    'send',
    'approved',
    'approve',
  ];
  const normalized = text.toLowerCase().trim();
  return confirmWords.some((word) => normalized === word || normalized.startsWith(word));
}

function isRejection(text: string): boolean {
  const rejectWords = ['no', 'nope', 'cancel', 'stop', 'reset', 'start over'];
  const normalized = text.toLowerCase().trim();
  return rejectWords.some((word) => normalized === word || normalized.startsWith(word));
}

export async function handleIncomingSms(req: Request, res: Response): Promise<void> {
  if (config.disableTwilio) {
    console.log('[TWILIO DISABLED] Webhook called but Twilio is disabled');
    res.status(503).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    return;
  }

  const body = req.body as TwilioWebhookBody;
  const from = body.From;
  const messageText = body.Body?.trim() || '';
  const mediaUrls = getMediaUrls(body);

  console.log(`[SMS <- ${from}] "${messageText}" (${mediaUrls.length} images)`);

  // Only respond to authorized numbers (sender, receiver, or virtual number)
  const authorizedNumbers = [
    config.senderPhoneNumber,
    config.receiverPhoneNumber,
    config.twilioVirtualNumber,
  ].filter(Boolean) as string[];
  if (!authorizedNumbers.includes(from)) {
    console.log(`Ignoring message from unauthorized number: ${from}`);
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    return;
  }

  const conversation = getConversation();

  try {
    // Handle based on current state
    switch (conversation.state) {
      case 'IDLE': {
        // New receipt coming in
        if (mediaUrls.length === 0 && !messageText) {
          await sendToSender(from, 'Send me a receipt photo or paste the receipt text!');
          break;
        }

        updateConversation({
          state: 'PROCESSING',
          pendingImages: mediaUrls,
          userGuidance: messageText || null,
          senderPhone: from,
        });

        await sendToSender(from, 'Got it! Processing your receipt...');

        const result = await processReceipt(
          mediaUrls,
          mediaUrls.length === 0 ? messageText : null,
          mediaUrls.length > 0 ? messageText : null
        );

        if (result.error) {
          await sendToSender(from, result.error);
          resetConversation();
          break;
        }

        if (result.parsedReceipt) {
          if (result.parsedReceipt.missingStoreName || result.parsedReceipt.missingDate) {
            updateConversation({
              state: 'AWAITING_STORE_INFO',
              parsedReceipt: result.parsedReceipt,
            });
            await sendToSender(from, buildStoreInfoPrompt(result.parsedReceipt));
          } else {
            updateConversation({
              state: 'AWAITING_CONFIRM',
              parsedReceipt: result.parsedReceipt,
            });
            const confirmMsg = formatConfirmationMessage(result.parsedReceipt);
            await sendToSender(from, confirmMsg);
          }
        }
        break;
      }

      case 'PROCESSING': {
        // Still processing, shouldn't receive messages here normally
        await sendToSender(
          conversation.senderPhone!,
          'Still processing your receipt, please wait a moment...'
        );
        break;
      }

      case 'AWAITING_STORE_INFO': {
        if (!conversation.parsedReceipt) {
          resetConversation();
          await sendToSender(from, 'Something went wrong. Please send your receipt again.');
          break;
        }

        const parsed = await parseStoreInfoWithLLM(messageText, conversation.parsedReceipt);

        // Update the receipt with provided info and clear flags
        const updatedReceipt = { ...conversation.parsedReceipt };
        if (parsed.storeName) {
          updatedReceipt.storeName = parsed.storeName;
          updatedReceipt.missingStoreName = false;
        }
        if (parsed.date) {
          updatedReceipt.date = parsed.date;
          updatedReceipt.missingDate = false;
        }

        // Check if we still need info
        if (updatedReceipt.missingStoreName || updatedReceipt.missingDate) {
          updateConversation({ parsedReceipt: updatedReceipt });
          await sendToSender(from, buildStoreInfoPrompt(updatedReceipt));
          break;
        }

        // All info collected, proceed to confirmation
        updateConversation({
          state: 'AWAITING_CONFIRM',
          parsedReceipt: updatedReceipt,
        });
        const confirmMsg = formatConfirmationMessage(updatedReceipt);
        await sendToSender(from, confirmMsg);
        break;
      }

      case 'AWAITING_CONFIRM': {
        // Check if they're trying to send a new receipt
        if (mediaUrls.length > 0) {
          await sendToSender(
            conversation.senderPhone!,
            'Please confirm or cancel the current receipt first (reply YES or NO), then send the new one.'
          );
          break;
        }

        if (isRejection(messageText)) {
          resetConversation();
          await sendToSender(from, 'Cancelled. Send a new receipt or re-send with corrections.');
          break;
        }

        if (isConfirmation(messageText)) {
          if (conversation.parsedReceipt) {
            const summary = formatFinalSummary(conversation.parsedReceipt);
            await sendToReceiver(summary);
            await sendToSender(from, 'Done! Sent the breakdown to the budget.');
          }
          resetConversation();
          break;
        }

        // They're providing corrections - reprocess with feedback
        updateConversation({ state: 'PROCESSING' });
        await sendToSender(from, 'Got it, updating based on your feedback...');

        const combinedGuidance = conversation.userGuidance
          ? `${conversation.userGuidance}\n\nCorrections: ${messageText}`
          : messageText;

        const result = await processReceipt(conversation.pendingImages, null, combinedGuidance);

        if (result.error) {
          await sendToSender(from, result.error);
          resetConversation();
          break;
        }

        if (result.parsedReceipt) {
          if (result.parsedReceipt.missingStoreName || result.parsedReceipt.missingDate) {
            updateConversation({
              state: 'AWAITING_STORE_INFO',
              parsedReceipt: result.parsedReceipt,
            });
            await sendToSender(from, buildStoreInfoPrompt(result.parsedReceipt));
          } else {
            updateConversation({
              state: 'AWAITING_CONFIRM',
              parsedReceipt: result.parsedReceipt,
            });
            const confirmMsg = formatConfirmationMessage(result.parsedReceipt);
            await sendToSender(from, confirmMsg);
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error handling SMS:', error);
    await sendToSender(from, 'Sorry, something went wrong. Please try again.');
    resetConversation();
  }

  // Respond to Twilio with empty TwiML (we send messages via API)
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
}
