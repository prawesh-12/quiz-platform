import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Copy, KeyRound, Link as LinkIcon, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";

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
    refetchInterval: LIVE_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  const ongoingQuery = useQuery({
    queryKey: ["quizzes", "active", "scheduled-context"],
    queryFn: () => quizService.list({ status: "active", page: 1, limit: 50 }),
    refetchInterval: LIVE_REFRESH_MS,
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
      showBackButton={false}
    >
      <div className="min-h-0 flex-1 space-y-4">
        <Card className="rounded-[1.5rem] border-[#e4e8f4] shadow-[0_14px_30px_rgba(20,35,90,0.06)]">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl text-[#192242]">Scheduled Quizzes</CardTitle>
            <CardDescription>
              All upcoming quizzes with details, access codes, and quick-copy links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading scheduled quizzes...</p>
            ) : null}

            {scheduledQuery.isError ? (
              <p className="text-sm text-destructive">
                {scheduledQuery.error?.response?.data?.error || "Failed to load scheduled quizzes"}
              </p>
            ) : null}

            {!scheduledQuery.isLoading && !scheduledQuery.isError && scheduledQuizzes.length === 0 ? (
              <div className="space-y-3 rounded-xl border border-dashed border-[#d3dcf3] bg-[#f8faff] p-4">
                <p className="text-sm text-slate-600">No scheduled quizzes found.</p>
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
                  className="rounded-2xl border border-[#e3e8f5] bg-white p-4 shadow-[0_10px_24px_rgba(15,25,56,0.05)]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-[#18203d]">{quiz.title}</p>
                      <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <p>
                          <span className="font-semibold text-[#243162]">Subject:</span> {quiz.subject_name || "-"}
                        </p>
                        <p className="inline-flex items-center gap-1">
                          <CalendarClock className="h-4 w-4 text-slate-400" />
                          <span>{formatDateTime(quiz.scheduled_start)}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-[#243162]">Ends:</span> {formatDateTime(quiz.scheduled_end)}
                        </p>
                        <p className="inline-flex items-center gap-1">
                          <KeyRound className="h-4 w-4 text-slate-400" />
                          <span>
                            <span className="font-semibold text-[#243162]">Access Code:</span> {quiz.access_code || "-"}
                          </span>
                        </p>
                        <p className="inline-flex items-center gap-1 md:col-span-2">
                          <LinkIcon className="h-4 w-4 text-slate-400" />
                          <span className="truncate">
                            <span className="font-semibold text-[#243162]">Quiz Link:</span> {quizLink}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-[#d8e0f3] bg-[#f9fbff]"
                        onClick={() => copyLink(quiz.access_token)}
                        disabled={!quiz.access_token}
                      >
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </Button>
                      <Button
                        type="button"
                        className="rounded-xl"
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
