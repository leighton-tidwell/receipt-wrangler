import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentChildren } from 'preact';

import { cn } from '@/shared/lib/cn';

const cardVariants = cva('bg-white rounded-2xl shadow-sm border border-slate-200', {
  variants: {
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    padding: 'lg',
  },
});

type CardProps = VariantProps<typeof cardVariants> & {
  children: ComponentChildren;
  class?: string;
};

export function Card({ children, class: className, padding }: CardProps) {
  return <div class={cn(cardVariants({ padding }), className)}>{children}</div>;
}

interface CardHeaderProps {
  children: ComponentChildren;
  class?: string;
}

export function CardHeader({ children, class: className }: CardHeaderProps) {
  return (
    <div class={cn('px-5 py-4 bg-slate-50 border-b border-slate-200', className)}>{children}</div>
  );
}

interface CardContentProps {
  children: ComponentChildren;
  class?: string;
}

export function CardContent({ children, class: className }: CardContentProps) {
  return <div class={cn('px-5 py-3', className)}>{children}</div>;
}

interface CardFooterProps {
  children: ComponentChildren;
  class?: string;
}

export function CardFooter({ children, class: className }: CardFooterProps) {
  return (
    <div class={cn('px-5 py-4 bg-slate-50 border-t border-slate-200', className)}>{children}</div>
  );
}
