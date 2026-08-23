import Home from "lucide-react/dist/esm/icons/home";
import LibraryBig from "lucide-react/dist/esm/icons/library-big";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import { useLocation } from "react-router-dom";

import ProfileFooter from "@/components/layout/ProfileFooter";
import SidebarBrand from "@/components/layout/SidebarBrand";
import SidebarNavItem from "@/components/layout/SidebarNavItem";
import SidebarSubjectList from "@/components/layout/SidebarSubjectList";
import { useSidebarChrome } from "@/components/layout/useSidebarChrome";
import { useTeacherSubjects } from "@/hooks/useTeacherSubjects";
import { theme } from "@/theme";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "teacher-sidebar-collapsed";

function buildNavigationItems(pathname) {
  return [
    {
      id: "home",
      label: "Home",
      to: "/teacher",
      icon: Home,
      type: "link",
      isActive: pathname === "/teacher",
    },
    {
      id: "library",
      label: "Quiz Library",
      to: "/teacher/quiz/library",
      icon: LibraryBig,
      type: "link",
      isActive: pathname.startsWith("/teacher/quiz/library"),
    },
    {
      id: "generate",
      label: "Generate New Quiz",
      icon: Sparkles,
      type: "action",
      isActive:
        pathname.startsWith("/teacher/quiz/manual") || pathname.startsWith("/teacher/quiz/auto"),
    },
  ];
}

export default function TeacherSidebar({
  selectedSubjectId,
  onSelectSubject,
  onOpenGenerateQuiz,
  onOpenProfile,
  user,
  onLogout,
  onNavigateMobile,
}) {
  const location = useLocation();
  const {
    subjects: subjectItems,
    isLoading: subjectsLoading,
    isError: subjectsError,
    refetch: refetchSubjects,
  } = useTeacherSubjects();
  const { isMobileViewport, effectiveCollapsed, width, toggleCollapsed } = useSidebarChrome(
    SIDEBAR_COLLAPSED_STORAGE_KEY
  );

  const navigationItems = buildNavigationItems(location.pathname);

  const handleNavigate = (item) => {
    if (item.type === "action") {
      onOpenGenerateQuiz?.();
    }

    if (isMobileViewport) {
      onNavigateMobile?.();
    }
  };

  return (
    <aside
      className="ds-teacher-sidebar flex h-full shrink-0 flex-col"
      style={{
        width,
        minWidth: width,
        transition: "width 0.2s ease",
        backgroundColor: theme.bg.sidebar,
        padding: effectiveCollapsed ? "16px 8px" : "16px 12px",
      }}
    >
      <SidebarBrand isCollapsed={effectiveCollapsed} onToggleCollapsed={toggleCollapsed} />

      <nav aria-label="Teacher navigation" className="space-y-1">
        {navigationItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            isActive={item.isActive}
            to={item.type === "link" ? item.to : undefined}
            icon={item.icon}
            label={item.label}
            isCollapsed={effectiveCollapsed}
            onClick={() => handleNavigate(item)}
          />
        ))}
      </nav>

      {!effectiveCollapsed ? (
        <SidebarSubjectList
          subjects={subjectItems}
          isLoading={subjectsLoading}
          isError={subjectsError}
          onRetry={refetchSubjects}
          isSubjectActive={(subject) => Number(selectedSubjectId) === Number(subject.id)}
          emptyMessage="No subjects yet. Create one to start adding questions."
          onSelectSubject={(subject) => {
            onSelectSubject(subject.id);
            if (isMobileViewport) {
              onNavigateMobile?.();
            }
          }}
        />
      ) : (
        <div className="flex-1" />
      )}

      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.border.default}` }}>
        <ProfileFooter
          user={user}
          onLogout={onLogout}
          onOpenProfile={onOpenProfile}
          compact={effectiveCollapsed}
        />
      </div>
    </aside>
  );
}
