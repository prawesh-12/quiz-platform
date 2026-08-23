import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-border-input)] bg-[var(--ds-bg-card)] px-3 py-2 text-[14px] text-[var(--ds-text-secondary)] placeholder:text-[var(--ds-text-muted)] focus-visible:border-[var(--ds-accent)] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
