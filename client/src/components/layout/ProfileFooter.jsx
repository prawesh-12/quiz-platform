import Avatar from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { theme } from "@/theme";

const FOCUS_RING =
  "rounded-[var(--ds-radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-1";

function buildUsername(user) {
  if (user?.role === "admin") {
    return "@admin";
  }

  if (user?.email) {
    return `@${user.email.split("@")[0]}`;
  }

  return "@teacher";
}

export default function ProfileFooter({ user, onLogout, onOpenProfile, compact = false }) {
  const username = buildUsername(user);

  if (compact) {
    return (
      <div className="flex items-center justify-center">
        <button
          type="button"
          className={`inline-flex items-center justify-center ${FOCUS_RING}`}
          onClick={() => onOpenProfile?.()}
          aria-label="Open profile"
        >
          <Avatar teacherId={user?.id} name={user?.name} size="sm" hasAvatar={Boolean(user?.has_avatar)} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        className={`flex min-w-0 items-center gap-2 p-1 text-left transition-colors hover:bg-[var(--ds-accent-tint)] ${FOCUS_RING}`}
        onClick={() => onOpenProfile?.()}
        aria-label="Open profile"
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
        className="h-7 shrink-0 px-[10px] text-[12px]"
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
