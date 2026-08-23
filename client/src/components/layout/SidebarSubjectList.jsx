import SidebarNavItem from "@/components/layout/SidebarNavItem";
import Spinner from "@/components/shared/Spinner";
import { theme } from "@/theme";

const NOTICE_CLASS = "space-y-2 p-3 text-center text-[12px]";

function buildNoticeStyle(color) {
  return {
    borderRadius: theme.radius.lg,
    border: `1px dashed ${theme.border.default}`,
    backgroundColor: theme.bg.content,
    color,
  };
}

export default function SidebarSubjectList({
  subjects,
  isLoading,
  isError,
  onRetry,
  onSelectSubject,
  isSubjectActive,
  emptyMessage,
}) {
  const isEmpty = !isLoading && !isError && subjects.length === 0;

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col pt-3" style={{ borderTop: `1px solid ${theme.border.default}` }}>
      <p
        className="mb-1.5 ml-[10px] mt-1 shrink-0 text-[11px] uppercase"
        style={{
          color: theme.text.subtle,
          fontWeight: theme.font.weight.semibold,
          letterSpacing: "0.06em",
        }}
      >
        Subject Database
      </p>

      <div className="scrollbar-hidden min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
        {subjects.map((subject) => (
          <SidebarNavItem
            key={subject.id}
            isSubject
            isActive={isSubjectActive(subject)}
            label={subject.name}
            onClick={() => onSelectSubject(subject)}
          />
        ))}

        {isLoading && subjects.length === 0 ? <Spinner className="py-4" label="Loading subjects..." /> : null}

        {isError ? (
          <div className={NOTICE_CLASS} style={buildNoticeStyle(theme.status.flagged)}>
            <p>Couldn&apos;t load subjects.</p>
            <button
              type="button"
              className="rounded-[var(--ds-radius-sm)] border px-3 py-1 text-[12px] transition-colors hover:bg-[var(--ds-accent-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              style={{ borderColor: theme.border.input, color: theme.text.secondary }}
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        ) : null}

        {isEmpty ? (
          <p className={NOTICE_CLASS} style={buildNoticeStyle(theme.text.muted)}>
            {emptyMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
