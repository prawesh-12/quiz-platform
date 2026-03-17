import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { addTeacher as addTeacherApi, getAllSubjects } from "@/services/adminService";
import { theme } from "@/theme";

const SCHOOL_OPTIONS = ["SOT", "SLS", "SOET"];

function buildInitialForm(defaultSchool) {
  return {
    name: "",
    contact_no: "",
    school: defaultSchool,
    email: "",
    password: ""
  };
}

export default function AddTeacherModal({
  open,
  onOpenChange,
  defaultSchool = "SOT",
  onSuccess
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(() => buildInitialForm(defaultSchool));
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildInitialForm(defaultSchool));
    setSelectedSubjectIds([]);
  }, [open, defaultSchool]);

  const subjectsQuery = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: getAllSubjects
  });

  const availableSubjects = subjectsQuery.data?.subjects ?? [];

  const addTeacherMutation = useMutation({
    mutationFn: (payload) => addTeacherApi(payload),
    onSuccess: (data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teachers", payload.school] });
      toast({
        title: "Teacher added",
        description: `${payload.name} has been added successfully.`
      });
      onOpenChange?.(false);
      onSuccess?.(data, { password: payload.password });
    },
    onError: (error) => {
      const details = error?.response?.data?.details?.fieldErrors;
      const fieldMessages = details
        ? Object.entries(details).map(([field, msgs]) => `${field}: ${msgs.join(", ")}`).join(". ")
        : null;
      toast({
        title: "Failed to add teacher",
        description: fieldMessages || error?.response?.data?.error || "Please check the form and try again.",
        variant: "destructive"
      });
    }
  });

  const isSubmitting = addTeacherMutation.isPending;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast({
        title: "Missing required fields",
        description: "Name, email, and password are required.",
        variant: "destructive"
      });
      return;
    }

    if (form.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive"
      });
      return;
    }

    addTeacherMutation.mutate({
      name: form.name.trim(),
      contact_no: form.contact_no.trim() || null,
      school: form.school,
      email: form.email.trim(),
      password: form.password,
      subject_ids: selectedSubjectIds
    });
  };

  const toggleSubject = (subjectId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Add Teacher</DialogTitle>
          <DialogDescription>
            Create a new teacher account and optionally assign subjects.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="teacher-name">Name</Label>
              <Input
                id="teacher-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Enter teacher name"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="teacher-contact">Contact No</Label>
              <Input
                id="teacher-contact"
                value={form.contact_no}
                onChange={(event) => setForm((prev) => ({ ...prev, contact_no: event.target.value }))}
                placeholder="Optional"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="teacher-school">School</Label>
              <Select
                value={form.school}
                onValueChange={(value) => setForm((prev) => ({ ...prev, school: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOL_OPTIONS.map((school) => (
                    <SelectItem key={school} value={school}>
                      {school}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="teacher-email">Email</Label>
              <Input
                id="teacher-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="name@example.com"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="teacher-password">Assign Password</Label>
            <PasswordInput
              id="teacher-password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Minimum 8 characters"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Subject (multi-select)</Label>
            <div
              className="max-h-44 overflow-y-auto rounded-[var(--ds-radius-md)] border p-2"
              style={{ borderColor: theme.border.input, backgroundColor: theme.bg.card }}
            >
              {subjectsQuery.isLoading ? (
                <p className="px-1 py-2 text-[12px]" style={{ color: theme.text.muted }}>
                  Loading subjects...
                </p>
              ) : null}

              {!subjectsQuery.isLoading && availableSubjects.length === 0 ? (
                <p className="px-1 py-2 text-[12px]" style={{ color: theme.text.muted }}>
                  No subjects found. Teacher can still be created.
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
                        disabled={isSubmitting}
                      />
                      <span>{subject.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Teacher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
