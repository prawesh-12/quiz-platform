import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({ value, onValueChange, children }) {
  const [currentValue, setCurrentValue] = React.useState(value ?? "");

  React.useEffect(() => {
    setCurrentValue(value ?? "");
  }, [value]);

  return (
    <select
      value={currentValue}
      onChange={(event) => {
        setCurrentValue(event.target.value);
        onValueChange?.(event.target.value);
      }}
      className="flex h-[38px] w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-border-input)] bg-[var(--ds-bg-card)] px-3 text-[14px] text-[var(--ds-text-secondary)] focus-visible:border-[var(--ds-bg-cta)] focus-visible:outline-none focus-visible:ring-0"
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ className, children }) {
  return <div className={cn(className)}>{children}</div>;
}

export function SelectValue({ placeholder }) {
  return <option value="">{placeholder}</option>;
}

export function SelectContent({ children }) {
  return children;
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
