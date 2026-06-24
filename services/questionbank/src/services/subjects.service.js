import pool from "../config/db.js";
import { EVENTS } from "../config/eventBus.js";
import { enqueueOutboxEvent } from "../config/outbox.js";
import { AppError } from "../utils/AppError.js";
import { withTransaction } from "../utils/withTransaction.js";
import * as subjects from "../repositories/subjects.repository.js";

export async function listSubjects(requester) {
  return { subjects: await subjects.listSubjects(pool, requester) };
}

export async function createSubject({ name, requester }) {
  const createdBy = requester.role === "admin" ? null : requester.id;

  try {
    return await withTransaction(async (client) => {
      const subject = await subjects.insertSubject(client, name, createdBy);
      await enqueueOutboxEvent(client, EVENTS.SUBJECT_UPSERTED, {
        id: subject.id,
        name: subject.name,
        createdBy: subject.created_by,
      });
      return { subject };
    });
  } catch (error) {
    if (error?.code === "23505") {
      throw new AppError(409, "A subject with this name already exists");
    }
    throw error;
  }
}

export async function deleteSubject({ id, requester }) {
  try {
    return await withTransaction(async (client) => {
      const deleted = await subjects.deleteSubject(client, id, requester);
      if (!deleted) {
        throw new AppError(404, "Subject not found");
      }
      await enqueueOutboxEvent(client, EVENTS.SUBJECT_DELETED, { id: deleted.id });
      return { message: "Subject deleted" };
    });
  } catch (error) {
    if (error?.code === "23503") {
      throw new AppError(409, "Cannot delete subject while quizzes still reference it");
    }
    throw error;
  }
}
