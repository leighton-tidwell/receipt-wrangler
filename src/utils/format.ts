import type { ParsedReceipt, CategoryBreakdown } from "../state/conversation.js";

const CATEGORY_LABELS: Record<string, string> = {
  groceries: "GROCERIES",
  babySupplies: "BABY SUPPLIES",
  bathroomSupplies: "BATHROOM SUPPLIES",
  houseSupplies: "HOUSE SUPPLIES",
  charity: "CHARITY",
};

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatCategoryDetail(
  label: string,
  breakdown: CategoryBreakdown
): string {
  if (breakdown.items.length === 0) return "";

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

  return lines.join("\n");
}

export function formatConfirmationMessage(receipt: ParsedReceipt): string {
  const lines: string[] = ["Here's the breakdown - reply YES to confirm:", ""];

  const categoryKeys = Object.keys(receipt.categories) as Array<
    keyof typeof receipt.categories
  >;

  for (const key of categoryKeys) {
    const breakdown = receipt.categories[key];
    const label = CATEGORY_LABELS[key];
    const formatted = formatCategoryDetail(label, breakdown);
    if (formatted) {
      lines.push(formatted);
      lines.push("");
    }
  }

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;
  for (const key of categoryKeys) {
    subtotal += receipt.categories[key].subtotal;
    totalTax += receipt.categories[key].tax;
  }
  const total = subtotal + totalTax;

  lines.push(`Subtotal: ${formatMoney(subtotal)}`);
  if (totalTax > 0) {
    lines.push(`Tax: ${formatMoney(totalTax)}`);
  }
  lines.push(`Total: ${formatMoney(total)}`);

  // Verify against original
  if (Math.abs(total - receipt.originalTotal) > 1) {
    lines.push("");
    lines.push(
      `(Note: Original receipt total was ${formatMoney(receipt.originalTotal)})`
    );
  }

  return lines.join("\n");
}

export function formatFinalSummary(receipt: ParsedReceipt): string {
  const lines: string[] = [`${receipt.storeName} - ${receipt.date}`, ""];

  const categoryKeys = Object.keys(receipt.categories) as Array<
    keyof typeof receipt.categories
  >;

  for (const key of categoryKeys) {
    const breakdown = receipt.categories[key];
    if (breakdown.items.length === 0) continue;

    const label = CATEGORY_LABELS[key];
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
  for (const key of categoryKeys) {
    total += receipt.categories[key].total;
  }

  lines.push("");
  lines.push(`Total: ${formatMoney(total)}`);

  return lines.join("\n");
}
