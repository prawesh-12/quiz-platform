import pool from "../config/db.js";
import { startStreamConsumer } from "../config/eventConsumer.js";
import { withTransaction } from "../utils/withTransaction.js";
import { applyQuizSnapshot, deleteQuizSnapshot } from "./quizSnapshot.service.js";
import { finalizePendingSessionsForQuiz } from "./sessionLifecycle.service.js";
import logger, { serializeError } from "../utils/logger.js";

// Keeps the local quizzes read-model and exam snapshot in step with the quiz service, and
// runs the exam-side reactions (auto-submit on end, cleanup on delete).
const QUIZ_STREAM = "events:quiz";
const GROUP = "quiz-events";

async function upsertQuiz(quiz) {
  await pool.query(
    `
    INSERT INTO quizzes (
      id, title, subject_id, created_by, duration_mins, batch, division, group_nos,
      status, quiz_date, scheduled_start, scheduled_end, access_code, access_token, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title, subject_id = EXCLUDED.subject_id, created_by = EXCLUDED.created_by,
      duration_mins = EXCLUDED.duration_mins, batch = EXCLUDED.batch, division = EXCLUDED.division,
      group_nos = EXCLUDED.group_nos, status = EXCLUDED.status, quiz_date = EXCLUDED.quiz_date,
      scheduled_start = EXCLUDED.scheduled_start, scheduled_end = EXCLUDED.scheduled_end,
      access_code = EXCLUDED.access_code, access_token = EXCLUDED.access_token, created_at = EXCLUDED.created_at
    `,
    [
      quiz.id, quiz.title, quiz.subject_id, quiz.created_by, quiz.duration_mins, quiz.batch,
      quiz.division, quiz.group_nos, quiz.status, quiz.quiz_date, quiz.scheduled_start,
      quiz.scheduled_end, quiz.access_code, quiz.access_token, quiz.created_at,
    ],
  );
}

async function deleteQuiz(quizId) {
  await withTransaction(async (client) => {
    await client.query(
      `DELETE FROM violation_flags WHERE session_id IN (SELECT id FROM student_sessions WHERE quiz_id = $1)`,
      [quizId],
    );
    await client.query(
      `DELETE FROM student_answers WHERE session_id IN (SELECT id FROM student_sessions WHERE quiz_id = $1)`,
      [quizId],
    );
    await client.query(`DELETE FROM student_sessions WHERE quiz_id = $1`, [quizId]);
    await client.query(`DELETE FROM quizzes WHERE id = $1`, [quizId]);
  });
  await deleteQuizSnapshot(quizId);
}

async function handle(message) {
  let data;
  try {
    data = JSON.parse(message.payload || "{}");
  } catch (error) {
    logger.warn("quiz_events.bad_payload", serializeError(error));
    return;
  }

  if (message.type === "quiz.upserted") {
    await upsertQuiz(data);
  } else if (message.type === "quiz.snapshot") {
    await applyQuizSnapshot(Number(data.quizId), data.questions || []);
  } else if (message.type === "quiz.ended") {
    await finalizePendingSessionsForQuiz(Number(data.quizId));
  } else if (message.type === "quiz.deleted") {
    await deleteQuiz(Number(data.quizId));
  }
}

export function startQuizEventsConsumer() {
  return startStreamConsumer({
    stream: QUIZ_STREAM,
    group: GROUP,
    consumer: process.env.HOSTNAME || "worker",
    handler: handle,
  });
}
