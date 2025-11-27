import { Card } from '../ui/Card';

interface ReceiptHeaderProps {
  storeName: string;
  date: string;
}

export function ReceiptHeader({ storeName, date }: ReceiptHeaderProps) {
  return (
    <Card padding="md" class="mb-4 animate-slide-up">
      <div class="flex items-center justify-between mb-1">
        <h2 class="font-semibold text-slate-800">{storeName}</h2>
        <span class="text-sm text-slate-400">{date}</span>
      </div>
    </Card>
  );
}
