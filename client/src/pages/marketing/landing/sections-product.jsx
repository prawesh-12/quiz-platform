import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import Download from "lucide-react/dist/esm/icons/download";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import Flag from "lucide-react/dist/esm/icons/flag";
import Globe from "lucide-react/dist/esm/icons/globe";
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap";
import Layers from "lucide-react/dist/esm/icons/layers";
import Link2 from "lucide-react/dist/esm/icons/link-2";
import Minus from "lucide-react/dist/esm/icons/minus";
import Save from "lucide-react/dist/esm/icons/save";
import Server from "lucide-react/dist/esm/icons/server";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Shuffle from "lucide-react/dist/esm/icons/shuffle";
import Timer from "lucide-react/dist/esm/icons/timer";
import UserCog from "lucide-react/dist/esm/icons/user-cog";

import { AutoGenerateFragment, BankImportFragment, SchedulingFragment } from "./fragments-build";
import { AutosaveLogFragment, EntryFragment, ResultsFragment } from "./fragments-run";
import { IconChip, Reveal, SectionHead } from "./primitives";
import TouchpointArc from "./touchpoint-arc";
import { CARD, DISPLAY, FOCUS, H3, LABEL, PAD, SECTION, WASH_BAND } from "./tokens";

const FEATURES = [
  {
    icon: Layers,
    tint: "violet",
    bg: "var(--tint-lilac)",
    title: "Question bank with Excel import",
    body: "Subjects hold units, units hold questions. Type them in, or upload a spreadsheet and get a warning for every row that needs a second look. Mark a question bank-eligible and any quiz can draw it.",
    link: ["See the three steps", "how"],
    Fragment: BankImportFragment,
  },
  {
    icon: Shuffle,
    tint: "amber",
    bg: "var(--tint-cream)",
    title: "Auto-generate from the bank",
    body: "Say how many questions each unit contributes and QuizLoom draws them at random. Every quiz keeps its own copy of each question, so editing the bank later never changes a quiz you already ran.",
    link: ["Reusing questions", "faq"],
    faq: 3,
    Fragment: AutoGenerateFragment,
  },
  {
    icon: Timer,
    tint: "mint",
    bg: "var(--tint-mint)",
    title: "Scheduling that runs without you",
    body: "A quiz moves through draft, scheduled, active and ended. It opens and closes on its own. Papers still open at the end time are scored automatically, so a forgotten Submit still gets a mark.",
    link: ["If nobody pressed Submit", "faq"],
    faq: 2,
    Fragment: SchedulingFragment,
  },
  {
    icon: Link2,
    tint: "blush",
    bg: "var(--tint-blush)",
    title: "Students join with a link and a code",
    body: "No account, no password, no email to verify. A student opens the share link, types the access code, fills in name, roll number, email, division and group, then starts.",
    link: ["Do students need an account", "faq"],
    faq: 0,
    Fragment: EntryFragment,
  },
  {
    icon: Save,
    tint: "sky",
    bg: "var(--tint-sky)",
    title: "Answers that survive a dropped connection",
    body: "Answers save about a second after each change and retry on their own when the connection drops. A refresh restores everything. The countdown runs on server time, and a second submit cannot overwrite a score.",
    link: ["What a dropped connection does", "faq"],
    faq: 1,
    Fragment: AutosaveLogFragment,
  },
  {
    icon: Flag,
    tint: "violet",
    bg: "var(--tint-lilac)",
    title: "Proctoring flags and the results export",
    body: "Tab switches, window blur, screenshot keys, copy shortcuts, copy events and right-clicks are flagged with timestamps, repeats throttled. Results carry a violation breakdown, a top-ten board and one xlsx.",
    link: ["Reliability notes", "reliability"],
    Fragment: ResultsFragment,
  },
];

function FeatureCard({ feature, onFollow }) {
  return (
    <article
      className={`${CARD} flex h-full flex-col overflow-hidden`}
      style={{ backgroundColor: feature.bg }}
    >
      <div className="p-6">
        <IconChip icon={feature.icon} tint={feature.tint} />
        <h3 className={`mt-4 ${H3} ${DISPLAY}`}>{feature.title}</h3>
        <p className="mt-3 text-[15px] leading-[1.6] text-[color:var(--ink-2)]">{feature.body}</p>
        <a
          href={`#${feature.link[1]}`}
          onClick={onFollow}
          className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded text-[14px] font-semibold text-[color:var(--accent)] ${FOCUS}`}
        >
          {feature.link[0]}
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </a>
      </div>
      <div className="mt-auto border-t border-[color:var(--rule)] px-6 py-5">
        <feature.Fragment />
      </div>
    </article>
  );
}

export function Features({ onJump, onOpenFaq }) {
  const follow = (feature) => (event) => {
    if (typeof feature.faq === "number") onOpenFaq(feature.faq);
    onJump(feature.link[1])(event);
  };

  return (
    <section id="features" className={`${SECTION} ${PAD} scroll-mt-24`}>
      <SectionHead
        eyebrow="Features"
        tone="violet"
        title="The exam, end to end"
        lede="Six parts of a test day, each one showing the screen a teacher actually uses."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={(index % 3) * 60}>
            <FeatureCard feature={feature} onFollow={follow(feature)} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// Share2 sits at the centre of the arc: one link is how QuizLoom actually reaches a student.
const TOUCHPOINTS = [
  [FileSpreadsheet, "Excel sheets in and out"],
  [Globe, "Any browser, nothing to install"],
  [Share2, "Share the link however you message a class"],
  [Download, "Results straight to xlsx"],
  [Server, "Runs on a server you control"],
];

const TOUCHPOINT_TINTS = ["sky", "amber", "violet", "mint", "blush"];

export function Touchpoints() {
  return (
    <section style={{ backgroundImage: WASH_BAND }}>
      <div className={`${SECTION} ${PAD}`}>
        <SectionHead
          eyebrow="Integration"
          tone="violet"
          title="It fits the tools already on the desk"
          lede="QuizLoom connects to nothing. It reads the spreadsheet you already keep and hands one back."
        />
        <Reveal className="mt-12">
          <TouchpointArc items={TOUCHPOINTS} />
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:hidden">
          {TOUCHPOINTS.map(([icon, label], index) => (
            <Reveal key={label} delay={index * 60} className="text-center">
              <span className="inline-flex flex-col items-center gap-3">
                <IconChip icon={icon} tint={TOUCHPOINT_TINTS[index]} size={48} />
                <span className="text-[14px] leading-snug text-[color:var(--ink-2)]">{label}</span>
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROLES = [
  {
    icon: UserCog,
    tint: "violet",
    name: "Admin",
    note: "One per deployment",
    bullets: ["Adds teachers", "Creates subjects", "Assigns subjects to teachers", "Sees every quiz"],
  },
  {
    icon: ClipboardList,
    tint: "amber",
    name: "Teacher",
    note: "As many as you add",
    bullets: [
      "Builds the question bank",
      "Creates quizzes by hand or from the bank",
      "Schedules and shares the link",
      "Watches the live counts",
      "Exports the results spreadsheet",
    ],
  },
  {
    icon: GraduationCap,
    tint: "mint",
    name: "Student",
    note: "No account",
    bullets: [
      "Opens the share link",
      "Types the access code and their details",
      "Takes the quiz in any browser",
      "Sees a score and a per-question breakdown",
    ],
  },
];

export function Roles() {
  return (
    <section className={`${SECTION} ${PAD}`}>
      <SectionHead
        eyebrow="Roles"
        tone="violet"
        title="Three roles, one exam"
        lede="Who does what, and who never has to sign up."
      />
      <div className="mt-12 grid items-start gap-5 md:grid-cols-3">
        {ROLES.map((role, index) => (
          <Reveal key={role.name} delay={index * 60}>
            <div className={`${CARD} self-start p-6`}>
              <IconChip icon={role.icon} tint={role.tint} />
              <h3 className={`mt-4 ${H3} ${DISPLAY}`}>{role.name}</h3>
              <p className={`mt-1 ${LABEL}`}>{role.note}</p>
              <ul className="mt-4 space-y-2">
                {role.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2.5 text-[15px] leading-[1.55] text-[color:var(--ink-2)]">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--accent)]" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const LIMITS = [
  "Single-choice questions only. No essay or short-answer grading.",
  "Proctoring watches the browser, not the student. There is no camera.",
  "One admin account per deployment.",
  "All scheduled times run on IST.",
];

export function Limits() {
  return (
    <section className={`${SECTION} pb-14 md:pb-[72px] lg:pb-28`}>
      <Reveal>
        <div className="rounded-[32px] border border-[color:var(--rule)] bg-[color:var(--panel-tint)] p-6 sm:p-10">
          <h3 className={`${H3} ${DISPLAY}`}>What it doesn&apos;t do</h3>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {LIMITS.map((limit) => (
              <li key={limit} className="flex gap-3 text-[15px] leading-[1.6] text-[color:var(--ink-2)]">
                <Minus size={16} strokeWidth={1.5} aria-hidden="true" className="mt-1 shrink-0 text-[color:var(--muted)]" />
                {limit}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
