import { useCallback, useEffect, useRef, useState } from "react";

import { useTimer } from "@/hooks/useTimer";
import { sessionService } from "@/services/sessionService";

import {
  MIN_COUNTDOWN_SECONDS,
  MS_PER_SECOND,
  QUIZ_ENDED_MESSAGE,
  QUIZ_STATE_ACTIVE,
  QUIZ_STATE_ENDED,
  QUIZ_STATE_SCHEDULED,
  SECONDS_PER_MINUTE,
  TIMING_REFRESH_FAILED_MESSAGE,
  secondsUntil,
  toMillis
} from "./quiz-session";

const NO_SECONDS = 0;
const NO_OFFSET_MS = 0;

function resolveInitialTiming(payload) {
  const quiz = payload?.quiz || null;
  const totalDurationSeconds = Math.max(
    NO_SECONDS,
    Number(
      payload?.totalDurationSeconds ||
        payload?.durationSeconds ||
        quiz?.duration_mins * SECONDS_PER_MINUTE ||
        NO_SECONDS
    )
  );

  const serverNowMs = toMillis(payload?.serverNow);
  const fallbackEndMs = serverNowMs
    ? serverNowMs + totalDurationSeconds * MS_PER_SECOND
    : null;

  return {
    totalDurationSeconds,
    startAtMs: toMillis(payload?.startTime || quiz?.scheduled_start),
    endAtMs: toMillis(payload?.endTime || quiz?.scheduled_end) || fallbackEndMs,
    offsetMs: serverNowMs ? serverNowMs - Date.now() : NO_OFFSET_MS
  };
}

function resolveInitialDisplaySeconds(payload, initial) {
  if (payload?.quizState === QUIZ_STATE_SCHEDULED) {
    return Math.max(NO_SECONDS, Number(payload?.countdownToStartSeconds || NO_SECONDS));
  }

  if (initial.endAtMs) {
    return secondsUntil(initial.endAtMs, Date.now() + initial.offsetMs);
  }

  return initial.totalDurationSeconds;
}

function resolveInitialQuizState(payload, initial) {
  if (payload?.quizState) {
    return payload.quizState;
  }

  const untilStart = secondsUntil(initial.startAtMs, Date.now() + initial.offsetMs);
  if (initial.startAtMs && untilStart > NO_SECONDS) {
    return QUIZ_STATE_SCHEDULED;
  }

  return QUIZ_STATE_ACTIVE;
}

function applyServerClock(response, setters) {
  const serverNowMs = toMillis(response?.server_now);
  if (serverNowMs) {
    setters.setServerOffsetMs(serverNowMs - Date.now());
  }

  const nextStartMs = toMillis(response?.start_time);
  if (nextStartMs) {
    setters.setStartAtMs(nextStartMs);
  }

  const nextEndMs = toMillis(response?.end_time);
  if (nextEndMs) {
    setters.setEndAtMs(nextEndMs);
  }
}

function applyServerSchedule(response, setters) {
  if (response?.countdown_to_start_secs != null) {
    setters.setCountdownTotalSeconds(
      Math.max(
        MIN_COUNTDOWN_SECONDS,
        Number(response.countdown_to_start_secs || MIN_COUNTDOWN_SECONDS)
      )
    );
  }

  if (response?.total_duration_secs != null) {
    setters.setTotalDurationSeconds(
      Math.max(NO_SECONDS, Number(response.total_duration_secs || NO_SECONDS))
    );
  }

  if (response?.quiz_state) {
    setters.setQuizState(response.quiz_state);
  }
}

async function refreshQuizTiming({ sessionToken, isCancelled, syncServerTiming, onTimingError }) {
  try {
    const data = await sessionService.getTiming(sessionToken);
    if (isCancelled()) {
      return;
    }

    syncServerTiming(data);
    if (data?.session_closed && data?.quiz_state === QUIZ_STATE_ENDED) {
      onTimingError(QUIZ_ENDED_MESSAGE);
    }
  } catch (error) {
    if (isCancelled()) {
      return;
    }

    const apiData = error?.response?.data;
    if (apiData) {
      syncServerTiming(apiData);
      onTimingError(apiData.error || TIMING_REFRESH_FAILED_MESSAGE);
    }
  }
}

function useTimingState(payload, initial) {
  const [serverOffsetMs, setServerOffsetMs] = useState(initial.offsetMs);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(initial.totalDurationSeconds);
  const [countdownTotalSeconds, setCountdownTotalSeconds] = useState(() =>
    Math.max(
      MIN_COUNTDOWN_SECONDS,
      Number(payload?.countdownToStartSeconds || MIN_COUNTDOWN_SECONDS)
    )
  );
  const [startAtMs, setStartAtMs] = useState(initial.startAtMs);
  const [endAtMs, setEndAtMs] = useState(initial.endAtMs);
  const [quizState, setQuizState] = useState(() => resolveInitialQuizState(payload, initial));

  return {
    serverOffsetMs,
    setServerOffsetMs,
    totalDurationSeconds,
    setTotalDurationSeconds,
    countdownTotalSeconds,
    setCountdownTotalSeconds,
    startAtMs,
    setStartAtMs,
    endAtMs,
    setEndAtMs,
    quizState,
    setQuizState
  };
}

// Identity must stay pinned: the timing refresh effect re-runs whenever this changes.
function useServerTimingSync(state) {
  const stateRef = useRef(state);
  stateRef.current = state;

  return useCallback((response) => {
    applyServerClock(response, stateRef.current);
    applyServerSchedule(response, stateRef.current);
  }, []);
}

function useTimingRefresh({ sessionToken, hasSubmitted, syncServerTiming, onTimingError }) {
  useEffect(() => {
    if (!sessionToken || hasSubmitted) {
      return undefined;
    }

    let isCurrent = true;

    refreshQuizTiming({
      sessionToken,
      isCancelled: () => !isCurrent,
      syncServerTiming,
      onTimingError
    });

    return () => {
      isCurrent = false;
    };
  }, [hasSubmitted, onTimingError, sessionToken, syncServerTiming]);
}

// The server clock decides the phase; the ticking display seconds follow from it.
function useDisplaySeconds(state) {
  const { serverOffsetMs, startAtMs, endAtMs, totalDurationSeconds, setQuizState } = state;

  return useCallback(() => {
    const serverNowMs = Date.now() + serverOffsetMs;
    const untilStart = secondsUntil(startAtMs, serverNowMs);
    const untilEnd = endAtMs ? secondsUntil(endAtMs, serverNowMs) : totalDurationSeconds;

    if (untilStart > NO_SECONDS) {
      setQuizState((prev) => (prev === QUIZ_STATE_SCHEDULED ? prev : QUIZ_STATE_SCHEDULED));
      return untilStart;
    }

    if (untilEnd > NO_SECONDS) {
      setQuizState((prev) => (prev === QUIZ_STATE_ACTIVE ? prev : QUIZ_STATE_ACTIVE));
      return untilEnd;
    }

    setQuizState((prev) => (prev === QUIZ_STATE_ENDED ? prev : QUIZ_STATE_ENDED));
    return NO_SECONDS;
  }, [endAtMs, serverOffsetMs, setQuizState, startAtMs, totalDurationSeconds]);
}

export function useQuizTiming({ session, hasSubmitted, onTimingError }) {
  const { payload, sessionToken } = session;
  const initial = resolveInitialTiming(payload);
  const state = useTimingState(payload, initial);
  const syncServerTiming = useServerTimingSync(state);

  useTimingRefresh({ sessionToken, hasSubmitted, syncServerTiming, onTimingError });

  const getDisplaySeconds = useDisplaySeconds(state);

  const { seconds: timerSeconds } = useTimer({
    initialSeconds: resolveInitialDisplaySeconds(payload, initial),
    enabled: Boolean(payload) && !hasSubmitted,
    getSeconds: getDisplaySeconds
  });

  return {
    quizState: state.quizState,
    timerSeconds,
    totalDurationSeconds: state.totalDurationSeconds,
    countdownTotalSeconds: state.countdownTotalSeconds,
    syncServerTiming
  };
}
