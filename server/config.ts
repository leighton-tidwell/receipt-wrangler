import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  // Telegram
  telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  senderChatId: requireEnv('SENDER_CHAT_ID'),
  receiverChatId: requireEnv('RECEIVER_CHAT_ID'),

  // OpenAI
  openaiApiKey: requireEnv('OPENAI_API_KEY'),

  // Web upload
  uploadPassword: requireEnv('UPLOAD_PASSWORD'),

  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;
