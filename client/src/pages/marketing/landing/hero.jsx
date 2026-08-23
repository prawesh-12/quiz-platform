import { Link } from "react-router-dom";
import Play from "lucide-react/dist/esm/icons/play";

import HeroFilm from "./hero-film";
import { Eyebrow, Reveal, useCountUp, useInView, usePrefersReducedMotion } from "./primitives";
import { BTN_DARK, BTN_LIGHT, DISPLAY, MONO, SECTION, SHADOW_LIFT, SIGNUP_PATH, SPEC_FIGURES } from "./tokens";

function SpecFigure({ figure, run, reduced }) {
  const value = useCountUp(figure.value, run);
  return (
    <div className="text-center">
      <p className={`text-[24px] font-medium leading-none tabular-nums text-[color:var(--ink)] ${MONO}`}>
        {reduced ? figure.value : value}
        <span className="text-[color:var(--muted)]">{figure.suffix}</span>
      </p>
      <p className="mt-1.5 text-[12px] leading-snug text-[color:var(--muted)]">{figure.label}</p>
    </div>
  );
}

// The hero's floor: real numbers instead of empty space, and they mark the fold without a cue.
function HeroSpecs() {
  const reduced = usePrefersReducedMotion();
  const [ref, seen] = useInView(0.4);

  return (
    <div className={`${SECTION} shrink-0 pb-8`}>
      <div ref={ref} className="border-t border-[color:var(--rule)] pt-6">
        <p className="mb-6 text-center text-[13.5px] text-[color:var(--muted)]">
          Built for a room of 200, on a link and a code
        </p>
        <div className="grid grid-cols-3 gap-x-4 gap-y-5 lg:grid-cols-6">
          {SPEC_FIGURES.map((figure) => (
            <SpecFigure key={figure.label} figure={figure} run={seen && !reduced} reduced={reduced} />
          ))}
        </div>
      </div>
    </div>
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
          Schedule it at 10:00. Everyone is graded by 10:21.
        </h1>
      </Reveal>
      <Reveal delay={120}>
        <p className="mx-auto mt-4 max-w-[520px] text-[17px] leading-[1.65] text-[color:var(--ink-2)] lg:mx-0">
          QuizLoom runs timed exams for schools and colleges. Set the window, share one link and an access code,
          then watch the room work. At the end time every open paper is scored, submitted or not.
        </p>
      </Reveal>
      <Reveal delay={180}>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
          <Link to={SIGNUP_PATH} className={BTN_DARK}>
            Create a teacher account
          </Link>
          <a href="#film" onClick={onJump("film")} className={BTN_LIGHT}>
            <Play size={16} strokeWidth={1.75} aria-hidden="true" />
            Watch a quiz run
          </a>
        </div>
        <p className="mt-5 text-[14px] text-[color:var(--muted)]">
          No student accounts. No app to install. Free during early access.
        </p>
      </Reveal>
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
    </Reveal>
  );
}

export default function Hero({ onJump }) {
  return (
    <section id="top" className="landing-hero relative flex flex-col">
      <div className={`${SECTION} flex flex-1 items-center py-10 lg:py-12`}>
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <HeroCopy onJump={onJump} />
          <HeroIllustration />
        </div>
      </div>
      <HeroSpecs />
    </section>
  );
}

// The product frame gets its own section so the hero reads as one screen, not a crowded stack.
export function ProductFilm() {
  return (
    <section id="film" className={`${SECTION} scroll-mt-24 pb-14 pt-4 lg:pb-24 lg:pt-8`}>
      <HeroFilm />
    </section>
  );
}
