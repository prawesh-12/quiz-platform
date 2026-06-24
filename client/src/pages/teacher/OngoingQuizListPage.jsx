import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import Spinner from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";
import { withJitter } from "@/utils/jitter";

export default function OngoingQuizListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const LIVE_REFRESH_MS = 2000;

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const ongoingQuery = useQuery({
    queryKey: ["quizzes", "active", "ongoing-list"],
    queryFn: () => quizService.list({ status: "active", page: 1, limit: 50 }),
    refetchInterval: () => withJitter(LIVE_REFRESH_MS),
    refetchIntervalInBackground: true
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const quizzes = ongoingQuery.data?.quizzes ?? [];

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
        <Card>
          <CardHeader>
            <CardTitle>Ongoing Quizzes</CardTitle>
            <CardDescription>Active quizzes you can monitor in real time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ongoingQuery.isLoading ? <Spinner className="py-2" label="Loading active quizzes..." /> : null}
            {ongoingQuery.isError ? (
              <p className="text-sm text-destructive">{ongoingQuery.error?.response?.data?.error || "Failed to load active quizzes"}</p>
            ) : null}
            {!ongoingQuery.isLoading && !ongoingQuery.isError && quizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active quizzes right now. Start one from the dashboard.</p>
            ) : null}

            {quizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-semibold">{quiz.title}</p>
                  <p className="text-xs text-muted-foreground">{quiz.subject_name || "-"}</p>
                </div>
                <Button type="button" onClick={() => navigate(`/teacher/quiz/ongoing/${quiz.id}`)}>
                  Open Live View
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </TeacherShell>
  );
}
