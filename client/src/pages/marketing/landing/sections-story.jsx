import Activity from "lucide-react/dist/esm/icons/activity";
import AlarmClock from "lucide-react/dist/esm/icons/alarm-clock";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import Library from "lucide-react/dist/esm/icons/library";
import Save from "lucide-react/dist/esm/icons/save";
import Timer from "lucide-react/dist/esm/icons/timer";
import UserX from "lucide-react/dist/esm/icons/user-x";
import WifiOff from "lucide-react/dist/esm/icons/wifi-off";

import LifecycleTicker from "./lifecycle-ticker";
import { Eyebrow, IconChip, Reveal, SectionHead, StatusChip } from "./primitives";
import { BTN_DARK, BTN_LIGHT, CARD, DISPLAY, H3, LABEL, MONO, PAD, SECTION, SHADOW_SOFT, WASH_BAND } from "./tokens";

const QUIZZES = [
  { name: "Algebra · Unit 1", state: "active", when: "10:00 to 10:20", who: "200 entered" },
  { name: "Trigonometry · Unit 2", state: "scheduled", when: "Thu 11:30", who: "code TR9-118" },
  { name: "Calculus revision", state: "draft", when: "not scheduled", who: "12 questions" },
  { name: "Mensuration · Unit 3", state: "ended", when: "Mon 09:00", who: "184 graded" },
];

const STAT_PILLS = [
  { icon: Activity, tint: "violet", value: "3 sec", label: "live refresh" },
  { icon: Save, tint: "sky", value: "1 sec", label: "autosave" },
  { icon: Timer, tint: "amber", value: "2 min", label: "cache pre-warm" },
  { icon: UserX, tint: "blush", value: "0", label: "student accounts" },
];

function StatPill({ icon, tint, value, label }) {
  return (
    <span className={`inline-flex items-center gap-2.5 rounded-full border border-[color:var(--rule)] bg-white py-1.5 pl-1.5 pr-4 ${SHADOW_SOFT}`}>
      <IconChip icon={icon} tint={tint} size={28} />
      <span className="leading-tight">
        <span className={`block text-[14px] font-medium tabular-nums text-[color:var(--ink)] ${MONO}`}>{value}</span>
        <span className="block text-[11px] text-[color:var(--muted)]">{label}</span>
      </span>
    </span>
  );
}

function QuizListComposite() {
  return (
    <div className="[perspective:1600px]">
      <div
        className={`${CARD} overflow-hidden lg:[transform:rotateY(-12deg)_rotateX(4deg)]`}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3 border-b border-[color:var(--rule)] px-4 py-3">
          <span className={`${LABEL}`}>
            Quizzes · Mathematics
          </span>
        </div>
        {QUIZZES.map((quiz) => (
          <div key={quiz.name} className="flex items-center gap-3 border-b border-[color:var(--rule)] px-4 py-3.5 last:border-b-0">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-[color:var(--ink)]">{quiz.name}</span>
              <span className={`block text-[12px] text-[color:var(--muted)] ${MONO}`}>{quiz.when}</span>
            </span>
            <StatusChip state={quiz.state} />
            <span className={`hidden w-[104px] text-right text-[12px] text-[color:var(--muted)] sm:block ${MONO}`}>
              {quiz.who}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Positioning({ onJump }) {
  return (
    <section className={`${SECTION} ${PAD}`}>
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <SectionHead
          align="left"
          eyebrow="Why QuizLoom"
          tone="violet"
          title="Built for the Monday morning exam"
          lede="You have 40 to 300 students, one period, and a spreadsheet waiting at the end of it. QuizLoom holds the whole test day: the question bank, the timed window, the live room, and the results file. The parts a teacher would otherwise hold by hand."
        >
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#how" onClick={onJump("how")} className={BTN_DARK}>
              See how it works
            </a>
            <a href="#reliability" onClick={onJump("reliability")} className={BTN_LIGHT}>
              Read the reliability notes
            </a>
          </div>
        </SectionHead>

        <Reveal delay={120} className="relative">
          <QuizListComposite />
          <div className="mt-5 flex flex-wrap gap-2.5 lg:absolute lg:-bottom-8 lg:-left-10 lg:mt-0 lg:max-w-[300px]">
            {STAT_PILLS.map((pill) => (
              <StatPill key={pill.label} {...pill} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const TEST_DAY = [
  ["09:41", "Draft written. Eight questions drawn from Units 1 and 2."],
  ["09:58", "Question set pre-loaded into cache."],
  ["10:00", "Quiz opens. 200 students enter with the code.", "active"],
  ["10:07", "Roll 27 switches tab. Flagged with a timestamp.", "flagged"],
  ["10:14", "178 submitted, 22 still working.", "pending"],
  ["10:20", "Quiz closes. The 22 open papers are scored.", "active"],
  ["10:21", "algebra-unit-1-results.xlsx downloaded."],
];

const TONE_DOT = {
  active: "bg-[color:var(--active)]",
  pending: "bg-[color:var(--pending)]",
  flagged: "bg-[color:var(--flagged)]",
};

const TONE_TEXT = {
  active: "text-[color:var(--active)]",
  pending: "text-[color:var(--pending)]",
  flagged: "text-[color:var(--flagged)]",
};

const COSTS = [
  { icon: UserX, tint: "blush", bg: "var(--tint-blush)", label: "Accounts", text: "Three students still cannot sign in to Google. QuizLoom needs no student account at all." },
  { icon: AlarmClock, tint: "amber", bg: "var(--tint-cream)", label: "The bell", text: "The form stayed open after class. Set an end time and the quiz closes itself." },
  { icon: WifiOff, tint: "violet", bg: "var(--tint-lilac)", label: "A crashed laptop", text: "Twenty minutes of answers gone. Here they save about a second after every change." },
  { icon: FileSpreadsheet, tint: "mint", bg: "var(--tint-mint)", label: "Sunday evening", text: "Formatting results by hand. Here it is one xlsx, in roll-number order." },
];

function TestDayTile() {
  return (
    <div className={`${CARD} flex h-full flex-col p-6`} style={{ backgroundColor: "var(--tint-lilac)" }}>
      <p className={LABEL}>One test day, Monday</p>
      <ol className="mt-5 flex flex-1 flex-col justify-between gap-4">
        {TEST_DAY.map(([time, event, tone]) => (
          <li key={time} className="relative flex gap-3.5 pl-1">
            <span
              aria-hidden="true"
              className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${tone ? TONE_DOT[tone] : "bg-[color:var(--rule-strong)]"}`}
            />
            <span className="min-w-0">
              <span className={`block text-[12px] tabular-nums text-[color:var(--muted)] ${MONO}`}>{time}</span>
              <span className={`block text-[14px] leading-snug ${tone ? TONE_TEXT[tone] : "text-[color:var(--ink)]"}`}>
                {event}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CostCard({ cost }) {
  return (
    <div className={`${CARD} h-full p-6`} style={{ backgroundColor: cost.bg }}>
      <IconChip icon={cost.icon} tint={cost.tint} />
      <p className={`mt-4 ${LABEL}`}>{cost.label}</p>
      <p className="mt-2 text-[16px] font-semibold leading-[1.5] text-[color:var(--ink)]">{cost.text}</p>
    </div>
  );
}

export function Bento() {
  return (
    <section className={`${SECTION} ${PAD}`}>
      <SectionHead
        eyebrow="The workaround, right now"
        tone="violet"
        title="What a test day costs you"
        lede="Four things go wrong with a form and a spreadsheet. QuizLoom answers each one."
      />
      <div className="mt-12 grid gap-5 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <TestDayTile />
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
          {COSTS.map((cost, index) => (
            <Reveal key={cost.label} delay={index * 60}>
              <CostCard cost={cost} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: Library,
    tint: "violet",
    title: "Build the bank",
    lines: [
      "Add questions under subjects and units, or import an Excel sheet and read the row-by-row warnings.",
      "Mark a question bank-eligible and any later quiz can draw it.",
    ],
  },
  {
    icon: CalendarClock,
    tint: "blush",
    title: "Schedule and share",
    lines: [
      "Pick a start and end time on IST and set an access code.",
      "Send one link. Two minutes before the start, the question set is pre-loaded into cache.",
    ],
  },
  {
    icon: Activity,
    tint: "mint",
    title: "Watch it run, then export",
    lines: [
      "Live counts while the room writes: entered, submitted, still working, flagged.",
      "When the end time passes, download the spreadsheet.",
    ],
  },
];

function StepCard({ step, index }) {
  return (
    <div className="rounded-[20px] border border-[color:var(--rule)] bg-[color:var(--panel-tint)] p-5">
      <div className="flex items-center gap-3">
        <IconChip icon={step.icon} tint={step.tint} />
        <Eyebrow tone="violet">{`Step ${index + 1}`}</Eyebrow>
      </div>
      <h3 className={`mt-4 ${H3} ${DISPLAY}`}>{step.title}</h3>
      {step.lines.map((line) => (
        <p key={line} className="mt-2 text-[15px] leading-[1.6] text-[color:var(--ink-2)]">
          {line}
        </p>
      ))}
    </div>
  );
}

export function Steps({ onJump }) {
  return (
    <section id="how" className="scroll-mt-24" style={{ backgroundImage: WASH_BAND }}>
      <div className={`${SECTION} ${PAD}`}>
        <div className={`rounded-[32px] border border-[color:var(--rule)] bg-[color:var(--panel)] p-6 sm:p-10 ${SHADOW_SOFT}`}>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <SectionHead
              align="left"
              eyebrow="How it works"
              tone="violet"
              title="Run a quiz in three steps"
              lede="After the second step the quiz runs without you. It opens at the start time, closes at the end time, and scores every paper that is still open."
            >
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#features" onClick={onJump("features")} className={BTN_DARK}>
                  See the features
                </a>
                <a href="#faq" onClick={onJump("faq")} className={BTN_LIGHT}>
                  Questions teachers ask
                </a>
              </div>
              <LifecycleTicker />
            </SectionHead>
            <div className="space-y-5">
              {STEPS.map((step, index) => (
                <Reveal key={step.title} delay={index * 150}>
                  <StepCard step={step} index={index} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
