import { theme } from "@/theme";

// Green/amber/red are reserved for quiz lifecycle state; everything else stays neutral.
export function getQuizStatusTone(status) {
  if (status === "active") {
    return { label: "ONGOING", bg: theme.status.activeTint, color: theme.status.active };
  }

  if (status === "scheduled") {
    return { label: "SCHEDULED", bg: theme.status.pendingTint, color: theme.status.pending };
  }

  if (status === "ended") {
    return { label: "ENDED", bg: theme.status.flaggedTint, color: theme.status.flagged };
  }

  return {
    label: String(status || "draft").toUpperCase(),
    bg: theme.bg.input,
    color: theme.text.muted,
  };
}
