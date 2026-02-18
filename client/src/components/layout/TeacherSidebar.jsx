import { Home, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProfileFooter from "@/components/layout/ProfileFooter";
import { cn } from "@/lib/utils";

export default function TeacherSidebar({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onOpenCreateSubject,
  onOpenProfile,
  user,
  onLogout
}) {
  return (
    <aside className="z-30 flex h-full w-full max-w-[19.5rem] flex-col border-r border-white/10 bg-[#1a1a2e] p-4 text-slate-100 md:fixed md:inset-y-0 md:left-0 md:h-screen md:w-[19.5rem] md:p-5">
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_18px_45px_rgba(7,10,22,0.32)] backdrop-blur-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Teacher Console
        </p>
        <h1 className="mt-2 text-xl font-semibold text-white">Quiz Dashboard</h1>
      </div>

      <Button
        asChild
        type="button"
        variant="ghost"
        className="mb-5 h-11 w-full justify-start rounded-xl border border-white/10 bg-white/[0.04] px-4 font-semibold text-slate-100 shadow-sm transition-colors hover:bg-white/10 hover:text-white"
      >
        <Link to="/teacher">
          <Home className="h-4 w-4" />
          Home
        </Link>
      </Button>

      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Subject Database
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-292px)] space-y-2 pr-1">
        <div className="space-y-2">
          {subjects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-3 text-center text-xs text-slate-300">
              No subjects yet. Create one to start adding questions.
            </p>
          ) : (
            subjects.map((subject) => {
              const isSelected = Number(selectedSubjectId) === subject.id;

              return (
                <Button
                  key={subject.id}
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-11 w-full justify-start rounded-xl border border-white/10 bg-white/[0.03] px-4 text-left text-[15px] font-medium text-slate-200 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white",
                    isSelected &&
                      "border-[#5a83ff]/70 bg-gradient-to-r from-[#3f66da]/45 to-[#5a83ff]/45 text-white shadow-[0_14px_30px_rgba(22,55,162,0.34)]"
                  )}
                  onClick={() => onSelectSubject(subject.id)}
                >
                  {subject.name}
                </Button>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="mt-4">
        <Button
          type="button"
          className="h-11 w-full rounded-xl bg-gradient-to-r from-[#ff6d61] to-[#ff8768] font-semibold text-white shadow-[0_14px_24px_rgba(255,108,93,0.36)] transition-transform duration-200 hover:-translate-y-0.5 hover:from-[#ff766a] hover:to-[#ff9174]"
          onClick={onOpenCreateSubject}
        >
          <Plus className="h-4 w-4" />
          Add Subject
        </Button>
      </div>

      <ProfileFooter user={user} onLogout={onLogout} onOpenProfile={onOpenProfile} />
    </aside>
  );
}
