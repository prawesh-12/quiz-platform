import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";

import { Wordmark } from "./primitives";
import { EASE, FOCUS, NAV_LINKS, SIGNIN_PATH, SIGNUP_PATH } from "./tokens";

const SHADOW_AT = 40;

function useScrolledPast(scrollRef, distance) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setPast(el.scrollTop > distance);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, distance]);
  return past;
}

function useActiveSection(scrollRef) {
  const [active, setActive] = useState("");
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const sections = NAV_LINKS.map(([id]) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { root, rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((section) => io.observe(section));
    return () => io.disconnect();
  }, [scrollRef]);
  return active;
}

function ActiveChip({ active, listRef }) {
  const [box, setBox] = useState(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const target = list.querySelector(`[data-nav="${active}"]`);
    if (!target) {
      setBox(null);
      return;
    }
    setBox({ left: target.offsetLeft, width: target.offsetWidth });
  }, [active, listRef]);

  if (!box) return null;
  return (
    <span
      aria-hidden="true"
      style={{ left: box.left, width: box.width, transitionTimingFunction: EASE }}
      className="absolute top-1/2 h-8 -translate-y-1/2 rounded-full bg-[color:var(--accent-tint)] transition-[left,width] duration-300"
    />
  );
}

function NavLinks({ active, listRef, onJump }) {
  return (
    <div ref={listRef} className="relative mx-auto hidden items-center lg:flex">
      <ActiveChip active={active} listRef={listRef} />
      {NAV_LINKS.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          data-nav={id}
          onClick={onJump(id)}
          aria-current={active === id ? "true" : undefined}
          className={`relative rounded-full px-3.5 py-2 text-[14.5px] transition-colors duration-150 ${FOCUS} ${
            active === id
              ? "font-semibold text-[color:var(--accent)]"
              : "text-[color:var(--ink-2)] hover:text-[color:var(--ink)]"
          }`}
        >
          {label}
        </a>
      ))}
    </div>
  );
}

function NavActions({ open, onToggle }) {
  return (
    <div className="ml-auto flex items-center gap-2 lg:ml-0">
      <Link
        to={SIGNIN_PATH}
        className={`hidden rounded-full px-3 py-2 text-[14.5px] font-semibold text-[color:var(--ink-2)] transition-colors duration-150 hover:text-[color:var(--ink)] sm:inline-flex ${FOCUS}`}
      >
        Sign in
      </Link>
      <Link
        to={SIGNUP_PATH}
        className={`hidden h-10 items-center rounded-full bg-[color:var(--ink)] px-4 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[#2A2138] sm:inline-flex ${FOCUS}`}
      >
        Create a teacher account
      </Link>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="landing-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--rule)] text-[color:var(--ink)] lg:hidden ${FOCUS}`}
      >
        {open ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
      </button>
    </div>
  );
}

function MobileMenu({ open, onJump }) {
  return (
    <div
      id="landing-menu"
      hidden={!open}
      className="mx-auto mt-2 max-w-[1040px] rounded-2xl border border-[color:var(--rule)] bg-white p-3 shadow-[0_12px_32px_rgba(23,18,33,.10)] lg:hidden"
    >
      {NAV_LINKS.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={onJump(id)}
          className={`block rounded-xl px-3 py-2.5 text-[16px] text-[color:var(--ink-2)] hover:bg-[color:var(--neutral-tint)] ${FOCUS}`}
        >
          {label}
        </a>
      ))}
      <div className="mt-2 flex flex-col gap-2 border-t border-[color:var(--rule)] pt-3 sm:hidden">
        <Link
          to={SIGNIN_PATH}
          className={`rounded-xl px-3 py-2.5 text-[16px] font-medium text-[color:var(--ink)] ${FOCUS}`}
        >
          Sign in
        </Link>
        <Link
          to={SIGNUP_PATH}
          className={`inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--ink)] px-4 text-[15px] font-medium text-white ${FOCUS}`}
        >
          Create a teacher account
        </Link>
      </div>
    </div>
  );
}

export default function LandingNav({ scrollRef, onJump }) {
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const scrolled = useScrolledPast(scrollRef, SHADOW_AT);
  const active = useActiveSection(scrollRef);

  const jump = (id) => (event) => {
    setOpen(false);
    onJump(id)(event);
  };

  return (
    <div className="sticky top-0 z-50 px-3 pb-2 pt-3 sm:px-4 sm:pt-4">
      <nav
        aria-label="Primary"
        className={`mx-auto flex h-14 max-w-[1040px] items-center gap-2 rounded-full border border-[color:var(--rule)] bg-white/90 pl-4 pr-2 backdrop-blur-md transition-shadow duration-300 sm:pl-5 ${
          scrolled ? "shadow-[0_1px_2px_rgba(23,18,33,.04),0_12px_32px_rgba(23,18,33,.08)]" : ""
        }`}
      >
        <a href="#top" onClick={jump("top")} className={`rounded-full ${FOCUS}`} aria-label="QuizLoom, back to top">
          <Wordmark />
        </a>
        <NavLinks active={active} listRef={listRef} onJump={jump} />
        <NavActions open={open} onToggle={() => setOpen((current) => !current)} />
      </nav>
      <MobileMenu open={open} onJump={jump} />
    </div>
  );
}
