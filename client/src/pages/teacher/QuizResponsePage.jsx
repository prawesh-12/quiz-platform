import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { useShellSubject } from "@/components/layout/shellOutletContext";
import ResponseTable from "@/components/teacher/ResponseTable";
import QuizDetailsDialog from "@/components/teacher/QuizDetailsDialog";
import SessionDetailsDialog from "@/components/teacher/SessionDetailsDialog";
import Spinner from "@/components/shared/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { exportQuizResults } from "@/components/teacher/exportQuizResults";
import { getQuizStatusTone } from "@/components/teacher/quizStatus";
import { responseService } from "@/services/responseService";
import { withJitter } from "@/utils/jitter";
import { violationService } from "@/services/violationService";
import { quizService } from "@/services/quizService";
import Pagination from "@/components/ui/pagination";
import { theme } from "@/theme";

const RESPONSES_PAGE_SIZE = 10;
const RESPONSES_REFRESH_MS = 10_000;

export default function QuizResponsePage() {
  const { quizId } = useParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("responses");
  const [page, setPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [quizDetailsOpen, setQuizDetailsOpen] = useState(false);

  const responsesQuery = useQuery({
    queryKey: ["quiz-responses", quizId, page],
    enabled: Boolean(quizId),
    queryFn: () => responseService.getQuizResponses(quizId, { page, limit: RESPONSES_PAGE_SIZE }),
    refetchInterval: () => withJitter(RESPONSES_REFRESH_MS)
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
  const statusTone = getQuizStatusTone(quiz?.status);

  useShellSubject(quiz?.subject_id || null);

  return (
    <>
      <div className="space-y-6">
        <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="break-words">{quiz?.title || "Quiz Responses"}</CardTitle>
              <CardDescription>
                {quiz?.subject_name || "-"} • {totalResponseCount} student session(s)
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="border-transparent"
                style={{ backgroundColor: statusTone.bg, color: statusTone.color }}
              >
                {statusTone.label}
              </Badge>
              <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => setQuizDetailsOpen(true)}>
                Quiz details
              </Button>
              <Button type="button" className="flex-1 sm:flex-none" onClick={() => exportQuizResults(quizId, toast)}>
                Export Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {responsesQuery.isLoading ? <Spinner className="py-2" label="Loading responses..." /> : null}
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
                            <Spinner label="Loading leaderboard..." />
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

      <QuizDetailsDialog
        open={quizDetailsOpen}
        onOpenChange={setQuizDetailsOpen}
        query={quizDetailsQuery}
        subjectName={quiz?.subject_name}
      />

      <SessionDetailsDialog
        open={detailsOpen}
        query={detailsQuery}
        showSummary
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
