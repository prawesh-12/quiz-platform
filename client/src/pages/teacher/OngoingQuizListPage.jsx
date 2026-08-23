import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import Spinner from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { quizService } from "@/services/quizService";
import { withJitter } from "@/utils/jitter";
import { theme } from "@/theme";

const LIVE_REFRESH_MS = 2000;

export default function OngoingQuizListPage() {
  const navigate = useNavigate();

  const ongoingQuery = useQuery({
    queryKey: ["quizzes", "active", "ongoing-list"],
    queryFn: () => quizService.list({ status: "active", page: 1, limit: 50 }),
    refetchInterval: () => withJitter(LIVE_REFRESH_MS),
    refetchIntervalInBackground: true
  });

  const quizzes = ongoingQuery.data?.quizzes ?? [];

  return (
    <>
      <div className="min-h-0 flex-1 space-y-4">
        <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
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
              <div
                key={quiz.id}
                className="flex flex-col gap-3 border p-3 transition-colors hover:border-[var(--ds-accent)] sm:flex-row sm:items-center sm:justify-between"
                style={{ borderRadius: theme.radius.lg, borderColor: theme.border.default }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: theme.text.primary }}>
                    {quiz.title}
                  </p>
                  <p className="truncate text-xs" style={{ color: theme.text.muted }}>
                    {quiz.subject_name || "-"}
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full sm:w-auto sm:shrink-0"
                  onClick={() => navigate(`/teacher/quiz/ongoing/${quiz.id}`)}
                >
                  Open Live View
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
