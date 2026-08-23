import { useEffect, useState } from "react";

import { READINESS_URLS } from "@/lib/apiBaseUrl";

import LoadingScreen from "./LoadingScreen";

const REQUEST_TIMEOUT_MS = 2500;
const POLL_INTERVAL_MS = 3000;
const LONG_WAIT_NOTICE = "This is taking longer than usual. Hang tight...";

// Every required service must report ready, not just the catch-all /health.
async function requireAllServicesReady(signal) {
  const responses = await Promise.all(
    READINESS_URLS.map((url) => fetch(url, { method: "GET", signal, cache: "no-store" }))
  );
  if (!responses.every((response) => response.ok)) {
    throw new Error("Not every service is ready");
  }
}

const LONG_WAIT_THRESHOLD_MS = 2 * 60 * 1000;

// Module-scoped so a remount of this gate never re-shows the full-screen warmup loader.
let isBackendWarm = false;

// Polls until every service answers, then stops for good. Returns the teardown.
async function isEveryServiceReady(controller) {
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    await requireAllServicesReady(controller.signal);
    return true;
  } catch {
    // A service is still cold or unreachable; the caller polls again.
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function startWarmupPolling({ onReady, onLongWait }) {
  let stopped = false;
  let controller = null;

  const stop = () => {
    stopped = true;
    window.clearInterval(intervalId);
    window.clearTimeout(longWaitId);
    controller?.abort();
    controller = null;
  };

  const pingBackend = async () => {
    if (stopped || controller || isBackendWarm) return;
    controller = new AbortController();
    const active = controller;

    if (await isEveryServiceReady(active)) {
      if (stopped) return;
      isBackendWarm = true;
      onReady();
      stop();
    }
    if (controller === active) controller = null;
  };

  const intervalId = window.setInterval(pingBackend, POLL_INTERVAL_MS);
  const longWaitId = window.setTimeout(() => {
    if (!stopped && !isBackendWarm) onLongWait();
  }, LONG_WAIT_THRESHOLD_MS);
  pingBackend();

  return stop;
}

function useBackendWarmup() {
  const [isBackendReady, setIsBackendReady] = useState(isBackendWarm);
  const [isLongWait, setIsLongWait] = useState(false);

  useEffect(() => {
    if (isBackendWarm) return undefined;
    return startWarmupPolling({
      onReady: () => setIsBackendReady(true),
      onLongWait: () => setIsLongWait(true)
    });
  }, []);

  return { isBackendReady, isLongWait };
}

export default function BackendWarmupGate({ children }) {
  const { isBackendReady, isLongWait } = useBackendWarmup();

  if (!isBackendReady) {
    return <LoadingScreen slowNotice={isLongWait ? LONG_WAIT_NOTICE : ""} />;
  }

  return children;
}
