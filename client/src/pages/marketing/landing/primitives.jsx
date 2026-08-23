import { useEffect, useRef, useState } from "react";
import BookOpen from "lucide-react/dist/esm/icons/book-open";

import { CHIP_TINTS, DISPLAY, EASE, H2, LABEL } from "./tokens";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (event) => setReduced(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Fires once, then disconnects. Motion on this page never repeats on re-entry.
export function useInView(threshold = 0.25, rootMargin = "0px") {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold, rootMargin]);
  return [ref, seen];
}

// Toggles, unlike useInView. Loops that keep running off-screen burn battery for nobody.
export function useOnScreen(threshold = 0.3) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible];
}

export function Reveal({ children, delay = 0, lift = "translate-y-3", margin = "0px", className = "" }) {
  const reduced = usePrefersReducedMotion();
  const [ref, seen] = useInView(0.12, margin);
  const shown = reduced || seen;
  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms", transitionTimingFunction: EASE }}
      className={`transition-[opacity,transform] duration-[450ms] ${
        shown ? "translate-y-0 scale-100 opacity-100" : `${lift} opacity-0`
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-[color:var(--neutral-tint)] text-[color:var(--ink-2)]",
    violet: "bg-[color:var(--accent-tint)] text-[color:var(--accent)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function IconChip({ icon: Icon, tint = "violet", size = 36 }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${CHIP_TINTS[tint]}`}
    >
      <Icon size={size >= 48 ? 22 : 20} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}

export function SectionHead({ eyebrow, title, lede, align = "center", tone = "neutral", children }) {
  const centred = align === "center";
  return (
    <Reveal className={centred ? "mx-auto max-w-[760px] text-center" : "max-w-[560px]"}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2 className={`mt-4 ${H2} ${DISPLAY}`}>{title}</h2>
      {lede && (
        <p className={`mt-4 text-[17px] leading-[1.65] text-[color:var(--ink-2)] ${centred ? "mx-auto max-w-[620px]" : ""}`}>
          {lede}
        </p>
      )}
      {children}
    </Reveal>
  );
}

// The product's own mark: a BookOpen glyph on a dark tile, same as both sidebars and the loader.
export function LogoMark({ size = 32, radius = 9 }) {
  return (
    <span
      style={{ width: size, height: size, borderRadius: radius }}
      className="inline-flex shrink-0 items-center justify-center bg-[color:var(--ink)] text-white"
    >
      <BookOpen size={Math.round(size * 0.55)} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

export function Wordmark({ size = 32, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-[color:var(--ink)] ${className}`}>
      <LogoMark size={size} />
      <span className={`text-[19px] font-extrabold tracking-[-0.03em] ${DISPLAY}`}>QuizLoom</span>
    </span>
  );
}

export function StatusChip({ state }) {
  const styles = {
    draft: "border border-[color:var(--rule)] bg-[color:var(--panel)] text-[color:var(--muted)]",
    scheduled: "border border-[color:var(--rule)] bg-[color:var(--panel)] text-[color:var(--ink)]",
    active: "bg-[color:var(--active)] text-white",
    ended: "bg-[color:var(--ink)] text-white",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em] ${styles[state]}`}
    >
      {state === "active" && <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />}
      {state}
    </span>
  );
}

export function Panel({ label, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-[color:var(--rule)] bg-[color:var(--panel-tint)] p-4 ${className}`}
    >
      {label && (
        <p className={`mb-3 ${LABEL}`}>{label}</p>
      )}
      {children}
    </div>
  );
}
