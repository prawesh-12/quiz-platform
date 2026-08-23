import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function ShareQuizDialog({ open, onOpenChange, shareUrl, onCopy }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quiz Activated</DialogTitle>
          <DialogDescription>Copy and share this link with students.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input value={shareUrl} readOnly aria-label="Quiz entry link" />
          <Button type="button" onClick={onCopy} disabled={!shareUrl}>
            Copy Link
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
