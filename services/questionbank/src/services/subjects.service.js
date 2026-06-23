import pool from "../config/db.js";
import { EVENTS, publishEvent } from "../config/eventBus.js";
import { AppError } from "../utils/AppError.js";
import * as subjects from "../repositories/subjects.repository.js";

export async function listSubjects(requester) {
  return { subjects: await subjects.listSubjects(pool, requester) };
}

export async function createSubject({ name, requester }) {
  const createdBy = requester.role === "admin" ? null : requester.id;

  try {
    const subject = await subjects.insertSubject(pool, name, createdBy);
    await publishEvent(EVENTS.SUBJECT_UPSERTED, {
      id: subject.id,
      name: subject.name,
      createdBy: subject.created_by,
    });
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
    await publishEvent(EVENTS.SUBJECT_DELETED, { id: deleted.id });
    return { message: "Subject deleted" };
  } catch (error) {
    if (error?.code === "23503") {
      throw new AppError(409, "Cannot delete subject while quizzes still reference it");
    }
    throw error;
  }
}
