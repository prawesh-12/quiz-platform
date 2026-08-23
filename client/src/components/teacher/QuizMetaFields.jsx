import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";

import DateTimePicker from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { theme } from "@/theme";

const IMPORT_INPUT_ID = "excel-import-quiz";

function SubjectOptions({ subjects }) {
  return (
    <SelectContent>
      {subjects.map((subject) => (
        <SelectItem key={subject.id} value={String(subject.id)}>
          {subject.name}
        </SelectItem>
      ))}
    </SelectContent>
  );
}

function TextField({ id, label, value, placeholder, onChange, type = "text", min }) {
  return (
    <div className="w-full space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ImportRow({ subjects, importSubjectId, onImportSubjectChange, onImportFile }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Label className="text-xs">Import Questions from Excel</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="w-full sm:w-40">
          <Select value={importSubjectId} onValueChange={onImportSubjectChange}>
            <SelectValue placeholder="Import subject" />
            <SubjectOptions subjects={subjects} />
          </Select>
        </div>
        <Label htmlFor={IMPORT_INPUT_ID} className="w-full cursor-pointer sm:w-auto">
          <span
            className="inline-flex w-full items-center justify-center gap-2 border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--ds-accent-tint)] sm:w-auto"
            style={{
              borderRadius: theme.radius.md,
              borderColor: theme.border.input,
              backgroundColor: theme.bg.card,
              color: theme.text.primary,
            }}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import Excel
          </span>
        </Label>
        <Input id={IMPORT_INPUT_ID} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportFile} />
      </div>
    </div>
  );
}

export default function QuizMetaFields({ subjects, values, handlers, isExistingQuiz, importStatus }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <div className="w-full space-y-2 md:col-span-3">
          <TextField
            id="quiz-title"
            label="Quiz Title"
            value={values.title}
            placeholder="Untitled quiz"
            onChange={handlers.onTitleChange}
          />
        </div>
        <div className="w-full space-y-2 md:col-span-2">
          <Label>Subject</Label>
          <Select value={values.subjectId} onValueChange={handlers.onSubjectChange}>
            <SelectValue placeholder="Select subject" />
            <SubjectOptions subjects={subjects} />
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <TextField
          id="quiz-duration"
          label="Duration (mins)"
          type="number"
          min={1}
          value={values.durationMins}
          onChange={handlers.onDurationChange}
        />
        <TextField
          id="quiz-batch"
          label="Batch"
          value={values.batch}
          placeholder="2023-2027"
          onChange={handlers.onBatchChange}
        />
        <TextField
          id="quiz-division"
          label="Division"
          value={values.division}
          placeholder="7"
          onChange={handlers.onDivisionChange}
        />
        <TextField
          id="quiz-group"
          label="Group"
          value={values.groupNos}
          placeholder="G13/G14"
          onChange={handlers.onGroupChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="w-full space-y-2">
          <Label>Scheduled Start</Label>
          <DateTimePicker
            value={values.scheduledStart}
            onChange={handlers.onScheduledStartChange}
            placeholder="Select start"
          />
        </div>
        <div className="w-full space-y-2">
          <Label>Scheduled End</Label>
          <DateTimePicker
            value={values.scheduledEnd}
            onChange={handlers.onScheduledEndChange}
            placeholder="Select end"
          />
        </div>
        <TextField
          id="quiz-access-code"
          label="Access Code"
          value={values.accessCode}
          placeholder="e.g. 2026CN"
          onChange={handlers.onAccessCodeChange}
        />
      </div>

      {isExistingQuiz ? (
        <p className="text-xs" style={{ color: theme.text.muted }}>
          This quiz is already generated. Question text is shown for review; activation updates metadata and status.
        </p>
      ) : null}

      <Separator />

      <ImportRow
        subjects={subjects}
        importSubjectId={values.importSubjectId}
        onImportSubjectChange={handlers.onImportSubjectChange}
        onImportFile={handlers.onImportFile}
      />

      {importStatus ? (
        <p className="text-xs" style={{ color: theme.text.muted }}>
          {importStatus}
        </p>
      ) : null}
    </>
  );
}
