import { cn } from "@/lib/utils";

export function Switch({ checked, onCheckedChange, className, disabled = false, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={cn(
        "inline-flex h-6 w-11 items-center rounded-[var(--ds-radius-full)] border transition-colors",
        checked
          ? "border-[var(--ds-bg-cta)] bg-[var(--ds-bg-cta)]"
          : "border-[var(--ds-border-input)] bg-[var(--ds-bg-muted)]",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-[var(--ds-radius-full)] bg-[var(--ds-bg-card)] transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
