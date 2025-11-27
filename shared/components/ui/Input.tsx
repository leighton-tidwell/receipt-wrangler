import { cva, type VariantProps } from 'class-variance-authority';
import type { InputHTMLAttributes } from 'preact';

import { cn } from '@/shared/lib/cn';

const inputVariants = cva(
  [
    'w-full px-4 py-3 bg-slate-50 border rounded-xl',
    'text-slate-800 placeholder-slate-400',
    'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
    'transition-all outline-none',
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

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'class'> &
  VariantProps<typeof inputVariants> & {
    label?: string;
    error?: string;
    class?: string;
  };

export function Input({ label, error, class: className, ...props }: InputProps) {
  return (
    <div class="w-full">
      {label && <label class="mb-2 block text-sm font-medium text-slate-700">{label}</label>}
      <input class={cn(inputVariants({ hasError: !!error }), className)} {...props} />
      {error && <p class="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
