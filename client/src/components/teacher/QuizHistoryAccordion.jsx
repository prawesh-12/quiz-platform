import UnitQuestionsList from "@/components/teacher/UnitQuestionsList";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { theme } from "@/theme";

const NOOP = () => {};

function formatQuizDate(quiz) {
  const value = quiz.quiz_date || quiz.created_at;
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function QuizHistoryAccordion({ quizzes, isLoading }) {
  const isEmpty = !isLoading && quizzes.length === 0;

  return (
    <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
      <CardHeader>
        <CardTitle>Quiz History</CardTitle>
        <CardDescription>View questions from previous quizzes.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isEmpty ? (
          <div className="p-6 text-center text-sm" style={{ color: theme.text.muted }}>
            No quiz history found.
          </div>
        ) : null}

        <Accordion type="single" collapsible className="w-full">
          {quizzes.map((quiz) => (
            <AccordionItem key={quiz.id} value={String(quiz.id)}>
              <AccordionTrigger className="px-4">
                <div className="text-left">
                  <div style={{ color: theme.text.primary }}>{quiz.title}</div>
                  <div className="text-xs" style={{ color: theme.text.muted }}>
                    {formatQuizDate(quiz)} • {quiz.questions.length} Questions
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 pt-0">
                  <UnitQuestionsList questions={quiz.questions} onDelete={NOOP} onEdit={NOOP} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
