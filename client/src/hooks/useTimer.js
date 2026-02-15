import { useCallback, useEffect, useRef, useState } from "react";

export function useTimer({ initialSeconds, enabled = true, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    hasExpiredRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (secondsLeft <= 0) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current?.();
      }
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [enabled, secondsLeft]);

  const reset = useCallback((nextInitialSeconds) => {
    hasExpiredRef.current = false;
    setSecondsLeft(nextInitialSeconds);
  }, []);

  return {
    secondsLeft,
    isExpired: secondsLeft <= 0,
    reset
  };
}
