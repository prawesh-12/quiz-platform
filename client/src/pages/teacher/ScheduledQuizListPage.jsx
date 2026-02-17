import { useQuery } from "@tanstack/react-query";
import { Copy, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";

function formatDate(value) {
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
    hour12: true
  });
}

export default function ScheduledQuizListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const scheduledQuery = useQuery({
    queryKey: ["quizzes", "scheduled", "list"],
    queryFn: () => quizService.list({ status: "scheduled", page: 1, limit: 50 })
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const quizzes = scheduledQuery.data?.quizzes ?? [];

  const copyLink = (accessToken) => {
    const url = `${window.location.origin}/quiz/enter/${accessToken}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Quiz entry link copied to clipboard."
    });
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
      showBackButton={true}
    >
      <div className="min-h-0 flex-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Quizzes</CardTitle>
            <CardDescription>Quizzes scheduled to start automatically in the future.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading scheduled quizzes...</p> : null}
            {scheduledQuery.isError ? (
              <p className="text-sm text-destructive">{scheduledQuery.error?.response?.data?.error || "Failed to load scheduled quizzes"}</p>
            ) : null}
            {!scheduledQuery.isLoading && !scheduledQuery.isError && quizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scheduled quizzes found.</p>
            ) : null}

            {quizzes.map((quiz) => (
              <div key={quiz.id} className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-semibold">{quiz.title}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Subject:</span> {quiz.subject_name || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Starts:</span> {formatDate(quiz.scheduled_start)}
                    </p>
                    {quiz.access_code && (
                      <p>
                         <span className="font-medium text-foreground">Code:</span> {quiz.access_code}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(quiz.access_token)}
                    disabled={!quiz.access_token}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button type="button" size="sm" onClick={() => navigate(`/teacher/quiz/manual/${quiz.id}`)}>
                    View / Edit
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </TeacherShell>
  );
}
