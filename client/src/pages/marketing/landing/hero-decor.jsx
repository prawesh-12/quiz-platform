import Check from "lucide-react/dist/esm/icons/check";
import Timer from "lucide-react/dist/esm/icons/timer";

import { MONO, SHADOW_SOFT } from "./tokens";

// Depth behind the hero: two soft colour fields and a dot grid that fades before the edges.
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="landing-backdrop pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden">
      <span className="absolute -left-32 -top-24 h-[460px] w-[460px] rounded-full bg-[#C9A9F5] opacity-40 blur-[120px]" />
      <span className="absolute -right-24 top-[6%] h-[420px] w-[420px] rounded-full bg-[#F5C6E3] opacity-35 blur-[120px]" />
      <span className="absolute bottom-[-12%] left-1/3 h-[360px] w-[360px] rounded-full bg-[#BFD4FA] opacity-30 blur-[120px]" />
    </div>
  );
}

function Chip({ children, className, delay }) {
  return (
    <span
      style={{ animation: `floatChip 7s ease-in-out ${delay} infinite` }}
      className={`absolute hidden items-center gap-2 rounded-full border border-[color:var(--rule)] bg-white/90 py-2 pl-2.5 pr-3.5 backdrop-blur-sm lg:inline-flex ${SHADOW_SOFT} ${className}`}
    >
      {children}
    </span>
  );
}

// Illustrative counts, matching the numbers used everywhere else on the page.
export function FloatingChips() {
  return (
    <>
      <Chip className="-left-6 top-6" delay="0s">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span
            style={{ animation: "livePulse 2s ease-out infinite" }}
            className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--active)] opacity-70"
          />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[color:var(--active)]" />
        </span>
        <span className="text-[13px] font-semibold text-[color:var(--ink)]">Quiz active</span>
        <span className={`text-[12px] tabular-nums text-[color:var(--muted)] ${MONO}`}>14:06</span>
      </Chip>

      <Chip className="-right-5 top-1/2" delay="1.4s">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--active-tint)]">
          <Check size={13} strokeWidth={2.5} aria-hidden="true" className="text-[color:var(--active)]" />
        </span>
        <span className="text-[13px] font-semibold text-[color:var(--ink)]">
          178
          <span className="font-normal text-[color:var(--muted)]"> / 200 submitted</span>
        </span>
      </Chip>

      <Chip className="-left-10 bottom-8" delay="2.8s">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-tint)]">
          <Timer size={13} strokeWidth={2.25} aria-hidden="true" className="text-[color:var(--accent)]" />
        </span>
        <span className="text-[13px] font-semibold text-[color:var(--ink)]">
          22 open papers
          <span className="font-normal text-[color:var(--muted)]"> auto-scored</span>
        </span>
      </Chip>
    </>
  );
}
