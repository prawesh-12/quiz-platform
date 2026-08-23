import Box from "lucide-react/dist/esm/icons/box";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Database from "lucide-react/dist/esm/icons/database";
import Gauge from "lucide-react/dist/esm/icons/gauge";
import Layers from "lucide-react/dist/esm/icons/layers";
import Lock from "lucide-react/dist/esm/icons/lock";
import Unplug from "lucide-react/dist/esm/icons/unplug";
import { Link } from "react-router-dom";

import { IconChip, Reveal, SectionHead } from "./primitives";
import { CARD, DISPLAY, FOCUS, LABEL, PAD, SECTION, SHADOW_SOFT, SIGNUP_PATH, WASH_BAND } from "./tokens";

const RELIABILITY = [
  [Database, "violet", "Storage", "Each service owns its own database.", "No service reaches into another service's tables."],
  [Layers, "sky", "Events", "Every event is written in the same transaction as its data change.", "A queue outage cannot lose a submission."],
  [Lock, "mint", "Sessions", "httpOnly cookie sessions, bcrypt-hashed passwords.", "Logout revokes the token across every service immediately."],
  [Gauge, "amber", "Rate limits", "Login: 20 attempts per IP per 15 minutes.", "Quiz entry: 30 tries per IP per 5 minutes."],
  [Unplug, "blush", "Degraded mode", "If the cache layer goes down, submissions still land.", "Queued events publish when it returns."],
  [Box, "violet", "Deployment", "One Docker Compose stack.", "Runs on any host you control."],
];

export function Reliability() {
  return (
    <section id="reliability" className="scroll-mt-24" style={{ backgroundImage: WASH_BAND }}>
      <div className={`${SECTION} ${PAD}`}>
        <SectionHead
          eyebrow="Reliability"
          tone="violet"
          title="For the person who approves the software"
          lede="The specifics an IT review asks for, without the adjectives."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RELIABILITY.map(([Icon, tint, label, first, second], index) => (
            <Reveal key={label} delay={(index % 3) * 60}>
              <div className={`${CARD} h-full p-6`}>
                <div className="flex items-center gap-3">
                  <IconChip icon={Icon} tint={tint} size={32} />
                  <span className={`${LABEL}`}>
                    {label}
                  </span>
                </div>
                <p className="mt-4 text-[15px] leading-[1.55] text-[color:var(--ink)]">{first}</p>
                <p className="mt-2 text-[15px] leading-[1.55] text-[color:var(--ink-2)]">{second}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const INCLUDED = [
  "Unlimited quizzes",
  "Unlimited students per quiz",
  "Question bank across subjects and units",
  "Excel import with a warning per row",
  "Auto-generate from the bank",
  "Live monitoring while a quiz runs",
  "Proctoring flags with timestamps",
  "Excel export in roll-number order",
];

function PriceCard() {
  return (
    <div className="rounded-[24px] bg-[color:var(--ink)] p-7 text-white">
      <p className={`text-[12px] font-semibold text-white/55`}>Early access</p>
      <p className={`mt-5 text-[56px] font-extrabold leading-none tracking-[-0.04em] ${DISPLAY}`}>&#8377;0</p>
      <p className={`mt-3 text-[13.5px] leading-relaxed text-white/60`}>
        per student
        <br />
        per quiz
        <br />
        per teacher
      </p>
      <Link
        to={SIGNUP_PATH}
        className={`mt-7 flex h-11 w-full items-center justify-center rounded-full bg-white px-5 text-[15px] font-semibold text-[color:var(--ink)] transition-colors duration-150 hover:bg-white/85 ${FOCUS}`}
      >
        Create a teacher account
      </Link>
      <p className={`mt-4 text-[12.5px] text-white/45`}>no card · no trial clock</p>
    </div>
  );
}

function IncludedList() {
  return (
    <div className="lg:py-1">
      <p className={LABEL}>Everything is on</p>
      <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {INCLUDED.map((item) => (
          <li key={item} className="flex gap-3 text-[15.5px] leading-[1.45] text-[color:var(--ink)]">
            <Check size={18} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0 text-[color:var(--active)]" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t border-[color:var(--rule)] pt-5 text-[14.5px] leading-[1.6] text-[color:var(--ink-2)]">
        One admin account per deployment, as many teachers as you add, and no cap on the students who sit a quiz.
        What QuizLoom deliberately leaves out is listed further up the page.
      </p>
    </div>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className={`${SECTION} ${PAD} scroll-mt-24`}>
      <SectionHead
        eyebrow="Pricing"
        tone="violet"
        title="Free during early access."
        lede="No card and no per-student charge. When pricing arrives you will hear it from us before it applies."
      />
      <Reveal className="mt-12">
        <div className={`rounded-[32px] border border-[color:var(--rule)] bg-[color:var(--panel)] p-6 sm:p-8 ${SHADOW_SOFT}`}>
          <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
            <PriceCard />
            <IncludedList />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export const FAQ_ITEMS = [
  [
    "Do students need an account?",
    "No. A student opens the share link, types the access code, fills in name, roll number, email, division and group, then starts. No password and no email verification.",
  ],
  [
    "What if a student's connection drops?",
    "Answers save about a second after each change and retry on their own. A refresh restores what was saved, so the student carries on from where they were.",
  ],
  [
    "What if a student never presses Submit?",
    "The paper is still scored. At the end time every open paper is graded automatically, and that student sees the same score and breakdown as everyone else.",
  ],
  [
    "Can I reuse questions across quizzes?",
    "Mark a question bank-eligible and auto-generate can draw it. Each quiz keeps its own copy, so editing the bank later never changes a quiz you already ran.",
  ],
  [
    "Can I import questions from a spreadsheet?",
    "Yes. Upload an Excel sheet and QuizLoom checks every row, then hands back a warnings list telling you which rows need a look instead of failing quietly.",
  ],
  [
    "How do I know if someone switched tabs?",
    "Tab switches, window blur, screenshot keys, copy shortcuts, copy events and right-clicks are flagged with timestamps. Repeats of the same type are throttled, and results show a breakdown per student.",
  ],
  [
    "Can I edit a quiz that is already running?",
    "No. Once a quiz is scheduled or active it stays exactly as students see it. Duplicate it into a fresh draft and schedule that one instead.",
  ],
  [
    "Which time zone do schedules use?",
    "All scheduled times run on IST. The student countdown is anchored to server time, so changing a device clock changes nothing.",
  ],
];

function FaqItem({ question, answer, open, onToggle, id }) {
  return (
    <div className="border-b border-[color:var(--rule)]">
      <h3>
        <button
          type="button"
          id={id}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className={`flex w-full items-center justify-between gap-4 rounded py-5 text-left text-[16.5px] font-medium text-[color:var(--ink)] ${FOCUS}`}
        >
          {question}
          <ChevronDown
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
            className={`shrink-0 text-[color:var(--muted)] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={id}
        className={`grid transition-all duration-300 ${open ? "[grid-template-rows:1fr] opacity-100" : "[grid-template-rows:0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-8 text-[15px] leading-[1.65] text-[color:var(--ink-2)]">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function Faq({ open, onOpen }) {
  const columns = [FAQ_ITEMS.slice(0, 4), FAQ_ITEMS.slice(4)];
  return (
    <section id="faq" className="scroll-mt-24" style={{ backgroundImage: WASH_BAND }}>
      <div className={`${SECTION} ${PAD}`}>
        <SectionHead eyebrow="FAQ" tone="violet" title="Questions teachers ask" />
        <div className="mt-12 grid gap-x-12 lg:grid-cols-2">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex}>
              {column.map(([question, answer], rowIndex) => {
                const index = columnIndex * 4 + rowIndex;
                return (
                  <FaqItem
                    key={question}
                    id={`faq-${index}`}
                    question={question}
                    answer={answer}
                    open={open === index}
                    onToggle={() => onOpen(open === index ? -1 : index)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
