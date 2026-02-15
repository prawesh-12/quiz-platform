import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";

export default function OngoingQuizListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const ongoingQuery = useQuery({
    queryKey: ["quizzes", "active", "ongoing-list"],
    queryFn: () => quizService.list({ status: "active", page: 1, limit: 50 })
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
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ongoing Quizzes</CardTitle>
            <CardDescription>Select a live quiz to open the real-time monitoring view.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ongoingQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading active quizzes...</p> : null}
            {ongoingQuery.isError ? (
              <p className="text-sm text-destructive">{ongoingQuery.error?.response?.data?.error || "Failed to load active quizzes"}</p>
            ) : null}
            {!ongoingQuery.isLoading && quizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active quizzes right now.</p>
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
