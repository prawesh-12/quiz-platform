import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { theme } from "@/theme";

function buildOptionStyle(isCorrect) {
  if (isCorrect) {
    return {
      borderRadius: theme.radius.md,
      borderColor: theme.accent.DEFAULT,
      backgroundColor: theme.accent.tint,
      color: theme.text.primary,
    };
  }

  return {
    borderRadius: theme.radius.md,
    borderColor: theme.border.default,
    backgroundColor: theme.bg.card,
    color: theme.text.secondary,
  };
}

function PreviewQuestion({ question, index }) {
  return (
    <Card style={{ borderRadius: theme.radius.lg }}>
      <CardContent className="space-y-3 pt-5">
        <p className="text-xs uppercase" style={{ color: theme.text.muted }}>
          Question {index + 1}
        </p>
        <p className="text-sm" style={{ color: theme.text.primary }}>
          {question.question_text || "-"}
        </p>
        <div className="space-y-2">
          {question.options.map((option) => (
            <div
              key={option.key}
              className="border p-2 text-sm font-medium"
              style={buildOptionStyle(option.key === question.correct_option)}
            >
              {option.key.toUpperCase()}. {option.value || "-"}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuizPreviewDialog({
  open,
  onOpenChange,
  title,
  durationMins,
  questions,
  isLoading,
  isError,
  errorMessage,
}) {
  const canRender = !isLoading && !isError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quiz Preview</DialogTitle>
          <DialogDescription>Read-only preview of what students will see.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm" style={{ color: theme.text.muted }}>
            Loading preview...
          </p>
        ) : null}
        {isError ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        {canRender ? (
          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-4">
              <Card style={{ borderRadius: theme.radius.lg }}>
                <CardContent className="space-y-1 pt-5">
                  <p className="text-base font-semibold" style={{ color: theme.text.primary }}>
                    {title}
                  </p>
                  <p className="text-xs" style={{ color: theme.text.muted }}>
                    Timer: {durationMins} min • Read-only preview mode
                  </p>
                </CardContent>
              </Card>

              {questions.length === 0 ? (
                <p className="text-sm" style={{ color: theme.text.muted }}>
                  No questions to preview.
                </p>
              ) : null}

              {questions.map((question, index) => (
                <PreviewQuestion key={question.id} question={question} index={index} />
              ))}
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
