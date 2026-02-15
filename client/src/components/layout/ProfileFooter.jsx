import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function ProfileFooter({ user, onLogout, onOpenProfile }) {
  const initials = (user?.name || "T")
    .split(" ")
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
      <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => onOpenProfile?.()}>
        <Avatar>
          <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "Teacher"} />
          <AvatarFallback>{initials || "T"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user?.name || "Teacher"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
        </div>
      </button>
      <Button type="button" variant="outline" size="sm" onClick={onLogout}>
        Logout
      </Button>
    </div>
  );
}
