import { useState, useRef } from "preact/hooks";
import { LoadingOverlay } from "../components/LoadingOverlay";

interface UploadPageProps {
  error?: string;
}

export function UploadPage({ error }: UploadPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [receiptText, setReceiptText] = useState("");
  const [instructions, setInstructions] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        [...selectedFiles, ...newFiles].forEach((f) => dt.items.add(f));
        fileInputRef.current.files = dt.files;
      }
    }
  };

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      setSelectedFiles(Array.from(input.files));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      newFiles.forEach((f) => dt.items.add(f));
      fileInputRef.current.files = dt.files;
    }
  };

  const handleSubmit = (e: Event) => {
    if (selectedFiles.length === 0 && !receiptText.trim()) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
  };

  return (
    <div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8 sm:py-12">
      {isLoading && (
        <LoadingOverlay
          message="Processing receipt..."
          submessage="This may take a moment"
        />
      )}

      <div class="max-w-lg mx-auto">
        <div class="text-center mb-8 animate-fade-in">
          <div class="w-16 h-16 bg-primary-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg
              class="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-800">Receipt Wrangler</h1>
          <p class="text-slate-500 mt-1">Categorize your receipts with AI</p>
        </div>
        {error && (
          <div class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
            <div class="flex items-start gap-3">
              <svg
                class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p class="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
        <form
          method="POST"
          action="/upload"
          enctype="multipart/form-data"
          onSubmit={handleSubmit}
          class="space-y-6"
        >
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-slide-up">
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Receipt Image(s)
            </label>
            <div
              class={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                name="images"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                class="hidden"
              />
              <svg
                class="w-10 h-10 text-slate-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p class="text-slate-500 text-sm">
                Tap to select or drag images here
              </p>
              <p class="text-slate-400 text-xs mt-1">
                PNG, JPG up to 10MB each
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div class="mt-4 space-y-2">
                {selectedFiles.map((file, i) => (
                  <div
                    key={i}
                    class="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <svg
                        class="w-5 h-5 text-primary-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span class="text-sm text-slate-600 truncate">
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      class="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-slide-up stagger-1">
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Or Paste Receipt Text
            </label>
            <textarea
              name="receiptText"
              value={receiptText}
              onInput={(e) =>
                setReceiptText((e.target as HTMLTextAreaElement).value)
              }
              rows={4}
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none outline-none"
              placeholder="Paste receipt text here..."
            />
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-slide-up stagger-2">
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Instructions{" "}
              <span class="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="instructions"
              value={instructions}
              onInput={(e) =>
                setInstructions((e.target as HTMLTextAreaElement).value)
              }
              rows={2}
              class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none outline-none"
              placeholder="e.g., Put the apples under baby supplies"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            class="w-full py-4 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-slide-up"
          >
            <span class="flex items-center justify-center gap-2">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Process Receipt
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
