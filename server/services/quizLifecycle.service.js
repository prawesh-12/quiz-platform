import { randomBytes } from "node:crypto";

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

  if (quizResult.rowCount === 0) {
    return null;
  }

  const quiz = quizResult.rows[0];
  if (enforceTransition && !isValidStatusTransition(quiz.status, nextStatus)) {
    return {
      error: `Invalid status transition from ${quiz.status} to ${nextStatus}`
    };
  }

  let statusToPersist = nextStatus;
  if (nextStatus === "active" && quiz.starts_in_future) {
    statusToPersist = "scheduled";
  }

  let accessToken = quiz.access_token;
  if ((statusToPersist === "active" || statusToPersist === "scheduled") && !accessToken) {
    if (!quiz.access_code) {
      return {
        error: "Access code is required before activating quiz"
      };
    }

    accessToken = generateAccessToken();
  }

  // Don't auto-submit inside this transaction (it would hold every locked session row
  // until all are graded); flag it so the caller finalizes after this status commits.
  const requiresFinalization = statusToPersist === "ended";

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
          ELSE scheduled_end 
        END
    WHERE id = $3
    `,
    [statusToPersist, accessToken, quizId]
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
    requires_finalization: requiresFinalization
  };
}
