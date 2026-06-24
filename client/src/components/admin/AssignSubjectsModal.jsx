import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { assignSubjects, getAllSubjects } from "@/services/adminService";
import { theme } from "@/theme";

export default function AssignSubjectsModal({
  open,
  onOpenChange,
  teacherId,
  teacherName,
  school,
  assignedSubjectIds = [],
  onSuccess
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  const uniqueAssignedIds = useMemo(
    () => [...new Set((assignedSubjectIds || []).map((id) => Number(id)).filter(Boolean))],
    [assignedSubjectIds]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedSubjectIds(uniqueAssignedIds);
  }, [open, uniqueAssignedIds, teacherId]);

  const subjectsQuery = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: getAllSubjects
  });

  const saveMutation = useMutation({
    mutationFn: ({ nextSubjectIds }) => assignSubjects(teacherId, nextSubjectIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teachers", school] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast({
        title: "Subjects assigned",
        description: "Teacher subject assignments have been updated."
      });
      onOpenChange?.(false);
      onSuccess?.();
    }
  });

  const availableSubjects = subjectsQuery.data?.subjects ?? [];

  const toggleSubject = (subjectId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSave = () => {
    if (!teacherId) {
      return;
    }

    saveMutation.mutate({ nextSubjectIds: selectedSubjectIds });
  };

  const isSaving = saveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Subjects</DialogTitle>
          <DialogDescription>
            Choose subjects for {teacherName || "teacher"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Subjects</Label>
          <div
            className="max-h-52 overflow-y-auto rounded-[var(--ds-radius-md)] border p-2"
            style={{ borderColor: theme.border.input, backgroundColor: theme.bg.card }}
          >
            {subjectsQuery.isLoading ? (
              <p className="px-1 py-2 text-[12px]" style={{ color: theme.text.muted }}>
                Loading subjects...
              </p>
            ) : null}

            {!subjectsQuery.isLoading && availableSubjects.length === 0 ? (
              <p className="px-1 py-2 text-[12px]" style={{ color: theme.text.muted }}>
                No subjects available. Create a subject first.
              </p>
            ) : null}

            <div className="space-y-1">
              {availableSubjects.map((subject) => {
                const checked = selectedSubjectIds.includes(subject.id);
                return (
                  <label
                    key={subject.id}
                    className="flex cursor-pointer items-center gap-2 rounded-[var(--ds-radius-sm)] px-2 py-1.5 text-[13px] hover:bg-[var(--ds-bg-input)]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubject(subject.id)}
                      disabled={isSaving}
                    />
                    <span>{subject.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange?.(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" className="w-full sm:w-auto" disabled={isSaving || !teacherId} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
