import type { ParsedReceipt } from "../state/conversation.js";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface PageData {
  page: "upload" | "review" | "done" | "error";
  error?: string;
  receipt?: ParsedReceipt;
  imageData?: string[];
  previousInstructions?: string;
  receiptText?: string;
}

function escapeForScript(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

function getClientHtml(): string {
  // Try to read the built client index.html
  const clientDistPath = join(__dirname, "../../dist/client/index.html");

  if (existsSync(clientDistPath)) {
    return readFileSync(clientDistPath, "utf-8");
  }

  // Fallback for development - serve a simple HTML that loads from Vite dev server
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>Receipt Wrangler</title>
  </head>
  <body>
    <div id="app"></div>
    <script>
      // Development mode: redirect to Vite dev server if not loaded from there
      if (!window.__VITE_DEV__) {
        console.log('Loading from Vite dev server...');
      }
    </script>
    <script type="module" src="http://localhost:5173/src/main.tsx"></script>
  </body>
</html>`;
}

function renderPage(pageData: PageData): string {
  let html = getClientHtml();

  // Inject page data before the closing </head> tag
  const pageDataScript = `<script>window.__PAGE_DATA__ = ${JSON.stringify(pageData)};</script>`;

  // Insert the script before </head>
  html = html.replace("</head>", `${pageDataScript}</head>`);

  return html;
}

export function uploadPage(error?: string): string {
  return renderPage({
    page: "upload",
    error,
  });
}

export function reviewPage(
  receipt: ParsedReceipt,
  password: string,
  imageData: string[],
  previousInstructions?: string,
  receiptText?: string,
  error?: string
): string {
  return renderPage({
    page: "review",
    receipt,
    imageData,
    previousInstructions,
    receiptText,
    error,
  });
}

export function donePage(receipt: ParsedReceipt): string {
  return renderPage({
    page: "done",
    receipt,
  });
}

export function processingErrorPage(error: string, password: string): string {
  return renderPage({
    page: "error",
    error,
  });
}
