import { useLocation } from "react-router-dom";

import { isSessionReady } from "./quiz-session";
import { InvalidSessionView, QuizExamView, SubmittedView } from "./quiz-shell";
import { useQuizPayload } from "./use-quiz-payload";
import { useQuizRuntime } from "./use-quiz-runtime";

export default function QuizPage() {
  const location = useLocation();
  const session = useQuizPayload(location.state);
  const runtime = useQuizRuntime(session);

  if (!isSessionReady(session)) {
    return <InvalidSessionView />;
  }

  if (runtime.hasSubmitted) {
    return (
      <SubmittedView
        quiz={session.quiz}
        result={runtime.result}
        questionCount={session.questions.length}
      />
    );
  }

  return <QuizExamView session={session} runtime={runtime} />;
}
