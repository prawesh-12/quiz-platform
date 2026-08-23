import { useState } from "react";
import Activity from "lucide-react/dist/esm/icons/activity";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import ClipboardCheck from "lucide-react/dist/esm/icons/clipboard-check";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import Users from "lucide-react/dist/esm/icons/users";
import { useNavigate } from "react-router-dom";

import SchoolTabs from "@/components/admin/SchoolTabs";
import { theme } from "@/theme";

import AdminTrendCard from "./admin-trend-card";
import { formatNumber, KpiRow, RecentQuizActivity } from "./dashboard-parts";
import { useAdminDashboardData } from "./useAdminDashboardData";

const DEFAULT_SCHOOL = "SOT";
const RECENT_ACTIVITY_LIMIT = 4;
const RECENT_ACTIVITY_MAX_HEIGHT_PX = 332;
const KPI_TONES = {
  accent: { bg: theme.accent.tint, color: theme.accent.DEFAULT },
  active: { bg: theme.status.activeTint, color: theme.status.active },
  pending: { bg: theme.status.pendingTint, color: theme.status.pending },
  neutral: { bg: theme.bg.input, color: theme.text.secondary }
};
const PANEL_STYLE = {
  borderRadius: theme.radius.lg,
  borderColor: theme.border.default,
  backgroundColor: theme.bg.card
};

function buildKpiCards(kpiStats) {
  return [
    {
      label: "Scheduled Quizzes",
      value: formatNumber(kpiStats.scheduledQuizzes),
      icon: CalendarClock,
      tone: KPI_TONES.accent
    },
    {
      label: "Ongoing Quizzes",
      value: formatNumber(kpiStats.ongoingQuizzes),
      icon: Activity,
      tone: KPI_TONES.active
    },
    {
      label: "Total Quiz Attempts Today",
      value: formatNumber(kpiStats.attemptsToday),
      icon: ClipboardCheck,
      tone: KPI_TONES.pending
    },
    {
      label: "New Participants Today",
      value: formatNumber(kpiStats.newParticipantsToday),
      icon: UserPlus,
      tone: KPI_TONES.neutral
    },
    {
      label: "Total Participants",
      value: formatNumber(kpiStats.totalParticipants),
      icon: Users,
      tone: KPI_TONES.accent
    }
  ];
}

function SchoolsPanel({ value, onChange }) {
  return (
    <section className="mb-4 shrink-0 border p-4" style={PANEL_STYLE}>
      <p
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: theme.text.muted }}
      >
        Schools
      </p>
      <SchoolTabs value={value} onChange={onChange} />
    </section>
  );
}

function RecentActivityPanel({ items }) {
  return (
    <section
      className="shrink-0 overflow-y-auto border p-4 sm:p-5"
      style={{ ...PANEL_STYLE, maxHeight: RECENT_ACTIVITY_MAX_HEIGHT_PX }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold" style={{ color: theme.text.primary }}>
          Recent Quiz Activity
        </h2>
        <p className="text-[12px]" style={{ color: theme.text.muted }}>
          Last {RECENT_ACTIVITY_LIMIT} quizzes
        </p>
      </div>
      <RecentQuizActivity items={items} />
    </section>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [selectedSchool, setSelectedSchool] = useState(DEFAULT_SCHOOL);
  const data = useAdminDashboardData();

  const onSelectSchool = (school) => {
    setSelectedSchool(school);
    navigate(`/admin/schools/${school}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" style={{ color: theme.text.secondary }}>
      <SchoolsPanel value={selectedSchool} onChange={onSelectSchool} />

      <KpiRow cards={buildKpiCards(data.kpiStats)} />

      <AdminTrendCard
        range={data.range}
        trendData={data.trendData}
        isFetching={data.isFetchingTrend}
        summary={data.summary}
        onLoadTrend={data.loadTrendData}
      />

      <RecentActivityPanel items={data.recentActivity} />
    </div>
  );
}
