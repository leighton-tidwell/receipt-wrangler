import crypto from 'crypto';
import type { Request, RequestHandler, Response } from 'express';
import multer from 'multer';

import { processReceipt } from '@/server/agent/index.js';
import { config } from '@/server/config.js';
import type { ParsedReceipt } from '@/server/state/conversation.js';
import { sendToReceiver } from '@/server/telegram/send.js';
import { formatFinalSummary } from '@/server/utils/format.js';
import {
  donePage,
  passwordPage,
  processingErrorPage,
  reviewPage,
  uploadPage,
} from '@/server/web/templates.js';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export const uploadMiddleware: RequestHandler = upload.array('images', 10) as RequestHandler;

// Session management
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const sessions = new Map<string, number>(); // token -> expiration timestamp

function createSession(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  sessions.set(token, expiresAt);
  return token;
}

function isValidSession(token: string | undefined): boolean {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function checkPassword(password: string): boolean {
  return password === config.uploadPassword;
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie('session', token, {
    httpOnly: true,
    maxAge: SESSION_DURATION_MS,
    sameSite: 'strict',
  });
}

function hasValidSession(req: Request): boolean {
  // Skip auth in dev mode
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  return isValidSession(req.cookies?.session);
}

// GET /upload - Show upload form (or password page if not authenticated)
export function getUploadPage(req: Request, res: Response): void {
  if (hasValidSession(req)) {
    res.send(uploadPage());
  } else {
    res.send(passwordPage());
  }
}

// POST /auth - Validate password and create session
export function postAuth(req: Request, res: Response): void {
  const { password } = req.body;

  if (!checkPassword(password)) {
    res.send(passwordPage('Invalid password'));
    return;
  }

  const token = createSession();
  setSessionCookie(res, token);
  res.redirect('/upload');
}

// POST /upload - Process receipt
export async function postUpload(req: Request, res: Response): Promise<void> {
  const { instructions, receiptText } = req.body;
  const files = req.files as Express.Multer.File[] | undefined;

  // Check for valid session
  if (!hasValidSession(req)) {
    res.send(passwordPage('Session expired. Please log in again.'));
    return;
  }

  const hasFiles = files && files.length > 0;
  const hasText = receiptText && receiptText.trim().length > 0;

  // Check for at least one input
  if (!hasFiles && !hasText) {
    res.send(uploadPage('Please upload an image or paste receipt text'));
    return;
  }

  try {
    // Convert files to base64 data URLs for the AI
    const imageDataUrls = hasFiles
      ? files.map((file) => {
          const base64 = file.buffer.toString('base64');
          return `data:${file.mimetype};base64,${base64}`;
        })
      : [];

    // Store base64 for reprocessing (without the data URL prefix)
    const imageData = hasFiles ? files.map((file) => file.buffer.toString('base64')) : [];
    const mimeTypes = hasFiles ? files.map((file) => file.mimetype) : [];

    // Process receipt - pass text as content if no images, otherwise as guidance
    const result = await processReceipt(
      imageDataUrls,
      hasFiles ? null : receiptText,
      hasFiles
        ? [receiptText, instructions].filter(Boolean).join('\n\n') || null
        : instructions || null
    );

    if (result.error) {
      res.send(processingErrorPage(result.error));
      return;
    }

    if (result.parsedReceipt) {
      // Encode image data with mime types for reprocessing
      const encodedImages = imageData.map((data, i) => `${mimeTypes[i]}|${data}`);
      const combinedInstructions =
        [receiptText, instructions].filter(Boolean).join('\n\n') || undefined;
      res.send(reviewPage(result.parsedReceipt, encodedImages, combinedInstructions, receiptText));
      return;
    }

    res.send(processingErrorPage('Unknown error processing receipt'));
  } catch (error) {
    console.error('Error in postUpload:', error);
    res.send(processingErrorPage('An error occurred. Please try again.'));
  }
}

// POST /upload/reprocess - Reprocess with corrections
export async function postReprocess(req: Request, res: Response): Promise<void> {
  const { corrections, previousInstructions, imageCount, receiptText } = req.body;

  // Check for valid session
  if (!hasValidSession(req)) {
    res.send(passwordPage('Session expired. Please log in again.'));
    return;
  }

  try {
    // Reconstruct image data URLs
    const count = parseInt(imageCount, 10);
    const imageDataUrls: string[] = [];
    const encodedImages: string[] = [];

    for (let i = 0; i < count; i++) {
      const encoded = req.body[`imageData${i}`];
      if (encoded) {
        encodedImages.push(encoded);
        const [mimeType, base64] = encoded.split('|');
        imageDataUrls.push(`data:${mimeType};base64,${base64}`);
      }
    }

    const hasImages = imageDataUrls.length > 0;

    // Combine previous instructions with corrections
    const combinedInstructions = [previousInstructions, corrections]
      .filter(Boolean)
      .join('\n\nAdditional corrections: ');

    // Process receipt - use receiptText as content if no images
    const result = await processReceipt(
      imageDataUrls,
      hasImages ? null : receiptText,
      hasImages ? combinedInstructions || null : corrections || null
    );

    if (result.error) {
      res.send(processingErrorPage(result.error));
      return;
    }

    if (result.parsedReceipt) {
      res.send(reviewPage(result.parsedReceipt, encodedImages, combinedInstructions, receiptText));
      return;
    }

    res.send(processingErrorPage('Unknown error processing receipt'));
  } catch (error) {
    console.error('Error in postReprocess:', error);
    res.send(processingErrorPage('An error occurred. Please try again.'));
  }
}

// POST /upload/confirm - Send to receiver
export async function postConfirm(req: Request, res: Response): Promise<void> {
  const { receipt } = req.body;

  // Check for valid session
  if (!hasValidSession(req)) {
    res.send(passwordPage('Session expired. Please log in again.'));
    return;
  }

  try {
    const parsedReceipt: ParsedReceipt = JSON.parse(receipt);
    const summary = formatFinalSummary(parsedReceipt);

    // Send to receiver via Telegram
    try {
      await sendToReceiver(summary);
    } catch (telegramError) {
      console.error('Telegram send failed:', telegramError);
    }

    res.send(donePage(parsedReceipt));
  } catch (error) {
    console.error('Error in postConfirm:', error);
    res.send(processingErrorPage('Failed to process. Please try again.'));
  }
}
