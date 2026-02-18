import { useMemo, useState } from "react";
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
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
import { quizService } from "@/services/quizService";
import { responseService } from "@/services/responseService";
import { subjectService } from "@/services/subjectService";

const QUIZ_FETCH_LIMIT = 100;
const RESPONSE_FETCH_LIMIT = 100;

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
  const email = session?.email ? String(session.email).trim().toLowerCase() : "";
  if (email) {
    return `email:${email}`;
  }

  const rollNo = session?.roll_no ? String(session.roll_no).trim().toLowerCase() : "";
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
  if (!Number.isFinite(score) || !Number.isFinite(totalPoints) || totalPoints <= 0) {
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

  const [startDateInput, setStartDateInput] = useState(formatDateInput(defaultStart));
  const [endDateInput, setEndDateInput] = useState(formatDateInput(today));
  const [chartRange, setChartRange] = useState({
    start: defaultStart,
    end: today,
  });

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list(),
  });

  const analyticsQuery = useQuery({
    queryKey: ["dashboard", "analytics"],
    queryFn: async () => {
      const quizzes = await fetchAllQuizzes();
      const responseEligibleQuizzes = quizzes.filter((quiz) =>
        ["active", "ended"].includes(quiz.status)
      );

      const responsePages = await Promise.all(
        responseEligibleQuizzes.map(async (quiz) => {
          const responses = await fetchAllQuizResponses(quiz.id);
          return responses.map((session) => ({
            ...session,
            quiz_id: quiz.id,
            quiz_title: quiz.title,
          }));
        })
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

    const scheduledQuizzes = quizzes.filter((quiz) => quiz.status === "scheduled").length;
    const ongoingQuizzes = quizzes.filter((quiz) => quiz.status === "active").length;

    return {
      attemptsToday,
      newParticipantsToday,
      totalParticipants: participants.size,
      scheduledQuizzes,
      ongoingQuizzes,
    };
  }, [quizzes, sessions]);

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
      if (!selectedStats || value.participants.size > selectedStats.participants.size) {
        selectedStats = value;
      }
    }

    const averageScore =
      selectedStats?.scorePercents?.length
        ? selectedStats.scorePercents.reduce((sum, value) => sum + value, 0) /
          selectedStats.scorePercents.length
        : 0;

    const averageTime =
      selectedStats?.timeSeconds?.length
        ? selectedStats.timeSeconds.reduce((sum, value) => sum + value, 0) /
          selectedStats.timeSeconds.length
        : 0;

    return {
      participants: selectedStats?.participants.size ?? 0,
      averageScore,
      averageTime,
      quizName: selectedStats?.quizName || quizzes[0]?.title || "No quiz data yet",
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
      label: entry.date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
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
          ? item.scorePercents.reduce((sum, value) => sum + value, 0) / item.scorePercents.length
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
          ? subject.scorePercents.reduce((sum, value) => sum + value, 0) / subject.scorePercents.length
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
      label: "Total Quiz Attempts Today",
      value: formatNumber(kpiStats.attemptsToday),
      icon: ClipboardCheck,
      tint: "bg-[#fff2ee] text-[#c95345]",
    },
    {
      label: "New Participants Today",
      value: formatNumber(kpiStats.newParticipantsToday),
      icon: UserPlus,
      tint: "bg-[#f2edff] text-[#6441c7]",
    },
    {
      label: "Total Participants",
      value: formatNumber(kpiStats.totalParticipants),
      icon: Users,
      tint: "bg-[#fff6e7] text-[#b96b0f]",
    },
    {
      label: "Scheduled Quizzes",
      value: formatNumber(kpiStats.scheduledQuizzes),
      icon: CalendarClock,
      tint: "bg-[#fff3ef] text-[#cb5948]",
    },
    {
      label: "Ongoing Quizzes",
      value: formatNumber(kpiStats.ongoingQuizzes),
      icon: Activity,
      tint: "bg-[#f4eefe] text-[#6a46ca]",
    },
  ];

  const compactRecentQuizActivity = recentQuizActivity.slice(0, 4);
  const compactTopSubjects = topSubjects.slice(0, 4);

  return (
    <TeacherShell
      subjects={subjects}
      selectedSubjectId={null}
      onSelectSubject={(subjectId) => navigate(`/teacher/questions/${subjectId}`)}
      onOpenCreateSubject={() => setCreateSubjectOpen(true)}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
      showBackButton={false}
      contentScrollable={false}
      contentPaddingClass="p-3 md:p-4"
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_minmax(0,0.9fr)] gap-3">
        <section className="rounded-[1.55rem] border border-[#e4e8f4] bg-white px-4 py-3 shadow-[0_12px_26px_rgba(20,35,90,0.06)]">
          <h1 className="text-xl font-semibold text-[#192242]">Quiz Dashboard</h1>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {kpiCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className="rounded-[1.35rem] border border-[#e4e8f4] bg-white p-3 shadow-[0_12px_26px_rgba(20,35,90,0.06)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-medium text-slate-500">{card.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-[#192242]">{card.value}</p>
                  </div>
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.tint}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-[3fr_2fr]">
          <article className="rounded-[1.45rem] border border-[#e4e8f4] bg-white p-3 shadow-[0_12px_26px_rgba(20,35,90,0.06)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#192242]">Unique Participants</h2>
                <p className="text-xs text-slate-500">Trend view across the selected date range.</p>
              </div>

              <div className="flex flex-wrap items-end gap-1.5">
                <div>
                  <Label htmlFor="trend-start-date" className="text-[11px] font-semibold text-slate-500">
                    Start Date
                  </Label>
                  <Input
                    id="trend-start-date"
                    type="date"
                    value={startDateInput}
                    onChange={(event) => setStartDateInput(event.target.value)}
                    className="mt-1 h-8 w-[138px] rounded-lg border-[#d8e0f1] bg-[#fbfcff] text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="trend-end-date" className="text-[11px] font-semibold text-slate-500">
                    End Date
                  </Label>
                  <Input
                    id="trend-end-date"
                    type="date"
                    value={endDateInput}
                    onChange={(event) => setEndDateInput(event.target.value)}
                    className="mt-1 h-8 w-[138px] rounded-lg border-[#d8e0f1] bg-[#fbfcff] text-xs"
                  />
                </div>
                <Button
                  type="button"
                  className="h-8 rounded-lg bg-gradient-to-r from-[#ff6d61] to-[#ff8768] px-3 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(255,108,93,0.25)] hover:from-[#ff766a] hover:to-[#ff9073]"
                  onClick={loadTrendData}
                  disabled={analyticsQuery.isFetching}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Load Data
                </Button>
              </div>
            </div>

            <div className="mt-2 rounded-xl border border-[#e6ebf7] bg-[#fcfdff] p-2">
              {analyticsQuery.isLoading ? (
                <p className="text-xs text-slate-500">Loading dashboard analytics...</p>
              ) : null}

              {analyticsQuery.isError ? (
                <p className="text-xs text-rose-600">
                  {analyticsQuery.error?.response?.data?.error || "Failed to load dashboard analytics."}
                </p>
              ) : null}

              {!analyticsQuery.isLoading && !analyticsQuery.isError ? (
                <div className="h-[235px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="participantsAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff6d61" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#ff6d61" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#d7deef" strokeDasharray="4 5" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ stroke: "#ff6d61", strokeWidth: 1, strokeDasharray: "3 3" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 10px 22px rgba(15,23,42,0.08)",
                        }}
                        formatter={(value) => [`${value}`, "Participants"]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#ff6d61"
                        strokeWidth={2.75}
                        fill="url(#participantsAreaFill)"
                        activeDot={{ r: 4.5, fill: "#ff6d61", stroke: "#ffffff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>
          </article>

          <div className="flex min-h-0 flex-col gap-3">
            <article className="shrink-0 rounded-[1.45rem] border border-[#e4e8f4] bg-white p-3 shadow-[0_12px_26px_rgba(20,35,90,0.06)]">
              <h2 className="mb-2 text-base font-semibold text-[#192242]">Quiz Stats</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[#e9edf7] bg-[#fcfdff] p-2.5">
                  <div className="mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf4ff] text-[#2e5bd4]">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Participants</p>
                  <p className="mt-0.5 text-lg font-semibold text-[#192242]">{formatNumber(quizStats.participants)}</p>
                </div>
                <div className="rounded-xl border border-[#e9edf7] bg-[#fcfdff] p-2.5">
                  <div className="mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#f3ecff] text-[#6a43c5]">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Avg Score</p>
                  <p className="mt-0.5 text-lg font-semibold text-[#192242]">{formatAverageScore(quizStats.averageScore)}</p>
                </div>
                <div className="rounded-xl border border-[#e9edf7] bg-[#fcfdff] p-2.5">
                  <div className="mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff4e7] text-[#be700f]">
                    <Clock3 className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Avg Time</p>
                  <p className="mt-0.5 text-lg font-semibold text-[#192242]">{formatDuration(quizStats.averageTime)}</p>
                </div>
                <div className="rounded-xl border border-[#e9edf7] bg-[#fcfdff] p-2.5">
                  <div className="mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#ffeceb] text-[#ca5544]">
                    <BookOpenText className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Quiz Name</p>
                  <p className="mt-0.5 truncate text-lg font-semibold text-[#192242]">{quizStats.quizName}</p>
                </div>
              </div>
            </article>

            <article className="min-h-0 flex-1 rounded-[1.45rem] border border-[#e4e8f4] bg-white p-3 shadow-[0_12px_26px_rgba(20,35,90,0.06)]">
              <h2 className="mb-2 text-base font-semibold text-[#192242]">Top Performing Subjects</h2>
              <div className="scrollbar-hidden max-h-full space-y-2 overflow-y-auto pr-1">
                {compactTopSubjects.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#d3dcf3] bg-[#f8faff] p-3 text-xs text-slate-500">
                    Not enough data yet.
                  </p>
                ) : (
                  compactTopSubjects.map((subject) => (
                    <div key={subject.name} className="rounded-xl border border-[#e6ebf7] bg-[#fcfdff] p-2.5">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-[#192242]">{subject.name}</p>
                        <p className="text-[11px] font-semibold text-slate-500">
                          {formatAverageScore(subject.averageScore)}
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#edf1fb]">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-[#ff6d61] to-[#ff8d75]"
                          style={{ width: `${Math.max(6, Math.min(100, subject.averageScore))}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-[1.45rem] border border-[#e4e8f4] bg-white p-3 shadow-[0_12px_26px_rgba(20,35,90,0.06)]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[#192242]">Recent Quiz Activity</h2>
            <p className="text-[11px] text-slate-500">Last 4 quizzes</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#e5ebf7]">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-[#f8faff]">
                <tr className="text-left font-semibold uppercase tracking-[0.1em] text-slate-500">
                  <th className="px-3 py-2.5">Quiz</th>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Participants</th>
                  <th className="px-3 py-2.5">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {compactRecentQuizActivity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      No quiz activity available yet.
                    </td>
                  </tr>
                ) : (
                  compactRecentQuizActivity.map((item) => (
                    <tr key={item.id} className="border-t border-[#e9edf7] text-slate-700">
                      <td className="max-w-[220px] truncate px-3 py-2 font-medium text-[#192242]">{item.name}</td>
                      <td className="px-3 py-2">{item.subject}</td>
                      <td className="px-3 py-2">{formatDateLabel(item.date)}</td>
                      <td className="px-3 py-2">{formatNumber(item.participantCount)}</td>
                      <td className="px-3 py-2">{formatAverageScore(item.averageScore)}</td>
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
            <DialogDescription>Create a new subject for the question bank.</DialogDescription>
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
                {createSubjectMutation.error?.response?.data?.error || "Failed to create subject"}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={createSubjectMutation.isPending}>
                {createSubjectMutation.isPending ? "Creating..." : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TeacherShell>
  );
}
