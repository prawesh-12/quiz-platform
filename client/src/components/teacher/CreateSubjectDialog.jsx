import { useState } from "react";

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
import { Label } from "@/components/ui/label";

export default function CreateSubjectDialog({
  open,
  onOpenChange,
  description,
  isPending,
  isError,
  errorMessage,
  onSubmit,
}) {
  const [subjectName, setSubjectName] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(subjectName.trim());
    setSubjectName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Subject</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-subject-name">Subject Name</Label>
            <Input
              id="new-subject-name"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="e.g. Operating System"
              required
            />
          </div>

          {isError ? (
            <p className="text-sm text-destructive">{errorMessage || "Failed to create subject"}</p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
