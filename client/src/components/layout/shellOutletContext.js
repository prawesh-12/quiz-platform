import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

// Highlights the page's subject in the persistent sidebar without threading props through it.
export function useShellSubject(subjectId) {
  const { setSelectedSubjectId } = useOutletContext();

  useEffect(() => {
    setSelectedSubjectId(subjectId ?? null);
    return () => setSelectedSubjectId(null);
  }, [setSelectedSubjectId, subjectId]);
}

// Lets an admin page react to a teacher created from the sidebar modal it no longer owns.
export function useShellTeacherAdded(handler) {
  const { teacherAddedRef } = useOutletContext();

  // No dep array: the ref must hold the latest closure, and a ref write costs nothing.
  useEffect(() => {
    teacherAddedRef.current = handler;
    return () => {
      teacherAddedRef.current = null;
    };
  });
}
