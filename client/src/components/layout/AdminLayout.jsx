import { Suspense, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import AdminSidebar from "@/components/layout/AdminSidebar";
import ShellFrame from "@/components/layout/ShellFrame";
import { resolveShellContent } from "@/components/layout/shellContent";
import { useMobileSidebar } from "@/components/layout/useMobileSidebar";
import Spinner from "@/components/shared/Spinner";
import CreateSubjectDialog from "@/components/teacher/CreateSubjectDialog";
import { ADMIN_SUBJECTS_KEY } from "@/hooks/useAdminSubjects";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { subjectService } from "@/services/subjectService";

const ADMIN_TEACHERS_KEY = ["admin", "teachers"];

function useCreateSubjectDialog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload) => subjectService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SUBJECTS_KEY });
      setIsOpen(false);
      toast({ title: "Subject created", description: "Subject has been added successfully." });
    }
  });

  return { isOpen, setIsOpen, open: () => setIsOpen(true), mutation };
}

function AdminCreateSubjectDialog({ controller }) {
  const { mutation } = controller;

  return (
    <CreateSubjectDialog
      open={controller.isOpen}
      onOpenChange={controller.setIsOpen}
      description="Create a new subject for teacher assignment."
      isPending={mutation.isPending}
      isError={mutation.isError}
      errorMessage={mutation.error?.response?.data?.error}
      onSubmit={(name) => mutation.mutate({ name })}
    />
  );
}

function AdminSidebarSlot({
  selectedSubjectId,
  onSelectSubject,
  onOpenCreateSubject,
  onTeacherAdded,
  onNavigateMobile
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <AdminSidebar
      selectedSubjectId={selectedSubjectId}
      onSelectSubject={onSelectSubject}
      onOpenCreateSubject={onOpenCreateSubject}
      onOpenProfile={() => navigate("/admin")}
      onTeacherAdded={onTeacherAdded}
      user={user}
      onLogout={logout}
      onNavigateMobile={onNavigateMobile}
    />
  );
}

// Owns the admin chrome for every /admin route, so only the content region swaps on navigation.
export default function AdminLayout() {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const mobileSidebar = useMobileSidebar();
  const createSubject = useCreateSubjectDialog();
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const teacherAddedRef = useRef(null);
  const outletContext = useMemo(() => ({ setSelectedSubjectId, teacherAddedRef }), []);

  const onTeacherAdded = (data, meta) => {
    queryClient.invalidateQueries({ queryKey: ADMIN_TEACHERS_KEY });
    teacherAddedRef.current?.(data, meta);
  };

  const sidebar = (
    <AdminSidebarSlot
      selectedSubjectId={selectedSubjectId}
      onSelectSubject={setSelectedSubjectId}
      onOpenCreateSubject={createSubject.open}
      onTeacherAdded={onTeacherAdded}
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
      <AdminCreateSubjectDialog controller={createSubject} />
    </ShellFrame>
  );
}
