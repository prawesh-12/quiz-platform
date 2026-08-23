import { useQuery } from "@tanstack/react-query";

import { quizService } from "@/services/quizService";
import { mapPreviewQuestion } from "@/pages/teacher/quizQuestionMappers";

function toDraftPreviewQuestions(questions) {
  return questions.map((question) => ({
    id: question.id,
    question_text: question.question_text,
    options: question.options,
    correct_option: question.correct_option
  }));
}

// A saved quiz previews what the server stored; an unsaved one previews the builder's questions.
export function useManualQuizPreview({ quizId, isExistingQuiz, isOpen, setIsOpen, form, questions }) {
  const previewQuery = useQuery({
    queryKey: ["quizzes", quizId, "preview"],
    enabled: isExistingQuiz && isOpen,
    queryFn: () => quizService.getPreview(quizId)
  });

  const savedQuiz = previewQuery.data?.quiz;

  return {
    isOpen,
    setIsOpen,
    title: (isExistingQuiz && savedQuiz?.title) || form.values.title,
    durationMins: Number((isExistingQuiz && savedQuiz?.duration_mins) || form.values.durationMins),
    questions: isExistingQuiz
      ? (previewQuery.data?.questions || []).map(mapPreviewQuestion)
      : toDraftPreviewQuestions(questions),
    isLoading: isExistingQuiz && previewQuery.isLoading,
    isError: isExistingQuiz && previewQuery.isError,
    errorMessage: previewQuery.error?.response?.data?.error || "Failed to load preview"
  };
}
