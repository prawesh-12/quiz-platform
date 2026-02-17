import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, FileSpreadsheet } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { parseQuestionsExcel } from "@/utils/excelParser";
import { questionService } from "@/services/questionService";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";
import { unitService } from "@/services/unitService";
import QuestionPreviewList from "@/components/teacher/QuestionPreviewList";

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
    is_required: Boolean(question.is_required),
    unit_id: question.unit_id || null,
    new_unit_name: question.new_unit_name || null,
    in_subject_bank: Boolean(question.in_subject_bank)
  };
}

function mapImportedQuestionToBuilder(question) {
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
    id: crypto.randomUUID(),
    question_text: question.question_text,
    options,
    correct_option: question.correct_option,
    points: question.points || 1,
    has_equation: Boolean(question.has_equation),
    allow_multiple_answers: Boolean(question.allow_multiple_answers),
    is_required: Boolean(question.is_required),
    unit_id: null,
    new_unit_name: null,
    in_subject_bank: false
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

function buildShareUrlFromToken(accessToken) {
  if (!accessToken) {
    return "";
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return origin ? `${origin}/quiz/enter/${accessToken}` : "";
}

function normalizeDateOnlyInput(value) {
  if (!value) {
    return "";
  }

  const raw = String(value).trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extractApiError(error, fallbackMessage) {
  const apiData = error?.response?.data;
  if (apiData?.error !== "Validation failed") {
    return apiData?.error || fallbackMessage;
  }

  const fieldErrors = apiData?.details?.fieldErrors || {};
  const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
  return firstFieldError || apiData?.error || fallbackMessage;
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

function addMinutesToDateTime(dateTimeStr, minutes) {
  if (!dateTimeStr) return "";
  const d = new Date(dateTimeStr);
  if (Number.isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() + Number(minutes || 0));
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [importedQuestions, setImportedQuestions] = useState([]);
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

  const unitsQuery = useQuery({
    queryKey: ["units", subjectId],
    queryFn: () => unitService.listBySubject(subjectId),
    enabled: Boolean(subjectId)
  });
  const units = unitsQuery.data?.units ?? [];

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
    setQuizDate(normalizeDateOnlyInput(quiz.quiz_date));
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
  const persistedShareUrl = isExistingQuiz
    ? buildShareUrlFromToken(quizDetailQuery.data?.quiz?.access_token)
    : "";

  const handleScheduledStartChange = (value) => {
    setScheduledStart(value);
    setScheduledEnd(addMinutesToDateTime(value, durationMins));
  };

  const handleDurationChange = (value) => {
    const mins = Number(value || 15);
    setDurationMins(mins);
    if (scheduledStart) {
      setScheduledEnd(addMinutesToDateTime(scheduledStart, mins));
    }
  };

  const validateQuestions = () => {
    const allQuestions = [...questions, ...importedQuestions];

    if (!allQuestions.length) {
      return "Add at least one question";
    }

    // Filter out the default empty question if it's the only one and we have imported questions?
    // Actually, user should remove it if they don't want it.
    
    for (let index = 0; index < allQuestions.length; index += 1) {
      const item = allQuestions[index];
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
    quiz_date: normalizeDateOnlyInput(quizDate) || null,
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
        queryClient.invalidateQueries({ queryKey: ["quizzes"] });
        toast({ title: "Saved as draft", description: "Quiz has been saved as draft." });
        navigate("/teacher", { replace: true });
      } catch (error) {
        setPageError(extractApiError(error, "Failed to update quiz"));
      }
      return;
    }

    const validationError = validateQuestions();
    if (validationError) {
      setPageError(validationError);
      return;
    }

    try {
      await saveManualMutation.mutateAsync({
        ...buildQuizPayload(),
        questions: [...questions, ...importedQuestions].map(mapBuilderQuestionToApi)
      });

      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Saved as draft", description: "Quiz has been saved as draft." });
      navigate("/teacher", { replace: true });
    } catch (error) {
      setPageError(extractApiError(error, "Failed to save quiz"));
    }
  };

  const activateQuiz = async () => {
    setPageError("");

    if (!subjectId) {
      setPageError("Select a subject");
      return;
    }
    if (!accessCode.trim()) {
      setPageError("Access code is required to activate quiz");
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
          questions: [...questions, ...importedQuestions].map(mapBuilderQuestionToApi)
        });

        activeQuizId = response.quiz.id;
      } catch (error) {
        setPageError(extractApiError(error, "Failed to create quiz before activation"));
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
          status: "active",
          ...(isExistingQuiz && questionIds.length ? { question_ids: questionIds } : {})
        }
      });

      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["quizzes", activeQuizId] });

      const nextShareUrl =
        response.share_url ||
        buildShareUrlFromToken(response.quiz?.access_token);

      setShareUrl(nextShareUrl);
      setShareDialogOpen(true);
      toast({ title: "Quiz is now live", description: "Share the link with students." });

      if (!isExistingQuiz) {
        navigate(`/teacher/quiz/manual/${activeQuizId}`, { replace: true });
      }
    } catch (error) {
      setPageError(extractApiError(error, "Failed to activate quiz"));
    }
  };

  const onImportFile = async (event) => {
    setImportStatus("");
    setPageError("");

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const parsed = await parseQuestionsExcel(file);

      if (!parsed.questions.length) {
        setImportStatus(`No valid rows found. ${parsed.warnings.slice(0, 5).join(" | ")}`);
        return;
      }

      const newQuestions = parsed.questions.map(mapImportedQuestionToBuilder);
      
      setImportedQuestions((prev) => [...prev, ...newQuestions]);

      const warningMessage = parsed.warnings.length ? ` Warnings: ${parsed.warnings.slice(0, 3).join(" | ")}` : "";
      setImportStatus(`Added ${newQuestions.length} questions to preview.${warningMessage}`);
      toast({
        title: "Import complete",
        description: `${newQuestions.length} questions added to preview.`
      });

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
      onSelectSubject={(id) => navigate(`/teacher/questions/${id}`)}
      onOpenCreateSubject={() => setSubjectDialogOpen(true)}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b pb-4">
            <div>
              <CardTitle>Manual Quiz Page</CardTitle>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={saveAsDraft}
                disabled={saveManualMutation.isPending || updateQuizMutation.isPending}
              >
                Save as Draft
              </Button>
              <Button type="button" variant="outline" onClick={() => setPreviewDialogOpen(true)}>
                Preview
              </Button>
              <Button
                type="button"
                onClick={activateQuiz}
                disabled={saveManualMutation.isPending || updateQuizMutation.isPending}
              >
                Save & Activate
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-w-3xl space-y-3 pt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="w-full space-y-2 md:col-span-3">
                <Label>Quiz Title</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled quiz" />
              </div>
              <div className="w-full space-y-2 md:col-span-2">
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="w-full space-y-2">
                <Label>Duration (mins)</Label>
                <Input
                  type="number"
                  min={1}
                  value={durationMins}
                  onChange={(event) => handleDurationChange(Number(event.target.value || 15))}
                />
              </div>
              <div className="w-full space-y-2">
                <Label>Batch</Label>
                <Input value={batch} onChange={(event) => setBatch(event.target.value)} placeholder="2023-2027" />
              </div>
              <div className="w-full space-y-2">
                <Label>Division</Label>
                <Input value={division} onChange={(event) => setDivision(event.target.value)} placeholder="7" />
              </div>
              <div className="w-full space-y-2">
                <Label>Group</Label>
                <Input value={groupNos} onChange={(event) => setGroupNos(event.target.value)} placeholder="G13/G14" />
              </div>
            </div>

            <div className="w-full max-w-xs space-y-2 md:max-w-[200px]">
              <Label>Quiz Date</Label>
              <Input type="date" value={quizDate} onChange={(event) => setQuizDate(event.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="w-full space-y-2">
                <Label>Scheduled Start</Label>
                <DateTimePicker value={scheduledStart} onChange={handleScheduledStartChange} placeholder="Select start" />
              </div>
              <div className="w-full space-y-2">
                <Label>Scheduled End</Label>
                <DateTimePicker value={scheduledEnd} onChange={setScheduledEnd} placeholder="Select end" />
              </div>
              <div className="w-full space-y-2">
                <Label>Access Code</Label>
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
                <Label className="text-xs">Import Questions from Excel</Label>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-40">
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
                </div>
                <Label htmlFor="excel-import-quiz" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    Import Excel
                  </div>
                </Label>
                <Input
                  id="excel-import-quiz"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={onImportFile}
                />
              </div>
            </div>
            {importStatus ? <p className="text-xs text-muted-foreground">{importStatus}</p> : null}
          </CardContent>
        </Card>

        {importedQuestions.length > 0 ? (
          <QuestionPreviewList
            questions={importedQuestions}
            units={units}
            onUpdateQuestion={(id, updated) =>
              setImportedQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)))
            }
            onRemoveQuestion={(id) => setImportedQuestions((prev) => prev.filter((q) => q.id !== id))}
            onClearAll={() => setImportedQuestions([])}
          />
        ) : null}

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
                const value = shareUrl || persistedShareUrl;
                if (!value) return;
                await navigator.clipboard.writeText(value);
                toast({ title: "Link copied", description: "Quiz link copied to clipboard." });
              }}
              disabled={!(shareUrl || persistedShareUrl)}
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
            <ScrollArea className="max-h-[70vh] pr-2">
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
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </TeacherShell>
  );
}
