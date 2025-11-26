import twilio from "twilio";
import { config } from "../config.js";

const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

export async function sendSms(to: string, body: string): Promise<void> {
  await client.messages.create({
    body,
    from: config.twilioPhoneNumber,
    to,
  });
}

export async function sendToWife(body: string): Promise<void> {
  console.log(`[SMS -> Wife] ${body.substring(0, 50)}...`);
  await sendSms(config.wifePhoneNumber, body);
}

export async function sendToHusband(body: string): Promise<void> {
  console.log(`[SMS -> Husband] ${body.substring(0, 50)}...`);
  await sendSms(config.husbandPhoneNumber, body);
}
