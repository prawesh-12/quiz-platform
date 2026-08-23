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

import "./landing/landing.css";

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

const SKIP_LINK =
  "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[15px] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[color:var(--accent)]";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap";

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
      className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-[color:var(--bg)] text-[color:var(--ink-2)] antialiased selection:bg-[color:var(--accent)] selection:text-white"
      style={{
        ...PALETTE,
        fontFamily: FONT_BODY,
        fontSize: "17px",
        lineHeight: 1.65,
        "--landing-wash": WASH_HERO,
        "--landing-dots": DOT_GRID
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
