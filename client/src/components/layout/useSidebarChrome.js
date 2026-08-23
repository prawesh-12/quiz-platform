import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const COLLAPSED_FLAG = "1";
const WIDTH_MOBILE = "260px";
const WIDTH_COLLAPSED = "56px";
const WIDTH_EXPANDED = "220px";

function resolveWidth(isMobileViewport, isCollapsed) {
  if (isMobileViewport) {
    return WIDTH_MOBILE;
  }

  if (isCollapsed) {
    return WIDTH_COLLAPSED;
  }

  return WIDTH_EXPANDED;
}

function readCollapsed(storageKey) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(storageKey) === COLLAPSED_FLAG;
}

function readIsMobile() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useSidebarChrome(storageKey) {
  const [isMobileViewport, setIsMobileViewport] = useState(readIsMobile);
  const [isCollapsed, setIsCollapsed] = useState(() => readCollapsed(storageKey));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, isCollapsed ? COLLAPSED_FLAG : "0");
  }, [isCollapsed, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event) => setIsMobileViewport(event.matches);

    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const effectiveCollapsed = !isMobileViewport && isCollapsed;

  return {
    isMobileViewport,
    effectiveCollapsed,
    width: resolveWidth(isMobileViewport, effectiveCollapsed),
    toggleCollapsed: () => setIsCollapsed((previous) => !previous),
  };
}
