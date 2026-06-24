import pool from "../config/db.js";
import { EVENTS } from "../config/eventBus.js";
import { enqueueOutboxEvent } from "../config/outbox.js";
import { AppError } from "../utils/AppError.js";
import { withTransaction } from "../utils/withTransaction.js";
import * as violations from "../repositories/violations.repository.js";

export async function createViolation({ sessionToken, payload }) {
  const session = await violations.findSessionByToken(pool, sessionToken);
  if (!session) {
    throw new AppError(404, "Session not found");
  }

  if (session.status !== "pending") {
    throw new AppError(400, "Session is no longer active");
  }

  await withTransaction(async (client) => {
    await violations.insertViolation(client, session.id, payload.type, payload.description);
    await enqueueOutboxEvent(client, EVENTS.VIOLATION_FLAGGED, {
      sessionId: session.id,
      quizId: session.quiz_id,
    });
  });
  return { message: "Violation logged" };
}

export async function getViolationsBySession({ sessionId, userId }) {
  const session = await violations.findTeacherSession(pool, sessionId, userId);
  if (!session) {
    throw new AppError(404, "Session not found");
  }

  const answers = await violations.findSessionAnswers(pool, sessionId, session.quiz_id);
  const violationRows = await violations.findViolationsBySession(pool, sessionId);

  const typeCounts = violationRows.reduce((counts, item) => {
    counts[item.type] = (counts[item.type] || 0) + 1;
    return counts;
  }, {});

  return {
    session,
    answers,
    violations: violationRows,
    summary: {
      total_violations: violationRows.length,
      type_counts: typeCounts,
    },
  };
}
