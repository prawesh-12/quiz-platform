import Copy from "lucide-react/dist/esm/icons/copy";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/utils/formatTime";
import { theme } from "@/theme";

function buildMetaRows(quiz, quizDate) {
  return [
    ["Subject", quiz?.subject_name || "-"],
    ["Batch", quiz?.batch || "-"],
    ["Division", quiz?.division || "-"],
    ["Group", quiz?.group_nos || "-"],
    ["Date", quizDate],
    ["Duration", `${quiz?.duration_mins || 0} mins`],
  ];
}

function AccessCodePill({ accessCode, onCopyAccessCode }) {
  return (
    <div
      className="flex items-center gap-2 border px-3 py-1.5"
      style={{
        borderRadius: theme.radius.full,
        borderColor: theme.border.default,
        backgroundColor: theme.bg.input,
      }}
    >
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: theme.text.muted }}>
        Access Code
      </span>
      <span className="font-mono text-sm font-semibold" style={{ color: theme.text.primary }}>
        {accessCode}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full"
        onClick={onCopyAccessCode}
        aria-label="Copy access code"
        title="Copy access code"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function TimerPanel({ elapsedSeconds, isEnded, onStop, onExport }) {
  return (
    <div
      className="flex flex-col gap-3 border p-4"
      style={{
        borderRadius: theme.radius.lg,
        borderColor: theme.border.default,
        backgroundColor: theme.bg.content,
      }}
    >
      <div className="space-y-1">
        <p
          className="text-xs font-medium uppercase tracking-[0.18em]"
          style={{ color: theme.text.muted }}
        >
          Running Time
        </p>
        <p className="text-3xl font-semibold tabular-nums" style={{ color: theme.text.primary }}>
          {formatTime(elapsedSeconds)}
        </p>
      </div>
      {isEnded ? (
        <Button type="button" className="w-full" onClick={onExport}>
          Export Results
        </Button>
      ) : (
        <Button type="button" variant="destructive" className="w-full" onClick={onStop}>
          Stop Responses
        </Button>
      )}
    </div>
  );
}

export default function LiveQuizHeader({
  quiz,
  quizDate,
  shareUrl,
  elapsedSeconds,
  isEnded,
  onCopyLink,
  onCopyAccessCode,
  onStop,
  onExport,
}) {
  const hasAccessCode = quiz?.access_code != null && quiz.access_code !== "";

  return (
    <Card style={{ borderRadius: theme.radius.xl, boxShadow: theme.shadow.card }}>
      <CardHeader className="gap-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <CardTitle className="break-words text-xl sm:text-2xl" style={{ color: theme.text.primary }}>
                {quiz?.title || "Live Quiz View"}
              </CardTitle>
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3" style={{ color: theme.text.muted }}>
                {buildMetaRows(quiz, quizDate).map(([label, value]) => (
                  <p key={label} className="truncate" title={String(value)}>
                    {label}: {value}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasAccessCode ? (
                <AccessCodePill accessCode={quiz.access_code} onCopyAccessCode={onCopyAccessCode} />
              ) : null}
              {shareUrl ? (
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onCopyLink}>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copy quiz link
                </Button>
              ) : null}
            </div>
          </div>

          <TimerPanel
            elapsedSeconds={elapsedSeconds}
            isEnded={isEnded}
            onStop={onStop}
            onExport={onExport}
          />
        </div>
      </CardHeader>
    </Card>
  );
}
