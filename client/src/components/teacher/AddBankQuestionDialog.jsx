import QuestionBuilder from "@/components/teacher/QuestionBuilder";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function AddBankQuestionDialog({
  open,
  onOpenChange,
  units,
  selectedUnitId,
  onSelectedUnitChange,
  question,
  onQuestionChange,
  onSave,
  isPending,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Question to Bank</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pl-2 pr-4">
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Assign to Unit</Label>
              <Select value={selectedUnitId} onValueChange={onSelectedUnitChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Uncategorized" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <QuestionBuilder question={question} index={0} onChange={onQuestionChange} canRemove={false} />
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
