import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import Plus from "lucide-react/dist/esm/icons/plus";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import QuestionBuilder from "@/components/teacher/QuestionBuilder";
import QuestionPreviewList from "@/components/teacher/QuestionPreviewList";
import UnitQuestionsList from "@/components/teacher/UnitQuestionsList";
import Spinner from "@/components/shared/Spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { parseQuestionsExcel } from "@/utils/excelParser";
import { questionService } from "@/services/questionService";
import { subjectService } from "@/services/subjectService";
import { unitService } from "@/services/unitService";

function createEmptyQuestion() {
  return {
    id: crypto.randomUUID(),
    question_text: "",
    options: [
      { key: "a", value: "" },
      { key: "b", value: "" },
    ],
    correct_option: "a",
    points: 1,
    has_equation: false,
    allow_multiple_answers: false,
    is_required: true,
  };
}

function mapBuilderQuestionToApi(question, subjectId, unitId) {
  const optionsMap = Object.fromEntries(
    question.options.map((o) => [o.key, o.value]),
  );
  return {
    subject_id: subjectId,
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
    unit_id: unitId || null,
    in_subject_bank: true,
  };
}

function mapImportedQuestionToBuilder(question) {
  const options = [
    { key: "a", value: question.option_a || "" },
    { key: "b", value: question.option_b || "" },
  ];
  if (question.option_c) options.push({ key: "c", value: question.option_c });
  if (question.option_d) options.push({ key: "d", value: question.option_d });

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
    in_subject_bank: true,
  };
}

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { subjectId } = useParams();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("units");
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [renameUnitItem, setRenameUnitItem] = useState(null);
  const [renameUnitName, setRenameUnitName] = useState("");
  const [deleteUnitItem, setDeleteUnitItem] = useState(null);

  // Add Question state
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState(createEmptyQuestion());
  const [selectedUnitId, setSelectedUnitId] = useState("");

  // Excel Import state
  const [importedQuestions, setImportedQuestions] = useState([]);
  const [importStatus, setImportStatus] = useState("");
  const [isSavingImport, setIsSavingImport] = useState(false);

  const subjectNumericId = useMemo(() => Number(subjectId), [subjectId]);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list(),
  });

  const unitsQuery = useQuery({
    queryKey: ["units", subjectNumericId],
    enabled: Boolean(subjectNumericId),
    queryFn: () => unitService.listBySubject(subjectNumericId),
  });

  const historyQuery = useQuery({
    queryKey: ["quiz-history", subjectNumericId],
    enabled: Boolean(subjectNumericId) && activeTab === "history",
    queryFn: () => subjectService.getQuizHistory(subjectNumericId),
  });

  const createUnitMutation = useMutation({
    mutationFn: (name) => unitService.create(subjectNumericId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units", subjectNumericId] });
      setCreateUnitOpen(false);
      setNewUnitName("");
      toast({ title: "Unit created", description: "New unit has been added." });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id) => unitService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units", subjectNumericId] });
      queryClient.invalidateQueries({
        queryKey: ["questions", subjectNumericId],
      });
      setDeleteUnitItem(null);
      toast({
        title: "Unit deleted",
        description: "Unit removed, questions are now uncategorized.",
      });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({ id, name }) => unitService.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units", subjectNumericId] });
      setRenameUnitItem(null);
      setRenameUnitName("");
      toast({
        title: "Unit renamed",
        description: "Unit name updated successfully.",
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (payload) => questionService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questions", subjectNumericId],
      });
      queryClient.invalidateQueries({ queryKey: ["units", subjectNumericId] });
      setAddQuestionOpen(false);
      setNewQuestion(createEmptyQuestion());
      setSelectedUnitId("");
      toast({
        title: "Question added",
        description: "Question has been saved to the bank.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add question",
        description: error?.response?.data?.error || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const selectedSubject = subjects.find((item) => item.id === subjectNumericId);
  const units = unitsQuery.data?.units ?? [];
  const quizzes = historyQuery.data?.quizzes ?? [];

  const handleSaveQuestion = () => {
    const optionsMap = Object.fromEntries(
      newQuestion.options.map((o) => [o.key, o.value.trim()]),
    );
    if (!newQuestion.question_text.trim()) {
      toast({
        title: "Validation",
        description: "Question text is required.",
        variant: "destructive",
      });
      return;
    }
    if (!optionsMap.a || !optionsMap.b) {
      toast({
        title: "Validation",
        description: "Option A and B are required.",
        variant: "destructive",
      });
      return;
    }

    const unitId = selectedUnitId ? Number(selectedUnitId) : null;
    const payload = mapBuilderQuestionToApi(
      newQuestion,
      subjectNumericId,
      unitId,
    );
    createQuestionMutation.mutate(payload);
  };

  const onImportFile = async (event) => {
    setImportStatus("");
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseQuestionsExcel(file);
      if (!parsed.questions.length) {
        setImportStatus(
          `No valid rows found. ${parsed.warnings.slice(0, 5).join(" | ")}`,
        );
        return;
      }

      const newQuestions = parsed.questions.map(mapImportedQuestionToBuilder);
      setImportedQuestions((prev) => [...prev, ...newQuestions]);

      const warningMsg = parsed.warnings.length
        ? ` Warnings: ${parsed.warnings.slice(0, 3).join(" | ")}`
        : "";
      setImportStatus(
        `Added ${newQuestions.length} questions to preview.${warningMsg}`,
      );
      toast({
        title: "Import complete",
        description: `${newQuestions.length} questions added to preview.`,
      });
    } catch (error) {
      setImportStatus(
        error?.response?.data?.error || error.message || "Import failed",
      );
    } finally {
      event.target.value = "";
    }
  };

  const handleSaveImportedQuestions = async () => {
    if (!importedQuestions.length) return;

    setIsSavingImport(true);
    try {
      const questionsPayload = importedQuestions.map((q) => {
        const optionsMap = Object.fromEntries(
          q.options.map((o) => [o.key, o.value]),
        );
        return {
          question_text: q.question_text,
          option_a: optionsMap.a || "",
          option_b: optionsMap.b || "",
          option_c: optionsMap.c || null,
          option_d: optionsMap.d || null,
          correct_option: q.correct_option,
          points: Number(q.points || 1),
          has_equation: Boolean(q.has_equation),
          allow_multiple_answers: Boolean(q.allow_multiple_answers),
          is_required: Boolean(q.is_required),
          unit_id: q.unit_id || null,
          new_unit_name: q.new_unit_name || null,
          in_subject_bank: true,
        };
      });

      await questionService.bulkImport({
        subject_id: subjectNumericId,
        questions: questionsPayload,
      });

      queryClient.invalidateQueries({
        queryKey: ["questions", subjectNumericId],
      });
      queryClient.invalidateQueries({ queryKey: ["units", subjectNumericId] });
      setImportedQuestions([]);
      setImportStatus("");
      toast({
        title: "Saved to bank",
        description: `${questionsPayload.length} questions saved to question bank.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description:
          error?.response?.data?.error || "Failed to save questions.",
        variant: "destructive",
      });
    } finally {
      setIsSavingImport(false);
    }
  };

  return (
    <TeacherShell
      subjects={subjects}
      selectedSubjectId={subjectNumericId}
      onSelectSubject={(id) => navigate(`/teacher/questions/${id}`)}
      onOpenCreateSubject={() => navigate("/teacher")}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="min-w-0 break-words text-2xl font-bold tracking-tight">
            {selectedSubject?.name} Question Bank
          </h2>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="units">Unit Wise</TabsTrigger>
            <TabsTrigger value="history">Prev Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    setNewQuestion(createEmptyQuestion());
                    setSelectedUnitId("");
                    setAddQuestionOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
                <Label htmlFor="excel-import-bank" className="flex-1 cursor-pointer sm:flex-none">
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto">
                    <FileSpreadsheet className="h-4 w-4" />
                    Import Excel
                  </div>
                </Label>
                <Input
                  id="excel-import-bank"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={onImportFile}
                />
              </div>
              <Button onClick={() => setCreateUnitOpen(true)} variant="outline" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </div>

            {importStatus ? (
              <p className="text-xs text-muted-foreground">{importStatus}</p>
            ) : null}

            {importedQuestions.length > 0 ? (
              <div className="space-y-4">
                <QuestionPreviewList
                  questions={importedQuestions}
                  units={units}
                  onUpdateQuestion={(id, updated) =>
                    setImportedQuestions((prev) =>
                      prev.map((q) => (q.id === id ? updated : q)),
                    )
                  }
                  onRemoveQuestion={(id) =>
                    setImportedQuestions((prev) =>
                      prev.filter((q) => q.id !== id),
                    )
                  }
                  onClearAll={() => {
                    setImportedQuestions([]);
                    setImportStatus("");
                  }}
                />
                <div className="flex justify-end">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={handleSaveImportedQuestions}
                    disabled={isSavingImport}
                  >
                    {isSavingImport
                      ? "Saving..."
                      : `Save ${importedQuestions.length} Questions to Bank`}
                  </Button>
                </div>
              </div>
            ) : null}

            <Card>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {units.map((unit) => (
                    <AccordionItem key={unit.id} value={String(unit.id)}>
                      <AccordionTrigger className="px-4">
                        <div className="flex flex-1 flex-wrap items-center justify-between gap-2 pr-4">
                          <span className="min-w-0 break-words">
                            {unit.name}{" "}
                            <span className="text-muted-foreground ml-2 text-xs">
                              ({unit.question_count} questions)
                            </span>
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8"
                            >
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameUnitItem(unit);
                                  setRenameUnitName(unit.name);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setRenameUnitItem(unit);
                                    setRenameUnitName(unit.name);
                                  }
                                }}
                              >
                                Rename
                              </span>
                            </Button>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 h-8"
                            >
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteUnitItem(unit);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeleteUnitItem(unit);
                                  }
                                }}
                              >
                                Delete Unit
                              </span>
                            </Button>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <UnitSection
                          unitId={unit.id}
                          subjectId={subjectNumericId}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}

                  <AccordionItem value="uncategorized">
                    <AccordionTrigger className="px-4">
                      Uncategorized Questions
                    </AccordionTrigger>
                    <AccordionContent>
                      <UnitSection unitId={-1} subjectId={subjectNumericId} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quiz History</CardTitle>
                <CardDescription>
                  View questions from previous quizzes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!historyQuery.isLoading && quizzes.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No quiz history found.
                  </div>
                ) : null}
                <Accordion type="single" collapsible className="w-full">
                  {quizzes.map((quiz) => (
                    <AccordionItem key={quiz.id} value={String(quiz.id)}>
                      <AccordionTrigger className="px-4">
                        <div className="text-left">
                          <div>{quiz.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(
                              quiz.quiz_date || quiz.created_at,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            • {quiz.questions.length} Questions
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 pt-0">
                          <UnitQuestionsList
                            questions={quiz.questions}
                            onDelete={() => {}}
                            onEdit={() => {}}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Question Dialog */}
      <Dialog open={addQuestionOpen} onOpenChange={setAddQuestionOpen}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Question to Bank</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pl-2 pr-4">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Assign to Unit</Label>
                <Select
                  value={selectedUnitId}
                  onValueChange={setSelectedUnitId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Uncategorized" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <QuestionBuilder
                question={newQuestion}
                index={0}
                onChange={setNewQuestion}
                canRemove={false}
              />
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddQuestionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuestion}
              disabled={createQuestionMutation.isPending}
            >
              {createQuestionMutation.isPending ? "Saving..." : "Save Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Unit Dialog */}
      <Dialog open={createUnitOpen} onOpenChange={setCreateUnitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Unit</DialogTitle>
            <DialogDescription>
              Add a new unit to organize questions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Unit Name</Label>
              <Input
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="e.g. Algebra"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUnitOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createUnitMutation.mutate(newUnitName)}
              disabled={!newUnitName.trim() || createUnitMutation.isPending}
            >
              {createUnitMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Confirm */}
      <AlertDialog
        open={Boolean(deleteUnitItem)}
        onOpenChange={(open) => !open && setDeleteUnitItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteUnitItem?.name}"?
              Questions in this unit will be moved to "Uncategorized".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteUnitItem)
                  deleteUnitMutation.mutate(deleteUnitItem.id);
              }}
            >
              {deleteUnitMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(renameUnitItem)}
        onOpenChange={(open) => !open && setRenameUnitItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Unit</DialogTitle>
            <DialogDescription>
              Update unit name for this subject.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Unit Name</Label>
              <Input
                value={renameUnitName}
                onChange={(event) => setRenameUnitName(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameUnitItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!renameUnitItem) return;
                updateUnitMutation.mutate({
                  id: renameUnitItem.id,
                  name: renameUnitName.trim(),
                });
              }}
              disabled={!renameUnitName.trim() || updateUnitMutation.isPending}
            >
              {updateUnitMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherShell>
  );
}

function UnitSection({ unitId, subjectId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // unitId -1 means uncategorized
  const questionsQuery = useQuery({
    queryKey: ["questions", subjectId, "unit", unitId],
    queryFn: () => {
      if (unitId === -1) {
        return questionService.listBySubject(subjectId, {
          unit_id: -1,
          limit: 100,
        });
      }
      return unitService.getQuestions(unitId);
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => questionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", subjectId] });
      queryClient.invalidateQueries({ queryKey: ["units", subjectId] }); // Update counts
      toast({
        title: "Question deleted",
        description: "Question removed from bank.",
      });
    },
  });

  const editQuestionMutation = useMutation({
    mutationFn: ({ id, data }) => questionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", subjectId] });
      queryClient.invalidateQueries({ queryKey: ["units", subjectId] });
      toast({ title: "Question updated", description: "Changes saved." });
    },
  });

  const questions = questionsQuery.data?.questions ?? [];

  if (questionsQuery.isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <Spinner label="Loading questions..." />
      </div>
    );
  }

  return (
    <div className="p-0">
      <UnitQuestionsList
        questions={questions}
        onDelete={(id) => deleteQuestionMutation.mutate(id)}
        onEdit={(id, data) => editQuestionMutation.mutate({ id, data })}
      />
      {questions.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No questions found.
        </div>
      ) : null}
    </div>
  );
}
