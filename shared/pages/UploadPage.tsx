import { useState } from 'preact/hooks';
import { LoadingOverlay } from '@/shared/components/LoadingOverlay';
import { PageLayout } from '@/shared/components/ui/PageLayout';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Card } from '@/shared/components/ui/Card';
import { TextArea } from '@/shared/components/ui/TextArea';
import { Button } from '@/shared/components/ui/Button';
import { Alert } from '@/shared/components/ui/Alert';
import { Icon } from '@/shared/components/ui/Icon';
import { FileDropZone } from '@/shared/components/upload/FileDropZone';
import { cn } from '@/shared/lib/cn';

type UploadMode = 'image' | 'receipt';

interface UploadPageProps {
  error?: string;
}

export function UploadPage({ error }: UploadPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [receiptText, setReceiptText] = useState('');
  const [instructions, setInstructions] = useState('');
  const [mode, setMode] = useState<UploadMode>('image');

  const handleSubmit = (e: Event) => {
    const hasValidInput =
      mode === 'image' ? selectedFiles.length > 0 : receiptText.trim().length > 0;
    if (!hasValidInput) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
  };

  return (
    <PageLayout>
      {isLoading && (
        <LoadingOverlay message="Processing receipt..." submessage="This may take a moment" />
      )}

      <PageHeader
        icon="receipt"
        title="Receipt Wrangler"
        subtitle="Categorize your receipts with AI"
      />

      {error && (
        <Alert variant="error" class="mb-6 animate-fade-in">
          {error}
        </Alert>
      )}

      <form
        method="POST"
        action="/upload"
        enctype="multipart/form-data"
        onSubmit={handleSubmit}
        class="space-y-6"
      >
        <Card class="animate-slide-up">
          <label class="block text-sm font-medium text-slate-700 mb-3">Upload Type</label>
          <div class="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('image')}
              class={cn(
                'flex-1 py-1.5 px-3 rounded-md font-medium text-sm transition-all',
                mode === 'image'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Icon name="image" class="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
              Image
            </button>
            <button
              type="button"
              onClick={() => setMode('receipt')}
              class={cn(
                'flex-1 py-1.5 px-3 rounded-md font-medium text-sm transition-all',
                mode === 'receipt'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Icon name="receipt" class="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
              Text
            </button>
          </div>
        </Card>

        {mode === 'image' ? (
          <Card class="animate-slide-up stagger-1">
            <label class="block text-sm font-medium text-slate-700 mb-2">Receipt Image(s)</label>
            <FileDropZone
              files={selectedFiles}
              onFilesChange={setSelectedFiles}
              dragActive={dragActive}
              onDragActiveChange={setDragActive}
            />
          </Card>
        ) : (
          <Card class="animate-slide-up stagger-1">
            <TextArea
              label="Receipt Text"
              name="receiptText"
              value={receiptText}
              onInput={(e) => setReceiptText((e.target as HTMLTextAreaElement).value)}
              rows={6}
              placeholder="Paste or type your receipt text here..."
            />
          </Card>
        )}

        <Card class="animate-slide-up stagger-2">
          <TextArea
            label="Instructions"
            optional
            name="instructions"
            value={instructions}
            onInput={(e) => setInstructions((e.target as HTMLTextAreaElement).value)}
            rows={2}
            placeholder="e.g., Put the apples under baby supplies"
          />
        </Card>

        <Button type="submit" disabled={isLoading} class="animate-slide-up">
          <Icon name="arrowRight" />
          Process Receipt
        </Button>
      </form>
    </PageLayout>
  );
}
