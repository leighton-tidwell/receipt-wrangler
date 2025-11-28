import { Card } from '@/shared/components/ui/Card';
import { formatMoney } from '@/shared/utils';

interface ReceiptSummaryProps {
  subtotal: number;
  totalFees: number;
  totalTax: number;
  total: number;
  originalTotal?: number;
  giftCardAmount?: number;
  showTaxNote?: boolean;
}

export function ReceiptSummary({
  subtotal,
  totalFees,
  totalTax,
  total,
  originalTotal,
  giftCardAmount,
  showTaxNote = true,
}: ReceiptSummaryProps) {
  const hasGiftCard = giftCardAmount !== undefined && giftCardAmount > 0;
  const hasMismatch =
    !hasGiftCard && originalTotal !== undefined && Math.abs(total - originalTotal) > 1;

  return (
    <Card padding="md" class="animate-slide-up mb-6">
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-slate-500">Subtotal</span>
          <span class="text-slate-700">{formatMoney(subtotal)}</span>
        </div>
        {totalFees > 0 && (
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Fees</span>
            <span class="text-slate-700">{formatMoney(totalFees)}</span>
          </div>
        )}
        {totalTax > 0 && (
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Tax</span>
            <span class="text-slate-700">{formatMoney(totalTax)}</span>
          </div>
        )}
        {hasGiftCard && (
          <>
            <div class="flex justify-between border-t border-slate-100 pt-2 text-sm">
              <span class="text-slate-500">Subtotal</span>
              <span class="text-slate-700">{formatMoney(originalTotal!)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-emerald-600">Gift Card</span>
              <span class="text-emerald-600">-{formatMoney(giftCardAmount!)}</span>
            </div>
          </>
        )}
        <div
          class={`flex justify-between ${hasGiftCard ? 'pt-2' : 'border-t border-slate-100 pt-2'}`}
        >
          <span class="font-semibold text-slate-800">Total</span>
          <span class="text-lg font-bold text-slate-800">{formatMoney(total)}</span>
        </div>
        {hasMismatch && (
          <div class="flex justify-between pt-2 text-sm">
            <span class="text-amber-600">Original Receipt</span>
            <span class="font-medium text-amber-600">{formatMoney(originalTotal)}</span>
          </div>
        )}
      </div>
      {showTaxNote && totalTax > 0 && <p class="mt-3 text-xs text-slate-400">* Taxable items</p>}
    </Card>
  );
}
