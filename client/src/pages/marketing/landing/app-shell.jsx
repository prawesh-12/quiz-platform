import CalendarClock from "lucide-react/dist/esm/icons/calendar-clock";
import Home from "lucide-react/dist/esm/icons/home";
import LibraryBig from "lucide-react/dist/esm/icons/library-big";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";

import { LogoMark } from "./primitives";
import { DISPLAY, LABEL_SM, MONO } from "./tokens";

const SUBJECTS = ["Mathematics", "Physics"];

const NAV = [
  [Home, "Home", true],
  [LibraryBig, "Quiz Library", false],
  [Sparkles, "Generate New Quiz", false],
];

function SidebarNav() {
  return (
    <div className="mt-4 space-y-0.5">
      {NAV.map(([Icon, label, current]) => (
        <div
          key={label}
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] ${
            current ? "bg-[color:var(--ink)] font-semibold text-white" : "text-[color:var(--ink-2)]"
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
        NM
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-[color:var(--ink)]">Nandini Modi</span>
        <span className={`block truncate text-[10px] text-[color:var(--muted)] ${MONO}`}>@nandini</span>
      </span>
    </div>
  );
}

// Mirrors the teacher dashboard's real chrome: rail, subject list, signed-in teacher at the foot.
function Sidebar() {
  return (
    <aside className="hidden w-[188px] shrink-0 flex-col border-r border-[color:var(--rule)] bg-[color:var(--panel-tint)] p-3 sm:flex">
      <div className="flex items-center gap-2 px-1 py-1.5">
        <LogoMark size={28} radius={8} />
        <span className={`text-[14px] font-extrabold tracking-[-0.02em] text-[color:var(--ink)] ${DISPLAY}`}>
          QuizLoom
        </span>
      </div>
      <SidebarNav />
      <p className={`mt-5 px-2.5 ${LABEL_SM}`}>Subject database</p>
      <div className="mt-1.5 space-y-0.5">
        {SUBJECTS.map((subject) => (
          <div key={subject} className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-[color:var(--ink-2)]">
            {subject}
          </div>
        ))}
      </div>
      <SidebarFooter />
    </aside>
  );
}

export default function AppShell({ title, children }) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-[color:var(--panel)] text-left">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--rule)] px-4 py-3">
          <CalendarClock size={15} strokeWidth={1.75} className="text-[color:var(--muted)]" aria-hidden="true" />
          <span className="text-[13px] font-semibold text-[color:var(--ink)]">{title}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-4">{children}</div>
      </div>
    </div>
  );
}
