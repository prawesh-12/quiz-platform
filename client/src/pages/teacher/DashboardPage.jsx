import { lazy, Suspense, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Activity from "lucide-react/dist/esm/icons/activity";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import BookOpenText from "lucide-react/dist/esm/icons/book-open-text";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import ClipboardCheck from "lucide-react/dist/esm/icons/clipboard-check";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import Users from "lucide-react/dist/esm/icons/users";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import Spinner from "@/components/shared/Spinner";
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
import { dashboardService } from "@/services/dashboardService";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";
import { withJitter } from "@/utils/jitter";
import { theme } from "@/theme";

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
        refetchInterval: () => withJitter(5_000),
        refetchIntervalInBackground: true,
    });

    const summaryQuery = useQuery({
        queryKey: ["dashboard", "summary"],
        queryFn: () => dashboardService.getSummary("teachers"),
        staleTime: 30_000,
    });

    const trendRangeStart = formatDateInput(chartRange.start);
    const trendRangeEnd = formatDateInput(chartRange.end);

    const trendQuery = useQuery({
        queryKey: ["dashboard", "trend", trendRangeStart, trendRangeEnd],
        queryFn: () =>
            dashboardService.getTrend("teachers", {
                start: trendRangeStart,
                end: trendRangeEnd,
            }),
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
    const summary = summaryQuery.data;
    const counts = summary?.counts ?? {};
    const kpis = summary?.kpis ?? {};
    const summaryQuizzes = summary?.quizzes ?? [];
    const summarySubjects = summary?.subjects ?? [];
    const totalQuizCount = counts.total ?? summaryQuizzes.length;
    const scheduledQuizCount =
        liveQuizStatusQuery.data?.scheduled ?? counts.scheduled ?? 0;
    const ongoingQuizCount =
        liveQuizStatusQuery.data?.active ?? counts.active ?? 0;

    const kpiStats = useMemo(
        () => ({
            attemptsToday: kpis.attempts_today ?? 0,
            newParticipantsToday: kpis.new_participants_today ?? 0,
            totalParticipants: kpis.total_participants ?? 0,
            scheduledQuizzes: scheduledQuizCount,
            ongoingQuizzes: ongoingQuizCount,
        }),
        [
            kpis.attempts_today,
            kpis.new_participants_today,
            kpis.total_participants,
            ongoingQuizCount,
            scheduledQuizCount,
        ],
    );

    const quizStats = useMemo(() => {
        let selected = null;
        for (const quiz of summaryQuizzes) {
            if (
                !selected ||
                (quiz.participants ?? 0) > (selected.participants ?? 0)
            ) {
                selected = quiz;
            }
        }

        return {
            participants: selected?.participants ?? 0,
            averageScore: selected?.avg_score_percent ?? 0,
            averageTime: selected?.avg_time_seconds ?? 0,
            quizName:
                selected?.quiz_title ||
                summaryQuizzes[0]?.quiz_title ||
                "No quiz yet",
        };
    }, [summaryQuizzes]);

    const trendData = useMemo(() => {
        const start = startOfDay(chartRange.start);
        const end = startOfDay(chartRange.end);

        const pointsByDay = new Map();
        for (const point of trendQuery.data?.points ?? []) {
            pointsByDay.set(point.day, point.participants ?? 0);
        }

        const entries = [];
        const cursor = new Date(start);
        while (cursor <= end) {
            const key = formatDateInput(cursor);
            entries.push({
                date: key,
                label: cursor.toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                }),
                value: pointsByDay.get(key) ?? 0,
            });
            cursor.setDate(cursor.getDate() + 1);
        }

        return entries;
    }, [chartRange.end, chartRange.start, trendQuery.data]);

    const recentQuizActivity = useMemo(() => {
        return summaryQuizzes
            .map((quiz) => ({
                id: quiz.quiz_id,
                name: quiz.quiz_title || "Untitled Quiz",
                subject: quiz.subject_name || "Unassigned",
                date: quiz.quiz_date || quiz.created_at || null,
                participantCount: quiz.participants,
                averageScore: quiz.avg_score_percent ?? 0,
            }))
            .sort((left, right) => {
                const leftTime = left.date ? new Date(left.date).getTime() : 0;
                const rightTime = right.date
                    ? new Date(right.date).getTime()
                    : 0;
                return rightTime - leftTime;
            })
            .slice(0, 5);
    }, [summaryQuizzes]);

    const totalAttempts = useMemo(
        () =>
            summaryQuizzes.reduce(
                (sum, quiz) => sum + (quiz.attempts ?? 0),
                0,
            ),
        [summaryQuizzes],
    );

    const topSubjects = useMemo(() => {
        return summarySubjects
            .map((subject) => ({
                name: subject.subject_name,
                participantCount: subject.participants,
                averageScore: subject.avg_score_percent ?? 0,
            }))
            .sort((left, right) => right.averageScore - left.averageScore)
            .slice(0, 5);
    }, [summarySubjects]);

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
                        const labelFontSize =
                            card.label.length > 20 ? "10.5px" : "11px";
                        const cardContent = (
                            <div className="flex h-full min-h-[90px] items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p
                                        style={{
                                            fontSize: labelFontSize,
                                            color: theme.text.muted,
                                            fontWeight:
                                                theme.font.weight.medium,
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
                            "min-h-[102px] min-w-0 flex-1 rounded-[12px] border p-[16px] px-5";
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

                <section className="ds-dashboard-middle-row mb-4 flex shrink-0 items-start gap-4">
                    <article
                        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border p-4 sm:p-6"
                        style={{
                            borderColor: theme.border.default,
                            backgroundColor: theme.bg.card,
                        }}
                    >
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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

                            <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
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
                                    onChange={(event) =>
                                        setStartDateInput(event.target.value)
                                    }
                                    className="h-8 w-full px-2 text-[12px] sm:w-[120px]"
                                    style={{
                                        border: "1px solid #E4E4E4",
                                        borderRadius: "8px",
                                        height: "32px",
                                        padding: "0 8px",
                                        fontSize: "12px",
                                    }}
                                />
                            </div>
                            <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
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
                                    onChange={(event) =>
                                        setEndDateInput(event.target.value)
                                    }
                                    className="h-8 w-full px-2 text-[12px] sm:w-[120px]"
                                    style={{
                                        border: "1px solid #E4E4E4",
                                        borderRadius: "8px",
                                        height: "32px",
                                        padding: "0 8px",
                                        fontSize: "12px",
                                    }}
                                />
                            </div>
                            <Button
                                type="button"
                                className="h-8 w-full shrink-0 justify-center whitespace-nowrap text-[13px] sm:w-auto"
                                style={{
                                    background: "#1C1C1E",
                                    color: "#FFFFFF",
                                    borderRadius: "8px",
                                    padding: "7px 14px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                }}
                                onClick={loadTrendData}
                                disabled={trendQuery.isFetching}
                            >
                                <TrendingUp className="h-3.5 w-3.5" />
                                Load Data
                            </Button>
                        </div>

                        <div
                            className="flex flex-col overflow-hidden rounded-[14px] border p-4"
                            style={{
                                borderColor: theme.border.default,
                                backgroundColor: theme.bg.card,
                            }}
                        >
                            {summaryQuery.isLoading ? (
                                <Spinner
                                    className="py-2"
                                    label="Loading dashboard analytics..."
                                />
                            ) : null}

                            {summaryQuery.isError ? (
                                <p
                                    className="text-[12px]"
                                    style={{ color: theme.text.accent }}
                                >
                                    {summaryQuery.error?.response?.data
                                        ?.error ||
                                        "Failed to load dashboard analytics."}
                                </p>
                            ) : null}

                            {!summaryQuery.isLoading &&
                            !summaryQuery.isError ? (
                                <div className="h-[260px] min-h-[260px] w-full">
                                    <Suspense
                                        fallback={
                                            <div className="flex h-full items-center justify-center">
                                                <Spinner label="Loading chart..." />
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

                    <div className="ds-dashboard-right-col self-start flex w-[320px] shrink-0 flex-col gap-3">
                        <article
                            className="rounded-[14px] border p-4 sm:p-5"
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
                                        className="text-[18px]"
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
                                        style={{
                                            color: theme.badge.blue.color,
                                        }}
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
                                        className="text-[18px]"
                                        style={{
                                            color: theme.text.primary,
                                            fontWeight: theme.font.weight.bold,
                                        }}
                                    >
                                        {formatAverageScore(
                                            quizStats.averageScore,
                                        )}
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
                                        className="text-[18px]"
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
                                        className="truncate text-[16px] leading-tight"
                                        style={{
                                            color: theme.text.primary,
                                            fontWeight:
                                                theme.font.weight.semibold,
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
                                        className="text-[18px]"
                                        style={{
                                            color: theme.text.primary,
                                            fontWeight: theme.font.weight.bold,
                                        }}
                                    >
                                        {formatNumber(totalQuizCount)}
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
                                        className="text-[18px]"
                                        style={{
                                            color: theme.text.primary,
                                            fontWeight: theme.font.weight.bold,
                                        }}
                                    >
                                        {formatNumber(totalAttempts)}
                                    </p>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>

                <section
                    className="min-h-0 flex-1 rounded-[14px] border p-4 sm:p-5"
                    style={{
                        borderColor: theme.border.default,
                        backgroundColor: theme.bg.card,
                        overflow: "hidden",
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
                        <p
                            className="text-[12px]"
                            style={{ color: theme.text.subtle }}
                        >
                            Last 4 quizzes
                        </p>
                    </div>
                    <div className="ds-dashboard-table-wrap overflow-x-auto">
                        <table className="ds-dashboard-table w-full border-collapse">
                            <thead
                                style={{ backgroundColor: theme.bg.content }}
                            >
                                <tr
                                    className="h-10 border-b"
                                    style={{
                                        borderBottomColor: theme.border.default,
                                    }}
                                >
                                    <th
                                        className="px-3 text-left text-[12px]"
                                        style={{
                                            color: theme.text.muted,
                                            fontWeight:
                                                theme.font.weight.medium,
                                        }}
                                    >
                                        Quiz
                                    </th>
                                    <th
                                        className="px-3 text-left text-[12px]"
                                        style={{
                                            color: theme.text.muted,
                                            fontWeight:
                                                theme.font.weight.medium,
                                        }}
                                    >
                                        Subject
                                    </th>
                                    <th
                                        className="px-3 text-left text-[12px]"
                                        style={{
                                            color: theme.text.muted,
                                            fontWeight:
                                                theme.font.weight.medium,
                                        }}
                                    >
                                        Date
                                    </th>
                                    <th
                                        className="px-3 text-left text-[12px]"
                                        style={{
                                            color: theme.text.muted,
                                            fontWeight:
                                                theme.font.weight.medium,
                                        }}
                                    >
                                        Participants
                                    </th>
                                    <th
                                        className="px-3 text-left text-[12px]"
                                        style={{
                                            color: theme.text.muted,
                                            fontWeight:
                                                theme.font.weight.medium,
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
                                        style={{
                                            borderBottomColor:
                                                theme.border.light,
                                        }}
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
                                                borderBottomColor:
                                                    theme.border.light,
                                                color: theme.text.secondary,
                                            }}
                                        >
                                            <td
                                                className="max-w-[220px] truncate px-3 text-[14px]"
                                                style={{
                                                    color: theme.text.primary,
                                                    fontWeight:
                                                        theme.font.weight
                                                            .medium,
                                                }}
                                            >
                                                {item.name}
                                            </td>
                                            <td className="px-3 text-[13px]">
                                                {item.subject}
                                            </td>
                                            <td className="px-3 text-[13px]">
                                                {formatDateLabel(item.date)}
                                            </td>
                                            <td className="px-3 text-[13px]">
                                                {formatNumber(
                                                    item.participantCount,
                                                )}
                                            </td>
                                            <td
                                                className="px-3 text-[14px]"
                                                style={{
                                                    color: theme.text.primary,
                                                    fontWeight:
                                                        theme.font.weight
                                                            .semibold,
                                                }}
                                            >
                                                {formatAverageScore(
                                                    item.averageScore,
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <Dialog
                open={createSubjectOpen}
                onOpenChange={setCreateSubjectOpen}
            >
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
                                onChange={(event) =>
                                    setSubjectName(event.target.value)
                                }
                                placeholder="e.g. Operating System"
                                required
                            />
                        </div>

                        {createSubjectMutation.isError ? (
                            <p className="text-sm text-destructive">
                                {createSubjectMutation.error?.response?.data
                                    ?.error || "Failed to create subject"}
                            </p>
                        ) : null}

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={createSubjectMutation.isPending}
                            >
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
