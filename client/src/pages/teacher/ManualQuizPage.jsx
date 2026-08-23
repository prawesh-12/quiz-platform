import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { useShellSubject } from "@/components/layout/shellOutletContext";
import QuestionListEditor from "@/components/teacher/QuestionListEditor";
import QuestionPreviewList from "@/components/teacher/QuestionPreviewList";
import QuizMetaFields from "@/components/teacher/QuizMetaFields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeacherSubjects } from "@/hooks/useTeacherSubjects";
import { quizService } from "@/services/quizService";
import { unitService } from "@/services/unitService";
import { theme } from "@/theme";
import {
  createEmptyQuestion,
  mapBackendQuestionToBuilder
} from "@/pages/teacher/quizQuestionMappers";
import { buildShareUrlFromToken, moveItem } from "@/pages/teacher/manualQuizHelpers";
import { useManualQuizActions } from "@/pages/teacher/useManualQuizActions";
import { useManualQuizForm } from "@/pages/teacher/useManualQuizForm";
import { useManualQuizPreview } from "@/pages/teacher/useManualQuizPreview";
import { useQuizExcelImport } from "@/pages/teacher/useQuizExcelImport";

import { ManualQuizDialogs, ManualQuizToolbar } from "./manual-quiz-parts";

export default function ManualQuizPage() {
  const { quizId } = useParams();
  const isExistingQuiz = Boolean(quizId);

  const form = useManualQuizForm();
  const { subjectId } = form.values;
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [pageError, setPageError] = useState("");
  const [importSubjectId, setImportSubjectId] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { subjects } = useTeacherSubjects();
  const excelImport = useQuizExcelImport(() => setPageError(""));

  const unitsQuery = useQuery({
    queryKey: ["units", subjectId],
    queryFn: () => unitService.listBySubject(subjectId),
    enabled: Boolean(subjectId)
  });

  const quizDetailQuery = useQuery({
    queryKey: ["quizzes", quizId],
    enabled: isExistingQuiz,
    queryFn: () => quizService.getById(quizId)
  });

  useEffect(() => {
    if (!subjects.length || subjectId) {
      return;
    }

    form.setSubjectId(String(subjects[0].id));
    setImportSubjectId(String(subjects[0].id));
  }, [subjectId, subjects]);

  useEffect(() => {
    if (!quizDetailQuery.data) {
      return;
    }

    const { quiz, questions: quizQuestions } = quizDetailQuery.data;

    form.hydrate(quiz);
    setImportSubjectId(String(quiz.subject_id || ""));
    setQuestions(quizQuestions.length ? quizQuestions.map(mapBackendQuestionToBuilder) : [createEmptyQuestion()]);
  }, [quizDetailQuery.data]);

  useShellSubject(Number(subjectId) || null);

  const preview = useManualQuizPreview({
    quizId,
    isExistingQuiz,
    isOpen: isPreviewOpen,
    setIsOpen: setIsPreviewOpen,
    form,
    questions
  });

  const actions = useManualQuizActions({
    form,
    quizId,
    isExistingQuiz,
    questions,
    importedQuestions: excelImport.importedQuestions,
    persistedShareUrl: isExistingQuiz
      ? buildShareUrlFromToken(quizDetailQuery.data?.quiz?.access_token)
      : "",
    setPageError
  });

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
          <CardHeader className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Manual Quiz Page</CardTitle>
            </div>
            <ManualQuizToolbar
              isSaving={actions.isSaving}
              onSaveDraft={actions.saveAsDraft}
              onPreview={() => setIsPreviewOpen(true)}
              onActivate={actions.activateQuiz}
            />
          </CardHeader>
          <CardContent className="w-full space-y-3 p-4 pt-4 sm:p-6">
            <QuizMetaFields
              subjects={subjects}
              isExistingQuiz={isExistingQuiz}
              importStatus={excelImport.importStatus}
              values={{ ...form.values, importSubjectId }}
              handlers={{
                ...form.handlers,
                onImportSubjectChange: setImportSubjectId,
                onImportFile: excelImport.onImportFile
              }}
            />
          </CardContent>
        </Card>

        {excelImport.importedQuestions.length > 0 ? (
          <QuestionPreviewList
            questions={excelImport.importedQuestions}
            units={unitsQuery.data?.units ?? []}
            onUpdateQuestion={(id, updated) =>
              excelImport.setImportedQuestions((previous) =>
                previous.map((item) => (item.id === id ? updated : item))
              )
            }
            onRemoveQuestion={(id) =>
              excelImport.setImportedQuestions((previous) => previous.filter((item) => item.id !== id))
            }
            onClearAll={() => excelImport.setImportedQuestions([])}
          />
        ) : null}

        <QuestionListEditor
          questions={questions}
          isReadOnly={isExistingQuiz}
          onMove={(from, to) => setQuestions((previous) => moveItem(previous, from, to))}
          onRemove={(id) => setQuestions((previous) => previous.filter((item) => item.id !== id))}
          onChange={(id, next) => setQuestions((previous) => previous.map((item) => (item.id === id ? next : item)))}
          onAdd={() => setQuestions((previous) => [...previous, createEmptyQuestion()])}
        />

        {pageError ? <p className="text-sm text-destructive">{pageError}</p> : null}
      </div>

      <ManualQuizDialogs share={actions.share} preview={preview} />
    </>
  );
}
