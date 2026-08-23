import Copy from "lucide-react/dist/esm/icons/copy";
import Download from "lucide-react/dist/esm/icons/download";
import Activity from "lucide-react/dist/esm/icons/activity";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import ClipboardCheck from "lucide-react/dist/esm/icons/clipboard-check";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import Users from "lucide-react/dist/esm/icons/users";

import { DataTable, Field, Kpi, MonoText, PANEL, Stat, TrendLine } from "./film-primitives";
import { StatusChip } from "./primitives";
import { LABEL_SM } from "./tokens";

const DARK_PILL =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[color:var(--ink)] px-2.5 py-1 text-[11px] font-semibold text-white";
const LIGHT_PILL =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[color:var(--rule)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--ink)]";

const KPIS = [
  { label: "Scheduled Quizzes", value: "0", icon: CalendarClock, tint: "bg-[#FBEFDA] text-[#9A5A0B]" },
  { label: "Ongoing Quizzes", value: "1", icon: Activity, tint: "bg-[#E2F2EB] text-[#12715A]" },
  { label: "Quiz Attempts Today", value: "1", icon: ClipboardCheck, tint: "bg-[#E2F2EB] text-[#12715A]" },
  { label: "New Participants Today", value: "1", icon: UserPlus, tint: "bg-[#E6EDFC] text-[#2B4FB8]" },
  { label: "Total Participants", value: "3", icon: Users, tint: "bg-[#EFE9FE] text-[#6D3BEF]" }
];

const RECENT_ACTIVITY = [
  { cells: ["Testing in Prod", "Computer Network", "23 Aug 2026", "1", "60.0%"] },
  { cells: ["Copy of Production Test", "Computer Network", "23 Aug 2026", "0", "0%"] },
  { cells: ["Untitled quiz", "Computer Network", "23 Aug 2026", "0", "0%"] },
  { cells: ["Production Test", "Computer Network", "24 Jun 2026", "1", "40.0%"] }
];

const QUIZ_STATS = [
  ["Participants", "1"],
  ["Avg Score", "60.0%"],
  ["Total Quizzes", "12"],
  ["Total Attempts", "8"]
];

function TrendAndStats() {
  return (
    <div className="grid shrink-0 grid-cols-[1fr_190px] gap-3">
      <div className={`${PANEL} p-3`}>
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-[color:var(--ink)]">Unique Participants</p>
          <span className={DARK_PILL}>Load Data</span>
        </div>
        <div className="mt-2 h-[74px]">
          <TrendLine />
        </div>
      </div>
      <div className={`${PANEL} p-3`}>
        <p className="text-[12px] font-bold text-[color:var(--ink)]">Quiz Stats</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {QUIZ_STATS.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-[color:var(--panel-tint)] px-2 py-1.5">
              <p className="text-[9.5px] text-[color:var(--muted)]">{label}</p>
              <p className="text-[13px] font-bold tabular-nums text-[color:var(--ink)]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardBeat() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid shrink-0 grid-cols-5 gap-2.5">
        {KPIS.map((kpi) => (
          <Kpi key={kpi.label} {...kpi} />
        ))}
      </div>
      <TrendAndStats />
      <DataTable
        template="grid-cols-[1fr_130px_92px_64px_58px]"
        columns={["Quiz", "Subject", "Date", "Participants", "Avg Score"]}
        rows={RECENT_ACTIVITY}
      />
    </div>
  );
}

const BUILDER_FIELDS = [
  ["Quiz Title", "Unit 1 class test"],
  ["Subject", "Computer Network"],
  ["Duration (mins)", "15"],
  ["Batch", "2023-2027"],
  ["Division", "7"],
  ["Group", "G13/G14"],
  ["Scheduled Start", "24 Aug, 10:00"],
  ["Access Code", "2026CN"]
];

const BUILDER_OPTIONS = [
  ["A", "Network layer", true],
  ["B", "Transport layer", false],
  ["C", "Data link layer", false]
];

function QuestionCard() {
  return (
    <div className={`${PANEL} min-h-0 flex-1 p-3`}>
      <p className="text-[12px] font-bold text-[color:var(--ink)]">Question 1</p>
      <div className="mt-2 rounded-lg border border-[color:var(--rule)] bg-[color:var(--panel-tint)] px-2.5 py-2 text-[11.5px]">
        Which layer of the OSI model handles routing?
      </div>
      <div className="mt-2 space-y-1.5">
        {BUILDER_OPTIONS.map(([key, text, correct]) => (
          <div key={key} className="flex items-center gap-2 text-[11.5px]">
            <span
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                correct ? "border-[color:var(--accent)] bg-[color:var(--accent)]" : "border-[color:var(--rule-strong)]"
              }`}
            >
              {correct ? <span className="h-1 w-1 rounded-full bg-white" /> : null}
            </span>
            <span className="flex-1 rounded-lg border border-[color:var(--rule)] px-2.5 py-1.5">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BuilderBeat() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className={`${PANEL} shrink-0 p-3`}>
        <div className="flex items-center justify-between">
          <p className="text-[12.5px] font-bold text-[color:var(--ink)]">Manual Quiz Page</p>
          <span className="flex gap-2">
            <span className={LIGHT_PILL}>Save as Draft</span>
            <span className={LIGHT_PILL}>Preview</span>
            <span className={DARK_PILL}>Schedule Quiz</span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {BUILDER_FIELDS.map(([label, value]) => (
            <Field key={label} label={label}>
              {value}
            </Field>
          ))}
        </div>
      </div>
      <QuestionCard />
    </div>
  );
}

const LIVE_ROWS = [
  { cells: ["Prawesh Mandal", "230000", "7", "G14", "3 / 5", "05:32:41"] },
  { cells: ["Aarav Shah", "230014", "7", "G14", "working", "05:33:02"] },
  { cells: ["Diya Menon", "230021", "7", "G13", "working", "05:33:18"] },
  { cells: ["Kabir Rao", "230033", "7", "G13", "2 violations", "05:31:55"], tone: "flagged" }
];

export function MonitorBeat() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className={`${PANEL} flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 p-3`}>
        <span>
          <p className="text-[13px] font-bold text-[color:var(--ink)]">Testing in Prod</p>
          <p className="text-[10.5px] text-[color:var(--muted)]">Computer Network · Duration 15 mins</p>
        </span>
        <span className="flex items-center gap-2 rounded-lg bg-[color:var(--panel-tint)] px-2.5 py-1.5">
          <span className={LABEL_SM}>Access code</span>
          <MonoText className="text-[12.5px] font-medium">2026</MonoText>
          <Copy size={12} strokeWidth={1.75} aria-hidden="true" className="text-[color:var(--muted)]" />
        </span>
        <span className="ml-auto flex items-center gap-3">
          <span className="text-right">
            <p className={LABEL_SM}>Running time</p>
            <MonoText className="text-[15px] font-medium tabular-nums">03:01</MonoText>
          </span>
          <span className={DARK_PILL}>
            <Download size={12} strokeWidth={2} aria-hidden="true" />
            Export Results
          </span>
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-4 gap-2.5">
        <Stat value="200" label="Entered" />
        <Stat value="178" label="Submitted" tone="active" />
        <Stat value="22" label="Pending" tone="pending" />
        <Stat value="3" label="Flagged" tone="flagged" />
      </div>

      <DataTable
        template="grid-cols-[1fr_78px_54px_54px_84px_72px]"
        columns={["Student", "Roll No", "Division", "Group", "Score", "Submitted"]}
        rows={LIVE_ROWS}
      />
    </div>
  );
}

const RESPONSE_ROWS = [
  { cells: ["Prawesh Mandal", "230000", "praweshm45@gmail.com", "3 / 5", "Window Blur (3)"] },
  { cells: ["Aarav Shah", "230014", "aarav@school.edu", "5 / 5", "None"] },
  { cells: ["Diya Menon", "230021", "diya@school.edu", "4 / 5", "None"] },
  { cells: ["Kabir Rao", "230033", "kabir@school.edu", "2 / 5", "Tab switch (2)"], tone: "flagged" }
];

export function ResponsesBeat() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className={`${PANEL} flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 p-3`}>
        <span>
          <p className="text-[13px] font-bold text-[color:var(--ink)]">Testing in Prod</p>
          <p className="text-[10.5px] text-[color:var(--muted)]">Computer Network · 200 student sessions</p>
        </span>
        <span className="ml-auto flex items-center gap-2">
          <StatusChip state="ended" />
          <span className={LIGHT_PILL}>Quiz details</span>
          <span className={DARK_PILL}>
            <Download size={12} strokeWidth={2} aria-hidden="true" />
            Export Results
          </span>
        </span>
      </div>

      <div className="flex shrink-0 gap-1.5 rounded-lg bg-[color:var(--panel-tint)] p-1">
        <span className="rounded-md bg-[color:var(--panel)] px-3 py-1 text-[11.5px] font-semibold text-[color:var(--ink)]">
          Responses
        </span>
        <span className="px-3 py-1 text-[11.5px] text-[color:var(--muted)]">Leaderboard</span>
      </div>

      <DataTable
        template="grid-cols-[1fr_78px_150px_60px_104px]"
        columns={["Student", "Roll No", "Email", "Score", "Flags"]}
        rows={RESPONSE_ROWS}
      />
    </div>
  );
}
