import twilio from 'twilio';
import { config } from '@/server/config.js';

const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

export async function sendSms(to: string, body: string): Promise<void> {
  await client.messages.create({
    body,
    from: config.twilioPhoneNumber,
    to,
  });
}

export async function sendToSender(to: string, body: string): Promise<void> {
  console.log(`[SMS -> ${to}] ${body}`);
  await sendSms(to, body);
}

export async function sendToReceiver(body: string): Promise<void> {
  console.log(`[SMS -> Receiver] ${body}`);
  await sendSms(config.receiverPhoneNumber, body);
}
