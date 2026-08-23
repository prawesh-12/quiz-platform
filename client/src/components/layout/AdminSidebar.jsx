import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Home from "lucide-react/dist/esm/icons/home";
import Plus from "lucide-react/dist/esm/icons/plus";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import { useLocation } from "react-router-dom";

import AddTeacherModal from "@/components/admin/AddTeacherModal";
import ProfileFooter from "@/components/layout/ProfileFooter";
import SidebarBrand from "@/components/layout/SidebarBrand";
import SidebarNavItem from "@/components/layout/SidebarNavItem";
import SidebarSubjectList from "@/components/layout/SidebarSubjectList";
import SubjectQuestionsDialog from "@/components/layout/SubjectQuestionsDialog";
import { useSidebarChrome } from "@/components/layout/useSidebarChrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminSubjects } from "@/hooks/useAdminSubjects";
import { getSubjectQuestions } from "@/services/adminService";
import { theme } from "@/theme";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "admin-sidebar-collapsed";
const KNOWN_SCHOOLS = ["SOT", "SLS", "SOET"];
const DEFAULT_SCHOOL = "SOT";
const ACTION_BUTTON_HEIGHT = "38px";

function getDefaultSchoolFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const schoolsIndex = parts.findIndex((part) => part === "schools");
  if (schoolsIndex === -1) {
    return DEFAULT_SCHOOL;
  }

  const value = parts[schoolsIndex + 1]?.trim().toUpperCase();
  if (KNOWN_SCHOOLS.includes(value)) {
    return value;
  }

  return DEFAULT_SCHOOL;
}

function buildNavigationItems(pathname) {
  return [
    { id: "home", label: "Home", to: "/admin", icon: Home, isActive: pathname === "/admin" },
    {
      id: "teachers",
      label: "Teachers",
      to: "/admin/teachers",
      icon: UserPlus,
      isActive: pathname === "/admin/teachers",
    },
  ];
}

export default function AdminSidebar({
  selectedSubjectId,
  onSelectSubject,
  onOpenCreateSubject,
  onOpenProfile,
  user,
  onLogout,
  onNavigateMobile,
  onTeacherAdded,
}) {
  const location = useLocation();
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectQuestionsOpen, setSubjectQuestionsOpen] = useState(false);
  const { isMobileViewport, effectiveCollapsed, width, toggleCollapsed } = useSidebarChrome(
    SIDEBAR_COLLAPSED_STORAGE_KEY
  );

  const selectedSubjectFromProps = useMemo(() => Number(selectedSubjectId) || null, [selectedSubjectId]);
  const {
    subjects: subjectItems,
    isLoading: subjectsLoading,
    isError: subjectsError,
    refetch: refetchSubjects,
  } = useAdminSubjects();

  const subjectQuestionsQuery = useQuery({
    queryKey: ["admin", "subject-questions", selectedSubject?.id],
    enabled: subjectQuestionsOpen && Boolean(selectedSubject?.id),
    queryFn: () => getSubjectQuestions(selectedSubject.id),
  });

  const openSubjectQuestions = (subject) => {
    setSelectedSubject(subject);
    setSubjectQuestionsOpen(true);
    onSelectSubject?.(subject.id);
    if (isMobileViewport) {
      onNavigateMobile?.();
    }
  };

  const isSubjectActive = (subject) =>
    Number(selectedSubjectFromProps) === Number(subject.id) ||
    Number(selectedSubject?.id) === Number(subject.id);

  return (
    <>
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

        <nav aria-label="Admin navigation" className="space-y-1">
          {buildNavigationItems(location.pathname).map((item) => (
            <SidebarNavItem
              key={item.id}
              isActive={item.isActive}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isCollapsed={effectiveCollapsed}
              onClick={() => isMobileViewport && onNavigateMobile?.()}
            />
          ))}
        </nav>

        {!effectiveCollapsed ? (
          <SidebarSubjectList
            subjects={subjectItems}
            isLoading={subjectsLoading}
            isError={subjectsError}
            onRetry={refetchSubjects}
            isSubjectActive={isSubjectActive}
            emptyMessage="No subjects yet. Create one to start assigning."
            onSelectSubject={openSubjectQuestions}
          />
        ) : (
          <div className="flex-1" />
        )}

        <div className="mt-3 space-y-2 pt-3" style={{ borderTop: `1px solid ${theme.border.default}` }}>
          <Button
            type="button"
            className={cn("w-full", effectiveCollapsed ? "px-0" : "")}
            style={{
              height: ACTION_BUTTON_HEIGHT,
              backgroundColor: theme.bg.cta,
              color: theme.text.white,
              borderRadius: theme.radius.md,
              fontSize: theme.font.size.base,
              fontWeight: theme.font.weight.semibold,
            }}
            onClick={() => setIsAddTeacherOpen(true)}
            aria-label="Add teacher"
            title={effectiveCollapsed ? "Add teacher" : undefined}
          >
            <UserPlus className="h-4 w-4" />
            {!effectiveCollapsed ? "Add Teacher" : null}
          </Button>

          <Button
            type="button"
            variant={effectiveCollapsed ? "default" : "outline"}
            className={cn("w-full", effectiveCollapsed ? "px-0" : "")}
            style={{ height: ACTION_BUTTON_HEIGHT, borderRadius: theme.radius.md }}
            onClick={onOpenCreateSubject}
            aria-label="Add subject"
            title={effectiveCollapsed ? "Add subject" : undefined}
          >
            <Plus className="h-4 w-4" />
            {!effectiveCollapsed ? "Add Subject" : null}
          </Button>

          <ProfileFooter
            user={user}
            onLogout={onLogout}
            onOpenProfile={onOpenProfile}
            compact={effectiveCollapsed}
          />
        </div>
      </aside>

      <AddTeacherModal
        open={isAddTeacherOpen}
        onOpenChange={setIsAddTeacherOpen}
        defaultSchool={getDefaultSchoolFromPath(location.pathname)}
        onSuccess={onTeacherAdded}
      />

      <SubjectQuestionsDialog
        open={subjectQuestionsOpen}
        onOpenChange={setSubjectQuestionsOpen}
        subjectName={selectedSubject?.name}
        isLoading={subjectQuestionsQuery.isLoading}
        questions={subjectQuestionsQuery.data?.questions ?? []}
      />
    </>
  );
}
