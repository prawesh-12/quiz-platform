import { Link } from "react-router-dom";
import Play from "lucide-react/dist/esm/icons/play";

import HeroFilm from "./hero-film";
import { Eyebrow, Reveal, useCountUp, useInView, usePrefersReducedMotion } from "./primitives";
import { BTN_DARK, BTN_LIGHT, DISPLAY, MONO, SECTION, SHADOW_LIFT, SIGNUP_PATH, SPEC_FIGURES, WASH_HERO } from "./tokens";

function SpecFigure({ figure, run, reduced }) {
  const value = useCountUp(figure.value, run);
  return (
    <div className="text-center">
      <p className={`text-[28px] font-medium leading-none tabular-nums text-[color:var(--ink)] ${MONO}`}>
        {reduced ? figure.value : value}
        <span className="text-[color:var(--muted)]">{figure.suffix}</span>
      </p>
      <p className="mt-2 text-[13px] leading-snug text-[color:var(--muted)]">{figure.label}</p>
    </div>
  );
}

export function SpecStrip() {
  const reduced = usePrefersReducedMotion();
  const [ref, seen] = useInView(0.4);
  return (
    <section aria-label="What QuizLoom is built for" className={`${SECTION} pb-14 pt-10 lg:pb-20`}>
      <div ref={ref} className="rounded-[28px] border border-[color:var(--rule)] bg-[color:var(--panel-tint)] px-6 py-10">
        <p className="text-center text-[15px] font-medium text-[color:var(--ink-2)]">
          Built for a room of 200, on a link and a code
        </p>
        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
          {SPEC_FIGURES.map((figure) => (
            <SpecFigure key={figure.label} figure={figure} run={seen && !reduced} reduced={reduced} />
          ))}
        </div>
      </div>
    </section>
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
    <Reveal delay={120}>
      <div
        className={`mx-auto max-w-[300px] overflow-hidden rounded-[28px] border border-[color:var(--rule)] bg-[color:var(--panel)] lg:max-w-[440px] lg:-translate-y-3 ${SHADOW_LIFT}`}
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
    <section id="top" className="relative" style={{ backgroundImage: WASH_HERO }}>
      <div className={`${SECTION} pb-10 pt-10 sm:pt-14`}>
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <HeroCopy onJump={onJump} />
          <HeroIllustration />
        </div>
      </div>
      <div id="film" className={`${SECTION} scroll-mt-24 pb-2`}>
        <HeroFilm />
      </div>
    </section>
  );
}
