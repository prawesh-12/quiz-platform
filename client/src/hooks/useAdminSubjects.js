import { useQuery } from "@tanstack/react-query";

import { getAllSubjects } from "@/services/adminService";

// Canonical admin subjects query. Every admin screen reads through this key so the sidebar,
// dashboard, and modals share one cache and one source of truth (/admin/subjects).
export const ADMIN_SUBJECTS_KEY = ["admin", "subjects"];

export function useAdminSubjects() {
  const query = useQuery({
    queryKey: ADMIN_SUBJECTS_KEY,
    queryFn: getAllSubjects
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
