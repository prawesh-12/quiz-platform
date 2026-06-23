import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { withTransaction } from "../utils/withTransaction.js";
import * as units from "../repositories/units.repository.js";

const DUPLICATE_NAME_MESSAGE = "Unit with this name already exists in the subject";

async function assertSubjectAccessible(subjectId, requester) {
  if (!(await units.isSubjectAccessible(pool, subjectId, requester))) {
    throw new AppError(404, "Subject not found");
  }
}

async function assertUnitAccessible(unitId, requester) {
  if (!(await units.isUnitAccessible(pool, unitId, requester))) {
    throw new AppError(404, "Unit not found");
  }
}

export async function listUnitsBySubject({ subjectId, requester }) {
  await assertSubjectAccessible(subjectId, requester);
  return { units: await units.listUnitsWithQuestionCounts(pool, subjectId, requester) };
}

export async function createUnit({ subjectId, name, requester }) {
  await assertSubjectAccessible(subjectId, requester);

  if (await units.findUnitByName(pool, subjectId, name)) {
    throw new AppError(400, DUPLICATE_NAME_MESSAGE);
  }

  const orderNo = await units.getNextUnitOrder(pool, subjectId);
  const unit = await units.insertUnit(pool, {
    subjectId,
    name,
    orderNo,
    createdBy: requester.role === "admin" ? null : requester.id,
  });

  return { unit };
}

export async function updateUnit({ id, name, requester }) {
  await assertUnitAccessible(id, requester);

  const subjectId = await units.getUnitSubjectId(pool, id);
  if (await units.findUnitByName(pool, subjectId, name, id)) {
    throw new AppError(400, DUPLICATE_NAME_MESSAGE);
  }

  return { unit: await units.updateUnitName(pool, id, name) };
}

export async function deleteUnit({ id, requester }) {
  await assertUnitAccessible(id, requester);

  await withTransaction(async (client) => {
    await units.detachUnitQuestions(client, id);
    await units.deleteUnit(client, id);
  });

  return { message: "Unit deleted" };
}

export async function getUnitQuestions({ id, page, limit, requester }) {
  await assertUnitAccessible(id, requester);

  const offset = (page - 1) * limit;
  const rows = await units.listUnitBankQuestions(pool, id, limit, offset);
  const total = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { questions: rows, page, totalPages, total };
}
