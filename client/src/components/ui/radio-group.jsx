import { cn } from "@/lib/utils";

export function RadioGroup({ value, onValueChange, className, children }) {
  return (
    <div className={cn("space-y-2", className)} data-value={value} data-on-value-change={Boolean(onValueChange)}>
      {children}
    </div>
  );
}

export function RadioGroupItem({ id, value, checked, onChange, className, disabled = false }) {
  return (
    <input
      id={id}
      type="radio"
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={cn("h-4 w-4", className)}
    />
  );
}
