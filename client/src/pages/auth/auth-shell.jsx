import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import { Link } from "react-router-dom";

import { theme } from "@/theme";

const LOGO_SIZE_PX = 34;
const LOGO_ICON_PX = 17;
const CARD_RADIUS_PX = "20px";
// Pair with an inline outlineColor so the ring picks up the violet accent.
export const FOCUS_RING = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
// Same lavender-to-white wash the landing page opens with.
const PAGE_WASH = `linear-gradient(180deg, ${theme.accent.tint} 0%, ${theme.bg.page} 48%, ${theme.bg.app} 100%)`;

export function BrandMark() {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 rounded-[10px] ${FOCUS_RING}`}
      style={{ color: theme.text.primary, outlineColor: theme.accent.DEFAULT }}
    >
      <span
        className="inline-flex items-center justify-center"
        style={{
          width: LOGO_SIZE_PX,
          height: LOGO_SIZE_PX,
          borderRadius: theme.radius.md,
          background: theme.bg.cta,
          color: theme.text.white
        }}
      >
        <BookOpen width={LOGO_ICON_PX} height={LOGO_ICON_PX} aria-hidden="true" />
      </span>
      <span className="text-[19px] font-bold leading-none tracking-[-0.02em]">QuizLoom</span>
    </Link>
  );
}

function BackLink({ to, label }) {
  return (
    <Link
      to={to}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors ${FOCUS_RING}`}
      style={{
        borderColor: theme.border.default,
        backgroundColor: theme.bg.card,
        color: theme.text.secondary,
        outlineColor: theme.accent.DEFAULT
      }}
    >
      <ArrowLeft width={15} height={15} aria-hidden="true" />
      {label}
    </Link>
  );
}

export default function AuthShell({ children, backTo = "", backLabel = "Back", footer = null }) {
  return (
    <div
      className="ds-viewport-h w-full overflow-y-auto px-4 py-8 sm:py-12"
      style={{ background: PAGE_WASH, fontFamily: theme.font.family }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <BrandMark />
          {backTo ? <BackLink to={backTo} label={backLabel} /> : null}
        </div>

        <div
          className="w-full border p-6 sm:p-7"
          style={{
            borderRadius: CARD_RADIUS_PX,
            borderColor: theme.border.default,
            backgroundColor: theme.bg.card,
            boxShadow: theme.shadow.card
          }}
        >
          {children}
        </div>

        {footer}
      </div>
    </div>
  );
}
