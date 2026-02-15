import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import FlagBadge from "@/components/teacher/FlagBadge";
import ResponseTable from "@/components/teacher/ResponseTable";
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
import { quizService } from "@/services/quizService";
import { responseService } from "@/services/responseService";
import { subjectService } from "@/services/subjectService";
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

function formatOption(value) {
  if (!value) {
    return "-";
  }

  return String(value).toUpperCase();
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

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const liveStatsQuery = useQuery({
    queryKey: ["live-stats", quizId],
    enabled: Boolean(quizId),
    queryFn: () => quizService.getLiveStats(quizId),
    refetchInterval: 5000
  });

  const responsesQuery = useQuery({
    queryKey: ["quiz-responses", quizId, page, "ongoing"],
    enabled: Boolean(quizId),
    queryFn: () => responseService.getQuizResponses(quizId, { page, limit: 10 }),
    refetchInterval: 5000
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

  const stats = liveStatsQuery.data?.stats;
  const quiz = liveStatsQuery.data?.quiz;
  const rows = responsesQuery.data?.responses || [];
  const subjects = subjectsQuery.data?.subjects || [];

  const isEnded = quiz?.status === "ended";

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
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{quiz?.title || "Live Quiz View"}</CardTitle>
              <p className="text-sm text-muted-foreground">Subject: {quiz?.subject_name || "-"}</p>
              <p className="text-sm text-muted-foreground">
                Batch: {quiz?.batch || "-"} • Division: {quiz?.division || "-"} • Group: {quiz?.group_nos || "-"}
              </p>
              <p className="text-sm text-muted-foreground">Date: {quiz?.quiz_date || "-"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Running Time</p>
              <p className="text-3xl font-bold">{formatTime(stats?.elapsed_seconds || 0)}</p>
              {!isEnded ? (
                <Button type="button" variant="destructive" className="mt-3" onClick={() => setStopDialogOpen(true)}>
                  Stop Responses
                </Button>
              ) : (
                <Button type="button" className="mt-3" onClick={downloadExport}>
                  Export Results
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-3 md:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Total Students Entered</p>
              <p className="text-2xl font-semibold">{stats?.total_entered ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="text-2xl font-semibold">{stats?.submitted ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold">{stats?.pending ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Flagged</p>
              <p className="text-2xl font-semibold">{stats?.flagged ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Live Student Table</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {responsesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading responses...</p> : null}
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

          {detailsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading session details...</p> : null}
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
