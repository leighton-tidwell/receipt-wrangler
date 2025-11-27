import { config } from '@/server/config.js';

const TELEGRAM_API = `https://api.telegram.org/bot${config.telegramBotToken}`;

export async function sendMessage(chatId: string, text: string): Promise<void> {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Failed to send Telegram message: ${error}`);
    throw new Error(`Telegram API error: ${response.status}`);
  }
}

export async function sendToSender(chatId: string, text: string): Promise<void> {
  console.log(`[TG -> ${chatId}] ${text}`);
  await sendMessage(chatId, text);
}

export async function sendToReceiver(text: string): Promise<void> {
  console.log(`[TG -> Receiver] ${text}`);
  await sendMessage(config.receiverChatId, text);
}

export async function getFileUrl(fileId: string): Promise<string> {
  const response = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  if (!response.ok) {
    throw new Error(`Failed to get file: ${response.status}`);
  }

  const data = (await response.json()) as { ok: boolean; result: { file_path: string } };
  if (!data.ok) {
    throw new Error('Failed to get file path from Telegram');
  }

  return `https://api.telegram.org/file/bot${config.telegramBotToken}/${data.result.file_path}`;
}
