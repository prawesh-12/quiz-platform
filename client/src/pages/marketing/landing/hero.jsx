import { Link } from "react-router-dom";
import AlarmClock from "lucide-react/dist/esm/icons/alarm-clock";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import Flag from "lucide-react/dist/esm/icons/flag";
import UserX from "lucide-react/dist/esm/icons/user-x";
import WifiOff from "lucide-react/dist/esm/icons/wifi-off";
import Play from "lucide-react/dist/esm/icons/play";

import { FloatingChips } from "./hero-decor";
import HeroFilm from "./hero-film";
import { Eyebrow, IconChip, Reveal } from "./primitives";
import { BTN_DARK, BTN_LIGHT, DISPLAY, HERO_PROMISES, SECTION, SHADOW_LIFT, SIGNUP_PATH } from "./tokens";

const PROMISE_ICONS = { UserX, AlarmClock, WifiOff, Flag, FileSpreadsheet };

function PromiseRow({ promise }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <IconChip icon={PROMISE_ICONS[promise.icon]} tint={promise.tint} size={28} />
        <span className="text-[13.5px] font-semibold leading-snug text-[color:var(--ink)]">{promise.title}</span>
      </div>
      <p className="mt-2 text-[12.5px] leading-snug text-[color:var(--muted)]">{promise.detail}</p>
    </div>
  );
}

// The hero's floor: what a teacher gets, in their words, rather than the numbers behind it.
function HeroPromises() {
  return (
    <div className={`${SECTION} relative shrink-0 pb-8`}>
      <Reveal>
        <div className="rounded-[24px] border border-white/70 bg-white/55 px-6 py-7 backdrop-blur-sm">
          <p className="mb-6 text-center text-[13.5px] font-medium text-[color:var(--ink-2)]">
            Built for a room of 200, on a link and a code
          </p>
          <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
            {HERO_PROMISES.map((promise) => (
              <PromiseRow key={promise.title} promise={promise} />
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function HeroActions({ onJump }) {
  return (
    <Reveal delay={180}>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
        <Link to={SIGNUP_PATH} className={`${BTN_DARK} group h-12 px-6 shadow-[0_10px_30px_rgba(23,18,33,.22)]`}>
          Create a teacher account
          <ArrowRight
            size={16}
            strokeWidth={2.25}
            aria-hidden="true"
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </Link>
        <a href="#film" onClick={onJump("film")} className={`${BTN_LIGHT} h-12 px-6`}>
          <Play size={16} strokeWidth={1.75} aria-hidden="true" />
          Watch a quiz run
        </a>
      </div>
      <p className="mt-5 text-[14px] text-[color:var(--muted)]">
        No student accounts. No app to install. Free during early access.
      </p>
    </Reveal>
  );
}

function HeroCopy({ onJump }) {
  return (
    <div className="text-center lg:text-left">
      <Reveal>
        <Eyebrow tone="violet">For schools, colleges and coaching institutes</Eyebrow>
      </Reveal>
      <Reveal delay={60}>
        <h1
          className={`mx-auto mt-5 max-w-[16ch] text-[clamp(2.25rem,5.4vw,3.25rem)] font-extrabold leading-[1.08] tracking-[-0.035em] text-[color:var(--ink)] lg:mx-0 ${DISPLAY}`}
        >
          Schedule it at 10:00. Everyone is graded by{" "}
          <span className="bg-gradient-to-br from-[#7C4DFF] via-[#6D3BEF] to-[#B15CF0] bg-clip-text text-transparent">
            10:21.
          </span>
        </h1>
      </Reveal>
      <Reveal delay={120}>
        <p className="mx-auto mt-4 max-w-[520px] text-[17px] leading-[1.65] text-[color:var(--ink-2)] lg:mx-0">
          QuizLoom runs timed exams for schools and colleges. Set the window, share one link and an access code,
          then watch the room work. At the end time every open paper is scored, submitted or not.
        </p>
      </Reveal>
      <HeroActions onJump={onJump} />
    </div>
  );
}

function HeroIllustration() {
  return (
    <Reveal delay={120} className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/45 blur-3xl"
      />
      <div
        className={`relative mx-auto max-w-[220px] overflow-hidden rounded-[28px] border border-[color:var(--rule)] bg-[color:var(--panel)] sm:max-w-[300px] lg:max-w-[440px] lg:-translate-y-3 ${SHADOW_LIFT}`}
      >
        <img
          src="/media/teacher.webp"
          width="560"
          height="436"
          alt="Illustration of a teacher holding a printed quiz in front of two seated students."
          className="block w-full select-none"
        />
      </div>
      <FloatingChips />
    </Reveal>
  );
}

export default function Hero({ onJump }) {
  return (
    <section id="top" className="landing-hero relative flex flex-col">
      <div className={`${SECTION} relative flex flex-1 items-center py-10 lg:py-12`}>
        <div className="grid grid-cols-1 w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <HeroCopy onJump={onJump} />
          <HeroIllustration />
        </div>
      </div>
      <HeroPromises />
    </section>
  );
}

// The product frame gets its own section so the hero reads as one screen, not a crowded stack.
export function ProductFilm() {
  return (
    <section id="film" className={`${SECTION} scroll-mt-24 pb-14 pt-4 lg:pb-24 lg:pt-8`}>
      <Reveal lift="translate-y-12 scale-[0.96]" margin="0px 0px -20% 0px">
        <HeroFilm />
      </Reveal>
    </section>
  );
}
