import { Trash2 } from "lucide-react";

import MathEquationInput from "@/components/quiz/MathEquationInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function QuestionBuilder({ question, index, onChange, onRemove, canRemove, disabled = false }) {
  const updateOption = (optionIndex, key, value) => {
    const nextOptions = question.options.map((option, idx) =>
      idx === optionIndex
        ? {
            ...option,
            [key]: value
          }
        : option
    );

    onChange({
      ...question,
      options: nextOptions
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <Label>Question {index + 1}</Label>
        {canRemove ? (
          <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        <Textarea
          value={question.question_text}
          onChange={(event) => onChange({ ...question, question_text: event.target.value })}
          placeholder="Question text"
          disabled={disabled}
        />

        <div className="flex items-center gap-3">
          <Label className="text-xs">Math</Label>
          <Switch
            checked={question.has_equation}
            onCheckedChange={(checked) => onChange({ ...question, has_equation: checked })}
            disabled={disabled}
          />
          {question.has_equation ? (
            <MathEquationInput
              value={question.question_text}
              onConfirm={(latex) => onChange({ ...question, question_text: latex })}
            />
          ) : null}
        </div>

        <RadioGroup
          value={question.correct_option}
          onValueChange={(value) => onChange({ ...question, correct_option: value })}
          className="space-y-2"
        >
          {question.options.map((option, optionIndex) => (
            <div key={option.key} className="flex items-center gap-2">
              <RadioGroupItem
                id={`${question.id}-${option.key}`}
                value={option.key}
                checked={question.correct_option === option.key}
                onChange={() => onChange({ ...question, correct_option: option.key })}
                disabled={disabled}
              />
              <Input
                value={option.value}
                onChange={(event) => updateOption(optionIndex, "value", event.target.value)}
                placeholder={`Option ${option.key.toUpperCase()}`}
                className="h-9 py-1"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-2"
                disabled={disabled}
                onClick={() => {
                  if (question.options.length <= 2) {
                    return;
                  }

                  const nextOptions = question.options.filter((_, idx) => idx !== optionIndex);
                  const nextCorrect = nextOptions.some((item) => item.key === question.correct_option)
                    ? question.correct_option
                    : nextOptions[0]?.key;

                  onChange({
                    ...question,
                    options: nextOptions,
                    correct_option: nextCorrect
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </RadioGroup>

        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => {
            if (question.options.length >= 4) {
              return;
            }

            const keyOrder = ["a", "b", "c", "d"];
            const nextKey = keyOrder[question.options.length];

            onChange({
              ...question,
              options: [...question.options, { key: nextKey, value: "" }]
            });
          }}
        >
          + Add option
        </Button>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Points</Label>
            <Input
              type="number"
              min={1}
              className="h-9 w-20 max-w-[80px] py-1"
              value={question.points}
              onChange={(event) => onChange({ ...question, points: Number(event.target.value || 1) })}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs">Multiple answers</Label>
            <Switch
              checked={question.allow_multiple_answers}
              onCheckedChange={(checked) => onChange({ ...question, allow_multiple_answers: checked })}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs">Required</Label>
            <Switch
              checked={question.is_required}
              onCheckedChange={(checked) => onChange({ ...question, is_required: checked })}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
