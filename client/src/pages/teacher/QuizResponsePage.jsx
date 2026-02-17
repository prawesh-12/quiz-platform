import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import FlagBadge from "@/components/teacher/FlagBadge";
import ResponseTable from "@/components/teacher/ResponseTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { responseService } from "@/services/responseService";
import { subjectService } from "@/services/subjectService";
import { violationService } from "@/services/violationService";
import { quizService } from "@/services/quizService";
import Pagination from "@/components/ui/pagination";

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

function formatOption(option) {
  if (!option) {
    return "-";
  }

  return String(option).toUpperCase();
}

function formatAnswerResult(answer) {
  if (!answer.selected_option) {
    return "Unanswered";
  }

  return answer.is_correct ? "Correct" : "Incorrect";
}

function formatDateOnly(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatOptionLabel(option) {
  if (!option) return "-";
  return String(option).toUpperCase();
}

export default function QuizResponsePage() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("responses");
  const [page, setPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [quizDetailsOpen, setQuizDetailsOpen] = useState(false);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const responsesQuery = useQuery({
    queryKey: ["quiz-responses", quizId, page],
    enabled: Boolean(quizId),
    queryFn: () => responseService.getQuizResponses(quizId, { page, limit: 10 }),
    refetchInterval: 10000
  });

  const leaderboardQuery = useQuery({
    queryKey: ["quiz-leaderboard", quizId],
    enabled: Boolean(quizId),
    queryFn: () => quizService.getLeaderboard(quizId)
  });

  const detailsQuery = useQuery({
    queryKey: ["violations", "session", selectedSessionId],
    enabled: detailsOpen && Boolean(selectedSessionId),
    queryFn: () => violationService.getBySession(selectedSessionId)
  });

  const quizDetailsQuery = useQuery({
    queryKey: ["quizzes", quizId, "details"],
    enabled: quizDetailsOpen && Boolean(quizId),
    queryFn: () => quizService.getById(quizId)
  });

  const quiz = responsesQuery.data?.quiz || null;
  const responseRows = responsesQuery.data?.responses || [];
  const totalResponseCount = responsesQuery.data?.count || responseRows.length;
  const subjects = subjectsQuery.data?.subjects || [];
  const selectedSubjectId = quiz?.subject_id || null;

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
      toast({ title: "Export started", description: "Results download has started." });
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
      selectedSubjectId={selectedSubjectId}
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
              <CardTitle>{quiz?.title || "Quiz Responses"}</CardTitle>
              <CardDescription>
                {quiz?.subject_name || "-"} • {totalResponseCount} student session(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={quiz?.status === "active" ? "default" : "secondary"}>{quiz?.status || "-"}</Badge>
              <Button type="button" variant="outline" onClick={() => setQuizDetailsOpen(true)}>
                Quiz details
              </Button>
              <Button type="button" onClick={downloadExport}>
                Export Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {responsesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading responses...</p> : null}
            {responsesQuery.isError ? (
              <p className="text-sm text-destructive">{responsesQuery.error?.response?.data?.error || "Failed to load responses"}</p>
            ) : null}

            {!responsesQuery.isLoading && !responsesQuery.isError ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="responses">Responses</TabsTrigger>
                  <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                </TabsList>

                <TabsContent value="responses" className="space-y-3">
                  <ResponseTable
                    rows={responseRows}
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
                </TabsContent>

                <TabsContent value="leaderboard">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Time Taken (sec)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardQuery.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-muted-foreground">
                            Loading leaderboard...
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {leaderboardQuery.isError ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-destructive">
                            {leaderboardQuery.error?.response?.data?.error || "Failed to load leaderboard"}
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {!leaderboardQuery.isLoading &&
                      !leaderboardQuery.isError &&
                      (leaderboardQuery.data?.leaderboard || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-muted-foreground">
                            No leaderboard data yet.
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {(leaderboardQuery.data?.leaderboard || []).map((row) => (
                        <TableRow key={row.session_id}>
                          <TableCell>{row.rank}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.roll_no}</TableCell>
                          <TableCell>
                            {row.score ?? "-"} / {row.total_points ?? "-"}
                          </TableCell>
                          <TableCell>{row.time_taken_secs ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={quizDetailsOpen} onOpenChange={setQuizDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quiz Details</DialogTitle>
            <DialogDescription>Full quiz configuration and questions (read-only).</DialogDescription>
          </DialogHeader>

          {quizDetailsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading quiz details...</p>
          ) : null}
          {quizDetailsQuery.isError ? (
            <p className="text-sm text-destructive">
              {quizDetailsQuery.error?.response?.data?.error || "Failed to load quiz details"}
            </p>
          ) : null}

          {quizDetailsQuery.data ? (
            <ScrollArea className="max-h-[70vh] pr-2">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Quiz Title</p>
                    <p className="text-sm font-medium">{quizDetailsQuery.data.quiz?.title || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Subject</p>
                    <p className="text-sm">{quiz?.subject_name ?? quizDetailsQuery.data.quiz?.subject_id ?? "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Duration (mins)</p>
                    <p className="text-sm">{quizDetailsQuery.data.quiz?.duration_mins ?? "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Batch</p>
                    <p className="text-sm">{quizDetailsQuery.data.quiz?.batch || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Division</p>
                    <p className="text-sm">{quizDetailsQuery.data.quiz?.division || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Group</p>
                    <p className="text-sm">{quizDetailsQuery.data.quiz?.group_nos || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Quiz Date</p>
                    <p className="text-sm">{formatDateOnly(quizDetailsQuery.data.quiz?.quiz_date)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Access Code</p>
                    <p className="text-sm font-mono">{quizDetailsQuery.data.quiz?.access_code || "-"}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground">Scheduled Start</p>
                    <p className="text-sm">{quizDetailsQuery.data.quiz?.scheduled_start ? formatDateTime(quizDetailsQuery.data.quiz.scheduled_start) : "-"}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground">Scheduled End</p>
                    <p className="text-sm">{quizDetailsQuery.data.quiz?.scheduled_end ? formatDateTime(quizDetailsQuery.data.quiz.scheduled_end) : "-"}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="mb-3 text-sm font-semibold">Questions</h3>
                  <div className="space-y-4">
                    {(quizDetailsQuery.data.questions || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No questions.</p>
                    ) : (
                      (quizDetailsQuery.data.questions || []).map((q, index) => (
                        <Card key={q.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              Q{index + 1}. {q.question_text || "-"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1.5 text-sm">
                            <p><span className="text-muted-foreground">A.</span> {q.option_a ?? "-"}</p>
                            <p><span className="text-muted-foreground">B.</span> {q.option_b ?? "-"}</p>
                            {(q.option_c != null && q.option_c !== "") ? <p><span className="text-muted-foreground">C.</span> {q.option_c}</p> : null}
                            {(q.option_d != null && q.option_d !== "") ? <p><span className="text-muted-foreground">D.</span> {q.option_d}</p> : null}
                            <p className="pt-2 font-medium text-muted-foreground">
                              Correct: {formatOptionLabel(q.correct_option)}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

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
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Student:</span> {detailsQuery.data.session?.name || "-"}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Score:</span>{" "}
                  {detailsQuery.data.session?.score ?? "-"} / {detailsQuery.data.session?.total_points ?? "-"}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Total Violations:</span>{" "}
                  {detailsQuery.data.summary?.total_violations ?? 0}
                </p>
              </div>

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
                        <TableCell>{formatAnswerResult(answer)}</TableCell>
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
