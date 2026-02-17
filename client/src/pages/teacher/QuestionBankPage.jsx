import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import UnitQuestionsList from "@/components/teacher/UnitQuestionsList";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { questionService } from "@/services/questionService";
import { subjectService } from "@/services/subjectService";
import { unitService } from "@/services/unitService";

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { subjectId } = useParams();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("units");
  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [deleteUnitItem, setDeleteUnitItem] = useState(null);

  const subjectNumericId = useMemo(() => Number(subjectId), [subjectId]);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const unitsQuery = useQuery({
    queryKey: ["units", subjectNumericId],
    enabled: Boolean(subjectNumericId),
    queryFn: () => unitService.listBySubject(subjectNumericId)
  });

  const historyQuery = useQuery({
    queryKey: ["quiz-history", subjectNumericId],
    enabled: Boolean(subjectNumericId) && activeTab === "history",
    queryFn: () => subjectService.getQuizHistory(subjectNumericId)
  });

  const createUnitMutation = useMutation({
    mutationFn: (name) => unitService.create(subjectNumericId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units", subjectNumericId] });
      setCreateUnitOpen(false);
      setNewUnitName("");
      toast({ title: "Unit created", description: "New unit has been added." });
    }
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id) => unitService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units", subjectNumericId] });
      // Also invalidate questions as they are unlinked
      queryClient.invalidateQueries({ queryKey: ["questions", subjectNumericId] });
      setDeleteUnitItem(null);
      toast({ title: "Unit deleted", description: "Unit removed, questions are now uncategorized." });
    }
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const selectedSubject = subjects.find((item) => item.id === subjectNumericId);
  const units = unitsQuery.data?.units ?? [];
  const quizzes = historyQuery.data?.quizzes ?? [];

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
            <h2 className="text-2xl font-bold tracking-tight">{selectedSubject?.name} Question Bank</h2>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="units">Unit Wise</TabsTrigger>
            <TabsTrigger value="history">Prev Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setCreateUnitOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {units.map((unit) => (
                    <AccordionItem key={unit.id} value={String(unit.id)}>
                      <AccordionTrigger className="px-4">
                        <div className="flex flex-1 items-center justify-between pr-4">
                          <span>{unit.name} <span className="text-muted-foreground ml-2 text-xs">({unit.question_count} questions)</span></span>
                           <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteUnitItem(unit);
                              }}
                            >
                              Delete Unit
                            </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                         <UnitSection unitId={unit.id} subjectId={subjectNumericId} />
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
                    <CardDescription>View questions from previous quizzes.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {!historyQuery.isLoading && quizzes.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">No quiz history found.</div>
                    ) : null}
                     <Accordion type="single" collapsible className="w-full">
                        {quizzes.map(quiz => (
                            <AccordionItem key={quiz.id} value={String(quiz.id)}>
                                <AccordionTrigger className="px-4">
                                    <div className="text-left">
                                        <div>{quiz.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(quiz.quiz_date || quiz.created_at).toLocaleDateString()} • {quiz.questions.length} Questions
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-4 pt-0">
                                         <UnitQuestionsList 
                                            questions={quiz.questions} 
                                            onDelete={() => {}} // Read-only mostly? Or allow deleting from bank? 
                                            // Questions in history might be in bank or not. 
                                            // We probably just want to view them. 
                                            // UnitQuestionsList has specific delete logic.
                                            // Let's pass a no-op or make delete optional in UnitQuestionsList
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

      <Dialog open={createUnitOpen} onOpenChange={setCreateUnitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Unit</DialogTitle>
            <DialogDescription>Add a new unit to organize questions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Unit Name</Label>
              <Input value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="e.g. Algebra" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUnitOpen(false)}>Cancel</Button>
            <Button 
                onClick={() => createUnitMutation.mutate(newUnitName)} 
                disabled={!newUnitName.trim() || createUnitMutation.isPending}
            >
                {createUnitMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteUnitItem)} onOpenChange={(open) => !open && setDeleteUnitItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteUnitItem?.name}"? Questions in this unit will be moved to "Uncategorized".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteUnitItem) deleteUnitMutation.mutate(deleteUnitItem.id);
              }}
            >
              {deleteUnitMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
                return questionService.listBySubject(subjectId, { unit_id: -1, limit: 100 }); 
            }
            return unitService.getQuestions(unitId);
        }
    });

    const deleteQuestionMutation = useMutation({
        mutationFn: (id) => questionService.remove(id),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["questions", subjectId] });
             queryClient.invalidateQueries({ queryKey: ["units", subjectId] }); // Update counts
             toast({ title: "Question deleted", description: "Question removed from bank." });
        }
    });

    const questions = questionsQuery.data?.questions ?? [];

    if (questionsQuery.isLoading) {
        return <div className="p-4 text-sm text-muted-foreground">Loading questions...</div>;
    }

    return (
        <div className="p-0">
             <UnitQuestionsList 
                questions={questions} 
                onDelete={(id) => deleteQuestionMutation.mutate(id)} 
             />
             {questions.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">No questions found.</div> : null}
        </div>
    );
}
