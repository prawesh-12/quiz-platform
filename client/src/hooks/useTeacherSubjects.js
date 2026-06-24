import { useQuery } from "@tanstack/react-query";

import { subjectService } from "@/services/subjectService";

// Canonical teacher subjects query (the subjects this teacher can see). Shared key so the
// sidebar and pages reuse one cache and the sidebar can show its own loading state.
export const TEACHER_SUBJECTS_KEY = ["subjects"];

export function useTeacherSubjects() {
  const query = useQuery({
    queryKey: TEACHER_SUBJECTS_KEY,
    queryFn: () => subjectService.list()
  });

  const subjects = Array.isArray(query.data?.subjects) ? query.data.subjects : [];

  return {
    subjects,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
