import { useEffect, useState } from "react";

import { READINESS_URLS } from "@/lib/apiBaseUrl";

import LoadingScreen from "./LoadingScreen";

const REQUEST_TIMEOUT_MS = 2500;
const POLL_INTERVAL_MS = 3000;
// One short line, nudged along so a long cold start does not look frozen.
const WARMUP_STAGES = [
  { after: 0, message: "Starting QuizLoom" },
  { after: 20000, message: "Almost there" }
];

// Every required service must report ready, not just the catch-all /health.
async function requireAllServicesReady(signal) {
  const responses = await Promise.all(
    READINESS_URLS.map((url) => fetch(url, { method: "GET", signal, cache: "no-store" }))
  );
  if (!responses.every((response) => response.ok)) {
    throw new Error("Not every service is ready");
  }
}


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

function startWarmupPolling(onReady) {
  let stopped = false;
  let controller = null;

  const stop = () => {
    stopped = true;
    window.clearInterval(intervalId);
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
  pingBackend();

  return stop;
}

// Advances the on-screen wording by elapsed time, independent of the polling itself.
function useWarmupStage() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timers = WARMUP_STAGES.map((stage, index) =>
      window.setTimeout(() => setStageIndex(index), stage.after)
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  return WARMUP_STAGES[stageIndex];
}

function useBackendWarmup() {
  const [isBackendReady, setIsBackendReady] = useState(isBackendWarm);

  useEffect(() => {
    if (isBackendWarm) return undefined;
    return startWarmupPolling(() => setIsBackendReady(true));
  }, []);

  return isBackendReady;
}

export default function BackendWarmupGate({ children }) {
  const isBackendReady = useBackendWarmup();
  const stage = useWarmupStage();

  if (!isBackendReady) {
    return <LoadingScreen message={stage.message} />;
  }

  return children;
}
