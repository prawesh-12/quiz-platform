import { useEffect, useState } from "react";

import { StatusChip, useOnScreen, usePrefersReducedMotion } from "./primitives";
import { LABEL } from "./tokens";

const STEP_MS = 1800;

const LIFECYCLE = [
  ["draft", "Written, not scheduled"],
  ["scheduled", "Window and code set"],
  ["active", "Open, counts refreshing"],
  ["ended", "Closed and fully graded"],
];

export default function LifecycleTicker() {
  const reduced = usePrefersReducedMotion();
  const [ref, onScreen] = useOnScreen(0.3);
  const [index, setIndex] = useState(2);

  useEffect(() => {
    if (reduced || !onScreen) return;
    const id = setInterval(() => setIndex((current) => (current + 1) % LIFECYCLE.length), STEP_MS);
    return () => clearInterval(id);
  }, [reduced, onScreen]);

  return (
    <div ref={ref} className="mt-10 rounded-[20px] border border-[color:var(--rule)] bg-[color:var(--panel-tint)] p-5">
      <p className={`${LABEL}`}>
        Where a quiz is, right now
      </p>
      <div className="mt-4 flex items-center gap-1.5">
        {LIFECYCLE.map(([state], position) => (
          <span
            key={state}
            style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              position <= index ? "bg-[color:var(--accent)]" : "bg-[color:var(--rule-strong)]"
            }`}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <StatusChip state={LIFECYCLE[index][0]} />
        <span className="text-[14px] text-[color:var(--ink-2)]">{LIFECYCLE[index][1]}</span>
      </div>
    </div>
  );
}
