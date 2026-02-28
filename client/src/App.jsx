import { Component, lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";

// Auth — small, load eagerly
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// Student — lazy
const EntryPage = lazy(() => import("@/pages/student/EntryPage"));
const QuizPage = lazy(() => import("@/pages/student/QuizPage"));

// Teacher — all lazy (these are the heavy ones)
const DashboardPage = lazy(() => import("@/pages/teacher/DashboardPage"));
const ProfilePage = lazy(() => import("@/pages/teacher/ProfilePage"));
const QuestionBankPage = lazy(() => import("@/pages/teacher/QuestionBankPage"));
const ManualQuizPage = lazy(() => import("@/pages/teacher/ManualQuizPage"));
const AutoGeneratePage = lazy(() => import("@/pages/teacher/AutoGeneratePage"));
const QuizLibraryPage = lazy(() => import("@/pages/teacher/QuizLibraryPage"));
const ScheduledQuizListPage = lazy(() => import("@/pages/teacher/ScheduledQuizListPage"));
const OngoingQuizListPage = lazy(() => import("@/pages/teacher/OngoingQuizListPage"));
const OngoingQuizPage = lazy(() => import("@/pages/teacher/OngoingQuizPage"));
const QuizResponsePage = lazy(() => import("@/pages/teacher/QuizResponsePage"));

// Catches any render/lazy-load errors so a blank screen doesn't hide the real problem
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", color: "#1C1C1E" }}>
          <strong>App crashed:</strong>
          <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 13 }}>
            {this.state.error?.message ?? String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Spinner shown while any lazy page loads
function PageLoader() {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#EAEAEC]">
      <div className="w-9 h-9 border-[3px] border-[#f0f0f0] border-t-[#1C1C1E] rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth — not lazy, fastest possible load */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student */}
          <Route path="/quiz/enter/:accessToken" element={<EntryPage />} />
          <Route path="/quiz/take" element={<QuizPage />} />

          {/* Teacher — protected */}
          <Route element={<ProtectedRoute requiredRole="teacher" />}>
            <Route path="/teacher" element={<DashboardPage />} />
            <Route path="/teacher/profile" element={<ProfilePage />} />
            <Route path="/teacher/questions/:subjectId" element={<QuestionBankPage />} />
            <Route path="/teacher/quiz/manual" element={<ManualQuizPage />} />
            <Route path="/teacher/quiz/manual/:quizId" element={<ManualQuizPage />} />
            <Route path="/teacher/quiz/auto" element={<AutoGeneratePage />} />
            <Route path="/teacher/quiz/library" element={<QuizLibraryPage />} />
            <Route path="/teacher/quiz/scheduled" element={<ScheduledQuizListPage />} />
            <Route path="/teacher/quiz/ongoing" element={<OngoingQuizListPage />} />
            <Route path="/teacher/quiz/ongoing/:quizId" element={<OngoingQuizPage />} />
            <Route path="/teacher/quiz/:quizId/responses" element={<QuizResponsePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
      <Toaster />
    </>
  );
}