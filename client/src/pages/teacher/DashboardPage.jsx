import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import DashboardActivityTable from "@/components/teacher/DashboardActivityTable";
import DashboardKpiCards from "@/components/teacher/DashboardKpiCards";
import DashboardQuizStats from "@/components/teacher/DashboardQuizStats";
import DashboardTrendCard from "@/components/teacher/DashboardTrendCard";
import { useToast } from "@/hooks/useToast";
import { dashboardService } from "@/services/dashboardService";
import { quizService } from "@/services/quizService";
import { withJitter } from "@/utils/jitter";
import { theme } from "@/theme";
import {
  buildTrendSeries,
  formatDateInput,
  parseDateInput,
  startOfDay,
  summariseQuizzes,
} from "@/pages/teacher/dashboardData";

const LIVE_STATUS_REFRESH_MS = 5_000;
const SUMMARY_STALE_MS = 30_000;
const DEFAULT_RANGE_DAYS = 6;
const RECENT_ACTIVITY_LIMIT = 4;

async function fetchLiveStatusCounts() {
  const [scheduledResult, activeResult] = await Promise.all([
    quizService.list({ status: "scheduled", page: 1, limit: 1 }),
    quizService.list({ status: "active", page: 1, limit: 1 }),
  ]);

  return { scheduled: scheduledResult?.total ?? 0, active: activeResult?.total ?? 0 };
}

function buildDefaultRange() {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - DEFAULT_RANGE_DAYS);
  return { start, end: today };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultRange = useMemo(buildDefaultRange, []);
  const [startDateInput, setStartDateInput] = useState(() => formatDateInput(defaultRange.start));
  const [endDateInput, setEndDateInput] = useState(() => formatDateInput(defaultRange.end));
  const [chartRange, setChartRange] = useState(defaultRange);

  const liveQuizStatusQuery = useQuery({
    queryKey: ["dashboard", "quiz-statuses"],
    queryFn: fetchLiveStatusCounts,
    refetchInterval: () => withJitter(LIVE_STATUS_REFRESH_MS),
    refetchIntervalInBackground: true,
  });

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardService.getSummary("teachers"),
    staleTime: SUMMARY_STALE_MS,
  });

  const trendRangeStart = formatDateInput(chartRange.start);
  const trendRangeEnd = formatDateInput(chartRange.end);

  const trendQuery = useQuery({
    queryKey: ["dashboard", "trend", trendRangeStart, trendRangeEnd],
    queryFn: () => dashboardService.getTrend("teachers", { start: trendRangeStart, end: trendRangeEnd }),
    staleTime: SUMMARY_STALE_MS,
  });

  const summary = summaryQuery.data;
  const counts = summary?.counts ?? {};
  const kpis = summary?.kpis ?? {};

  const derived = useMemo(
    () => summariseQuizzes(summary?.quizzes ?? [], RECENT_ACTIVITY_LIMIT),
    [summary]
  );

  const trendData = useMemo(
    () => buildTrendSeries(chartRange, trendQuery.data?.points ?? []),
    [chartRange, trendQuery.data]
  );

  const kpiStats = {
    attemptsToday: kpis.attempts_today ?? 0,
    newParticipantsToday: kpis.new_participants_today ?? 0,
    totalParticipants: kpis.total_participants ?? 0,
    scheduledQuizzes: liveQuizStatusQuery.data?.scheduled ?? counts.scheduled ?? 0,
    ongoingQuizzes: liveQuizStatusQuery.data?.active ?? counts.active ?? 0,
  };

  const loadTrendData = () => {
    const nextStart = parseDateInput(startDateInput);
    const nextEnd = parseDateInput(endDateInput);

    if (!nextStart || !nextEnd || nextStart > nextEnd) {
      toast({
        title: "Invalid date range",
        description: "Select a valid start date on or before the end date.",
        variant: "destructive",
      });
      return;
    }

    setChartRange({ start: nextStart, end: nextEnd });
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden" style={{ color: theme.text.secondary }}>
        <DashboardKpiCards
          stats={kpiStats}
          onOpenScheduled={() => navigate("/teacher/quiz/scheduled")}
          onOpenOngoing={() => navigate("/teacher/quiz/ongoing")}
        />

        <section className="ds-dashboard-middle-row mb-4 flex shrink-0 items-stretch gap-4">
          <DashboardTrendCard
            startDateInput={startDateInput}
            endDateInput={endDateInput}
            onStartDateChange={setStartDateInput}
            onEndDateChange={setEndDateInput}
            onLoadTrend={loadTrendData}
            isFetching={trendQuery.isFetching}
            isLoading={summaryQuery.isLoading}
            isError={summaryQuery.isError}
            errorMessage={
              summaryQuery.error?.response?.data?.error || "Failed to load dashboard analytics."
            }
            trendData={trendData}
          />

          <div className="ds-dashboard-right-col flex w-[320px] shrink-0 flex-col gap-3">
            <DashboardQuizStats
              quizStats={derived.quizStats}
              totalQuizCount={counts.total ?? derived.quizCount}
              totalAttempts={derived.totalAttempts}
            />
          </div>
        </section>

        <DashboardActivityTable rows={derived.recentActivity} />
      </div>
    </>
  );
}
