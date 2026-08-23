export const PRODUCT_URL = "https://quizloom.app";
export const SIGNIN_PATH = "/login";
export const SIGNUP_PATH = "/register";
export const CONTACT_EMAIL = "hello@quizloom.app";
export const REPO_URL = "https://github.com/prawesh-12/quizloom";

export const PALETTE = {
  "--bg": "#FFFFFF",
  "--panel": "#FFFFFF",
  "--panel-tint": "#F8F6FC",
  "--rule": "#EAE5F2",
  "--rule-strong": "#D6CEE6",
  "--ink": "#171221",
  "--ink-2": "#453D57",
  "--muted": "#6E6680",
  "--accent": "#6D3BEF",
  "--accent-tint": "#EFE9FE",
  "--neutral-tint": "#F1EEF8",
  "--active": "#12715A",
  "--pending": "#A85B00",
  "--flagged": "#A32017",
  "--active-tint": "#E4F1EC",
  "--pending-tint": "#FAF1E4",
  "--flagged-tint": "#FAEAE8",
  "--tint-cream": "#FDF8EF",
  "--tint-lilac": "#F8F3FD",
  "--tint-blush": "#FDF2F8",
  "--tint-mint": "#EFF8F4",
  "--tint-sky": "#F0F4FD",
};

export const WASH_HERO = "linear-gradient(180deg, #E7D8F4 0%, #F4EDFA 34%, #FFFFFF 66%)";
export const WASH_BAND = "linear-gradient(180deg, #F4F0FA 0%, #FCFBFE 100%)";
export const WASH_CTA = "linear-gradient(0deg, #E7D8F4 0%, #FFFFFF 72%)";
export const ACCENT_GRADIENT = "linear-gradient(135deg, #8B5CF6 0%, #6D3BEF 55%, #5B2AD6 100%)";

export const FONT_BODY = "'Plus Jakarta Sans', system-ui, sans-serif";
export const DISPLAY = "[font-family:'Plus_Jakarta_Sans',system-ui,sans-serif]";
export const MONO = "[font-family:'IBM_Plex_Mono',ui-monospace,monospace]";

export const EASE = "cubic-bezier(0.2,0,0,1)";

export const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]";

export const BTN_DARK = `inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--ink)] px-5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-[#2A2138] ${FOCUS}`;
export const BTN_LIGHT = `inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[color:var(--rule)] bg-[color:var(--panel)] px-5 text-[15px] font-semibold text-[color:var(--ink)] transition-colors duration-150 hover:bg-[color:var(--neutral-tint)] ${FOCUS}`;

export const SHADOW_SOFT = "shadow-[0_1px_2px_rgba(23,18,33,.04),0_12px_32px_rgba(23,18,33,.06)]";
export const SHADOW_LIFT = "shadow-[0_24px_64px_rgba(23,18,33,.14)]";

export const CARD = `rounded-[20px] border border-[color:var(--rule)] bg-[color:var(--panel)] ${SHADOW_SOFT} transition-colors duration-150 hover:border-[color:var(--rule-strong)]`;

export const SECTION = "mx-auto max-w-[1200px] px-5 sm:px-8";
export const PAD = "py-14 md:py-16 lg:py-24";

export const H2 =
  "text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-[color:var(--ink)] sm:text-[38px] lg:text-[44px]";
export const LABEL = "text-[12px] font-semibold text-[color:var(--muted)]";
export const LABEL_SM = "text-[10.5px] font-semibold text-[color:var(--muted)]";

export const H3 = "text-[21px] font-bold leading-[1.25] tracking-[-0.015em] text-[color:var(--ink)]";

// The reference runs a small spread of chip hues rather than one accent. Keep to this set.
export const CHIP_TINTS = {
  violet: "bg-[color:var(--accent-tint)] text-[color:var(--accent)]",
  blush: "bg-[#FBE7F1] text-[#B32F74]",
  amber: "bg-[#FBEFDA] text-[#9A5A0B]",
  mint: "bg-[#E2F2EB] text-[#12715A]",
  sky: "bg-[#E6EDFC] text-[#2B4FB8]",
  neutral: "bg-[color:var(--neutral-tint)] text-[color:var(--ink-2)]",
};

export const NAV_LINKS = [
  ["how", "How it works"],
  ["features", "Features"],
  ["reliability", "Reliability"],
  ["pricing", "Pricing"],
  ["faq", "FAQ"],
];

export const HERO_PROMISES = [
  { icon: "UserX", tint: "blush", title: "No student accounts", detail: "Just a link and a code" },
  { icon: "AlarmClock", tint: "amber", title: "Starts and ends itself", detail: "Nobody has to be there" },
  { icon: "WifiOff", tint: "sky", title: "Survives a dropped wifi", detail: "Answers save every second" },
  { icon: "Flag", tint: "violet", title: "Tab switches flagged", detail: "Timestamped, per student" },
  { icon: "FileSpreadsheet", tint: "mint", title: "Results as one xlsx", detail: "In roll-number order" }
];
