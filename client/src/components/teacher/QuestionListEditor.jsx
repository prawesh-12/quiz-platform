import ArrowDown from "lucide-react/dist/esm/icons/arrow-down";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";

import QuestionBuilder from "@/components/teacher/QuestionBuilder";
import { Button } from "@/components/ui/button";

function ReorderControls({ index, total, onMove }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={index === 0}
        aria-label={`Move question ${index + 1} up`}
        onClick={() => onMove(index, index - 1)}
      >
        <ArrowUp className="mr-1 h-4 w-4" />
        Up
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={index === total - 1}
        aria-label={`Move question ${index + 1} down`}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDown className="mr-1 h-4 w-4" />
        Down
      </Button>
    </div>
  );
}

export default function QuestionListEditor({
  questions,
  isReadOnly,
  onMove,
  onRemove,
  onChange,
  onAdd,
}) {
  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <div key={question.id} className="space-y-2">
          {isReadOnly ? <ReorderControls index={index} total={questions.length} onMove={onMove} /> : null}

          <QuestionBuilder
            question={question}
            index={index}
            canRemove={questions.length > 1 && !isReadOnly}
            disabled={isReadOnly}
            onRemove={() => onRemove(question.id)}
            onChange={(nextQuestion) => onChange(question.id, nextQuestion)}
          />
        </div>
      ))}

      <Button type="button" variant="outline" disabled={isReadOnly} onClick={onAdd}>
        + Add new question
      </Button>
    </div>
  );
}
