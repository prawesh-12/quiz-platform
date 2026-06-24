import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Copy } from "lucide-react";

import AssignSubjectsModal from "@/components/admin/AssignSubjectsModal";
import AdminShell from "@/components/layout/AdminShell";
import SchoolTabs from "@/components/admin/SchoolTabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminSubjects, ADMIN_SUBJECTS_KEY } from "@/hooks/useAdminSubjects";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  getCredentials as getCredentialsApi,
  getTeachersBySchool,
  removeTeacherFromSchool as removeFromSchoolApi
} from "@/services/adminService";
import { subjectService } from "@/services/subjectService";
import { copyToClipboard } from "@/utils/clipboard";
import { theme } from "@/theme";

const SCHOOL_VALUES = ["SOT", "SLS", "SOET"];
const SCHOOL_LABELS = {
  SOT: "School of Technology",
  SLS: "School of Life Sciences",
  SOET: "School of Engineering & Technology"
};

function normalizeSchool(value) {
  if (typeof value !== "string") {
    return "SOT";
  }

  const normalized = value.trim().toUpperCase();
  return SCHOOL_VALUES.includes(normalized) ? normalized : "SOT";
}

export default function SchoolTeachersPage() {
  const navigate = useNavigate();
  const { school: schoolParam } = useParams();
  const school = normalizeSchool(schoolParam);
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [assignDialogTeacher, setAssignDialogTeacher] = useState(null);
  const [assignedDialogTeacher, setAssignedDialogTeacher] = useState(null);
  const [credentialsDialog, setCredentialsDialog] = useState({
    open: false,
    teacherName: "",
    data: null,
    password: null,
    oneTime: false
  });
  const [credCopied, setCredCopied] = useState(false);
  const [copyConfirmed, setCopyConfirmed] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  const { subjects } = useAdminSubjects();

  const teachersQuery = useQuery({
    queryKey: ["admin", "teachers", school],
    queryFn: () => getTeachersBySchool(school)
  });

  const createSubjectMutation = useMutation({
    mutationFn: (payload) => subjectService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SUBJECTS_KEY });
      setCreateSubjectOpen(false);
      setSubjectName("");
      toast({
        title: "Subject created",
        description: "Subject has been added successfully."
      });
    }
  });

  const credentialsMutation = useMutation({
    mutationFn: async (teacher) => {
      const response = await getCredentialsApi(teacher.id);
      return { response, teacher };
    },
    onSuccess: ({ response, teacher }) => {
      setCredCopied(false);
      setCopyConfirmed(false);
      setCredentialsDialog({
        open: true,
        teacherName: teacher.name,
        data: response?.credentials ?? null,
        password: null,
        oneTime: false
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (teacherId) => removeFromSchoolApi(teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teachers", school] });
      queryClient.invalidateQueries({ queryKey: ["admin", "all-teachers"] });
      toast({
        title: "Teacher removed from school",
        description: `${teacherToDelete?.name || "Teacher"} has been removed from ${SCHOOL_LABELS[school] || school}.`
      });
      setTeacherToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to remove teacher",
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

    return teachers.filter((teacher) => String(teacher.name || "").toLowerCase().includes(keyword));
  }, [appliedSearch, teachers]);

  const onCreateSubject = (event) => {
    event.preventDefault();
    createSubjectMutation.mutate({ name: subjectName });
  };

  const openAssignDialog = (teacher) => {
    setAssignDialogTeacher(teacher);
  };

  const closeCredentialsDialog = () => {
    setCredentialsDialog((prev) => ({ ...prev, open: false }));
    setCredCopied(false);
    setCopyConfirmed(false);
  };

  const handleCopyCredentials = async () => {
    const password = credentialsDialog.data?.password || credentialsDialog.password;
    if (!password) {
      return;
    }

    const email = credentialsDialog.data?.email || "";
    const text = `Email: ${email}\nPassword: ${password}`;

    if (await copyToClipboard(text)) {
      setCredCopied(true);
      toast({ title: "Copied", description: "Login credentials copied to clipboard." });
    } else {
      toast({
        title: "Copy failed",
        description: "Could not access the clipboard. Please copy the password manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <AdminShell
      subjects={subjects}
      selectedSubjectId={null}
      onSelectSubject={() => {}}
      onOpenCreateSubject={() => setCreateSubjectOpen(true)}
      onOpenProfile={() => navigate("/admin")}
      onTeacherAdded={(data, meta) => {
        queryClient.invalidateQueries({ queryKey: ["admin", "teachers", school] });
        if (data?.teacher) {
          setCredCopied(false);
          setCopyConfirmed(false);
          setCredentialsDialog({
            open: true,
            teacherName: data.teacher.name,
            data: { name: data.teacher.name, email: data.teacher.email },
            password: meta?.password ?? null,
            oneTime: true
          });
        }
      }}
      user={user}
      onLogout={logout}
      contentScrollable
    >
      <div className="space-y-5">
        <div className="rounded-[12px] border p-4" style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.08em]" style={{ color: theme.text.subtle }}>
            Schools
          </p>
          <SchoolTabs
            value={school}
            onChange={(nextSchool) => navigate(`/admin/schools/${nextSchool}`)}
          />
        </div>

        <div className="rounded-[12px] border p-5" style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by teacher name"
              className="w-full max-w-[360px]"
            />
            <Button type="button" variant="outline" onClick={() => setAppliedSearch(searchInput)}>
              Search
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-[12px] border" style={{ borderColor: theme.border.default }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">S.No</TableHead>
                  <TableHead>Name of Teacher</TableHead>
                  <TableHead>Contact No</TableHead>
                  <TableHead className="w-[160px]">Assign Subjects</TableHead>
                  <TableHead className="w-[170px]">Assigned Subjects</TableHead>
                  <TableHead className="w-[170px]">Login Credentials</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {teachersQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Loading teachers...</TableCell>
                  </TableRow>
                ) : null}

                {!teachersQuery.isLoading && filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      {appliedSearch ? "No teachers matched your search." : "No teachers found for this school."}
                    </TableCell>
                  </TableRow>
                ) : null}

                {filteredTeachers.map((teacher, index) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium" style={{ color: theme.text.primary }}>
                          {teacher.name}
                        </p>
                        <p className="text-[12px]" style={{ color: theme.text.muted }}>
                          {teacher.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{teacher.contact_no || "-"}</TableCell>
                    <TableCell>
                      <Button type="button" size="sm" variant="outline" onClick={() => openAssignDialog(teacher)}>
                        click here
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button type="button" size="sm" variant="outline" onClick={() => setAssignedDialogTeacher(teacher)}>
                        click here
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={credentialsMutation.isPending}
                        onClick={() => credentialsMutation.mutate(teacher)}
                      >
                        click here
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setTeacherToDelete(teacher)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <AssignSubjectsModal
        open={Boolean(assignDialogTeacher)}
        onOpenChange={(open) => {
          if (!open) {
            setAssignDialogTeacher(null);
          }
        }}
        teacherId={assignDialogTeacher?.id ?? null}
        teacherName={assignDialogTeacher?.name}
        school={school}
        assignedSubjectIds={(assignDialogTeacher?.assigned_subjects || []).map((subject) => subject.id)}
        onSuccess={() => {
          setAssignDialogTeacher(null);
        }}
      />

      <Dialog open={Boolean(assignedDialogTeacher)} onOpenChange={(open) => !open && setAssignedDialogTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigned Subjects</DialogTitle>
            <DialogDescription>
              Current subjects for {assignedDialogTeacher?.name || "teacher"}.
            </DialogDescription>
          </DialogHeader>
          <div
            className="max-h-52 overflow-y-auto rounded-[var(--ds-radius-md)] border p-3"
            style={{ borderColor: theme.border.input, backgroundColor: theme.bg.card }}
          >
            {(assignedDialogTeacher?.assigned_subjects || []).length === 0 ? (
              <p className="text-[13px]" style={{ color: theme.text.muted }}>
                No subjects assigned.
              </p>
            ) : (
              <ul className="space-y-2">
                {(assignedDialogTeacher?.assigned_subjects || []).map((subject) => (
                  <li key={subject.id || subject.name} className="text-[13px]" style={{ color: theme.text.secondary }}>
                    {subject.name || subject}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={credentialsDialog.open}
        onOpenChange={(open) => {
          // In one-time mode the password can never be retrieved again, so block any
          // dismissal (overlay/escape/close) until the admin confirms they copied it.
          if (!open && credentialsDialog.oneTime && !copyConfirmed) {
            return;
          }
          if (open) {
            setCredentialsDialog((prev) => ({ ...prev, open: true }));
          } else {
            closeCredentialsDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Credentials</DialogTitle>
            <DialogDescription>
              Credentials summary for {credentialsDialog.teacherName || "teacher"}.
            </DialogDescription>
          </DialogHeader>

          {credentialsDialog.oneTime ? (
            <div
              className="rounded-[var(--ds-radius-md)] border p-3 text-[13px]"
              style={{
                borderColor: theme.status?.warning?.border || "#f59e0b",
                backgroundColor: theme.status?.warning?.bg || "#fffbeb",
                color: theme.status?.warning?.text || "#92400e"
              }}
            >
              This password is shown <strong>only once</strong> and cannot be retrieved later.
              Copy it now and share it securely with the teacher.
            </div>
          ) : null}

          <div className="space-y-3 rounded-[var(--ds-radius-md)] border p-3" style={{ borderColor: theme.border.input }}>
            <div>
              <p className="text-[12px]" style={{ color: theme.text.muted }}>
                Name
              </p>
              <p className="text-[14px]" style={{ color: theme.text.primary, fontWeight: 600 }}>
                {credentialsDialog.data?.name || credentialsDialog.teacherName || "-"}
              </p>
            </div>
            <div>
              <p className="text-[12px]" style={{ color: theme.text.muted }}>
                Email
              </p>
              <p className="text-[14px]" style={{ color: theme.text.primary, fontWeight: 600 }}>
                {credentialsDialog.data?.email || "-"}
              </p>
            </div>
            {(credentialsDialog.data?.password || credentialsDialog.password) ? (
              <div>
                <p className="text-[12px]" style={{ color: theme.text.muted }}>
                  Password
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] break-all" style={{ color: theme.text.primary, fontWeight: 600 }}>
                    {credentialsDialog.data?.password || credentialsDialog.password}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={handleCopyCredentials}
                  >
                    {credCopied ? (
                      <>
                        <Check className="mr-1 h-4 w-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[12px]" style={{ color: theme.text.muted }}>
                  Password
                </p>
                <p className="text-[13px]" style={{ color: theme.text.muted }}>
                  Not available. Teacher may have been created before password storage was enabled.
                </p>
              </div>
            )}
          </div>

          {credentialsDialog.oneTime ? (
            <>
              <label className="flex cursor-pointer items-start gap-2 text-[13px]" style={{ color: theme.text.primary }}>
                <Checkbox
                  className="mt-0.5"
                  checked={copyConfirmed}
                  onCheckedChange={(value) => setCopyConfirmed(value === true)}
                />
                <span>I have copied the password and saved it securely.</span>
              </label>
              <DialogFooter>
                <Button type="button" disabled={!copyConfirmed} onClick={closeCredentialsDialog}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(teacherToDelete)} onOpenChange={(open) => !open && setTeacherToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from School</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{teacherToDelete?.name}</strong> from <strong>{SCHOOL_LABELS[school] || school}</strong>? The teacher will still exist in the system but won't be associated with this school.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTeacherToDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(teacherToDelete.id)}
            >
              {deleteMutation.isPending ? "Removing..." : "Remove from School"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createSubjectOpen} onOpenChange={setCreateSubjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
            <DialogDescription>Create a new subject for teacher assignment.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onCreateSubject}>
            <div className="space-y-2">
              <Label htmlFor="subject-name-admin-schools">Subject Name</Label>
              <Input
                id="subject-name-admin-schools"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="e.g. Operating System"
                required
              />
            </div>

            {createSubjectMutation.isError ? (
              <p className="text-sm text-destructive">
                {createSubjectMutation.error?.response?.data?.error || "Failed to create subject"}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={createSubjectMutation.isPending}>
                {createSubjectMutation.isPending ? "Creating..." : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
