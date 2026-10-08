import { ABANDON_FROM_MAP, ABANDON_SECONDS } from '../data/constants';
import { lifeCap } from './combat';
import type { AbandonPolicy, World } from './types';

/**
 * Abandon (docs/MAPS.md section 7): the player leaves a map early and keeps what it picked up. It is not
 * available on the first four maps, on a mini-boss or boss map (every tenth), or once the exit is open.
 */
export function canAbandon(w: World): boolean {
  const map = w.plan.map;
  return w.status === 'running' && !w.exitOpen && map >= ABANDON_FROM_MAP && map % 10 !== 0;
}

/** Start the escape timer. The character keeps fighting; if it dies first, the run ends as usual. */
export function requestAbandon(w: World): boolean {
  if (w.abandonT !== null || !canAbandon(w)) return false;
  w.abandonT = ABANDON_SECONDS;
  w.events.push({ t: 'abandonStarted' });
  return true;
}

export function cancelAbandon(w: World): boolean {
  if (w.abandonT === null || w.status !== 'running') return false;
  w.abandonT = null;
  w.events.push({ t: 'abandonCancelled' });
  return true;
}

/** Called each tick after death is decided: asks the policy, runs the timer, and ends the map when it runs out. */
export function tickAbandon(w: World, dt: number): void {
  if (w.status !== 'running') return;
  if (w.abandonT === null) {
    if (w.opts.abandonPolicy?.(w)) requestAbandon(w);
    return;
  }
  // An open exit means the map is as good as cleared: stop leaving.
  if (w.exitOpen) {
    w.abandonT = null;
    return;
  }
  w.abandonT -= dt;
  if (w.abandonT <= 0) {
    w.abandonT = 0;
    w.status = 'abandoned';
    w.events.push({ t: 'abandoned' });
  }
}

/** An automatic player that leaves when its life is low: the bot's abandon policy. */
export const woundedAbandonPolicy =
  (below = 0.3): AbandonPolicy =>
  (w) =>
    w.player.life < below * lifeCap(w, w.player);
