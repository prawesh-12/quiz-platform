import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Copy from "lucide-react/dist/esm/icons/copy";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";

import { useShellSubject } from "@/components/layout/shellOutletContext";
import LiveQuizHeader from "@/components/teacher/LiveQuizHeader";
import LiveQuizStats from "@/components/teacher/LiveQuizStats";
import ResponseTable from "@/components/teacher/ResponseTable";
import SessionDetailsDialog from "@/components/teacher/SessionDetailsDialog";
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
import Pagination from "@/components/ui/pagination";
import { useToast } from "@/hooks/useToast";
import { exportQuizResults } from "@/components/teacher/exportQuizResults";
import { useLiveQuizElapsed } from "@/pages/teacher/useLiveQuizElapsed";
import { quizService } from "@/services/quizService";
import { responseService } from "@/services/responseService";
import { withJitter } from "@/utils/jitter";
import { violationService } from "@/services/violationService";
import { theme } from "@/theme";

const LIVE_REFRESH_MS = 5000;
const RESPONSES_PAGE_SIZE = 10;
const MIN_REFRESH_SPINNER_MS = 500;
const SECONDS_PER_MINUTE = 60;

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

export default function OngoingQuizPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { quizId } = useParams();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const liveStatsQuery = useQuery({
    queryKey: ["live-stats", quizId],
    enabled: Boolean(quizId),
    queryFn: () => quizService.getLiveStats(quizId),
    refetchInterval: () => withJitter(LIVE_REFRESH_MS)
  });

  const responsesQuery = useQuery({
    queryKey: ["quiz-responses", quizId, page, "ongoing"],
    enabled: Boolean(quizId),
    queryFn: () => responseService.getQuizResponses(quizId, { page, limit: RESPONSES_PAGE_SIZE }),
    refetchInterval: () => withJitter(LIVE_REFRESH_MS)
  });

  const detailsQuery = useQuery({
    queryKey: ["violations", "session", selectedSessionId, "ongoing"],
    enabled: detailsOpen && Boolean(selectedSessionId),
    queryFn: () => violationService.getBySession(selectedSessionId)
  });

  // Flips the UI to "ended" instantly so an in-flight poll reporting "active" can't bounce the button back.
  const [stoppedLocally, setStoppedLocally] = useState(false);

  const stopMutation = useMutation({
    mutationFn: () => quizService.updateStatus(quizId, "ended"),
    onMutate: () => {
      setStoppedLocally(true);
      setStopDialogOpen(false);
      queryClient.setQueryData(["live-stats", quizId], (current) =>
        current?.quiz ? { ...current, quiz: { ...current.quiz, status: "ended" } } : current
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["live-stats", quizId] });
      queryClient.invalidateQueries({ queryKey: ["quiz-responses", quizId] });
      toast({
        title: "Quiz ended",
        description: `Quiz ended. ${data.auto_submitted_count || 0} pending session(s) auto-submitted.`
      });
    },
    onError: (error) => {
      setStoppedLocally(false);
      queryClient.invalidateQueries({ queryKey: ["live-stats", quizId] });
      toast({
        title: "Couldn't stop the quiz",
        description: error?.response?.data?.error || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const stats = liveStatsQuery.data?.stats;
  const quiz = liveStatsQuery.data?.quiz;
  const rows = responsesQuery.data?.responses || [];

  useShellSubject(quiz?.subject_id || null);

  const isEnded = stoppedLocally || quiz?.status === "ended";
  const isScheduled = quiz?.status === "scheduled";
  const durationSeconds = Math.max(
    0,
    Number(stats?.total_duration_seconds || quiz?.duration_mins * SECONDS_PER_MINUTE || 0),
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

  const elapsedSeconds = useLiveQuizElapsed({
    stats,
    durationSeconds,
    isScheduled,
    isRunning: Boolean(quiz) && !isScheduled && !isEnded,
  });

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

  const copyToClipboard = (value, successTitle) => {
    if (!value) {
      return;
    }

    navigator.clipboard.writeText(value).then(
      () => toast({ title: successTitle, description: "Copied to clipboard." }),
      () => toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" })
    );
  };

  // Padded with a minimum delay so the spinner is visible on fast refetches.
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        responsesQuery.refetch(),
        liveStatsQuery.refetch(),
        new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_SPINNER_MS))
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <LiveQuizHeader
          quiz={quiz}
          quizDate={formatDateOnly(quiz?.quiz_date)}
          shareUrl={shareUrl}
          elapsedSeconds={elapsedSeconds}
          isEnded={isEnded}
          onCopyLink={() => copyToClipboard(shareUrl, "Link copied")}
          onCopyAccessCode={() => copyToClipboard(quiz?.access_code, "Access code copied")}
          onStop={() => setStopDialogOpen(true)}
          onExport={() => exportQuizResults(quizId, toast)}
        />

        <LiveQuizStats stats={stats} />

        <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
          <CardHeader className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle style={{ color: theme.text.primary }}>Live Student Table</CardTitle>
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

      <SessionDetailsDialog
        open={detailsOpen}
        query={detailsQuery}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedSessionId(null);
          }
        }}
      />
    </>
  );
}
