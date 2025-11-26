import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  // Twilio
  twilioAccountSid: requireEnv("TWILIO_ACCOUNT_SID"),
  twilioAuthToken: requireEnv("TWILIO_AUTH_TOKEN"),
  twilioPhoneNumber: requireEnv("TWILIO_PHONE_NUMBER"),

  // Phone numbers
  wifePhoneNumber: requireEnv("WIFE_PHONE_NUMBER"),
  husbandPhoneNumber: requireEnv("HUSBAND_PHONE_NUMBER"),

  // OpenAI
  openaiApiKey: requireEnv("OPENAI_API_KEY"),

  // Server
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
} as const;
