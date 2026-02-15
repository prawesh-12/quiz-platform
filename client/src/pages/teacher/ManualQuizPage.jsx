import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import QuestionBuilder from "@/components/teacher/QuestionBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DateTimePicker from "@/components/ui/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { parseQuestionsExcel } from "@/utils/excelParser";
import { questionService } from "@/services/questionService";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";

function createEmptyQuestion() {
  return {
    id: crypto.randomUUID(),
    question_text: "",
    options: [
      { key: "a", value: "" },
      { key: "b", value: "" }
    ],
    correct_option: "a",
    points: 1,
    has_equation: false,
    allow_multiple_answers: false,
    is_required: true
  };
}

function mapBackendQuestionToBuilder(question) {
  const options = [
    { key: "a", value: question.option_a || "" },
    { key: "b", value: question.option_b || "" }
  ];

  if (question.option_c) {
    options.push({ key: "c", value: question.option_c });
  }

  if (question.option_d) {
    options.push({ key: "d", value: question.option_d });
  }

  return {
    id: String(question.id),
    question_text: question.question_text,
    options,
    correct_option: question.correct_option,
    points: question.points || 1,
    has_equation: Boolean(question.has_equation),
    allow_multiple_answers: Boolean(question.allow_multiple_answers),
    is_required: Boolean(question.is_required)
  };
}

function mapBuilderQuestionToApi(question) {
  const optionsMap = Object.fromEntries(question.options.map((option) => [option.key, option.value]));

  return {
    question_text: question.question_text,
    option_a: optionsMap.a || "",
    option_b: optionsMap.b || "",
    option_c: optionsMap.c || null,
    option_d: optionsMap.d || null,
    correct_option: question.correct_option,
    points: Number(question.points || 1),
    has_equation: Boolean(question.has_equation),
    allow_multiple_answers: Boolean(question.allow_multiple_answers),
    is_required: Boolean(question.is_required)
  };
}

function mapPreviewQuestion(question) {
  const options = [
    { key: "a", value: question.option_a || "" },
    { key: "b", value: question.option_b || "" }
  ];

  if (question.option_c) {
    options.push({ key: "c", value: question.option_c });
  }

  if (question.option_d) {
    options.push({ key: "d", value: question.option_d });
  }

  return {
    id: String(question.id),
    question_text: question.question_text,
    options,
    correct_option: question.correct_option
  };
}

function hasInvalidScheduleRange(start, end) {
  if (!start || !end) {
    return false;
  }

  const startValue = new Date(start).getTime();
  const endValue = new Date(end).getTime();
  if (Number.isNaN(startValue) || Number.isNaN(endValue)) {
    return false;
  }

  return endValue < startValue;
}

function moveItem(list, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= list.length) {
    return list;
  }

  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export default function ManualQuizPage() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("Untitled quiz");
  const [subjectId, setSubjectId] = useState("");
  const [durationMins, setDurationMins] = useState(15);
  const [batch, setBatch] = useState("");
  const [division, setDivision] = useState("");
  const [groupNos, setGroupNos] = useState("");
  const [quizDate, setQuizDate] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [pageError, setPageError] = useState("");

  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [importSubjectId, setImportSubjectId] = useState("");
  const [importStatus, setImportStatus] = useState("");

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const isExistingQuiz = Boolean(quizId);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const subjects = subjectsQuery.data?.subjects ?? [];

  const quizDetailQuery = useQuery({
    queryKey: ["quizzes", quizId],
    enabled: isExistingQuiz,
    queryFn: () => quizService.getById(quizId)
  });

  const previewQuery = useQuery({
    queryKey: ["quizzes", quizId, "preview"],
    enabled: isExistingQuiz && previewDialogOpen,
    queryFn: () => quizService.getPreview(quizId)
  });

  useEffect(() => {
    if (!subjects.length || subjectId) {
      return;
    }

    setSubjectId(String(subjects[0].id));
    setImportSubjectId(String(subjects[0].id));
  }, [subjectId, subjects]);

  useEffect(() => {
    if (!quizDetailQuery.data) {
      return;
    }

    const { quiz, questions: quizQuestions } = quizDetailQuery.data;

    setTitle(quiz.title || "Untitled quiz");
    setSubjectId(String(quiz.subject_id || ""));
    setImportSubjectId(String(quiz.subject_id || ""));
    setDurationMins(quiz.duration_mins || 15);
    setBatch(quiz.batch || "");
    setDivision(quiz.division || "");
    setGroupNos(quiz.group_nos || "");
    setQuizDate(quiz.quiz_date || "");
    setScheduledStart(quiz.scheduled_start ? String(quiz.scheduled_start).slice(0, 16) : "");
    setScheduledEnd(quiz.scheduled_end ? String(quiz.scheduled_end).slice(0, 16) : "");
    setAccessCode(quiz.access_code || "");
    setQuestions(quizQuestions.length ? quizQuestions.map(mapBackendQuestionToBuilder) : [createEmptyQuestion()]);
  }, [quizDetailQuery.data]);

  const createSubjectMutation = useMutation({
    mutationFn: (payload) => subjectService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setSubjectName("");
      setSubjectDialogOpen(false);

      if (data?.subject?.id) {
        setSubjectId(String(data.subject.id));
        setImportSubjectId(String(data.subject.id));
      }
    }
  });

  const saveManualMutation = useMutation({
    mutationFn: (payload) => quizService.createManual(payload)
  });

  const updateQuizMutation = useMutation({
    mutationFn: ({ id, payload }) => quizService.update(id, payload)
  });

  const selectedSubjectName = useMemo(
    () => subjects.find((subject) => String(subject.id) === String(subjectId))?.name || "-",
    [subjectId, subjects]
  );
  const previewTitle = isExistingQuiz ? previewQuery.data?.quiz?.title || title : title;
  const previewDuration = Number(isExistingQuiz ? previewQuery.data?.quiz?.duration_mins || durationMins : durationMins);
  const previewQuestions = isExistingQuiz
    ? (previewQuery.data?.questions || []).map(mapPreviewQuestion)
    : questions.map((question) => ({
        id: question.id,
        question_text: question.question_text,
        options: question.options,
        correct_option: question.correct_option
      }));

  const validateQuestions = () => {
    if (!questions.length) {
      return "Add at least one question";
    }

    for (let index = 0; index < questions.length; index += 1) {
      const item = questions[index];
      const optionsMap = Object.fromEntries(item.options.map((option) => [option.key, option.value.trim()]));

      if (!item.question_text.trim()) {
        return `Question ${index + 1}: question text is required`;
      }

      if (!optionsMap.a || !optionsMap.b) {
        return `Question ${index + 1}: option A and B are required`;
      }

      if (!item.options.some((option) => option.key === item.correct_option && option.value.trim())) {
        return `Question ${index + 1}: valid correct option is required`;
      }
    }

    return null;
  };

  const buildQuizPayload = () => ({
    title: title.trim() || "Untitled quiz",
    subject_id: Number(subjectId),
    duration_mins: Number(durationMins || 15),
    batch: batch || null,
    division: division || null,
    group_nos: groupNos || null,
    quiz_date: quizDate || null,
    scheduled_start: scheduledStart || null,
    scheduled_end: scheduledEnd || null,
    access_code: accessCode || null,
    status: "draft"
  });

  const saveAsDraft = async () => {
    setPageError("");

    if (!subjectId) {
      setPageError("Select a subject");
      return;
    }
    if (hasInvalidScheduleRange(scheduledStart, scheduledEnd)) {
      setPageError("Scheduled end must be later than scheduled start");
      return;
    }

    if (isExistingQuiz) {
      try {
        const questionIds = questions
          .map((item) => Number(item.id))
          .filter((item) => Number.isInteger(item) && item > 0);

        await updateQuizMutation.mutateAsync({
          id: quizId,
          payload: {
            ...buildQuizPayload(),
            status: "draft",
            ...(questionIds.length ? { question_ids: questionIds } : {})
          }
        });
      } catch (error) {
        setPageError(error?.response?.data?.error || "Failed to update quiz");
      }
      return;
    }

    const validationError = validateQuestions();
    if (validationError) {
      setPageError(validationError);
      return;
    }

    try {
      const response = await saveManualMutation.mutateAsync({
        ...buildQuizPayload(),
        questions: questions.map(mapBuilderQuestionToApi)
      });

      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      navigate(`/teacher/quiz/manual/${response.quiz.id}`, { replace: true });
      toast({ title: "Quiz saved", description: "Draft quiz saved successfully." });
    } catch (error) {
      setPageError(error?.response?.data?.error || "Failed to save quiz");
    }
  };

  const activateQuiz = async () => {
    setPageError("");

    if (!subjectId) {
      setPageError("Select a subject");
      return;
    }
    if (hasInvalidScheduleRange(scheduledStart, scheduledEnd)) {
      setPageError("Scheduled end must be later than scheduled start");
      return;
    }

    let activeQuizId = quizId;

    if (!isExistingQuiz) {
      const validationError = validateQuestions();
      if (validationError) {
        setPageError(validationError);
        return;
      }

      try {
        const response = await saveManualMutation.mutateAsync({
          ...buildQuizPayload(),
          questions: questions.map(mapBuilderQuestionToApi)
        });

        activeQuizId = response.quiz.id;
      } catch (error) {
        setPageError(error?.response?.data?.error || "Failed to create quiz before activation");
        return;
      }
    }

    try {
      const questionIds = questions
        .map((item) => Number(item.id))
        .filter((item) => Number.isInteger(item) && item > 0);

      const response = await updateQuizMutation.mutateAsync({
        id: activeQuizId,
        payload: {
          ...buildQuizPayload(),
          status: "draft",
          ...(isExistingQuiz && questionIds.length ? { question_ids: questionIds } : {})
        }
      });

      const statusResponse = await quizService.updateStatus(activeQuizId, "active");
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });

      setShareUrl(statusResponse.share_url || response.share_url || "");
      setShareDialogOpen(true);
      toast({ title: "Quiz is now live", description: "Share the link with students." });

      if (!isExistingQuiz) {
        navigate(`/teacher/quiz/manual/${activeQuizId}`, { replace: true });
      }
    } catch (error) {
      setPageError(error?.response?.data?.error || "Failed to activate quiz");
    }
  };

  const onImportFile = async (event) => {
    setImportStatus("");
    setPageError("");

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!importSubjectId) {
      setImportStatus("Select a subject before importing");
      return;
    }

    try {
      const parsed = await parseQuestionsExcel(file);

      if (!parsed.questions.length) {
        setImportStatus(`No valid rows found. ${parsed.warnings.slice(0, 5).join(" | ")}`);
        return;
      }

      const response = await questionService.bulkImport({
        subject_id: Number(importSubjectId),
        questions: parsed.questions
      });

      const warningMessage = parsed.warnings.length ? ` Warnings: ${parsed.warnings.slice(0, 3).join(" | ")}` : "";
      setImportStatus(`Imported ${response.inserted_count} questions.${warningMessage}`);
      toast({
        title: "Import complete",
        description: `${response.inserted_count} questions imported successfully.`
      });

      if (String(importSubjectId) === String(subjectId)) {
        queryClient.invalidateQueries({ queryKey: ["questions", Number(subjectId)] });
      }
    } catch (error) {
      setImportStatus(error?.response?.data?.error || error.message || "Import failed");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <TeacherShell
      subjects={subjects}
      selectedSubjectId={Number(subjectId) || null}
      onSelectSubject={(id) => navigate(`/teacher?subjectId=${id}`)}
      onOpenCreateSubject={() => setSubjectDialogOpen(true)}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manual Quiz Page</CardTitle>
            <CardDescription>
              {isExistingQuiz
                ? "Review generated quiz and activate it."
                : "Create a new quiz by adding questions manually."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Quiz Title</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled quiz" />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectValue placeholder="Select subject" />
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Duration (mins)</Label>
                <Input type="number" min={1} value={durationMins} onChange={(event) => setDurationMins(Number(event.target.value || 15))} />
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Input value={batch} onChange={(event) => setBatch(event.target.value)} placeholder="2023-2027" />
              </div>
              <div className="space-y-2">
                <Label>Division</Label>
                <Input value={division} onChange={(event) => setDivision(event.target.value)} placeholder="7" />
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Input value={groupNos} onChange={(event) => setGroupNos(event.target.value)} placeholder="G13/G14" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quiz Date</Label>
              <Input type="date" value={quizDate} onChange={(event) => setQuizDate(event.target.value)} className="max-w-xs" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Scheduled Start</Label>
                <DateTimePicker value={scheduledStart} onChange={setScheduledStart} placeholder="Select start" />
              </div>
              <div className="space-y-2">
                <Label>Scheduled End</Label>
                <DateTimePicker value={scheduledEnd} onChange={setScheduledEnd} placeholder="Select end" />
              </div>
              <div className="space-y-2">
                <Label>Access Code (Optional)</Label>
                <Input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="e.g. 2026CN" />
              </div>
            </div>

            {isExistingQuiz ? (
              <p className="text-xs text-muted-foreground">
                This quiz is already generated. Question text is shown for review; activation updates metadata and status.
              </p>
            ) : null}

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label className="text-xs">Excel Import to Subject Bank</Label>
                <p className="text-xs text-muted-foreground">Subject: {selectedSubjectName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={importSubjectId} onValueChange={setImportSubjectId}>
                  <SelectValue placeholder="Import subject" />
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input type="file" accept=".xlsx,.xls" onChange={onImportFile} className="max-w-60" />
              </div>
            </div>
            {importStatus ? <p className="text-xs text-muted-foreground">{importStatus}</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              {isExistingQuiz ? (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => setQuestions((prev) => moveItem(prev, index, index - 1))}
                  >
                    <ArrowUp className="mr-1 h-4 w-4" />
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === questions.length - 1}
                    onClick={() => setQuestions((prev) => moveItem(prev, index, index + 1))}
                  >
                    <ArrowDown className="mr-1 h-4 w-4" />
                    Down
                  </Button>
                </div>
              ) : null}

              <QuestionBuilder
                question={question}
                index={index}
                canRemove={questions.length > 1 && !isExistingQuiz}
                disabled={isExistingQuiz}
                onRemove={() => setQuestions((prev) => prev.filter((item) => item.id !== question.id))}
                onChange={(nextQuestion) =>
                  setQuestions((prev) => prev.map((item) => (item.id === question.id ? nextQuestion : item)))
                }
              />
            </div>
          ))}

          <Button type="button" variant="outline" disabled={isExistingQuiz} onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion()])}>
            + Add new question
          </Button>
        </div>

        {pageError ? <p className="text-sm text-destructive">{pageError}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={saveAsDraft} disabled={saveManualMutation.isPending || updateQuizMutation.isPending}>
            Save as Draft
          </Button>
          <Button type="button" variant="outline" onClick={() => setPreviewDialogOpen(true)}>
            Preview
          </Button>
          <Button type="button" onClick={activateQuiz} disabled={saveManualMutation.isPending || updateQuizMutation.isPending}>
            Save & Activate
          </Button>
        </div>
      </div>

      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject Question</DialogTitle>
            <DialogDescription>Create a new subject for question storage.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createSubjectMutation.mutate({ name: subjectName });
            }}
          >
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} required />
            </div>

            {createSubjectMutation.isError ? (
              <p className="text-sm text-destructive">{createSubjectMutation.error?.response?.data?.error || "Failed"}</p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={createSubjectMutation.isPending}>
                {createSubjectMutation.isPending ? "Creating..." : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quiz Activated</DialogTitle>
            <DialogDescription>Copy and share this link with students.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input value={shareUrl} readOnly />
            <Button
              type="button"
              onClick={async () => {
                if (!shareUrl) return;
                await navigator.clipboard.writeText(shareUrl);
              }}
              disabled={!shareUrl}
            >
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quiz Preview</DialogTitle>
            <DialogDescription>Read-only preview of what students will see.</DialogDescription>
          </DialogHeader>

          {isExistingQuiz && previewQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading preview...</p> : null}
          {isExistingQuiz && previewQuery.isError ? (
            <p className="text-sm text-destructive">
              {previewQuery.error?.response?.data?.error || "Failed to load preview"}
            </p>
          ) : null}

          {!isExistingQuiz || (!previewQuery.isLoading && !previewQuery.isError) ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-1 pt-5">
                  <p className="text-base font-semibold">{previewTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Timer: {previewDuration} min • Read-only preview mode
                  </p>
                </CardContent>
              </Card>

              {previewQuestions.length === 0 ? <p className="text-sm text-muted-foreground">No questions to preview.</p> : null}

              {previewQuestions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="space-y-3 pt-5">
                    <p className="text-xs uppercase text-muted-foreground">Question {index + 1}</p>
                    <p className="text-sm">{question.question_text || "-"}</p>
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div
                          key={option.key}
                          className={
                            option.key === question.correct_option
                              ? "rounded-md border border-primary bg-primary/10 p-2 text-sm font-medium"
                              : "rounded-md border p-2 text-sm text-muted-foreground"
                          }
                        >
                          {option.key.toUpperCase()}. {option.value || "-"}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </TeacherShell>
  );
}
