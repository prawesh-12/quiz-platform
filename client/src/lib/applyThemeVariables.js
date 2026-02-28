import { theme } from "@/theme";

function hexToHsl(hexColor) {
  const hex = String(hexColor || "")
    .replace("#", "")
    .trim();

  if (hex.length !== 6) {
    return "0 0% 0%";
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
  }

  h = Math.round(h * 60);
  if (h < 0) {
    h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return `${h} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

function setRootVar(style, key, value) {
  style.setProperty(key, value);
}

export function applyThemeVariables() {
  if (typeof document === "undefined") {
    return;
  }

  const rootStyle = document.documentElement.style;
  const bodyStyle = document.body.style;

  const hslMap = {
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
    "--accent": hexToHsl(theme.bg.cardHover),
    "--accent-foreground": hexToHsl(theme.text.primary),
    "--destructive": hexToHsl(theme.badge.red.color),
    "--destructive-foreground": hexToHsl(theme.text.white),
    "--border": hexToHsl(theme.border.default),
    "--input": hexToHsl(theme.border.input),
    "--ring": hexToHsl(theme.bg.cta),
  };

  Object.entries(hslMap).forEach(([key, value]) => setRootVar(rootStyle, key, value));

  setRootVar(rootStyle, "--radius", theme.radius.md);
  setRootVar(rootStyle, "--ds-bg-page", theme.bg.page);
  setRootVar(rootStyle, "--ds-bg-app", theme.bg.app);
  setRootVar(rootStyle, "--ds-bg-content", theme.bg.content);
  setRootVar(rootStyle, "--ds-bg-sidebar", theme.bg.sidebar);
  setRootVar(rootStyle, "--ds-bg-card", theme.bg.card);
  setRootVar(rootStyle, "--ds-bg-card-hover", theme.bg.cardHover);
  setRootVar(rootStyle, "--ds-bg-input", theme.bg.input);
  setRootVar(rootStyle, "--ds-bg-muted", theme.bg.muted);
  setRootVar(rootStyle, "--ds-bg-active-nav", theme.bg.activeNav);
  setRootVar(rootStyle, "--ds-bg-cta", theme.bg.cta);

  setRootVar(rootStyle, "--ds-text-primary", theme.text.primary);
  setRootVar(rootStyle, "--ds-text-secondary", theme.text.secondary);
  setRootVar(rootStyle, "--ds-text-muted", theme.text.muted);
  setRootVar(rootStyle, "--ds-text-subtle", theme.text.subtle);
  setRootVar(rootStyle, "--ds-text-white", theme.text.white);
  setRootVar(rootStyle, "--ds-text-accent", theme.text.accent);

  setRootVar(rootStyle, "--ds-border-default", theme.border.default);
  setRootVar(rootStyle, "--ds-border-light", theme.border.light);
  setRootVar(rootStyle, "--ds-border-input", theme.border.input);

  setRootVar(rootStyle, "--ds-radius-sm", theme.radius.sm);
  setRootVar(rootStyle, "--ds-radius-md", theme.radius.md);
  setRootVar(rootStyle, "--ds-radius-lg", theme.radius.lg);
  setRootVar(rootStyle, "--ds-radius-xl", theme.radius.xl);
  setRootVar(rootStyle, "--ds-radius-xxl", theme.radius.xxl);
  setRootVar(rootStyle, "--ds-radius-full", theme.radius.full);

  setRootVar(rootStyle, "--ds-shadow-app", theme.shadow.app);
  setRootVar(rootStyle, "--ds-shadow-card", theme.shadow.card);
  setRootVar(rootStyle, "--ds-shadow-tooltip", theme.shadow.tooltip);

  setRootVar(rootStyle, "--ds-font-family", theme.font.family);
  setRootVar(rootStyle, "--ds-font-xs", theme.font.size.xs);
  setRootVar(rootStyle, "--ds-font-sm", theme.font.size.sm);
  setRootVar(rootStyle, "--ds-font-base", theme.font.size.base);
  setRootVar(rootStyle, "--ds-font-md", theme.font.size.md);
  setRootVar(rootStyle, "--ds-font-lg", theme.font.size.lg);
  setRootVar(rootStyle, "--ds-font-xl", theme.font.size.xl);
  setRootVar(rootStyle, "--ds-font-stat", theme.font.size.stat);

  setRootVar(rootStyle, "--ds-sidebar-width", theme.sidebar.width);
  setRootVar(rootStyle, "--ds-space-card-pad", theme.spacing.cardPad);
  setRootVar(rootStyle, "--ds-space-section-gap", theme.spacing.sectionGap);
  setRootVar(rootStyle, "--ds-space-row-height", theme.spacing.rowHeight);

  bodyStyle.backgroundColor = theme.bg.page;
  bodyStyle.color = theme.text.secondary;
  bodyStyle.fontFamily = theme.font.family;
}
