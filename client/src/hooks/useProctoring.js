import { useEffect, useRef } from "react";

import { violationService } from "@/services/violationService";

const RATE_LIMIT_MS = 3000;
const SCREENSHOT_META_KEYS = ["3", "4", "5"];

// One report per type per window, so a student holding a key cannot generate hundreds of rows.
function createReporter(sessionToken, lastSentAt) {
  return (type, description) => {
    const now = Date.now();
    if (now - (lastSentAt.get(type) || 0) < RATE_LIMIT_MS) {
      return;
    }

    lastSentAt.set(type, now);
    violationService.report({ type, description }, sessionToken).catch(() => {
      // Proctoring runs silently; a failed report must never interrupt the student.
    });
  };
}

function isScreenshotShortcut(event, key) {
  if (key === "printscreen") {
    return true;
  }

  return event.metaKey && event.shiftKey && SCREENSHOT_META_KEYS.includes(key);
}

function buildKeydownHandler(report) {
  return (event) => {
    const key = String(event.key || "").toLowerCase();

    if (isScreenshotShortcut(event, key)) {
      report("screenshot_attempt", "Screenshot keyboard shortcut detected");
      return;
    }

    if ((event.ctrlKey || event.metaKey) && key === "c") {
      event.preventDefault();
      report("copy_shortcut", "Copy keyboard shortcut detected");
    }
  };
}

function buildBlockingHandler(report, type, description) {
  return (event) => {
    event.preventDefault();
    report(type, description);
  };
}

function buildListeners(report) {
  return [
    [document, "visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        report("tab_switch", "User switched to another tab or minimized the window");
      }
    }],
    [window, "blur", () => report("window_blur", "Quiz window lost focus")],
    [document, "keydown", buildKeydownHandler(report)],
    [document, "contextmenu", buildBlockingHandler(report, "context_menu", "Right click/context menu action detected")],
    [document, "copy", buildBlockingHandler(report, "copy_event", "Copy event detected")]
  ];
}

export function useProctoring({ sessionToken, enabled }) {
  const lastSentAtRef = useRef(new Map());

  useEffect(() => {
    if (!enabled || !sessionToken) {
      return undefined;
    }

    lastSentAtRef.current.clear();
    const report = createReporter(sessionToken, lastSentAtRef.current);
    const listeners = buildListeners(report);

    listeners.forEach(([target, event, handler]) => target.addEventListener(event, handler));

    return () => {
      listeners.forEach(([target, event, handler]) => target.removeEventListener(event, handler));
    };
  }, [enabled, sessionToken]);
}
