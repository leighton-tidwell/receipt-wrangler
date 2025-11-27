import type { TextareaHTMLAttributes } from 'preact';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn';

const textareaVariants = cva(
  [
    'w-full px-4 py-3 bg-slate-50 border rounded-xl',
    'text-slate-800 placeholder-slate-400',
    'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
    'transition-all resize-none outline-none',
  ],
  {
    variants: {
      hasError: {
        true: 'border-red-300',
        false: 'border-slate-200',
      },
    },
    defaultVariants: {
      hasError: false,
    },
  }
);

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'class'> &
  VariantProps<typeof textareaVariants> & {
    label?: string;
    optional?: boolean;
    error?: string;
    class?: string;
  };

export function TextArea({ label, optional, error, class: className, ...props }: TextAreaProps) {
  return (
    <div class="w-full">
      {label && (
        <label class="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {optional && <span class="text-slate-400 font-normal"> (optional)</span>}
        </label>
      )}
      <textarea class={cn(textareaVariants({ hasError: !!error }), className)} {...props} />
      {error && <p class="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
