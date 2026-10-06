import { useEffect, useState } from 'preact/hooks';
import type { Controller } from '../run/controller';

/** Re-render on controller state changes. */
export function useControllerState(c: Controller): number {
  const [v, setV] = useState(0);
  useEffect(() => c.bus.on('state', () => setV((x) => x + 1)), [c]);
  return v;
}

/** Re-render at most `hz` times per second while the sim is ticking. */
export function useTicks(c: Controller, hz = 10): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let last = 0;
    return c.bus.on('ticked', () => {
      const now = performance.now();
      if (now - last < 1000 / hz) return;
      last = now;
      setV((x) => x + 1);
    });
  }, [c, hz]);
  return v;
}
