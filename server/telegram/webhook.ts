import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { processReceipt } from '@/server/agent/index.js';
import { config } from '@/server/config.js';
import {
  clearAckTimeout,
  clearCollectionTimeout,
  getConversation,
  type ParsedReceipt,
  resetConversation,
  setAckTimeout,
  setCollectionTimeout,
  updateConversation,
} from '@/server/state/conversation.js';
import { getFileUrl, sendToReceiver, sendToSender } from '@/server/telegram/send.js';
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
    model: openai('gpt-4o-mini'),
    schema: storeInfoSchema,
    prompt: `The user was asked to provide the ${needing.join(' and ')} for a receipt. Extract the information from their response.

Today's date is ${currentDate}.

User's response: "${text}"

Extract the store name and/or date if provided. Return null for any field not mentioned.
If a date is provided, convert it to MM/DD/YY format (e.g., "11/26/25"). Handle relative dates like "today" or "yesterday" using today's date.`,
  });

  return object;
}

interface TelegramPhoto {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
  photo?: TelegramPhoto[];
  caption?: string;
  media_group_id?: string; // Telegram's media group identifier for albums
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
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

// Timeout constants
const IMAGE_COLLECTION_TIMEOUT_MS = 5000; // 5 seconds before prompting for confirmation
const IMAGE_ACK_DEBOUNCE_MS = 1500; // 1.5 seconds debounce for acknowledgment messages

async function promptImageCollectionComplete(chatId: string): Promise<void> {
  updateConversation({ state: 'AWAITING_IMAGE_CONFIRM' });
  await sendToSender(
    chatId,
    'Are you done sending images? Reply YES to process or keep sending more.'
  );
}

async function sendDebouncedAck(chatId: string): Promise<void> {
  const conversation = getConversation();
  const imageCount = conversation.pendingImages.length;
  await sendToSender(
    chatId,
    `Got ${imageCount} image${imageCount > 1 ? 's' : ''}! Send more or wait a moment...`
  );
}

async function startProcessing(chatId: string): Promise<void> {
  const conversation = getConversation();

  clearCollectionTimeout();
  clearAckTimeout();

  updateConversation({ state: 'PROCESSING' });

  const imageCount = conversation.pendingImages.length;
  await sendToSender(chatId, `Processing ${imageCount} image${imageCount > 1 ? 's' : ''}...`);

  const result = await processReceipt(
    conversation.pendingImages,
    null, // No text content when we have images
    conversation.userGuidance
  );

  if (result.error) {
    await sendToSender(chatId, result.error);
    resetConversation();
    return;
  }

  if (result.parsedReceipt) {
    if (result.parsedReceipt.missingStoreName || result.parsedReceipt.missingDate) {
      updateConversation({
        state: 'AWAITING_STORE_INFO',
        parsedReceipt: result.parsedReceipt,
      });
      await sendToSender(chatId, buildStoreInfoPrompt(result.parsedReceipt));
    } else {
      updateConversation({
        state: 'AWAITING_CONFIRM',
        parsedReceipt: result.parsedReceipt,
      });
      const confirmMsg = formatConfirmationMessage(result.parsedReceipt);
      await sendToSender(chatId, confirmMsg);
    }
  }
}

export async function handleTelegramWebhook(req: Request, res: Response): Promise<void> {
  const update = req.body as TelegramUpdate;

  // Respond immediately to Telegram
  res.status(200).json({ ok: true });

  if (!update.message) {
    return;
  }

  const message = update.message;
  const chatId = message.chat.id.toString();
  const messageText = message.text?.trim() || message.caption?.trim() || '';

  // Get photo URLs if present (Telegram sends multiple sizes, use the largest)
  const photoFileIds: string[] = [];
  if (message.photo && message.photo.length > 0) {
    // Last photo in array is highest resolution
    const largestPhoto = message.photo[message.photo.length - 1];
    photoFileIds.push(largestPhoto.file_id);
  }

  console.log(`[TG <- ${chatId}] "${messageText}" (${photoFileIds.length} images)`);

  // Only respond to authorized chat IDs
  const authorizedChatIds = [config.senderChatId, config.receiverChatId].filter(Boolean);
  if (!authorizedChatIds.includes(chatId)) {
    console.log(`Ignoring message from unauthorized chat: ${chatId}`);
    return;
  }

  const conversation = getConversation();

  try {
    // Handle based on current state
    switch (conversation.state) {
      case 'IDLE': {
        // No photo and no text - prompt user
        if (photoFileIds.length === 0 && !messageText) {
          await sendToSender(chatId, 'Send me a receipt photo or paste the receipt text!');
          break;
        }

        // Text-only receipt (no images) - process immediately
        if (photoFileIds.length === 0 && messageText) {
          updateConversation({
            state: 'PROCESSING',
            pendingImages: [],
            userGuidance: null,
            senderPhone: chatId,
          });

          await sendToSender(chatId, 'Got it! Processing your receipt...');

          const result = await processReceipt([], messageText, null);

          if (result.error) {
            await sendToSender(chatId, result.error);
            resetConversation();
            break;
          }

          if (result.parsedReceipt) {
            if (result.parsedReceipt.missingStoreName || result.parsedReceipt.missingDate) {
              updateConversation({
                state: 'AWAITING_STORE_INFO',
                parsedReceipt: result.parsedReceipt,
              });
              await sendToSender(chatId, buildStoreInfoPrompt(result.parsedReceipt));
            } else {
              updateConversation({
                state: 'AWAITING_CONFIRM',
                parsedReceipt: result.parsedReceipt,
              });
              const confirmMsg = formatConfirmationMessage(result.parsedReceipt);
              await sendToSender(chatId, confirmMsg);
            }
          }
          break;
        }

        // Photo received - start collecting images
        const imageUrls: string[] = [];
        for (const fileId of photoFileIds) {
          const url = await getFileUrl(fileId);
          imageUrls.push(url);
        }

        updateConversation({
          state: 'COLLECTING_IMAGES',
          pendingImages: imageUrls,
          userGuidance: messageText || null, // Caption becomes guidance
          senderPhone: chatId,
          mediaGroupId: message.media_group_id || null,
          collectionStartTime: new Date(),
        });

        // Start collection timeout - will prompt user after 5 seconds of inactivity
        setCollectionTimeout(() => {
          promptImageCollectionComplete(chatId);
        }, IMAGE_COLLECTION_TIMEOUT_MS);

        // Start debounced acknowledgment
        setAckTimeout(() => {
          sendDebouncedAck(chatId);
        }, IMAGE_ACK_DEBOUNCE_MS);

        break;
      }

      case 'PROCESSING': {
        // Still processing, shouldn't receive messages here normally
        await sendToSender(chatId, 'Still processing your receipt, please wait a moment...');
        break;
      }

      case 'COLLECTING_IMAGES': {
        // User sending more images
        if (photoFileIds.length > 0) {
          const imageUrls: string[] = [];
          for (const fileId of photoFileIds) {
            const url = await getFileUrl(fileId);
            imageUrls.push(url);
          }

          // Add to existing images
          const allImages = [...conversation.pendingImages, ...imageUrls];

          // Capture caption as additional guidance if present
          const guidance =
            messageText && !conversation.userGuidance ? messageText : conversation.userGuidance;

          updateConversation({
            pendingImages: allImages,
            userGuidance: guidance,
            mediaGroupId: message.media_group_id || conversation.mediaGroupId,
          });

          // Reset both timeouts since user is still sending
          setCollectionTimeout(() => {
            promptImageCollectionComplete(chatId);
          }, IMAGE_COLLECTION_TIMEOUT_MS);

          setAckTimeout(() => {
            sendDebouncedAck(chatId);
          }, IMAGE_ACK_DEBOUNCE_MS);

          break;
        }

        // User sent text (not a photo) - check if it's a "done" confirmation
        if (messageText) {
          if (isConfirmation(messageText)) {
            // User is saying they're done early - proceed to processing
            await startProcessing(chatId);
            break;
          }

          // Not a confirmation - treat as additional guidance
          const combinedGuidance = conversation.userGuidance
            ? `${conversation.userGuidance}\n${messageText}`
            : messageText;

          updateConversation({ userGuidance: combinedGuidance });
          await sendToSender(chatId, 'Got your note. Keep sending images or say YES when done.');

          // Reset timeout
          setCollectionTimeout(() => {
            promptImageCollectionComplete(chatId);
          }, IMAGE_COLLECTION_TIMEOUT_MS);
          break;
        }

        // Empty message - ignore
        break;
      }

      case 'AWAITING_IMAGE_CONFIRM': {
        // User sends more images after being prompted
        if (photoFileIds.length > 0) {
          const imageUrls: string[] = [];
          for (const fileId of photoFileIds) {
            const url = await getFileUrl(fileId);
            imageUrls.push(url);
          }

          const allImages = [...conversation.pendingImages, ...imageUrls];

          updateConversation({
            state: 'COLLECTING_IMAGES', // Go back to collecting
            pendingImages: allImages,
          });

          // Reset timeouts
          setCollectionTimeout(() => {
            promptImageCollectionComplete(chatId);
          }, IMAGE_COLLECTION_TIMEOUT_MS);

          setAckTimeout(() => {
            sendDebouncedAck(chatId);
          }, IMAGE_ACK_DEBOUNCE_MS);

          break;
        }

        // User confirms they're done
        if (isConfirmation(messageText)) {
          await startProcessing(chatId);
          break;
        }

        // User cancels
        if (isRejection(messageText)) {
          resetConversation();
          await sendToSender(chatId, 'Cancelled. Send a new receipt when ready.');
          break;
        }

        // Any other text - treat as guidance and ask again
        const combinedGuidance = conversation.userGuidance
          ? `${conversation.userGuidance}\n${messageText}`
          : messageText;

        updateConversation({ userGuidance: combinedGuidance });
        await sendToSender(chatId, 'Got your note! Reply YES to process or send more images.');
        break;
      }

      case 'AWAITING_STORE_INFO': {
        if (!conversation.parsedReceipt) {
          resetConversation();
          await sendToSender(chatId, 'Something went wrong. Please send your receipt again.');
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
          await sendToSender(chatId, buildStoreInfoPrompt(updatedReceipt));
          break;
        }

        // All info collected, proceed to confirmation
        updateConversation({
          state: 'AWAITING_CONFIRM',
          parsedReceipt: updatedReceipt,
        });
        const confirmMsg = formatConfirmationMessage(updatedReceipt);
        await sendToSender(chatId, confirmMsg);
        break;
      }

      case 'AWAITING_CONFIRM': {
        // Check if they're trying to send a new receipt
        if (photoFileIds.length > 0) {
          await sendToSender(
            chatId,
            'Please confirm or cancel the current receipt first (reply YES or NO), then send the new one.'
          );
          break;
        }

        if (isRejection(messageText)) {
          resetConversation();
          await sendToSender(chatId, 'Cancelled. Send a new receipt or re-send with corrections.');
          break;
        }

        if (isConfirmation(messageText)) {
          if (conversation.parsedReceipt) {
            const summary = formatFinalSummary(conversation.parsedReceipt);
            await sendToReceiver(summary);
            await sendToSender(chatId, 'Done! Sent the breakdown to the budget.');
          }
          resetConversation();
          break;
        }

        // They're providing corrections - reprocess with feedback
        updateConversation({ state: 'PROCESSING' });
        await sendToSender(chatId, 'Got it, updating based on your feedback...');

        const combinedGuidance = conversation.userGuidance
          ? `${conversation.userGuidance}\n\nCorrections: ${messageText}`
          : messageText;

        const result = await processReceipt(conversation.pendingImages, null, combinedGuidance);

        if (result.error) {
          await sendToSender(chatId, result.error);
          resetConversation();
          break;
        }

        if (result.parsedReceipt) {
          if (result.parsedReceipt.missingStoreName || result.parsedReceipt.missingDate) {
            updateConversation({
              state: 'AWAITING_STORE_INFO',
              parsedReceipt: result.parsedReceipt,
            });
            await sendToSender(chatId, buildStoreInfoPrompt(result.parsedReceipt));
          } else {
            updateConversation({
              state: 'AWAITING_CONFIRM',
              parsedReceipt: result.parsedReceipt,
            });
            const confirmMsg = formatConfirmationMessage(result.parsedReceipt);
            await sendToSender(chatId, confirmMsg);
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error handling Telegram message:', error);
    await sendToSender(chatId, 'Sorry, something went wrong. Please try again.');
    resetConversation();
  }
}
