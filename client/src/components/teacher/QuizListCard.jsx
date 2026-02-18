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
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700"
    };
  }

  if (status === "scheduled") {
    return {
      label: "SCHEDULED",
      badgeClass: "border-blue-200 bg-blue-50 text-blue-700"
    };
  }

  if (status === "ended") {
    return {
      label: "ENDED",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700"
    };
  }

  return {
    label: String(status || "draft").toUpperCase(),
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700"
  };
}

export default function QuizListCard({ quiz, onViewResponses, onEdit, onDuplicate, onDelete }) {
  const canEdit = quiz.status === "draft" || quiz.status === "active";
  const statusConfig = getStatusConfig(quiz.status);

  return (
    <Card className="group rounded-2xl border border-[#e3e8f5] bg-white shadow-[0_10px_24px_rgba(15,25,56,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cfdaef] hover:shadow-[0_18px_34px_rgba(15,25,56,0.1)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Quiz</p>
            <CardTitle className="break-words text-lg font-semibold text-[#18203d]">
              {quiz.title}
            </CardTitle>
          </div>
          <Badge
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
              statusConfig.badgeClass
            )}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <BookOpenText className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-700">{quiz.subject_name || "Unassigned subject"}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span>{formatDate(quiz.quiz_date)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 flex-1 rounded-xl border-[#d8e0f3] bg-[#f9fbff] font-medium text-[#243162] hover:bg-white"
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
                className="h-9 w-9 rounded-xl border-[#d8e0f3] bg-white hover:bg-[#f5f8ff]"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl border-[#dde4f5]">
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
