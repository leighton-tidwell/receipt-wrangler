import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  // Twilio
  twilioAccountSid: requireEnv('TWILIO_ACCOUNT_SID'),
  twilioAuthToken: requireEnv('TWILIO_AUTH_TOKEN'),
  twilioPhoneNumber: requireEnv('TWILIO_PHONE_NUMBER'),

  // Phone numbers
  senderPhoneNumber: requireEnv('SENDER_PHONE_NUMBER'),
  receiverPhoneNumber: requireEnv('RECEIVER_PHONE_NUMBER'),
  twilioVirtualNumber: process.env.TWILIO_VIRTUAL_NUMBER || null,

  // OpenAI
  openaiApiKey: requireEnv('OPENAI_API_KEY'),

  // Web upload
  uploadPassword: requireEnv('UPLOAD_PASSWORD'),

  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;
