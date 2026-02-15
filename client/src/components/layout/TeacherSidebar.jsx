import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ProfileFooter from "@/components/layout/ProfileFooter";

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
    <aside className="flex h-full w-full max-w-72 flex-col border-r bg-card p-4">
      <Label className="mb-3 text-sm">Subject Questions Database</Label>
      <Separator className="mb-3" />

      <ScrollArea className="h-[calc(100vh-220px)] space-y-2 pr-1">
        <div className="space-y-2">
          {subjects.length === 0 ? (
            <p className="text-xs text-muted-foreground">No subjects yet. Create one to start adding questions.</p>
          ) : (
            subjects.map((subject) => (
              <Button
                key={subject.id}
                type="button"
                variant={Number(selectedSubjectId) === subject.id ? "secondary" : "outline"}
                className="w-full justify-start"
                onClick={() => onSelectSubject(subject.id)}
              >
                {subject.name}
              </Button>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="mt-4">
        <Button type="button" className="w-full" onClick={onOpenCreateSubject}>
          Add Subject Question
        </Button>
      </div>

      <ProfileFooter user={user} onLogout={onLogout} onOpenProfile={onOpenProfile} />
    </aside>
  );
}
