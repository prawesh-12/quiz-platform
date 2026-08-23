import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Gauge from "lucide-react/dist/esm/icons/gauge";
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap";
import LibraryBig from "lucide-react/dist/esm/icons/library-big";
import Menu from "lucide-react/dist/esm/icons/menu";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import UserRound from "lucide-react/dist/esm/icons/user-round";
import Users from "lucide-react/dist/esm/icons/users";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { theme } from "@/theme";

function buildBreadcrumbs(pathname) {
  if (pathname === "/teacher") {
    return [{ icon: Gauge, label: "Quiz Dashboard" }];
  }

  if (pathname.startsWith("/teacher/quiz/library")) {
    return [
      { icon: Gauge, label: "Quiz Dashboard" },
      { icon: LibraryBig, label: "Quiz Library" },
    ];
  }

  if (pathname.startsWith("/teacher/quiz/manual")) {
    return [
      { icon: Gauge, label: "Quiz Dashboard" },
      { icon: Sparkles, label: "Generate New Quiz" },
    ];
  }

  if (pathname.startsWith("/teacher/quiz/auto")) {
    return [
      { icon: Gauge, label: "Quiz Dashboard" },
      { icon: Sparkles, label: "Generate New Quiz" },
    ];
  }

  if (pathname.startsWith("/teacher/quiz/scheduled")) {
    return [
      { icon: Gauge, label: "Quiz Dashboard" },
      { icon: CalendarClock, label: "Scheduled Quizzes" },
    ];
  }

  if (pathname.startsWith("/teacher/quiz/ongoing")) {
    return [
      { icon: Gauge, label: "Quiz Dashboard" },
      { icon: CalendarClock, label: "Ongoing Quizzes" },
    ];
  }

  if (pathname.startsWith("/teacher/quiz/") && pathname.endsWith("/responses")) {
    return [
      { icon: Gauge, label: "Quiz Dashboard" },
      { icon: GraduationCap, label: "Quiz Responses" },
    ];
  }

  if (pathname.startsWith("/teacher/questions/")) {
    return [
      { icon: Gauge, label: "Quiz Dashboard" },
      { icon: GraduationCap, label: "Subject Questions" },
    ];
  }

  if (pathname.startsWith("/teacher/profile")) {
    return [
      { icon: Gauge, label: "Quiz Dashboard" },
      { icon: UserRound, label: "Profile" },
    ];
  }

  // Admin paths
  if (pathname === "/admin") {
    return [{ icon: ShieldCheck, label: "Admin Dashboard" }];
  }

  if (pathname === "/admin/teachers") {
    return [
      { icon: ShieldCheck, label: "Admin Dashboard" },
      { icon: Users, label: "All Teachers" },
    ];
  }

  if (pathname.startsWith("/admin/schools/")) {
    const school = pathname.split("/")[3] || "";
    return [
      { icon: ShieldCheck, label: "Admin Dashboard" },
      { icon: Users, label: `${school} Teachers` },
    ];
  }

  return [{ icon: Gauge, label: "Quiz Dashboard" }];
}

export default function TeacherTopBar({ onMobileMenuToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname]);
  const showBackButton = location.pathname !== "/teacher" && location.pathname !== "/admin";

  return (
    <header
      className="flex h-12 items-center justify-between border-b px-6"
      style={{
        borderBottomColor: theme.border.default,
        backgroundColor: theme.bg.card,
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open sidebar menu"
          onClick={onMobileMenuToggle}
          className="ds-mobile-menu-button h-7 w-7 p-0"
          style={{ color: theme.text.secondary }}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {showBackButton ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="h-7 w-7 p-0"
              style={{ color: theme.text.secondary }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="h-4 w-px" style={{ backgroundColor: theme.border.default }} />
          </>
        ) : null}

        <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
          {breadcrumbs.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === breadcrumbs.length - 1;
            return (
              <div key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                {index > 0 ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: theme.text.subtle }} />
                ) : null}
                <Icon
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: isLast ? theme.text.primary : theme.text.muted }}
                />
                <span
                  className="truncate"
                  style={{
                    color: isLast ? theme.text.primary : theme.text.muted,
                    fontWeight: isLast ? theme.font.weight.medium : theme.font.weight.normal,
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
