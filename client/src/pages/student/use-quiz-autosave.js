import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { sessionService } from "@/services/sessionService";
import { backoffWithJitter } from "@/utils/jitter";
import { QUIZ_SESSION_ANSWERS_KEY, QUIZ_SESSION_DIRTY_KEY } from "@/utils/sessionKeys";

import {
  QUIZ_ENDED_MESSAGE,
  QUIZ_STATE_ACTIVE,
  QUIZ_STATE_ENDED,
  loadStoredDirtyAnswers,
  persistJson,
  toAnswerPayload
} from "./quiz-session";

const AUTOSAVE_DEBOUNCE_MS = 1000;
const SINGLE_ANSWER_COUNT = 1;
const NO_PENDING_ANSWERS = 0;
const NO_RETRY_ATTEMPTS = 0;

function isAutosaveAllowed({ sessionToken, hasSubmitted, payload, quizState }) {
  return Boolean(sessionToken && !hasSubmitted && payload && quizState === QUIZ_STATE_ACTIVE);
}

function saveAnswers(partialAnswers, sessionToken) {
  if (partialAnswers.length === SINGLE_ANSWER_COUNT) {
    const [answer] = partialAnswers;
    return sessionService.saveAnswer(
      answer.question_id,
      { selected_option: answer.selected_option },
      sessionToken
    );
  }

  return sessionService.saveProgress({ answers: partialAnswers }, sessionToken);
}

function buildClosedResult(data) {
  return {
    score: data.score ?? 0,
    total_points: data.total_points ?? 0,
    percentage: data.percentage ?? 0,
    breakdown: Array.isArray(data.breakdown) ? data.breakdown : []
  };
}

function dropSyncedAnswers(previous, syncedEntries) {
  const next = { ...previous };

  for (const [questionId, selectedOption] of syncedEntries) {
    if (next[questionId] === selectedOption) {
      delete next[questionId];
    }
  }

  return next;
}

function sendDirtyAnswers({ progressMutation, dirtyEntries, retry, setDirtyAnswers }) {
  return progressMutation
    .mutateAsync({ partialAnswers: toAnswerPayload(dirtyEntries) })
    .then(() => {
      retry.reset();
      setDirtyAnswers((prev) => dropSyncedAnswers(prev, dirtyEntries));
    })
    .catch(retry.schedule);
}

function useProgressMutation({ sessionToken, syncServerTiming, onSessionClosed, onSaveError }) {
  return useMutation({
    mutationFn: ({ partialAnswers }) => saveAnswers(partialAnswers, sessionToken),
    onSuccess: (data) => {
      syncServerTiming(data);

      if (data?.session_closed) {
        onSessionClosed(buildClosedResult(data));
      }
    },
    onError: (error) => {
      const apiData = error?.response?.data;
      if (apiData) {
        syncServerTiming(apiData);
      }

      if (apiData?.quiz_state === QUIZ_STATE_ENDED) {
        onSaveError(apiData.error || QUIZ_ENDED_MESSAGE);
      }
    }
  });
}

function useRetryScheduler() {
  const attemptRef = useRef(NO_RETRY_ATTEMPTS);
  const [retryTick, setRetryTick] = useState(NO_RETRY_ATTEMPTS);

  // Keep the queue and retry with backoff rather than waiting for the next answer change.
  const retry = useMemo(
    () => ({
      reset: () => {
        attemptRef.current = NO_RETRY_ATTEMPTS;
      },
      schedule: () => {
        const delay = backoffWithJitter(attemptRef.current);
        attemptRef.current += 1;
        window.setTimeout(() => setRetryTick((tick) => tick + 1), delay);
      }
    }),
    []
  );

  return { retry, retryTick, attemptRef };
}

function useDirtyAnswerMirror(dirtyAnswers, answers) {
  // Live mirror of dirtyAnswers so flush handlers read the latest without re-binding.
  const dirtyAnswersRef = useRef(dirtyAnswers);

  useEffect(() => {
    dirtyAnswersRef.current = dirtyAnswers;
    persistJson(QUIZ_SESSION_DIRTY_KEY, dirtyAnswers);
  }, [dirtyAnswers]);

  // Persist chosen answers so a mid-quiz reload restores the student's selections.
  useEffect(() => {
    persistJson(QUIZ_SESSION_ANSWERS_KEY, answers);
  }, [answers]);

  return dirtyAnswersRef;
}

// Debounced autosave: fire ~1s after the last change, or when a backoff retry ticks.
function useDebouncedFlush({ session, hasSubmitted, quizState, dirtyAnswers, flush, retryTick }) {
  const { payload, sessionToken } = session;

  useEffect(() => {
    if (!isAutosaveAllowed({ sessionToken, hasSubmitted, payload, quizState })) {
      return undefined;
    }

    if (!Object.keys(dirtyAnswers).length) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      flush();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [dirtyAnswers, flush, hasSubmitted, payload, quizState, retryTick, sessionToken]);
}

// Flush pending answers when the tab is hidden or the page unloads.
function useFlushOnHide({ sessionToken, hasSubmitted, flush }) {
  useEffect(() => {
    if (!sessionToken || hasSubmitted) {
      return undefined;
    }

    const flushOnHide = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    document.addEventListener("visibilitychange", flushOnHide);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", flushOnHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [flush, hasSubmitted, sessionToken]);
}

function useQueueAnswer(setDirtyAnswers) {
  return useCallback(
    (questionId, optionKey) => {
      setDirtyAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
    },
    [setDirtyAnswers]
  );
}

export function useQuizAutosave({ session, answers, hasSubmitted, timing, onSaveError, onSessionClosed }) {
  const { payload, sessionToken } = session;
  const { quizState, syncServerTiming } = timing;
  const [dirtyAnswers, setDirtyAnswers] = useState(loadStoredDirtyAnswers);
  const { retry, retryTick, attemptRef } = useRetryScheduler();
  const progressMutation = useProgressMutation({
    sessionToken,
    syncServerTiming,
    onSessionClosed,
    onSaveError
  });
  const dirtyAnswersRef = useDirtyAnswerMirror(dirtyAnswers, answers);

  const flush = useCallback(() => {
    if (!isAutosaveAllowed({ sessionToken, hasSubmitted, payload, quizState })) {
      return Promise.resolve();
    }

    const dirtyEntries = Object.entries(dirtyAnswersRef.current);
    if (!dirtyEntries.length) {
      return Promise.resolve();
    }

    return sendDirtyAnswers({ progressMutation, dirtyEntries, retry, setDirtyAnswers });
  }, [dirtyAnswersRef, hasSubmitted, payload, progressMutation, quizState, retry, sessionToken]);

  useDebouncedFlush({ session, hasSubmitted, quizState, dirtyAnswers, flush, retryTick });
  useFlushOnHide({ sessionToken, hasSubmitted, flush });

  const queueAnswer = useQueueAnswer(setDirtyAnswers);
  const pendingCount = Object.keys(dirtyAnswers).length;

  return {
    queueAnswer,
    pendingCount,
    isRetrying: pendingCount > NO_PENDING_ANSWERS && attemptRef.current > NO_RETRY_ATTEMPTS
  };
}
