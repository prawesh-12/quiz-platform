import CountdownTimer from "@/components/quiz/CountdownTimer";
import { Button } from "@/components/ui/button";
import { theme } from "@/theme";

import { QuestionCard, QuizCard, SaveState, SubmittedSummary } from "./quiz-parts";
import { MIN_COUNTDOWN_SECONDS, QUIZ_STATE_ACTIVE, QUIZ_STATE_SCHEDULED } from "./quiz-session";

const NO_SECONDS = 0;
const PAGE_WASH = `linear-gradient(180deg, ${theme.accent.tint} 0%, ${theme.bg.page} 40%, ${theme.bg.page} 100%)`;
// The page is its own scroller because html/body are locked to 100% with overflow hidden.
const PAGE_CLASS = "ds-viewport-h w-full overflow-y-auto px-4 pt-4";
const PAGE_STYLE = { background: PAGE_WASH, fontFamily: theme.font.family };

export function QuizPageShell({ bottomSpacing, children }) {
  return (
    <div className={`${PAGE_CLASS} ${bottomSpacing}`} style={PAGE_STYLE}>
      {children}
    </div>
  );
}

export function InvalidSessionView() {
  return (
    <QuizPageShell bottomSpacing="pb-8">
      <QuizCard className="mx-auto w-full max-w-md">
        <h1 className="text-[20px] font-bold" style={{ color: theme.text.primary }}>
          Invalid quiz session
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: theme.text.secondary }}>
          Start from your quiz entry link to begin the test.
        </p>
      </QuizCard>
    </QuizPageShell>
  );
}

export function SubmittedView({ quiz, result, questionCount }) {
  return (
    <QuizPageShell bottomSpacing="pb-8">
      <SubmittedSummary
        quizTitle={quiz.title}
        result={result}
        breakdown={Array.isArray(result?.breakdown) ? result.breakdown : []}
        questionCount={questionCount}
      />
    </QuizPageShell>
  );
}

// The countdown shows time-to-start while scheduled and time-left once the paper is live.
function resolveCountdown({
  quizState,
  timerSeconds,
  countdownTotalSeconds,
  totalDurationSeconds
}) {
  const isScheduled = quizState === QUIZ_STATE_SCHEDULED;
  const secondsUntilStart = isScheduled ? timerSeconds : NO_SECONDS;

  if (isScheduled) {
    return {
      secondsLeft: secondsUntilStart,
      totalSeconds: Math.max(
        MIN_COUNTDOWN_SECONDS,
        Number(countdownTotalSeconds || secondsUntilStart || MIN_COUNTDOWN_SECONDS)
      )
    };
  }

  return {
    secondsLeft: timerSeconds,
    totalSeconds: Math.max(MIN_COUNTDOWN_SECONDS, totalDurationSeconds)
  };
}

function QuizHeaderCard({ quiz, questionCount, answeredCount, autosave, countdown }) {
  return (
    <QuizCard className="sticky top-0 z-20 space-y-3">
      <div className="min-w-0">
        <h1
          className="break-words text-[17px] font-bold leading-snug"
          style={{ color: theme.text.primary }}
        >
          {quiz.title}
        </h1>
        <p className="mt-0.5 break-words text-[13px]" style={{ color: theme.text.muted }}>
          {quiz.subject_name || "Subject"} • {questionCount} questions
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold"
          style={{ borderColor: theme.border.input, color: theme.text.secondary }}
        >
          Answered {answeredCount} / {questionCount}
        </span>
        <SaveState
          pendingCount={autosave.pendingCount}
          savedCount={answeredCount}
          isRetrying={autosave.isRetrying}
        />
      </div>

      <CountdownTimer
        secondsLeft={countdown.secondsLeft}
        totalSeconds={countdown.totalSeconds}
      />
    </QuizCard>
  );
}

function ScheduledNotice() {
  return (
    <QuizCard className="text-center">
      <p className="text-[14px] font-semibold" style={{ color: theme.text.primary }}>
        The quiz has not started yet.
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: theme.text.secondary }}>
        Keep this page open. Your attempt starts automatically at the scheduled time.
      </p>
    </QuizCard>
  );
}

function QuestionList({ questions, answers, onSelect }) {
  return (
    <>
      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          index={index}
          selectedOption={answers[question.id]}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function SubmitErrorNotice({ message }) {
  return (
    <p
      role="alert"
      className="rounded-[10px] px-3 py-2 text-[13px] font-medium"
      style={{ backgroundColor: theme.status.flaggedTint, color: theme.status.flagged }}
    >
      {message}
    </p>
  );
}

function SubmitBar({ onSubmit, isSubmitting, isActive }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3"
      style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}
    >
      <div className="mx-auto w-full max-w-md">
        <Button
          type="button"
          className="h-12 w-full rounded-full text-[15px]"
          onClick={onSubmit}
          disabled={isSubmitting || !isActive}
        >
          {isSubmitting ? "Submitting..." : "Submit quiz"}
        </Button>
      </div>
    </div>
  );
}

export function QuizExamView({ session, runtime }) {
  const { quiz, questions } = session;
  const { answers, timing, autosave, submit, submitError, selectOption } = runtime;
  const isScheduled = timing.quizState === QUIZ_STATE_SCHEDULED;
  const answeredCount = Object.values(answers).filter(Boolean).length;

  return (
    <QuizPageShell bottomSpacing="pb-28">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <QuizHeaderCard
          quiz={quiz}
          questionCount={questions.length}
          answeredCount={answeredCount}
          autosave={autosave}
          countdown={resolveCountdown(timing)}
        />

        {isScheduled ? <ScheduledNotice /> : null}

        {isScheduled ? null : (
          <QuestionList questions={questions} answers={answers} onSelect={selectOption} />
        )}

        {submitError ? <SubmitErrorNotice message={submitError} /> : null}
      </div>

      <SubmitBar
        onSubmit={submit.submitQuiz}
        isSubmitting={submit.isSubmitting}
        isActive={timing.quizState === QUIZ_STATE_ACTIVE}
      />
    </QuizPageShell>
  );
}
