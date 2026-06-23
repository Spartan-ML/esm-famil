"use client";

import { useEffect, useState, useRef } from "react";

export function useTimer(seconds: number | null, active: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState<number | null>(seconds);
  const expireFired = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    expireFired.current = false;
  }, [seconds]);

  useEffect(() => {
    if (!active || remaining === null) return;
    if (remaining <= 0) {
      if (!expireFired.current) {
        expireFired.current = true;
        onExpire();
      }
      return;
    }
    const id = setTimeout(() => setRemaining((r) => (r !== null ? r - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [active, remaining, onExpire]);

  const pct = seconds && remaining !== null ? (remaining / seconds) * 100 : 100;
  return { remaining, pct };
}
