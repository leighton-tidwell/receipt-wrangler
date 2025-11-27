import { Card } from '@/shared/components/ui/Card';

interface ReceiptHeaderProps {
  storeName: string;
  date: string;
}

export function ReceiptHeader({ storeName, date }: ReceiptHeaderProps) {
  return (
    <Card padding="md" class="animate-slide-up mb-4">
      <div class="mb-1 flex items-center justify-between">
        <h2 class="font-semibold text-slate-800">{storeName}</h2>
        <span class="text-sm text-slate-400">{date}</span>
      </div>
    </Card>
  );
}
