import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-[var(--ds-radius-full)] bg-[var(--ds-bg-muted)]", className)}>
      <div className="h-full bg-[var(--ds-bg-cta)] transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
