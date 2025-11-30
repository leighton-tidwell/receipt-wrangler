import type { CategoryBreakdown, CreditInfo } from '@/shared/types';

export interface CategoryAdjustment {
  originalTotal: number;
  creditApplied: number;
  outOfPocket: number;
}

export function calculateCreditDistribution(
  categories: Record<string, CategoryBreakdown>,
  credit: CreditInfo | undefined
): Record<string, CategoryAdjustment> {
  const result: Record<string, CategoryAdjustment> = {};

  if (!credit || credit.amount === 0) {
    for (const [key, breakdown] of Object.entries(categories)) {
      if (breakdown.items.length === 0) continue;
      result[key] = {
        originalTotal: breakdown.total,
        creditApplied: 0,
        outOfPocket: breakdown.total,
      };
    }
    return result;
  }

  const { amount, targetCategory } = credit;
  const filteredCategories = Object.entries(categories).filter(
    ([_, breakdown]) => breakdown.items.length > 0
  );

  if (targetCategory && categories[targetCategory]) {
    const targetBreakdown = categories[targetCategory];
    const appliedToTarget = Math.min(amount, targetBreakdown.total);
    const remainingCredit = amount - appliedToTarget;

    // First apply to target category
    result[targetCategory] = {
      originalTotal: targetBreakdown.total,
      creditApplied: appliedToTarget,
      outOfPocket: Math.max(0, targetBreakdown.total - appliedToTarget),
    };

    // If there's leftover credit, distribute proportionally to other categories
    if (remainingCredit > 0) {
      const otherCategories = filteredCategories.filter(([key]) => key !== targetCategory);
      const otherTotal = otherCategories.reduce((sum, [_, cat]) => sum + cat.total, 0);

      for (const [key, breakdown] of otherCategories) {
        const proportion = otherTotal > 0 ? breakdown.total / otherTotal : 0;
        const applied = Math.round(remainingCredit * proportion);
        result[key] = {
          originalTotal: breakdown.total,
          creditApplied: applied,
          outOfPocket: Math.max(0, breakdown.total - applied),
        };
      }
    } else {
      // No leftover, other categories get no credit
      for (const [key, breakdown] of filteredCategories) {
        if (key !== targetCategory) {
          result[key] = {
            originalTotal: breakdown.total,
            creditApplied: 0,
            outOfPocket: breakdown.total,
          };
        }
      }
    }
  } else {
    const grandTotal = filteredCategories.reduce((sum, [_, cat]) => sum + cat.total, 0);

    for (const [key, breakdown] of filteredCategories) {
      const proportion = grandTotal > 0 ? breakdown.total / grandTotal : 0;
      const applied = Math.round(amount * proportion);
      result[key] = {
        originalTotal: breakdown.total,
        creditApplied: applied,
        outOfPocket: Math.max(0, breakdown.total - applied),
      };
    }
  }

  return result;
}
