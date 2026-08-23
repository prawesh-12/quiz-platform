import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useShellSubject } from "@/components/layout/shellOutletContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTeacherSubjects } from "@/hooks/useTeacherSubjects";
import { useToast } from "@/hooks/useToast";
import { quizService } from "@/services/quizService";
import { unitService } from "@/services/unitService";
import { theme } from "@/theme";

const DEFAULT_DURATION_MINS = 15;
const MIN_QUESTIONS = 1;

function UnitSelectionState({ isLoading, units, children }) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading units...</p>;
  }

  if (units.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No units found for this subject. Add units and questions in the Question Bank first.
      </p>
    );
  }

  return children;
}

export default function AutoGeneratePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("Untitled quiz");
  const [durationMins, setDurationMins] = useState(DEFAULT_DURATION_MINS);

  const [unitCounts, setUnitCounts] = useState({});
  const [pageError, setPageError] = useState("");

  const unitsQuery = useQuery({
    queryKey: ["units", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => unitService.listBySubject(subjectId)
  });

  const { subjects } = useTeacherSubjects();
  const units = unitsQuery.data?.units ?? [];

  useEffect(() => {
    if (!subjects.length || subjectId) {
      return;
    }

    setSubjectId(String(subjects[0].id));
  }, [subjectId, subjects]);

  useEffect(() => {
    setUnitCounts({});
  }, [subjectId]);

  useShellSubject(Number(subjectId) || null);

  const autoGenerateMutation = useMutation({
    mutationFn: (payload) => quizService.autoGenerate(payload),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({
        title: "Quiz Generated",
        description: "Auto-generated quiz is ready for review."
      });
      navigate(`/teacher/quiz/manual/${data.quiz.id}`);
    }
  });

  const handleUnitCountChange = (unitId, value) => {
    const num = value === "" ? 0 : Number(value);
    setUnitCounts((prev) => ({ ...prev, [unitId]: num }));
  };

  const totalSelected = Object.values(unitCounts).reduce((sum, v) => sum + (v || 0), 0);

  const unitErrors = {};
  for (const unit of units) {
    const count = unitCounts[unit.id] || 0;
    if (count > (unit.question_count || 0)) {
      unitErrors[unit.id] = `Only ${unit.question_count || 0} available`;
    }
  }

  const hasUnitErrors = Object.keys(unitErrors).length > 0;

  const generateQuiz = async () => {
    setPageError("");

    if (!subjectId) {
      setPageError("Select a subject");
      return;
    }

    if (totalSelected < MIN_QUESTIONS) {
      setPageError("Select at least 1 question to continue");
      return;
    }

    if (hasUnitErrors) {
      setPageError("Fix the unit selection errors above");
      return;
    }

    const unitSelections = Object.entries(unitCounts)
      .filter(([, count]) => count > 0)
      .map(([unitId, count]) => ({ unit_id: Number(unitId), count }));

    try {
      await autoGenerateMutation.mutateAsync({
        title: title.trim() || "Untitled quiz",
        subject_id: Number(subjectId),
        unit_selections: unitSelections,
        duration_mins: Number(durationMins || DEFAULT_DURATION_MINS),
        status: "draft"
      });
    } catch (error) {
      setPageError(error?.response?.data?.error || "Failed to auto-generate quiz");
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
          <CardHeader>
            <CardTitle>Generate Quiz Page</CardTitle>
            <CardDescription>Select subject, pick questions per unit, and auto-generate.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select the Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectValue placeholder="Select subject" />
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subjectId && (
              <div className="space-y-3">
                <Label>Select Questions per Unit</Label>
                <UnitSelectionState isLoading={unitsQuery.isLoading} units={units}>
                  <Card className="border shadow-none" style={{ borderRadius: theme.radius.lg }}>
                    <div className="divide-y">
                      {units.map((unit) => (
                        <div key={unit.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{unit.name}</p>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {unit.question_count || 0} questions available
                            </Badge>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={unit.question_count || 0}
                              value={unitCounts[unit.id] || ""}
                              aria-label={`Questions from ${unit.name}`}
                              onChange={(event) => handleUnitCountChange(unit.id, event.target.value)}
                              placeholder="0"
                              className="w-20 text-center"
                            />
                            {unitErrors[unit.id] ? (
                              <p className="text-xs text-destructive">{unitErrors[unit.id]}</p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between px-4 py-3">
                      <p className="text-sm font-semibold">Total</p>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: totalSelected === 0 ? theme.text.muted : theme.text.primary }}
                      >
                        {totalSelected} question{totalSelected === 1 ? "" : "s"} selected
                      </p>
                    </div>
                  </Card>
                </UnitSelectionState>
                {totalSelected === 0 && units.length > 0 ? (
                  <p className="text-xs text-muted-foreground">Select at least 1 question to continue.</p>
                ) : null}
              </div>
            )}

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="auto-title">Quiz Title</Label>
                <Input id="auto-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled quiz" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto-duration">Duration (mins)</Label>
                <Input id="auto-duration" type="number" min={1} value={durationMins} onChange={(event) => setDurationMins(Number(event.target.value || DEFAULT_DURATION_MINS))} />
              </div>
            </div>

            {pageError ? <p className="text-sm text-destructive">{pageError}</p> : null}

            <Button
              type="button"
              className="w-full"
              onClick={generateQuiz}
              disabled={autoGenerateMutation.isPending || totalSelected === 0 || hasUnitErrors}
            >
              Generate Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
