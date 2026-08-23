import { useEffect, useState } from "react";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Home from "lucide-react/dist/esm/icons/home";
import LibraryBig from "lucide-react/dist/esm/icons/library-big";
import PanelLeftClose from "lucide-react/dist/esm/icons/panel-left-close";
import PanelRightOpen from "lucide-react/dist/esm/icons/panel-right-open";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import { Link, useLocation } from "react-router-dom";

import ProfileFooter from "@/components/layout/ProfileFooter";
import Spinner from "@/components/shared/Spinner";
import { useTeacherSubjects } from "@/hooks/useTeacherSubjects";
import { cn } from "@/lib/utils";
import { theme } from "@/theme";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "teacher-sidebar-collapsed";

function SidebarItem({ isActive, onClick, to, icon: Icon, label, isSubject = false, isCollapsed = false }) {
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
    refetch: refetchSubjects
  } = useTeacherSubjects();
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

  const navigationItems = [
    {
      id: "home",
      label: "Home",
      to: "/teacher",
      icon: Home,
      type: "link",
      isActive: location.pathname === "/teacher",
    },
    {
      id: "library",
      label: "Quiz Library",
      to: "/teacher/quiz/library",
      icon: LibraryBig,
      type: "link",
      isActive: location.pathname.startsWith("/teacher/quiz/library"),
    },
    {
      id: "generate",
      label: "Generate New Quiz",
      icon: Sparkles,
      type: "action",
      isActive:
        location.pathname.startsWith("/teacher/quiz/manual") ||
        location.pathname.startsWith("/teacher/quiz/auto"),
    },
  ];

  return (
    <aside
      className="ds-teacher-sidebar flex h-full shrink-0 flex-col"
      style={{
        width: isMobileViewport ? "260px" : effectiveCollapsed ? "56px" : "220px",
        minWidth: isMobileViewport ? "260px" : effectiveCollapsed ? "56px" : "220px",
        transition: "width 0.2s ease",
        backgroundColor: theme.bg.sidebar,
        padding: effectiveCollapsed ? "16px 8px" : "16px 12px",
      }}
    >
      <div
        className={cn("flex", effectiveCollapsed ? "flex-col items-center gap-2" : "items-center justify-between gap-2 px-1")}
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
              flexShrink: 0,
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
                letterSpacing: "-0.3px",
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
            backgroundColor: theme.bg.card,
          }}
          aria-label={effectiveCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          onClick={() => setIsCollapsed((previous) => !previous)}
        >
          {effectiveCollapsed ? <PanelRightOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
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
              if (item.type === "action") {
                onOpenGenerateQuiz?.();
              }

              if (isMobileViewport) {
                onNavigateMobile?.();
              }
            }}
          />
        ))}
      </div>

      {!effectiveCollapsed ? (
        <div
          className="mt-3 min-h-0 flex-1 pt-3"
          style={{ borderTop: `1px solid ${theme.border.default}` }}
        >
          <p
            className="mb-1.5 ml-[10px] mt-1 text-[11px] uppercase"
            style={{
              color: theme.text.subtle,
              fontWeight: theme.font.weight.semibold,
              letterSpacing: "0.06em",
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
                  isActive={Number(selectedSubjectId) === Number(subject.id)}
                  label={subject.name}
                  onClick={() => {
                    onSelectSubject(subject.id);
                    if (isMobileViewport) {
                      onNavigateMobile?.();
                    }
                  }}
                />
              ))}

              {subjectsLoading && subjectItems.length === 0 ? <Spinner className="py-4" label="Loading subjects..." /> : null}

              {subjectsError ? (
                <div
                  className="space-y-2 p-3 text-center text-[12px]"
                  style={{
                    borderRadius: theme.radius.md,
                    border: `1px dashed ${theme.border.default}`,
                    backgroundColor: theme.bg.content,
                    color: theme.text.accent,
                  }}
                >
                  <p>Couldn&apos;t load subjects.</p>
                  <button
                    type="button"
                    className="rounded-[var(--ds-radius-sm)] border px-3 py-1 text-[12px] transition-colors hover:bg-[var(--ds-bg-input)]"
                    style={{ borderColor: theme.border.input, color: theme.text.secondary }}
                    onClick={() => refetchSubjects()}
                  >
                    Retry
                  </button>
                </div>
              ) : null}

              {!subjectsLoading && !subjectsError && subjectItems.length === 0 ? (
                <p
                  className="p-3 text-center text-[12px]"
                  style={{
                    borderRadius: theme.radius.md,
                    border: `1px dashed ${theme.border.default}`,
                    backgroundColor: theme.bg.content,
                    color: theme.text.muted,
                  }}
                >
                  No subjects yet. Create one to start adding questions.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div
        className="mt-3 space-y-2 pt-3"
        style={{ borderTop: `1px solid ${theme.border.default}` }}
      >
        <ProfileFooter user={user} onLogout={onLogout} onOpenProfile={onOpenProfile} compact={effectiveCollapsed} />
      </div>
    </aside>
  );
}
