import { Badge } from "@/components/ui/badge";

const LABELS = {
  tab_switch: "Tab Switch",
  window_blur: "Window Blur",
  screenshot_attempt: "Screenshot",
  copy_shortcut: "Copy Shortcut",
  copy_event: "Copy Event",
  context_menu: "Right Click"
};

const VARIANTS = {
  tab_switch: "destructive",
  screenshot_attempt: "destructive",
  window_blur: "secondary",
  copy_shortcut: "outline",
  copy_event: "outline",
  context_menu: "secondary"
};

export default function FlagBadge({ type, count = 0 }) {
  if (!count) {
    return null;
  }

  return (
    <Badge variant={VARIANTS[type] || "outline"}>
      {LABELS[type] || type} ({count})
    </Badge>
  );
}
