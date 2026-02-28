import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
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
import { Input } from "@/components/ui/input";
import Pagination from "@/components/ui/pagination";
import { Select, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";
import { theme } from "@/theme";

const PAGE_SIZE = 12;
const FETCH_LIMIT = 100;
const MANAGEABLE_STATUSES = new Set(["active", "scheduled", "ended"]);

async function fetchAllQuizzes() {
  let page = 1;
  let totalPages = 1;
  const quizzes = [];

  do {
    const data = await quizService.list({ page, limit: FETCH_LIMIT });
    quizzes.push(...(data?.quizzes ?? []));
    totalPages = data?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return quizzes;
}

export default function QuizLibraryPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [quizToDelete, setQuizToDelete] = useState(null);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list(),
  });

  const quizzesQuery = useQuery({
    queryKey: ["quizzes", "library"],
    queryFn: fetchAllQuizzes,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
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

  const subjects = subjectsQuery.data?.subjects ?? [];
  const allQuizzes = quizzesQuery.data ?? [];

  const filteredQuizzes = useMemo(() => {
    const search = searchInput.trim().toLowerCase();

    return allQuizzes.filter((quiz) => {
      if (!MANAGEABLE_STATUSES.has(quiz.status)) {
        return false;
      }

      if (subjectFilter !== "all" && String(quiz.subject_id) !== subjectFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      const title = String(quiz.title || "").toLowerCase();
      const subjectName = String(quiz.subject_name || "").toLowerCase();
      return title.includes(search) || subjectName.includes(search);
    });
  }, [allQuizzes, searchInput, subjectFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedQuizzes = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredQuizzes.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredQuizzes]);

  const onSearchChange = (event) => {
    setSearchInput(event.target.value);
    setPage(1);
  };

  const onSubjectFilterChange = (value) => {
    setSubjectFilter(value);
    setPage(1);
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
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <section
          className="rounded-[12px] border p-5"
          style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}
        >
          <h1 className="text-[24px]" style={{ color: theme.text.primary, fontWeight: theme.font.weight.bold }}>
            Quiz Library
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: theme.text.muted }}>
            Manage every published, scheduled, and ended quiz from one place.
          </p>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full max-w-[36rem]">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: theme.text.muted }}
                />
                <Input
                  value={searchInput}
                  onChange={onSearchChange}
                  placeholder="Search quizzes by name or subject"
                  className="h-[38px] rounded-[var(--ds-radius-md)] pl-10"
                />
              </div>
              <div className="w-full sm:w-[15rem]">
                <Select value={subjectFilter} onValueChange={onSubjectFilterChange}>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            <p
              className="text-[11px] uppercase"
              style={{ color: theme.text.subtle, fontWeight: theme.font.weight.semibold, letterSpacing: "0.06em" }}
            >
              {quizzesQuery.isLoading ? "Loading..." : `${filteredQuizzes.length} quiz item(s)`}
            </p>
          </div>
        </section>

        <section
          className="flex min-h-0 flex-1 flex-col rounded-[12px] border p-4 md:p-5"
          style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {quizzesQuery.isLoading ? (
              <p
                className="col-span-full rounded-[12px] border border-dashed p-6 text-[13px]"
                style={{ borderColor: theme.border.default, backgroundColor: theme.bg.content, color: theme.text.muted }}
              >
                Loading quizzes...
              </p>
            ) : null}

            {quizzesQuery.isError ? (
              <p
                className="col-span-full rounded-[12px] border border-dashed p-6 text-[13px]"
                style={{ borderColor: theme.border.default, backgroundColor: theme.badge.red.bg, color: theme.badge.red.color }}
              >
                {quizzesQuery.error?.response?.data?.error || "Failed to load quizzes"}
              </p>
            ) : null}

            {!quizzesQuery.isLoading && !quizzesQuery.isError && pagedQuizzes.length === 0 ? (
              <p
                className="col-span-full rounded-[12px] border border-dashed p-6 text-[13px]"
                style={{ borderColor: theme.border.default, backgroundColor: theme.bg.content, color: theme.text.muted }}
              >
                No quizzes found for this filter.
              </p>
            ) : null}

            {pagedQuizzes.map((quiz) => (
              <QuizListCard
                key={quiz.id}
                quiz={quiz}
                onViewResponses={(item) => navigate(`/teacher/quiz/${item.id}/responses`)}
                onEdit={(item) => navigate(`/teacher/quiz/manual/${item.id}`)}
                onDuplicate={(item) => duplicateQuizMutation.mutate(item.id)}
                onDelete={(item) => setQuizToDelete(item)}
              />
            ))}
          </div>

          <div className="shrink-0 pt-4">
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </section>
      </div>

      <AlertDialog open={Boolean(quizToDelete)} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quiz and all associated responses and data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteQuizMutation.isPending}>Cancel</AlertDialogCancel>
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
    </TeacherShell>
  );
}
