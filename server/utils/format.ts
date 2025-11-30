import type { CategoryBreakdown, ParsedReceipt } from '@/server/state/conversation.js';
import { calculateCreditDistribution } from '@/shared/lib/creditDistribution.js';

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

interface CategoryAdjustment {
  creditApplied: number;
  outOfPocket: number;
}

function formatCategoryDetail(
  label: string,
  breakdown: CategoryBreakdown,
  adjustment?: CategoryAdjustment
): string {
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

  if (adjustment && adjustment.creditApplied > 0) {
    lines.push(
      `→ Credit: -${formatMoney(adjustment.creditApplied)}, Paid: ${formatMoney(adjustment.outOfPocket)}`
    );
  }

  return lines.join('\n');
}

export function formatConfirmationMessage(receipt: ParsedReceipt): string {
  const lines: string[] = ["Here's the breakdown - reply YES to confirm:", ''];

  // Calculate credit adjustments if credit was applied
  const adjustments = calculateCreditDistribution(receipt.categories, receipt.credit);

  for (const [key, breakdown] of Object.entries(receipt.categories)) {
    const label = getCategoryLabel(key);
    const adjustment = adjustments[key];
    const formatted = formatCategoryDetail(label, breakdown, adjustment);
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

  // Handle credit
  if (receipt.credit && receipt.credit.amount > 0) {
    lines.push(`Credit: -${formatMoney(receipt.credit.amount)}`);
    const outOfPocket = total - receipt.credit.amount;
    lines.push(`Total: ${formatMoney(outOfPocket)}`);
  } else {
    lines.push(`Total: ${formatMoney(total)}`);

    // Only show mismatch note when no credit (credit explains the difference)
    if (Math.abs(total - receipt.originalTotal) > 1) {
      lines.push('');
      lines.push(`(Note: Original receipt total was ${formatMoney(receipt.originalTotal)})`);
    }
  }

  return lines.join('\n');
}

export function formatFinalSummary(receipt: ParsedReceipt): string {
  const lines: string[] = [`${receipt.storeName} - ${receipt.date}`, ''];

  // Calculate credit adjustments if credit was applied
  const adjustments = calculateCreditDistribution(receipt.categories, receipt.credit);

  for (const [key, breakdown] of Object.entries(receipt.categories)) {
    if (breakdown.items.length === 0) continue;

    const label = getCategoryLabel(key);
    const adjustment = adjustments[key];
    const displayTotal = adjustment ? adjustment.outOfPocket : breakdown.total;

    lines.push(`${label}: ${formatMoney(displayTotal)}`);
  }

  // Calculate out-of-pocket total
  const outOfPocketTotal = Object.values(adjustments).reduce(
    (sum, adj) => sum + adj.outOfPocket,
    0
  );

  lines.push('');
  lines.push(`Total: ${formatMoney(outOfPocketTotal)}`);

  return lines.join('\n');
}
