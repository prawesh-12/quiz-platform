import Spinner from "@/components/shared/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { theme } from "@/theme";

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

function formatDateOnly(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function buildFields(quiz, subjectName) {
  return [
    { label: "Quiz Title", value: quiz?.title || "-" },
    { label: "Subject", value: subjectName ?? quiz?.subject_id ?? "-" },
    { label: "Duration (mins)", value: quiz?.duration_mins ?? "-" },
    { label: "Batch", value: quiz?.batch || "-" },
    { label: "Division", value: quiz?.division || "-" },
    { label: "Group", value: quiz?.group_nos || "-" },
    { label: "Quiz Date", value: formatDateOnly(quiz?.quiz_date) },
    { label: "Access Code", value: quiz?.access_code || "-", isMono: true },
    { label: "Scheduled Start", value: formatDateTime(quiz?.scheduled_start), isWide: true },
    { label: "Scheduled End", value: formatDateTime(quiz?.scheduled_end), isWide: true },
  ];
}

function buildOptions(question) {
  return [
    ["A", question.option_a ?? "-"],
    ["B", question.option_b ?? "-"],
    ["C", question.option_c],
    ["D", question.option_d],
  ].filter(([, value]) => value != null && value !== "");
}

function QuestionCard({ question, index }) {
  return (
    <Card style={{ borderRadius: theme.radius.lg }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Q{index + 1}. {question.question_text || "-"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        {buildOptions(question).map(([key, value]) => (
          <p key={key}>
            <span style={{ color: theme.text.muted }}>{key}.</span> {value}
          </p>
        ))}
        <p className="pt-2 font-medium" style={{ color: theme.text.muted }}>
          Correct: {String(question.correct_option || "-").toUpperCase()}
        </p>
      </CardContent>
    </Card>
  );
}

export default function QuizDetailsDialog({ open, onOpenChange, query, subjectName }) {
  const data = query.data;
  const questions = data?.questions || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quiz Details</DialogTitle>
          <DialogDescription>Full quiz configuration and questions (read-only).</DialogDescription>
        </DialogHeader>

        {query.isLoading ? <Spinner label="Loading quiz details..." /> : null}
        {query.isError ? (
          <p className="text-sm text-destructive">
            {query.error?.response?.data?.error || "Failed to load quiz details"}
          </p>
        ) : null}

        {data ? (
          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {buildFields(data.quiz, subjectName).map((field) => (
                  <div key={field.label} className={field.isWide ? "space-y-1 md:col-span-2" : "space-y-1"}>
                    <p className="text-xs font-medium" style={{ color: theme.text.muted }}>
                      {field.label}
                    </p>
                    <p className={field.isMono ? "font-mono text-sm" : "text-sm"}>{field.value}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4" style={{ borderTopColor: theme.border.default }}>
                <h3 className="mb-3 text-sm font-semibold">Questions</h3>
                <div className="space-y-4">
                  {questions.length === 0 ? (
                    <p className="text-sm" style={{ color: theme.text.muted }}>
                      No questions.
                    </p>
                  ) : (
                    questions.map((question, index) => (
                      <QuestionCard key={question.id} question={question} index={index} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
