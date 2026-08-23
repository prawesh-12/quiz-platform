import { LABEL_SM, MONO } from "./tokens";

export const PANEL = "rounded-xl border border-[color:var(--rule)] bg-[color:var(--panel)]";

export const TONES = {
  ink: "text-[color:var(--ink)]",
  active: "text-[color:var(--active)]",
  pending: "text-[color:var(--pending)]",
  flagged: "text-[color:var(--flagged)]"
};

// Tailwind only compiles class names it can read literally, so no template interpolation here.
const ROW_TONES = {
  flagged: "bg-[color:var(--flagged-tint)] text-[color:var(--flagged)]",
  pending: "bg-[color:var(--pending-tint)] text-[color:var(--pending)]",
  active: "bg-[color:var(--active-tint)] text-[color:var(--active)]"
};

export function rowTint(tone, index) {
  if (tone) return ROW_TONES[tone];
  if (index % 2) return "bg-[color:var(--panel-tint)]";
  return "";
}

export function Kpi({ value, label, icon: Icon, tint }) {
  return (
    <div className={`${PANEL} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] leading-tight text-[color:var(--muted)]">{label}</p>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${tint}`}>
          <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
        </span>
      </div>
      <p className={`mt-2 text-[22px] font-bold leading-none tabular-nums text-[color:var(--ink)]`}>{value}</p>
    </div>
  );
}

export function Stat({ value, label, tone = "ink" }) {
  return (
    <div className={`${PANEL} p-3`}>
      <p className={LABEL_SM}>{label}</p>
      <p className={`mt-1.5 text-[22px] font-bold leading-none tabular-nums ${TONES[tone]}`}>{value}</p>
    </div>
  );
}

export function Field({ label, children, placeholder = false }) {
  const tone = placeholder ? "text-[color:var(--muted)]" : "text-[color:var(--ink)]";
  return (
    <div>
      <p className="mb-1 text-[10.5px] font-semibold text-[color:var(--ink-2)]">{label}</p>
      <div className={`${PANEL} px-2.5 py-1.5 text-[11.5px] ${tone}`}>{children}</div>
    </div>
  );
}

function Cell({ children, index, hideOnMobile, isFirst }) {
  const weight = isFirst ? "font-medium" : "";
  const visibility = hideOnMobile ? "hidden sm:block" : "";
  return <span className={`min-w-0 truncate ${weight} ${visibility}`}>{children}</span>;
}

// Narrow screens keep the name and the number; the middle columns are noise at that width.
export function DataTable({ template, mobileTemplate, columns, rows, mobileHide = [] }) {
  const grid = `${mobileTemplate || template} ${template.replace(/grid-cols-/g, "sm:grid-cols-")}`;

  return (
    <div className={`${PANEL} flex min-h-0 flex-1 flex-col overflow-hidden`}>
      <div className={`grid shrink-0 gap-3 border-b border-[color:var(--rule)] px-3 py-2 ${grid}`}>
        {columns.map((label, index) => (
          <Cell key={label} index={index} hideOnMobile={mobileHide.includes(index)}>
            <span className={LABEL_SM}>{label}</span>
          </Cell>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {rows.map(({ cells, tone }, rowIndex) => (
          <div
            key={cells[0]}
            className={`grid items-center gap-3 px-3 py-[9px] text-[11.5px] ${grid} ${rowTint(tone, rowIndex)}`}
          >
            {cells.map((cell, index) => (
              <Cell key={index} index={index} hideOnMobile={mobileHide.includes(index)} isFirst={index === 0}>
                {cell}
              </Cell>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// The real dashboard plots unique participants per day; the shape is illustrative.
export function TrendLine() {
  return (
    <svg viewBox="0 0 320 90" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
      <path
        d="M0 88 L120 88 Q190 88 215 44 Q240 8 268 26 Q296 44 320 74"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M0 88 L120 88 Q190 88 215 44 Q240 8 268 26 Q296 44 320 74 L320 90 L0 90 Z"
        fill="var(--accent-tint)"
        opacity="0.7"
      />
    </svg>
  );
}

export function MonoText({ children, className = "" }) {
  return <span className={`${MONO} ${className}`}>{children}</span>;
}
