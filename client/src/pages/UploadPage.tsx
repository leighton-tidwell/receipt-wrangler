import { useState } from "preact/hooks";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PageLayout } from "../components/ui/PageLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { TextArea } from "../components/ui/TextArea";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Icon } from "../components/ui/Icon";
import { FileDropZone } from "../components/upload/FileDropZone";

interface UploadPageProps {
  error?: string;
}

export function UploadPage({ error }: UploadPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [receiptText, setReceiptText] = useState("");
  const [instructions, setInstructions] = useState("");

  const handleSubmit = (e: Event) => {
    if (selectedFiles.length === 0 && !receiptText.trim()) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
  };

  return (
    <PageLayout>
      {isLoading && (
        <LoadingOverlay
          message="Processing receipt..."
          submessage="This may take a moment"
        />
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
          <label class="block text-sm font-medium text-slate-700 mb-2">
            Receipt Image(s)
          </label>
          <FileDropZone
            files={selectedFiles}
            onFilesChange={setSelectedFiles}
            dragActive={dragActive}
            onDragActiveChange={setDragActive}
          />
        </Card>

        <Card class="animate-slide-up stagger-1">
          <TextArea
            label="Or Paste Receipt Text"
            name="receiptText"
            value={receiptText}
            onInput={(e) =>
              setReceiptText((e.target as HTMLTextAreaElement).value)
            }
            rows={4}
            placeholder="Paste receipt text here..."
          />
        </Card>

        <Card class="animate-slide-up stagger-2">
          <TextArea
            label="Instructions"
            optional
            name="instructions"
            value={instructions}
            onInput={(e) =>
              setInstructions((e.target as HTMLTextAreaElement).value)
            }
            rows={2}
            placeholder="e.g., Put the apples under baby supplies"
          />
        </Card>

        <Button
          type="submit"
          disabled={isLoading}
          class="animate-slide-up"
        >
          <Icon name="arrowRight" />
          Process Receipt
        </Button>
      </form>
    </PageLayout>
  );
}
