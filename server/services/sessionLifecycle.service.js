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

function normalizeAnswers(submittedAnswers, { isCorrect = undefined } = {}) {
  const answerMap = new Map();

  for (const answer of submittedAnswers) {
    const questionId = Number(answer.question_id);

    if (!Number.isInteger(questionId) || questionId <= 0) {
      continue;
    }

    answerMap.set(questionId, {
      question_id: questionId,
      selected_option: answer.selected_option ?? null,
      is_correct: isCorrect === undefined ? answer.is_correct ?? null : isCorrect
    });
  }

  return Array.from(answerMap.values());
}

export async function upsertSessionAnswers(dbClient, sessionId, submittedAnswers, { isCorrect = undefined } = {}) {
  const answers = normalizeAnswers(submittedAnswers, { isCorrect });

  if (!answers.length) {
    return 0;
  }

  const result = await dbClient.query(
    `
    WITH incoming AS (
      SELECT
        question_id::int AS question_id,
        selected_option::char(1) AS selected_option,
        is_correct::boolean AS is_correct
      FROM json_to_recordset($2::json) AS answer(
        question_id int,
        selected_option text,
        is_correct boolean
      )
    )
    INSERT INTO student_answers (session_id, question_id, selected_option, is_correct)
    SELECT $1, question_id, selected_option, is_correct
    FROM incoming
    ON CONFLICT (session_id, question_id)
    DO UPDATE
    SET selected_option = EXCLUDED.selected_option,
        is_correct = EXCLUDED.is_correct,
        answered_at = (NOW() AT TIME ZONE 'Asia/Kolkata')
    `,
    [sessionId, JSON.stringify(answers)]
  );

  return result.rowCount;
}

export async function finalizeSessionSubmission(dbClient, { sessionId, quizId, submittedAnswers, submissionId = null }) {
  const quizQuestions = await fetchQuizQuestionsForScoring(dbClient, quizId);

  if (!quizQuestions.length) {
    return {
      score: 0,
      total_points: 0,
      breakdown: []
    };
  }

  const { gradedAnswers, score, total_points } = scoreSubmission(quizQuestions, submittedAnswers);

  await upsertSessionAnswers(dbClient, sessionId, gradedAnswers);

  await dbClient.query(
    `
    UPDATE student_sessions
    SET status = 'submitted',
        score = $1,
        total_points = $2,
        submitted_at = (NOW() AT TIME ZONE 'Asia/Kolkata'),
        submission_id = COALESCE($4, submission_id)
    WHERE id = $3
    `,
    [score, total_points, sessionId, submissionId]
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
