import BookOpen from "lucide-react/dist/esm/icons/book-open";

import { theme } from "@/theme";

const LOGO_SIZE_PX = 36;
const ICON_SIZE_PX = 18;
const SPINNER_SIZE_PX = 32;
const SPINNER_BORDER_PX = 3;
// Mirrors the landing page's lavender-to-white wash so the boot screen feels continuous.
const PAGE_WASH = `linear-gradient(180deg, ${theme.accent.tint} 0%, ${theme.bg.page} 55%, ${theme.bg.app} 100%)`;

export default function LoadingScreen({ message = "Loading" }) {
  return (
    <div
      className="ds-viewport-h flex w-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: PAGE_WASH, fontFamily: theme.font.family }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5">
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
          <BookOpen width={ICON_SIZE_PX} height={ICON_SIZE_PX} aria-hidden="true" />
        </span>
        <span
          className="leading-none"
          style={{ fontSize: "20px", fontWeight: 700, color: theme.text.primary, letterSpacing: "-0.3px" }}
        >
          QuizLoom
        </span>
      </div>

      <div
        className="mt-6 animate-spin rounded-full"
        style={{
          width: SPINNER_SIZE_PX,
          height: SPINNER_SIZE_PX,
          borderWidth: SPINNER_BORDER_PX,
          borderStyle: "solid",
          borderColor: theme.border.default,
          borderTopColor: theme.accent.DEFAULT
        }}
        aria-hidden="true"
      />

      <p className="mt-4 text-[13px] font-medium" style={{ color: theme.text.secondary }}>
        {message}
      </p>
    </div>
  );
}
