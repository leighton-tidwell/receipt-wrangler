import { useRef } from 'preact/hooks';
import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';

interface FileDropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  dragActive: boolean;
  onDragActiveChange: (active: boolean) => void;
}

export function FileDropZone({
  files,
  onFilesChange,
  dragActive,
  onDragActiveChange,
}: FileDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      onDragActiveChange(true);
    } else if (e.type === 'dragleave') {
      onDragActiveChange(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragActiveChange(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      const updatedFiles = [...files, ...newFiles];
      onFilesChange(updatedFiles);
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        updatedFiles.forEach((f) => dt.items.add(f));
        fileInputRef.current.files = dt.files;
      }
    }
  };

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      onFilesChange(Array.from(input.files));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      newFiles.forEach((f) => dt.items.add(f));
      fileInputRef.current.files = dt.files;
    }
  };

  return (
    <>
      <div
        class={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-200 hover:border-slate-300'
        )}
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
        <Icon name="image" class="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p class="text-slate-500 text-sm">Tap to select or drag images here</p>
        <p class="text-slate-400 text-xs mt-1">PNG, JPG up to 10MB each</p>
      </div>

      {files.length > 0 && (
        <div class="mt-4 space-y-2">
          {files.map((file, i) => (
            <div key={i} class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div class="flex items-center gap-3 min-w-0">
                <Icon name="image" class="w-5 h-5 text-primary-500 flex-shrink-0" />
                <span class="text-sm text-slate-600 truncate">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                class="p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Icon name="x" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
