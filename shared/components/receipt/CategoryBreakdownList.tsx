import { CategoryIcon } from '@/shared/components/CategoryIcon';
import { cn } from '@/shared/lib/cn';
import type { CategoryAdjustment } from '@/shared/lib/creditDistribution';
import type { CategoryBreakdown } from '@/shared/types';
import { formatMoney, getCategoryLabel } from '@/shared/utils';

interface CategoryBreakdownListProps {
  categories: Record<string, CategoryBreakdown>;
  variant?: 'detailed' | 'compact';
  adjustments?: Record<string, CategoryAdjustment>;
}

export function CategoryBreakdownList({
  categories,
  variant = 'detailed',
  adjustments,
}: CategoryBreakdownListProps) {
  const filteredCategories = Object.entries(categories).filter(
    ([_, breakdown]) => breakdown.items.length > 0
  );

  if (variant === 'compact') {
    return (
      <div class="px-5 py-3">
        {filteredCategories.map(([key, breakdown]) => {
          const adjustment = adjustments?.[key];
          const hasCredit = adjustment && adjustment.creditApplied > 0;

          return (
            <div
              key={key}
              class="flex items-center justify-between border-b border-slate-100 py-2 last:border-0"
            >
              <div class="flex items-center gap-2">
                <span class="text-primary-500">
                  <CategoryIcon category={key} />
                </span>
                <span class="text-sm text-slate-600">{getCategoryLabel(key)}</span>
              </div>
              <div class="text-right">
                <span class="font-medium text-slate-800">{formatMoney(breakdown.total)}</span>
                {(breakdown.tax > 0 || (breakdown.fees || 0) > 0) && (
                  <span class="ml-1 text-xs text-slate-400">
                    (incl. {formatMoney(breakdown.tax + (breakdown.fees || 0))}{' '}
                    {(breakdown.fees || 0) > 0 ? 'tax/fees' : 'tax'})
                  </span>
                )}
                {hasCredit && (
                  <span class="ml-1 text-xs font-medium text-emerald-600">
                    (paid {formatMoney(adjustment.outOfPocket)})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div class="mb-6 space-y-3">
      {filteredCategories.map(([key, breakdown]) => {
        const fees = breakdown.fees || 0;
        const extras = breakdown.tax + fees;
        const adjustment = adjustments?.[key];
        const hasCredit = adjustment && adjustment.creditApplied > 0;

        return (
          <div
            key={key}
            class="animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="text-primary-500">
                  <CategoryIcon category={key} />
                </span>
                <span class="font-semibold text-slate-700">{getCategoryLabel(key)}</span>
              </div>
              <div class="text-right">
                <span class="font-bold text-slate-800">{formatMoney(breakdown.total)}</span>
                {extras > 0 && (
                  <span class="ml-1 text-xs text-slate-400">
                    (+{formatMoney(extras)} {fees > 0 ? 'tax/fees' : 'tax'})
                  </span>
                )}
              </div>
            </div>
            <div class="px-4 py-2">
              {breakdown.items.map((item, i) => (
                <div
                  key={i}
                  class={cn(
                    'flex items-center justify-between border-b border-slate-100 py-2 last:border-0',
                    item.unclear && '-mx-4 bg-amber-50 px-4'
                  )}
                >
                  <span
                    class={cn('text-sm', item.unclear ? 'italic text-amber-700' : 'text-slate-600')}
                  >
                    {item.name}
                    {item.taxable && <span class="ml-1 text-xs text-slate-400">*</span>}
                    {item.unclear && <span class="ml-1 text-xs text-amber-500">(unclear)</span>}
                  </span>
                  <span
                    class={cn(
                      'text-sm font-medium',
                      item.unclear ? 'text-amber-700' : 'text-slate-800'
                    )}
                  >
                    {formatMoney(item.price)}
                  </span>
                </div>
              ))}
              {hasCredit && (
                <div class="-mx-4 border-t-2 border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-emerald-700">
                      Credit Applied: -{formatMoney(adjustment.creditApplied)}
                    </span>
                    <div class="text-right">
                      <span class="text-xs text-slate-500">Out of Pocket</span>
                      <span class="ml-2 text-lg font-bold text-emerald-700">
                        {formatMoney(adjustment.outOfPocket)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
