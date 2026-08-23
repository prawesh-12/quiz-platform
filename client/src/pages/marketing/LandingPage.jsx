import { useCallback, useEffect, useRef, useState } from "react";

import { HeroBackdrop } from "./landing/hero-decor";
import Hero, { ProductFilm } from "./landing/hero";
import LandingNav from "./landing/nav";
import { usePrefersReducedMotion } from "./landing/primitives";
import { FinalCta, Footer } from "./landing/sections-close";
import { Features, Limits, Roles, Touchpoints } from "./landing/sections-product";
import { Faq, Pricing, Reliability } from "./landing/sections-proof";
import { Bento, Positioning, Steps } from "./landing/sections-story";
import { FONT_BODY, PALETTE, PRODUCT_URL, WASH_HERO } from "./landing/tokens";

const TITLE = "QuizLoom, scheduled online exams for schools and colleges";
const DESCRIPTION =
  "Run timed online exams for schools and colleges. Share one link and an access code, and every open paper is graded at the end time.";
const OG_IMAGE = `${PRODUCT_URL}/media/og-image.png`;

const META = [
  ["name", "description", DESCRIPTION],
  ["property", "og:type", "website"],
  ["property", "og:title", TITLE],
  ["property", "og:description", DESCRIPTION],
  ["property", "og:url", PRODUCT_URL],
  ["property", "og:image", OG_IMAGE],
  ["property", "og:image:width", "1200"],
  ["property", "og:image:height", "630"],
  ["name", "twitter:card", "summary_large_image"],
  ["name", "twitter:title", TITLE],
  ["name", "twitter:description", DESCRIPTION],
  ["name", "twitter:image", OG_IMAGE],
];

const DOT_GRID = "radial-gradient(circle, rgba(109,59,239,.30) 1px, transparent 1px)";
const DOT_SIZE = "24px 24px";

const SKIP_LINK =
  "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[15px] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[color:var(--accent)]";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap";

const KEYFRAMES = `
@keyframes heroBeatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* svh is the viewport with the mobile URL bar showing, so the hero never clips or jumps. */
/* Two layers: the dot grid runs the whole page, the wash covers only the first screen. */
[data-landing] {
  background-image: ${DOT_GRID}, ${WASH_HERO};
  background-repeat: repeat, no-repeat;
  background-attachment: local, local;
  background-size: ${DOT_SIZE}, 100% calc(100vh + 120px);
}
.landing-hero { min-height: calc(100vh - 80px); }
.landing-backdrop { height: calc(100vh + 120px); }
@supports (height: 100svh) {
  [data-landing] { background-size: ${DOT_SIZE}, 100% calc(100svh + 120px); }
  .landing-hero { min-height: calc(100svh - 80px); }
  .landing-backdrop { height: calc(100svh + 120px); }
}
@keyframes numberIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes logIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes floatChip { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
@keyframes livePulse { 0% { transform: scale(1); opacity: .7; } 70% { transform: scale(2.4); opacity: 0; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  [data-landing] *, [data-landing] *::before, [data-landing] *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

function useDocumentHead() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = TITLE;

    const added = [];
    const addTag = (tag, attrs) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      document.head.appendChild(el);
      added.push(el);
    };

    META.forEach(([attr, key, content]) => addTag("meta", { [attr]: key, content }));
    addTag("link", { rel: "canonical", href: PRODUCT_URL });
    addTag("link", { rel: "preconnect", href: "https://fonts.googleapis.com" });
    addTag("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" });
    addTag("link", { rel: "stylesheet", href: FONT_HREF });
    addTag("style", {});
    added[added.length - 1].textContent = KEYFRAMES;

    return () => {
      document.title = previousTitle;
      added.forEach((el) => el.remove());
    };
  }, []);
}

function LandingSections({ onJump, openFaq, onOpenFaq }) {
  return (
    <main id="main">
      <Hero onJump={onJump} />
      <ProductFilm />
      <Positioning onJump={onJump} />
      <Bento />
      <Steps onJump={onJump} />
      <Features onJump={onJump} onOpenFaq={onOpenFaq} />
      <Touchpoints />
      <Roles />
      <Limits />
      <Reliability />
      <Pricing />
      <Faq open={openFaq} onOpen={onOpenFaq} />
      <FinalCta onJump={onJump} />
    </main>
  );
}

export default function LandingPage() {
  const scrollRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [openFaq, setOpenFaq] = useState(0);
  useDocumentHead();

  const jump = useCallback(
    (id) => (event) => {
      event.preventDefault();
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    },
    [reduced]
  );

  return (
    <div
      ref={scrollRef}
      data-landing=""
      className="fixed inset-0 overflow-y-auto bg-[color:var(--bg)] text-[color:var(--ink-2)] antialiased selection:bg-[color:var(--accent)] selection:text-white"
      style={{
        ...PALETTE,
        fontFamily: FONT_BODY,
        fontSize: "17px",
        lineHeight: 1.65,
      }}
    >
      <a href="#main" onClick={jump("main")} className={SKIP_LINK}>
        Skip to content
      </a>
      <HeroBackdrop />
      <LandingNav scrollRef={scrollRef} onJump={jump} />
      <LandingSections onJump={jump} openFaq={openFaq} onOpenFaq={setOpenFaq} />
      <Footer onJump={jump} />
    </div>
  );
}
