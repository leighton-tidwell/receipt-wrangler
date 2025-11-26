import type { ParsedReceipt, CategoryBreakdown } from "../state/conversation.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCategoryLabel(key: string): string {
  const labels: Record<string, string> = {
    groceries: "GROCERIES",
    babySupplies: "BABY SUPPLIES",
    bathroomSupplies: "BATHROOM SUPPLIES",
    houseSupplies: "HOUSE SUPPLIES",
    pharmacy: "PHARMACY",
    charity: "CHARITY",
  };
  if (labels[key]) return labels[key];
  return key.replace(/([A-Z])/g, " $1").trim().toUpperCase();
}

const STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: #f5f5f5;
  }
  .card {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  }
  h1 { margin-top: 0; color: #333; }
  h2 { color: #555; margin-top: 24px; }
  label { display: block; margin-bottom: 8px; font-weight: 500; }
  input[type="password"], input[type="file"], textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 16px;
  }
  textarea { min-height: 80px; resize: vertical; }
  button {
    background: #4CAF50;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    margin-right: 8px;
  }
  button:hover { background: #45a049; }
  button.secondary {
    background: #666;
  }
  button.secondary:hover { background: #555; }
  .error {
    background: #ffebee;
    color: #c62828;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 16px;
  }
  .success {
    background: #e8f5e9;
    color: #2e7d32;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 16px;
  }
  .category {
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 12px;
  }
  .category-header {
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  .item {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    color: #666;
  }
  .totals {
    border-top: 2px solid #333;
    margin-top: 16px;
    padding-top: 16px;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-weight: 500;
  }
  .store-header {
    font-size: 1.2em;
    color: #333;
    margin-bottom: 16px;
  }
`;

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function uploadPage(error?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt Wrangler - Upload</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="card">
    <h1>Receipt Wrangler</h1>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST" action="/upload" enctype="multipart/form-data">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required>

      <label for="images">Receipt Image(s) (optional if pasting text below)</label>
      <input type="file" id="images" name="images" accept="image/*" multiple>

      <label for="receiptText">Or paste receipt text</label>
      <textarea id="receiptText" name="receiptText" placeholder="Paste receipt text here..."></textarea>

      <label for="instructions">Instructions (optional)</label>
      <textarea id="instructions" name="instructions" placeholder="e.g., Put the apples under baby supplies"></textarea>

      <button type="submit">Process Receipt</button>
    </form>
  </div>
</body>
</html>`;
}

function renderCategory(name: string, breakdown: CategoryBreakdown): string {
  if (breakdown.items.length === 0) return "";

  const header =
    breakdown.tax > 0
      ? `${name} (${formatMoney(breakdown.subtotal)} + ${formatMoney(breakdown.tax)} tax = ${formatMoney(breakdown.total)})`
      : `${name} (${formatMoney(breakdown.total)})`;

  const items = breakdown.items
    .map((item) => `<div class="item"><span>${item.name}</span><span>${formatMoney(item.price)}</span></div>`)
    .join("");

  return `<div class="category">
    <div class="category-header">${header}</div>
    ${items}
  </div>`;
}

export function reviewPage(
  receipt: ParsedReceipt,
  password: string,
  imageData: string[], // base64 encoded images
  previousInstructions?: string,
  receiptText?: string,
  error?: string
): string {
  // Render all categories from the receipt (handles default + custom)
  const categoryHtml = Object.entries(receipt.categories)
    .map(([key, breakdown]) => renderCategory(getCategoryLabel(key), breakdown))
    .filter(Boolean)
    .join("");

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;
  for (const key of Object.keys(receipt.categories) as Array<keyof typeof receipt.categories>) {
    subtotal += receipt.categories[key].subtotal;
    totalTax += receipt.categories[key].tax;
  }
  const total = subtotal + totalTax;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt Wrangler - Review</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="card">
    <h1>Review Breakdown</h1>
    ${error ? `<div class="error">${error}</div>` : ""}

    <div class="store-header">${receipt.storeName} - ${receipt.date}</div>

    ${categoryHtml}

    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
      ${totalTax > 0 ? `<div class="total-row"><span>Tax</span><span>${formatMoney(totalTax)}</span></div>` : ""}
      <div class="total-row"><span><strong>Total</strong></span><span><strong>${formatMoney(total)}</strong></span></div>
      ${Math.abs(total - receipt.originalTotal) > 1 ? `<div class="total-row" style="color: #f57c00;"><span>Original Receipt</span><span>${formatMoney(receipt.originalTotal)}</span></div>` : ""}
    </div>
  </div>

  <div class="card">
    <h2 style="margin-top: 0;">Make Corrections</h2>
    <form method="POST" action="/upload/reprocess">
      ${imageData.map((img, i) => `<input type="hidden" name="imageData${i}" value="${escapeHtml(img)}">`).join("")}
      <input type="hidden" name="imageCount" value="${imageData.length}">
      <input type="hidden" name="previousInstructions" value="${escapeHtml(previousInstructions || "")}">
      <input type="hidden" name="receiptText" value="${escapeHtml(receiptText || "")}">

      <label for="corrections">Any corrections?</label>
      <textarea id="corrections" name="corrections" placeholder="e.g., Move apples to baby supplies, the soap should be bathroom supplies"></textarea>

      <button type="submit" class="secondary">Reprocess</button>
    </form>
  </div>

  <div class="card">
    <h2 style="margin-top: 0;">Confirm &amp; Send</h2>
    <p>This will send the summary to the budget.</p>
    <form method="POST" action="/upload/confirm">
      <input type="hidden" name="receipt" value="${escapeHtml(JSON.stringify(receipt))}">

      <button type="submit">Confirm &amp; Send</button>
    </form>
  </div>
</body>
</html>`;
}

export function donePage(receipt: ParsedReceipt): string {
  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;
  for (const key of Object.keys(receipt.categories) as Array<keyof typeof receipt.categories>) {
    subtotal += receipt.categories[key].subtotal;
    totalTax += receipt.categories[key].tax;
  }
  const total = subtotal + totalTax;

  // Build plain text summary for copy/paste
  const summaryLines: string[] = [`${receipt.storeName} - ${receipt.date}`, ""];

  const categoryLabels: Record<string, string> = {
    groceries: "Groceries",
    babySupplies: "Baby Supplies",
    bathroomSupplies: "Bathroom Supplies",
    houseSupplies: "House Supplies",
    pharmacy: "Pharmacy",
    charity: "Charity",
  };

  function getDonePageLabel(key: string): string {
    if (categoryLabels[key]) return categoryLabels[key];
    // Convert camelCase to Title Case
    return key.replace(/([A-Z])/g, " $1").trim().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  for (const [key, breakdown] of Object.entries(receipt.categories)) {
    if (breakdown.items.length === 0) continue;
    const label = getDonePageLabel(key);
    if (breakdown.tax > 0) {
      summaryLines.push(`${label}: ${formatMoney(breakdown.subtotal)} (+${formatMoney(breakdown.tax)} tax)`);
    } else {
      summaryLines.push(`${label}: ${formatMoney(breakdown.total)}`);
    }
  }

  summaryLines.push("");
  summaryLines.push(`Total: ${formatMoney(total)}`);

  const summaryText = summaryLines.join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt Wrangler - Done</title>
  <style>${STYLES}
    .summary-box {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 16px;
      font-family: monospace;
      white-space: pre-wrap;
      margin-bottom: 16px;
    }
    .copy-btn {
      background: #2196F3;
      margin-bottom: 16px;
    }
    .copy-btn:hover { background: #1976D2; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Done!</h1>
    <div class="success">The breakdown has been sent to the budget.</div>

    <h2>Summary (copy or screenshot)</h2>
    <div class="summary-box" id="summary">${summaryText}</div>
    <button class="copy-btn" onclick="copyToClipboard()">Copy to Clipboard</button>

    <a href="/upload"><button>Process Another Receipt</button></a>
  </div>

  <script>
    function copyToClipboard() {
      const text = document.getElementById('summary').innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy to Clipboard', 2000);
      });
    }
  </script>
</body>
</html>`;
}

export function processingErrorPage(error: string, password: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt Wrangler - Error</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="card">
    <h1>Processing Error</h1>
    <div class="error">${error}</div>
    <a href="/upload"><button>Try Again</button></a>
  </div>
</body>
</html>`;
}
