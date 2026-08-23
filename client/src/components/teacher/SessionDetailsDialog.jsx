import FlagBadge from "@/components/teacher/FlagBadge";
import Spinner from "@/components/shared/Spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ANSWER_COLUMNS = ["#", "Question", "Selected", "Correct", "Result"];
const VIOLATION_COLUMNS = ["Time", "Type", "Description"];

function formatOption(value) {
  if (!value) {
    return "-";
  }

  return String(value).toUpperCase();
}

function formatAnswerResult(answer) {
  if (!answer.selected_option) {
    return "Unanswered";
  }

  if (answer.is_correct) {
    return "Correct";
  }

  return "Incorrect";
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

function HeadRow({ columns }) {
  return (
    <TableHeader>
      <TableRow>
        {columns.map((column) => (
          <TableHead key={column}>{column}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function SessionSummary({ session, summary }) {
  return (
    <div className="space-y-1">
      <p className="text-sm">
        <span className="text-muted-foreground">Student:</span> {session?.name || "-"}
      </p>
      <p className="text-sm">
        <span className="text-muted-foreground">Score:</span> {session?.score ?? "-"} /{" "}
        {session?.total_points ?? "-"}
      </p>
      <p className="text-sm">
        <span className="text-muted-foreground">Total Violations:</span>{" "}
        {summary?.total_violations ?? 0}
      </p>
    </div>
  );
}

export default function SessionDetailsDialog({ open, onOpenChange, query, showSummary = false }) {
  const data = query.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
          <DialogDescription>Q&A breakdown and violation timeline for this student session.</DialogDescription>
        </DialogHeader>

        {query.isLoading ? <Spinner className="py-2" label="Loading session details..." /> : null}
        {query.isError ? (
          <p className="text-sm text-destructive">
            {query.error?.response?.data?.error || "Failed to load session details"}
          </p>
        ) : null}

        {data ? (
          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-6">
              {showSummary ? <SessionSummary session={data.session} summary={data.summary} /> : null}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Q&A Breakdown</h3>
                <Table>
                  <HeadRow columns={ANSWER_COLUMNS} />
                  <TableBody>
                    {(data.answers || []).map((answer) => (
                      <TableRow key={answer.question_id}>
                        <TableCell>{answer.order_no}</TableCell>
                        <TableCell>{answer.question_text}</TableCell>
                        <TableCell>{formatOption(answer.selected_option)}</TableCell>
                        <TableCell>{formatOption(answer.correct_option)}</TableCell>
                        <TableCell>{formatAnswerResult(answer)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Violation Timeline</h3>
                <Table>
                  <HeadRow columns={VIOLATION_COLUMNS} />
                  <TableBody>
                    {(data.violations || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDateTime(item.occurred_at)}</TableCell>
                        <TableCell>
                          <FlagBadge type={item.type} count={1} />
                        </TableCell>
                        <TableCell>{item.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {(data.violations || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={VIOLATION_COLUMNS.length} className="text-muted-foreground">
                          No violations recorded.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
