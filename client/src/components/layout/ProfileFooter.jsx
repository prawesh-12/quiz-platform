import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function ProfileFooter({ user, onLogout, onOpenProfile }) {
  const initials = (user?.name || "T")
    .split(" ")
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 p-2 shadow-sm">
        <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => onOpenProfile?.()}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "Teacher"} />
            <AvatarFallback>{initials || "T"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.name || "Teacher"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
          </div>
        </button>
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
