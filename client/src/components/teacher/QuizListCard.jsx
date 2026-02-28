import { BookOpenText, CalendarDays, Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { theme } from "@/theme";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getStatusConfig(status) {
  if (status === "active") {
    return {
      label: "ONGOING",
      tone: theme.badge.green,
    };
  }

  if (status === "scheduled") {
    return {
      label: "SCHEDULED",
      tone: theme.badge.blue,
    };
  }

  if (status === "ended") {
    return {
      label: "ENDED",
      tone: theme.badge.red,
    };
  }

  return {
    label: String(status || "draft").toUpperCase(),
    tone: theme.badge.gray,
  };
}

export default function QuizListCard({ quiz, onViewResponses, onEdit, onDuplicate, onDelete }) {
  const canEdit = quiz.status === "draft" || quiz.status === "active";
  const statusConfig = getStatusConfig(quiz.status);

  return (
    <Card
      className="group rounded-[12px] transition-colors hover:bg-[var(--ds-bg-card-hover)]"
      style={{ borderColor: theme.border.default, backgroundColor: theme.bg.card }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] uppercase" style={{ color: theme.text.subtle, fontWeight: theme.font.weight.semibold }}>
              Quiz
            </p>
            <CardTitle className="break-words text-[15px]" style={{ color: theme.text.primary }}>
              {quiz.title}
            </CardTitle>
          </div>
          <Badge
            className={cn(
              "rounded-[var(--ds-radius-full)] border px-3 py-1 text-[11px] uppercase",
              "border-transparent"
            )}
            style={{
              backgroundColor: statusConfig.tone.bg,
              color: statusConfig.tone.color,
              fontWeight: theme.font.weight.semibold,
            }}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2 text-[13px]" style={{ color: theme.text.secondary }}>
          <div className="flex items-center gap-2">
            <BookOpenText className="h-4 w-4" style={{ color: theme.text.subtle }} />
            <span style={{ color: theme.text.primary, fontWeight: theme.font.weight.medium }}>
              {quiz.subject_name || "Unassigned subject"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" style={{ color: theme.text.subtle }} />
            <span>{formatDate(quiz.quiz_date)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-[38px] flex-1 rounded-[var(--ds-radius-md)]"
            onClick={() => onViewResponses?.(quiz)}
          >
            View Responses
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-[38px] w-[38px] rounded-[var(--ds-radius-md)]"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-[var(--ds-radius-md)]">
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
