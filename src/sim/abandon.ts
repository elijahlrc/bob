import { ABANDON_FROM_MAP, ABANDON_SECONDS, AUTO_ABANDON_AFTER } from '../data/constants';
import { CRESCENDO_LIMIT } from '../data/mapTypes';
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
  if (w.abandonT === null || w.abandonAuto || w.status !== 'running') return false;
  w.abandonT = null;
  w.events.push({ t: 'abandonCancelled' });
  return true;
}

/** Called each tick after death is decided: asks the policy, runs the timer, and ends the map when it runs out. */
export function tickAbandon(w: World, dt: number): void {
  if (w.status !== 'running') return;
  // A Crescendo map pulls the character out when its time is up, as an abandon (docs/MAPS.md 9.1).
  if (w.plan.type === 'crescendo' && w.t >= CRESCENDO_LIMIT && !w.exitOpen) {
    w.status = 'abandoned';
    w.events.push({ t: 'abandoned' });
    return;
  }
  if (w.abandonT === null) {
    // A map that drags on is left whatever kind it is (the first four, a mini-boss): the way out for a character that is
    // stuck. The usual few seconds of fighting on, and it cannot be called off. A map whose exit is open is nearly done.
    if (
      w.t >= (w.opts.autoAbandonAt ?? AUTO_ABANDON_AFTER) &&
      !w.exitOpen &&
      w.plan.type !== 'crescendo'
    ) {
      w.abandonT = ABANDON_SECONDS;
      w.abandonAuto = true;
      w.events.push({ t: 'abandonStarted' });
      return;
    }
    if (w.opts.abandonPolicy?.(w)) requestAbandon(w);
    return;
  }
  // An open exit means the map is as good as cleared: stop leaving.
  if (w.exitOpen) {
    w.abandonT = null;
    w.abandonAuto = false;
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
