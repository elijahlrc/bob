import { reprieveDef } from '../data/reprieves';
import { knockBack, lifeCap } from './combat';
import type { World } from './types';

/** Monsters within this many tiles of a Revive are thrown back and stunned. */
const PULSE_RADIUS = 6;
const PULSE_KNOCK = 4;
const PULSE_STUN = 1.5;

/**
 * The reprieves in a map (docs/WAYSIDE.md 7): the ones the character carries, in the order they are used; the ones that have
 * fired on this map, in order; and the seconds of safety left after a Revive.
 */
export type ReprieveState = { held: string[]; fired: string[]; invulnT: number };

export const newReprieveState = (held: readonly string[] | null | undefined): ReprieveState => ({
  held: [...(held ?? [])],
  fired: [],
  invulnT: 0,
});

/** Whether the character cannot be hurt right now (just after a Revive). */
export const invulnerable = (w: World): boolean => w.reprieve.invulnT > 0;

/** The seconds pass. */
export function tickReprieve(w: World, dt: number): void {
  if (w.reprieve.invulnT > 0) w.reprieve.invulnT = Math.max(0, w.reprieve.invulnT - dt);
}

/** The next reprieve that could fire now: a Retreat does nothing on a tenth map, so on one it is passed over for a Revive. */
function nextReprieve(w: World): string | null {
  const used = [...w.reprieve.fired];
  for (const id of w.reprieve.held) {
    const at = used.indexOf(id);
    if (at >= 0) {
      used.splice(at, 1);
      continue;
    }
    if (reprieveDef(id).family === 'retreat' && w.plan.map % 10 === 0) continue;
    return id;
  }
  return null;
}

/**
 * Damage would kill the character (docs/WAYSIDE.md 7): the next reprieve it carries fires if it can. All of them refill the
 * flasks, so that the character has a chance at what follows. A Retreat ends the map as an abandon and does nothing on a tenth
 * map; a Revive stands the character up again. Returns true when the character lives.
 */
export function reprieveFires(w: World): boolean {
  const id = nextReprieve(w);
  if (!id) return false;
  const def = reprieveDef(id);
  const p = w.player;
  w.reprieve.fired.push(id);
  p.life = Math.max(1, def.life * lifeCap(w, p));
  p.overkill = 0;
  for (const f of w.flasks) f.charges = f.spec.maxCharges;
  if (def.family === 'retreat') {
    w.status = 'abandoned';
    w.events.push({ t: 'reprieve', how: 'retreat', id: def.id });
    w.events.push({ t: 'abandoned' });
    return true;
  }
  w.reprieve.invulnT = def.invuln ?? 0;
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
