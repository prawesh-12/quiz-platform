import Check from "lucide-react/dist/esm/icons/check";
import Copy from "lucide-react/dist/esm/icons/copy";
import Download from "lucide-react/dist/esm/icons/download";
import Flag from "lucide-react/dist/esm/icons/flag";
import Link2 from "lucide-react/dist/esm/icons/link-2";

import { StatusChip } from "./primitives";
import { LABEL_SM, MONO } from "./tokens";

const PANEL = "rounded-xl border border-[color:var(--rule)] bg-[color:var(--panel)]";
const TONES = {
  ink: "text-[color:var(--ink)]",
  active: "text-[color:var(--active)]",
  pending: "text-[color:var(--pending)]",
  flagged: "text-[color:var(--flagged)]",
};

// Tailwind only compiles class names it can read literally, so no template interpolation here.
const ROW_TONES = {
  flagged: "bg-[color:var(--flagged-tint)] text-[color:var(--flagged)]",
  pending: "bg-[color:var(--pending-tint)] text-[color:var(--pending)]",
  active: "bg-[color:var(--active-tint)] text-[color:var(--active)]",
};

function Stat({ value, label, tone = "ink" }) {
  return (
    <div className={`${PANEL} p-3`}>
      <p className={LABEL_SM}>{label}</p>
      <p className={`mt-1.5 text-[22px] font-medium leading-none tabular-nums ${MONO} ${TONES[tone]}`}>{value}</p>
    </div>
  );
}

function rowTint(tone, index) {
  if (tone) return ROW_TONES[tone];
  if (index % 2) return "bg-[color:var(--panel-tint)]";
  return "";
}

// Every beat is a header plus a table that runs past the frame's fade, so nothing floats in dead space.
function Beat({ head, columns, rows, foot }) {
  return (
    <div className="flex h-full flex-col gap-3">
      {head}
      <div className={`${PANEL} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        {foot}
        <div className={`grid shrink-0 gap-3 border-b border-[color:var(--rule)] px-3 py-2 ${columns.template}`}>
          {columns.labels.map((label) => (
            <span key={label} className={LABEL_SM}>
              {label}
            </span>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          {rows.map(({ cells, tone }, index) => (
            <div
              key={index}
              className={`grid items-center gap-3 px-3 py-[9px] text-[12.5px] ${columns.template} ${rowTint(tone, index)}`}
            >
              {cells.map((cell, cellIndex) => (
                <span
                  key={cellIndex}
                  className={`truncate ${cellIndex === 0 ? MONO : ""} ${
                    cellIndex === cells.length - 1 ? `text-right tabular-nums ${MONO}` : ""
                  }`}
                >
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <div className={`${PANEL} px-3 py-2 ${wide ? "col-span-2" : ""}`}>
      <p className={LABEL_SM}>{label}</p>
      <p className={`mt-1 text-[13px] text-[color:var(--ink)] ${MONO}`}>{children}</p>
    </div>
  );
}

const STEPPERS = [["Unit 1", 5], ["Unit 2", 3], ["Unit 3", 0], ["Unit 4", 0]];

const DRAWN = [
  ["Q1", "Solve for x: 3x + 7 = 22", "Unit 1", "1 pt"],
  ["Q2", "Which pair of lines is parallel?", "Unit 1", "1 pt"],
  ["Q3", "Factorise x² + 5x + 6", "Unit 2", "2 pts"],
  ["Q4", "The slope of y = 4x - 1 is", "Unit 1", "1 pt"],
  ["Q5", "Roots of x² - 9 = 0 are", "Unit 2", "2 pts"],
  ["Q6", "If 2x - 5 = 11, then x equals", "Unit 1", "1 pt"],
  ["Q7", "Discriminant of x² + 2x + 5", "Unit 2", "2 pts"],
  ["Q8", "Point that lies on y = 2x", "Unit 1", "1 pt"],
];

export function BuildBeat() {
  const head = (
    <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-[1fr_260px]">
      <div className={`${PANEL} p-3`}>
        <p className={LABEL_SM}>Draw from the bank</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
          {STEPPERS.map(([unit, count]) => (
            <div key={unit} className="flex items-center justify-between gap-2">
              <span className="text-[12px] text-[color:var(--ink-2)]">{unit}</span>
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-[color:var(--rule)] text-[10px]">&minus;</span>
                <span className={`w-3 text-center text-[12px] tabular-nums ${MONO}`}>{count}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded border border-[color:var(--rule)] text-[10px]">+</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className={`${PANEL} flex items-center gap-2 p-3`}>
        <Check size={14} strokeWidth={2} className="shrink-0 text-[color:var(--active)]" aria-hidden="true" />
        <span className={`truncate text-[12px] text-[color:var(--ink-2)]`}>48 rows imported · 1 warning</span>
        <span className="ml-auto shrink-0 rounded-full bg-[color:var(--ink)] px-3 py-1.5 text-[11px] font-semibold text-white">
          Build draft
        </span>
      </div>
    </div>
  );

  return (
    <Beat
      head={head}
      columns={{ template: "grid-cols-[34px_1fr_72px_48px]", labels: ["No.", "Question", "Unit", "Points"] }}
      rows={DRAWN.map((cells) => ({ cells }))}
    />
  );
}

const SCHEDULED = [
  ["10:00", "Algebra · Unit 1", "12A", "200"],
  ["11:30", "Trigonometry · Unit 2", "12B", "186"],
  ["14:00", "Mensuration · Unit 3", "11A", "174"],
  ["Tue 09:15", "Calculus revision", "12A", "200"],
  ["Tue 11:00", "Physics · Unit 1", "11B", "168"],
  ["Wed 10:00", "Algebra retest", "12A", "22"],
];

export function ScheduleBeat() {
  const head = (
    <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Starts">10:00 IST</Field>
      <Field label="Ends">10:20 IST</Field>
      <Field label="Access code">QK7-204</Field>
      <Field label="Questions">8</Field>
    </div>
  );
  const foot = (
    <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--rule)] bg-[color:var(--accent-tint)] px-3 py-2">
      <StatusChip state="scheduled" />
      <span className={`text-[12px] font-medium text-[color:var(--accent)]`}>
        09:58 · question set pre-loaded into cache
      </span>
    </div>
  );
  return (
    <Beat
      head={head}
      foot={foot}
      columns={{ template: "grid-cols-[84px_1fr_56px_56px]", labels: ["Window", "Quiz", "Class", "Seats"] }}
      rows={SCHEDULED.map((cells) => ({ cells }))}
    />
  );
}

const ENTERED = [
  ["10:00:04", "Aarav Shah", "12A-27", "started"],
  ["10:00:09", "Diya Menon", "12A-04", "started"],
  ["10:00:11", "Kabir Rao", "12A-12", "started"],
  ["10:00:16", "Ishita Nair", "12A-07", "started"],
  ["10:00:22", "Rohan Das", "12A-21", "started"],
  ["10:00:27", "Meera Iyer", "12A-33", "started"],
];

export function ShareBeat() {
  const head = (
    <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
      <div className={`${PANEL} flex items-center gap-2 p-3`}>
        <Link2 size={15} strokeWidth={1.75} className="shrink-0 text-[color:var(--ink-2)]" aria-hidden="true" />
        <span className={`truncate text-[12.5px] ${MONO}`}>quizloom.app/quiz/enter/QK7-204</span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[color:var(--ink)] px-2.5 py-1 text-[11px] font-semibold text-white">
          <Copy size={12} strokeWidth={2} aria-hidden="true" />
          Copy
        </span>
      </div>
      <div className={`${PANEL} px-3 py-2`}>
        <p className={LABEL_SM}>Access code</p>
        <p className={`mt-0.5 text-[15px] tracking-[0.28em] ${MONO}`}>QK7-204</p>
      </div>
    </div>
  );
  return (
    <Beat
      head={head}
      columns={{ template: "grid-cols-[76px_1fr_72px_64px]", labels: ["Entered", "Name", "Roll no.", "State"] }}
      rows={ENTERED.map((cells) => ({ cells }))}
    />
  );
}

const LIVE = [
  ["10:14:02", "Roll 07", "submitted · 8 of 8", "14m 02s"],
  ["10:13:48", "Roll 09", "working · on Q6", "06:12"],
  ["10:13:41", "Roll 12", "working · on Q8", "07:41"],
  ["10:13:30", "Roll 21", "submitted · 8 of 8", "15m 41s"],
  ["10:11:03", "Roll 27", "flagged · switched tab", "10:11"],
  ["10:10:55", "Roll 33", "working · on Q4", "04:55"],
  ["10:10:12", "Roll 04", "submitted · 8 of 8", "12m 55s"],
];

export function MonitorBeat() {
  const head = (
    <div className="grid shrink-0 grid-cols-4 gap-3">
      <Stat value="200" label="entered" />
      <Stat value="178" label="submitted" tone="active" />
      <Stat value="22" label="working" tone="pending" />
      <Stat value="3" label="flagged" tone="flagged" />
    </div>
  );
  const foot = (
    <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--rule)] px-3 py-2">
      <StatusChip state="active" />
      <span className={`text-[12px] text-[color:var(--muted)]`}>counts refresh every 3 seconds</span>
      <span className={`ml-auto text-[13px] tabular-nums ${MONO}`}>14:06 remaining</span>
    </div>
  );
  return (
    <Beat
      head={head}
      foot={foot}
      columns={{ template: "grid-cols-[76px_72px_1fr_72px]", labels: ["Time", "Roll", "State", "Elapsed"] }}
      rows={LIVE.map((cells) => ({ cells, tone: cells[2].startsWith("flagged") ? "flagged" : undefined }))}
    />
  );
}

const RESULTS = [
  ["01", "Roll 07", "8 of 8 correct", "98%"],
  ["02", "Roll 21", "7 of 8 correct", "91%"],
  ["03", "Roll 04", "7 of 8 correct", "88%"],
  ["04", "Roll 33", "6 of 8 correct", "82%"],
  ["05", "Roll 12", "6 of 8 correct", "79%"],
  ["06", "Roll 09", "5 of 8 correct", "71%"],
  ["41", "Roll 27", "2 violations logged", "64%"],
];

export function ResultsBeat() {
  const head = (
    <div className="grid shrink-0 grid-cols-4 gap-3">
      <Stat value="200" label="entered" />
      <Stat value="200" label="graded" tone="active" />
      <Stat value="22" label="auto-scored" tone="pending" />
      <Stat value="3" label="flagged" tone="flagged" />
    </div>
  );
  const foot = (
    <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--rule)] px-3 py-2">
      <StatusChip state="ended" />
      <span className={`flex items-center gap-1.5 text-[12px] text-[color:var(--muted)]`}>
        <Flag size={11} strokeWidth={1.75} className="text-[color:var(--flagged)]" aria-hidden="true" />
        red rows stay red in the sheet
      </span>
      <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ink)] px-2.5 py-1 text-[11px] font-semibold text-white">
        <Download size={12} strokeWidth={2} aria-hidden="true" />
        Export .xlsx
      </span>
    </div>
  );
  return (
    <Beat
      head={head}
      foot={foot}
      columns={{ template: "grid-cols-[34px_72px_1fr_56px]", labels: ["Rank", "Roll", "Breakdown", "Score"] }}
      rows={RESULTS.map((cells) => ({ cells, tone: cells[0] === "41" ? "flagged" : undefined }))}
    />
  );
}
