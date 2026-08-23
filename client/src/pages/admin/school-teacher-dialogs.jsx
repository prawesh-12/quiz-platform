import Check from "lucide-react/dist/esm/icons/check";
import Copy from "lucide-react/dist/esm/icons/copy";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { theme } from "@/theme";

const PANEL_CLASS = "rounded-[var(--ds-radius-md)] border p-3";

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[12px]" style={{ color: theme.text.muted }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function FieldValue({ children, className = "" }) {
  return (
    <p className={`text-[14px] font-semibold ${className}`} style={{ color: theme.text.primary }}>
      {children}
    </p>
  );
}

export function AssignedSubjectsDialog({ teacher, onClose }) {
  const subjects = teacher?.assigned_subjects || [];

  return (
    <Dialog open={Boolean(teacher)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigned Subjects</DialogTitle>
          <DialogDescription>Current subjects for {teacher?.name || "teacher"}.</DialogDescription>
        </DialogHeader>
        <div
          className={`max-h-52 overflow-y-auto ${PANEL_CLASS}`}
          style={{ borderColor: theme.border.input, backgroundColor: theme.bg.content }}
        >
          {subjects.length === 0 ? (
            <p className="text-[13px]" style={{ color: theme.text.muted }}>
              No subjects assigned.
            </p>
          ) : (
            <ul className="space-y-2">
              {subjects.map((subject) => (
                <li key={subject.id || subject.name} className="text-[13px]" style={{ color: theme.text.secondary }}>
                  {subject.name || subject}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OneTimeWarning() {
  return (
    <div
      role="alert"
      className={`${PANEL_CLASS} text-[13px]`}
      style={{
        borderColor: theme.status.pending,
        backgroundColor: theme.status.pendingTint,
        color: theme.status.pending
      }}
    >
      This password is shown <strong>only once</strong> and cannot be retrieved later. Copy it now and share
      it securely with the teacher.
    </div>
  );
}

function PasswordField({ password, hasCopied, onCopy }) {
  if (!password) {
    return (
      <Field label="Password">
        <p className="text-[13px]" style={{ color: theme.text.muted }}>
          Not available. Teacher may have been created before password storage was enabled.
        </p>
      </Field>
    );
  }

  return (
    <Field label="Password">
      <div className="flex items-center justify-between gap-2">
        <FieldValue className="break-all">{password}</FieldValue>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onCopy}>
          {hasCopied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
          {hasCopied ? "Copied" : "Copy"}
        </Button>
      </div>
    </Field>
  );
}

export function CredentialsDialog({ state, hasCopied, copyConfirmed, onCopy, onConfirmCopy, onOpenChange, onClose }) {
  const password = state.data?.password || state.password;

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login Credentials</DialogTitle>
          <DialogDescription>Credentials summary for {state.teacherName || "teacher"}.</DialogDescription>
        </DialogHeader>

        {state.oneTime ? <OneTimeWarning /> : null}

        <div className={`space-y-3 ${PANEL_CLASS}`} style={{ borderColor: theme.border.input }}>
          <Field label="Name">
            <FieldValue>{state.data?.name || state.teacherName || "-"}</FieldValue>
          </Field>
          <Field label="Email">
            <FieldValue>{state.data?.email || "-"}</FieldValue>
          </Field>
          <PasswordField password={password} hasCopied={hasCopied} onCopy={onCopy} />
        </div>

        {state.oneTime ? (
          <>
            <label className="flex cursor-pointer items-start gap-2 text-[13px]" style={{ color: theme.text.primary }}>
              <Checkbox className="mt-0.5" checked={copyConfirmed} onCheckedChange={(value) => onConfirmCopy(value === true)} />
              <span>I have copied the password and saved it securely.</span>
            </label>
            <DialogFooter>
              <Button type="button" disabled={!copyConfirmed} onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function RemoveTeacherDialog({ teacher, schoolLabel, isPending, onCancel, onConfirm }) {
  return (
    <Dialog open={Boolean(teacher)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove from School</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{teacher?.name}</strong> from{" "}
            <strong>{schoolLabel}</strong>? The teacher will still exist in the system but won&apos;t
            be associated with this school.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={isPending}
            onClick={() => onConfirm(teacher.id)}
          >
            {isPending ? "Removing..." : "Remove from School"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
