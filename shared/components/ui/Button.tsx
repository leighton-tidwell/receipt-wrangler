import type { ButtonHTMLAttributes, ComponentChildren } from "preact";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-lg shadow-primary-500/30",
        secondary:
          "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700",
        outline:
          "bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700",
      },
      size: {
        sm: "py-2 px-3 text-sm",
        md: "py-3 px-4",
        lg: "py-4 px-6 font-semibold",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
      fullWidth: true,
    },
  }
);

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> &
  VariantProps<typeof buttonVariants> & {
    children: ComponentChildren;
  };

export function Button({
  variant,
  size,
  fullWidth,
  children,
  class: className,
  ...props
}: ButtonProps) {
  return (
    <button
      class={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
