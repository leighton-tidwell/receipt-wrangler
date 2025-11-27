import { Card } from '@/shared/components/ui/Card';
import { TextArea } from '@/shared/components/ui/TextArea';
import { Button } from '@/shared/components/ui/Button';

interface CorrectionFormProps {
  imageData: string[];
  previousInstructions?: string;
  receiptText?: string;
  corrections: string;
  onCorrectionsChange: (value: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export function CorrectionForm({
  imageData,
  previousInstructions,
  receiptText,
  corrections,
  onCorrectionsChange,
  onSubmit,
  isProcessing,
}: CorrectionFormProps) {
  return (
    <Card padding="md" class="mb-4 animate-slide-up">
      <h3 class="font-semibold text-slate-700 mb-3">Need corrections?</h3>
      <form method="POST" action="/upload/reprocess" onSubmit={onSubmit}>
        {imageData.map((img, i) => (
          <input key={i} type="hidden" name={`imageData${i}`} value={img} />
        ))}
        <input type="hidden" name="imageCount" value={imageData.length.toString()} />
        <input type="hidden" name="previousInstructions" value={previousInstructions || ''} />
        <input type="hidden" name="receiptText" value={receiptText || ''} />
        <TextArea
          name="corrections"
          value={corrections}
          onInput={(e) => onCorrectionsChange((e.target as HTMLTextAreaElement).value)}
          rows={2}
          placeholder="e.g., Move apples to baby supplies"
          class="mb-3 text-sm"
        />
        <Button type="submit" variant="secondary" size="md" disabled={isProcessing}>
          Reprocess with Corrections
        </Button>
      </form>
    </Card>
  );
}
