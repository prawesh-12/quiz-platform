import pool from "../config/db.js";
import { startStreamConsumer } from "../config/eventConsumer.js";
import logger from "../utils/logger.js";
import * as subjects from "../repositories/subjects.repository.js";
import * as teacherSubjects from "../repositories/teacherSubjects.repository.js";

// Projects the read-models used for subject authorization: subjects from
// events:questionbank, teacher_subjects from events:auth. Handlers are idempotent.

const QUESTIONBANK_STREAM = "events:questionbank";
const AUTH_STREAM = "events:auth";
const SUBJECTS_GROUP = "quiz-subjects-projector";
const TEACHER_SUBJECTS_GROUP = "quiz-teacher-subjects-projector";

const QB_EVENTS = Object.freeze({
  SUBJECT_UPSERTED: "subject.upserted",
  SUBJECT_DELETED: "subject.deleted",
});

const AUTH_EVENTS = Object.freeze({
  ASSIGNED: "teacher_subjects.assigned",
  REMOVED: "teacher_subjects.removed",
  TEACHER_DELETED: "teacher.deleted",
});

function parsePayload(message) {
  try {
    return JSON.parse(message.payload || "{}");
  } catch {
    return {};
  }
}

async function applySubjectEvent(type, payload) {
  if (type === QB_EVENTS.SUBJECT_UPSERTED) {
    await subjects.upsertSubject(pool, payload);
    return;
  }
  if (type === QB_EVENTS.SUBJECT_DELETED) {
    await subjects.deleteSubject(pool, payload.id);
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

async function applyTeacherSubjectEvent(type, payload) {
  if (type === AUTH_EVENTS.ASSIGNED) {
    await teacherSubjects.assignTeacherSubject(pool, payload.teacherId, payload.subjectId);
    return;
  }
  if (type === AUTH_EVENTS.REMOVED) {
    await teacherSubjects.removeTeacherSubject(pool, payload.teacherId, payload.subjectId);
    return;
  }
  if (type === AUTH_EVENTS.TEACHER_DELETED) {
    await teacherSubjects.removeTeacher(pool, payload.teacherId);
  }
}

async function handleAuthEvent(message) {
  const { type } = message;
  if (!Object.values(AUTH_EVENTS).includes(type)) {
    return;
  }
  await applyTeacherSubjectEvent(type, parsePayload(message));
  logger.info("auth_event.applied", { type });
}

// Starts both stream consumers; returns a single stop() that drains both.
export function startProjectionConsumer() {
  const consumerName = `quiz-${process.pid}`;
  const subjectsConsumer = startStreamConsumer({
    stream: QUESTIONBANK_STREAM,
    group: SUBJECTS_GROUP,
    consumer: consumerName,
    handler: handleSubjectEvent,
  });
  const authConsumer = startStreamConsumer({
    stream: AUTH_STREAM,
    group: TEACHER_SUBJECTS_GROUP,
    consumer: consumerName,
    handler: handleAuthEvent,
  });

  return {
    async stop() {
      await Promise.all([subjectsConsumer.stop(), authConsumer.stop()]);
    },
  };
}
