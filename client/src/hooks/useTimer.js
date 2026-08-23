import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_INTERVAL_MS = 1000;
const NO_SECONDS = 0;

function normalizeSeconds(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return NO_SECONDS;
  }

  return Math.max(NO_SECONDS, Math.floor(parsed));
}

// Refs, so a caller passing fresh closures every render never restarts the interval.
function useLatestRefs({ onExpire, getSeconds, initialSeconds }) {
  const onExpireRef = useRef(onExpire);
  const getSecondsRef = useRef(getSeconds);
  const initialSecondsRef = useRef(initialSeconds);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    getSecondsRef.current = getSeconds;
  }, [getSeconds]);

  return { onExpireRef, getSecondsRef, initialSecondsRef };
}

function readSeconds(getSecondsRef, initialSecondsRef) {
  if (typeof getSecondsRef.current === "function") {
    return normalizeSeconds(getSecondsRef.current());
  }

  return normalizeSeconds(initialSecondsRef.current);
}

function useSyncSeconds(refs, tracker, setSecondsLeft) {
  return useCallback(() => {
    const previousSeconds = tracker.previousSecondsRef.current;
    const nextSeconds = readSeconds(refs.getSecondsRef, refs.initialSecondsRef);

    setSecondsLeft((prev) => (prev === nextSeconds ? prev : nextSeconds));
    tracker.previousSecondsRef.current = nextSeconds;

    if (nextSeconds > NO_SECONDS) {
      tracker.hasExpiredRef.current = false;
      return nextSeconds;
    }

    // Only the first tick that crosses zero fires onExpire, never every tick after it.
    if (previousSeconds > NO_SECONDS && !tracker.hasExpiredRef.current) {
      tracker.hasExpiredRef.current = true;
      refs.onExpireRef.current?.();
    }

    return nextSeconds;
  }, [refs, tracker, setSecondsLeft]);
}

function useResetTimer(refs, tracker, setSecondsLeft) {
  return useCallback(
    (nextInitialSeconds = refs.initialSecondsRef.current) => {
      const normalized = normalizeSeconds(nextInitialSeconds);
      tracker.hasExpiredRef.current = false;
      tracker.previousSecondsRef.current = normalized;
      refs.initialSecondsRef.current = normalized;
      setSecondsLeft(normalized);
      return normalized;
    },
    [refs, tracker, setSecondsLeft]
  );
}

function useExpiryTracker(initialSeconds) {
  const hasExpiredRef = useRef(false);
  const previousSecondsRef = useRef(normalizeSeconds(initialSeconds));
  return useMemo(() => ({ hasExpiredRef, previousSecondsRef }), []);
}

export function useTimer({
  initialSeconds = NO_SECONDS,
  enabled = true,
  getSeconds,
  intervalMs = DEFAULT_INTERVAL_MS,
  onExpire
}) {
  const [secondsLeft, setSecondsLeft] = useState(() => normalizeSeconds(initialSeconds));
  const refs = useLatestRefs({ onExpire, getSeconds, initialSeconds });
  const tracker = useExpiryTracker(initialSeconds);
  const syncSeconds = useSyncSeconds(refs, tracker, setSecondsLeft);
  const reset = useResetTimer(refs, tracker, setSecondsLeft);

  useEffect(() => {
    reset(initialSeconds);
  }, [initialSeconds, reset]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    syncSeconds();
    const intervalId = window.setInterval(syncSeconds, intervalMs);
    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs, syncSeconds]);

  return {
    seconds: secondsLeft,
    secondsLeft,
    isExpired: secondsLeft <= NO_SECONDS,
    reset
  };
}
