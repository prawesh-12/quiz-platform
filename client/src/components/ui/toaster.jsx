import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto rounded-md border bg-background p-3 shadow-md",
            item.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              {item.title ? <p className="text-sm font-semibold">{item.title}</p> : null}
              {item.description ? <p className="text-xs">{item.description}</p> : null}
            </div>
            <button type="button" className="text-xs text-muted-foreground" onClick={() => dismiss(item.id)}>
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
