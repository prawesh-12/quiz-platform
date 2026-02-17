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

  if (currentStatus === "scheduled" && nextStatus === "active") {
    return true;
  }

  return false;
}

export async function transitionQuizStatus(dbClient, { quizId, nextStatus, enforceTransition = true }) {
  const quizResult = await dbClient.query(
    `
    SELECT id, status, access_token, access_code
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
    if (!quiz.access_code) {
      return {
        error: "Access code is required before activating quiz"
      };
    }

    accessToken = generateAccessToken();
  }

  let autoSubmittedCount = 0;
  if (nextStatus === "ended") {
    autoSubmittedCount = await finalizePendingSessionsForQuiz(dbClient, quizId);
  }

  await dbClient.query(
    `
    UPDATE quizzes
    SET status = $1::varchar,
        access_token = COALESCE($2, access_token),
        scheduled_start = CASE
          WHEN $1::varchar = 'active' AND scheduled_start IS NULL 
          THEN NOW()::timestamp
          ELSE scheduled_start
        END,
        scheduled_end = CASE 
          WHEN $1::varchar = 'active' AND scheduled_end IS NULL AND duration_mins > 0 
          THEN (NOW() + make_interval(mins => duration_mins))::timestamp
          ELSE scheduled_end 
        END
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
