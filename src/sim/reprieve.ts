import { reprieveDef } from '../data/reprieves';
import { knockBack, lifeCap } from './combat';
import type { World } from './types';

/** Monsters within this many tiles of a Revive are thrown back and stunned. */
const PULSE_RADIUS = 6;
const PULSE_KNOCK = 4;
const PULSE_STUN = 1.5;

/** The state of the Reprieve in a map: the one the character holds, the one that fired, and the seconds of safety left after a Revive. */
export type ReprieveState = { held: string | null; fired: string | null; invulnT: number };

export const newReprieveState = (held: string | null | undefined): ReprieveState => ({
  held: held ?? null,
  fired: null,
  invulnT: 0,
});

/** Whether the character cannot be hurt right now (just after a Revive). */
export const invulnerable = (w: World): boolean => w.reprieve.invulnT > 0;

/** The seconds pass. */
export function tickReprieve(w: World, dt: number): void {
  if (w.reprieve.invulnT > 0) w.reprieve.invulnT = Math.max(0, w.reprieve.invulnT - dt);
}

/**
 * Damage would kill the character (docs/WAYSIDE.md 7): the held Reprieve fires if it can. A Retreat ends the map as an abandon
 * and does nothing on a tenth map; a Revive stands the character up again. Returns true when the character lives.
 */
export function reprieveFires(w: World): boolean {
  const r = w.reprieve;
  if (!r.held || r.fired) return false;
  const def = reprieveDef(r.held);
  const p = w.player;
  if (def.family === 'retreat' && w.plan.map % 10 === 0) return false;
  r.fired = def.id;
  p.life = Math.max(1, def.life * lifeCap(w, p));
  p.overkill = 0;
  if (def.family === 'retreat') {
    w.status = 'abandoned';
    w.events.push({ t: 'reprieve', how: 'retreat', id: def.id });
    w.events.push({ t: 'abandoned' });
    return true;
  }
  r.invulnT = def.invuln ?? 0;
  w.events.push({ t: 'reprieve', how: 'revive', id: def.id });
  if (def.pulse) {
    for (const m of w.actors) {
      if (m.isPlayer || m.faction !== 1 || !m.alive) continue;
      if (Math.hypot(m.x - p.x, m.y - p.y) > PULSE_RADIUS) continue;
      knockBack(w, p, m, PULSE_KNOCK);
      m.stunT = Math.max(m.stunT, PULSE_STUN);
    }
  }
  return true;
}
