import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTimer } from "@/hooks/useTimer";
import { useToast } from "@/hooks/useToast";
import { sessionService } from "@/services/sessionService";
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

    return (
        <p className="whitespace-pre-wrap text-base">{question.question_text}</p>
    );
}

export default function QuizPage() {
    const navigate = useNavigate();
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
    const totalSeconds = Number(
        payload?.durationSeconds || quiz?.duration_mins * 60 || 0,
    );
    const proctoringEnabled = Boolean(payload && sessionToken && !hasSubmitted);

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
            sessionService.saveProgress(
                { answers: partialAnswers },
                sessionToken,
            ),
        onSuccess: (data) => {
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
    });

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
            setResult(response);
            setHasSubmitted(true);
            toast({
                title: "Submitted",
                description: "Your answers have been submitted successfully.",
            });

            sessionStorage.removeItem(QUIZ_SESSION_TOKEN_KEY);
            sessionStorage.removeItem(QUIZ_SESSION_PAYLOAD_KEY);
        } catch (error) {
            setSubmitError(
                error?.response?.data?.error ||
                    "Failed to submit quiz. Please retry.",
            );
        }
    }, [answers, hasSubmitted, sessionToken, submitMutation]);

    const { secondsLeft } = useTimer({
        initialSeconds: totalSeconds,
        enabled: Boolean(payload && !hasSubmitted),
        onExpire: submitQuiz,
    });

    const answeredCount = Object.values(answers).filter(Boolean).length;

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
        if (!sessionToken || hasSubmitted || !payload) {
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
    }, [answers, hasSubmitted, payload, progressMutation, sessionToken]);

    // Handle option selection for any question
    const handleSelectOption = (questionId, optionKey) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionKey,
        }));
    };

    // --- Invalid session ---
    if (!payload || !quiz || !questions.length || !sessionToken) {
        return (
            <div className="min-h-screen bg-muted/30 px-4 py-8 flex items-center justify-center">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Invalid quiz session</CardTitle>
                        <CardDescription>
                            Start from your quiz entry link to begin the test.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // --- Success screen after submission ---
    if (hasSubmitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4">
                <CheckCircle2 className="text-green-500" size={80} />
                <h1 className="mt-6 text-2xl font-bold">Quiz Submitted!</h1>
                <p className="mt-2 text-muted-foreground text-center">
                    Your answers have been recorded successfully.
                </p>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                    {quiz.title}
                </p>
            </div>
        );
    }

    // --- Active quiz — all questions on one scrollable page ---
    return (
        <div className="min-h-screen bg-muted/30 px-4 py-4 pb-24">
            <div className="w-full max-w-md mx-auto flex flex-col gap-4">
                {/* Quiz header */}
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
                        <CountdownTimer
                            secondsLeft={secondsLeft}
                            totalSeconds={totalSeconds}
                        />
                    </CardHeader>
                </Card>

                {/* All questions */}
                {questions.map((question, index) => (
                    <Card key={question.id}>
                        <CardContent className="space-y-4 pt-6">
                            {/* Question text */}
                            <div className="space-y-2">
                                <p className="text-xs uppercase text-muted-foreground">
                                    Question {index + 1}
                                </p>
                                <QuestionContent question={question} />
                            </div>

                            {/* Options */}
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
                                            className={`flex items-center gap-3 w-full p-4 rounded-lg border cursor-pointer select-none transition-colors ${
                                                isSelected
                                                    ? "border-gray-900 dark:border-gray-100 bg-muted/60"
                                                    : "border-border hover:bg-muted/30"
                                            }`}
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
                ))}

                {/* Submit error */}
                {submitError ? (
                    <p className="text-sm font-medium text-destructive">
                        {submitError}
                    </p>
                ) : null}

                {/* Submit button */}
                <Button
                    type="button"
                    className="w-full h-12"
                    onClick={submitQuiz}
                    disabled={submitMutation.isPending}
                >
                    {submitMutation.isPending
                        ? "Submitting..."
                        : "Submit Quiz"}
                </Button>
            </div>
        </div>
    );
}
