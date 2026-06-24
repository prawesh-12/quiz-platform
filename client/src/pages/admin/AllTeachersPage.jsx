import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AdminShell from "@/components/layout/AdminShell";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  deleteTeacher as deleteTeacherApi,
  getAllTeachers
} from "@/services/adminService";
import { theme } from "@/theme";

const SCHOOL_LABELS = {
  SOT: "School of Technology",
  SLS: "School of Life Sciences",
  SOET: "School of Engineering & Technology"
};

export default function AllTeachersPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  const teachersQuery = useQuery({
    queryKey: ["admin", "all-teachers"],
    queryFn: getAllTeachers
  });

  const deleteMutation = useMutation({
    mutationFn: (teacherId) => deleteTeacherApi(teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({
        title: "Teacher deleted",
        description: `${teacherToDelete?.name || "Teacher"} has been permanently removed.`
      });
      setTeacherToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete teacher",
        description: error?.response?.data?.error || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const teachers = teachersQuery.data?.teachers ?? [];

  const filteredTeachers = useMemo(() => {
    const keyword = appliedSearch.trim().toLowerCase();
    if (!keyword) {
      return teachers;
    }
    return teachers.filter(
      (t) =>
        t.name?.toLowerCase().includes(keyword) ||
        t.email?.toLowerCase().includes(keyword)
    );
  }, [teachers, appliedSearch]);

  return (
    <AdminShell user={user} onLogout={logout} contentScrollable>
      <div className="space-y-5">
        <div className="rounded-[12px] border p-4 sm:p-5" style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}>
          <h1 className="text-[22px] font-semibold" style={{ color: theme.text.primary }}>
            All Teachers
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: theme.text.muted }}>
            Complete list of all teachers across all schools. Remove a teacher permanently from here.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name or email"
              className="w-full sm:max-w-[360px]"
            />
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setAppliedSearch(searchInput)}>
              Search
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] whitespace-nowrap">S.No</TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">School</TableHead>
                  <TableHead className="whitespace-nowrap">Contact</TableHead>
                  <TableHead className="w-[100px] whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {teachersQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading teachers...</TableCell>
                  </TableRow>
                ) : null}

                {!teachersQuery.isLoading && filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      {appliedSearch ? "No teachers matched your search." : "No teachers found."}
                    </TableCell>
                  </TableRow>
                ) : null}

                {filteredTeachers.map((teacher, index) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="whitespace-nowrap">{index + 1}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p className="font-medium" style={{ color: theme.text.primary }}>
                        {teacher.name}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p className="text-[13px]" style={{ color: theme.text.secondary }}>
                        {teacher.email}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p className="text-[13px]" style={{ color: theme.text.secondary }}>
                        {teacher.school ? `${teacher.school} — ${SCHOOL_LABELS[teacher.school] || teacher.school}` : "—"}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{teacher.contact_no || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setTeacherToDelete(teacher)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(teacherToDelete)} onOpenChange={(open) => !open && setTeacherToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Teacher Permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{teacherToDelete?.name}</strong>?
              This will remove the teacher and all their associated data (subjects, questions, quizzes).
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setTeacherToDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(teacherToDelete.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
