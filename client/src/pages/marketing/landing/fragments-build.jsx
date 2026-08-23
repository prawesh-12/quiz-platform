import { useEffect, useState } from "react";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Check from "lucide-react/dist/esm/icons/check";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";

import { Panel, StatusChip, useInView, usePrefersReducedMotion } from "./primitives";
import { EASE, FOCUS, MONO } from "./tokens";

const WARNING_MS = 600;
const BUILDING_MS = 900;
const READY_MS = 2000;

function TreeRow({ label, note, indent = false }) {
  return (
    <div className={`flex items-center justify-between py-1.5 text-[13px] ${indent ? "pl-4" : "font-medium"}`}>
      <span className="text-[color:var(--ink)]">{label}</span>
      <span className={`text-[12px] text-[color:var(--muted)] ${MONO}`}>{note}</span>
    </div>
  );
}

export function BankImportFragment() {
  const reduced = usePrefersReducedMotion();
  const [ref, seen] = useInView(0.4);
  const [warned, setWarned] = useState(false);

  useEffect(() => {
    if (reduced) return setWarned(true);
    if (!seen) return;
    const id = setTimeout(() => setWarned(true), WARNING_MS);
    return () => clearTimeout(id);
  }, [seen, reduced]);

  return (
    <Panel label="Mathematics" className="mt-0">
      <div ref={ref}>
        <TreeRow label="Mathematics" note="2 units · 21 questions" />
        <TreeRow label="Unit 1" note="12 questions" indent />
        <TreeRow label="Unit 2" note="9 questions" indent />
        <div className="mt-3 flex items-center gap-2 border-t border-[color:var(--rule)] pt-3 text-[13px]">
          <FileSpreadsheet size={16} strokeWidth={1.5} aria-hidden="true" className="text-[color:var(--ink-2)]" />
          <span className={MONO}>question-bank.xlsx</span>
          <span className={`ml-auto text-[12px] text-[color:var(--muted)] ${MONO}`}>48 rows</span>
        </div>
        <div className={`mt-2 flex items-start gap-2 text-[13px] transition-opacity duration-[400ms] ${warned ? "opacity-100" : "opacity-0"}`}>
          <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-[color:var(--pending)]" />
          <span className="text-[color:var(--ink-2)]">Row 14, option d empty, saved with three options</span>
        </div>
      </div>
    </Panel>
  );
}

function Stepper({ unit, value, onChange }) {
  const button = `flex h-7 w-7 items-center justify-center rounded-xl border border-[color:var(--rule)] bg-[color:var(--panel)] text-[13px] text-[color:var(--ink)] transition-colors duration-150 hover:bg-[color:var(--neutral-tint)] disabled:opacity-40 ${FOCUS}`;
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[14px] text-[color:var(--ink-2)]">{unit}</span>
      <span className="flex items-center gap-2.5">
        <button type="button" className={button} onClick={() => onChange(-1)} disabled={value === 0} aria-label={`One fewer question from ${unit}`}>
          &minus;
        </button>
        <span className={`w-5 text-center text-[14px] tabular-nums ${MONO}`}>{value}</span>
        <button type="button" className={button} onClick={() => onChange(1)} aria-label={`One more question from ${unit}`}>
          +
        </button>
      </span>
    </div>
  );
}

const BUILD_LABELS = { idle: "Build draft", building: "Building…", ready: "Draft ready" };

function BuildButton() {
  const [build, setBuild] = useState("idle");

  useEffect(() => {
    if (build === "idle") return;
    const next = build === "building" ? "ready" : "idle";
    const delay = build === "building" ? BUILDING_MS : READY_MS;
    const id = setTimeout(() => setBuild(next), delay);
    return () => clearTimeout(id);
  }, [build]);

  return (
    <button
      type="button"
      onClick={() => build === "idle" && setBuild("building")}
      className={`mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-[color:var(--ink)] px-4 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[#2A2138] ${FOCUS}`}
    >
      {build === "ready" ? <Check size={14} strokeWidth={2} aria-hidden="true" /> : null}
      {BUILD_LABELS[build]}
    </button>
  );
}

export function AutoGenerateFragment() {
  const [counts, setCounts] = useState({ "Unit 1": 5, "Unit 2": 3 });
  const total = counts["Unit 1"] + counts["Unit 2"];

  const step = (unit) => (delta) =>
    setCounts((current) => ({ ...current, [unit]: Math.max(0, current[unit] + delta) }));

  return (
    <Panel label="Auto-generate">
      <Stepper unit="Unit 1" value={counts["Unit 1"]} onChange={step("Unit 1")} />
      <Stepper unit="Unit 2" value={counts["Unit 2"]} onChange={step("Unit 2")} />
      <div className="mt-2 flex items-center justify-between border-t border-[color:var(--rule)] pt-3">
        <span className="text-[12px] text-[color:var(--muted)]">bank-eligible only</span>
        <span key={total} style={{ animation: `numberIn 200ms ${EASE} both` }} className={`text-[14px] font-medium tabular-nums ${MONO}`}>
          {total} questions
        </span>
      </div>
      <BuildButton />
    </Panel>
  );
}

export function SchedulingFragment() {
  const rows = [
    ["draft", "any time"],
    ["scheduled", "code set"],
    ["active", "10:00"],
    ["ended", "10:20"],
  ];
  return (
    <Panel label="Four states">
      <div className="space-y-1">
        {rows.map(([state, when]) => (
          <div
            key={state}
            className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${
              state === "active" ? "bg-[color:var(--active-tint)]" : ""
            }`}
          >
            <StatusChip state={state} />
            <span className={`text-[12px] tabular-nums text-[color:var(--muted)] ${MONO}`}>{when}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-[color:var(--rule)] pt-3 text-[13px] leading-snug text-[color:var(--ink-2)]">
        It opens and closes itself. Nobody has to be at a laptop.
      </p>
    </Panel>
  );
}
