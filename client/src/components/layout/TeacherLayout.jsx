import { Suspense, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import ShellFrame from "@/components/layout/ShellFrame";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { resolveShellContent } from "@/components/layout/shellContent";
import { useMobileSidebar } from "@/components/layout/useMobileSidebar";
import Spinner from "@/components/shared/Spinner";
import GenerateModeModal from "@/components/teacher/GenerateModeModal";
import { useAuth } from "@/hooks/useAuth";

// Owns the teacher chrome for every /teacher route, so only the content region swaps on navigation.
export default function TeacherLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const mobileSidebar = useMobileSidebar();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const outletContext = useMemo(() => ({ setSelectedSubjectId }), []);

  const sidebar = (
    <TeacherSidebar
      selectedSubjectId={selectedSubjectId}
      onSelectSubject={(subjectId) => navigate(`/teacher/questions/${subjectId}`)}
      onOpenGenerateQuiz={() => setIsGenerateOpen(true)}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
      onNavigateMobile={mobileSidebar.close}
    />
  );

  return (
    <ShellFrame
      sidebar={sidebar}
      mobileSidebar={mobileSidebar}
      content={resolveShellContent(pathname)}
    >
      <Suspense fallback={<Spinner className="py-10" label="Loading page..." />}>
        <Outlet context={outletContext} />
      </Suspense>
      <GenerateModeModal open={isGenerateOpen} onOpenChange={setIsGenerateOpen} />
    </ShellFrame>
  );
}
