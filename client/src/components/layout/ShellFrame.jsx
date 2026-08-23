import TeacherTopBar from "@/components/layout/TeacherTopBar";
import { cn } from "@/lib/utils";
import { theme } from "@/theme";

const CONTENT_PADDING = "28px 32px";

function ShellSidebar({ isOpen, onClose, children }) {
  return (
    <>
      <button
        type="button"
        className={cn("ds-sidebar-overlay", isOpen ? "is-open" : "")}
        aria-label="Close sidebar"
        onClick={onClose}
      />

      <div className={cn("ds-sidebar-wrapper", isOpen ? "is-open" : "")}>{children}</div>

      <div
        className="ds-shell-divider h-full w-px shrink-0"
        style={{ backgroundColor: theme.border.default }}
      />
    </>
  );
}

// Persistent app chrome: mounted by the layout route so navigation only swaps the content region.
export default function ShellFrame({ sidebar, mobileSidebar, content, children }) {
  return (
    <div className="ds-shell-page">
      <div className="ds-shell-container">
        <ShellSidebar isOpen={mobileSidebar.isOpen} onClose={mobileSidebar.close}>
          {sidebar}
        </ShellSidebar>

        <main
          className="ds-shell-main flex min-h-0 min-w-0 flex-1 flex-col"
          style={{ backgroundColor: theme.bg.content }}
        >
          <TeacherTopBar onMobileMenuToggle={mobileSidebar.toggle} />
          <div
            className={cn(
              "ds-shell-content min-h-0 flex-1",
              content.isScrollable ? "overflow-y-auto" : "overflow-y-hidden"
            )}
            style={{ backgroundColor: theme.bg.content, padding: CONTENT_PADDING, ...content.style }}
          >
            <div className={cn("min-h-full", content.paddingClass)}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
