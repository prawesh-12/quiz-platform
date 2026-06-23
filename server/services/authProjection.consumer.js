import pool from "../config/db.js";
import { startStreamConsumer } from "../config/eventConsumer.js";
import { withTransaction } from "../utils/withTransaction.js";
import logger, { serializeError } from "../utils/logger.js";

// Keeps the local teachers / teacher_subjects read-models in step with the auth service.
const AUTH_STREAM = "events:auth";
const GROUP = "auth-projection";

async function upsertTeacher({ id, name }) {
  await pool.query(
    `INSERT INTO teachers (id, name) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    [id, name ?? null],
  );
}

// A deleted teacher's content becomes ownerless rather than cascading away.
async function deleteTeacher(teacherId) {
  await withTransaction(async (client) => {
    await client.query(`UPDATE questions SET created_by = NULL WHERE created_by = $1`, [teacherId]);
    await client.query(`UPDATE quizzes SET created_by = NULL WHERE created_by = $1`, [teacherId]);
    await client.query(`UPDATE subjects SET created_by = NULL WHERE created_by = $1`, [teacherId]);
    await client.query(`UPDATE units SET created_by = NULL WHERE created_by = $1`, [teacherId]);
    await client.query(`DELETE FROM teacher_subjects WHERE teacher_id = $1`, [teacherId]);
    await client.query(`DELETE FROM teachers WHERE id = $1`, [teacherId]);
  });
}

async function assignSubject({ teacherId, subjectId }) {
  await pool.query(
    `INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [teacherId, subjectId],
  );
}

async function removeSubject({ teacherId, subjectId }) {
  await pool.query(
    `DELETE FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2`,
    [teacherId, subjectId],
  );
}

async function handle(message) {
  let data;
  try {
    data = JSON.parse(message.payload || "{}");
  } catch (error) {
    logger.warn("auth_projection.bad_payload", serializeError(error));
    return;
  }

  if (message.type === "teacher.upserted") {
    await upsertTeacher(data);
  } else if (message.type === "teacher.deleted") {
    await deleteTeacher(Number(data.teacherId));
  } else if (message.type === "teacher_subjects.assigned") {
    await assignSubject(data);
  } else if (message.type === "teacher_subjects.removed") {
    await removeSubject(data);
  }
}

export function startAuthProjectionConsumer() {
  return startStreamConsumer({
    stream: AUTH_STREAM,
    group: GROUP,
    consumer: process.env.HOSTNAME || "worker",
    handler: handle,
  });
}
