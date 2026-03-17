import { useCallback, useEffect, useRef, useState } from "react";

function normalizeSeconds(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

export function useTimer({
  initialSeconds = 0,
  enabled = true,
  getSeconds,
  intervalMs = 1000,
  onExpire
}) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    normalizeSeconds(initialSeconds),
  );
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  const getSecondsRef = useRef(getSeconds);
  const initialSecondsRef = useRef(initialSeconds);
  const previousSecondsRef = useRef(normalizeSeconds(initialSeconds));

  const syncSeconds = useCallback(() => {
    const previousSeconds = previousSecondsRef.current;
    const nextSeconds = normalizeSeconds(
      typeof getSecondsRef.current === "function"
        ? getSecondsRef.current()
        : initialSecondsRef.current,
    );

    setSecondsLeft((prev) => (prev === nextSeconds ? prev : nextSeconds));

    if (nextSeconds > 0) {
      previousSecondsRef.current = nextSeconds;
      hasExpiredRef.current = false;
      return nextSeconds;
    }

    if (previousSeconds > 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpireRef.current?.();
    }

    previousSecondsRef.current = nextSeconds;
    return nextSeconds;
  }, []);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    getSecondsRef.current = getSeconds;
  }, [getSeconds]);

  useEffect(() => {
    initialSecondsRef.current = initialSeconds;
    const nextInitial = normalizeSeconds(initialSeconds);
    previousSecondsRef.current = nextInitial;
    hasExpiredRef.current = false;
    setSecondsLeft(nextInitial);
  }, [initialSeconds]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    syncSeconds();
    const intervalId = window.setInterval(syncSeconds, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, intervalMs, syncSeconds]);

  const reset = useCallback((nextInitialSeconds = initialSecondsRef.current) => {
    const normalized = normalizeSeconds(nextInitialSeconds);
    hasExpiredRef.current = false;
    previousSecondsRef.current = normalized;
    initialSecondsRef.current = normalized;
    setSecondsLeft(normalized);
    return normalized;
  }, []);

  return {
    seconds: secondsLeft,
    secondsLeft,
    isExpired: secondsLeft <= 0,
    reset
  };
}
