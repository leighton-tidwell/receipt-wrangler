import express from "express";
import { config } from "./config.js";
import { handleIncomingSms } from "./twilio/webhook.js";

const app = express();

// Parse URL-encoded bodies (Twilio sends form data)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Twilio webhook endpoint
app.post("/webhook/sms", handleIncomingSms);

// Start server
app.listen(config.port, () => {
  console.log(`Receipt Wrangler running on port ${config.port}`);
  console.log(`Webhook URL: http://localhost:${config.port}/webhook/sms`);
  console.log(`Listening for messages from: ${config.wifePhoneNumber}`);
  console.log(`Will send summaries to: ${config.husbandPhoneNumber}`);
});
