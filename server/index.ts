import cookieParser from 'cookie-parser';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { config } from '@/server/config.js';
import { handleIncomingSms } from '@/server/twilio/webhook.js';
import {
  getUploadPage,
  postAuth,
  postConfirm,
  postReprocess,
  postUpload,
  uploadMiddleware,
} from '@/server/web/upload.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Parse URL-encoded bodies (Twilio sends form data)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Serve static files from /public (icons, manifest, etc.)
app.use(express.static(join(__dirname, '../public')));

// Serve static files from built client (JS, CSS, etc.)
app.use(
  express.static(join(__dirname, '../dist/client'), {
    index: false, // Don't serve index.html automatically - we handle routing
  })
);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Twilio webhook endpoint
app.post('/webhook/sms', handleIncomingSms);

// Web upload endpoints
app.get('/upload', getUploadPage);
app.post('/auth', postAuth);
app.post('/upload', uploadMiddleware, postUpload);
app.post('/upload/reprocess', postReprocess);
app.post('/upload/confirm', postConfirm);

// Start server
app.listen(config.port, () => {
  console.log(`Receipt Wrangler running on port ${config.port}`);
  console.log(`Webhook URL: http://localhost:${config.port}/webhook/sms`);
  console.log(`Upload URL: http://localhost:${config.port}/upload`);
  console.log(`Listening for messages from: ${config.senderPhoneNumber}`);
  console.log(`Will send summaries to: ${config.receiverPhoneNumber}`);
});
