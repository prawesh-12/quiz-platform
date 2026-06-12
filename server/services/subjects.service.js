import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import * as subjects from "../repositories/subjects.repository.js";

export async function listSubjects(requester) {
  return { subjects: await subjects.listSubjects(pool, requester) };
}

export async function createSubject({ name, requester }) {
  const createdBy = requester.role === "admin" ? null : requester.id;

  try {
    const subject = await subjects.insertSubject(pool, name, createdBy);
    return { subject };
  } catch (error) {
    if (error?.code === "23505") {
      throw new AppError(409, "A subject with this name already exists");
    }
    throw error;
  }
}

export async function deleteSubject({ id, requester }) {
  try {
    const deleted = await subjects.deleteSubject(pool, id, requester);
    if (!deleted) {
      throw new AppError(404, "Subject not found");
    }
    return { message: "Subject deleted" };
  } catch (error) {
    if (error?.code === "23503") {
      throw new AppError(409, "Cannot delete subject while quizzes still reference it");
    }
    throw error;
  }
}

// Group the flat quiz/question join into quizzes each holding their questions.
function groupQuizHistory(rows) {
  const quizzes = new Map();

  for (const row of rows) {
    if (!quizzes.has(row.quiz_id)) {
      quizzes.set(row.quiz_id, {
        id: row.quiz_id,
        title: row.title,
        quiz_date: row.quiz_date,
        status: row.status,
        created_at: row.quiz_created_at,
        questions: [],
      });
    }

    if (row.question_id) {
      quizzes.get(row.quiz_id).questions.push({
        id: row.question_id,
        question_text: row.question_text,
        correct_option: row.correct_option,
        points: row.points,
        has_equation: row.has_equation,
        option_a: row.option_a,
        option_b: row.option_b,
        option_c: row.option_c,
        option_d: row.option_d,
        order_no: row.order_no,
      });
    }
  }

  return Array.from(quizzes.values());
}

export async function getQuizHistoryBySubject({ id, requester }) {
  if (!(await subjects.isSubjectManageable(pool, id, requester))) {
    throw new AppError(404, "Subject not found");
  }

  const rows = await subjects.findSubjectQuizHistoryRows(pool, id, requester);
  return { quizzes: groupQuizHistory(rows) };
}
