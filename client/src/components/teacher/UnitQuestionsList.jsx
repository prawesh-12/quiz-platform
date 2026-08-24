import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { useState } from "react";

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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const OPTION_KEYS = ["a", "b", "c", "d"];

function OptionLines({ question }) {
  return (
    <div className="space-y-0.5">
      {OPTION_KEYS.map((key) => {
        const value = question[`option_${key}`];
        return value ? (
          <p key={key}>
            <span className="uppercase">{key}</span>: {value}
          </p>
        ) : null;
      })}
    </div>
  );
}

const emptyQuestion = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "a",
  points: 1
};

export default function UnitQuestionsList({ questions, onDelete, onEdit }) {
  const [deleteItem, setDeleteItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState(emptyQuestion);

  if (!questions || questions.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No questions in this unit.</div>;
  }

  const openEdit = (question) => {
    setEditForm({
      question_text: question.question_text || "",
      option_a: question.option_a || "",
      option_b: question.option_b || "",
      option_c: question.option_c || "",
      option_d: question.option_d || "",
      correct_option: question.correct_option || "a",
      points: question.points ?? 1
    });
    setEditItem(question);
  };

  const handleSaveEdit = () => {
    if (editItem && onEdit) {
      onEdit(editItem.id, editForm);
      setEditItem(null);
    }
  };

  return (
    <>
      {/* On a phone the columns squeeze until every row is six lines tall, so hold their
          width and let the wrapper scroll sideways instead. */}
      <Table className="max-sm:min-w-[860px]">
        <TableHeader>
          <TableRow>
            <TableHead className="max-sm:w-[320px] max-sm:min-w-[320px]">Question</TableHead>
            <TableHead className="max-sm:w-[260px] max-sm:min-w-[260px]">Options</TableHead>
            <TableHead className="max-sm:w-[74px]">Correct</TableHead>
            <TableHead className="max-sm:w-[64px]">Points</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => (
            <TableRow key={question.id}>
              <TableCell className="align-top max-sm:w-[320px] max-sm:min-w-[320px]">
                {question.question_text}
              </TableCell>
              <TableCell className="align-top text-xs text-muted-foreground max-sm:w-[260px] max-sm:min-w-[260px]">
                <OptionLines question={question} />
              </TableCell>
              <TableCell className="align-top uppercase max-sm:whitespace-nowrap">{question.correct_option}</TableCell>
              <TableCell className="align-top max-sm:whitespace-nowrap">{question.points}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="h-8 w-8 p-0"
                    aria-label="Edit question"
                    onClick={() => openEdit(question)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="h-8 w-8 p-0 text-destructive"
                    aria-label="Delete question"
                    onClick={() => setDeleteItem(question)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pl-2 pr-4">
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="edit-question-text">Question Text</Label>
                <Input
                  id="edit-question-text"
                  value={editForm.question_text}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, question_text: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Label className="w-20 shrink-0">Option A</Label>
                  <Input
                    value={editForm.option_a}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, option_a: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-20 shrink-0">Option B</Label>
                  <Input
                    value={editForm.option_b}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, option_b: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-20 shrink-0">Option C</Label>
                  <Input
                    value={editForm.option_c}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, option_c: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-20 shrink-0">Option D</Label>
                  <Input
                    value={editForm.option_d}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, option_d: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Correct Option</Label>
                  <Select
                    value={editForm.correct_option}
                    onValueChange={(val) => setEditForm((prev) => ({ ...prev, correct_option: val }))}
                  >
                    <SelectValue />
                    <SelectContent>
                      <SelectItem value="a">A</SelectItem>
                      <SelectItem value="b">B</SelectItem>
                      <SelectItem value="c">C</SelectItem>
                      <SelectItem value="d">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editForm.points}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, points: Number(e.target.value || 1) }))}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question from unit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the question from the question bank. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteItem) {
                  onDelete(deleteItem.id);
                  setDeleteItem(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
