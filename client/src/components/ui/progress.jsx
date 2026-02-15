import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div className="h-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
