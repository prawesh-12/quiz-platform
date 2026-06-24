import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import * as internal from "../repositories/internal.repository.js";

async function selectFromUnit(selection, subjectId) {
  const unit = await internal.findUnitInSubject(pool, selection.unit_id, subjectId);
  if (!unit) {
    throw new AppError(
      400,
      `Invalid unit selection. unit_id ${selection.unit_id} does not belong to this subject.`,
    );
  }

  const available = await internal.countBankQuestionsInUnit(pool, selection.unit_id, subjectId);
  if (available < selection.count) {
    throw new AppError(
      400,
      `Not enough questions in "${unit.name}" (unit_id: ${selection.unit_id}). Requested ${selection.count}, available ${available}.`,
    );
  }

  return internal.pickRandomBankQuestions(pool, selection.unit_id, subjectId, selection.count);
}

export async function selectBankQuestions({ subjectId, unitSelections }) {
  const questions = [];

  for (const selection of unitSelections) {
    const picked = await selectFromUnit(selection, subjectId);
    questions.push(...picked);
  }

  if (questions.length === 0) {
    throw new AppError(400, "No questions selected");
  }

  return { questions };
}
