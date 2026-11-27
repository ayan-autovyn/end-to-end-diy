import { useEffect, useState } from "react";

export const AI_CALL_WAIT_MS = 120_000;

/** Use a deadline so delayed browser ticks never extend the simulated call wait. */
export function useAiCallCountdown(enabled: boolean) {
  const [secondsLeft, setSecondsLeft] = useState(AI_CALL_WAIT_MS / 1000);

  useEffect(() => {
    if (!enabled) return;
    const dueAt = Date.now() + AI_CALL_WAIT_MS;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((dueAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [enabled]);

  return secondsLeft;
}