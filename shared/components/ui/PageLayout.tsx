import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentChildren } from 'preact';

import { cn } from '@/shared/lib/cn';

const layoutVariants = cva(
  'min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8 sm:py-12',
  {
    variants: {
      centered: {
        true: 'flex items-center justify-center',
        false: '',
      },
    },
    defaultVariants: {
      centered: false,
    },
  }
);

const innerVariants = cva('', {
  variants: {
    maxWidth: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
    },
    centered: {
      true: 'w-full',
      false: 'mx-auto',
    },
  },
  defaultVariants: {
    maxWidth: 'lg',
    centered: false,
  },
});

type PageLayoutProps = VariantProps<typeof layoutVariants> &
  VariantProps<typeof innerVariants> & {
    children: ComponentChildren;
    class?: string;
  };

export function PageLayout({ children, centered, maxWidth, class: className }: PageLayoutProps) {
  return (
    <div class={cn(layoutVariants({ centered }), className)}>
      <div class={innerVariants({ maxWidth, centered })}>{children}</div>
    </div>
  );
}
