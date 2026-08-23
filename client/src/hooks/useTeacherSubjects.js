import { useQuery } from "@tanstack/react-query";

import { subjectService } from "@/services/subjectService";

// Canonical teacher subjects key, so the sidebar and pages reuse one cache.
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
