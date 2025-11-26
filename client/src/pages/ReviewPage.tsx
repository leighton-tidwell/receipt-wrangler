import { useState } from "preact/hooks";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { CategoryIcon } from "../components/CategoryIcon";
import { formatMoney, getCategoryLabel } from "../utils";
import type { ParsedReceipt } from "../types";

interface ReviewPageProps {
  receipt: ParsedReceipt;
  imageData: string[];
  previousInstructions?: string;
  receiptText?: string;
  error?: string;
}

export function ReviewPage({
  receipt,
  imageData,
  previousInstructions,
  receiptText,
  error,
}: ReviewPageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [corrections, setCorrections] = useState("");

  let subtotal = 0;
  let totalTax = 0;
  for (const key of Object.keys(receipt.categories)) {
    subtotal += receipt.categories[key].subtotal;
    totalTax += receipt.categories[key].tax;
  }
  const total = subtotal + totalTax;
  const hasMismatch = Math.abs(total - receipt.originalTotal) > 1;

  const handleReprocess = () => {
    setIsProcessing(true);
  };

  const handleConfirm = () => {
    setIsSending(true);
  };

  return (
    <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8">
      {(isProcessing || isSending) && (
        <LoadingOverlay
          message={isProcessing ? "Reprocessing..." : "Sending..."}
          submessage="Please wait"
        />
      )}

      <div class="max-w-lg mx-auto">
        <div class="flex items-center gap-3 mb-6 animate-fade-in">
          <a
            href="/upload"
            class="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </a>
          <h1 class="text-xl font-bold text-slate-800">Review Breakdown</h1>
        </div>

        {error && (
          <div class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
            <div class="flex items-start gap-3">
              <svg
                class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p class="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-4 animate-slide-up">
          <div class="flex items-center justify-between mb-1">
            <h2 class="font-semibold text-slate-800">{receipt.storeName}</h2>
            <span class="text-sm text-slate-400">{receipt.date}</span>
          </div>
        </div>

        <div class="space-y-3 mb-6">
          {Object.entries(receipt.categories)
            .filter(([_, breakdown]) => breakdown.items.length > 0)
            .map(([key, breakdown]) => (
              <div
                key={key}
                class="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in"
              >
                <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-primary-500">
                      <CategoryIcon category={key} />
                    </span>
                    <span class="font-semibold text-slate-700">
                      {getCategoryLabel(key)}
                    </span>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-slate-800">
                      {formatMoney(breakdown.total)}
                    </span>
                    {breakdown.tax > 0 && (
                      <span class="text-slate-400 text-xs ml-1">
                        (+{formatMoney(breakdown.tax)} tax)
                      </span>
                    )}
                  </div>
                </div>
                <div class="px-4 py-2">
                  {breakdown.items.map((item, i) => (
                    <div
                      key={i}
                      class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0"
                    >
                      <span class="text-slate-600 text-sm">
                        {item.name}
                        {item.taxable && (
                          <span class="ml-1 text-xs text-slate-400">*</span>
                        )}
                      </span>
                      <span class="text-slate-800 font-medium text-sm">
                        {formatMoney(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 animate-slide-up">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Subtotal</span>
              <span class="text-slate-700">{formatMoney(subtotal)}</span>
            </div>
            {totalTax > 0 && (
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Tax</span>
                <span class="text-slate-700">{formatMoney(totalTax)}</span>
              </div>
            )}
            <div class="flex justify-between pt-2 border-t border-slate-100">
              <span class="font-semibold text-slate-800">Total</span>
              <span class="font-bold text-slate-800 text-lg">
                {formatMoney(total)}
              </span>
            </div>
            {hasMismatch && (
              <div class="flex justify-between text-sm pt-2">
                <span class="text-amber-600">Original Receipt</span>
                <span class="text-amber-600 font-medium">
                  {formatMoney(receipt.originalTotal)}
                </span>
              </div>
            )}
          </div>
          {totalTax > 0 && (
            <p class="text-xs text-slate-400 mt-3">* Taxable items</p>
          )}
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-4 animate-slide-up">
          <h3 class="font-semibold text-slate-700 mb-3">Need corrections?</h3>
          <form
            method="POST"
            action="/upload/reprocess"
            onSubmit={handleReprocess}
          >
            {imageData.map((img, i) => (
              <input key={i} type="hidden" name={`imageData${i}`} value={img} />
            ))}
            <input
              type="hidden"
              name="imageCount"
              value={imageData.length.toString()}
            />
            <input
              type="hidden"
              name="previousInstructions"
              value={previousInstructions || ""}
            />
            <input type="hidden" name="receiptText" value={receiptText || ""} />
            <textarea
              name="corrections"
              value={corrections}
              onInput={(e) =>
                setCorrections((e.target as HTMLTextAreaElement).value)
              }
              rows={2}
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all resize-none text-sm mb-3 outline-none"
              placeholder="e.g., Move apples to baby supplies"
            />
            <button
              type="submit"
              disabled={isProcessing}
              class="w-full py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium rounded-xl transition-all disabled:opacity-50"
            >
              Reprocess with Corrections
            </button>
          </form>
        </div>

        <form
          method="POST"
          action="/upload/confirm"
          onSubmit={handleConfirm}
          class="animate-slide-up"
        >
          <input type="hidden" name="receipt" value={JSON.stringify(receipt)} />
          <button
            type="submit"
            disabled={isSending}
            class="w-full py-4 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50"
          >
            <span class="flex items-center justify-center gap-2">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Confirm & Send
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
