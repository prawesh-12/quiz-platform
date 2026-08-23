import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/useToast";
import { mapBuilderQuestionToApi, mapImportedQuestionToBuilder } from "@/pages/teacher/quizQuestionMappers";
import { questionService } from "@/services/questionService";
import { parseQuestionsExcel } from "@/utils/excelParser";

const WARNING_LIMIT = 3;
const ERROR_LIMIT = 5;

function joinWarnings(warnings, limit) {
  return warnings.slice(0, limit).join(" | ");
}

function toBankQuestions(parsed) {
  return parsed.questions
    .map(mapImportedQuestionToBuilder)
    .map((question) => ({ ...question, in_subject_bank: true }));
}

function describeImport(count, warnings) {
  if (!warnings.length) {
    return `Added ${count} questions to preview.`;
  }

  return `Added ${count} questions to preview. Warnings: ${joinWarnings(warnings, WARNING_LIMIT)}`;
}

function readErrorMessage(error, fallback) {
  return error?.response?.data?.error || error?.message || fallback;
}

function useImportState() {
  const [importedQuestions, setImportedQuestions] = useState([]);
  const [importStatus, setImportStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const clearImport = () => {
    setImportedQuestions([]);
    setImportStatus("");
  };

  return {
    importedQuestions,
    setImportedQuestions,
    importStatus,
    setImportStatus,
    isSaving,
    setIsSaving,
    clearImport
  };
}

function useFilePicker(state, toast) {
  return async (event) => {
    state.setImportStatus("");
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseQuestionsExcel(file);
      if (!parsed.questions.length) {
        state.setImportStatus(`No valid rows found. ${joinWarnings(parsed.warnings, ERROR_LIMIT)}`);
        return;
      }

      const nextQuestions = toBankQuestions(parsed);
      state.setImportedQuestions((previous) => [...previous, ...nextQuestions]);
      state.setImportStatus(describeImport(nextQuestions.length, parsed.warnings));
      toast({ title: "Import complete", description: `${nextQuestions.length} questions added to preview.` });
    } catch (error) {
      state.setImportStatus(readErrorMessage(error, "Import failed"));
    } finally {
      event.target.value = "";
    }
  };
}

function useBankSaver(state, subjectId, queryClient, toast) {
  return async () => {
    if (!state.importedQuestions.length) return;

    state.setIsSaving(true);
    try {
      const questions = state.importedQuestions.map((question) => ({
        ...mapBuilderQuestionToApi(question),
        in_subject_bank: true
      }));

      await questionService.bulkImport({ subject_id: subjectId, questions });
      queryClient.invalidateQueries({ queryKey: ["questions", subjectId] });
      queryClient.invalidateQueries({ queryKey: ["units", subjectId] });
      state.clearImport();
      toast({ title: "Saved to bank", description: `${questions.length} questions saved to question bank.` });
    } catch (error) {
      toast({
        title: "Import failed",
        description: readErrorMessage(error, "Failed to save questions."),
        variant: "destructive"
      });
    } finally {
      state.setIsSaving(false);
    }
  };
}

export function useBankExcelImport(subjectId) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const state = useImportState();

  return {
    importedQuestions: state.importedQuestions,
    setImportedQuestions: state.setImportedQuestions,
    importStatus: state.importStatus,
    isSaving: state.isSaving,
    onImportFile: useFilePicker(state, toast),
    saveImportedQuestions: useBankSaver(state, subjectId, queryClient, toast),
    clearImport: state.clearImport
  };
}
