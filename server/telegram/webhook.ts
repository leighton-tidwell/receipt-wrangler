import { Command } from '@langchain/langgraph';
import type { Request, Response } from 'express';

import { config } from '@/server/config.js';
import { receiptGraph } from '@/server/graph/index.js';
import type { ParsedReceipt } from '@/server/state/conversation.js';
import {
  answerCallbackQuery,
  getFileUrl,
  type InlineButton,
  sendToSender,
} from '@/server/telegram/send.js';
import { formatConfirmationMessage } from '@/server/utils/format.js';

interface TelegramPhoto {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

interface TelegramMessage {
  message_id: number;
  from?: { id: number; first_name: string; username?: string };
  chat: { id: number; type: string };
  text?: string;
  photo?: TelegramPhoto[];
  caption?: string;
  media_group_id?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: { id: number; first_name: string };
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

const threadConfig = (chatId: string) => ({ configurable: { thread_id: `tg:${chatId}` } });

/**
 * In-flight flag per chat. Prevents concurrent graph invocations from the same
 * chat racing each other (e.g., a media_group dumping 5 photos in 200 ms).
 */
const inflight = new Map<string, Promise<unknown>>();

async function runSerial<T>(chatId: string, fn: () => Promise<T>): Promise<T> {
  const prev = inflight.get(chatId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  inflight.set(
    chatId,
    next.catch(() => {})
  );
  return next;
}

/** Resume or start the graph, then surface any pending interrupt to Telegram. */
async function driveGraph(
  chatId: string,
  input: Parameters<typeof receiptGraph.invoke>[0]
): Promise<void> {
  const cfg = threadConfig(chatId);
  try {
    await receiptGraph.invoke(input, cfg);
  } catch (err) {
    console.error('[graph] invoke error:', err);
    await sendToSender(chatId, 'Sorry, something went wrong processing that.');
    return;
  }

  const snapshot = await receiptGraph.getState(cfg);
  const interrupts = (snapshot.tasks ?? []).flatMap((t) => t.interrupts ?? []);

  if (interrupts.length === 0) {
    // Graph finished; reset for next receipt by clearing the thread via a no-op start.
    return;
  }

  const payload = interrupts[0].value as InterruptPayload;
  await surfaceInterrupt(chatId, payload);
}

type InterruptPayload =
  | {
      type: 'collect_images';
      imageCount: number;
      prompt: string;
      actions: { id: string; label: string; disabled?: boolean }[];
    }
  | {
      type: 'confirm_receipt';
      parsedReceipt: ParsedReceipt;
      prompt: string;
      actions: { id: string; label: string }[];
    };

async function surfaceInterrupt(chatId: string, payload: InterruptPayload): Promise<void> {
  if (payload.type === 'collect_images') {
    const buttons: InlineButton[][] = [
      payload.actions
        .filter((a) => !a.disabled)
        .map((a) => ({ text: a.label, callback_data: `collect:${a.id}` })),
    ];
    await sendToSender(chatId, payload.prompt, buttons.flat().length ? buttons : undefined);
    return;
  }

  if (payload.type === 'confirm_receipt') {
    const msg = formatConfirmationMessage(payload.parsedReceipt);
    const buttons: InlineButton[][] = [
      payload.actions.map((a) => ({ text: a.label, callback_data: `confirm:${a.id}` })),
    ];
    await sendToSender(chatId, msg, buttons);
  }
}

export async function handleTelegramWebhook(req: Request, res: Response): Promise<void> {
  const update = req.body as TelegramUpdate;
  res.status(200).json({ ok: true });

  try {
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }
    if (update.message) {
      await handleMessage(update.message);
    }
  } catch (err) {
    console.error('[webhook] error:', err);
  }
}

async function handleMessage(message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id.toString();
  const text = message.text?.trim() || message.caption?.trim() || '';

  const authorizedChatIds = [config.senderChatId, config.receiverChatId].filter(Boolean);
  if (!authorizedChatIds.includes(chatId)) {
    console.log(`[webhook] ignoring unauthorized chat: ${chatId}`);
    return;
  }

  const photoFileIds: string[] = [];
  if (message.photo && message.photo.length > 0) {
    photoFileIds.push(message.photo[message.photo.length - 1].file_id);
  }

  console.log(`[TG <- ${chatId}] "${text}" (${photoFileIds.length} images)`);

  if (photoFileIds.length > 0) {
    const urls = await Promise.all(photoFileIds.map(getFileUrl));
    await runSerial(chatId, () => onPhotos(chatId, urls, text || null));
    return;
  }

  if (!text) {
    await sendToSender(chatId, 'Send me a receipt photo or paste the receipt text!');
    return;
  }

  // Text-only path
  await runSerial(chatId, () => onText(chatId, text));
}

async function onPhotos(
  chatId: string,
  imageUrls: string[],
  caption: string | null
): Promise<void> {
  const cfg = threadConfig(chatId);
  const snapshot = await receiptGraph.getState(cfg);
  const hasActiveThread = !!snapshot.next && snapshot.next.length > 0;

  if (!hasActiveThread) {
    // Fresh thread
    await driveGraph(chatId, {
      channel: 'telegram',
      chatId,
      pendingImages: imageUrls,
      userGuidance: caption,
    });
    return;
  }

  // Active thread: must be mid-collection. Resume with additional images.
  await driveGraph(
    chatId,
    new Command({
      resume: { addImages: imageUrls, guidance: caption ?? undefined },
    })
  );
}

async function onText(chatId: string, text: string): Promise<void> {
  const cfg = threadConfig(chatId);
  const snapshot = await receiptGraph.getState(cfg);
  const hasActiveThread = !!snapshot.next && snapshot.next.length > 0;

  if (!hasActiveThread) {
    // Treat as text-only receipt — skip collect_images by setting textContent.
    await driveGraph(chatId, {
      channel: 'telegram',
      chatId,
      textContent: text,
    });
    return;
  }

  // Active thread: figure out which interrupt is pending.
  const interrupts = (snapshot.tasks ?? []).flatMap((t) => t.interrupts ?? []);
  const pending = interrupts[0]?.value as InterruptPayload | undefined;

  if (pending?.type === 'collect_images') {
    // Interpret free text as additional guidance — keep collecting.
    await driveGraph(chatId, new Command({ resume: { guidance: text } }));
    await sendToSender(chatId, 'Got your note. Send more or tap Done.');
    return;
  }

  if (pending?.type === 'confirm_receipt') {
    // Free text during confirmation is treated as edit corrections.
    await driveGraph(chatId, new Command({ resume: { decision: 'edit', corrections: text } }));
    return;
  }

  await sendToSender(chatId, 'Still working — hang tight.');
}

async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  const data = query.data ?? '';
  const chatId = query.message?.chat.id.toString();
  if (!chatId) return;

  await answerCallbackQuery(query.id);

  const [kind, action] = data.split(':');

  if (kind === 'collect') {
    if (action === 'done') {
      await runSerial(chatId, () => driveGraph(chatId, new Command({ resume: { done: true } })));
    } else if (action === 'cancel') {
      await runSerial(chatId, () => driveGraph(chatId, new Command({ resume: { cancel: true } })));
      await sendToSender(chatId, 'Cancelled.');
    }
    return;
  }

  if (kind === 'confirm') {
    if (action === 'approve') {
      await runSerial(chatId, () =>
        driveGraph(chatId, new Command({ resume: { decision: 'approve' } }))
      );
    } else if (action === 'reject') {
      await runSerial(chatId, () =>
        driveGraph(chatId, new Command({ resume: { decision: 'reject' } }))
      );
      await sendToSender(chatId, 'Rejected. Send a new receipt when ready.');
    } else if (action === 'edit') {
      await sendToSender(chatId, 'What should I change? Reply with the correction.');
    }
  }
}
