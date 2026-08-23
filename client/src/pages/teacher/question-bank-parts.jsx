import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import Plus from "lucide-react/dist/esm/icons/plus";

import QuestionPreviewList from "@/components/teacher/QuestionPreviewList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { theme } from "@/theme";

const IMPORT_INPUT_ID = "excel-import-bank";

function ImportExcelButton({ onImportFile }) {
  return (
    <>
      <Label htmlFor={IMPORT_INPUT_ID} className="flex-1 cursor-pointer sm:flex-none">
        <span
          className="inline-flex w-full items-center justify-center gap-2 border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--ds-accent-tint)] sm:w-auto"
          style={{
            borderRadius: theme.radius.md,
            borderColor: theme.border.input,
            backgroundColor: theme.bg.card,
            color: theme.text.primary
          }}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Import Excel
        </span>
      </Label>
      <Input
        id={IMPORT_INPUT_ID}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={onImportFile}
      />
    </>
  );
}

export function QuestionBankToolbar({ onAddQuestion, onImportFile, onAddUnit }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" className="flex-1 sm:flex-none" onClick={onAddQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>

        <ImportExcelButton onImportFile={onImportFile} />
      </div>

      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onAddUnit}>
        <Plus className="mr-2 h-4 w-4" />
        Add Unit
      </Button>
    </div>
  );
}

export function ImportedQuestionsPreview({ bankImport, units }) {
  if (bankImport.importedQuestions.length === 0) {
    return null;
  }

  const { importedQuestions, setImportedQuestions } = bankImport;

  return (
    <div className="space-y-4">
      <QuestionPreviewList
        questions={importedQuestions}
        units={units}
        onUpdateQuestion={(id, updated) =>
          setImportedQuestions((previous) => previous.map((item) => (item.id === id ? updated : item)))
        }
        onRemoveQuestion={(id) =>
          setImportedQuestions((previous) => previous.filter((item) => item.id !== id))
        }
        onClearAll={bankImport.clearImport}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={bankImport.saveImportedQuestions}
          disabled={bankImport.isSaving}
        >
          {bankImport.isSaving ? "Saving..." : `Save ${importedQuestions.length} Questions to Bank`}
        </Button>
      </div>
    </div>
  );
}
