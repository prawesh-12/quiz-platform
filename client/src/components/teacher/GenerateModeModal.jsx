import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { theme } from "@/theme";

export default function GenerateModeModal({ open, onOpenChange }) {
  const navigate = useNavigate();

  const onChoose = (path) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Quiz</DialogTitle>
          <DialogDescription>Choose how you want to create the new quiz.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
            <CardHeader>
              <CardTitle>Manual Quiz</CardTitle>
              <CardDescription>Create questions manually and save them to the subject bank.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" className="w-full" onClick={() => onChoose("/teacher/quiz/manual")}>
                Open Manual Quiz
              </Button>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
            <CardHeader>
              <CardTitle>Generate Quiz</CardTitle>
              <CardDescription>Auto-pick random questions from a selected subject.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" className="w-full" onClick={() => onChoose("/teacher/quiz/auto")}>
                Open Auto Generate
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
