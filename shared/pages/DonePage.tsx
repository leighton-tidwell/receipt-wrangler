import { useState } from 'preact/hooks';
import { PageLayout } from '@/shared/components/ui/PageLayout';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Card, CardHeader, CardFooter } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { CategoryBreakdownList } from '@/shared/components/receipt/CategoryBreakdownList';
import { formatMoney, getCategoryLabel } from '@/shared/utils';
import type { ParsedReceipt } from '@/shared/types';

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
    const lines: string[] = [`${receipt.storeName} - ${receipt.date}`, ''];

    for (const [key, breakdown] of Object.entries(receipt.categories)) {
      if (breakdown.items.length === 0) continue;
      const label = getCategoryLabel(key);
      const fees = breakdown.fees || 0;
      const extras = breakdown.tax + fees;
      if (extras > 0) {
        const extrasLabel = fees > 0 ? 'tax/fees' : 'tax';
        lines.push(
          `${label}: ${formatMoney(breakdown.total)} (incl. ${formatMoney(extras)} ${extrasLabel})`
        );
      } else {
        lines.push(`${label}: ${formatMoney(breakdown.total)}`);
      }
    }

    lines.push('');
    lines.push(`Total: ${formatMoney(total)}`);

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

      <Card padding="none" class="mb-4 animate-slide-up overflow-hidden">
        <CardHeader>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-800">{receipt.storeName}</h2>
            <span class="text-sm text-slate-400">{receipt.date}</span>
          </div>
        </CardHeader>
        <CategoryBreakdownList categories={receipt.categories} variant="compact" />
        <CardFooter>
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-800">Total</span>
            <span class="font-bold text-slate-800 text-xl">{formatMoney(total)}</span>
          </div>
        </CardFooter>
      </Card>

      <div class="flex gap-3 animate-slide-up stagger-1">
        <Button
          variant="outline"
          size="md"
          onClick={copyToClipboard}
          class="flex-1"
          fullWidth={false}
        >
          <Icon name={copied ? 'check' : 'copy'} class={copied ? 'text-primary-500' : ''} />
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
