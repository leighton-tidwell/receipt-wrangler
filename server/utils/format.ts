import type { CategoryBreakdown, ParsedReceipt } from '@/server/state/conversation.js';

const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'GROCERIES',
  babySupplies: 'BABY SUPPLIES',
  bathroomSupplies: 'BATHROOM SUPPLIES',
  houseSupplies: 'HOUSE SUPPLIES',
  pharmacy: 'PHARMACY',
  charity: 'CHARITY',
  unknown: 'UNKNOWN',
};

function getCategoryLabel(key: string): string {
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  // Convert camelCase to TITLE CASE for custom categories
  return key
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toUpperCase();
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatCategoryDetail(label: string, breakdown: CategoryBreakdown): string {
  if (breakdown.items.length === 0) return '';

  const lines: string[] = [];

  if (breakdown.tax > 0) {
    lines.push(
      `${label} (${formatMoney(breakdown.subtotal)} + ${formatMoney(breakdown.tax)} tax = ${formatMoney(breakdown.total)})`
    );
  } else {
    lines.push(`${label} (${formatMoney(breakdown.total)})`);
  }

  for (const item of breakdown.items) {
    lines.push(`- ${item.name} ${formatMoney(item.price)}`);
  }

  return lines.join('\n');
}

export function formatConfirmationMessage(receipt: ParsedReceipt): string {
  const lines: string[] = ["Here's the breakdown - reply YES to confirm:", ''];

  for (const [key, breakdown] of Object.entries(receipt.categories)) {
    const label = getCategoryLabel(key);
    const formatted = formatCategoryDetail(label, breakdown);
    if (formatted) {
      lines.push(formatted);
      lines.push('');
    }
  }

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;
  for (const breakdown of Object.values(receipt.categories)) {
    subtotal += breakdown.subtotal;
    totalTax += breakdown.tax;
  }
  const total = subtotal + totalTax;

  lines.push(`Subtotal: ${formatMoney(subtotal)}`);
  if (totalTax > 0) {
    lines.push(`Tax: ${formatMoney(totalTax)}`);
  }

  // Show gift card deduction if present
  if (receipt.giftCardAmount && receipt.giftCardAmount > 0) {
    lines.push(`Gift Card: -${formatMoney(receipt.giftCardAmount)}`);
  }
  lines.push(`Total: ${formatMoney(total)}`);

  // Verify against original (only when no gift card)
  if (!receipt.giftCardAmount && Math.abs(total - receipt.originalTotal) > 1) {
    lines.push('');
    lines.push(`(Note: Original receipt total was ${formatMoney(receipt.originalTotal)})`);
  }

  return lines.join('\n');
}

export function formatFinalSummary(receipt: ParsedReceipt): string {
  const lines: string[] = [`${receipt.storeName} - ${receipt.date}`, ''];

  for (const [key, breakdown] of Object.entries(receipt.categories)) {
    if (breakdown.items.length === 0) continue;

    const label = getCategoryLabel(key);
    if (breakdown.tax > 0) {
      lines.push(
        `${label}: ${formatMoney(breakdown.subtotal)} (+${formatMoney(breakdown.tax)} tax)`
      );
    } else {
      lines.push(`${label}: ${formatMoney(breakdown.total)}`);
    }
  }

  // Calculate total
  let total = 0;
  for (const breakdown of Object.values(receipt.categories)) {
    total += breakdown.total;
  }

  lines.push('');

  // Show gift card deduction if present
  if (receipt.giftCardAmount && receipt.giftCardAmount > 0) {
    lines.push(`Gift Card: -${formatMoney(receipt.giftCardAmount)}`);
  }
  lines.push(`Total: ${formatMoney(total)}`);

  return lines.join('\n');
}
