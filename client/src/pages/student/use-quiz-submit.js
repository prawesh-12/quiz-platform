import { useCallback, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

import { pushToast } from "@/hooks/useToast";
import { sessionService } from "@/services/sessionService";

import {
  QUIZ_ENDED_MESSAGE,
  QUIZ_NOT_STARTED_MESSAGE,
  QUIZ_STATE_ENDED,
  QUIZ_STATE_SCHEDULED,
  SUBMIT_FAILED_MESSAGE,
  clearQuizSessionStorage,
  createSubmissionId,
  toAnswerPayload
} from "./quiz-session";

const NO_SECONDS = 0;
const SUBMIT_SUCCESS_DESCRIPTION = "Your answers have been submitted successfully.";
const SESSION_ENDED_DESCRIPTION =
  "This quiz is no longer accepting answers. Showing your results.";

function resolveSubmitErrorMessage(apiData) {
  if (apiData?.quiz_state === QUIZ_STATE_SCHEDULED) {
    return QUIZ_NOT_STARTED_MESSAGE;
  }

  if (apiData?.quiz_state === QUIZ_STATE_ENDED) {
    return apiData.error || QUIZ_ENDED_MESSAGE;
  }

  return apiData?.error || SUBMIT_FAILED_MESSAGE;
}

async function sendSubmission({ answers, submitMutation, syncServerTiming, setters }) {
  setters.setSubmitError("");
  const submittedAnswers = toAnswerPayload(Object.entries(answers));

  try {
    const response = await submitMutation.mutateAsync({ submittedAnswers });
    syncServerTiming(response);
    setters.setResult(response);
    setters.setHasSubmitted(true);
    pushToast({ title: "Submitted", description: SUBMIT_SUCCESS_DESCRIPTION });
    clearQuizSessionStorage();
  } catch (error) {
    const apiData = error?.response?.data;
    if (apiData) {
      syncServerTiming(apiData);
    }

    setters.setSubmitError(resolveSubmitErrorMessage(apiData));
  }
}

function useSubmitMutation(sessionToken) {
  const submissionIdRef = useRef(createSubmissionId());

  return useMutation({
    mutationFn: ({ submittedAnswers }) =>
      sessionService.submit(
        { answers: submittedAnswers, submission_id: submissionIdRef.current },
        sessionToken
      )
  });
}

// Auto-submits once the server clock closes the window, and re-arms if time is restored.
function useAutoSubmit({ payload, hasSubmitted, quizState, timerSeconds, submitQuiz }) {
  const autoSubmitTriggeredRef = useRef(false);

  useEffect(() => {
    if (timerSeconds > NO_SECONDS) {
      autoSubmitTriggeredRef.current = false;
    }
  }, [timerSeconds]);

  useEffect(() => {
    if (!payload || hasSubmitted || quizState !== QUIZ_STATE_ENDED) {
      return;
    }

    if (!autoSubmitTriggeredRef.current) {
      autoSubmitTriggeredRef.current = true;
      submitQuiz();
    }
  }, [hasSubmitted, payload, quizState, submitQuiz]);
}

// Blocks the browser back button once the paper is gone, so it cannot be re-entered.
function useBackNavigationBlock(hasSubmitted) {
  useEffect(() => {
    if (!hasSubmitted) {
      return undefined;
    }

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasSubmitted]);
}

export function useQuizSubmit({ session, timing, answers, hasSubmitted, setters }) {
  const { payload, sessionToken } = session;
  const { quizState, timerSeconds, syncServerTiming } = timing;
  const submitMutation = useSubmitMutation(sessionToken);

  const submitQuiz = useCallback(async () => {
    if (!sessionToken || hasSubmitted || submitMutation.isPending) {
      return;
    }

    await sendSubmission({ answers, submitMutation, syncServerTiming, setters });
  }, [answers, hasSubmitted, sessionToken, setters, submitMutation, syncServerTiming]);

  // The server closed the session under us, so surface its result instead of submitting.
  const handleSessionClosed = useCallback(
    (closedResult) => {
      setters.setResult(closedResult);
      setters.setHasSubmitted(true);
      clearQuizSessionStorage();
      pushToast({
        title: "Session ended",
        description: SESSION_ENDED_DESCRIPTION,
        variant: "destructive"
      });
    },
    [setters]
  );

  useAutoSubmit({ payload, hasSubmitted, quizState, timerSeconds, submitQuiz });
  useBackNavigationBlock(hasSubmitted);

  return { submitQuiz, handleSessionClosed, isSubmitting: submitMutation.isPending };
}
