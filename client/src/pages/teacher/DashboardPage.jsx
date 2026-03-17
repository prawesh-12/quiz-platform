import { lazy, Suspense, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  BookOpenText,
  CalendarClock,
  Clock3,
  ClipboardCheck,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { quizService } from "@/services/quizService";
import { responseService } from "@/services/responseService";
import { subjectService } from "@/services/subjectService";
import { theme } from "@/theme";

const QUIZ_FETCH_LIMIT = 100;
const RESPONSE_FETCH_LIMIT = 100;
const ParticipantsTrendChart = lazy(
  () => import("@/components/teacher/ParticipantsTrendChart"),
);

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getParticipantKey(session) {
  const email = session?.email
    ? String(session.email).trim().toLowerCase()
    : "";
  if (email) {
    return `email:${email}`;
  }

  const rollNo = session?.roll_no
    ? String(session.roll_no).trim().toLowerCase()
    : "";
  if (rollNo) {
    return `roll:${rollNo}`;
  }

  const name = session?.name ? String(session.name).trim().toLowerCase() : "";
  if (name) {
    return `name:${name}`;
  }

  return `session:${session?.session_id || "unknown"}`;
}

function parseSessionStart(session) {
  if (!session?.started_at) {
    return null;
  }

  const startedAt = new Date(session.started_at);
  return Number.isNaN(startedAt.getTime()) ? null : startedAt;
}

function getSessionDurationSeconds(session) {
  if (!session?.started_at || !session?.submitted_at) {
    return null;
  }

  const startTime = new Date(session.started_at).getTime();
  const endTime = new Date(session.submitted_at).getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime < startTime) {
    return null;
  }

  return Math.round((endTime - startTime) / 1000);
}

function getScorePercent(session) {
  const score = Number(session?.score);
  const totalPoints = Number(session?.total_points);
  if (
    !Number.isFinite(score) ||
    !Number.isFinite(totalPoints) ||
    totalPoints <= 0
  ) {
    return null;
  }

  return (score / totalPoints) * 100;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

function formatAverageScore(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  return `${value.toFixed(1)}%`;
}

function formatDuration(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0m";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);

  if (minutes === 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

function formatDateLabel(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function fetchAllQuizzes() {
  let page = 1;
  let totalPages = 1;
  const quizzes = [];

  do {
    const result = await quizService.list({ page, limit: QUIZ_FETCH_LIMIT });
    quizzes.push(...(result?.quizzes ?? []));
    totalPages = result?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return quizzes;
}

async function fetchAllQuizResponses(quizId) {
  let page = 1;
  let totalPages = 1;
  const responses = [];

  do {
    const result = await responseService.getQuizResponses(quizId, {
      page,
      limit: RESPONSE_FETCH_LIMIT,
    });

    responses.push(...(result?.responses ?? []));
    totalPages = result?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return responses;
}

async function fetchLiveStatusCounts() {
  const [scheduledResult, activeResult] = await Promise.all([
    quizService.list({ status: "scheduled", page: 1, limit: 1 }),
    quizService.list({ status: "active", page: 1, limit: 1 }),
  ]);

  return {
    scheduled: scheduledResult?.total ?? 0,
    active: activeResult?.total ?? 0,
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");

  const today = startOfDay(new Date());
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 6);

  const [startDateInput, setStartDateInput] = useState(
    formatDateInput(defaultStart),
  );
  const [endDateInput, setEndDateInput] = useState(formatDateInput(today));
  const [chartRange, setChartRange] = useState({
    start: defaultStart,
    end: today,
  });

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list(),
  });

  const liveQuizStatusQuery = useQuery({
    queryKey: ["dashboard", "quiz-statuses"],
    queryFn: fetchLiveStatusCounts,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });

  const analyticsQuery = useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: async () => {
      const quizzes = await fetchAllQuizzes();
      const responseEligibleQuizzes = quizzes.filter((quiz) =>
        ["active", "ended"].includes(quiz.status),
      );

      const responsePages = await Promise.all(
        responseEligibleQuizzes.map(async (quiz) => {
          const responses = await fetchAllQuizResponses(quiz.id);
          return responses.map((session) => ({
            ...session,
            quiz_id: quiz.id,
            quiz_title: quiz.title,
          }));
        }),
      );

      return {
        quizzes,
        sessions: responsePages.flat(),
      };
    },
    staleTime: 30_000,
  });

  const createSubjectMutation = useMutation({
    mutationFn: (payload) => subjectService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setCreateSubjectOpen(false);
      setSubjectName("");
      toast({
        title: "Subject created",
        description: "Subject has been added successfully.",
      });
    },
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const quizzes = analyticsQuery.data?.quizzes ?? [];
  const sessions = analyticsQuery.data?.sessions ?? [];
  const scheduledQuizCount =
    liveQuizStatusQuery.data?.scheduled ??
    quizzes.filter((quiz) => quiz.status === "scheduled").length;
  const ongoingQuizCount =
    liveQuizStatusQuery.data?.active ??
    quizzes.filter((quiz) => quiz.status === "active").length;

  const kpiStats = useMemo(() => {
    const dayStart = startOfDay(new Date());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const participantFirstSeen = new Map();
    const participants = new Set();
    let attemptsToday = 0;

    for (const session of sessions) {
      const participantKey = getParticipantKey(session);
      participants.add(participantKey);

      const startedAt = parseSessionStart(session);
      if (!startedAt) {
        continue;
      }

      const previous = participantFirstSeen.get(participantKey);
      if (!previous || startedAt < previous) {
        participantFirstSeen.set(participantKey, startedAt);
      }

      if (startedAt >= dayStart && startedAt < dayEnd) {
        attemptsToday += 1;
      }
    }

    let newParticipantsToday = 0;
    for (const firstSeenDate of participantFirstSeen.values()) {
      if (firstSeenDate >= dayStart && firstSeenDate < dayEnd) {
        newParticipantsToday += 1;
      }
    }

    return {
      attemptsToday,
      newParticipantsToday,
      totalParticipants: participants.size,
      scheduledQuizzes: scheduledQuizCount,
      ongoingQuizzes: ongoingQuizCount,
    };
  }, [ongoingQuizCount, scheduledQuizCount, sessions]);

  const quizStats = useMemo(() => {
    const statsByQuiz = new Map();

    for (const session of sessions) {
      const quizId = session.quiz_id;
      if (!quizId) {
        continue;
      }

      if (!statsByQuiz.has(quizId)) {
        statsByQuiz.set(quizId, {
          quizName: session.quiz_title || "Untitled Quiz",
          participants: new Set(),
          scorePercents: [],
          timeSeconds: [],
        });
      }

      const aggregate = statsByQuiz.get(quizId);
      aggregate.participants.add(getParticipantKey(session));

      const score = getScorePercent(session);
      if (score != null) {
        aggregate.scorePercents.push(score);
      }

      const durationSeconds = getSessionDurationSeconds(session);
      if (durationSeconds != null) {
        aggregate.timeSeconds.push(durationSeconds);
      }
    }

    let selectedStats = null;
    for (const value of statsByQuiz.values()) {
      if (
        !selectedStats ||
        value.participants.size > selectedStats.participants.size
      ) {
        selectedStats = value;
      }
    }

    const averageScore = selectedStats?.scorePercents?.length
      ? selectedStats.scorePercents.reduce((sum, value) => sum + value, 0) /
        selectedStats.scorePercents.length
      : 0;

    const averageTime = selectedStats?.timeSeconds?.length
      ? selectedStats.timeSeconds.reduce((sum, value) => sum + value, 0) /
        selectedStats.timeSeconds.length
      : 0;

    return {
      participants: selectedStats?.participants.size ?? 0,
      averageScore,
      averageTime,
      quizName:
        selectedStats?.quizName || quizzes[0]?.title || "No quiz data yet",
    };
  }, [quizzes, sessions]);

  const trendData = useMemo(() => {
    const start = startOfDay(chartRange.start);
    const end = startOfDay(chartRange.end);
    const dayEntries = [];
    const participantMap = new Map();

    const cursor = new Date(start);
    while (cursor <= end) {
      const key = formatDateInput(cursor);
      participantMap.set(key, new Set());
      dayEntries.push({ key, date: new Date(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const session of sessions) {
      const startedAt = parseSessionStart(session);
      if (!startedAt) {
        continue;
      }

      const day = startOfDay(startedAt);
      if (day < start || day > end) {
        continue;
      }

      const key = formatDateInput(day);
      const participantSet = participantMap.get(key);
      if (participantSet) {
        participantSet.add(getParticipantKey(session));
      }
    }

    return dayEntries.map((entry) => ({
      date: entry.key,
      label: entry.date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      value: participantMap.get(entry.key)?.size ?? 0,
    }));
  }, [chartRange.end, chartRange.start, sessions]);

  const recentQuizActivity = useMemo(() => {
    const quizStatsMap = new Map();

    for (const quiz of quizzes) {
      quizStatsMap.set(quiz.id, {
        id: quiz.id,
        name: quiz.title || "Untitled Quiz",
        subject: quiz.subject_name || "Unassigned",
        date: quiz.quiz_date || quiz.created_at || null,
        participants: new Set(),
        scorePercents: [],
      });
    }

    for (const session of sessions) {
      const aggregate = quizStatsMap.get(session.quiz_id);
      if (!aggregate) {
        continue;
      }

      aggregate.participants.add(getParticipantKey(session));
      const scorePercent = getScorePercent(session);
      if (scorePercent != null) {
        aggregate.scorePercents.push(scorePercent);
      }
    }

    return Array.from(quizStatsMap.values())
      .sort((left, right) => {
        const leftTime = left.date ? new Date(left.date).getTime() : 0;
        const rightTime = right.date ? new Date(right.date).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice(0, 5)
      .map((item) => ({
        ...item,
        participantCount: item.participants.size,
        averageScore: item.scorePercents.length
          ? item.scorePercents.reduce((sum, value) => sum + value, 0) /
            item.scorePercents.length
          : 0,
      }));
  }, [quizzes, sessions]);

  const quizSubjectById = useMemo(() => {
    const map = new Map();
    for (const quiz of quizzes) {
      map.set(quiz.id, quiz.subject_name || "Unassigned");
    }
    return map;
  }, [quizzes]);

  const topSubjects = useMemo(() => {
    const subjectMap = new Map();

    for (const quiz of quizzes) {
      const subjectName = quiz.subject_name || "Unassigned";
      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, {
          name: subjectName,
          participants: new Set(),
          scorePercents: [],
        });
      }
    }

    for (const session of sessions) {
      const subjectName = quizSubjectById.get(session.quiz_id) || "Unassigned";

      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, {
          name: subjectName,
          participants: new Set(),
          scorePercents: [],
        });
      }

      const aggregate = subjectMap.get(subjectName);
      aggregate.participants.add(getParticipantKey(session));
      const scorePercent = getScorePercent(session);
      if (scorePercent != null) {
        aggregate.scorePercents.push(scorePercent);
      }
    }

    return Array.from(subjectMap.values())
      .map((subject) => ({
        ...subject,
        participantCount: subject.participants.size,
        averageScore: subject.scorePercents.length
          ? subject.scorePercents.reduce((sum, value) => sum + value, 0) /
            subject.scorePercents.length
          : 0,
      }))
      .sort((left, right) => right.averageScore - left.averageScore)
      .slice(0, 5);
  }, [quizzes, quizSubjectById, sessions]);

  const loadTrendData = () => {
    const nextStart = parseDateInput(startDateInput);
    const nextEnd = parseDateInput(endDateInput);

    if (!nextStart || !nextEnd) {
      toast({
        title: "Invalid date range",
        description: "Select a valid start and end date.",
        variant: "destructive",
      });
      return;
    }

    if (nextStart > nextEnd) {
      toast({
        title: "Invalid date range",
        description: "Start date must be on or before end date.",
        variant: "destructive",
      });
      return;
    }

    setChartRange({ start: nextStart, end: nextEnd });
  };

  const onCreateSubject = (event) => {
    event.preventDefault();
    createSubjectMutation.mutate({ name: subjectName });
  };

  const kpiCards = [
    {
      label: "Scheduled Quizzes",
      value: formatNumber(kpiStats.scheduledQuizzes),
      icon: CalendarClock,
      tone: theme.badge.blue,
      onClick: () => navigate("/teacher/quiz/scheduled"),
    },
    {
      label: "Ongoing Quizzes",
      value: formatNumber(kpiStats.ongoingQuizzes),
      icon: Activity,
      tone: theme.badge.red,
      onClick: () => navigate("/teacher/quiz/ongoing"),
    },
    {
      label: "Total Quiz Attempts Today",
      value: formatNumber(kpiStats.attemptsToday),
      icon: ClipboardCheck,
      tone: theme.badge.green,
    },
    {
      label: "New Participants Today",
      value: formatNumber(kpiStats.newParticipantsToday),
      icon: UserPlus,
      tone: theme.badge.gray,
    },
    {
      label: "Total Participants",
      value: formatNumber(kpiStats.totalParticipants),
      icon: Users,
      tone: theme.badge.teal,
    },
  ];

  const compactRecentQuizActivity = recentQuizActivity.slice(0, 4);

  return (
    <TeacherShell
      subjects={subjects}
      selectedSubjectId={null}
      onSelectSubject={(subjectId) =>
        navigate(`/teacher/questions/${subjectId}`)
      }
      onOpenCreateSubject={() => setCreateSubjectOpen(true)}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
      contentScrollable={false}
      contentPaddingClass="h-full"
      containerStyle={{
        "--ds-sidebar-width": "220px",
      }}
      contentStyle={{
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "24px 28px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="flex h-full min-h-0 flex-col overflow-hidden"
        style={{ color: theme.text.secondary }}
      >
        <section className="ds-dashboard-stats-row mb-4 shrink-0 flex gap-3">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            const labelFontSize = card.label.length > 20 ? "10.5px" : "11px";
            const cardContent = (
              <div className="flex h-full min-h-[90px] items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    style={{
                      fontSize: labelFontSize,
                      color: theme.text.muted,
                      fontWeight: theme.font.weight.medium,
                      whiteSpace: "nowrap",
                      overflow: "visible",
                      textOverflow: "unset",
                    }}
                  >
                    {card.label}
                  </p>
                  <p
                    className="mt-2 text-[28px] leading-none"
                    style={{
                      color: theme.text.primary,
                      fontWeight: theme.font.weight.bold,
                    }}
                  >
                    {card.value}
                  </p>
                </div>
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center"
                  style={{
                    borderRadius: theme.radius.md,
                    backgroundColor: card.tone.bg,
                    color: card.tone.color,
                  }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
              </div>
            );

            const baseClassName =
              "h-[102px] min-w-0 flex-1 rounded-[12px] border p-[16px] px-5";
            const baseStyle = {
              borderColor: theme.border.default,
              backgroundColor: theme.bg.card,
            };

            if (card.onClick) {
              return (
                <button
                  key={card.label}
                  type="button"
                  onClick={card.onClick}
                  className={cn(
                    baseClassName,
                    "cursor-pointer text-left transition-all duration-150 ease-in-out hover:-translate-y-[2px] hover:border-[#1C1C1E] hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)]",
                  )}
                  style={baseStyle}
                >
                  {cardContent}
                </button>
              );
            }

            return (
              <article
                key={card.label}
                className={cn(baseClassName, "cursor-default")}
                style={baseStyle}
              >
                {cardContent}
              </article>
            );
          })}
        </section>

        <section className="ds-dashboard-middle-row mb-4 flex min-h-0 flex-1 gap-4">
          <article
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border p-5 px-6"
            style={{
              borderColor: theme.border.default,
              backgroundColor: theme.bg.card,
            }}
          >
            <div className="mb-3 flex flex-nowrap items-center gap-3">
              <h2
                className="shrink-0"
                style={{
                  color: "#1C1C1E",
                  fontSize: "15px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Unique Participants
              </h2>

              <div className="min-w-0 flex-1" />

              <div className="shrink-0 flex items-center gap-2">
                <Label
                  htmlFor="trend-start-date"
                  style={{
                    color: "#999",
                    fontSize: "12px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Start Date
                </Label>
                <Input
                  id="trend-start-date"
                  type="date"
                  value={startDateInput}
                  onChange={(event) => setStartDateInput(event.target.value)}
                  className="h-8 w-[120px] px-2 text-[12px]"
                  style={{
                    border: "1px solid #E4E4E4",
                    borderRadius: "8px",
                    height: "32px",
                    padding: "0 8px",
                    fontSize: "12px",
                    width: "120px",
                  }}
                />
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Label
                  htmlFor="trend-end-date"
                  style={{
                    color: "#999",
                    fontSize: "12px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  End Date
                </Label>
                <Input
                  id="trend-end-date"
                  type="date"
                  value={endDateInput}
                  onChange={(event) => setEndDateInput(event.target.value)}
                  className="h-8 w-[120px] px-2 text-[12px]"
                  style={{
                    border: "1px solid #E4E4E4",
                    borderRadius: "8px",
                    height: "32px",
                    padding: "0 8px",
                    fontSize: "12px",
                    width: "120px",
                  }}
                />
              </div>
              <Button
                type="button"
                className="h-8 shrink-0 whitespace-nowrap text-[13px]"
                style={{
                  background: "#1C1C1E",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
                onClick={loadTrendData}
                disabled={analyticsQuery.isFetching}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Load Data
              </Button>
            </div>

            <div
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border p-4"
              style={{
                borderColor: theme.border.default,
                backgroundColor: theme.bg.card,
              }}
            >
              {analyticsQuery.isLoading ? (
                <p className="text-[12px]" style={{ color: theme.text.muted }}>
                  Loading dashboard analytics...
                </p>
              ) : null}

              {analyticsQuery.isError ? (
                <p className="text-[12px]" style={{ color: theme.text.accent }}>
                  {analyticsQuery.error?.response?.data?.error ||
                    "Failed to load dashboard analytics."}
                </p>
              ) : null}

              {!analyticsQuery.isLoading && !analyticsQuery.isError ? (
                <div className="h-[260px] min-h-[260px] w-full">
                  <Suspense
                    fallback={
                      <div
                        className="flex h-full items-center justify-center text-[12px]"
                        style={{ color: theme.text.muted }}
                      >
                        Loading chart...
                      </div>
                    }
                  >
                    <ParticipantsTrendChart
                      trendData={trendData}
                      theme={theme}
                    />
                  </Suspense>
                </div>
              ) : null}
            </div>
          </article>

          <div className="ds-dashboard-right-col flex w-[320px] shrink-0 min-h-0 flex-col gap-3 overflow-hidden">
            <article
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border p-5"
              style={{
                borderColor: theme.border.default,
                backgroundColor: theme.bg.card,
              }}
            >
              <h2
                className="mb-4 text-[15px]"
                style={{
                  color: theme.text.primary,
                  fontWeight: theme.font.weight.semibold,
                }}
              >
                Quiz Stats
              </h2>
              <div className="grid w-full grid-cols-2 gap-[10px]">
                <div
                  className="w-full rounded-[10px] border p-3"
                  style={{
                    borderColor: "#EBEBEB",
                    backgroundColor: "#FFFFFF",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    className="mb-2 inline-flex h-7 w-7 items-center justify-center"
                    style={{ color: theme.text.teal }}
                  >
                    <Users className="h-[28px] w-[28px]" />
                  </div>
                  <p
                    className="mt-2 text-[12px]"
                    style={{ color: theme.text.muted }}
                  >
                    Participants
                  </p>
                  <p
                    className="text-[22px]"
                    style={{
                      color: theme.text.primary,
                      fontWeight: theme.font.weight.bold,
                    }}
                  >
                    {formatNumber(quizStats.participants)}
                  </p>
                </div>
                <div
                  className="w-full rounded-[10px] border p-3"
                  style={{
                    borderColor: "#EBEBEB",
                    backgroundColor: "#FFFFFF",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    className="mb-2 inline-flex h-7 w-7 items-center justify-center"
                    style={{ color: theme.badge.blue.color }}
                  >
                    <BarChart3 className="h-[28px] w-[28px]" />
                  </div>
                  <p
                    className="mt-2 text-[12px]"
                    style={{ color: theme.text.muted }}
                  >
                    Avg Score
                  </p>
                  <p
                    className="text-[22px]"
                    style={{
                      color: theme.text.primary,
                      fontWeight: theme.font.weight.bold,
                    }}
                  >
                    {formatAverageScore(quizStats.averageScore)}
                  </p>
                </div>
                <div
                  className="w-full rounded-[10px] border p-3"
                  style={{
                    borderColor: "#EBEBEB",
                    backgroundColor: "#FFFFFF",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    className="mb-2 inline-flex h-7 w-7 items-center justify-center"
                    style={{ color: theme.text.orange }}
                  >
                    <Clock3 className="h-[28px] w-[28px]" />
                  </div>
                  <p
                    className="mt-2 text-[12px]"
                    style={{ color: theme.text.muted }}
                  >
                    Avg Time
                  </p>
                  <p
                    className="text-[22px]"
                    style={{
                      color: theme.text.primary,
                      fontWeight: theme.font.weight.bold,
                    }}
                  >
                    {formatDuration(quizStats.averageTime)}
                  </p>
                </div>
                <div
                  className="w-full rounded-[10px] border p-3"
                  style={{
                    borderColor: "#EBEBEB",
                    backgroundColor: "#FFFFFF",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    className="mb-2 inline-flex h-7 w-7 items-center justify-center"
                    style={{ color: theme.text.accent }}
                  >
                    <BookOpenText className="h-[28px] w-[28px]" />
                  </div>
                  <p
                    className="mt-2 text-[12px]"
                    style={{ color: theme.text.muted }}
                  >
                    Quiz Name
                  </p>
                  <p
                    className="truncate text-[22px]"
                    style={{
                      color: theme.text.primary,
                      fontWeight: theme.font.weight.bold,
                    }}
                  >
                    {quizStats.quizName}
                  </p>
                </div>
                <div
                  className="w-full rounded-[10px] border p-3"
                  style={{
                    borderColor: "#EBEBEB",
                    backgroundColor: "#FFFFFF",
                    boxSizing: "border-box",
                  }}
                >
                  <p
                    className="mt-2 text-[12px]"
                    style={{ color: theme.text.muted }}
                  >
                    Total Quizzes
                  </p>
                  <p
                    className="text-[22px]"
                    style={{
                      color: theme.text.primary,
                      fontWeight: theme.font.weight.bold,
                    }}
                  >
                    {formatNumber(quizzes.length)}
                  </p>
                </div>
                <div
                  className="w-full rounded-[10px] border p-3"
                  style={{
                    borderColor: "#EBEBEB",
                    backgroundColor: "#FFFFFF",
                    boxSizing: "border-box",
                  }}
                >
                  <p
                    className="mt-2 text-[12px]"
                    style={{ color: theme.text.muted }}
                  >
                    Total Attempts
                  </p>
                  <p
                    className="text-[22px]"
                    style={{
                      color: theme.text.primary,
                      fontWeight: theme.font.weight.bold,
                    }}
                  >
                    {formatNumber(sessions.length)}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section
          className="shrink-0 rounded-[14px] border p-5"
          style={{
            borderColor: theme.border.default,
            backgroundColor: theme.bg.card,
            maxHeight: "332px",
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2
              className="text-[15px]"
              style={{
                color: theme.text.primary,
                fontWeight: theme.font.weight.semibold,
              }}
            >
              Recent Quiz Activity
            </h2>
            <p className="text-[12px]" style={{ color: theme.text.subtle }}>
              Last 4 quizzes
            </p>
          </div>
          <div className="ds-dashboard-table-wrap overflow-hidden">
            <table className="ds-dashboard-table w-full border-collapse">
              <thead style={{ backgroundColor: theme.bg.content }}>
                <tr
                  className="h-10 border-b"
                  style={{ borderBottomColor: theme.border.default }}
                >
                  <th
                    className="px-3 text-left text-[12px]"
                    style={{
                      color: theme.text.muted,
                      fontWeight: theme.font.weight.medium,
                    }}
                  >
                    Quiz
                  </th>
                  <th
                    className="px-3 text-left text-[12px]"
                    style={{
                      color: theme.text.muted,
                      fontWeight: theme.font.weight.medium,
                    }}
                  >
                    Subject
                  </th>
                  <th
                    className="px-3 text-left text-[12px]"
                    style={{
                      color: theme.text.muted,
                      fontWeight: theme.font.weight.medium,
                    }}
                  >
                    Date
                  </th>
                  <th
                    className="px-3 text-left text-[12px]"
                    style={{
                      color: theme.text.muted,
                      fontWeight: theme.font.weight.medium,
                    }}
                  >
                    Participants
                  </th>
                  <th
                    className="px-3 text-left text-[12px]"
                    style={{
                      color: theme.text.muted,
                      fontWeight: theme.font.weight.medium,
                    }}
                  >
                    Avg Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {compactRecentQuizActivity.length === 0 ? (
                  <tr
                    className="h-[52px] border-b"
                    style={{ borderBottomColor: theme.border.light }}
                  >
                    <td
                      colSpan={5}
                      className="px-3 text-center text-[13px]"
                      style={{ color: theme.text.muted }}
                    >
                      No quiz activity available yet.
                    </td>
                  </tr>
                ) : (
                  compactRecentQuizActivity.map((item) => (
                    <tr
                      key={item.id}
                      className="h-[52px] border-b transition-colors hover:bg-[var(--ds-bg-card-hover)]"
                      style={{
                        borderBottomColor: theme.border.light,
                        color: theme.text.secondary,
                      }}
                    >
                      <td
                        className="max-w-[220px] truncate px-3 text-[14px]"
                        style={{
                          color: theme.text.primary,
                          fontWeight: theme.font.weight.medium,
                        }}
                      >
                        {item.name}
                      </td>
                      <td className="px-3 text-[13px]">{item.subject}</td>
                      <td className="px-3 text-[13px]">
                        {formatDateLabel(item.date)}
                      </td>
                      <td className="px-3 text-[13px]">
                        {formatNumber(item.participantCount)}
                      </td>
                      <td
                        className="px-3 text-[14px]"
                        style={{
                          color: theme.text.primary,
                          fontWeight: theme.font.weight.semibold,
                        }}
                      >
                        {formatAverageScore(item.averageScore)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Dialog open={createSubjectOpen} onOpenChange={setCreateSubjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
            <DialogDescription>
              Create a new subject for the question bank.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onCreateSubject}>
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="e.g. Operating System"
                required
              />
            </div>

            {createSubjectMutation.isError ? (
              <p className="text-sm text-destructive">
                {createSubjectMutation.error?.response?.data?.error ||
                  "Failed to create subject"}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={createSubjectMutation.isPending}>
                {createSubjectMutation.isPending
                  ? "Creating..."
                  : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TeacherShell>
  );
}
