import { useEffect, useState } from "react";
import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

import AppShell from "./app-shell";
import { BuilderBeat, DashboardBeat, MonitorBeat, ResponsesBeat } from "./film-beats";
import { useOnScreen, usePrefersReducedMotion } from "./primitives";
import { EASE, SHADOW_LIFT } from "./tokens";

const BEAT_MS = 2600;
const RESTING_BEAT = 2;
const FRAME_FADE = "linear-gradient(to bottom, #000 calc(100% - 72px), transparent 100%)";

const BEATS = [
  {
    render: DashboardBeat,
    activeNav: "Home",
    caption: "Every quiz, every attempt, on one dashboard"
  },
  {
    render: BuilderBeat,
    crumb: "Generate New Quiz",
    crumbIcon: Sparkles,
    activeNav: "Generate New Quiz",
    caption: "Write the paper or import it from a spreadsheet"
  },
  {
    render: MonitorBeat,
    crumb: "Ongoing Quizzes",
    crumbIcon: CalendarClock,
    activeNav: "Home",
    caption: "Counts refresh every three seconds while the room writes"
  },
  {
    render: ResponsesBeat,
    crumb: "Quiz Responses",
    crumbIcon: GraduationCap,
    activeNav: "Home",
    caption: "Open papers scored, flags listed, spreadsheet ready"
  }
];

function BeatRail({ beat }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-1.5" role="presentation">
        {BEATS.map((item, index) => (
          <span
            key={item.caption}
            style={{ transitionTimingFunction: EASE }}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === beat ? "w-7 bg-[color:var(--accent)]" : "w-3 bg-[color:var(--rule-strong)]"
            }`}
          />
        ))}
      </div>
      <p className="text-[13.5px] text-[color:var(--muted)]" aria-live="off">
        {BEATS[beat].caption}
      </p>
    </div>
  );
}

export default function HeroFilm() {
  const reduced = usePrefersReducedMotion();
  const [ref, onScreen] = useOnScreen(0.2);
  const [beat, setBeat] = useState(RESTING_BEAT);

  const running = onScreen && !reduced;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setBeat((current) => (current + 1) % BEATS.length), BEAT_MS);
    return () => clearInterval(id);
  }, [running]);

  const current = BEATS[beat];
  const Current = current.render;

  return (
    <figure ref={ref} className="m-0 mx-auto w-full max-w-[1100px]">
      <div
        className={`relative overflow-hidden rounded-[24px] border border-[color:var(--rule)] bg-[color:var(--panel)] ${SHADOW_LIFT}`}
        style={{ maskImage: FRAME_FADE, WebkitMaskImage: FRAME_FADE }}
      >
        <div className="aspect-[3/4] w-full sm:aspect-[16/10]">
          <AppShell
            crumb={current.crumb}
            crumbIcon={current.crumbIcon}
            activeNav={current.activeNav}
            activeSubject="Computer Network"
          >
            <div key={beat} className="h-full" style={{ animation: reduced ? undefined : `heroBeatIn 220ms ${EASE} both` }}>
              <Current />
            </div>
          </AppShell>
        </div>
      </div>
      <BeatRail beat={beat} />
    </figure>
  );
}
