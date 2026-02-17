import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DateTimePicker from "@/components/ui/date-time-picker";
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
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";
import { unitService } from "@/services/unitService";

function hasInvalidScheduleRange(start, end) {
  if (!start || !end) {
    return false;
  }

  const startValue = new Date(start).getTime();
  const endValue = new Date(end).getTime();
  if (Number.isNaN(startValue) || Number.isNaN(endValue)) {
    return false;
  }

  return endValue < startValue;
}

function formatForDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function calculateScheduledEnd(start, durationMins) {
  if (!start) {
    return "";
  }

  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return "";
  }

  const minutes = Math.max(0, Number(durationMins || 0));
  startDate.setMinutes(startDate.getMinutes() + minutes);
  return formatForDateTimeLocal(startDate);
}

export default function AutoGeneratePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("Untitled quiz");
  const [durationMins, setDurationMins] = useState(15);
  const [batch, setBatch] = useState("");
  const [division, setDivision] = useState("");
  const [groupNos, setGroupNos] = useState("");
  const [quizDate, setQuizDate] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const [unitCounts, setUnitCounts] = useState({});
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [pageError, setPageError] = useState("");

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const unitsQuery = useQuery({
    queryKey: ["units", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => unitService.listBySubject(subjectId)
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const units = unitsQuery.data?.units ?? [];

  useEffect(() => {
    if (!subjects.length || subjectId) {
      return;
    }

    setSubjectId(String(subjects[0].id));
  }, [subjectId, subjects]);

  useEffect(() => {
    setScheduledEnd(calculateScheduledEnd(scheduledStart, durationMins));
  }, [scheduledStart, durationMins]);

  // Reset unit counts when subject changes
  useEffect(() => {
    setUnitCounts({});
  }, [subjectId]);

  const createSubjectMutation = useMutation({
    mutationFn: (payload) => subjectService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setSubjectName("");
      setSubjectDialogOpen(false);
      if (data?.subject?.id) {
        setSubjectId(String(data.subject.id));
      }
    }
  });

  const autoGenerateMutation = useMutation({
    mutationFn: (payload) => quizService.autoGenerate(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Quiz generated", description: "Auto-generated quiz is ready for review." });
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

    if (totalSelected <= 0) {
      setPageError("Select at least 1 question to continue");
      return;
    }

    if (hasUnitErrors) {
      setPageError("Fix the unit selection errors above");
      return;
    }

    if (hasInvalidScheduleRange(scheduledStart, scheduledEnd)) {
      setPageError("Scheduled end must be later than scheduled start");
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
        duration_mins: Number(durationMins || 15),
        batch: batch || null,
        division: division || null,
        group_nos: groupNos || null,
        quiz_date: quizDate || null,
        scheduled_start: scheduledStart || null,
        scheduled_end: scheduledEnd || null,
        access_code: accessCode || null,
        status: "draft"
      });
    } catch (error) {
      setPageError(error?.response?.data?.error || "Failed to auto-generate quiz");
    }
  };

  return (
    <TeacherShell
      subjects={subjects}
      selectedSubjectId={Number(subjectId) || null}
      onSelectSubject={(id) => navigate(`/teacher/questions/${id}`)}
      onOpenCreateSubject={() => setSubjectDialogOpen(true)}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
    >
      <div className="mx-auto max-w-2xl">
        <Card>
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

            {/* Unit-wise question selection */}
            {subjectId && (
              <div className="space-y-3">
                <Label>Select Questions per Unit</Label>
                {unitsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading units...</p>
                ) : units.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No units found for this subject. Add units and questions in the Question Bank first.
                  </p>
                ) : (
                  <Card className="border shadow-none">
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
                              onChange={(e) => handleUnitCountChange(unit.id, e.target.value)}
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
                      <p className={`text-sm font-semibold ${totalSelected === 0 ? "text-muted-foreground" : ""}`}>
                        {totalSelected} question{totalSelected !== 1 ? "s" : ""} selected
                      </p>
                    </div>
                  </Card>
                )}
                {totalSelected === 0 && units.length > 0 ? (
                  <p className="text-xs text-muted-foreground">Select at least 1 question to continue.</p>
                ) : null}
              </div>
            )}

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Quiz Title</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled quiz" />
              </div>
              <div className="space-y-2">
                <Label>Duration (mins)</Label>
                <Input type="number" min={1} value={durationMins} onChange={(event) => setDurationMins(Number(event.target.value || 15))} />
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Input value={batch} onChange={(event) => setBatch(event.target.value)} placeholder="2023-2027" />
              </div>
              <div className="space-y-2">
                <Label>Division</Label>
                <Input value={division} onChange={(event) => setDivision(event.target.value)} placeholder="7" />
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Input value={groupNos} onChange={(event) => setGroupNos(event.target.value)} placeholder="G13/G14" />
              </div>
              <div className="space-y-2">
                <Label>Quiz Date</Label>
                <Input type="date" value={quizDate} onChange={(event) => setQuizDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Scheduled Start</Label>
                <DateTimePicker value={scheduledStart} onChange={setScheduledStart} placeholder="Select start" />
              </div>
              <div className="space-y-2">
                <Label>Scheduled End (Auto)</Label>
                <Input type="datetime-local" value={scheduledEnd} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label>Access Code</Label>
                <Input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="e.g. 2026CN" />
              </div>
            </div>

            {pageError ? <p className="text-sm text-destructive">{pageError}</p> : null}

            <Button
              type="button"
              className="w-full"
              onClick={generateQuiz}
              disabled={autoGenerateMutation.isPending || totalSelected === 0 || hasUnitErrors}
            >
              {autoGenerateMutation.isPending ? "Generating..." : "Generate Quiz"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
            <DialogDescription>Create a new subject to use in auto-generation.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createSubjectMutation.mutate({ name: subjectName });
            }}
          >
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} required />
            </div>

            {createSubjectMutation.isError ? (
              <p className="text-sm text-destructive">{createSubjectMutation.error?.response?.data?.error || "Failed"}</p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={createSubjectMutation.isPending}>
                {createSubjectMutation.isPending ? "Creating..." : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TeacherShell>
  );
}
