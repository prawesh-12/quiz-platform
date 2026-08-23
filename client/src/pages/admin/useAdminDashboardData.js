import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useToast } from "@/hooks/useToast";
import { dashboardService } from "@/services/dashboardService";
import { quizService } from "@/services/quizService";
import { withJitter } from "@/utils/jitter";
import {
  buildTrendSeries,
  formatDateInput,
  parseDateInput,
  startOfDay,
  summariseQuizzes
} from "@/pages/teacher/dashboardData";

const TREND_DAYS_BACK = 6;
const RECENT_ACTIVITY_LIMIT = 4;
const LIVE_STATUS_POLL_MS = 5_000;
const SUMMARY_STALE_MS = 30_000;

async function fetchLiveStatusCounts() {
  const [scheduledResult, activeResult] = await Promise.all([
    quizService.list({ status: "scheduled", page: 1, limit: 1 }),
    quizService.list({ status: "active", page: 1, limit: 1 })
  ]);

  return {
    scheduled: scheduledResult?.total ?? 0,
    active: activeResult?.total ?? 0
  };
}

function buildDefaultRange() {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - TREND_DAYS_BACK);
  return { start, end: today };
}

function useTrendRange() {
  const defaultRange = useMemo(buildDefaultRange, []);
  const [startInput, setStartInput] = useState(() => formatDateInput(defaultRange.start));
  const [endInput, setEndInput] = useState(() => formatDateInput(defaultRange.end));
  const [applied, setApplied] = useState(defaultRange);

  return { startInput, setStartInput, endInput, setEndInput, applied, setApplied };
}

function buildKpiStats(summary, liveStatus) {
  const counts = summary?.counts ?? {};
  const kpis = summary?.kpis ?? {};

  return {
    attemptsToday: kpis.attempts_today ?? 0,
    newParticipantsToday: kpis.new_participants_today ?? 0,
    totalParticipants: kpis.total_participants ?? 0,
    scheduledQuizzes: liveStatus?.scheduled ?? counts.scheduled ?? 0,
    ongoingQuizzes: liveStatus?.active ?? counts.active ?? 0
  };
}

function findRangeError(start, end) {
  if (!start || !end) {
    return "Select a valid start and end date.";
  }

  if (start > end) {
    return "Start date must be on or before end date.";
  }

  return null;
}

function useAdminDashboardQueries(applied) {
  const liveStatusQuery = useQuery({
    queryKey: ["dashboard", "quiz-statuses"],
    queryFn: fetchLiveStatusCounts,
    refetchInterval: () => withJitter(LIVE_STATUS_POLL_MS),
    refetchIntervalInBackground: true
  });

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardService.getSummary("admin"),
    staleTime: SUMMARY_STALE_MS
  });

  const start = formatDateInput(applied.start);
  const end = formatDateInput(applied.end);

  const trendQuery = useQuery({
    queryKey: ["dashboard", "trend", start, end],
    queryFn: () => dashboardService.getTrend("admin", { start, end }),
    staleTime: SUMMARY_STALE_MS
  });

  return { liveStatusQuery, summaryQuery, trendQuery };
}

// Every query the admin dashboard reads, plus the trend range it is driven by.
export function useAdminDashboardData() {
  const { toast } = useToast();
  const range = useTrendRange();
  const { liveStatusQuery, summaryQuery, trendQuery } = useAdminDashboardQueries(range.applied);

  const loadTrendData = () => {
    const nextStart = parseDateInput(range.startInput);
    const nextEnd = parseDateInput(range.endInput);
    const rangeError = findRangeError(nextStart, nextEnd);

    if (rangeError) {
      toast({ title: "Invalid date range", description: rangeError, variant: "destructive" });
      return;
    }

    range.setApplied({ start: nextStart, end: nextEnd });
  };

  return {
    range,
    loadTrendData,
    isFetchingTrend: trendQuery.isFetching,
    trendData: buildTrendSeries(range.applied, trendQuery.data?.points ?? []),
    kpiStats: buildKpiStats(summaryQuery.data, liveStatusQuery.data),
    recentActivity: summariseQuizzes(summaryQuery.data?.quizzes ?? [], RECENT_ACTIVITY_LIMIT).recentActivity,
    summary: {
      isLoading: summaryQuery.isLoading,
      isError: summaryQuery.isError,
      errorMessage: summaryQuery.error?.response?.data?.error || "Failed to load dashboard analytics."
    }
  };
}
