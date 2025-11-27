import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Check if Twilio is disabled
const disableTwilio = process.env.DISABLE_TWILIO === 'true';

export const config = {
  // Twilio
  disableTwilio,
  twilioAccountSid: disableTwilio ? '' : requireEnv('TWILIO_ACCOUNT_SID'),
  twilioAuthToken: disableTwilio ? '' : requireEnv('TWILIO_AUTH_TOKEN'),
  twilioPhoneNumber: disableTwilio ? '' : requireEnv('TWILIO_PHONE_NUMBER'),

  // Phone numbers
  senderPhoneNumber: disableTwilio ? '' : requireEnv('SENDER_PHONE_NUMBER'),
  receiverPhoneNumber: disableTwilio ? '' : requireEnv('RECEIVER_PHONE_NUMBER'),
  twilioVirtualNumber: process.env.TWILIO_VIRTUAL_NUMBER || null,

  // OpenAI
  openaiApiKey: requireEnv('OPENAI_API_KEY'),

  // Web upload
  uploadPassword: requireEnv('UPLOAD_PASSWORD'),

  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;
