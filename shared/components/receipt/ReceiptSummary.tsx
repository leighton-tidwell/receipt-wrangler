import { Card } from '@/shared/components/ui/Card';
import { formatMoney } from '@/shared/utils';

interface ReceiptSummaryProps {
  subtotal: number;
  totalFees: number;
  totalTax: number;
  total: number;
  originalTotal?: number;
  showTaxNote?: boolean;
}

export function ReceiptSummary({
  subtotal,
  totalFees,
  totalTax,
  total,
  originalTotal,
  showTaxNote = true,
}: ReceiptSummaryProps) {
  const hasMismatch = originalTotal !== undefined && Math.abs(total - originalTotal) > 1;

  return (
    <Card padding="md" class="mb-6 animate-slide-up">
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
        <div class="flex justify-between pt-2 border-t border-slate-100">
          <span class="font-semibold text-slate-800">Total</span>
          <span class="font-bold text-slate-800 text-lg">{formatMoney(total)}</span>
        </div>
        {hasMismatch && (
          <div class="flex justify-between text-sm pt-2">
            <span class="text-amber-600">Original Receipt</span>
            <span class="text-amber-600 font-medium">{formatMoney(originalTotal)}</span>
          </div>
        )}
      </div>
      {showTaxNote && totalTax > 0 && <p class="text-xs text-slate-400 mt-3">* Taxable items</p>}
    </Card>
  );
}
