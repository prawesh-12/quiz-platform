import BookOpen from "lucide-react/dist/esm/icons/book-open";
import PanelLeftClose from "lucide-react/dist/esm/icons/panel-left-close";
import PanelRightOpen from "lucide-react/dist/esm/icons/panel-right-open";

import { cn } from "@/lib/utils";
import { theme } from "@/theme";

const MARK_SIZE = "32px";
const WORDMARK_SIZE = "17px";
const WORDMARK_TRACKING = "-0.3px";

export default function SidebarBrand({ isCollapsed, onToggleCollapsed }) {
  const toggleLabel = isCollapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <div
      className={cn(
        "flex",
        isCollapsed ? "flex-col items-center gap-2" : "items-center justify-between gap-2 px-1"
      )}
      style={{ marginBottom: "20px" }}
    >
      <div className="flex min-w-0 items-center">
        <span
          className="inline-flex shrink-0 items-center justify-center"
          style={{
            width: MARK_SIZE,
            height: MARK_SIZE,
            borderRadius: theme.radius.md,
            background: theme.bg.activeNav,
            color: theme.text.white,
            marginRight: isCollapsed ? 0 : "10px",
          }}
        >
          <BookOpen className="h-4 w-4" />
        </span>
        {!isCollapsed ? (
          <p
            className="truncate leading-none"
            style={{
              fontFamily: theme.font.family,
              fontSize: WORDMARK_SIZE,
              fontWeight: theme.font.weight.bold,
              color: theme.text.primary,
              letterSpacing: WORDMARK_TRACKING,
            }}
          >
            QuizLoom
          </p>
        ) : null}
      </div>

      <button
        type="button"
        className="ds-sidebar-collapse-btn inline-flex h-7 w-7 shrink-0 items-center justify-center transition-colors hover:bg-[var(--ds-accent-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
        style={{
          borderRadius: theme.radius.sm,
          border: `1px solid ${theme.border.input}`,
          color: theme.text.muted,
          backgroundColor: theme.bg.card,
        }}
        aria-label={toggleLabel}
        title={toggleLabel}
        onClick={onToggleCollapsed}
      >
        {isCollapsed ? <PanelRightOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
