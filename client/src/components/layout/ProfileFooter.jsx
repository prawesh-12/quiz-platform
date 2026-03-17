import Avatar from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { theme } from "@/theme";

export default function ProfileFooter({ user, onLogout, onOpenProfile, compact = false }) {
  const username =
    user?.role === "admin"
      ? "@admin"
      : user?.email
        ? `@${user.email.split("@")[0]}`
        : "@teacher";

  if (compact) {
    return (
      <div className="flex items-center justify-center">
        <button
          type="button"
          className="inline-flex items-center justify-center"
          onClick={() => onOpenProfile?.()}
          aria-label="Open profile"
        >
          <Avatar teacherId={user?.id} name={user?.name} size="sm" hasAvatar={Boolean(user?.has_avatar)} />
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
        <Avatar teacherId={user?.id} name={user?.name} size="sm" hasAvatar={Boolean(user?.has_avatar)} />
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
