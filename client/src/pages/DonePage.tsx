import { useState } from "preact/hooks";
import { CategoryIcon } from "../components/CategoryIcon";
import { formatMoney, getCategoryLabel } from "../utils";
import type { ParsedReceipt } from "../types";

interface DonePageProps {
  receipt: ParsedReceipt;
}

export function DonePage({ receipt }: DonePageProps) {
  const [copied, setCopied] = useState(false);

  let subtotal = 0;
  let totalFees = 0;
  let totalTax = 0;
  for (const key of Object.keys(receipt.categories)) {
    subtotal += receipt.categories[key].subtotal;
    totalFees += receipt.categories[key].fees || 0;
    totalTax += receipt.categories[key].tax;
  }
  const total = subtotal + totalFees + totalTax;

  const buildSummaryText = () => {
    const lines: string[] = [`${receipt.storeName} - ${receipt.date}`, ""];

    for (const [key, breakdown] of Object.entries(receipt.categories)) {
      if (breakdown.items.length === 0) continue;
      const label = getCategoryLabel(key);
      const fees = breakdown.fees || 0;
      const extras = breakdown.tax + fees;
      if (extras > 0) {
        const extrasLabel = fees > 0 ? "tax/fees" : "tax";
        lines.push(
          `${label}: ${formatMoney(breakdown.total)} (incl. ${formatMoney(extras)} ${extrasLabel})`,
        );
      } else {
        lines.push(`${label}: ${formatMoney(breakdown.total)}`);
      }
    }

    lines.push("");
    lines.push(`Total: ${formatMoney(total)}`);

    return lines.join("\n");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(buildSummaryText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8">
      <div class="max-w-lg mx-auto">
        <div class="text-center mb-8 animate-fade-in">
          <div class="w-20 h-20 bg-primary-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg
              class="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-800">All Done!</h1>
          <p class="text-slate-500 mt-1">Receipt sent to budget</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4 animate-slide-up">
          <div class="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-slate-800">{receipt.storeName}</h2>
              <span class="text-sm text-slate-400">{receipt.date}</span>
            </div>
          </div>
          <div class="px-5 py-3">
            {Object.entries(receipt.categories)
              .filter(([_, breakdown]) => breakdown.items.length > 0)
              .map(([key, breakdown]) => (
                <div
                  key={key}
                  class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-primary-500">
                      <CategoryIcon category={key} />
                    </span>
                    <span class="text-slate-600 text-sm">
                      {getCategoryLabel(key)}
                    </span>
                  </div>
                  <div>
                    <span class="font-medium text-slate-800">
                      {formatMoney(breakdown.total)}
                    </span>
                    {(breakdown.tax > 0 || (breakdown.fees || 0) > 0) && (
                      <span class="text-slate-400 text-xs ml-1">
                        (incl. {formatMoney(breakdown.tax + (breakdown.fees || 0))}{" "}
                        {(breakdown.fees || 0) > 0 ? "tax/fees" : "tax"})
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <div class="px-5 py-4 bg-slate-50 border-t border-slate-200">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-800">Total</span>
              <span class="font-bold text-slate-800 text-xl">
                {formatMoney(total)}
              </span>
            </div>
          </div>
        </div>

        <div class="flex gap-3 animate-slide-up stagger-1">
          <button
            onClick={copyToClipboard}
            class="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <svg
                class="w-5 h-5 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
          <a href="/upload" class="flex-1">
            <button class="w-full py-3 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-medium rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Receipt
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
