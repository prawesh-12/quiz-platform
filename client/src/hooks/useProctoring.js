import { useEffect, useRef } from "react";

import { violationService } from "@/services/violationService";

const RATE_LIMIT_MS = 3000;

export function useProctoring({ sessionToken, enabled }) {
  const lastSentAtRef = useRef(new Map());

  useEffect(() => {
    if (!enabled || !sessionToken) {
      return undefined;
    }

    lastSentAtRef.current.clear();

    const reportViolation = (type, description) => {
      const now = Date.now();
      const previousSentAt = lastSentAtRef.current.get(type) || 0;

      if (now - previousSentAt < RATE_LIMIT_MS) {
        return;
      }

      lastSentAtRef.current.set(type, now);
      violationService.report({ type, description }, sessionToken).catch(() => {
        // Proctoring runs silently; reporting failures are intentionally ignored client-side.
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        reportViolation("tab_switch", "User switched to another tab or minimized the window");
      }
    };

    const onBlur = () => {
      reportViolation("window_blur", "Quiz window lost focus");
    };

    const onKeydown = (event) => {
      const key = String(event.key || "").toLowerCase();
      const hasCtrlOrMeta = event.ctrlKey || event.metaKey;

      if (key === "printscreen" || (event.metaKey && event.shiftKey && ["3", "4", "5"].includes(key))) {
        reportViolation("screenshot_attempt", "Screenshot keyboard shortcut detected");
        return;
      }

      if (hasCtrlOrMeta && key === "c") {
        event.preventDefault();
        reportViolation("copy_shortcut", "Copy keyboard shortcut detected");
      }
    };

    const onContextMenu = (event) => {
      event.preventDefault();
      reportViolation("context_menu", "Right click/context menu action detected");
    };

    const onCopy = (event) => {
      event.preventDefault();
      reportViolation("copy_event", "Copy event detected");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopy);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopy);
    };
  }, [enabled, sessionToken]);
}
