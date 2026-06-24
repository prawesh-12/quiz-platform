import { useEffect, useRef, useState } from "react";

import { READINESS_URLS } from "@/lib/apiBaseUrl";

import LoadingScreen from "./LoadingScreen";

const REQUEST_TIMEOUT_MS = 2500;
const POLL_INTERVAL_MS = 3000;
const LONG_WAIT_THRESHOLD_MS = 2 * 60 * 1000;

export default function BackendWarmupGate({ children }) {
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isLongWait, setIsLongWait] = useState(false);
  const isBackendReadyRef = useRef(false);
  const intervalRef = useRef(null);
  const activeRequestRef = useRef(null);
  const longWaitTimeoutRef = useRef(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    let isUnmounted = false;

    const clearActiveRequest = () => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
        activeRequestRef.current = null;
      }
      isCheckingRef.current = false;
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (longWaitTimeoutRef.current) {
        window.clearTimeout(longWaitTimeoutRef.current);
        longWaitTimeoutRef.current = null;
      }

      clearActiveRequest();
    };

    const pingBackend = async () => {
      if (isUnmounted || isCheckingRef.current || isBackendReadyRef.current) {
        return;
      }

      isCheckingRef.current = true;
      const controller = new AbortController();
      activeRequestRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        // Every required service must report ready, not just the catch-all (exam) /health.
        const responses = await Promise.all(
          READINESS_URLS.map((url) =>
            fetch(url, { method: "GET", signal: controller.signal, cache: "no-store" })
          )
        );

        if (responses.every((response) => response.ok) && !isUnmounted) {
          isBackendReadyRef.current = true;
          setIsBackendReady(true);
          stopPolling();
        }
      } catch {
        // A service is still cold or unreachable; keep polling until all are ready.
      } finally {
        window.clearTimeout(timeoutId);
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
        }
        isCheckingRef.current = false;
      }
    };

    intervalRef.current = window.setInterval(pingBackend, POLL_INTERVAL_MS);
    longWaitTimeoutRef.current = window.setTimeout(() => {
      if (!isUnmounted && !isBackendReadyRef.current) {
        setIsLongWait(true);
      }
    }, LONG_WAIT_THRESHOLD_MS);
    pingBackend();

    return () => {
      isUnmounted = true;
      stopPolling();
    };
  }, []);

  if (!isBackendReady) {
    return (
      <LoadingScreen
        slowNotice={
          isLongWait ? "Server is taking longer than expected. Still trying to wake it up..." : ""
        }
      />
    );
  }

  return children;
}
