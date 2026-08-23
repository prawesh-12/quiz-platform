import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Gauge from "lucide-react/dist/esm/icons/gauge";
import Home from "lucide-react/dist/esm/icons/home";
import LibraryBig from "lucide-react/dist/esm/icons/library-big";
import PanelLeft from "lucide-react/dist/esm/icons/panel-left";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

import { LogoMark } from "./primitives";
import { DISPLAY, LABEL_SM, MONO } from "./tokens";

const SUBJECTS = ["Computer Network", "Operating System"];

const NAV = [
  [Home, "Home"],
  [LibraryBig, "Quiz Library"],
  [Sparkles, "Generate New Quiz"]
];

function SidebarNav({ activeNav }) {
  return (
    <div className="mt-4 space-y-0.5">
      {NAV.map(([Icon, label]) => (
        <div
          key={label}
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] ${
            label === activeNav ? "bg-[color:var(--ink)] font-semibold text-white" : "text-[color:var(--ink-2)]"
          }`}
        >
          <Icon size={15} strokeWidth={1.75} />
          {label}
        </div>
      ))}
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto flex items-center gap-2 border-t border-[color:var(--rule)] pt-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--accent)] text-[10px] font-bold text-white">
        T
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-[color:var(--ink)]">Tom</span>
        <span className={`block truncate text-[10px] text-[color:var(--muted)] ${MONO}`}>@tom</span>
      </span>
      <span className="ml-auto rounded-lg border border-[color:var(--rule)] px-2 py-1 text-[10.5px] font-semibold text-[color:var(--ink-2)]">
        Logout
      </span>
    </div>
  );
}

// Mirrors the teacher app's real chrome: rail, subject database, signed-in teacher at the foot.
function Sidebar({ activeNav, activeSubject }) {
  return (
    <aside className="hidden w-[196px] shrink-0 flex-col border-r border-[color:var(--rule)] bg-[color:var(--panel)] p-3 sm:flex">
      <div className="flex items-center gap-2 px-1 py-1.5">
        <LogoMark size={28} radius={8} />
        <span className={`text-[14px] font-extrabold tracking-[-0.02em] text-[color:var(--ink)] ${DISPLAY}`}>
          QuizLoom
        </span>
        <PanelLeft size={14} strokeWidth={1.75} aria-hidden="true" className="ml-auto text-[color:var(--muted)]" />
      </div>

      <SidebarNav activeNav={activeNav} />

      <p className={`mt-5 border-t border-[color:var(--rule)] px-2.5 pt-4 ${LABEL_SM}`}>Subject database</p>
      <div className="mt-1.5 space-y-0.5">
        {SUBJECTS.map((subject) => (
          <div
            key={subject}
            className={`rounded-lg px-2.5 py-1.5 text-[12.5px] ${
              subject === activeSubject
                ? "bg-[color:var(--ink)] font-semibold text-white"
                : "text-[color:var(--ink-2)]"
            }`}
          >
            {subject}
          </div>
        ))}
      </div>

      <SidebarFooter />
    </aside>
  );
}

function Breadcrumb({ crumb, icon: Icon }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--rule)] px-4 py-3">
      <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" className="text-[color:var(--muted)]" />
      <span className="mx-1 h-4 w-px bg-[color:var(--rule)]" aria-hidden="true" />
      <Gauge size={13} strokeWidth={1.75} aria-hidden="true" className="text-[color:var(--muted)]" />
      <span className="text-[12.5px] text-[color:var(--muted)]">Quiz Dashboard</span>
      {crumb ? (
        <>
          <ChevronRight size={13} strokeWidth={1.75} aria-hidden="true" className="text-[color:var(--muted)]" />
          <Icon size={13} strokeWidth={1.75} aria-hidden="true" className="text-[color:var(--ink)]" />
          <span className="text-[12.5px] font-semibold text-[color:var(--ink)]">{crumb}</span>
        </>
      ) : null}
    </div>
  );
}

export default function AppShell({ crumb, crumbIcon, activeNav, activeSubject, children }) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-[color:var(--panel-tint)] text-left">
      <Sidebar activeNav={activeNav} activeSubject={activeSubject} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Breadcrumb crumb={crumb} icon={crumbIcon} />
        <div className="min-h-0 flex-1 overflow-hidden p-4">{children}</div>
      </div>
    </div>
  );
}
