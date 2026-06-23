import pool from "../config/db.js";
import { startStreamConsumer } from "../config/eventConsumer.js";
import logger from "../utils/logger.js";
import * as projection from "../repositories/projection.repository.js";

// Projects every read-model table from its source stream. Handlers are idempotent;
// out-of-order delivery is safe via ON CONFLICT upserts.

const QUIZ_STREAM = "events:quiz";
const QUESTIONBANK_STREAM = "events:questionbank";
const SESSION_STREAM = "events:session";
const VIOLATION_STREAM = "events:violation";

const GROUPS = Object.freeze({
  QUIZ: "analytics-quiz-projector",
  QUESTIONBANK: "analytics-subjects-projector",
  SESSION: "analytics-sessions-projector",
  VIOLATION: "analytics-violations-projector"
});

const QUIZ_EVENTS = Object.freeze({ UPSERTED: "quiz.upserted", DELETED: "quiz.deleted" });
const QB_EVENTS = Object.freeze({ SUBJECT_UPSERTED: "subject.upserted", SUBJECT_DELETED: "subject.deleted" });
const SESSION_EVENTS = Object.freeze({ STARTED: "session.started", SUBMITTED: "session.submitted" });
const VIOLATION_EVENTS = Object.freeze({ FLAGGED: "violation.flagged" });

function parsePayload(message) {
  try {
    return JSON.parse(message.payload || "{}");
  } catch {
    return {};
  }
}

async function applyQuizEvent(type, payload) {
  if (type === QUIZ_EVENTS.UPSERTED) {
    await projection.upsertQuiz(pool, payload);
    return;
  }
  if (type === QUIZ_EVENTS.DELETED) {
    await projection.deleteQuizCascade(pool, payload.quizId);
  }
}

async function handleQuizEvent(message) {
  const { type } = message;
  if (!Object.values(QUIZ_EVENTS).includes(type)) {
    return;
  }
  await applyQuizEvent(type, parsePayload(message));
  logger.info("quiz_event.applied", { type });
}

async function applySubjectEvent(type, payload) {
  if (type === QB_EVENTS.SUBJECT_UPSERTED) {
    await projection.upsertSubject(pool, payload);
    return;
  }
  if (type === QB_EVENTS.SUBJECT_DELETED) {
    await projection.deleteSubject(pool, payload.id);
  }
}

async function handleSubjectEvent(message) {
  const { type } = message;
  if (!Object.values(QB_EVENTS).includes(type)) {
    return;
  }
  await applySubjectEvent(type, parsePayload(message));
  logger.info("questionbank_event.applied", { type });
}

async function applySessionEvent(type, payload) {
  if (type === SESSION_EVENTS.STARTED) {
    await projection.insertSessionStarted(pool, payload);
    return;
  }
  if (type === SESSION_EVENTS.SUBMITTED) {
    await projection.applySessionSubmitted(pool, payload);
  }
}

async function handleSessionEvent(message) {
  const { type } = message;
  if (!Object.values(SESSION_EVENTS).includes(type)) {
    return;
  }
  await applySessionEvent(type, parsePayload(message));
  logger.info("session_event.applied", { type });
}

async function handleViolationEvent(message) {
  const { type } = message;
  if (type !== VIOLATION_EVENTS.FLAGGED) {
    return;
  }
  const payload = parsePayload(message);
  await projection.upsertViolationFlag(pool, payload.sessionId, payload.quizId);
  logger.info("violation_event.applied", { type });
}

// Starts one consumer per stream; returns a single stop() that drains all of them.
export function startProjectionConsumer() {
  const consumerName = `analytics-${process.pid}`;
  const specs = [
    { stream: QUIZ_STREAM, group: GROUPS.QUIZ, handler: handleQuizEvent },
    { stream: QUESTIONBANK_STREAM, group: GROUPS.QUESTIONBANK, handler: handleSubjectEvent },
    { stream: SESSION_STREAM, group: GROUPS.SESSION, handler: handleSessionEvent },
    { stream: VIOLATION_STREAM, group: GROUPS.VIOLATION, handler: handleViolationEvent }
  ];

  const consumers = specs.map((spec) =>
    startStreamConsumer({ ...spec, consumer: consumerName })
  );

  return {
    async stop() {
      await Promise.all(consumers.map((consumer) => consumer.stop()));
    }
  };
}
