import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { theme } from "@/theme";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--ds-radius-full)] border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        outline: "",
        destructive: ""
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export function Badge({ className, variant, ...props }) {
  const tokenVariant = variant || "default";
  const styleMap = {
    default: {
      backgroundColor: theme.badge.teal.bg,
      color: theme.badge.teal.color,
      borderColor: "transparent",
    },
    secondary: {
      backgroundColor: theme.badge.gray.bg,
      color: theme.badge.gray.color,
      borderColor: "transparent",
    },
    outline: {
      backgroundColor: theme.bg.card,
      color: theme.text.secondary,
      borderColor: theme.border.input,
    },
    destructive: {
      backgroundColor: theme.badge.red.bg,
      color: theme.badge.red.color,
      borderColor: "transparent",
    },
  };

  return <div className={cn(badgeVariants({ variant }), className)} style={styleMap[tokenVariant]} {...props} />;
}
