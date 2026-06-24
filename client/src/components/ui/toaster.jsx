import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto rounded-md border bg-background p-3 shadow-md",
            item.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              {item.title ? <p className="break-words text-sm font-semibold">{item.title}</p> : null}
              {item.description ? <p className="break-words text-xs">{item.description}</p> : null}
            </div>
            <button type="button" className="shrink-0 text-xs text-muted-foreground" onClick={() => dismiss(item.id)}>
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
