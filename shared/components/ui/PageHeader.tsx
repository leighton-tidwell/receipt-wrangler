import type { ComponentChildren } from "preact";
import { cva, type VariantProps } from "class-variance-authority";
import { Icon, type IconName } from "./Icon";

const iconContainerVariants = cva(
  "mx-auto mb-4 flex items-center justify-center",
  {
    variants: {
      iconVariant: {
        primary:
          "w-16 h-16 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30",
        success:
          "w-20 h-20 rounded-full bg-primary-500 shadow-lg shadow-primary-500/30",
        error: "w-20 h-20 rounded-full bg-red-100",
      },
    },
    defaultVariants: {
      iconVariant: "primary",
    },
  }
);

const iconColorVariants = cva("", {
  variants: {
    iconVariant: {
      primary: "w-8 h-8 text-white",
      success: "w-10 h-10 text-white",
      error: "w-10 h-10 text-red-500",
    },
  },
  defaultVariants: {
    iconVariant: "primary",
  },
});

type PageHeaderProps = VariantProps<typeof iconContainerVariants> & {
  icon?: IconName;
  title: string;
  subtitle?: string;
  children?: ComponentChildren;
};

export function PageHeader({
  icon,
  iconVariant,
  title,
  subtitle,
  children,
}: PageHeaderProps) {
  return (
    <div class="text-center mb-8 animate-fade-in">
      {icon && (
        <div class={iconContainerVariants({ iconVariant })}>
          <Icon name={icon} class={iconColorVariants({ iconVariant })} />
        </div>
      )}
      <h1 class="text-2xl font-bold text-slate-800">{title}</h1>
      {subtitle && <p class="text-slate-500 mt-1">{subtitle}</p>}
      {children}
    </div>
  );
}
