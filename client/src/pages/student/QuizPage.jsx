import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useLocation } from "react-router-dom";

import CountdownTimer from "@/components/quiz/CountdownTimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useProctoring } from "@/hooks/useProctoring";
import { useTimer } from "@/hooks/useTimer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/useToast";
import { sessionService } from "@/services/sessionService";
import { theme } from "@/theme";
import {
    QUIZ_SESSION_PAYLOAD_KEY,
    QUIZ_SESSION_TOKEN_KEY,
} from "@/utils/sessionKeys";

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

function toMillis(value) {
    if (!value) {
        return null;
    }

    const timestamp =
        value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
        return null;
    }

    return timestamp;
}

function secondsUntil(targetMs, nowMs) {
    if (!targetMs) {
        return 0;
    }

    return Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
}

function QuestionContent({ question }) {
    if (!question) {
        return null;
    }

    if (question.has_equation) {
        return (
            <div className="space-y-2">
                <Badge variant="secondary">Equation</Badge>
                <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-base">
                    {question.question_text}
                </pre>
            </div>
        );
    }

    return <p className="whitespace-pre-wrap text-base">{question.question_text}</p>;
}

export default function QuizPage() {
    const location = useLocation();
    const [submitError, setSubmitError] = useState("");
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const { toast } = useToast();

    const statePayload = location.state;
    const storedPayload = useMemo(() => readStoredPayload(), []);
    const payload = statePayload?.sessionToken ? statePayload : storedPayload;

    const sessionToken =
        payload?.sessionToken ||
        sessionStorage.getItem(QUIZ_SESSION_TOKEN_KEY) ||
        "";
    const quiz = payload?.quiz || null;
    const questions = payload?.questions || [];

    const initialTotalDurationSeconds = Math.max(
        0,
        Number(
            payload?.totalDurationSeconds ||
                payload?.durationSeconds ||
                quiz?.duration_mins * 60 ||
                0,
        ),
    );

    const initialServerNowMs = toMillis(payload?.serverNow);
    const initialStartAtMs = toMillis(payload?.startTime || quiz?.scheduled_start);
    const fallbackEndMs = initialServerNowMs
        ? initialServerNowMs + initialTotalDurationSeconds * 1000
        : null;
    const initialEndAtMs =
        toMillis(payload?.endTime || quiz?.scheduled_end) || fallbackEndMs;

    const initialOffsetMs = initialServerNowMs
        ? initialServerNowMs - Date.now()
        : 0;

    const [serverOffsetMs, setServerOffsetMs] = useState(initialOffsetMs);
    const [totalDurationSeconds, setTotalDurationSeconds] = useState(
        initialTotalDurationSeconds,
    );
    const [countdownTotalSeconds, setCountdownTotalSeconds] = useState(() =>
        Math.max(1, Number(payload?.countdownToStartSeconds || 1)),
    );
    const [startAtMs, setStartAtMs] = useState(initialStartAtMs);
    const [endAtMs, setEndAtMs] = useState(initialEndAtMs);
    const initialDisplaySeconds =
        payload?.quizState === "scheduled"
            ? Math.max(0, Number(payload?.countdownToStartSeconds || 0))
            : initialEndAtMs
              ? secondsUntil(initialEndAtMs, Date.now() + initialOffsetMs)
              : initialTotalDurationSeconds;
    const [quizState, setQuizState] = useState(
        payload?.quizState ||
            (initialStartAtMs &&
            secondsUntil(initialStartAtMs, Date.now() + initialOffsetMs) > 0
                ? "scheduled"
                : "active"),
    );
    const autoSubmitTriggeredRef = useRef(false);

    const syncServerTiming = useCallback((response) => {
        if (response?.server_now) {
            const serverNowMs = toMillis(response.server_now);
            if (serverNowMs) {
                setServerOffsetMs(serverNowMs - Date.now());
            }
        }

        if (response?.start_time) {
            const nextStartMs = toMillis(response.start_time);
            if (nextStartMs) {
                setStartAtMs(nextStartMs);
            }
        }

        if (response?.end_time) {
            const nextEndMs = toMillis(response.end_time);
            if (nextEndMs) {
                setEndAtMs(nextEndMs);
            }
        }

        if (response?.countdown_to_start_secs != null) {
            setCountdownTotalSeconds(
                Math.max(1, Number(response.countdown_to_start_secs || 1)),
            );
        }

        if (response?.total_duration_secs != null) {
            setTotalDurationSeconds(
                Math.max(0, Number(response.total_duration_secs || 0)),
            );
        }

        if (response?.quiz_state) {
            setQuizState(response.quiz_state);
        }
    }, []);

    const proctoringEnabled = Boolean(
        payload && sessionToken && !hasSubmitted && quizState === "active",
    );

    useProctoring({
        sessionToken,
        enabled: proctoringEnabled,
    });

    const submitMutation = useMutation({
        mutationFn: ({ submittedAnswers }) =>
            sessionService.submit({ answers: submittedAnswers }, sessionToken),
    });

    const progressMutation = useMutation({
        mutationFn: ({ partialAnswers }) =>
            sessionService.saveProgress({ answers: partialAnswers }, sessionToken),
        onSuccess: (data) => {
            syncServerTiming(data);

            if (data?.session_closed) {
                setResult({
                    score: data.score ?? 0,
                    total_points: data.total_points ?? 0,
                    percentage: data.percentage ?? 0,
                    breakdown: Array.isArray(data.breakdown)
                        ? data.breakdown
                        : [],
                });
                setHasSubmitted(true);
                sessionStorage.removeItem(QUIZ_SESSION_TOKEN_KEY);
                sessionStorage.removeItem(QUIZ_SESSION_PAYLOAD_KEY);
                toast({
                    title: "Session ended",
                    description:
                        "This quiz is no longer accepting answers. Showing your results.",
                    variant: "destructive",
                });
            }
        },
        onError: (error) => {
            const apiData = error?.response?.data;
            if (apiData) {
                syncServerTiming(apiData);
            }

            if (apiData?.quiz_state === "ended") {
                setSubmitError(
                    apiData.error ||
                        "Quiz has ended. Responses are no longer accepted.",
                );
            }
        },
    });

    useEffect(() => {
        if (!sessionToken || hasSubmitted) {
            return undefined;
        }

        let isCurrent = true;

        const refreshTiming = async () => {
            try {
                const data = await sessionService.getTiming(sessionToken);
                if (!isCurrent) {
                    return;
                }

                syncServerTiming(data);
                if (data?.session_closed && data?.quiz_state === "ended") {
                    setSubmitError(
                        "Quiz has ended. Responses are no longer accepted.",
                    );
                }
            } catch (error) {
                if (!isCurrent) {
                    return;
                }

                const apiData = error?.response?.data;
                if (apiData) {
                    syncServerTiming(apiData);
                    setSubmitError(
                        apiData.error ||
                            "Unable to refresh quiz timing right now.",
                    );
                }
            }
        };

        refreshTiming();

        return () => {
            isCurrent = false;
        };
    }, [hasSubmitted, sessionToken, syncServerTiming]);

    const submitQuiz = useCallback(async () => {
        if (!sessionToken || hasSubmitted || submitMutation.isPending) {
            return;
        }

        setSubmitError("");

        const submittedAnswers = Object.entries(answers).map(
            ([questionId, selectedOption]) => ({
                question_id: Number(questionId),
                selected_option: selectedOption || null,
            }),
        );

        try {
            const response = await submitMutation.mutateAsync({
                submittedAnswers,
            });
            syncServerTiming(response);
            setResult(response);
            setHasSubmitted(true);
            toast({
                title: "Submitted",
                description: "Your answers have been submitted successfully.",
            });

            sessionStorage.removeItem(QUIZ_SESSION_TOKEN_KEY);
            sessionStorage.removeItem(QUIZ_SESSION_PAYLOAD_KEY);
        } catch (error) {
            const apiData = error?.response?.data;
            if (apiData) {
                syncServerTiming(apiData);
            }

            if (apiData?.quiz_state === "scheduled") {
                setSubmitError("Quiz has not started yet.");
                return;
            }

            if (apiData?.quiz_state === "ended") {
                setSubmitError(
                    apiData.error ||
                        "Quiz has ended. Responses are no longer accepted.",
                );
                return;
            }

            setSubmitError(
                apiData?.error || "Failed to submit quiz. Please retry.",
            );
        }
    }, [answers, hasSubmitted, sessionToken, submitMutation, syncServerTiming, toast]);

    const answeredCount = Object.values(answers).filter(Boolean).length;

    const getDisplaySeconds = useCallback(() => {
        const serverNowMs = Date.now() + serverOffsetMs;
        const untilStart = secondsUntil(startAtMs, serverNowMs);
        const untilEnd = endAtMs
            ? secondsUntil(endAtMs, serverNowMs)
            : totalDurationSeconds;

        if (untilStart > 0) {
            setQuizState((prev) => (prev === "scheduled" ? prev : "scheduled"));
            return untilStart;
        }

        if (untilEnd > 0) {
            setQuizState((prev) => (prev === "active" ? prev : "active"));
            return untilEnd;
        }

        setQuizState((prev) => (prev === "ended" ? prev : "ended"));
        return 0;
    }, [endAtMs, serverOffsetMs, startAtMs, totalDurationSeconds]);

    const { seconds: timerSeconds } = useTimer({
        initialSeconds: initialDisplaySeconds,
        enabled: Boolean(payload) && !hasSubmitted,
        getSeconds: getDisplaySeconds,
    });

    const secondsUntilStart = quizState === "scheduled" ? timerSeconds : 0;
    const secondsLeft =
        quizState === "scheduled" ? 0 : timerSeconds;

    useEffect(() => {
        if (timerSeconds > 0) {
            autoSubmitTriggeredRef.current = false;
        }
    }, [timerSeconds]);

    useEffect(() => {
        if (!payload || hasSubmitted || quizState !== "ended") {
            return;
        }

        if (!autoSubmitTriggeredRef.current) {
            autoSubmitTriggeredRef.current = true;
            submitQuiz();
        }
    }, [hasSubmitted, payload, quizState, submitQuiz]);

    // Block browser back button after submission
    useEffect(() => {
        if (!hasSubmitted) {
            return undefined;
        }

        window.history.pushState(null, "", window.location.href);

        const handlePopState = () => {
            window.history.pushState(null, "", window.location.href);
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [hasSubmitted]);

    useEffect(() => {
        if (!sessionToken || hasSubmitted || !payload || quizState !== "active") {
            return undefined;
        }

        const timeout = window.setTimeout(() => {
            const partialAnswers = Object.entries(answers).map(
                ([questionId, selectedOption]) => ({
                    question_id: Number(questionId),
                    selected_option: selectedOption || null,
                }),
            );

            if (partialAnswers.length) {
                progressMutation.mutate({ partialAnswers });
            }
        }, 600);

        return () => window.clearTimeout(timeout);
    }, [
        answers,
        hasSubmitted,
        payload,
        progressMutation,
        quizState,
        sessionToken,
    ]);

    const handleSelectOption = (questionId, optionKey) => {
        if (quizState !== "active") {
            return;
        }

        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionKey,
        }));
    };

    if (!payload || !quiz || !questions.length || !sessionToken) {
        return (
            <div className="ds-shell-page px-4 py-8">
                <Card className="mx-auto w-full max-w-md">
                    <CardHeader>
                        <CardTitle style={{ color: theme.text.primary }}>Invalid quiz session</CardTitle>
                        <CardDescription>
                            Start from your quiz entry link to begin the test.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (hasSubmitted) {
        const breakdown = Array.isArray(result?.breakdown) ? result.breakdown : [];
        const correctCount = breakdown.filter((item) => item.is_correct).length;
        const attemptedCount = breakdown.filter((item) => item.selected_option).length;

        return (
            <div className="ds-shell-page flex-col px-4 py-8">
                <CheckCircle2 size={80} style={{ color: theme.text.green }} />
                <h1 className="mt-6 text-2xl font-bold" style={{ color: theme.text.primary }}>
                    Quiz Submitted!
                </h1>
                <p className="mt-2 text-muted-foreground text-center">
                    Your answers have been recorded successfully.
                </p>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                    {quiz.title}
                </p>
                {result ? (
                    <Card className="mt-6 w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-lg">Your Results</CardTitle>
                            <CardDescription>Score summary and question breakdown.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-md border p-2 text-center">
                                    <p className="text-muted-foreground">Score</p>
                                    <p className="font-semibold">{Number(result.score ?? 0)} / {Number(result.total_points ?? 0)}</p>
                                </div>
                                <div className="rounded-md border p-2 text-center">
                                    <p className="text-muted-foreground">Percentage</p>
                                    <p className="font-semibold">{Number(result.percentage ?? 0)}%</p>
                                </div>
                                <div className="rounded-md border p-2 text-center">
                                    <p className="text-muted-foreground">Correct</p>
                                    <p className="font-semibold">{correctCount} / {breakdown.length || questions.length}</p>
                                </div>
                                <div className="rounded-md border p-2 text-center">
                                    <p className="text-muted-foreground">Attempted</p>
                                    <p className="font-semibold">{attemptedCount} / {breakdown.length || questions.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        );
    }

    const waitingTotalSeconds = Math.max(
        1,
        Number(countdownTotalSeconds || secondsUntilStart || 1),
    );

    return (
        <div className="h-full overflow-y-auto px-4 py-4 pb-24" style={{ backgroundColor: theme.bg.page }}>
            <div className="w-full max-w-md mx-auto flex flex-col gap-4">
                <Card>
                    <CardHeader className="space-y-3">
                        <div>
                            <CardTitle>{quiz.title}</CardTitle>
                            <CardDescription>
                                {quiz.subject_name || "Subject"} •{" "}
                                {questions.length} Questions
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="w-fit">
                            Answered: {answeredCount} / {questions.length}
                        </Badge>
                        {quizState === "scheduled" ? (
                            <CountdownTimer
                                secondsLeft={secondsUntilStart}
                                totalSeconds={waitingTotalSeconds}
                            />
                        ) : (
                            <CountdownTimer
                                secondsLeft={secondsLeft}
                                totalSeconds={Math.max(1, totalDurationSeconds)}
                            />
                        )}
                    </CardHeader>
                </Card>

                {quizState === "scheduled" ? (
                    <Card>
                        <CardContent className="space-y-2 pt-6 text-center">
                            <p className="text-sm font-medium text-muted-foreground">
                                Quiz has not started yet.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Your attempt will start automatically when the scheduled
                                start time is reached.
                            </p>
                        </CardContent>
                    </Card>
                ) : null}

                {quizState === "active"
                    ? questions.map((question, index) => (
                          <Card key={question.id}>
                              <CardContent className="space-y-4 pt-6">
                                  <div className="space-y-2">
                                      <p className="text-xs uppercase text-muted-foreground">
                                          Question {index + 1}
                                      </p>
                                      <QuestionContent question={question} />
                                  </div>

                                  <RadioGroup className="space-y-3">
                                      {["a", "b", "c", "d"].map((optionKey) => {
                                          const optionValue =
                                              question?.[`option_${optionKey}`];
                                          if (!optionValue) {
                                              return null;
                                          }

                                          const isSelected =
                                              answers[question.id] === optionKey;
                                          const inputId = `question-${question.id}-option-${optionKey}`;

                                          return (
                                              <div
                                                  key={optionKey}
                                                  className={`flex w-full cursor-pointer select-none items-center gap-3 rounded-[var(--ds-radius-md)] border p-4 transition-colors ${
                                                      isSelected
                                                          ? "bg-[var(--ds-bg-card-hover)]"
                                                          : "hover:bg-[var(--ds-bg-content)]"
                                                  }`}
                                                  style={{
                                                      borderColor: isSelected ? theme.text.primary : theme.border.default,
                                                  }}
                                                  onClick={() =>
                                                      handleSelectOption(
                                                          question.id,
                                                          optionKey,
                                                      )
                                                  }
                                              >
                                                  <RadioGroupItem
                                                      id={inputId}
                                                      value={optionKey}
                                                      checked={isSelected}
                                                      onChange={() =>
                                                          handleSelectOption(
                                                              question.id,
                                                              optionKey,
                                                          )
                                                      }
                                                  />
                                                  <Label
                                                      htmlFor={inputId}
                                                      className="w-full cursor-pointer text-base select-none"
                                                  >
                                                      {optionValue}
                                                  </Label>
                                              </div>
                                          );
                                      })}
                                  </RadioGroup>
                              </CardContent>
                          </Card>
                      ))
                    : null}

                {submitError ? (
                    <p className="text-sm font-medium text-destructive">
                        {submitError}
                    </p>
                ) : null}

                <Button
                    type="button"
                    className="w-full h-12"
                    onClick={submitQuiz}
                    disabled={submitMutation.isPending || quizState !== "active"}
                >
                    {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
                </Button>
            </div>
        </div>
    );
}
