import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-extrabold transition-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "rounded-[var(--radius-pill)] bg-primary text-on-primary shadow-[0_4px_0_var(--primary-shadow),0_10px_20px_rgba(20,40,10,.22)] hover:-translate-y-px active:translate-y-0.5 active:shadow-[0_2px_0_var(--primary-shadow)]",
        ghost:
          "rounded-[var(--radius-pill)] border border-soft-border bg-soft text-on-glass hover:bg-pill",
        outline:
          "rounded-[var(--radius-pill)] border-2 border-line bg-transparent text-ink hover:bg-surface/60",
        ink: "rounded-[var(--radius-pill)] border-2 border-line bg-surface text-ink hover:bg-paper",
      },
      size: {
        default: "h-[52px] px-[26px] text-base",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "size-[46px] rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
