import { Home, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
    <aside className="z-30 flex h-full w-full max-w-72 flex-col border-r border-border/70 bg-gradient-to-b from-card via-card to-muted/20 p-4 md:fixed md:inset-y-0 md:left-0 md:h-screen md:w-72">
      <Button
        asChild
        type="button"
        variant="outline"
        className="mb-4 h-11 w-full justify-center rounded-2xl border-border/70 bg-background/80 font-semibold shadow-sm"
      >
        <Link to="/teacher">
          <Home className="h-4 w-4" />
          Home
        </Link>
      </Button>

      <div className="mb-3 flex items-center justify-between">
        <Label className="text-sm font-semibold tracking-wide">Subject Questions Database</Label>
        <Sparkles className="h-4 w-4 text-muted-foreground" />
      </div>
      <Separator className="mb-3" />

      <ScrollArea className="h-[calc(100vh-284px)] space-y-2 pr-1">
        <div className="space-y-2">
          {subjects.length === 0 ? (
            <p className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">
              No subjects yet. Create one to start adding questions.
            </p>
          ) : (
            subjects.map((subject) => {
              const isSelected = Number(selectedSubjectId) === subject.id;

              return (
                <Button
                  key={subject.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-11 w-full justify-center rounded-2xl border-border/70 bg-background/75 text-[15px] font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:bg-background hover:shadow-md",
                    isSelected && "border-primary bg-primary text-primary-foreground shadow-md hover:bg-primary/95"
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
        <Button type="button" className="h-11 w-full rounded-2xl font-semibold shadow-md" onClick={onOpenCreateSubject}>
          Add Subject
        </Button>
      </div>

      <ProfileFooter user={user} onLogout={onLogout} onOpenProfile={onOpenProfile} />
    </aside>
  );
}
