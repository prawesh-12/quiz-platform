import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import CountdownTimer from "@/components/quiz/CountdownTimer";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProctoring } from "@/hooks/useProctoring";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useTimer } from "@/hooks/useTimer";
import { useToast } from "@/hooks/useToast";
import { sessionService } from "@/services/sessionService";
import { QUIZ_SESSION_PAYLOAD_KEY, QUIZ_SESSION_TOKEN_KEY } from "@/utils/sessionKeys";

function readStoredPayload() {
  const raw = sessionStorage.getItem(QUIZ_SESSION_PAYLOAD_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function QuestionContent({ question }) {
  if (!question) {
    return null;
  }

  if (question.has_equation) {
    return (
      <div className="space-y-2">
        <Badge variant="secondary">Equation</Badge>
        <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">{question.question_text}</pre>
      </div>
    );
  }

  return <p className="whitespace-pre-wrap text-sm">{question.question_text}</p>;
}

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  const statePayload = location.state;
  const storedPayload = useMemo(() => readStoredPayload(), []);
  const payload = statePayload?.sessionToken ? statePayload : storedPayload;

  const sessionToken = payload?.sessionToken || sessionStorage.getItem(QUIZ_SESSION_TOKEN_KEY) || "";
  const quiz = payload?.quiz || null;
  const questions = payload?.questions || [];
  const totalSeconds = Number(payload?.durationSeconds || quiz?.duration_mins * 60 || 0);
  const proctoringEnabled = Boolean(payload && sessionToken && !hasSubmitted);

  useProctoring({
    sessionToken,
    enabled: proctoringEnabled
  });

  const submitMutation = useMutation({
    mutationFn: ({ submittedAnswers }) => sessionService.submit({ answers: submittedAnswers }, sessionToken)
  });

  const progressMutation = useMutation({
    mutationFn: ({ partialAnswers }) => sessionService.saveProgress({ answers: partialAnswers }, sessionToken)
  });

  const submitQuiz = useCallback(async () => {
    if (!sessionToken || hasSubmitted || submitMutation.isPending) {
      return;
    }

    setSubmitError("");

    const submittedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
      question_id: Number(questionId),
      selected_option: selectedOption || null
    }));

    try {
      const response = await submitMutation.mutateAsync({ submittedAnswers });
      setResult(response);
      setHasSubmitted(true);
      toast({ title: "Submitted", description: "Your answers have been submitted successfully." });

      sessionStorage.removeItem(QUIZ_SESSION_TOKEN_KEY);
      sessionStorage.removeItem(QUIZ_SESSION_PAYLOAD_KEY);
    } catch (error) {
      setSubmitError(error?.response?.data?.error || "Failed to submit quiz. Please retry.");
    }
  }, [answers, hasSubmitted, sessionToken, submitMutation]);

  const { secondsLeft } = useTimer({
    initialSeconds: totalSeconds,
    enabled: Boolean(payload && !hasSubmitted),
    onExpire: submitQuiz
  });

  const currentQuestion = questions[currentQuestionIndex] || null;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const progressLabel = questions.length ? `${currentQuestionIndex + 1} / ${questions.length}` : "0 / 0";

  useEffect(() => {
    if (!sessionToken || hasSubmitted || !payload) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const partialAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        question_id: Number(questionId),
        selected_option: selectedOption || null
      }));

      if (partialAnswers.length) {
        progressMutation.mutate({ partialAnswers });
      }
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [answers, hasSubmitted, payload, progressMutation, sessionToken]);

  if (!payload || !quiz || !questions.length || !sessionToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid quiz session</CardTitle>
            <CardDescription>Start from your quiz entry link to begin the test.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasSubmitted) {
    const breakdown = result?.breakdown || [];

    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Results Summary</CardTitle>
            <CardDescription>Your submission is complete.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm">
              Score:{" "}
              <span className="font-semibold">
                {result?.score ?? 0} / {result?.total_points ?? 0}
              </span>
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Percentage: {result?.percentage ?? 0}%</p>
              <Progress value={result?.percentage ?? 0} />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Your Answer</TableHead>
                  <TableHead>Correct Answer</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.map((item) => (
                  <TableRow key={item.question_id}>
                    <TableCell>{item.order_no}</TableCell>
                    <TableCell>{item.question_text}</TableCell>
                    <TableCell>{item.selected_option ? String(item.selected_option).toUpperCase() : "-"}</TableCell>
                    <TableCell>{item.correct_option ? String(item.correct_option).toUpperCase() : "-"}</TableCell>
                    <TableCell>
                      {!item.selected_option ? (
                        "Unanswered"
                      ) : item.is_correct ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Check className="h-4 w-4" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <X className="h-4 w-4" />
                          Incorrect
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground">You may close this tab.</p>
            <Button
              type="button"
              className="w-full"
              onClick={() =>
                navigate(payload.accessToken ? `/quiz/enter/${payload.accessToken}` : "/login", { replace: true })
              }
            >
              Exit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>
                  {quiz.subject_name || "Subject"} • Question {progressLabel}
                </CardDescription>
              </div>
              <Badge variant="outline">
                Answered: {answeredCount} / {questions.length}
              </Badge>
            </div>
            <CountdownTimer secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <p className="text-xs uppercase text-muted-foreground">Question {currentQuestionIndex + 1}</p>
              <QuestionContent question={currentQuestion} />
            </div>

            <RadioGroup className="space-y-3">
              {["a", "b", "c", "d"].map((optionKey) => {
                const optionValue = currentQuestion?.[`option_${optionKey}`];
                if (!optionValue) {
                  return null;
                }

                const inputId = `question-${currentQuestion.id}-option-${optionKey}`;

                return (
                  <div key={optionKey} className="flex items-center gap-2 rounded-md border p-3">
                    <RadioGroupItem
                      id={inputId}
                      value={optionKey}
                      checked={answers[currentQuestion.id] === optionKey}
                      onChange={(event) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [currentQuestion.id]: event.target.value
                        }))
                      }
                    />
                    <Label htmlFor={inputId} className="w-full cursor-pointer text-sm">
                      {optionValue}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            {submitError ? <p className="text-sm font-medium text-destructive">{submitError}</p> : null}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                  disabled={currentQuestionIndex >= questions.length - 1}
                >
                  Next
                </Button>
                <Button type="button" onClick={() => setSubmitDialogOpen(true)} disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit quiz now?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitMutation.isPending}
              onClick={async () => {
                setSubmitDialogOpen(false);
                await submitQuiz();
              }}
            >
              Confirm Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
