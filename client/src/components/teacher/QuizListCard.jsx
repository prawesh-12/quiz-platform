import { Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString();
}

export default function QuizListCard({ quiz, onViewResponses, onEdit, onDuplicate, onDelete }) {
  const canEdit = quiz.status === "draft" || quiz.status === "active";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{quiz.title}</CardTitle>
          <Badge variant={quiz.status === "active" ? "default" : "secondary"}>{quiz.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Subject:</span> {quiz.subject_name || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Date:</span> {formatDate(quiz.quiz_date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onViewResponses?.(quiz)}>
            View Responses
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {canEdit ? (
                <DropdownMenuItem className="flex items-center" onClick={() => onEdit?.(quiz)}>
                  <Pencil className="mr-2 h-4 w-4 shrink-0" />
                  <span>Edit quiz</span>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem className="flex items-center" onClick={() => onDuplicate?.(quiz)}>
                <Copy className="mr-2 h-4 w-4 shrink-0" />
                <span>Duplicate</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => onDelete?.(quiz)}
              >
                <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                <span>Delete quiz</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
