import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import GenerateModeModal from "@/components/teacher/GenerateModeModal";
import QuizListCard from "@/components/teacher/QuizListCard";
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
  const [pageLimit, setPageLimit] = useState(4);
  const listWrapperRef = useRef(null);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list(),
  });

  const quizzesQuery = useQuery({
    queryKey: ["quizzes", committedSearch, quizPage, pageLimit],
    queryFn: () =>
      quizService.list({
        search: committedSearch || undefined,
        page: quizPage,
        limit: pageLimit,
      }),
  });

  const activeQuizzesQuery = useQuery({
    queryKey: ["quizzes", "active"],
    queryFn: () =>
      quizService.list({ status: "active", page: 1, limit: 50 }),
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
  const quizTotalPages = quizzesQuery.data?.totalPages ?? 1;

  const recalcPageLimit = useCallback(() => {
    const container = listWrapperRef.current;
    if (!container) {
      return;
    }

    const availableHeight = container.getBoundingClientRect().height;
    if (!availableHeight) {
      return;
    }

    const itemNodes = container.querySelectorAll("[data-quiz-item]");
    if (!itemNodes.length) {
      return;
    }

    const firstRect = itemNodes[0].getBoundingClientRect();
    if (!firstRect?.height) {
      return;
    }

    let perItemHeight = firstRect.height;

    if (itemNodes.length > 1) {
      const secondRect = itemNodes[1].getBoundingClientRect();
      const gap = secondRect.top - firstRect.bottom;
      if (Number.isFinite(gap)) {
        perItemHeight += Math.max(0, gap);
      }
    } else {
      perItemHeight += 12;
    }

    perItemHeight = Math.max(perItemHeight, 1);

    // Keep the quiz list within the visible area so paging controls drive navigation.
    const usableHeight = Math.max(0, availableHeight - 8);
    const computedLimit = Math.max(
      1,
      Math.floor(usableHeight / perItemHeight),
    );

    if (computedLimit !== pageLimit) {
      setQuizPage(1);
      setPageLimit(computedLimit);
    }
  }, [pageLimit]);

  useEffect(() => {
    if (!quizzes.length) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      recalcPageLimit();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [quizzes, recalcPageLimit]);

  useEffect(() => {
    const handler = () => recalcPageLimit();
    window.addEventListener("resize", handler);

    return () => window.removeEventListener("resize", handler);
  }, [recalcPageLimit]);

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
      <div className="flex h-full flex-col gap-6">
        <Card className="mx-auto max-w-3xl">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 items-center gap-3">

              {/* Left */}
              <div className="flex gap-2">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="search past quizzes"
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCommittedSearch(searchInput.trim())}
                >
                  Search
                </Button>
              </div>

              {/* Middle */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={() => setGenerateModeOpen(true)}
                >
                  Generate New Quiz
                </Button>
              </div>

              {/* Right */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={openOngoingQuizView}
                >
                  On going Quiz
                  <Badge className="ml-2 bg-primary-foreground text-primary">
                    {activeQuizzesQuery.isLoading ? "..." : activeCount}
                  </Badge>
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>


        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="shrink-0">
            <CardTitle>Quiz List</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col overflow-hidden">
            <div
              ref={listWrapperRef}
              className="flex-1 overflow-hidden min-h-0"
            >
              <div className="space-y-3">
                {quizzesQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading quizzes...
                  </p>
                ) : null}
                {quizzesQuery.isError ? (
                  <p className="text-sm text-destructive">
                    {quizzesQuery.error?.response?.data
                      ?.error || "Failed to load quizzes"}
                  </p>
                ) : null}
                {!quizzesQuery.isLoading &&
                  quizzes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No quizzes found for this filter.
                  </p>
                ) : null}
                {quizzes.map((quiz) => (
                  <div key={quiz.id} data-quiz-item>
                    <QuizListCard
                      quiz={quiz}
                      onViewResponses={(item) =>
                        navigate(
                          `/teacher/quiz/${item.id}/responses`,
                        )
                      }
                      onDuplicate={(item) =>
                        duplicateQuizMutation.mutate(
                          item.id,
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 shrink-0">
              <Pagination
                page={quizPage}
                totalPages={quizTotalPages}
                onPageChange={setQuizPage}
              />
            </div>
          </CardContent>
        </Card>
      </div>

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
