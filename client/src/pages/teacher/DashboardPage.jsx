import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Search, Sparkles, Timer } from "lucide-react";
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
import { Button } from "@/components/ui/button";
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
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <section className="shrink-0 rounded-[1.65rem] border border-[#e4e8f4] bg-white p-4 shadow-[0_14px_32px_rgba(20,35,90,0.06)] md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full flex-wrap items-center gap-2 md:flex-nowrap">
              <div className="relative w-full md:max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search past quizzes"
                  className="h-11 rounded-xl border-[#d9e0f1] bg-[#fbfcff] pl-10 text-[15px] text-slate-700 placeholder:text-slate-400 focus-visible:ring-[#87a4ff]"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl border-[#d9e0f1] bg-white px-5 text-slate-700 hover:bg-[#f7f9ff]"
                onClick={() => setCommittedSearch(searchInput.trim())}
              >
                Search
              </Button>
            </div>

            <div className="flex w-full flex-wrap items-center justify-start gap-2 xl:w-auto xl:justify-end">
              <Button
                type="button"
                className="h-11 rounded-xl bg-gradient-to-r from-[#2647d6] to-[#4562ea] px-5 font-semibold text-white shadow-[0_14px_26px_rgba(52,87,230,0.32)] transition-all hover:from-[#3050da] hover:to-[#4f6cf0]"
                onClick={() => setGenerateModeOpen(true)}
              >
                <Sparkles className="h-4 w-4" />
                Generate New Quiz
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-[#f6d3cb] bg-[#fff5f2] px-4 text-[#c55344] hover:bg-[#ffefea]"
                onClick={() => navigate("/teacher/quiz/scheduled")}
              >
                <CalendarClock className="h-4 w-4" />
                Scheduled
                <span className="ml-1 rounded-full bg-[#ffdfd7] px-2 py-0.5 text-xs font-semibold text-[#b84d3f]">
                  {scheduledQuizzesQuery.isLoading ? "..." : scheduledCount}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-[#ccead4] bg-[#effcf3] px-4 text-[#157545] hover:bg-[#e8f8ee]"
                onClick={openOngoingQuizView}
              >
                <Timer className="h-4 w-4" />
                Ongoing
                <span className="ml-1 rounded-full bg-[#d6f3df] px-2 py-0.5 text-xs font-semibold text-[#13643c]">
                  {activeQuizzesQuery.isLoading ? "..." : activeCount}
                </span>
              </Button>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col rounded-[1.65rem] border border-[#e4e8f4] bg-white p-4 shadow-[0_16px_36px_rgba(20,35,90,0.07)] md:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#192242]">Quiz Library</h2>
              <p className="text-sm text-slate-500">
                Manage every published, scheduled, and ended quiz from one place.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#f2f5ff] px-3 py-1 text-xs font-semibold text-[#3c4c7d]">
              {quizzesQuery.isLoading ? "Loading..." : `${quizzes.length} quizzes on this page`}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {quizzesQuery.isLoading ? (
              <p className="col-span-full rounded-xl border border-dashed border-[#d3dcf3] bg-[#f8faff] p-6 text-sm text-slate-500">
                Loading quizzes...
              </p>
            ) : null}
            {quizzesQuery.isError ? (
              <p className="col-span-full rounded-xl border border-dashed border-rose-300 bg-rose-50 p-6 text-sm text-rose-600">
                {quizzesQuery.error?.response?.data?.error || "Failed to load quizzes"}
              </p>
            ) : null}
            {!quizzesQuery.isLoading && quizzes.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed border-[#d3dcf3] bg-[#f8faff] p-6 text-sm text-slate-500">
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

          <div className="shrink-0 pt-4">
            <Pagination
              page={quizPage}
              totalPages={quizTotalPages}
              onPageChange={setQuizPage}
            />
          </div>
        </section>
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
