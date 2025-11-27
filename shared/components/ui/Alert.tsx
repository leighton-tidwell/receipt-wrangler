import type { ComponentChildren } from "preact";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { Icon } from "./Icon";

const alertContainer = cva("p-4 border rounded-xl", {
  variants: {
    variant: {
      error: "bg-red-50 border-red-100",
      warning: "bg-amber-50 border-amber-200",
      info: "bg-blue-50 border-blue-100",
      success: "bg-green-50 border-green-100",
    },
  },
  defaultVariants: {
    variant: "error",
  },
});

const alertIcon = cva("w-5 h-5 flex-shrink-0 mt-0.5", {
  variants: {
    variant: {
      error: "text-red-500",
      warning: "text-amber-500",
      info: "text-blue-500",
      success: "text-green-500",
    },
  },
  defaultVariants: {
    variant: "error",
  },
});

const alertText = cva("text-sm", {
  variants: {
    variant: {
      error: "text-red-700",
      warning: "text-amber-800",
      info: "text-blue-700",
      success: "text-green-700",
    },
  },
  defaultVariants: {
    variant: "error",
  },
});

const variantIcons = {
  error: "error",
  warning: "warning",
  info: "info",
  success: "check",
} as const;

type AlertProps = VariantProps<typeof alertContainer> & {
  children: ComponentChildren;
  class?: string;
};

export function Alert({ variant, children, class: className }: AlertProps) {
  const iconName = variantIcons[variant ?? "error"];

  return (
    <div class={cn(alertContainer({ variant }), className)}>
      <div class="flex items-start gap-3">
        <Icon name={iconName} class={alertIcon({ variant })} />
        <div class={alertText({ variant })}>{children}</div>
      </div>
    </div>
  );
}
