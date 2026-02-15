import { cn } from "@/lib/utils";

export function ScrollArea({ className, ...props }) {
  return <div className={cn("overflow-auto", className)} {...props} />;
}
