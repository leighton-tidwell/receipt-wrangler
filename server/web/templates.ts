import type { ParsedReceipt } from '@/server/state/conversation.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { renderAppToString } from '@/server/web/ssr.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface PageData {
  page: 'password' | 'upload' | 'review' | 'done' | 'error';
  error?: string;
  receipt?: ParsedReceipt;
  imageData?: string[];
  previousInstructions?: string;
  receiptText?: string;
}

function getDevHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Receipt Wrangler</title>
    <link rel="stylesheet" href="http://localhost:5173/src/index.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="http://localhost:5173/@vite/client"></script>
    <script type="module" src="http://localhost:5173/src/main.tsx"></script>
  </body>
</html>`;
}

function getClientHtml(): string {
  // In development, always use dev HTML with Vite HMR
  if (process.env.NODE_ENV !== 'production') {
    return getDevHtml();
  }

  // In production, read the built client index.html
  const clientDistPath = join(__dirname, '../../dist/client/index.html');

  if (existsSync(clientDistPath)) {
    return readFileSync(clientDistPath, 'utf-8');
  }

  // Fallback to dev HTML if no build exists
  return getDevHtml();
}

function renderPage(pageData: PageData): string {
  let html = getClientHtml();

  // Inject page data before the closing </head> tag for client hydration
  const pageDataScript = `<script>window.__PAGE_DATA__ = ${JSON.stringify(pageData)};</script>`;
  html = html.replace('</head>', `${pageDataScript}</head>`);

  // SSR: Pre-render the app HTML on the server (both dev and production)
  const appHtml = renderAppToString(pageData);
  html = html.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`);

  return html;
}

export function passwordPage(error?: string): string {
  return renderPage({
    page: 'password',
    error,
  });
}

export function uploadPage(error?: string): string {
  return renderPage({
    page: 'upload',
    error,
  });
}

export function reviewPage(
  receipt: ParsedReceipt,
  imageData: string[],
  previousInstructions?: string,
  receiptText?: string,
  error?: string
): string {
  return renderPage({
    page: 'review',
    receipt,
    imageData,
    previousInstructions,
    receiptText,
    error,
  });
}

export function donePage(receipt: ParsedReceipt): string {
  return renderPage({
    page: 'done',
    receipt,
  });
}

export function processingErrorPage(error: string): string {
  return renderPage({
    page: 'error',
    error,
  });
}
