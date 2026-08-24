import { Component, Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";

import BackendWarmupGate from "@/components/shared/BackendWarmupGate";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import {
  lazyWithPreload,
  registerRoutePreloads,
  useChunkPending,
  usePrefetchOnIdle
} from "@/hooks/useRoutePrefetch";

// Auth — small, load eagerly
import LoginPage from "@/pages/auth/LoginPage";
import { clearSessionExpiredGuard, SESSION_EXPIRED_EVENT } from "@/services/api";

const TeacherLayout = lazyWithPreload(() => import("@/components/layout/TeacherLayout"));
const AdminLayout = lazyWithPreload(() => import("@/components/layout/AdminLayout"));

const RegisterPage = lazyWithPreload(() => import("@/pages/auth/RegisterPage"));
const LandingPage = lazyWithPreload(() => import("@/pages/marketing/LandingPage"));
const EntryPage = lazyWithPreload(() => import("@/pages/student/EntryPage"));
const QuizPage = lazyWithPreload(() => import("@/pages/student/QuizPage"));
const DashboardPage = lazyWithPreload(() => import("@/pages/teacher/DashboardPage"));
const ProfilePage = lazyWithPreload(() => import("@/pages/teacher/ProfilePage"));
const QuestionBankPage = lazyWithPreload(() => import("@/pages/teacher/QuestionBankPage"));
const ManualQuizPage = lazyWithPreload(() => import("@/pages/teacher/ManualQuizPage"));
const AutoGeneratePage = lazyWithPreload(() => import("@/pages/teacher/AutoGeneratePage"));
const QuizLibraryPage = lazyWithPreload(() => import("@/pages/teacher/QuizLibraryPage"));
const ScheduledQuizListPage = lazyWithPreload(() => import("@/pages/teacher/ScheduledQuizListPage"));
const OngoingQuizListPage = lazyWithPreload(() => import("@/pages/teacher/OngoingQuizListPage"));
const OngoingQuizPage = lazyWithPreload(() => import("@/pages/teacher/OngoingQuizPage"));
const QuizResponsePage = lazyWithPreload(() => import("@/pages/teacher/QuizResponsePage"));
const AdminDashboardPage = lazyWithPreload(() => import("@/pages/admin/AdminDashboardPage"));
const SchoolTeachersPage = lazyWithPreload(() => import("@/pages/admin/SchoolTeachersPage"));
const AllTeachersPage = lazyWithPreload(() => import("@/pages/admin/AllTeachersPage"));

const PUBLIC_APP_ROUTES = [
  { path: "/register", Component: RegisterPage },
  { path: "/quiz/enter/:accessToken", Component: EntryPage },
  { path: "/quiz/take", Component: QuizPage }
];

const TEACHER_ROUTES = [
  { path: "/teacher", Component: DashboardPage },
  { path: "/teacher/profile", Component: ProfilePage },
  { path: "/teacher/questions/:subjectId", Component: QuestionBankPage },
  { path: "/teacher/quiz/manual", Component: ManualQuizPage },
  { path: "/teacher/quiz/manual/:quizId", Component: ManualQuizPage },
  { path: "/teacher/quiz/auto", Component: AutoGeneratePage },
  { path: "/teacher/quiz/library", Component: QuizLibraryPage },
  { path: "/teacher/quiz/scheduled", Component: ScheduledQuizListPage },
  { path: "/teacher/quiz/ongoing", Component: OngoingQuizListPage },
  { path: "/teacher/quiz/ongoing/:quizId", Component: OngoingQuizPage },
  { path: "/teacher/quiz/:quizId/responses", Component: QuizResponsePage }
];

const ADMIN_CHILD_ROUTES = [
  { path: "teachers", Component: AllTeachersPage },
  { path: "schools/:school", Component: SchoolTeachersPage }
];

function toPreloadEntry({ path, Component: RouteComponent }) {
  return { path, preload: RouteComponent.preload };
}

// Page entries come first: a tie on prefix length keeps the page, and the shell is already loaded.
registerRoutePreloads([
  ...PUBLIC_APP_ROUTES.map(toPreloadEntry),
  ...TEACHER_ROUTES.map(toPreloadEntry),
  { path: "/admin", preload: AdminDashboardPage.preload },
  { path: "/admin/teachers", preload: AllTeachersPage.preload },
  { path: "/admin/schools", preload: SchoolTeachersPage.preload },
  { path: "/teacher", preload: TeacherLayout.preload },
  { path: "/admin", preload: AdminLayout.preload }
]);

function renderRoutes(routes) {
  return routes.map(({ path, Component: RouteComponent }) => (
    <Route key={path} path={path} element={<RouteComponent />} />
  ));
}

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
    <div className="ds-viewport-h flex w-screen items-center justify-center bg-[#EAEAEC]">
      <div className="w-9 h-9 border-[3px] border-[#f0f0f0] border-t-[#1C1C1E] rounded-full animate-spin" />
    </div>
  );
}

const FALLBACK_DELAY_MS = 400;

// Stays blank for a beat so a fast chunk load never flashes a full-screen spinner.
function DelayedPageLoader() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsVisible(true), FALLBACK_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!isVisible) {
    return null;
  }

  return <PageLoader />;
}

const PROGRESS_BAR_HEIGHT_PX = 3;
const PROGRESS_BAR_COLOR = "#1C1C1E";
const PROGRESS_BAR_Z_INDEX = 60;

// Rendered outside every Suspense boundary so it survives a pending route transition.
function RouteProgressBar() {
  const isPending = useChunkPending();

  if (!isPending) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="animate-pulse"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: PROGRESS_BAR_HEIGHT_PX,
        backgroundColor: PROGRESS_BAR_COLOR,
        zIndex: PROGRESS_BAR_Z_INDEX
      }}
    />
  );
}

// Sends an expired session to /login through the router instead of reloading the document.
function useSessionExpiredRedirect() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const onSessionExpired = () => {
      logout();
      navigate("/login", { replace: true });
      clearSessionExpiredGuard();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [logout, navigate]);
}

function SessionExpiryWatcher() {
  useSessionExpiredRedirect();
  return null;
}

// Warmup and auth hang off this layout, not the root, so the landing page contacts no service.
function AppShell() {
  usePrefetchOnIdle();

  return (
    <BackendWarmupGate>
      <AuthProvider>
        <SessionExpiryWatcher />
        <Suspense fallback={<DelayedPageLoader />}>
          <Outlet />
        </Suspense>
      </AuthProvider>
    </BackendWarmupGate>
  );
}

export default function App() {
  return (
    <>
      <ErrorBoundary>
        <RouteProgressBar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route element={<AppShell />}>
              <Route path="/login" element={<LoginPage />} />
              {renderRoutes(PUBLIC_APP_ROUTES)}

              <Route element={<ProtectedRoute role="teacher" />}>
                <Route element={<TeacherLayout />}>{renderRoutes(TEACHER_ROUTES)}</Route>
              </Route>

              <Route path="/admin" element={<ProtectedRoute role="admin" />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  {renderRoutes(ADMIN_CHILD_ROUTES)}
                </Route>
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
