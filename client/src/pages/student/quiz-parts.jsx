import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { theme } from "@/theme";

export const OPTION_KEYS = ["a", "b", "c", "d"];
const SUCCESS_ICON_PX = 72;
const CARD_RADIUS_PX = "18px";

const CARD_STYLE = {
  borderRadius: CARD_RADIUS_PX,
  borderColor: theme.border.default,
  backgroundColor: theme.bg.card,
  boxShadow: theme.shadow.card
};

export function QuizCard({ children, className = "", style = {} }) {
  return (
    <section className={`border p-4 sm:p-5 ${className}`} style={{ ...CARD_STYLE, ...style }}>
      {children}
    </section>
  );
}

function saveStateTone({ pendingCount, isRetrying }) {
  if (isRetrying) {
    return { label: "Retrying save...", bg: theme.status.flaggedTint, color: theme.status.flagged };
  }

  if (pendingCount > 0) {
    return { label: "Saving...", bg: theme.status.pendingTint, color: theme.status.pending };
  }

  return { label: "All answers saved", bg: theme.status.activeTint, color: theme.status.active };
}

export function SaveState({ pendingCount, savedCount, isRetrying }) {
  if (!savedCount && !pendingCount) {
    return (
      <span className="text-[12px] font-medium" style={{ color: theme.text.muted }}>
        Nothing to save yet
      </span>
    );
  }

  const tone = saveStateTone({ pendingCount, isRetrying });

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ backgroundColor: tone.bg, color: tone.color }}
    >
      {tone.label}
    </span>
  );
}

export function QuestionContent({ question }) {
  if (!question) {
    return null;
  }

  if (question.has_equation) {
    return (
      <div className="space-y-2">
        <Badge variant="secondary">Equation</Badge>
        <pre
          className="whitespace-pre-wrap break-words rounded-[10px] border p-3 text-[16px] leading-relaxed"
          style={{ borderColor: theme.border.light, backgroundColor: theme.bg.input, color: theme.text.primary }}
        >
          {question.question_text}
        </pre>
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed" style={{ color: theme.text.primary }}>
      {question.question_text}
    </p>
  );
}

function optionStyle(isSelected) {
  if (isSelected) {
    return { borderColor: theme.accent.DEFAULT, backgroundColor: theme.accent.tint, color: theme.text.primary };
  }

  return { borderColor: theme.border.input, backgroundColor: theme.bg.card, color: theme.text.secondary };
}

function QuestionOption({ question, optionKey, isSelected, onSelect }) {
  const optionValue = question?.[`option_${optionKey}`];
  if (!optionValue) {
    return null;
  }

  const inputId = `question-${question.id}-option-${optionKey}`;

  return (
    <div
      className="flex w-full min-w-0 cursor-pointer select-none items-center gap-3 rounded-[12px] border p-4 transition-colors"
      style={optionStyle(isSelected)}
      onClick={() => onSelect(question.id, optionKey)}
    >
      <RadioGroupItem
        id={inputId}
        value={optionKey}
        checked={isSelected}
        className="shrink-0"
        onChange={() => onSelect(question.id, optionKey)}
      />
      <Label htmlFor={inputId} className="w-full min-w-0 cursor-pointer select-none break-words text-[16px] leading-snug">
        {optionValue}
      </Label>
    </div>
  );
}

export function QuestionCard({ question, index, selectedOption, onSelect }) {
  return (
    <QuizCard className="space-y-4">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: theme.text.muted }}>
          Question {index + 1}
        </p>
        <QuestionContent question={question} />
      </div>

      <RadioGroup className="space-y-3">
        {OPTION_KEYS.map((optionKey) => (
          <QuestionOption
            key={optionKey}
            question={question}
            optionKey={optionKey}
            isSelected={selectedOption === optionKey}
            onSelect={onSelect}
          />
        ))}
      </RadioGroup>
    </QuizCard>
  );
}

function ResultTile({ label, value }) {
  return (
    <div
      className="rounded-[12px] border p-3 text-center"
      style={{ borderColor: theme.border.default, backgroundColor: theme.bg.content }}
    >
      <p className="text-[12px]" style={{ color: theme.text.muted }}>
        {label}
      </p>
      <p className="mt-1 text-[18px] font-bold" style={{ color: theme.text.primary }}>
        {value}
      </p>
    </div>
  );
}

export function SubmittedSummary({ quizTitle, result, breakdown, questionCount }) {
  const correctCount = breakdown.filter((item) => item.is_correct).length;
  const attemptedCount = breakdown.filter((item) => item.selected_option).length;
  const outOf = breakdown.length || questionCount;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
      <CheckCircle2 width={SUCCESS_ICON_PX} height={SUCCESS_ICON_PX} style={{ color: theme.status.active }} aria-hidden="true" />
      <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em]" style={{ color: theme.text.primary }}>
        Quiz submitted
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: theme.text.secondary }}>
        Your answers have been recorded. You can close this page.
      </p>
      <p className="mt-1 text-[13px]" style={{ color: theme.text.muted }}>
        {quizTitle}
      </p>

      {result ? (
        <QuizCard className="mt-6 w-full text-left">
          <h2 className="text-[15px] font-semibold" style={{ color: theme.text.primary }}>
            Your results
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ResultTile label="Score" value={`${Number(result.score ?? 0)} / ${Number(result.total_points ?? 0)}`} />
            <ResultTile label="Percentage" value={`${Number(result.percentage ?? 0)}%`} />
            <ResultTile label="Correct" value={`${correctCount} / ${outOf}`} />
            <ResultTile label="Attempted" value={`${attemptedCount} / ${outOf}`} />
          </div>
        </QuizCard>
      ) : null}
    </div>
  );
}
