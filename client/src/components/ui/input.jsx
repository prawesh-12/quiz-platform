import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-[38px] w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-border-input)] bg-[var(--ds-bg-card)] px-3 text-[14px] text-[var(--ds-text-secondary)] transition-colors file:border-0 file:bg-transparent file:text-[14px] file:font-medium placeholder:text-[var(--ds-text-muted)] focus-visible:border-[var(--ds-accent)] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
