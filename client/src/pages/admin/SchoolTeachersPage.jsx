import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import AssignSubjectsModal from "@/components/admin/AssignSubjectsModal";
import SchoolTabs from "@/components/admin/SchoolTabs";
import { useShellTeacherAdded } from "@/components/layout/shellOutletContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import {
  getTeachersBySchool,
  removeTeacherFromSchool as removeFromSchoolApi
} from "@/services/adminService";
import { theme } from "@/theme";

import {
  AssignedSubjectsDialog,
  CredentialsDialog,
  RemoveTeacherDialog
} from "./school-teacher-dialogs";
import SchoolTeachersTable from "./school-teachers-table";
import { useTeacherCredentials } from "./useTeacherCredentials";

const CARD_STYLE = {
  borderRadius: theme.radius.lg,
  borderColor: theme.border.default,
  backgroundColor: theme.bg.card
};

const DEFAULT_SCHOOL = "SOT";
const SCHOOL_VALUES = ["SOT", "SLS", "SOET"];
const SCHOOL_LABELS = {
  SOT: "School of Technology",
  SLS: "School of Life Sciences",
  SOET: "School of Engineering & Technology"
};

function normalizeSchool(value) {
  if (typeof value !== "string") {
    return DEFAULT_SCHOOL;
  }

  const normalized = value.trim().toUpperCase();
  return SCHOOL_VALUES.includes(normalized) ? normalized : DEFAULT_SCHOOL;
}

function filterByName(teachers, keyword) {
  const search = keyword.trim().toLowerCase();
  if (!search) {
    return teachers;
  }

  return teachers.filter((teacher) => String(teacher.name || "").toLowerCase().includes(search));
}

function useRemoveTeacher(school, onRemoved) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (teacherId) => removeFromSchoolApi(teacherId),
    onSuccess: (data, teacherId) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teachers", school] });
      queryClient.invalidateQueries({ queryKey: ["admin", "all-teachers"] });
      onRemoved(teacherId);
    },
    onError: (error) => {
      toast({
        title: "Failed to remove teacher",
        description: error?.response?.data?.error || "Please try again.",
        variant: "destructive"
      });
    }
  });
}

function SchoolTeachersHeader({ school, searchInput, onSearchInputChange, onSearch }) {
  return (
    <>
      <h1 className="text-[22px] font-bold tracking-[-0.02em]" style={{ color: theme.text.primary }}>
        {SCHOOL_LABELS[school] || school}
      </h1>
      <p className="mt-1 text-[13px]" style={{ color: theme.text.muted }}>
        Teachers in this school. Assign subjects, share login credentials or remove a teacher.
      </p>

      <form className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center" onSubmit={onSearch}>
        <Input
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
          placeholder="Search by teacher name"
          aria-label="Search teachers by name"
          className="w-full sm:max-w-[360px]"
        />
        <Button type="submit" variant="outline" className="w-full sm:w-auto">
          Search
        </Button>
      </form>
    </>
  );
}

export default function SchoolTeachersPage() {
  const navigate = useNavigate();
  const { school: schoolParam } = useParams();
  const school = normalizeSchool(schoolParam);
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [assignedTeacher, setAssignedTeacher] = useState(null);
  const [teacherToRemove, setTeacherToRemove] = useState(null);

  const credentials = useTeacherCredentials();

  const teachersQuery = useQuery({
    queryKey: ["admin", "teachers", school],
    queryFn: () => getTeachersBySchool(school)
  });

  const removeTeacher = useRemoveTeacher(school, () => {
    toast({
      title: "Teacher removed from school",
      description: `${teacherToRemove?.name || "Teacher"} has been removed from ${SCHOOL_LABELS[school] || school}.`
    });
    setTeacherToRemove(null);
  });

  useShellTeacherAdded((data, meta) => {
    if (data?.teacher) {
      credentials.showForNewTeacher(data.teacher, meta?.password ?? null);
    }
  });

  const teachers = teachersQuery.data?.teachers ?? [];
  const filteredTeachers = useMemo(() => filterByName(teachers, appliedSearch), [appliedSearch, teachers]);

  const onSearch = (event) => {
    event.preventDefault();
    setAppliedSearch(searchInput);
  };

  return (
    <>
      <div className="space-y-5">
        <div className="border p-4 sm:p-5" style={CARD_STYLE}>
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: theme.text.muted }}
          >
            Schools
          </p>
          <SchoolTabs
            value={school}
            onChange={(nextSchool) => navigate(`/admin/schools/${nextSchool}`)}
          />
        </div>

        <div className="border p-4 sm:p-5" style={CARD_STYLE}>
          <SchoolTeachersHeader
            school={school}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearch={onSearch}
          />

          <SchoolTeachersTable
            teachers={filteredTeachers}
            isLoading={teachersQuery.isLoading}
            emptyMessage={
              appliedSearch ? "No teachers matched your search." : "No teachers found for this school."
            }
            actions={{
              isCredentialsPending: credentials.isPending,
              onAssign: setAssignTeacher,
              onViewAssigned: setAssignedTeacher,
              onShowCredentials: credentials.request,
              onRemove: setTeacherToRemove
            }}
          />
        </div>
      </div>

      <AssignSubjectsModal
        open={Boolean(assignTeacher)}
        onOpenChange={(open) => !open && setAssignTeacher(null)}
        teacherId={assignTeacher?.id ?? null}
        teacherName={assignTeacher?.name}
        school={school}
        assignedSubjectIds={(assignTeacher?.assigned_subjects || []).map((subject) => subject.id)}
        onSuccess={() => setAssignTeacher(null)}
      />

      <AssignedSubjectsDialog teacher={assignedTeacher} onClose={() => setAssignedTeacher(null)} />

      <CredentialsDialog
        state={credentials.dialog}
        hasCopied={credentials.hasCopied}
        copyConfirmed={credentials.copyConfirmed}
        onCopy={credentials.copy}
        onConfirmCopy={credentials.setCopyConfirmed}
        onOpenChange={credentials.onOpenChange}
        onClose={credentials.close}
      />

      <RemoveTeacherDialog
        teacher={teacherToRemove}
        schoolLabel={SCHOOL_LABELS[school] || school}
        isPending={removeTeacher.isPending}
        onCancel={() => setTeacherToRemove(null)}
        onConfirm={removeTeacher.mutate}
      />
    </>
  );
}
