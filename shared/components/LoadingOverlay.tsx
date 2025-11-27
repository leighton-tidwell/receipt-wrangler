interface LoadingOverlayProps {
  message?: string;
  submessage?: string;
}

export function LoadingOverlay({
  message = 'Processing...',
  submessage = 'Please wait',
}: LoadingOverlayProps) {
  return (
    <div class="fixed inset-0 bg-white/80 loading-overlay z-50 flex items-center justify-center">
      <div class="text-center">
        <div class="w-16 h-16 mx-auto mb-4">
          <svg class="animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p class="text-slate-600 font-medium">{message}</p>
        <p class="text-slate-400 text-sm mt-1">{submessage}</p>
      </div>
    </div>
  );
}
