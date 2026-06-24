import pool from "../config/db.js";
import { startStreamConsumer } from "../config/eventConsumer.js";
import logger from "../utils/logger.js";
import * as teacherSubjects from "../repositories/teacherSubjects.repository.js";

const AUTH_STREAM = "events:auth";
const CONSUMER_GROUP = "questionbank-teacher-subjects";

const EVENT_TYPES = Object.freeze({
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

async function applyEvent(type, payload) {
  if (type === EVENT_TYPES.ASSIGNED) {
    await teacherSubjects.assignTeacherSubject(pool, payload.teacherId, payload.subjectId);
    return;
  }
  if (type === EVENT_TYPES.REMOVED) {
    await teacherSubjects.removeTeacherSubject(pool, payload.teacherId, payload.subjectId);
    return;
  }
  if (type === EVENT_TYPES.TEACHER_DELETED) {
    await teacherSubjects.removeTeacher(pool, payload.teacherId);
  }
}

async function handle(message) {
  const { type } = message;
  if (!Object.values(EVENT_TYPES).includes(type)) {
    return;
  }

  const payload = parsePayload(message);
  await applyEvent(type, payload);
  logger.info("auth_event.applied", { type });
}

export function startAuthEventsConsumer() {
  const consumerName = `questionbank-${process.pid}`;
  return startStreamConsumer({
    stream: AUTH_STREAM,
    group: CONSUMER_GROUP,
    consumer: consumerName,
    handler: handle,
  });
}
