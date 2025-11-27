import type { Request, Response } from 'express';
import { config } from '@/config.js';
import { sendToSender, sendToReceiver } from '@/twilio/send.js';
import { getConversation, updateConversation, resetConversation } from '@/state/conversation.js';
import { processReceipt } from '@/agent/index.js';
import { formatConfirmationMessage, formatFinalSummary } from '@/utils/format.js';

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
  const body = req.body as TwilioWebhookBody;
  const from = body.From;
  const messageText = body.Body?.trim() || '';
  const mediaUrls = getMediaUrls(body);

  console.log(`[SMS <- ${from}] "${messageText}" (${mediaUrls.length} images)`);

  // Only respond to authorized numbers (sender or receiver)
  const authorizedNumbers = [config.senderPhoneNumber, config.receiverPhoneNumber];
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
          updateConversation({
            state: 'AWAITING_CONFIRM',
            parsedReceipt: result.parsedReceipt,
          });
          const confirmMsg = formatConfirmationMessage(result.parsedReceipt);
          await sendToSender(from, confirmMsg);
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
          updateConversation({
            state: 'AWAITING_CONFIRM',
            parsedReceipt: result.parsedReceipt,
          });
          const confirmMsg = formatConfirmationMessage(result.parsedReceipt);
          await sendToSender(from, confirmMsg);
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
