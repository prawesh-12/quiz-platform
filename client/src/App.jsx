import { Component, lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import BackendWarmupGate from "@/components/shared/BackendWarmupGate";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

// Auth — small, load eagerly
import LoginPage from "@/pages/auth/LoginPage";

const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));

// Marketing
const LandingPage = lazy(() => import("@/pages/marketing/LandingPage"));

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
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const SchoolTeachersPage = lazy(() => import("@/pages/admin/SchoolTeachersPage"));
const AllTeachersPage = lazy(() => import("@/pages/admin/AllTeachersPage"));

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

// Warmup + auth hydration hang off this layout route, not the app root, so the landing page
// stays fully static — no service is contacted until a visitor enters the app.
function AppShell() {
  return (
    <BackendWarmupGate>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </BackendWarmupGate>
  );
}

export default function App() {
  return (
    <>
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Marketing */}
          <Route path="/" element={<LandingPage />} />

          <Route element={<AppShell />}>
            {/* Auth — not lazy, fastest possible load */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Student */}
            <Route path="/quiz/enter/:accessToken" element={<EntryPage />} />
            <Route path="/quiz/take" element={<QuizPage />} />

            {/* Teacher — protected */}
            <Route element={<ProtectedRoute role="teacher" />}>
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

            {/* Admin — protected */}
            <Route path="/admin" element={<ProtectedRoute role="admin" />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="teachers" element={<AllTeachersPage />} />
              <Route path="schools/:school" element={<SchoolTeachersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
      <Toaster />
    </>
  );
}
