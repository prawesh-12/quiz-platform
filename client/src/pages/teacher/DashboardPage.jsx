import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

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
  AlertDialogTitle,
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
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Pagination from "@/components/ui/pagination";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [generateModeOpen, setGenerateModeOpen] = useState(false);
  const [quizPage, setQuizPage] = useState(1);
  const [quizToDelete, setQuizToDelete] = useState(null);

  const PAGE_SIZE = 18;

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list(),
  });

  const quizzesQuery = useQuery({
    queryKey: ["quizzes", committedSearch, quizPage, PAGE_SIZE],
    queryFn: () =>
      quizService.list({
        search: committedSearch || undefined,
        page: quizPage,
        limit: PAGE_SIZE,
      }),
  });

  const activeQuizzesQuery = useQuery({
    queryKey: ["quizzes", "active"],
    queryFn: () =>
      quizService.list({ status: "active", page: 1, limit: 50 }),
  });

  const scheduledQuizzesQuery = useQuery({
    queryKey: ["quizzes", "scheduled"],
    queryFn: () =>
      quizService.list({ status: "scheduled", page: 1, limit: 50 }),
  });

  const createSubjectMutation = useMutation({
    mutationFn: (payload) => subjectService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setCreateSubjectOpen(false);
      setSubjectName("");
      toast({
        title: "Subject created",
        description: "Subject has been added successfully.",
      });
    },
  });

  const duplicateQuizMutation = useMutation({
    mutationFn: (id) => quizService.duplicate(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({
        title: "Quiz duplicated",
        description: "Opening copied quiz for review.",
      });
      navigate(`/teacher/quiz/manual/${data.quiz_id}`);
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (id) => quizService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      setQuizToDelete(null);
      toast({ title: "Quiz deleted", description: "The quiz has been removed." });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error?.response?.data?.error || "Could not delete quiz.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCommittedSearch(searchInput.trim());
      setQuizPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const subjects = subjectsQuery.data?.subjects ?? [];
  const quizzes = quizzesQuery.data?.quizzes ?? [];
  const activeQuizzes = activeQuizzesQuery.data?.quizzes ?? [];
  const activeCount = activeQuizzesQuery.data?.count ?? 0;
  const scheduledCount = scheduledQuizzesQuery.data?.count ?? 0;
  const quizTotalPages = quizzesQuery.data?.totalPages ?? 1;

  const openOngoingQuizView = () => {
    if (activeCount === 1 && activeQuizzes[0]?.id) {
      navigate(`/teacher/quiz/ongoing/${activeQuizzes[0].id}`);
      return;
    }

    navigate("/teacher/quiz/ongoing");
  };

  const onCreateSubject = (event) => {
    event.preventDefault();
    createSubjectMutation.mutate({ name: subjectName });
  };

  return (
    <TeacherShell
      subjects={subjects}
      selectedSubjectId={null}
      onSelectSubject={(subjectId) =>
        navigate(`/teacher/questions/${subjectId}`)
      }
      onOpenCreateSubject={() => setCreateSubjectOpen(true)}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
      showBackButton={false}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2">
       <div className="mx-auto w-full max-w-3xl shrink-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Left */}
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="search past quizzes"
                  className="w-full sm:max-w-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCommittedSearch(searchInput.trim())}
                >
                  Search
                </Button>
              </div>

              {/* Right Side Actions */}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button type="button" onClick={() => setGenerateModeOpen(true)}>
                  Generate New Quiz
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/teacher/quiz/scheduled")}
                  >
                    Scheduled
                    <Badge className="ml-2" variant="secondary">
                      {scheduledQuizzesQuery.isLoading ? "..." : scheduledCount}
                    </Badge>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={openOngoingQuizView}
                  >
                    Ongoing
                    <Badge className="ml-2 bg-primary-foreground text-primary">
                      {activeQuizzesQuery.isLoading ? "..." : activeCount}
                    </Badge>
                  </Button>
                </div>
              </div>
            </div>
        </div>

        <Card>
          <CardHeader className="shrink-0">
            <CardTitle>Quiz List</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {quizzesQuery.isLoading ? (
                  <p className="col-span-full text-sm text-muted-foreground">
                    Loading quizzes...
                  </p>
                ) : null}
                {quizzesQuery.isError ? (
                  <p className="col-span-full text-sm text-destructive">
                    {quizzesQuery.error?.response?.data
                      ?.error || "Failed to load quizzes"}
                  </p>
                ) : null}
                {!quizzesQuery.isLoading && quizzes.length === 0 ? (
                  <p className="col-span-full text-sm text-muted-foreground">
                    No quizzes found for this filter.
                  </p>
                ) : null}
                {quizzes.map((quiz) => (
                    <QuizListCard
                      key={quiz.id}
                      quiz={quiz}
                      onViewResponses={(item) =>
                        navigate(`/teacher/quiz/${item.id}/responses`)
                      }
                      onEdit={(item) => navigate(`/teacher/quiz/manual/${item.id}`)}
                      onDuplicate={(item) =>
                        duplicateQuizMutation.mutate(item.id)
                      }
                      onDelete={(item) => setQuizToDelete(item)}
                    />
                ))}
            </div>
            <div className="shrink-0 pt-3">
              <Pagination
                page={quizPage}
                totalPages={quizTotalPages}
                onPageChange={setQuizPage}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={Boolean(quizToDelete)}
        onOpenChange={(open) => !open && setQuizToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quiz and all associated responses and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteQuizMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteQuizMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => quizToDelete && deleteQuizMutation.mutate(quizToDelete.id)}
            >
              {deleteQuizMutation.isPending ? "Deleting..." : "Delete quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={createSubjectOpen}
        onOpenChange={setCreateSubjectOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
            <DialogDescription>
              Create a new subject for the question bank.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onCreateSubject}>
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                value={subjectName}
                onChange={(event) =>
                  setSubjectName(event.target.value)
                }
                placeholder="e.g. Operating System"
                required
              />
            </div>

            {createSubjectMutation.isError ? (
              <p className="text-sm text-destructive">
                {createSubjectMutation.error?.response?.data
                  ?.error || "Failed to create subject"}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="submit"
                disabled={createSubjectMutation.isPending}
              >
                {createSubjectMutation.isPending
                  ? "Creating..."
                  : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <GenerateModeModal
        open={generateModeOpen}
        onOpenChange={setGenerateModeOpen}
      />
    </TeacherShell>
  );
}
