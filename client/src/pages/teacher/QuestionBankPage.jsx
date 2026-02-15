import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import TeacherShell from "@/components/layout/TeacherShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import Pagination from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { questionService } from "@/services/questionService";
import { subjectService } from "@/services/subjectService";

const emptyForm = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "a",
  points: 1,
  has_equation: false
};

function truncate(value, maxLength = 90) {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { subjectId } = useParams();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const subjectNumericId = useMemo(() => Number(subjectId), [subjectId]);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.list()
  });

  const questionsQuery = useQuery({
    queryKey: ["questions", subjectNumericId, page, search, "bank"],
    enabled: Number.isInteger(subjectNumericId) && subjectNumericId > 0,
    queryFn: () => questionService.listBySubject(subjectNumericId, { page, limit: 10, search: search || undefined })
  });

  useEffect(() => {
    setPage(1);
  }, [search, subjectNumericId]);

  const createMutation = useMutation({
    mutationFn: (payload) => questionService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", subjectNumericId] });
      setAddOpen(false);
      setForm(emptyForm);
      toast({ title: "Question added", description: "Question saved to the question bank." });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => questionService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", subjectNumericId] });
      setEditOpen(false);
      setEditingQuestionId(null);
      setForm(emptyForm);
      toast({ title: "Question updated", description: "Question changes saved." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => questionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", subjectNumericId] });
      setDeleteItem(null);
      toast({ title: "Question deleted", description: "Question removed from the bank." });
    }
  });

  const subjects = subjectsQuery.data?.subjects ?? [];
  const selectedSubject = subjects.find((item) => item.id === subjectNumericId);
  const rows = questionsQuery.data?.questions ?? [];

  const openEdit = (question) => {
    setEditingQuestionId(question.id);
    setForm({
      question_text: question.question_text || "",
      option_a: question.option_a || "",
      option_b: question.option_b || "",
      option_c: question.option_c || "",
      option_d: question.option_d || "",
      correct_option: question.correct_option || "a",
      points: question.points || 1,
      has_equation: Boolean(question.has_equation)
    });
    setEditOpen(true);
  };

  const submitCreate = () => {
    createMutation.mutate({
      subject_id: subjectNumericId,
      ...form,
      points: Number(form.points || 1),
      option_c: form.option_c || null,
      option_d: form.option_d || null,
      allow_multiple_answers: false,
      is_required: true
    });
  };

  const submitUpdate = () => {
    if (!editingQuestionId) {
      return;
    }

    updateMutation.mutate({
      id: editingQuestionId,
      payload: {
        ...form,
        points: Number(form.points || 1),
        option_c: form.option_c || null,
        option_d: form.option_d || null
      }
    });
  };

  return (
    <TeacherShell
      subjects={subjects}
      selectedSubjectId={subjectNumericId}
      onSelectSubject={(id) => navigate(`/teacher/questions/${id}`)}
      onOpenCreateSubject={() => navigate("/teacher")}
      onOpenProfile={() => navigate("/teacher/profile")}
      user={user}
      onLogout={logout}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Question Bank</CardTitle>
              <CardDescription>{selectedSubject?.name || "Select a subject"} question management</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/teacher")}>
                Back
              </Button>
              <Button type="button" onClick={() => setAddOpen(true)} disabled={!selectedSubject}>
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by question text..."
              className="max-w-sm"
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No.</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Correct</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Has Equation</TableHead>
                  <TableHead className="w-36">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      Loading questions...
                    </TableCell>
                  </TableRow>
                ) : null}
                {questionsQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-destructive">
                      {questionsQuery.error?.response?.data?.error || "Failed to load questions"}
                    </TableCell>
                  </TableRow>
                ) : null}
                {!questionsQuery.isLoading && !questionsQuery.isError && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      No questions found.
                    </TableCell>
                  </TableRow>
                ) : null}
                {rows.map((question, index) => (
                  <TableRow key={question.id}>
                    <TableCell>{(questionsQuery.data?.page - 1) * 10 + index + 1}</TableCell>
                    <TableCell>{truncate(question.question_text)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      A: {truncate(question.option_a, 20)} | B: {truncate(question.option_b, 20)} | C:{" "}
                      {truncate(question.option_c || "-", 20)} | D: {truncate(question.option_d || "-", 20)}
                    </TableCell>
                    <TableCell className="uppercase">{question.correct_option}</TableCell>
                    <TableCell>{question.points}</TableCell>
                    <TableCell>{question.has_equation ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => openEdit(question)}>
                          Edit
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => setDeleteItem(question)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              page={questionsQuery.data?.page || 1}
              totalPages={questionsQuery.data?.totalPages || 1}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
            <DialogDescription>Save a new question in the subject bank.</DialogDescription>
          </DialogHeader>
          <QuestionForm form={form} setForm={setForm} onSubmit={submitCreate} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditingQuestionId(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update question details.</DialogDescription>
          </DialogHeader>
          <QuestionForm form={form} setForm={setForm} onSubmit={submitUpdate} loading={updateMutation.isPending} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteItem) {
                  deleteMutation.mutate(deleteItem.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TeacherShell>
  );
}

function QuestionForm({ form, setForm, onSubmit, loading }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Question</Label>
        <Textarea
          value={form.question_text}
          onChange={(event) => setForm((prev) => ({ ...prev, question_text: event.target.value }))}
          placeholder="Type question text"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Option A</Label>
          <Input value={form.option_a} onChange={(event) => setForm((prev) => ({ ...prev, option_a: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Option B</Label>
          <Input value={form.option_b} onChange={(event) => setForm((prev) => ({ ...prev, option_b: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Option C</Label>
          <Input value={form.option_c} onChange={(event) => setForm((prev) => ({ ...prev, option_c: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Option D</Label>
          <Input value={form.option_d} onChange={(event) => setForm((prev) => ({ ...prev, option_d: event.target.value }))} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Correct Option</Label>
          <Select value={form.correct_option} onValueChange={(value) => setForm((prev) => ({ ...prev, correct_option: value }))}>
            <SelectContent>
              <SelectItem value="a">A</SelectItem>
              <SelectItem value="b">B</SelectItem>
              <SelectItem value="c">C</SelectItem>
              <SelectItem value="d">D</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Points</Label>
          <Input
            type="number"
            min={1}
            value={form.points}
            onChange={(event) => setForm((prev) => ({ ...prev, points: Number(event.target.value || 1) }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Has Equation</Label>
          <div className="flex items-center gap-2 pt-1">
            <Switch checked={Boolean(form.has_equation)} onCheckedChange={(checked) => setForm((prev) => ({ ...prev, has_equation: checked }))} />
            <p className="text-xs text-muted-foreground">{form.has_equation ? "Enabled" : "Disabled"}</p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" onClick={onSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}
