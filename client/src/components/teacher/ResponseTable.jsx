import FlagBadge from "@/components/teacher/FlagBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const VIOLATION_TYPES = [
  "tab_switch",
  "window_blur",
  "screenshot_attempt",
  "copy_shortcut",
  "copy_event",
  "context_menu"
];

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

function formatScore(row) {
  if (row.score == null || row.total_points == null) {
    return "-";
  }

  return `${row.score} / ${row.total_points}`;
}

export default function ResponseTable({ rows, onOpenDetails }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-nowrap">Student</TableHead>
          <TableHead className="whitespace-nowrap">Roll No</TableHead>
          <TableHead className="whitespace-nowrap">Email</TableHead>
          <TableHead className="whitespace-nowrap">Division</TableHead>
          <TableHead className="whitespace-nowrap">Group</TableHead>
          <TableHead className="whitespace-nowrap">Score</TableHead>
          <TableHead className="whitespace-nowrap">Submitted At</TableHead>
          <TableHead className="whitespace-nowrap">Flags</TableHead>
          <TableHead className="w-28 whitespace-nowrap">Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-muted-foreground">
              No student responses yet.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.session_id}>
              <TableCell className="whitespace-nowrap">{row.name}</TableCell>
              <TableCell className="whitespace-nowrap">{row.roll_no}</TableCell>
              <TableCell className="whitespace-nowrap">{row.email}</TableCell>
              <TableCell className="whitespace-nowrap">{row.division}</TableCell>
              <TableCell className="whitespace-nowrap">{row.group_no}</TableCell>
              <TableCell className="whitespace-nowrap">{formatScore(row)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDateTime(row.submitted_at)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {VIOLATION_TYPES.map((type) => (
                    <FlagBadge key={type} type={type} count={row.violations?.[type] || 0} />
                  ))}
                  {!row.total_violations ? <span className="text-xs text-muted-foreground">None</span> : null}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenDetails?.(row.session_id)}
                >
                  Click Here
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
