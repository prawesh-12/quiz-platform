import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { theme } from "@/theme";

export default function ProfileFooter({ user, onLogout, onOpenProfile, compact = false }) {
  const initials = (user?.name || "T")
    .split(" ")
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");
  const username = user?.email ? `@${user.email.split("@")[0]}` : "@teacher";

  if (compact) {
    return (
      <div className="flex items-center justify-center">
        <button
          type="button"
          className="inline-flex items-center justify-center"
          onClick={() => onOpenProfile?.()}
          aria-label="Open profile"
        >
          <Avatar
            className="h-7 w-7"
            style={{ border: `1px solid ${theme.border.input}`, borderRadius: theme.radius.full }}
          >
            <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "Teacher"} />
            <AvatarFallback
              className="text-[10px]"
              style={{
                backgroundColor: theme.bg.muted,
                color: theme.text.secondary,
                fontWeight: theme.font.weight.semibold,
              }}
            >
              {initials || "T"}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2" style={{ marginTop: "12px" }}>
      <button
        type="button"
        className="flex min-w-0 items-center gap-2 text-left"
        onClick={() => onOpenProfile?.()}
      >
        <Avatar
          className="h-7 w-7"
          style={{ border: `1px solid ${theme.border.input}`, borderRadius: theme.radius.full }}
        >
          <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "Teacher"} />
          <AvatarFallback
            className="text-[10px]"
            style={{
              backgroundColor: theme.bg.muted,
              color: theme.text.secondary,
              fontWeight: theme.font.weight.semibold,
            }}
          >
            {initials || "T"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p
            className="truncate text-[13px]"
            style={{ color: theme.text.primary, fontWeight: theme.font.weight.medium }}
          >
            {user?.name || "Teacher"}
          </p>
          <p className="truncate text-[11px]" style={{ color: theme.text.muted }}>
            {username}
          </p>
        </div>
      </button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 px-[10px] text-[12px]"
        style={{
          borderRadius: theme.radius.sm,
          borderColor: theme.border.input,
          backgroundColor: theme.bg.card,
          color: theme.text.secondary,
          fontWeight: theme.font.weight.medium,
        }}
        onClick={onLogout}
      >
        Logout
      </Button>
    </div>
  );
}
