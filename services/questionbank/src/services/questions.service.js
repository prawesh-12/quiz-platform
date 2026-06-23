import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { subjectBelongsToTeacher } from "../repositories/subjects.repository.js";
import * as questions from "../repositories/questions.repository.js";

async function assertSubjectOwned(subjectId, userId) {
  if (!(await subjectBelongsToTeacher(pool, subjectId, userId))) {
    throw new AppError(404, "Subject not found");
  }
}

export async function listQuestions({ userId, query }) {
  await assertSubjectOwned(query.subject_id, userId);

  const { page, limit } = query;
  const offset = (page - 1) * limit;
  const inSubjectBankFilter = query.in_subject_bank === "false" ? false : true;

  const rows = await questions.listQuestions(pool, {
    subjectId: query.subject_id,
    search: query.search,
    limit,
    offset,
    inSubjectBankFilter,
    unitId: query.unit_id,
  });

  const total = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { data: rows, questions: rows, total, count: total, page, totalPages };
}

export async function createQuestion({ userId, payload }) {
  await assertSubjectOwned(payload.subject_id, userId);

  const question = await questions.insertQuestion(pool, { ...payload, created_by: userId });
  return { question };
}

export async function bulkImportQuestions({ userId, payload }) {
  await assertSubjectOwned(payload.subject_id, userId);

  const inserted = [];
  for (const item of payload.questions) {
    const question = await questions.insertQuestion(pool, {
      ...item,
      subject_id: payload.subject_id,
      created_by: userId,
    });
    inserted.push(question);
  }

  return {
    message: "Bulk question import completed",
    inserted_count: inserted.length,
    questions: inserted,
  };
}

export async function updateQuestion({ id, userId, payload }) {
  const question = await questions.updateQuestionColumns(pool, id, userId, payload);
  if (!question) {
    throw new AppError(404, "Question not found");
  }

  return { question };
}

export async function deleteQuestion({ id, userId }) {
  const deleted = await questions.deleteQuestion(pool, id, userId);
  if (!deleted) {
    throw new AppError(404, "Question not found");
  }

  return { message: "Question deleted" };
}
