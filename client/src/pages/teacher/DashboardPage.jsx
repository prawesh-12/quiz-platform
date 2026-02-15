import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import GenerateModeModal from "@/components/teacher/GenerateModeModal";
import QuizListCard from "@/components/teacher/QuizListCard";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Pagination from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { questionService } from "@/services/questionService";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";

const initialQuestionForm = {
  subject_id: "",
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "a",
  points: 1
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [generateModeOpen, setGenerateModeOpen] = useState(false);
  const [quizPage, setQuizPage] = useState(1);
  const [questionPage, setQuestionPage] = useState(1);
  const { toast } = useToast();

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const subjects = subjectsQuery.data?.subjects ?? [];

  const selectedSubjectId = useMemo(() => {
    const subjectId = searchParams.get("subjectId");
    const parsed = Number(subjectId);

    if (!subjectId || Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  }, [searchParams]);

  useEffect(() => {
    if (!subjects.length || selectedSubjectId) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set("subjectId", String(subjects[0].id));
    setSearchParams(params, { replace: true });
  }, [searchParams, selectedSubjectId, setSearchParams, subjects]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCommittedSearch(searchInput.trim());
      setQuizPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setQuestionPage(1);
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!createQuestionOpen) {
      setQuestionForm((prev) => ({
        ...initialQuestionForm,
        subject_id: selectedSubjectId ? String(selectedSubjectId) : prev.subject_id
      }));
    }
  }, [createQuestionOpen, selectedSubjectId]);

  const quizzesQuery = useQuery({
    queryKey: ["quizzes", committedSearch, quizPage],
    queryFn: () => quizService.list({ search: committedSearch || undefined, page: quizPage, limit: 10 })
  });

  const activeQuizzesQuery = useQuery({
    queryKey: ["quizzes", "active"],
    queryFn: () => quizService.list({ status: "active", page: 1, limit: 50 })
  });

  const questionsQuery = useQuery({
    queryKey: ["questions", selectedSubjectId, questionPage],
    enabled: Boolean(selectedSubjectId),
    queryFn: () => questionService.listBySubject(selectedSubjectId, { page: questionPage, limit: 10 })
  });

  const createSubjectMutation = useMutation({
    mutationFn: (payload) => subjectService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setCreateSubjectOpen(false);
      setSubjectName("");
      toast({ title: "Subject created", description: "Subject has been added successfully." });
    }
  });

  const createQuestionMutation = useMutation({
    mutationFn: (payload) => questionService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", Number(questionForm.subject_id)] });
      setCreateQuestionOpen(false);
      setQuestionForm(initialQuestionForm);
      toast({ title: "Question saved", description: "Question saved to the question bank." });
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => questionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", selectedSubjectId] });
      setQuestionToDelete(null);
      toast({ title: "Question deleted", description: "Question removed from the question bank." });
    }
  });

  const duplicateQuizMutation = useMutation({
    mutationFn: (id) => quizService.duplicate(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Quiz duplicated", description: "Opening copied quiz for review." });
      navigate(`/teacher/quiz/manual/${data.quiz_id}`);
    }
  });

  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) || null;

  const quizzes = quizzesQuery.data?.quizzes ?? [];
  const questions = questionsQuery.data?.questions ?? [];
  const activeQuizzes = activeQuizzesQuery.data?.quizzes ?? [];
  const activeCount = activeQuizzesQuery.data?.count ?? 0;
  const quizTotalPages = quizzesQuery.data?.totalPages ?? 1;
  const questionTotalPages = questionsQuery.data?.totalPages ?? 1;

  const openOngoingQuizView = () => {
    if (activeCount === 1 && activeQuizzes[0]?.id) {
      navigate(`/teacher/quiz/ongoing/${activeQuizzes[0].id}`);
      return;
    }

    navigate("/teacher/quiz/ongoing");
  };

  const onSelectSubject = (subjectId) => {
    const params = new URLSearchParams(searchParams);
    params.set("subjectId", String(subjectId));
    setSearchParams(params);
  };

  const onCreateSubject = (event) => {
    event.preventDefault();
    createSubjectMutation.mutate({ name: subjectName });
  };

  const onCreateQuestion = (event) => {
    event.preventDefault();

    createQuestionMutation.mutate({
      ...questionForm,
      subject_id: Number(questionForm.subject_id),
      points: Number(questionForm.points),
      option_c: questionForm.option_c || null,
      option_d: questionForm.option_d || null,
      has_equation: false,
      allow_multiple_answers: false,
      is_required: true
    });
  };

  return (
    <TeacherShell
      subjects={subjects}
      selectedSubjectId={selectedSubjectId}
      onSelectSubject={onSelectSubject}
      onOpenCreateSubject={() => setCreateSubjectOpen(true)}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="search past quizzes"
                className="max-w-sm"
              />
              <Button type="button" variant="outline" onClick={() => setCommittedSearch(searchInput.trim())}>
                Search
              </Button>
              <Button type="button" variant="secondary" onClick={openOngoingQuizView}>
                On going Quiz
                <Badge variant="default" className="ml-2 bg-primary-foreground text-primary">
                  {activeQuizzesQuery.isLoading ? "..." : activeCount}
                </Badge>
              </Button>
              <Button type="button" onClick={() => setGenerateModeOpen(true)}>
                Generate New Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quiz List</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-72 space-y-3">
              <div className="space-y-3 pr-1">
                {quizzesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading quizzes...</p> : null}
                {quizzesQuery.isError ? (
                  <p className="text-sm text-destructive">{quizzesQuery.error?.response?.data?.error || "Failed to load quizzes"}</p>
                ) : null}
                {!quizzesQuery.isLoading && quizzes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No quizzes found for this filter.</p>
                ) : null}
                {quizzes.map((quiz) => (
                  <QuizListCard
                    key={quiz.id}
                    quiz={quiz}
                    onViewResponses={(item) => navigate(`/teacher/quiz/${item.id}/responses`)}
                    onDuplicate={(item) => duplicateQuizMutation.mutate(item.id)}
                  />
                ))}
              </div>
            </ScrollArea>
            <div className="pt-3">
              <Pagination page={quizPage} totalPages={quizTotalPages} onPageChange={setQuizPage} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>{selectedSubject ? `${selectedSubject.name} Questions` : "Subject Questions"}</CardTitle>
            <Button type="button" onClick={() => setCreateQuestionOpen(true)} disabled={!selectedSubjectId}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading questions...</p> : null}
            {questionsQuery.isError ? (
              <p className="text-sm text-destructive">{questionsQuery.error?.response?.data?.error || "Failed to load questions"}</p>
            ) : null}
            {!selectedSubjectId ? <p className="text-sm text-muted-foreground">Select a subject from sidebar.</p> : null}

            {selectedSubjectId ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Correct</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead className="w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No questions available for this subject.
                        </TableCell>
                      </TableRow>
                    ) : (
                      questions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell>{question.question_text}</TableCell>
                          <TableCell className="uppercase">{question.correct_option}</TableCell>
                          <TableCell>{question.points}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setQuestionToDelete(question)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/teacher/questions/${selectedSubjectId}`)}
                  >
                    Open Full Question Bank
                  </Button>
                  <Pagination page={questionPage} totalPages={questionTotalPages} onPageChange={setQuestionPage} />
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createSubjectOpen} onOpenChange={setCreateSubjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject Question</DialogTitle>
            <DialogDescription>Create a new subject or add a question to an existing subject.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onCreateSubject}>
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="e.g. Database"
                required
              />
            </div>

            {createSubjectMutation.isError ? (
              <p className="text-sm text-destructive">
                {createSubjectMutation.error?.response?.data?.error || "Failed to create subject"}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={createSubjectMutation.isPending}>
                {createSubjectMutation.isPending ? "Creating..." : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Want to add a question directly?</p>
            <Button
              type="button"
              variant="secondary"
              disabled={!selectedSubjectId}
              onClick={() => {
                setCreateSubjectOpen(false);
                setCreateQuestionOpen(true);
              }}
            >
              Open Add Question Form
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createQuestionOpen} onOpenChange={setCreateQuestionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
            <DialogDescription>Add one question to the selected subject question bank.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onCreateQuestion}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={questionForm.subject_id}
                  onValueChange={(value) => setQuestionForm((prev) => ({ ...prev, subject_id: value }))}
                >
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

              <div className="space-y-2">
                <Label>Correct Option</Label>
                <Select
                  value={questionForm.correct_option}
                  onValueChange={(value) => setQuestionForm((prev) => ({ ...prev, correct_option: value }))}
                >
                  <SelectContent>
                    <SelectItem value="a">A</SelectItem>
                    <SelectItem value="b">B</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="d">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={questionForm.question_text}
                onChange={(event) => setQuestionForm((prev) => ({ ...prev, question_text: event.target.value }))}
                placeholder="Type question text"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Option A</Label>
                <Input
                  value={questionForm.option_a}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, option_a: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Option B</Label>
                <Input
                  value={questionForm.option_b}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, option_b: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Option C</Label>
                <Input
                  value={questionForm.option_c}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, option_c: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Option D</Label>
                <Input
                  value={questionForm.option_d}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, option_d: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Points</Label>
              <Input
                type="number"
                min={1}
                value={questionForm.points}
                onChange={(event) => setQuestionForm((prev) => ({ ...prev, points: event.target.value }))}
                required
              />
            </div>

            {createQuestionMutation.isError ? (
              <p className="text-sm text-destructive">
                {createQuestionMutation.error?.response?.data?.error || "Failed to create question"}
              </p>
            ) : null}

            <Separator />

            <DialogFooter>
              <Button type="submit" disabled={createQuestionMutation.isPending}>
                {createQuestionMutation.isPending ? "Saving..." : "Save Question"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(questionToDelete)} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected question will be removed from the subject bank.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (questionToDelete) {
                  deleteQuestionMutation.mutate(questionToDelete.id);
                }
              }}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GenerateModeModal open={generateModeOpen} onOpenChange={setGenerateModeOpen} />
    </TeacherShell>
  );
}
