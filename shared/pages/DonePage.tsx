import { useState } from 'preact/hooks';

import { CategoryBreakdownList } from '@/shared/components/receipt/CategoryBreakdownList';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardFooter, CardHeader } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { PageLayout } from '@/shared/components/ui/PageLayout';
import { calculateCreditDistribution } from '@/shared/lib/creditDistribution';
import type { ParsedReceipt } from '@/shared/types';
import { formatMoney, getCategoryLabel } from '@/shared/utils';

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

  const adjustments = calculateCreditDistribution(receipt.categories, receipt.credit);
  const outOfPocketTotal = Object.values(adjustments).reduce(
    (sum, adj) => sum + adj.outOfPocket,
    0
  );

  const buildSummaryText = () => {
    const lines: string[] = [`${receipt.storeName} - ${receipt.date}`, ''];

    for (const [key, breakdown] of Object.entries(receipt.categories)) {
      if (breakdown.items.length === 0) continue;
      const label = getCategoryLabel(key);
      const fees = breakdown.fees || 0;
      const extras = breakdown.tax + fees;
      const adjustment = adjustments[key];
      const hasCredit = adjustment && adjustment.creditApplied > 0;

      let line = `${label}: ${formatMoney(breakdown.total)}`;
      if (extras > 0) {
        const extrasLabel = fees > 0 ? 'tax/fees' : 'tax';
        line += ` (incl. ${formatMoney(extras)} ${extrasLabel})`;
      }
      if (hasCredit) {
        line += ` [Credit: -${formatMoney(adjustment.creditApplied)} = ${formatMoney(adjustment.outOfPocket)}]`;
      }
      lines.push(line);
    }

    lines.push('');
    lines.push(`Total: ${formatMoney(total)}`);
    if (receipt.credit && receipt.credit.amount > 0) {
      lines.push(`Credit Applied: -${formatMoney(receipt.credit.amount)}`);
      lines.push(`Out of Pocket: ${formatMoney(outOfPocketTotal)}`);
    }

    return lines.join('\n');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(buildSummaryText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <PageLayout>
      <PageHeader
        icon="check"
        iconVariant="success"
        title="All Done!"
        subtitle="Receipt sent to budget"
      />

      <Card padding="none" class="animate-slide-up mb-4 overflow-hidden">
        <CardHeader>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-800">{receipt.storeName}</h2>
            <span class="text-sm text-slate-400">{receipt.date}</span>
          </div>
        </CardHeader>
        <CategoryBreakdownList
          categories={receipt.categories}
          variant="compact"
          adjustments={receipt.credit ? adjustments : undefined}
        />
        <CardFooter>
          <div class="space-y-1">
            {receipt.credit && receipt.credit.amount > 0 && (
              <div class="flex items-center justify-between text-sm">
                <span class="text-emerald-600">Credit</span>
                <span class="font-medium text-emerald-600">
                  -{formatMoney(receipt.credit.amount)}
                </span>
              </div>
            )}
            <div class="flex items-center justify-between border-t border-slate-100 pt-1">
              <span class="font-semibold text-slate-800">Total</span>
              <span class="text-xl font-bold text-slate-800">
                {formatMoney(receipt.credit ? outOfPocketTotal : total)}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>

      <div class="animate-slide-up stagger-1 flex gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={copyToClipboard}
          class="flex-1"
          fullWidth={false}
        >
          <Icon name={copied ? 'check' : 'copy'} />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        <a href="/upload" class="flex-1">
          <Button size="md">
            <Icon name="plus" />
            New Receipt
          </Button>
        </a>
      </div>
    </PageLayout>
  );
}
