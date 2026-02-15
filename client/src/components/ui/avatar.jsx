import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }) {
  return <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />;
}

export function AvatarImage({ className, src, alt }) {
  return <img className={cn("aspect-square h-full w-full", className)} src={src} alt={alt} />;
}

export function AvatarFallback({ className, ...props }) {
  return <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)} {...props} />;
}
