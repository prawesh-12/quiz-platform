import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { theme } from "@/theme";

const COLUMNS = [
  { label: "S.No", className: "w-[60px] whitespace-nowrap" },
  { label: "Name of Teacher", className: "whitespace-nowrap" },
  { label: "Contact No", className: "whitespace-nowrap" },
  { label: "Assign Subjects", className: "w-[160px] whitespace-nowrap" },
  { label: "Assigned Subjects", className: "w-[170px] whitespace-nowrap" },
  { label: "Login Credentials", className: "w-[170px] whitespace-nowrap" },
  { label: "Actions", className: "w-[100px] whitespace-nowrap" }
];

function NoticeRow({ children }) {
  return (
    <TableRow>
      <TableCell colSpan={COLUMNS.length} style={{ color: theme.text.muted }}>
        {children}
      </TableCell>
    </TableRow>
  );
}

function TeacherRow({ teacher, index, actions }) {
  return (
    <TableRow>
      <TableCell>{index + 1}</TableCell>
      <TableCell className="whitespace-nowrap">
        <div>
          <p className="font-medium" style={{ color: theme.text.primary }}>
            {teacher.name}
          </p>
          <p className="text-[12px]" style={{ color: theme.text.muted }}>
            {teacher.email}
          </p>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">{teacher.contact_no || "-"}</TableCell>
      <TableCell className="whitespace-nowrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={`Assign subjects to ${teacher.name}`}
          onClick={() => actions.onAssign(teacher)}
        >
          Assign
        </Button>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={`View subjects assigned to ${teacher.name}`}
          onClick={() => actions.onViewAssigned(teacher)}
        >
          View
        </Button>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={actions.isCredentialsPending}
          aria-label={`Show login credentials for ${teacher.name}`}
          onClick={() => actions.onShowCredentials(teacher)}
        >
          Show
        </Button>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-destructive hover:bg-destructive/10"
          aria-label={`Remove ${teacher.name} from this school`}
          onClick={() => actions.onRemove(teacher)}
        >
          Remove
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function SchoolTeachersTable({ teachers, isLoading, emptyMessage, actions }) {
  const isEmpty = !isLoading && teachers.length === 0;

  return (
    <div
      className="mt-4 overflow-hidden border"
      style={{ borderRadius: theme.radius.lg, borderColor: theme.border.default }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead key={column.label} className={column.className}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? <NoticeRow>Loading teachers...</NoticeRow> : null}
          {isEmpty ? <NoticeRow>{emptyMessage}</NoticeRow> : null}

          {teachers.map((teacher, index) => (
            <TeacherRow key={teacher.id} teacher={teacher} index={index} actions={actions} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
