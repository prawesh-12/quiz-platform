import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { useShellSubject } from "@/components/layout/shellOutletContext";
import AddBankQuestionDialog from "@/components/teacher/AddBankQuestionDialog";
import BankUnitAccordion from "@/components/teacher/BankUnitAccordion";
import QuizHistoryAccordion from "@/components/teacher/QuizHistoryAccordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeacherSubjects } from "@/hooks/useTeacherSubjects";
import { useToast } from "@/hooks/useToast";
import { questionService } from "@/services/questionService";
import { subjectService } from "@/services/subjectService";
import { unitService } from "@/services/unitService";
import { theme } from "@/theme";
import {
  createEmptyQuestion,
  mapBuilderQuestionToApi,
} from "@/pages/teacher/quizQuestionMappers";
import { useBankExcelImport } from "@/pages/teacher/useBankExcelImport";
import { useUnitDialogState } from "@/pages/teacher/useUnitDialogState";

import UnitDialogs from "./question-bank-dialogs";
import { ImportedQuestionsPreview, QuestionBankToolbar } from "./question-bank-parts";

function toBankQuestion(question, subjectId, unitId) {
  return {
    ...mapBuilderQuestionToApi(question),
    subject_id: subjectId,
    unit_id: unitId || null,
    in_subject_bank: true,
  };
}

function findQuestionError(question) {
  if (!question.question_text.trim()) {
    return "Question text is required.";
  }

  const optionsMap = Object.fromEntries(question.options.map((option) => [option.key, option.value.trim()]));
  if (!optionsMap.a || !optionsMap.b) {
    return "Option A and B are required.";
  }

  return null;
}

export default function QuestionBankPage() {
  const queryClient = useQueryClient();
  const { subjectId } = useParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("units");

  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState(createEmptyQuestion());
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const subjectNumericId = useMemo(() => Number(subjectId), [subjectId]);
  const bankImport = useBankExcelImport(subjectNumericId);

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

  const unitDialogs = useUnitDialogState(subjectNumericId);

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

  const { subjects } = useTeacherSubjects();
  const selectedSubject = subjects.find((item) => item.id === subjectNumericId);
  const units = unitsQuery.data?.units ?? [];
  const quizzes = historyQuery.data?.quizzes ?? [];

  useShellSubject(subjectNumericId);

  const openAddQuestion = () => {
    setNewQuestion(createEmptyQuestion());
    setSelectedUnitId("");
    setAddQuestionOpen(true);
  };

  const handleSaveQuestion = () => {
    const validationError = findQuestionError(newQuestion);
    if (validationError) {
      toast({ title: "Validation", description: validationError, variant: "destructive" });
      return;
    }

    const unitId = Number(selectedUnitId) || null;
    createQuestionMutation.mutate(toBankQuestion(newQuestion, subjectNumericId, unitId));
  };

  return (
    <>
      <div className="space-y-6">
        <h1
          className="min-w-0 break-words text-2xl font-bold tracking-tight"
          style={{ color: theme.text.primary }}
        >
          {selectedSubject?.name} Question Bank
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="units">Unit Wise</TabsTrigger>
            <TabsTrigger value="history">Prev Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="space-y-4">
            <QuestionBankToolbar
              onAddQuestion={openAddQuestion}
              onImportFile={bankImport.onImportFile}
              onAddUnit={unitDialogs.create.open}
            />

            {bankImport.importStatus ? (
              <p className="text-xs" style={{ color: theme.text.muted }}>
                {bankImport.importStatus}
              </p>
            ) : null}

            <ImportedQuestionsPreview bankImport={bankImport} units={units} />

            <BankUnitAccordion
              units={units}
              subjectId={subjectNumericId}
              onRenameUnit={unitDialogs.rename.start}
              onDeleteUnit={unitDialogs.remove.select}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <QuizHistoryAccordion quizzes={quizzes} isLoading={historyQuery.isLoading} />
          </TabsContent>
        </Tabs>
      </div>

      <AddBankQuestionDialog
        open={addQuestionOpen}
        onOpenChange={setAddQuestionOpen}
        units={units}
        selectedUnitId={selectedUnitId}
        onSelectedUnitChange={setSelectedUnitId}
        question={newQuestion}
        onQuestionChange={setNewQuestion}
        onSave={handleSaveQuestion}
        isPending={createQuestionMutation.isPending}
      />

      <UnitDialogs unit={unitDialogs} />
    </>
  );
}
