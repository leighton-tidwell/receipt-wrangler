import { useState } from 'preact/hooks';
import { LoadingOverlay } from '@/shared/components/LoadingOverlay';
import { PageLayout } from '@/shared/components/ui/PageLayout';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';
import { ReceiptHeader } from '@/shared/components/receipt/ReceiptHeader';
import { CategoryBreakdownList } from '@/shared/components/receipt/CategoryBreakdownList';
import { ReceiptSummary } from '@/shared/components/receipt/ReceiptSummary';
import { CorrectionForm } from '@/shared/components/receipt/CorrectionForm';
import type { ParsedReceipt } from '@/shared/types';

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
  const [corrections, setCorrections] = useState('');

  let subtotal = 0;
  let totalFees = 0;
  let totalTax = 0;
  for (const key of Object.keys(receipt.categories)) {
    subtotal += receipt.categories[key].subtotal;
    totalFees += receipt.categories[key].fees || 0;
    totalTax += receipt.categories[key].tax;
  }
  const total = subtotal + totalFees + totalTax;

  const handleReprocess = () => {
    setIsProcessing(true);
  };

  const handleConfirm = () => {
    setIsSending(true);
  };

  return (
    <PageLayout>
      {(isProcessing || isSending) && (
        <LoadingOverlay
          message={isProcessing ? 'Reprocessing...' : 'Sending...'}
          submessage="Please wait"
        />
      )}

      <div class="flex items-center gap-3 mb-6 animate-fade-in">
        <a href="/upload" class="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Icon name="chevronLeft" class="w-6 h-6" />
        </a>
        <h1 class="text-xl font-bold text-slate-800">Review Breakdown</h1>
      </div>

      {error && (
        <Alert variant="error" class="mb-6 animate-fade-in">
          {error}
        </Alert>
      )}

      {(receipt.hasUnclearItems || receipt.hasMissingItems) && (
        <Alert variant="warning" class="mb-6 animate-fade-in">
          {receipt.hasUnclearItems && receipt.hasMissingItems ? (
            <p>
              <strong>Attention needed:</strong> Some items couldn't be read clearly, and there
              appear to be missing items from the receipt. Please review the "Unknown" category and
              provide corrections if needed.
            </p>
          ) : receipt.hasUnclearItems ? (
            <p>
              <strong>Unclear items detected:</strong> Some items couldn't be read clearly from the
              receipt. They've been added to the "Unknown" category. Please review and provide
              corrections if needed.
            </p>
          ) : (
            <p>
              <strong>Missing items detected:</strong> The itemized total doesn't match the receipt
              total. Missing items have been added to the "Unknown" category. Please review or
              provide additional receipt details.
            </p>
          )}
        </Alert>
      )}

      <ReceiptHeader storeName={receipt.storeName} date={receipt.date} />

      <CategoryBreakdownList categories={receipt.categories} variant="detailed" />

      <ReceiptSummary
        subtotal={subtotal}
        totalFees={totalFees}
        totalTax={totalTax}
        total={total}
        originalTotal={receipt.originalTotal}
      />

      <CorrectionForm
        imageData={imageData}
        previousInstructions={previousInstructions}
        receiptText={receiptText}
        corrections={corrections}
        onCorrectionsChange={setCorrections}
        onSubmit={handleReprocess}
        isProcessing={isProcessing}
      />

      <form
        method="POST"
        action="/upload/confirm"
        onSubmit={handleConfirm}
        class="animate-slide-up"
      >
        <input type="hidden" name="receipt" value={JSON.stringify(receipt)} />
        <Button type="submit" disabled={isSending}>
          <Icon name="check" />
          Confirm & Send
        </Button>
      </form>
    </PageLayout>
  );
}
