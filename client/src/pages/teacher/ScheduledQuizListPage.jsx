import { useQuery } from "@tanstack/react-query";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import Copy from "lucide-react/dist/esm/icons/copy";
import KeyRound from "lucide-react/dist/esm/icons/key-round";
import LinkIcon from "lucide-react/dist/esm/icons/link";
import Timer from "lucide-react/dist/esm/icons/timer";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import Spinner from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";
import { withJitter } from "@/utils/jitter";
import { theme } from "@/theme";

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ScheduledQuizListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const LIVE_REFRESH_MS = 3000;

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list(),
  });

  const scheduledQuery = useQuery({
    queryKey: ["quizzes", "scheduled", "detailed-list"],
    queryFn: () => quizService.list({ status: "scheduled", page: 1, limit: 100 }),
    refetchInterval: () => withJitter(LIVE_REFRESH_MS),
    refetchIntervalInBackground: true,
  });

  const ongoingQuery = useQuery({
    queryKey: ["quizzes", "active", "scheduled-context"],
    queryFn: () => quizService.list({ status: "active", page: 1, limit: 50 }),
    refetchInterval: () => withJitter(LIVE_REFRESH_MS),
    refetchIntervalInBackground: true,
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const scheduledQuizzes = scheduledQuery.data?.quizzes ?? [];
  const ongoingQuizzes = ongoingQuery.data?.quizzes ?? [];

  const copyLink = async (accessToken) => {
    if (!accessToken) {
      toast({
        title: "Missing access token",
        description: "This quiz does not have an access link yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = `${window.location.origin}/quiz/enter/${accessToken}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Quiz entry link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy quiz link.",
        variant: "destructive",
      });
    }
  };

  return (
    <TeacherShell
      subjects={subjects}
      selectedSubjectId={null}
      onSelectSubject={(subjectId) => navigate(`/teacher/questions/${subjectId}`)}
      onOpenCreateSubject={() => navigate("/teacher")}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
    >
      <div className="min-h-0 flex-1 space-y-4">
        <Card className="rounded-[12px]" style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}>
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-[24px]" style={{ color: theme.text.primary }}>
              Scheduled Quizzes
            </CardTitle>
            <CardDescription>
              All upcoming quizzes with details, access codes, and quick-copy links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledQuery.isLoading ? (
              <Spinner className="py-2" label="Loading scheduled quizzes..." />
            ) : null}

            {scheduledQuery.isError ? (
              <p className="text-sm text-destructive">
                {scheduledQuery.error?.response?.data?.error || "Failed to load scheduled quizzes"}
              </p>
            ) : null}

            {!scheduledQuery.isLoading && !scheduledQuery.isError && scheduledQuizzes.length === 0 ? (
              <div
                className="space-y-3 rounded-[12px] border border-dashed p-4"
                style={{ borderColor: theme.border.default, backgroundColor: theme.bg.content }}
              >
                <p className="text-[13px]" style={{ color: theme.text.secondary }}>
                  No scheduled quizzes found.
                </p>
                {ongoingQuizzes.length > 0 ? (
                  <Button type="button" variant="outline" onClick={() => navigate("/teacher/quiz/ongoing")}>
                    <Timer className="h-4 w-4" />
                    Open Ongoing Quizzes ({ongoingQuizzes.length})
                  </Button>
                ) : null}
              </div>
            ) : null}

            {scheduledQuizzes.map((quiz) => {
              const quizLink = quiz.access_token
                ? `${window.location.origin}/quiz/enter/${quiz.access_token}`
                : "Not available";

              return (
                <article
                  key={quiz.id}
                  className="rounded-[12px] border p-4"
                  style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <p className="break-words text-[15px]" style={{ color: theme.text.primary, fontWeight: theme.font.weight.semibold }}>
                        {quiz.title}
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-[13px] md:grid-cols-2" style={{ color: theme.text.secondary }}>
                        <p>
                          <span style={{ fontWeight: theme.font.weight.semibold, color: theme.text.primary }}>Subject:</span>{" "}
                          {quiz.subject_name || "-"}
                        </p>
                        <p className="inline-flex items-center gap-1">
                          <CalendarClock className="h-4 w-4" style={{ color: theme.text.subtle }} />
                          <span>{formatDateTime(quiz.scheduled_start)}</span>
                        </p>
                        <p>
                          <span style={{ fontWeight: theme.font.weight.semibold, color: theme.text.primary }}>Ends:</span>{" "}
                          {formatDateTime(quiz.scheduled_end)}
                        </p>
                        <p className="inline-flex items-center gap-1">
                          <KeyRound className="h-4 w-4" style={{ color: theme.text.subtle }} />
                          <span>
                            <span style={{ fontWeight: theme.font.weight.semibold, color: theme.text.primary }}>
                              Access Code:
                            </span>{" "}
                            {quiz.access_code || "-"}
                          </span>
                        </p>
                        <p className="inline-flex items-center gap-1 md:col-span-2">
                          <LinkIcon className="h-4 w-4" style={{ color: theme.text.subtle }} />
                          <span className="truncate">
                            <span style={{ fontWeight: theme.font.weight.semibold, color: theme.text.primary }}>Quiz Link:</span>{" "}
                            {quizLink}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-[var(--ds-radius-md)] sm:w-auto"
                        onClick={() => copyLink(quiz.access_token)}
                        disabled={!quiz.access_token}
                      >
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </Button>
                      <Button
                        type="button"
                        className="w-full rounded-[var(--ds-radius-md)] sm:w-auto"
                        onClick={() => navigate(`/teacher/quiz/manual/${quiz.id}`)}
                      >
                        View / Edit
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </TeacherShell>
  );
}
