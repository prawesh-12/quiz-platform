import { Link } from "react-router-dom";

import { prefetchRoute } from "@/hooks/useRoutePrefetch";
import { cn } from "@/lib/utils";
import { theme } from "@/theme";

function buildLayoutClassName(isCollapsed, isSubject) {
  if (isCollapsed) {
    return "justify-center px-0";
  }

  if (isSubject) {
    return "px-[14px] text-[13px]";
  }

  return "gap-2.5 px-[10px] text-[14px]";
}

export default function SidebarNavItem({
  isActive,
  onClick,
  to,
  icon: Icon,
  label,
  isSubject = false,
  isCollapsed = false,
}) {
  const Comp = to ? Link : "button";
  // Pull the route chunk on intent, so the click lands on an already-loaded page.
  const prefetch = to ? () => prefetchRoute(to) : undefined;
  const className = cn(
    "flex h-9 w-full items-center rounded-[var(--ds-radius-md)] text-left transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-1",
    buildLayoutClassName(isCollapsed, isSubject),
    isActive ? "text-[var(--ds-text-white)]" : "text-[var(--ds-text-secondary)] hover:bg-[var(--ds-accent-tint)]"
  );

  return (
    <Comp
      to={to}
      type={to ? undefined : "button"}
      className={className}
      onClick={onClick}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      aria-current={isActive ? "page" : undefined}
      aria-label={isCollapsed ? label : undefined}
      title={isCollapsed ? label : undefined}
      style={{
        backgroundColor: isActive ? theme.bg.activeNav : "transparent",
        fontWeight: theme.font.weight.medium,
      }}
    >
      {Icon ? (
        <Icon
          className="h-4 w-4 shrink-0"
          style={{ color: isActive ? theme.text.white : theme.text.muted }}
        />
      ) : null}
      {!isCollapsed ? <span className="truncate">{label}</span> : null}
    </Comp>
  );
}
