import Spinner from "@/components/shared/Spinner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { theme } from "@/theme";

export default function SubjectQuestionsDialog({ open, onOpenChange, subjectName, isLoading, questions }) {
  const isEmpty = !isLoading && questions.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[760px]">
        <DialogHeader>
          <DialogTitle>{subjectName || "Subject"} Questions</DialogTitle>
          <DialogDescription>Read-only view of questions assigned to this subject.</DialogDescription>
        </DialogHeader>

        <div
          className="max-h-[58vh] space-y-2 overflow-y-auto border p-3"
          style={{
            borderRadius: theme.radius.lg,
            borderColor: theme.border.default,
            backgroundColor: theme.bg.card,
          }}
        >
          {isLoading ? <Spinner className="py-3" label="Loading questions..." /> : null}

          {isEmpty ? (
            <p className="text-[13px]" style={{ color: theme.text.muted }}>
              No questions found for this subject.
            </p>
          ) : null}

          {questions.map((question, index) => (
            <div
              key={question.id}
              className="border p-3"
              style={{
                borderRadius: theme.radius.md,
                borderColor: theme.border.input,
                backgroundColor: theme.bg.content,
              }}
            >
              <p className="text-[12px]" style={{ color: theme.text.muted }}>
                Q{index + 1}
              </p>
              <p className="mt-1 text-[14px]" style={{ color: theme.text.primary }}>
                {question.question_text}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]" style={{ color: theme.text.muted }}>
                <span>Correct: {String(question.correct_option || "").toUpperCase()}</span>
                {question.unit_name ? <span>Unit: {question.unit_name}</span> : null}
                {question.created_by_name ? <span>By: {question.created_by_name}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
