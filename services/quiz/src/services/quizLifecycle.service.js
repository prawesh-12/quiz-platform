import { generateAccessToken } from "../utils/accessToken.js";

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

async function loadTransitionRow(dbClient, quizId) {
  const quizResult = await dbClient.query(
    `
    SELECT
      id,
      status,
      access_token,
      access_code,
      scheduled_start,
      (scheduled_start > (NOW() AT TIME ZONE 'Asia/Kolkata')) AS starts_in_future
    FROM quizzes
    WHERE id = $1
    `,
    [quizId]
  );

  return quizResult.rows[0] ?? null;
}

function resolveAccessToken(quiz, statusToPersist) {
  if ((statusToPersist === "active" || statusToPersist === "scheduled") && !quiz.access_token) {
    if (!quiz.access_code) {
      return { error: "Access code is required before activating quiz" };
    }
    return { token: generateAccessToken() };
  }

  return { token: quiz.access_token };
}

async function persistTransition(dbClient, statusToPersist, accessToken, quizId) {
  await dbClient.query(
    `
    UPDATE quizzes
    SET status = $1::varchar,
        access_token = COALESCE($2, access_token),
        scheduled_start = CASE
          WHEN $1::varchar = 'active' AND scheduled_start IS NULL
          THEN (NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp
          ELSE scheduled_start
        END,
        scheduled_end = CASE
          WHEN $1::varchar = 'active' AND scheduled_end IS NULL AND duration_mins > 0
          THEN ((NOW() AT TIME ZONE 'Asia/Kolkata') + make_interval(mins => duration_mins))::timestamp
          WHEN $1::varchar = 'ended'
            AND (scheduled_end IS NULL OR scheduled_end > (NOW() AT TIME ZONE 'Asia/Kolkata'))
          THEN (NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp
          ELSE scheduled_end
        END
    WHERE id = $3
    `,
    [statusToPersist, accessToken, quizId]
  );
}

export async function transitionQuizStatus(dbClient, { quizId, nextStatus, enforceTransition = true }) {
  const quiz = await loadTransitionRow(dbClient, quizId);
  if (!quiz) {
    return null;
  }

  if (enforceTransition && !isValidStatusTransition(quiz.status, nextStatus)) {
    return { error: `Invalid status transition from ${quiz.status} to ${nextStatus}` };
  }

  let statusToPersist = nextStatus;
  if (nextStatus === "active" && quiz.starts_in_future) {
    statusToPersist = "scheduled";
  }

  const resolved = resolveAccessToken(quiz, statusToPersist);
  if (resolved.error) {
    return { error: resolved.error };
  }

  // Don't auto-submit inside this transaction; flag it so the Exam service finalizes after
  // the quiz.ended event. Quiz never touches Exam tables.
  const requiresFinalization = statusToPersist === "ended";

  await persistTransition(dbClient, statusToPersist, resolved.token, quizId);

  const updatedResult = await dbClient.query(
    `SELECT id, status, access_token FROM quizzes WHERE id = $1`,
    [quizId]
  );

  return {
    quiz: updatedResult.rows[0],
    requires_finalization: requiresFinalization
  };
}
