import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Home, PanelLeftClose, PanelRightOpen, Plus, UserPlus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import AddTeacherModal from "@/components/admin/AddTeacherModal";
import ProfileFooter from "@/components/layout/ProfileFooter";
import Spinner from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAdminSubjects } from "@/hooks/useAdminSubjects";
import { getSubjectQuestions } from "@/services/adminService";
import { theme } from "@/theme";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "admin-sidebar-collapsed";

function SidebarItem({
  isActive,
  onClick,
  to,
  icon: Icon,
  label,
  isSubject = false,
  isCollapsed = false
}) {
  const Comp = to ? Link : "button";
  const baseClassName = cn(
    "flex h-9 w-full items-center rounded-[var(--ds-radius-md)] text-left transition-colors",
    isCollapsed ? "justify-center px-0" : isSubject ? "px-[14px] text-[13px]" : "gap-2.5 px-[10px] text-[14px]",
    isActive ? "text-[var(--ds-text-white)]" : "text-[var(--ds-text-secondary)] hover:bg-[var(--ds-bg-input)]"
  );

  return (
    <Comp
      to={to}
      type={to ? undefined : "button"}
      className={baseClassName}
      onClick={onClick}
      aria-label={isCollapsed ? label : undefined}
      title={isCollapsed ? label : undefined}
      style={{
        backgroundColor: isActive ? theme.bg.activeNav : "transparent",
        fontWeight: theme.font.weight.medium
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

function getDefaultSchoolFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const schoolsIndex = parts.findIndex((part) => part === "schools");
  if (schoolsIndex === -1) {
    return "SOT";
  }

  const value = parts[schoolsIndex + 1]?.trim().toUpperCase();
  if (["SOT", "SLS", "SOET"].includes(value)) {
    return value;
  }
  return "SOT";
}

export default function AdminSidebar({
  selectedSubjectId,
  onSelectSubject,
  onOpenCreateSubject,
  onOpenProfile,
  user,
  onLogout,
  onNavigateMobile,
  onTeacherAdded
}) {
  const location = useLocation();
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectQuestionsOpen, setSubjectQuestionsOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 767px)").matches;
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleMediaQueryChange = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleMediaQueryChange);

    return () => mediaQuery.removeEventListener("change", handleMediaQueryChange);
  }, []);

  const effectiveCollapsed = !isMobileViewport && isCollapsed;
  const selectedSubjectFromProps = useMemo(
    () => Number(selectedSubjectId) || null,
    [selectedSubjectId]
  );

  const {
    subjects: subjectItems,
    isLoading: subjectsLoading,
    isError: subjectsError,
    refetch: refetchSubjects
  } = useAdminSubjects();

  const subjectQuestionsQuery = useQuery({
    queryKey: ["admin", "subject-questions", selectedSubject?.id],
    enabled: subjectQuestionsOpen && Boolean(selectedSubject?.id),
    queryFn: () => getSubjectQuestions(selectedSubject.id)
  });

  const navigationItems = [
    {
      id: "home",
      label: "Home",
      to: "/admin",
      icon: Home,
      type: "link",
      isActive: location.pathname === "/admin"
    },
    {
      id: "teachers",
      label: "Teachers",
      to: "/admin/teachers",
      icon: UserPlus,
      type: "link",
      isActive: location.pathname === "/admin/teachers"
    }
  ];

  return (
    <>
      <aside
        className="ds-teacher-sidebar flex h-full shrink-0 flex-col"
        style={{
          width: isMobileViewport ? "260px" : effectiveCollapsed ? "56px" : "220px",
          minWidth: isMobileViewport ? "260px" : effectiveCollapsed ? "56px" : "220px",
          transition: "width 0.2s ease",
          backgroundColor: theme.bg.sidebar,
          padding: effectiveCollapsed ? "16px 8px" : "16px 12px"
        }}
      >
        <div
          className={cn(
            "flex",
            effectiveCollapsed ? "flex-col items-center gap-2" : "items-center justify-between gap-2 px-1"
          )}
          style={{ marginBottom: "20px" }}
        >
          <div className="flex min-w-0 items-center">
            <span
              className="inline-flex shrink-0 items-center justify-center"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "#1C1C1E",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: effectiveCollapsed ? 0 : "10px",
                flexShrink: 0
              }}
            >
              <BookOpen className="h-4 w-4" />
            </span>
            {!effectiveCollapsed ? (
              <p
                className="truncate leading-none"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#1C1C1E",
                  letterSpacing: "-0.3px"
                }}
              >
                QuizLoom
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="ds-sidebar-collapse-btn inline-flex h-7 w-7 shrink-0 items-center justify-center transition-colors hover:bg-[var(--ds-bg-card-hover)]"
            style={{
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.border.input}`,
              color: theme.text.muted,
              backgroundColor: theme.bg.card
            }}
            aria-label={effectiveCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            onClick={() => setIsCollapsed((previous) => !previous)}
          >
            {effectiveCollapsed ? (
              <PanelRightOpen className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="space-y-1">
          {navigationItems.map((item) => (
            <SidebarItem
              key={item.id}
              isActive={item.isActive}
              to={item.type === "link" ? item.to : undefined}
              icon={item.icon}
              label={item.label}
              isCollapsed={effectiveCollapsed}
              onClick={() => {
                if (isMobileViewport) {
                  onNavigateMobile?.();
                }
              }}
            />
          ))}
        </div>

        {!effectiveCollapsed ? (
          <div className="mt-3 min-h-0 flex-1 pt-3" style={{ borderTop: `1px solid ${theme.border.default}` }}>
            <p
              className="mb-1.5 ml-[10px] mt-1 text-[11px] uppercase"
              style={{
                color: theme.text.subtle,
                fontWeight: theme.font.weight.semibold,
                letterSpacing: "0.06em"
              }}
            >
              Subject Database
            </p>

            <div className="scrollbar-hidden h-full overflow-y-auto pr-0.5">
              <div className="space-y-1">
                {subjectItems.map((subject) => (
                  <SidebarItem
                    key={subject.id}
                    isSubject
                    isActive={
                      Number(selectedSubjectFromProps) === Number(subject.id) ||
                      Number(selectedSubject?.id) === Number(subject.id)
                    }
                    label={subject.name}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSubjectQuestionsOpen(true);
                      onSelectSubject?.(subject.id);
                      if (isMobileViewport) {
                        onNavigateMobile?.();
                      }
                    }}
                  />
                ))}

                {subjectsLoading && subjectItems.length === 0 ? (
                  <Spinner className="py-4" label="Loading subjects..." />
                ) : null}

                {subjectsError ? (
                  <div
                    className="space-y-2 p-3 text-center text-[12px]"
                    style={{
                      borderRadius: theme.radius.md,
                      border: `1px dashed ${theme.border.default}`,
                      backgroundColor: theme.bg.content,
                      color: theme.text.accent
                    }}
                  >
                    <p>Couldn't load subjects.</p>
                    <Button type="button" variant="outline" className="h-7 text-[12px]" onClick={() => refetchSubjects()}>
                      Retry
                    </Button>
                  </div>
                ) : null}

                {!subjectsLoading && !subjectsError && subjectItems.length === 0 ? (
                  <p
                    className="p-3 text-center text-[12px]"
                    style={{
                      borderRadius: theme.radius.md,
                      border: `1px dashed ${theme.border.default}`,
                      backgroundColor: theme.bg.content,
                      color: theme.text.muted
                    }}
                  >
                    No subjects yet. Create one to start assigning.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="mt-3 space-y-2 pt-3" style={{ borderTop: `1px solid ${theme.border.default}` }}>
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              className={cn("h-[38px] w-full", effectiveCollapsed ? "px-0" : "")}
              style={{
                backgroundColor: theme.bg.activeNav,
                color: theme.text.white,
                borderRadius: theme.radius.md,
                fontSize: theme.font.size.base,
                fontWeight: theme.font.weight.semibold
              }}
              onClick={() => setIsAddTeacherOpen(true)}
              aria-label="Add Teacher"
              title={effectiveCollapsed ? "Add Teacher" : undefined}
            >
              <UserPlus className="h-4 w-4" />
              {!effectiveCollapsed ? "Add Teacher" : null}
            </Button>

            <Button
              type="button"
              variant={effectiveCollapsed ? "default" : "outline"}
              className={cn("h-[38px] w-full", effectiveCollapsed ? "px-0" : "")}
              onClick={onOpenCreateSubject}
              aria-label="Add Subject"
              title={effectiveCollapsed ? "Add Subject" : undefined}
            >
              <Plus className="h-4 w-4" />
              {!effectiveCollapsed ? "Add Subject" : null}
            </Button>
          </div>

          <div style={{ marginTop: "12px" }}>
            <ProfileFooter user={user} onLogout={onLogout} onOpenProfile={onOpenProfile} compact={effectiveCollapsed} />
          </div>
        </div>
      </aside>

      <AddTeacherModal
        open={isAddTeacherOpen}
        onOpenChange={setIsAddTeacherOpen}
        defaultSchool={getDefaultSchoolFromPath(location.pathname)}
        onSuccess={onTeacherAdded}
      />

      <Dialog open={subjectQuestionsOpen} onOpenChange={setSubjectQuestionsOpen}>
        <DialogContent className="max-w-[760px]">
          <DialogHeader>
            <DialogTitle>{selectedSubject?.name || "Subject"} Questions</DialogTitle>
            <DialogDescription>
              Read-only view of questions assigned to this subject.
            </DialogDescription>
          </DialogHeader>

          <div
            className="max-h-[58vh] space-y-2 overflow-y-auto rounded-[var(--ds-radius-md)] border p-3"
            style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}
          >
            {subjectQuestionsQuery.isLoading ? <Spinner className="py-3" label="Loading questions..." /> : null}

            {!subjectQuestionsQuery.isLoading &&
              (subjectQuestionsQuery.data?.questions?.length ?? 0) === 0 ? (
              <p className="text-[13px]" style={{ color: theme.text.muted }}>
                No questions found for this subject.
              </p>
            ) : null}

            {(subjectQuestionsQuery.data?.questions || []).map((question, index) => (
              <div
                key={question.id}
                className="rounded-[var(--ds-radius-md)] border p-3"
                style={{ borderColor: theme.border.input, backgroundColor: theme.bg.content }}
              >
                <p className="text-[12px]" style={{ color: theme.text.muted }}>
                  Q{index + 1}
                </p>
                <p className="mt-1 text-[14px]" style={{ color: theme.text.primary }}>
                  {question.question_text}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]" style={{ color: theme.text.muted }}>
                  <span>Correct: {String(question.correct_option || "").toUpperCase()}</span>
                  {question.unit_name ? <span>Unit: {question.unit_name}</span> : null}
                  {question.created_by_name ? <span>By: {question.created_by_name}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
