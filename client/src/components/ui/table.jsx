import { cn } from "@/lib/utils";

export function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom border-collapse text-[13px]", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return (
    <thead
      className={cn(
        "bg-[var(--ds-bg-content)] text-[12px] text-[var(--ds-text-muted)] [&_tr]:h-10 [&_tr]:border-b [&_tr]:border-[var(--ds-border-default)]",
        className
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "h-[var(--ds-space-row-height)] border-b border-[var(--ds-border-light)] transition-colors hover:bg-[var(--ds-bg-card-hover)]",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn("h-10 px-3 text-left align-middle text-[12px] font-medium text-[var(--ds-text-muted)]", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return <td className={cn("px-3 py-2 align-middle text-[13px] text-[var(--ds-text-secondary)]", className)} {...props} />;
}
