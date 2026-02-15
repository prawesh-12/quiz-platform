import { scoreSubmission } from "./scorer.service.js";

export async function fetchQuizQuestionsForScoring(dbClient, quizId) {
  const result = await dbClient.query(
    `
    SELECT
      q.id,
      q.question_text,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_option,
      q.points,
      qq.order_no
    FROM quiz_questions qq
    INNER JOIN questions q ON q.id = qq.question_id
    WHERE qq.quiz_id = $1
    ORDER BY qq.order_no ASC, qq.id ASC
    `,
    [quizId]
  );

  return result.rows;
}

export async function fetchStoredAnswers(dbClient, sessionId) {
  const result = await dbClient.query(
    `
    SELECT question_id, selected_option
    FROM student_answers
    WHERE session_id = $1
    `,
    [sessionId]
  );

  return result.rows;
}

export async function replaceSessionAnswers(dbClient, sessionId, submittedAnswers, { isCorrect = undefined } = {}) {
  await dbClient.query(
    `
    DELETE FROM student_answers
    WHERE session_id = $1
    `,
    [sessionId]
  );

  for (const answer of submittedAnswers) {
    await dbClient.query(
      `
      INSERT INTO student_answers (session_id, question_id, selected_option, is_correct)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (session_id, question_id)
      DO UPDATE
      SET selected_option = EXCLUDED.selected_option,
          is_correct = EXCLUDED.is_correct,
          answered_at = NOW()
      `,
      [sessionId, answer.question_id, answer.selected_option ?? null, isCorrect ?? answer.is_correct ?? null]
    );
  }
}

export async function finalizeSessionSubmission(dbClient, { sessionId, quizId, submittedAnswers }) {
  const quizQuestions = await fetchQuizQuestionsForScoring(dbClient, quizId);

  if (!quizQuestions.length) {
    return {
      score: 0,
      total_points: 0,
      breakdown: []
    };
  }

  const { gradedAnswers, score, total_points } = scoreSubmission(quizQuestions, submittedAnswers);

  await replaceSessionAnswers(dbClient, sessionId, gradedAnswers);

  await dbClient.query(
    `
    UPDATE student_sessions
    SET status = 'submitted',
        score = $1,
        total_points = $2,
        submitted_at = NOW()
    WHERE id = $3
    `,
    [score, total_points, sessionId]
  );

  const breakdown = quizQuestions.map((question) => {
    const answer = gradedAnswers.find((item) => Number(item.question_id) === Number(question.id));

    return {
      question_id: Number(question.id),
      order_no: question.order_no,
      question_text: question.question_text,
      selected_option: answer?.selected_option ?? null,
      correct_option: question.correct_option,
      is_correct: answer?.is_correct ?? false,
      points: Number(question.points || 1)
    };
  });

  return {
    score,
    total_points,
    breakdown
  };
}

export async function finalizePendingSessionsForQuiz(dbClient, quizId) {
  const pendingSessionsResult = await dbClient.query(
    `
    SELECT id, quiz_id
    FROM student_sessions
    WHERE quiz_id = $1 AND status = 'pending'
    ORDER BY id ASC
    `,
    [quizId]
  );

  let endedCount = 0;

  for (const session of pendingSessionsResult.rows) {
    const storedAnswers = await fetchStoredAnswers(dbClient, session.id);
    await finalizeSessionSubmission(dbClient, {
      sessionId: session.id,
      quizId: session.quiz_id,
      submittedAnswers: storedAnswers
    });
    endedCount += 1;
  }

  return endedCount;
}
