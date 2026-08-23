import {
  QUIZ_SESSION_ANSWERS_KEY,
  QUIZ_SESSION_DIRTY_KEY,
  QUIZ_SESSION_PAYLOAD_KEY,
  QUIZ_SESSION_TOKEN_KEY
} from "@/utils/sessionKeys";

export const QUIZ_STATE_SCHEDULED = "scheduled";
export const QUIZ_STATE_ACTIVE = "active";
export const QUIZ_STATE_ENDED = "ended";

export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MIN_COUNTDOWN_SECONDS = 1;

export const QUIZ_ENDED_MESSAGE = "Quiz has ended. Responses are no longer accepted.";
export const QUIZ_NOT_STARTED_MESSAGE = "Quiz has not started yet.";
export const SUBMIT_FAILED_MESSAGE = "Failed to submit quiz. Please retry.";
export const TIMING_REFRESH_FAILED_MESSAGE = "Unable to refresh quiz timing right now.";

const FALLBACK_ID_RADIX = 36;
const FALLBACK_ID_SLICE_START = 2;

export function readStoredPayload() {
  const raw = sessionStorage.getItem(QUIZ_SESSION_PAYLOAD_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readStoredAnswers(key) {
  const raw = sessionStorage.getItem(key);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function loadStoredAnswers() {
  return readStoredAnswers(QUIZ_SESSION_ANSWERS_KEY);
}

export function loadStoredDirtyAnswers() {
  return readStoredAnswers(QUIZ_SESSION_DIRTY_KEY);
}

export function persistJson(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable; in-memory state still drives saves.
  }
}

export function clearQuizSessionStorage() {
  sessionStorage.removeItem(QUIZ_SESSION_TOKEN_KEY);
  sessionStorage.removeItem(QUIZ_SESSION_PAYLOAD_KEY);
  sessionStorage.removeItem(QUIZ_SESSION_ANSWERS_KEY);
  sessionStorage.removeItem(QUIZ_SESSION_DIRTY_KEY);
}

export function toMillis(value) {
  if (!value) {
    return null;
  }

  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return timestamp;
}

export function secondsUntil(targetMs, nowMs) {
  if (!targetMs) {
    return 0;
  }

  return Math.max(0, Math.ceil((targetMs - nowMs) / MS_PER_SECOND));
}

export function createSubmissionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const suffix = Math.random().toString(FALLBACK_ID_RADIX).slice(FALLBACK_ID_SLICE_START);
  return `${Date.now()}-${suffix}`;
}

export function toAnswerPayload(entries) {
  return entries.map(([questionId, selectedOption]) => ({
    question_id: Number(questionId),
    selected_option: selectedOption || null
  }));
}

export function isSessionReady({ payload, quiz, questions, sessionToken }) {
  return Boolean(payload && quiz && questions.length && sessionToken);
}
