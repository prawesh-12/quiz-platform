import { Link } from "react-router-dom";
import Github from "lucide-react/dist/esm/icons/github";

import { Reveal, Wordmark } from "./primitives";
import { BTN_DARK, BTN_LIGHT, DISPLAY, FOCUS, H2, LABEL, REPO_URL, SECTION, SIGNUP_PATH, WASH_CTA } from "./tokens";

const YEAR = new Date().getFullYear();

export function FinalCta({ onJump }) {
  return (
    <section style={{ backgroundImage: WASH_CTA }}>
      <div className={`${SECTION} py-14 text-center md:py-[72px] lg:py-28`}>
        <Reveal>
          <h2 className={`mx-auto max-w-[16ch] ${H2} ${DISPLAY}`}>Set Monday&apos;s quiz today.</h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[17px] leading-[1.65] text-[color:var(--ink-2)]">
            Build the bank, pick the window, send one link. The rest of the test day runs on its own.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={SIGNUP_PATH} className={BTN_DARK}>
              Create a teacher account
            </Link>
            <a href="#how" onClick={onJump("how")} className={BTN_LIGHT}>
              See how it works
            </a>
          </div>
          <p className={`mt-5 text-[14px] text-[color:var(--muted)]`}>Free during early access · no card</p>
        </Reveal>
      </div>
    </section>
  );
}

const PRODUCT_LINKS = [
  ["how", "How it works"],
  ["features", "Features"],
  ["pricing", "Pricing"],
];

const COMPANY_LINKS = [
  ["reliability", "Reliability"],
  ["faq", "FAQ"],
  ["film", "Watch a quiz run"],
];

const footerLink = `block w-fit rounded text-[14.5px] text-[color:var(--ink-2)] transition-colors duration-150 hover:text-[color:var(--ink)] ${FOCUS}`;

function FooterColumn({ title, links, onJump }) {
  return (
    <div>
      <p className={`${LABEL}`}>{title}</p>
      <div className="mt-4 space-y-2.5">
        {links.map(([id, label]) => (
          <a key={id} href={`#${id}`} onClick={onJump(id)} className={footerLink}>
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

export function Footer({ onJump }) {
  return (
    <footer className="border-t border-[color:var(--rule)]">
      <div className={`${SECTION} py-12 lg:py-16`}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 lg:grid-cols-4">
          <div className="col-span-2">
            <Wordmark />
            <p className="mt-4 max-w-[320px] text-[14.5px] leading-[1.6] text-[color:var(--ink-2)]">
              Timed online exams for schools, colleges and coaching institutes.
            </p>
          </div>

          <FooterColumn title="Product" links={PRODUCT_LINKS} onJump={onJump} />
          <FooterColumn title="More" links={COMPANY_LINKS} onJump={onJump} />
        </div>

        <div className="mt-10 flex items-center gap-3 border-t border-[color:var(--rule)] pt-6">
          <p className="text-[12.5px] text-[color:var(--muted)]">&copy; {YEAR} QuizLoom</p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="QuizLoom on GitHub"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--rule)] bg-[color:var(--panel)] text-[color:var(--ink-2)] transition-colors duration-150 hover:text-[color:var(--ink)] ml-auto ${FOCUS}`}
          >
            <Github size={17} strokeWidth={1.75} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
