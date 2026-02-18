import { BookOpen, Home, LibraryBig, Plus, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import ProfileFooter from "@/components/layout/ProfileFooter";
import { cn } from "@/lib/utils";

export default function TeacherSidebar({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onOpenCreateSubject,
  onOpenGenerateQuiz,
  onOpenProfile,
  user,
  onLogout
}) {
  const location = useLocation();
  const navigationItems = [
    {
      id: "home",
      label: "Home",
      to: "/teacher",
      icon: Home,
      type: "link",
      isActive: location.pathname === "/teacher"
    },
    {
      id: "library",
      label: "Quiz Library",
      to: "/teacher/quiz/scheduled",
      icon: LibraryBig,
      type: "link",
      isActive: location.pathname.startsWith("/teacher/quiz/scheduled")
    },
    {
      id: "generate",
      label: "Generate New Quiz",
      icon: Sparkles,
      type: "action",
      isActive:
        location.pathname.startsWith("/teacher/quiz/manual") ||
        location.pathname.startsWith("/teacher/quiz/auto")
    }
  ];

  return (
    <aside className="z-30 flex h-screen w-full max-w-[19.5rem] flex-col overflow-hidden border-r border-white/10 bg-[#1a1a2e] p-4 text-slate-100 md:fixed md:inset-y-0 md:left-0 md:w-[19.5rem] md:p-5">
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_18px_45px_rgba(7,10,22,0.32)] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff7e6c] to-[#ff9b7f] text-white shadow-[0_10px_20px_rgba(255,126,108,0.35)]">
            <BookOpen className="h-5 w-5" />
          </span>
          <p className="text-lg font-semibold text-white">Console</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Navigation
        </p>
        <div className="mt-2 space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const baseClassName = cn(
              "flex h-11 items-center gap-3 rounded-xl border border-transparent px-3.5 text-[15px] font-medium text-slate-200 transition-all",
              "hover:border-white/15 hover:bg-white/[0.08] hover:text-white",
              item.isActive &&
                "border-[#ff8f81]/40 bg-[#2a3252] text-white shadow-[inset_3px_0_0_0_#ff8f81]"
            );

            if (item.type === "action") {
              return (
                <button
                  key={item.id}
                  type="button"
                  className={baseClassName}
                  onClick={() => onOpenGenerateQuiz?.()}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link key={item.id} to={item.to} className={baseClassName}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 border-t border-white/10 pt-4">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Subject Database
        </p>
        <div className="scrollbar-hidden mt-2 h-full overflow-y-auto">
          <div className="space-y-1.5">
          {subjects.length > 0 ? (
            subjects.map((subject) => {
              const isSelected = Number(selectedSubjectId) === Number(subject.id);

              return (
                <button
                  key={subject.id}
                  type="button"
                  className={cn(
                    "flex h-10 w-full items-center rounded-xl border border-transparent px-3.5 text-left text-sm font-medium text-slate-300 transition-all",
                    "hover:border-white/15 hover:bg-white/[0.08] hover:text-white",
                    isSelected && "border-[#9eb7ff]/45 bg-[#2b3456] text-white"
                  )}
                  onClick={() => onSelectSubject(subject.id)}
                >
                  {subject.name}
                </button>
              );
            })
          ) : (
            <p className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-3 text-center text-xs text-slate-300">
              No subjects yet. Create one to start adding questions.
            </p>
          )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
        <Button
          type="button"
          className="h-11 w-full rounded-xl bg-gradient-to-r from-[#ff6d61] to-[#ff8768] font-semibold text-white shadow-[0_14px_24px_rgba(255,108,93,0.36)] transition-transform duration-200 hover:-translate-y-0.5 hover:from-[#ff766a] hover:to-[#ff9174]"
          onClick={onOpenCreateSubject}
        >
          <Plus className="h-4 w-4" />
          Add Subject
        </Button>
        <ProfileFooter user={user} onLogout={onLogout} onOpenProfile={onOpenProfile} />
      </div>
    </aside>
  );
}
