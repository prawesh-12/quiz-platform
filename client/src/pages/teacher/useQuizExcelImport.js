import { useState } from "react";

import { useToast } from "@/hooks/useToast";
import { parseQuestionsExcel } from "@/utils/excelParser";
import { mapImportedQuestionToBuilder } from "@/pages/teacher/quizQuestionMappers";

const IMPORT_WARNING_LIMIT = 3;
const IMPORT_ERROR_LIMIT = 5;

function buildEmptyStatus(warnings) {
  return `No valid rows found. ${warnings.slice(0, IMPORT_ERROR_LIMIT).join(" | ")}`;
}

function buildAddedStatus(addedCount, warnings) {
  const warningMessage = warnings.length
    ? ` Warnings: ${warnings.slice(0, IMPORT_WARNING_LIMIT).join(" | ")}`
    : "";
  return `Added ${addedCount} questions to preview.${warningMessage}`;
}

// Holds Excel-imported questions in a preview list until the quiz itself is saved.
export function useQuizExcelImport(onBeforeImport) {
  const { toast } = useToast();
  const [importedQuestions, setImportedQuestions] = useState([]);
  const [importStatus, setImportStatus] = useState("");

  const onImportFile = async (event) => {
    setImportStatus("");
    onBeforeImport?.();

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const parsed = await parseQuestionsExcel(file);

      if (!parsed.questions.length) {
        setImportStatus(buildEmptyStatus(parsed.warnings));
        return;
      }

      const newQuestions = parsed.questions.map(mapImportedQuestionToBuilder);
      setImportedQuestions((previous) => [...previous, ...newQuestions]);
      setImportStatus(buildAddedStatus(newQuestions.length, parsed.warnings));
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

  return { importedQuestions, setImportedQuestions, importStatus, onImportFile };
}
