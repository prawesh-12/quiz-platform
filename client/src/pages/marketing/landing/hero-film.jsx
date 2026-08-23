import { useEffect, useState } from "react";

import AppShell from "./app-shell";
import { BuildBeat, MonitorBeat, ResultsBeat, ScheduleBeat, ShareBeat } from "./film-beats";
import { useOnScreen, usePrefersReducedMotion } from "./primitives";
import { EASE, SHADOW_LIFT } from "./tokens";

const BEAT_MS = 3200;

const BEATS = [
  { render: BuildBeat, title: "Generate New Quiz", caption: "Pick how many questions each unit gives" },
  { render: ScheduleBeat, title: "Schedule Quiz", caption: "Set the window on IST and an access code" },
  { render: ShareBeat, title: "Share Quiz", caption: "One link and a code, no student accounts" },
  { render: MonitorBeat, title: "Ongoing Quiz", caption: "Counts refresh every three seconds" },
  { render: ResultsBeat, title: "Quiz Responses", caption: "Open papers scored, spreadsheet ready" },
];

const RESTING_BEAT = 3;
const FRAME_FADE = "linear-gradient(to bottom, #000 calc(100% - 84px), transparent 100%)";

function BeatRail({ beat }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-1.5" role="presentation">
        {BEATS.map((item, index) => (
          <span
            key={item.title}
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

  const Current = BEATS[beat].render;

  return (
    <figure ref={ref} className="m-0 mx-auto w-full max-w-[1060px]">
      <div
        className={`relative overflow-hidden rounded-[24px] border border-[color:var(--rule)] bg-[color:var(--panel)] ${SHADOW_LIFT}`}
        style={{ maskImage: FRAME_FADE, WebkitMaskImage: FRAME_FADE }}
      >
        <div className="aspect-[4/3] w-full sm:aspect-[16/10]">
          <AppShell title={BEATS[beat].title}>
            <div key={beat} className="h-full" style={{ animation: reduced ? undefined : `heroBeatIn 320ms ${EASE} both` }}>
              <Current />
            </div>
          </AppShell>
        </div>
      </div>
      <BeatRail beat={beat} />
    </figure>
  );
}
