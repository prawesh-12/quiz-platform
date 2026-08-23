import { useCallback, useEffect, useState } from "react";

import { useTimer } from "@/hooks/useTimer";

const MILLIS_PER_SECOND = 1000;

function toMillis(value) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function clampElapsed(elapsed, durationSeconds) {
  if (durationSeconds > 0) {
    return Math.min(durationSeconds, Math.max(0, elapsed));
  }

  return Math.max(0, elapsed);
}

// Tracks the server clock so a skewed client cannot drift the visible timer.
function useServerClock(stats) {
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [quizStartTimeMs, setQuizStartTimeMs] = useState(null);

  useEffect(() => {
    if (!stats) return;

    const nextServerNowMs = toMillis(stats.server_now);
    const nextQuizStartTimeMs = toMillis(stats.quiz_start_time);

    if (nextServerNowMs != null) setServerOffsetMs(nextServerNowMs - Date.now());
    if (nextQuizStartTimeMs != null) setQuizStartTimeMs(nextQuizStartTimeMs);
  }, [stats]);

  return { serverOffsetMs, quizStartTimeMs };
}

export function useLiveQuizElapsed({ stats, durationSeconds, isRunning, isScheduled }) {
  const { serverOffsetMs, quizStartTimeMs } = useServerClock(stats);
  const fallbackSeconds = Math.max(0, Number(stats?.elapsed_seconds || 0));

  const getElapsedSeconds = useCallback(() => {
    if (isScheduled) return 0;
    if (quizStartTimeMs == null) return fallbackSeconds;

    const serverNowMs = Date.now() + serverOffsetMs;
    const elapsed = Math.floor((serverNowMs - quizStartTimeMs) / MILLIS_PER_SECOND);
    return clampElapsed(elapsed, durationSeconds);
  }, [durationSeconds, fallbackSeconds, isScheduled, quizStartTimeMs, serverOffsetMs]);

  const { seconds } = useTimer({
    initialSeconds: fallbackSeconds,
    enabled: isRunning,
    getSeconds: getElapsedSeconds
  });

  return seconds;
}
