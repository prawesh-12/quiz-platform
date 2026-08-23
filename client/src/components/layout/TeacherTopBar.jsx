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

const TEACHER_ROOT = { icon: Gauge, label: "Quiz Dashboard" };
const ADMIN_ROOT = { icon: ShieldCheck, label: "Admin Dashboard" };

const TEACHER_ROUTES = [
  { prefix: "/teacher/quiz/library", icon: LibraryBig, label: "Quiz Library" },
  { prefix: "/teacher/quiz/manual", icon: Sparkles, label: "Generate New Quiz" },
  { prefix: "/teacher/quiz/auto", icon: Sparkles, label: "Generate New Quiz" },
  { prefix: "/teacher/quiz/scheduled", icon: CalendarClock, label: "Scheduled Quizzes" },
  { prefix: "/teacher/quiz/ongoing", icon: CalendarClock, label: "Ongoing Quizzes" },
  { prefix: "/teacher/questions/", icon: GraduationCap, label: "Subject Questions" },
  { prefix: "/teacher/profile", icon: UserRound, label: "Profile" },
];

function buildAdminBreadcrumbs(pathname) {
  if (pathname === "/admin/teachers") {
    return [ADMIN_ROOT, { icon: Users, label: "All Teachers" }];
  }

  if (pathname.startsWith("/admin/schools/")) {
    const school = pathname.split("/")[3] || "";
    return [ADMIN_ROOT, { icon: Users, label: `${school} Teachers` }];
  }

  return [ADMIN_ROOT];
}

function buildBreadcrumbs(pathname) {
  if (pathname.startsWith("/admin")) {
    return buildAdminBreadcrumbs(pathname);
  }

  if (pathname.startsWith("/teacher/quiz/") && pathname.endsWith("/responses")) {
    return [TEACHER_ROOT, { icon: GraduationCap, label: "Quiz Responses" }];
  }

  const match = TEACHER_ROUTES.find((route) => pathname.startsWith(route.prefix));
  if (match) {
    return [TEACHER_ROOT, { icon: match.icon, label: match.label }];
  }

  return [TEACHER_ROOT];
}

function Breadcrumb({ item, isLast, isFirst }) {
  const Icon = item.icon;
  const color = isLast ? theme.text.primary : theme.text.muted;

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {!isFirst ? (
        <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: theme.text.subtle }} />
      ) : null}
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      <span
        className="truncate"
        style={{
          color,
          fontWeight: isLast ? theme.font.weight.semibold : theme.font.weight.normal,
        }}
      >
        {item.label}
      </span>
    </div>
  );
}

export default function TeacherTopBar({ onMobileMenuToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname]);
  const showBackButton = location.pathname !== "/teacher" && location.pathname !== "/admin";

  return (
    <header
      className="flex h-12 shrink-0 items-center border-b px-6"
      style={{ borderBottomColor: theme.border.default, backgroundColor: theme.bg.card }}
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

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          {breadcrumbs.map((item, index) => (
            <Breadcrumb
              key={`${item.label}-${index}`}
              item={item}
              isFirst={index === 0}
              isLast={index === breadcrumbs.length - 1}
            />
          ))}
        </nav>
      </div>
    </header>
  );
}
