import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--ds-radius-md)] text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-transparent bg-[var(--ds-bg-cta)] text-[var(--ds-text-white)] hover:opacity-95",
        destructive:
          "border border-transparent bg-destructive text-destructive-foreground hover:opacity-95",
        outline:
          "border border-[var(--ds-border-input)] bg-[var(--ds-bg-card)] text-[var(--ds-text-secondary)] hover:bg-[var(--ds-bg-card-hover)]",
        secondary:
          "border border-transparent bg-[var(--ds-bg-muted)] text-[var(--ds-text-secondary)] hover:bg-[var(--ds-bg-card-hover)]",
        ghost: "border border-transparent bg-transparent text-[var(--ds-text-secondary)] hover:bg-[var(--ds-bg-card-hover)]",
        link: "text-[var(--ds-accent)] underline-offset-4 hover:underline"
      },
      size: {
        default: "h-[38px] px-4",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-10 px-8",
        icon: "h-[38px] w-[38px] p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
