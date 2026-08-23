import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Spinner from "@/components/shared/Spinner";
import UnitQuestionsList from "@/components/teacher/UnitQuestionsList";
import { useToast } from "@/hooks/useToast";
import { questionService } from "@/services/questionService";
import { unitService } from "@/services/unitService";
import { theme } from "@/theme";

export const UNCATEGORIZED_UNIT_ID = -1;
const UNCATEGORIZED_LIMIT = 100;

function fetchUnitQuestions(unitId, subjectId) {
  if (unitId === UNCATEGORIZED_UNIT_ID) {
    return questionService.listBySubject(subjectId, {
      unit_id: UNCATEGORIZED_UNIT_ID,
      limit: UNCATEGORIZED_LIMIT,
    });
  }

  return unitService.getQuestions(unitId);
}

export default function UnitSection({ unitId, subjectId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const questionsQuery = useQuery({
    queryKey: ["questions", subjectId, "unit", unitId],
    queryFn: () => fetchUnitQuestions(unitId, subjectId),
  });

  const invalidateBank = () => {
    queryClient.invalidateQueries({ queryKey: ["questions", subjectId] });
    queryClient.invalidateQueries({ queryKey: ["units", subjectId] });
  };

  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => questionService.remove(id),
    onSuccess: () => {
      invalidateBank();
      toast({ title: "Question deleted", description: "Question removed from bank." });
    },
  });

  const editQuestionMutation = useMutation({
    mutationFn: ({ id, data }) => questionService.update(id, data),
    onSuccess: () => {
      invalidateBank();
      toast({ title: "Question updated", description: "Changes saved." });
    },
  });

  if (questionsQuery.isLoading) {
    return (
      <div className="p-4">
        <Spinner label="Loading questions..." />
      </div>
    );
  }

  const questions = questionsQuery.data?.questions ?? [];

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center text-sm" style={{ color: theme.text.muted }}>
        No questions found.
      </div>
    );
  }

  return (
    <UnitQuestionsList
      questions={questions}
      onDelete={(id) => deleteQuestionMutation.mutate(id)}
      onEdit={(id, data) => editQuestionMutation.mutate({ id, data })}
    />
  );
}
