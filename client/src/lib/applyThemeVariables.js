import { theme } from "@/theme";

const HEX_LENGTH = 6;
const DEGREES_PER_SECTOR = 60;
const FULL_TURN = 360;
const MAX_CHANNEL = 255;
const PERCENT = 100;
const FALLBACK_HSL = "0 0% 0%";

function toChannels(hex) {
  return {
    r: parseInt(hex.slice(0, 2), 16) / MAX_CHANNEL,
    g: parseInt(hex.slice(2, 4), 16) / MAX_CHANNEL,
    b: parseInt(hex.slice(4, 6), 16) / MAX_CHANNEL,
  };
}

function toHueSectors({ r, g, b }, max, delta) {
  if (delta === 0) {
    return 0;
  }
  if (max === r) {
    return ((g - b) / delta) % 6;
  }
  if (max === g) {
    return (b - r) / delta + 2;
  }
  return (r - g) / delta + 4;
}

function hexToHsl(hexColor) {
  const hex = String(hexColor || "").replace("#", "").trim();

  if (hex.length !== HEX_LENGTH) {
    return FALLBACK_HSL;
  }

  const channels = toChannels(hex);
  const max = Math.max(channels.r, channels.g, channels.b);
  const min = Math.min(channels.r, channels.g, channels.b);
  const delta = max - min;

  let hue = Math.round(toHueSectors(channels, max, delta) * DEGREES_PER_SECTOR);
  if (hue < 0) {
    hue += FULL_TURN;
  }

  const lightness = (max + min) / 2;
  let saturation = 0;
  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
  }

  return `${hue} ${(saturation * PERCENT).toFixed(1)}% ${(lightness * PERCENT).toFixed(1)}%`;
}

function buildShadcnVars() {
  return {
    "--background": hexToHsl(theme.bg.content),
    "--foreground": hexToHsl(theme.text.secondary),
    "--card": hexToHsl(theme.bg.card),
    "--card-foreground": hexToHsl(theme.text.secondary),
    "--popover": hexToHsl(theme.bg.card),
    "--popover-foreground": hexToHsl(theme.text.secondary),
    "--primary": hexToHsl(theme.bg.cta),
    "--primary-foreground": hexToHsl(theme.text.white),
    "--secondary": hexToHsl(theme.bg.muted),
    "--secondary-foreground": hexToHsl(theme.text.secondary),
    "--muted": hexToHsl(theme.bg.muted),
    "--muted-foreground": hexToHsl(theme.text.muted),
    "--accent": hexToHsl(theme.accent.tint),
    "--accent-foreground": hexToHsl(theme.accent.DEFAULT),
    "--destructive": hexToHsl(theme.status.flagged),
    "--destructive-foreground": hexToHsl(theme.text.white),
    "--border": hexToHsl(theme.border.default),
    "--input": hexToHsl(theme.border.input),
    "--ring": hexToHsl(theme.accent.DEFAULT),
  };
}

function buildSurfaceVars() {
  return {
    "--ds-bg-page": theme.bg.page,
    "--ds-bg-app": theme.bg.app,
    "--ds-bg-content": theme.bg.content,
    "--ds-bg-sidebar": theme.bg.sidebar,
    "--ds-bg-card": theme.bg.card,
    "--ds-bg-card-hover": theme.bg.cardHover,
    "--ds-bg-input": theme.bg.input,
    "--ds-bg-muted": theme.bg.muted,
    "--ds-bg-active-nav": theme.bg.activeNav,
    "--ds-bg-cta": theme.bg.cta,
    "--ds-border-default": theme.border.default,
    "--ds-border-light": theme.border.light,
    "--ds-border-input": theme.border.input,
    "--ds-shadow-app": theme.shadow.app,
    "--ds-shadow-card": theme.shadow.card,
    "--ds-shadow-tooltip": theme.shadow.tooltip,
  };
}

function buildInkVars() {
  return {
    "--ds-text-primary": theme.text.primary,
    "--ds-text-secondary": theme.text.secondary,
    "--ds-text-muted": theme.text.muted,
    "--ds-text-subtle": theme.text.subtle,
    "--ds-text-white": theme.text.white,
    "--ds-text-accent": theme.text.accent,
    "--ds-accent": theme.accent.DEFAULT,
    "--ds-accent-tint": theme.accent.tint,
    "--ds-status-active": theme.status.active,
    "--ds-status-active-tint": theme.status.activeTint,
    "--ds-status-pending": theme.status.pending,
    "--ds-status-pending-tint": theme.status.pendingTint,
    "--ds-status-flagged": theme.status.flagged,
    "--ds-status-flagged-tint": theme.status.flaggedTint,
  };
}

function buildMetricVars() {
  return {
    "--radius": theme.radius.md,
    "--ds-radius-sm": theme.radius.sm,
    "--ds-radius-md": theme.radius.md,
    "--ds-radius-lg": theme.radius.lg,
    "--ds-radius-xl": theme.radius.xl,
    "--ds-radius-xxl": theme.radius.xxl,
    "--ds-radius-full": theme.radius.full,
    "--ds-font-family": theme.font.family,
    "--ds-font-xs": theme.font.size.xs,
    "--ds-font-sm": theme.font.size.sm,
    "--ds-font-base": theme.font.size.base,
    "--ds-font-md": theme.font.size.md,
    "--ds-font-lg": theme.font.size.lg,
    "--ds-font-xl": theme.font.size.xl,
    "--ds-font-stat": theme.font.size.stat,
    "--ds-sidebar-width": theme.sidebar.width,
    "--ds-space-card-pad": theme.spacing.cardPad,
    "--ds-space-section-gap": theme.spacing.sectionGap,
    "--ds-space-row-height": theme.spacing.rowHeight,
  };
}

export function applyThemeVariables() {
  if (typeof document === "undefined") {
    return;
  }

  const rootStyle = document.documentElement.style;
  const vars = {
    ...buildShadcnVars(),
    ...buildSurfaceVars(),
    ...buildInkVars(),
    ...buildMetricVars(),
  };

  Object.entries(vars).forEach(([key, value]) => rootStyle.setProperty(key, value));

  const bodyStyle = document.body.style;
  bodyStyle.backgroundColor = theme.bg.page;
  bodyStyle.color = theme.text.secondary;
  bodyStyle.fontFamily = theme.font.family;
}
