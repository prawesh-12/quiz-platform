import { randomBytes } from "node:crypto";

import { finalizePendingSessionsForQuiz } from "./sessionLifecycle.service.js";

function generateAccessToken() {
  return randomBytes(8).toString("hex");
}

export function isValidStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === "draft" && nextStatus === "active") {
    return true;
  }

  if (currentStatus === "active" && nextStatus === "ended") {
    return true;
  }

  return false;
}

export async function transitionQuizStatus(dbClient, { quizId, nextStatus, enforceTransition = true }) {
  const quizResult = await dbClient.query(
    `
    SELECT id, status, access_token
    FROM quizzes
    WHERE id = $1
    `,
    [quizId]
  );

  if (quizResult.rowCount === 0) {
    return null;
  }

  const quiz = quizResult.rows[0];
  if (enforceTransition && !isValidStatusTransition(quiz.status, nextStatus)) {
    return {
      error: `Invalid status transition from ${quiz.status} to ${nextStatus}`
    };
  }

  let accessToken = quiz.access_token;
  if (nextStatus === "active" && !accessToken) {
    accessToken = generateAccessToken();
  }

  let autoSubmittedCount = 0;
  if (nextStatus === "ended") {
    autoSubmittedCount = await finalizePendingSessionsForQuiz(dbClient, quizId);
  }

  await dbClient.query(
    `
    UPDATE quizzes
    SET status = $1,
        access_token = COALESCE($2, access_token)
    WHERE id = $3
    `,
    [nextStatus, accessToken, quizId]
  );

  const updatedResult = await dbClient.query(
    `
    SELECT id, status, access_token
    FROM quizzes
    WHERE id = $1
    `,
    [quizId]
  );

  return {
    quiz: updatedResult.rows[0],
    auto_submitted_count: autoSubmittedCount
  };
}
