import { useCallback, useEffect, useRef, useState } from "react";

import Hero, { SpecStrip } from "./landing/hero";
import LandingNav from "./landing/nav";
import { usePrefersReducedMotion } from "./landing/primitives";
import { FinalCta, Footer } from "./landing/sections-close";
import { Features, Limits, Roles, Touchpoints } from "./landing/sections-product";
import { Faq, Pricing, Reliability } from "./landing/sections-proof";
import { Bento, Positioning, Steps } from "./landing/sections-story";
import { FONT_BODY, PALETTE, PRODUCT_URL } from "./landing/tokens";

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

const SKIP_LINK =
  "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[15px] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[color:var(--accent)]";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

const KEYFRAMES = `
@keyframes heroBeatIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes numberIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes logIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
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
      <SpecStrip />
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
      style={{ ...PALETTE, fontFamily: FONT_BODY, fontSize: "17px", lineHeight: 1.65 }}
    >
      <a href="#main" onClick={jump("main")} className={SKIP_LINK}>
        Skip to content
      </a>
      <LandingNav scrollRef={scrollRef} onJump={jump} />
      <LandingSections onJump={jump} openFaq={openFaq} onOpenFaq={setOpenFaq} />
      <Footer onJump={jump} />
    </div>
  );
}
