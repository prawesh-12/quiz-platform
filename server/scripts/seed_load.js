import "dotenv/config";
import bcrypt from "bcryptjs";

import pool from "../config/db.js";
import { generateAccessToken } from "../utils/accessToken.js";

// Production-like seed for load testing the 1000-student paths.
//
//   node scripts/seed_load.js
//
// Env knobs:
//   SEED_TEACHER_EMAIL   teacher to own the data           (default load@quizloom.test)
//   SEED_QUESTIONS       questions in the bank             (default 60)
//   SEED_SESSIONS        fake completed sessions to insert (default 0 — for dashboard load)
//   SEED_ACCESS_CODE     access code for the active quizzes (default LOAD2026)
//
// Prints a JSON summary with each quiz's access_token + access_code so a k6 script
// can drive enter -> answer -> submit against a real active quiz.

const TEACHER_EMAIL = process.env.SEED_TEACHER_EMAIL || "load@quizloom.test";
const QUESTION_COUNT = Number(process.env.SEED_QUESTIONS || 60);
const SESSION_COUNT = Number(process.env.SEED_SESSIONS || 0);
const ACCESS_CODE = process.env.SEED_ACCESS_CODE || "LOAD2026";
const QUIZ_SIZES = [20, 30, 50];
const OPTIONS = ["a", "b", "c", "d"];

async function ensureTeacher(client) {
  const existing = await client.query("SELECT id FROM teachers WHERE email = $1", [TEACHER_EMAIL]);
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const passwordHash = await bcrypt.hash("LoadTest@123", 10);
  const inserted = await client.query(
    `INSERT INTO teachers (name, email, password, school)
     VALUES ($1, $2, $3, 'SOT') RETURNING id`,
    ["Load Test Teacher", TEACHER_EMAIL, passwordHash]
  );
  return inserted.rows[0].id;
}

async function ensureSubjectAndUnit(client, teacherId) {
  const subject = await client.query(
    `INSERT INTO subjects (name, created_by) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ["Load Test Subject", teacherId]
  );
  const subjectId = subject.rows[0].id;

  const unit = await client.query(
    `INSERT INTO units (name, subject_id, created_by) VALUES ($1, $2, $3)
     ON CONFLICT (subject_id, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ["Load Test Unit", subjectId, teacherId]
  );
  return { subjectId, unitId: unit.rows[0].id };
}

async function insertQuestions(client, { subjectId, unitId, teacherId }) {
  const values = [];
  const params = [];
  for (let i = 0; i < QUESTION_COUNT; i += 1) {
    const base = i * 8;
    const correct = OPTIONS[i % OPTIONS.length];
    params.push(
      subjectId,
      unitId,
      `Load test question ${i + 1}: which option is correct?`,
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      correct
    );
    values.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, TRUE, ${teacherId})`
    );
  }

  const result = await client.query(
    `INSERT INTO questions
       (subject_id, unit_id, question_text, option_a, option_b, option_c, option_d, correct_option, in_subject_bank, created_by)
     VALUES ${values.join(", ")}
     RETURNING id, correct_option, points`,
    params
  );
  return result.rows;
}

async function createActiveQuiz(client, { teacherId, subjectId, questions, size, index }) {
  const accessToken = generateAccessToken();
  const slice = questions.slice(0, size);

  const quiz = await client.query(
    `INSERT INTO quizzes
       (title, subject_id, created_by, duration_mins, status, quiz_date,
        scheduled_start, scheduled_end, access_code, access_token)
     VALUES ($1, $2, $3, $4, 'active', CURRENT_DATE,
        NOW() - INTERVAL '1 minute', NOW() + INTERVAL '3 hours', $5, $6)
     RETURNING id`,
    [`Load Test Quiz ${size}Q #${index + 1}`, subjectId, teacherId, 180, ACCESS_CODE, accessToken]
  );
  const quizId = quiz.rows[0].id;

  const linkValues = slice.map((_, i) => `($1, $${i + 2}, ${i + 1})`).join(", ");
  await client.query(
    `INSERT INTO quiz_questions (quiz_id, question_id, order_no) VALUES ${linkValues}
     ON CONFLICT (quiz_id, question_id) DO NOTHING`,
    [quizId, ...slice.map((q) => q.id)]
  );

  return { quizId, accessToken, size, questions: slice };
}

async function insertFakeSessions(client, quizzes) {
  if (SESSION_COUNT <= 0) {
    return 0;
  }

  let created = 0;
  for (let i = 0; i < SESSION_COUNT; i += 1) {
    const quiz = quizzes[i % quizzes.length];
    const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const correct = Math.floor(quiz.questions.length * (0.4 + (i % 5) * 0.1));
    const score = quiz.questions.slice(0, correct).reduce((sum, q) => sum + (q.points || 1), 0);
    const token = `loadsess${Date.now().toString(36)}${i}`.slice(0, 60);

    const session = await client.query(
      `INSERT INTO student_sessions
         (quiz_id, name, roll_no, email, division, group_no, session_token, status, score, total_points, started_at, submitted_at)
       VALUES ($1, $2, $3, $4, 'A', '1', $5, 'submitted', $6, $7,
               NOW() - (random() * INTERVAL '14 days'), NOW() - (random() * INTERVAL '14 days'))
       RETURNING id`,
      [quiz.quizId, `Student ${i + 1}`, `R${i + 1}`, `student${i + 1}@load.test`, token, score, totalPoints]
    );
    const sessionId = session.rows[0].id;

    const answerValues = [];
    const answerParams = [sessionId];
    quiz.questions.forEach((q, qi) => {
      const isCorrect = qi < correct;
      const selected = isCorrect ? q.correct_option : OPTIONS[(qi + 1) % OPTIONS.length];
      answerParams.push(q.id, selected, isCorrect);
      const base = qi * 3;
      answerValues.push(`($1, $${base + 2}, $${base + 3}, $${base + 4})`);
    });

    await client.query(
      `INSERT INTO student_answers (session_id, question_id, selected_option, is_correct)
       VALUES ${answerValues.join(", ")}
       ON CONFLICT (session_id, question_id) DO NOTHING`,
      answerParams
    );
    created += 1;
  }
  return created;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const teacherId = await ensureTeacher(client);
    const { subjectId, unitId } = await ensureSubjectAndUnit(client, teacherId);
    const questions = await insertQuestions(client, { subjectId, unitId, teacherId });

    const quizzes = [];
    for (let index = 0; index < QUIZ_SIZES.length; index += 1) {
      const size = Math.min(QUIZ_SIZES[index], questions.length);
      quizzes.push(
        await createActiveQuiz(client, { teacherId, subjectId, questions, size, index })
      );
    }

    const sessionsCreated = await insertFakeSessions(client, quizzes);

    await client.query("COMMIT");

    const summary = {
      teacher_email: TEACHER_EMAIL,
      access_code: ACCESS_CODE,
      questions_seeded: questions.length,
      fake_sessions_created: sessionsCreated,
      quizzes: quizzes.map((q) => ({
        quiz_id: q.quizId,
        size: q.size,
        access_token: q.accessToken,
        access_code: ACCESS_CODE
      }))
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("seed_load failed:", error);
  process.exit(1);
});
