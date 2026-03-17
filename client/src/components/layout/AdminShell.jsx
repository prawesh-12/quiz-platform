import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import AdminSidebar from "@/components/layout/AdminSidebar";
import TeacherTopBar from "@/components/layout/TeacherTopBar";
import { cn } from "@/lib/utils";
import { theme } from "@/theme";

export default function AdminShell({
  children,
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onOpenCreateSubject,
  onOpenProfile,
  onTeacherAdded,
  user,
  onLogout,
  contentScrollable = true,
  contentPaddingClass = "",
  pageClassName = "",
  pageStyle = undefined,
  containerClassName = "",
  containerStyle = undefined,
  contentStyle = undefined
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={cn("ds-shell-page", pageClassName)} style={pageStyle}>
      <div className={cn("ds-shell-container", containerClassName)} style={containerStyle}>
        <button
          type="button"
          className={cn("ds-sidebar-overlay", mobileSidebarOpen ? "is-open" : "")}
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
        />

        <div className={cn("ds-sidebar-wrapper", mobileSidebarOpen ? "is-open" : "")}>
          <AdminSidebar
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={onSelectSubject}
            onOpenCreateSubject={onOpenCreateSubject}
            onOpenProfile={onOpenProfile}
            onTeacherAdded={onTeacherAdded}
            user={user}
            onLogout={onLogout}
            onNavigateMobile={() => setMobileSidebarOpen(false)}
          />
        </div>

        <div
          className="ds-shell-divider h-full w-px shrink-0"
          style={{ backgroundColor: theme.border.default }}
        />

        <main
          className="ds-shell-main flex min-h-0 min-w-0 flex-1 flex-col"
          style={{ backgroundColor: theme.bg.content }}
        >
          <TeacherTopBar onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)} />
          <div
            className={cn(
              "ds-shell-content min-h-0 flex-1",
              contentScrollable ? "overflow-y-auto" : "overflow-y-hidden"
            )}
            style={{
              backgroundColor: theme.bg.content,
              padding: "28px 32px",
              ...contentStyle
            }}
          >
            <div className={cn("min-h-full", contentPaddingClass)}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
