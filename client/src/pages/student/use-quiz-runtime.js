import { useMemo, useState } from "react";

import { useProctoring } from "@/hooks/useProctoring";

import { QUIZ_STATE_ACTIVE, loadStoredAnswers } from "./quiz-session";
import { useQuizAutosave } from "./use-quiz-autosave";
import { useQuizSubmit } from "./use-quiz-submit";
import { useQuizTiming } from "./use-quiz-timing";

function isProctoringEnabled({ payload, sessionToken }, hasSubmitted, quizState) {
  return Boolean(payload && sessionToken && !hasSubmitted && quizState === QUIZ_STATE_ACTIVE);
}

function createSelectOption(timing, setters, autosave) {
  return (questionId, optionKey) => {
    if (timing.quizState !== QUIZ_STATE_ACTIVE) {
      return;
    }

    setters.setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
    autosave.queueAnswer(questionId, optionKey);
  };
}

function useAttemptState() {
  const [submitError, setSubmitError] = useState("");
  // Restored from sessionStorage so a mid-quiz reload keeps the student's selections.
  const [answers, setAnswers] = useState(loadStoredAnswers);
  const [result, setResult] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // State setters never change identity, so this bundle stays stable for effect deps.
  const setters = useMemo(
    () => ({ setSubmitError, setAnswers, setResult, setHasSubmitted }),
    []
  );

  return { submitError, answers, result, hasSubmitted, setters };
}

// Owns every moving part of a live attempt: clock, autosave queue, proctoring and submit.
export function useQuizRuntime(session) {
  const state = useAttemptState();
  const { answers, hasSubmitted, setters } = state;

  const timing = useQuizTiming({
    session,
    hasSubmitted,
    onTimingError: setters.setSubmitError
  });

  useProctoring({
    sessionToken: session.sessionToken,
    enabled: isProctoringEnabled(session, hasSubmitted, timing.quizState)
  });

  const submit = useQuizSubmit({ session, timing, answers, hasSubmitted, setters });

  const autosave = useQuizAutosave({
    session,
    answers,
    hasSubmitted,
    timing,
    onSessionClosed: submit.handleSessionClosed,
    onSaveError: setters.setSubmitError
  });

  return {
    answers,
    result: state.result,
    hasSubmitted,
    submitError: state.submitError,
    timing,
    submit,
    autosave,
    selectOption: createSelectOption(timing, setters, autosave)
  };
}
