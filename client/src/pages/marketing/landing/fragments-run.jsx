import { useEffect, useState } from "react";
import Check from "lucide-react/dist/esm/icons/check";
import Copy from "lucide-react/dist/esm/icons/copy";
import Download from "lucide-react/dist/esm/icons/download";
import Flag from "lucide-react/dist/esm/icons/flag";

import { Panel, useInView, usePrefersReducedMotion } from "./primitives";
import { EASE, FOCUS, LABEL_SM, MONO } from "./tokens";

const CODE = "QK7-204";
const SHARE_LINK = "quizloom.app/quiz/enter/QK7-204";
const TYPE_MS = 80;
const COPIED_MS = 2000;
const LOG_STEP_MS = 900;

const ENTRY_FIELDS = [
  ["Name", "Aarav Shah"],
  ["Roll no.", "12A-27"],
];

function ShareRow({ copied, onCopy }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[color:var(--rule)] bg-[color:var(--panel)] px-3 py-2">
      <span className={`truncate text-[13px] ${MONO}`}>{SHARE_LINK}</span>
      <button
        type="button"
        onClick={onCopy}
        className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[12px] text-[color:var(--ink-2)] transition-colors duration-150 hover:bg-[color:var(--neutral-tint)] ${FOCUS}`}
      >
        {copied ? <Check size={14} strokeWidth={2} aria-hidden="true" /> : <Copy size={14} strokeWidth={1.5} aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function CodeField({ typed }) {
  return (
    <div className="mt-3">
      <p className={LABEL_SM}>Access code</p>
      <div
        className={`mt-1.5 flex h-10 items-center rounded-xl border border-[color:var(--rule)] bg-[color:var(--panel)] px-3 text-[15px] tracking-[0.3em] ${MONO}`}
      >
        {typed}
        {typed.length < CODE.length ? (
          <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[color:var(--ink)]" />
        ) : null}
      </div>
    </div>
  );
}

function useTypedCode() {
  const reduced = usePrefersReducedMotion();
  const [ref, seen] = useInView(0.4);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (reduced) return setTyped(CODE);
    if (!seen) return;
    let index = 0;
    const id = setInterval(() => {
      index += 1;
      setTyped(CODE.slice(0, index));
      if (index >= CODE.length) clearInterval(id);
    }, TYPE_MS);
    return () => clearInterval(id);
  }, [seen, reduced]);

  return [ref, typed];
}

export function EntryFragment() {
  const [ref, typed] = useTypedCode();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${SHARE_LINK}`);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Panel label="Student entry">
      <div ref={ref}>
        <ShareRow copied={copied} onCopy={copy} />
        <CodeField typed={typed} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ENTRY_FIELDS.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[color:var(--rule)] bg-[color:var(--panel)] px-2.5 py-1.5">
              <p className={LABEL_SM}>{label}</p>
              <p className="text-[13px] text-[color:var(--ink-2)]">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

const SAVE_LOG = [
  ["10:04:31", "Q7 answered · saved", "active"],
  ["10:07:02", "connection lost · retrying", "pending"],
  ["10:07:04", "saved", "active"],
  ["10:09:47", "refresh · 28 answers restored", "active"],
];

export function AutosaveLogFragment() {
  const reduced = usePrefersReducedMotion();
  const [ref, seen] = useInView(0.4);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduced) return setShown(SAVE_LOG.length);
    if (!seen) return;
    const id = setInterval(() => {
      setShown((current) => {
        if (current >= SAVE_LOG.length) {
          clearInterval(id);
          return current;
        }
        return current + 1;
      });
    }, LOG_STEP_MS);
    return () => clearInterval(id);
  }, [seen, reduced]);

  const tones = { active: "text-[color:var(--active)]", pending: "text-[color:var(--pending)]" };

  return (
    <Panel label="Answer log">
      <div ref={ref} className="min-h-[104px] space-y-2">
        {SAVE_LOG.slice(0, shown).map(([time, message, tone]) => (
          <div
            key={time}
            style={{ animation: reduced ? undefined : `logIn 300ms ${EASE} both` }}
            className={`flex gap-3 text-[13px] ${MONO}`}
          >
            <span className="shrink-0 tabular-nums text-[color:var(--muted)]">{time}</span>
            <span className={tones[tone]}>{message}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const FLAG_ROWS = [
  ["Roll 12", "switched tab", "10:07:14"],
  ["Roll 27", "copy shortcut", "10:11:03"],
];

const RESULT_ROWS = [
  { rank: "01", roll: "Roll 07", score: "98%", time: "14m 02s" },
  { rank: "02", roll: "Roll 21", score: "91%", time: "15m 41s" },
  { rank: "03", roll: "Roll 04", score: "88%", time: "12m 55s" },
  { rank: "41", roll: "Roll 27", score: "64%", time: "19m 58s", flagged: true },
];

export function ResultsFragment() {
  const reduced = usePrefersReducedMotion();
  const [ref, seen] = useInView(0.35);
  const run = seen || reduced;

  return (
    <Panel label="Results">
      <div ref={ref} className={`space-y-1 text-[13px] ${MONO}`}>
        {RESULT_ROWS.map((row, index) => (
          <div
            key={row.rank}
            style={{ transitionDelay: `${index * 120}ms`, transitionTimingFunction: EASE }}
            className={`flex items-center gap-3 rounded px-1.5 py-1 transition-opacity duration-[400ms] ${
              run ? "opacity-100" : "opacity-0"
            } ${row.flagged ? "bg-[color:var(--flagged-tint)] text-[color:var(--flagged)]" : ""}`}
          >
            <span className={row.flagged ? "" : "text-[color:var(--muted)]"}>{row.rank}</span>
            <span>{row.roll}</span>
            {row.flagged && <Flag size={12} strokeWidth={1.75} aria-hidden="true" />}
            <span className="ml-auto font-medium tabular-nums">{row.score}</span>
            <span className={`w-16 text-right text-[12px] tabular-nums ${row.flagged ? "" : "text-[color:var(--muted)]"}`}>
              {row.time}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-[color:var(--rule)] pt-3 text-[13px]">
        <Download size={16} strokeWidth={1.5} aria-hidden="true" className="text-[color:var(--ink-2)]" />
        <span className="font-medium text-[color:var(--ink)]">Export .xlsx</span>
        <span className={`ml-auto text-[12px] text-[color:var(--muted)]`}>roll-number order</span>
      </div>
    </Panel>
  );
}
