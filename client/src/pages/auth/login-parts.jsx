import { theme } from "@/theme";

import { FOCUS_RING } from "./auth-shell";

export const DEMO_CREDENTIALS = [
  { role: "admin", label: "Admin", email: "admin@example.com", password: "pass@123" },
  { role: "teacher", label: "Teacher", email: "tom@tom.com", password: "tom@1234" }
];

const ROLES = [
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" }
];

function roleTabStyle(isActive) {
  if (isActive) {
    return {
      backgroundColor: theme.bg.card,
      color: theme.text.primary,
      borderColor: theme.border.default,
      boxShadow: theme.shadow.card,
      outlineColor: theme.accent.DEFAULT
    };
  }

  return {
    backgroundColor: "transparent",
    color: theme.text.secondary,
    borderColor: "transparent",
    outlineColor: theme.accent.DEFAULT
  };
}

export function RoleToggle({ mode, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Login role"
      className="grid grid-cols-2 gap-1 rounded-full p-1"
      style={{ backgroundColor: theme.bg.input }}
    >
      {ROLES.map((role) => {
        const isActive = mode === role.value;

        return (
          <button
            key={role.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(role.value)}
            className={`h-10 rounded-full border text-[14px] font-semibold transition-colors ${FOCUS_RING}`}
            style={roleTabStyle(isActive)}
          >
            {role.label}
          </button>
        );
      })}
    </div>
  );
}

export function DemoLogins({ onPick }) {
  return (
    <div
      className="rounded-[14px] border p-3"
      style={{ borderColor: theme.border.default, backgroundColor: theme.bg.content }}
    >
      <p
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: theme.text.muted }}
      >
        Demo logins — tap to autofill
      </p>
      <div className="space-y-2">
        {DEMO_CREDENTIALS.map((cred) => (
          <button
            key={cred.role}
            type="button"
            onClick={() => onPick(cred)}
            aria-label={`Fill the ${cred.label} demo credentials`}
            className={`flex w-full flex-wrap items-center justify-between gap-1 rounded-[10px] border px-3 py-2.5 text-left text-[12px] transition-colors ${FOCUS_RING}`}
            style={{
              borderColor: theme.border.input,
              backgroundColor: theme.bg.card,
              outlineColor: theme.accent.DEFAULT
            }}
          >
            <span className="font-semibold" style={{ color: theme.text.primary }}>
              {cred.label}
            </span>
            <span className="font-mono" style={{ color: theme.text.secondary }}>
              {cred.email} · {cred.password}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
