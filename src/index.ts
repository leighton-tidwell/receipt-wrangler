import express from "express";
import { config } from "./config.js";
import { handleIncomingSms } from "./twilio/webhook.js";
import {
  getUploadPage,
  postUpload,
  postReprocess,
  postConfirm,
  uploadMiddleware,
} from "./web/upload.js";

const app = express();

// Parse URL-encoded bodies (Twilio sends form data)
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Twilio webhook endpoint
app.post("/webhook/sms", handleIncomingSms);

// Web upload endpoints
app.get("/upload", getUploadPage);
app.post("/upload", uploadMiddleware, postUpload);
app.post("/upload/reprocess", postReprocess);
app.post("/upload/confirm", postConfirm);

// Start server
app.listen(config.port, () => {
  console.log(`Receipt Wrangler running on port ${config.port}`);
  console.log(`Webhook URL: http://localhost:${config.port}/webhook/sms`);
  console.log(`Upload URL: http://localhost:${config.port}/upload`);
  console.log(`Listening for messages from: ${config.wifePhoneNumber}`);
  console.log(`Will send summaries to: ${config.husbandPhoneNumber}`);
});
