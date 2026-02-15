import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { quizService } from "@/services/quizService";
import { subjectService } from "@/services/subjectService";

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

  const [countMode, setCountMode] = useState("10");
  const [customCount, setCustomCount] = useState("");
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [pageError, setPageError] = useState("");

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const subjects = subjectsQuery.data?.subjects ?? [];

  useEffect(() => {
    if (!subjects.length || subjectId) {
      return;
    }

    setSubjectId(String(subjects[0].id));
  }, [subjectId, subjects]);

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

  const questionCount = countMode === "custom" ? Number(customCount || 0) : Number(countMode);

  const generateQuiz = async () => {
    setPageError("");

    if (!subjectId) {
      setPageError("Select a subject");
      return;
    }

    if (!questionCount || questionCount <= 0) {
      setPageError("Question count must be greater than zero");
      return;
    }
    if (hasInvalidScheduleRange(scheduledStart, scheduledEnd)) {
      setPageError("Scheduled end must be later than scheduled start");
      return;
    }

    try {
      await autoGenerateMutation.mutateAsync({
        title: title.trim() || "Untitled quiz",
        subject_id: Number(subjectId),
        question_count: questionCount,
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
      onSelectSubject={(id) => navigate(`/teacher?subjectId=${id}`)}
      onOpenCreateSubject={() => setSubjectDialogOpen(true)}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
    >
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Generate Quiz Page</CardTitle>
            <CardDescription>Select subject and number of questions to auto-generate.</CardDescription>
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

            <div className="space-y-2">
              <Label>Select the Number of Questions</Label>
              <Select value={countMode} onValueChange={setCountMode}>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {countMode === "custom" ? (
                <Input
                  type="number"
                  min={1}
                  value={customCount}
                  onChange={(event) => setCustomCount(event.target.value)}
                  placeholder="Enter custom count"
                />
              ) : null}
            </div>

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
                <Label>Scheduled End</Label>
                <DateTimePicker value={scheduledEnd} onChange={setScheduledEnd} placeholder="Select end" />
              </div>
              <div className="space-y-2">
                <Label>Access Code (Optional)</Label>
                <Input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="e.g. 2026CN" />
              </div>
            </div>

            {pageError ? <p className="text-sm text-destructive">{pageError}</p> : null}

            <Button type="button" className="w-full" onClick={generateQuiz} disabled={autoGenerateMutation.isPending}>
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
