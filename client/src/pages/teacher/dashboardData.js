const DATE_PAD = 2;
const NUMBER_LOCALE = "en-IN";

export function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(DATE_PAD, "0");
  const day = String(date.getDate()).padStart(DATE_PAD, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInput(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function buildTrendSeries(range, points) {
  const end = startOfDay(range.end);
  const cursor = startOfDay(range.start);
  const pointsByDay = new Map(points.map((point) => [point.day, point.participants ?? 0]));
  const entries = [];

  while (cursor <= end) {
    const key = formatDateInput(cursor);
    entries.push({
      date: key,
      label: cursor.toLocaleDateString(NUMBER_LOCALE, { month: "short", day: "numeric" }),
      value: pointsByDay.get(key) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return entries;
}

function pickTopQuiz(quizzes) {
  let selected = null;
  for (const quiz of quizzes) {
    if (!selected || (quiz.participants ?? 0) > (selected.participants ?? 0)) {
      selected = quiz;
    }
  }

  return selected;
}

function toActivityRow(quiz) {
  return {
    id: quiz.quiz_id,
    name: quiz.quiz_title || "Untitled Quiz",
    subject: quiz.subject_name || "Unassigned",
    date: quiz.quiz_date || quiz.created_at || null,
    participantCount: quiz.participants,
    averageScore: quiz.avg_score_percent ?? 0,
  };
}

function byNewestDate(left, right) {
  const leftTime = left.date ? new Date(left.date).getTime() : 0;
  const rightTime = right.date ? new Date(right.date).getTime() : 0;
  return rightTime - leftTime;
}

export function summariseQuizzes(quizzes, activityLimit) {
  const topQuiz = pickTopQuiz(quizzes);

  return {
    quizCount: quizzes.length,
    totalAttempts: quizzes.reduce((sum, quiz) => sum + (quiz.attempts ?? 0), 0),
    recentActivity: quizzes.map(toActivityRow).sort(byNewestDate).slice(0, activityLimit),
    quizStats: {
      participants: topQuiz?.participants ?? 0,
      averageScore: topQuiz?.avg_score_percent ?? 0,
      averageTime: topQuiz?.avg_time_seconds ?? 0,
      quizName: topQuiz?.quiz_title || quizzes[0]?.quiz_title || "No quiz yet",
    },
  };
}
