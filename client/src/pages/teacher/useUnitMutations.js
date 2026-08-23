import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/useToast";
import { unitService } from "@/services/unitService";

export function useUnitMutations(subjectId, { onCreated, onDeleted, onRenamed }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateUnits = () => {
    queryClient.invalidateQueries({ queryKey: ["units", subjectId] });
  };

  const createUnit = useMutation({
    mutationFn: (name) => unitService.create(subjectId, { name }),
    onSuccess: () => {
      invalidateUnits();
      onCreated?.();
      toast({ title: "Unit created", description: "New unit has been added." });
    },
  });

  const deleteUnit = useMutation({
    mutationFn: (id) => unitService.delete(id),
    onSuccess: () => {
      invalidateUnits();
      queryClient.invalidateQueries({ queryKey: ["questions", subjectId] });
      onDeleted?.();
      toast({ title: "Unit deleted", description: "Unit removed, questions are now uncategorized." });
    },
  });

  const renameUnit = useMutation({
    mutationFn: ({ id, name }) => unitService.update(id, { name }),
    onSuccess: () => {
      invalidateUnits();
      onRenamed?.();
      toast({ title: "Unit renamed", description: "Unit name updated successfully." });
    },
  });

  return { createUnit, deleteUnit, renameUnit };
}
