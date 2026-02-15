import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/shared/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import EntryPage from "@/pages/student/EntryPage";
import QuizPage from "@/pages/student/QuizPage";
import AutoGeneratePage from "@/pages/teacher/AutoGeneratePage";
import DashboardPage from "@/pages/teacher/DashboardPage";
import ManualQuizPage from "@/pages/teacher/ManualQuizPage";
import OngoingQuizListPage from "@/pages/teacher/OngoingQuizListPage";
import OngoingQuizPage from "@/pages/teacher/OngoingQuizPage";
import ProfilePage from "@/pages/teacher/ProfilePage";
import QuestionBankPage from "@/pages/teacher/QuestionBankPage";
import QuizResponsePage from "@/pages/teacher/QuizResponsePage";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/quiz/enter/:accessToken" element={<EntryPage />} />
        <Route path="/quiz/take" element={<QuizPage />} />

        <Route element={<ProtectedRoute requiredRole="teacher" />}>
          <Route path="/teacher" element={<DashboardPage />} />
          <Route path="/teacher/profile" element={<ProfilePage />} />
          <Route path="/teacher/questions/:subjectId" element={<QuestionBankPage />} />
          <Route path="/teacher/quiz/manual" element={<ManualQuizPage />} />
          <Route path="/teacher/quiz/manual/:quizId" element={<ManualQuizPage />} />
          <Route path="/teacher/quiz/auto" element={<AutoGeneratePage />} />
          <Route path="/teacher/quiz/ongoing" element={<OngoingQuizListPage />} />
          <Route path="/teacher/quiz/ongoing/:quizId" element={<OngoingQuizPage />} />
          <Route path="/teacher/quiz/:quizId/responses" element={<QuizResponsePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
