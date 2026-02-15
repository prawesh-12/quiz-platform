import TeacherSidebar from "@/components/layout/TeacherSidebar";

export default function TeacherShell({
  children,
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onOpenCreateSubject,
  onOpenProfile,
  user,
  onLogout
}) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <TeacherSidebar
        subjects={subjects}
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={onSelectSubject}
        onOpenCreateSubject={onOpenCreateSubject}
        onOpenProfile={onOpenProfile}
        user={user}
        onLogout={onLogout}
      />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
