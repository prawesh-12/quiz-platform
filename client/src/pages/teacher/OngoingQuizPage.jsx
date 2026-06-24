import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, RefreshCw, Trash2 } from "lucide-react";

import TeacherShell from "@/components/layout/TeacherShell";
import FlagBadge from "@/components/teacher/FlagBadge";
import ResponseTable from "@/components/teacher/ResponseTable";
import Spinner from "@/components/shared/Spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import Pagination from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTimer } from "@/hooks/useTimer";
import { quizService } from "@/services/quizService";
import { responseService } from "@/services/responseService";
import { subjectService } from "@/services/subjectService";
import { withJitter } from "@/utils/jitter";
import { violationService } from "@/services/violationService";
import { formatTime } from "@/utils/formatTime";

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

function formatDateOnly(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatOption(value) {
  if (!value) {
    return "-";
  }

  return String(value).toUpperCase();
}

function toMillis(value) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export default function OngoingQuizPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { quizId } = useParams();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const liveStatsQuery = useQuery({
    queryKey: ["live-stats", quizId],
    enabled: Boolean(quizId),
    queryFn: () => quizService.getLiveStats(quizId),
    refetchInterval: () => withJitter(5000)
  });

  const responsesQuery = useQuery({
    queryKey: ["quiz-responses", quizId, page, "ongoing"],
    enabled: Boolean(quizId),
    queryFn: () => responseService.getQuizResponses(quizId, { page, limit: 10 }),
    refetchInterval: () => withJitter(5000)
  });

  const detailsQuery = useQuery({
    queryKey: ["violations", "session", selectedSessionId, "ongoing"],
    enabled: detailsOpen && Boolean(selectedSessionId),
    queryFn: () => violationService.getBySession(selectedSessionId)
  });

  const stopMutation = useMutation({
    mutationFn: () => quizService.updateStatus(quizId, "ended"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["live-stats", quizId] });
      queryClient.invalidateQueries({ queryKey: ["quiz-responses", quizId] });
      setStopDialogOpen(false);
      toast({
        title: "Quiz ended",
        description: `Quiz ended. ${data.auto_submitted_count || 0} pending session(s) auto-submitted.`
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => quizService.delete(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      setDeleteDialogOpen(false);
      toast({ title: "Quiz deleted", description: "The quiz has been removed." });
      navigate("/teacher", { replace: true });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error?.response?.data?.error || "Could not delete quiz.",
        variant: "destructive"
      });
    }
  });

  const stats = liveStatsQuery.data?.stats;
  const quiz = liveStatsQuery.data?.quiz;
  const rows = responsesQuery.data?.responses || [];
  const subjects = subjectsQuery.data?.subjects || [];

  const isEnded = quiz?.status === "ended";
  const isScheduled = quiz?.status === "scheduled";
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [quizStartTimeMs, setQuizStartTimeMs] = useState(null);
  const durationSeconds = Math.max(
    0,
    Number(stats?.total_duration_seconds || quiz?.duration_mins * 60 || 0),
  );

  useEffect(() => {
    if (!quiz || !isScheduled) {
      return;
    }

    toast({
      title: "Quiz is scheduled",
      description: "This quiz has not started yet. Opening scheduled quizzes."
    });
    navigate("/teacher/quiz/scheduled", { replace: true });
  }, [isScheduled, navigate, quiz, toast]);

  useEffect(() => {
    if (!stats) {
      return undefined;
    }

    const nextServerNowMs = toMillis(stats.server_now);
    const nextQuizStartTimeMs = toMillis(stats.quiz_start_time);

    if (nextServerNowMs != null) {
      setServerOffsetMs(nextServerNowMs - Date.now());
    }

    if (nextQuizStartTimeMs != null) {
      setQuizStartTimeMs(nextQuizStartTimeMs);
    }
  }, [stats?.quiz_start_time, stats?.server_now, stats]);

  const getElapsedSeconds = useCallback(() => {
    if (isScheduled) {
      return 0;
    }

    if (quizStartTimeMs == null) {
      return Math.max(0, Number(stats?.elapsed_seconds || 0));
    }

    const serverNowMs = Date.now() + serverOffsetMs;
    const elapsed = Math.floor((serverNowMs - quizStartTimeMs) / 1000);
    if (durationSeconds > 0) {
      return Math.min(durationSeconds, Math.max(0, elapsed));
    }

    return Math.max(0, elapsed);
  }, [
    durationSeconds,
    isScheduled,
    quizStartTimeMs,
    serverOffsetMs,
    stats?.elapsed_seconds,
  ]);

  const { seconds: elapsedSeconds } = useTimer({
    initialSeconds: Math.max(0, Number(stats?.elapsed_seconds || 0)),
    // Freeze the running time once the quiz has ended — it's no longer running.
    enabled: Boolean(quiz) && !isScheduled && !isEnded,
    getSeconds: getElapsedSeconds,
  });

  // Auto-stop quiz when duration is reached
  const stopTriggeredRef = useRef(false);

  useEffect(() => {
    if (!quiz || isEnded || isScheduled || stopTriggeredRef.current) return;

    if (durationSeconds > 0 && elapsedSeconds >= durationSeconds) {
      stopTriggeredRef.current = true;
      stopMutation.mutate();
      toast({
        title: "Time Limit Reached",
        description: "The quiz duration has elapsed. Stopping responses...",
        variant: "default"
      });
    }
  }, [durationSeconds, elapsedSeconds, isEnded, isScheduled, quiz, stopMutation, toast]);

  const shareUrl = quiz?.access_token ? `${window.location.origin}/quiz/enter/${quiz.access_token}` : null;

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(
      () => toast({ title: "Link copied", description: "Quiz link copied to clipboard." }),
      () => toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" })
    );
  };

  const copyAccessCode = () => {
    if (!quiz?.access_code) return;
    navigator.clipboard.writeText(quiz.access_code).then(
      () => toast({ title: "Access code copied", description: "Access code copied to clipboard." }),
      () => toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" })
    );
  };



  // Manual refresh of the live table + stats. Min 500ms so the spinner is visible.
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        responsesQuery.refetch(),
        liveStatsQuery.refetch(),
        new Promise((resolve) => setTimeout(resolve, 500))
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const downloadExport = async () => {
    try {
      const { blob, filename } = await quizService.exportResults(quizId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename || `quiz_${quizId}_results.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Export ready", description: "Results download started." });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error?.response?.data?.error || "Could not export results.",
        variant: "destructive"
      });
    }
  };

  return (
    <TeacherShell
      subjects={subjects}
      selectedSubjectId={quiz?.subject_id || null}
      onSelectSubject={(subjectId) => navigate(`/teacher/questions/${subjectId}`)}
      onOpenCreateSubject={() => navigate("/teacher")}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="gap-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{quiz?.title || "Live Quiz View"}</CardTitle>
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                    <p>Subject: {quiz?.subject_name || "-"}</p>
                    <p>Batch: {quiz?.batch || "-"}</p>
                    <p>Division: {quiz?.division || "-"}</p>
                    <p>Group: {quiz?.group_nos || "-"}</p>
                    <p>Date: {formatDateOnly(quiz?.quiz_date)}</p>
                    <p>Duration: {quiz?.duration_mins || 0} mins</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {quiz?.access_code != null && quiz.access_code !== "" ? (
                    <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Access Code
                      </span>
                      <span className="font-mono text-sm font-semibold">{quiz.access_code}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={copyAccessCode}
                        title="Copy access code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                  {shareUrl ? (
                    <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={copyLink}>
                      <Copy className="mr-1.5 h-4 w-4" />
                      Copy quiz link
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Running Time
                  </p>
                  <p className="text-3xl font-semibold tabular-nums">{formatTime(elapsedSeconds)}</p>
                </div>
                <div className="pt-1">
                  {!isEnded ? (
                    <Button type="button" variant="destructive" className="w-full" onClick={() => setStopDialogOpen(true)}>
                      Stop Responses
                    </Button>
                  ) : (
                    <Button type="button" className="w-full" onClick={downloadExport}>
                      Export Results
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Students Entered</p>
              <p className="mt-1 text-2xl font-semibold leading-none">{stats?.total_entered ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Submitted</p>
              <p className="mt-1 text-2xl font-semibold leading-none">{stats?.submitted ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pending</p>
              <p className="mt-1 text-2xl font-semibold leading-none">{stats?.pending ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Flagged</p>
              <p className="mt-1 text-2xl font-semibold leading-none">{stats?.flagged ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle>Live Student Table</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {responsesQuery.isLoading ? <Spinner className="py-2" label="Loading responses..." /> : null}
            {responsesQuery.isError ? (
              <p className="text-sm text-destructive">{responsesQuery.error?.response?.data?.error || "Failed to load responses"}</p>
            ) : null}
            {!responsesQuery.isLoading && !responsesQuery.isError ? (
              <>
                <ResponseTable
                  rows={rows}
                  onOpenDetails={(sessionId) => {
                    setSelectedSessionId(sessionId);
                    setDetailsOpen(true);
                  }}
                />
                <Pagination
                  page={responsesQuery.data?.page || 1}
                  totalPages={responsesQuery.data?.totalPages || 1}
                  onPageChange={setPage}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Responses?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will immediately end the quiz. Students currently taking it will be unable to submit
              new answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={stopMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={stopMutation.isPending} onClick={() => stopMutation.mutate()}>
              {stopMutation.isPending ? "Stopping..." : "Confirm Stop"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quiz and all associated responses and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedSessionId(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>Q&A breakdown and violation timeline for this student session.</DialogDescription>
          </DialogHeader>

          {detailsQuery.isLoading ? <Spinner className="py-2" label="Loading session details..." /> : null}
          {detailsQuery.isError ? (
            <p className="text-sm text-destructive">{detailsQuery.error?.response?.data?.error || "Failed to load session details"}</p>
          ) : null}

          {detailsQuery.data ? (
            <ScrollArea className="max-h-[70vh] space-y-6 pr-2">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Q&A Breakdown</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Selected</TableHead>
                      <TableHead>Correct</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailsQuery.data.answers?.map((answer) => (
                      <TableRow key={answer.question_id}>
                        <TableCell>{answer.order_no}</TableCell>
                        <TableCell>{answer.question_text}</TableCell>
                        <TableCell>{formatOption(answer.selected_option)}</TableCell>
                        <TableCell>{formatOption(answer.correct_option)}</TableCell>
                        <TableCell>{answer.selected_option ? (answer.is_correct ? "Correct" : "Incorrect") : "Unanswered"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Violation Timeline</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailsQuery.data.violations?.length ? (
                      detailsQuery.data.violations.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDateTime(item.occurred_at)}</TableCell>
                          <TableCell>
                            <FlagBadge type={item.type} count={1} />
                          </TableCell>
                          <TableCell>{item.description || "-"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground">
                          No violations recorded.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </TeacherShell>
  );
}
