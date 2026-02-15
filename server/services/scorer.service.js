export function scoreSubmission(quizQuestions, submittedAnswers) {
  const answerMap = new Map();

  for (const answer of submittedAnswers) {
    answerMap.set(Number(answer.question_id), answer.selected_option ?? null);
  }

  let score = 0;
  let totalPoints = 0;

  const gradedAnswers = quizQuestions.map((question) => {
    const questionId = Number(question.id);
    const selectedOption = answerMap.get(questionId) ?? null;
    const points = Number(question.points ?? 1);
    const isCorrect = selectedOption ? selectedOption === question.correct_option : false;

    totalPoints += points;
    if (isCorrect) {
      score += points;
    }

    return {
      question_id: questionId,
      selected_option: selectedOption,
      is_correct: isCorrect
    };
  });

  return {
    gradedAnswers,
    score,
    total_points: totalPoints
  };
}
