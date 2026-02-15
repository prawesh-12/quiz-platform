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
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
