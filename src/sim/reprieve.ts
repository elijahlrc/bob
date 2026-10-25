import { reprieveDef } from '../data/reprieves';
import { knockBack, lifeCap, refreshPlayerDefence } from './combat';
import type { World } from './types';
import type { DuelSideOpts, Side } from './side';

/** Monsters within this many tiles of a Revive are thrown back and stunned. */
export const PULSE_RADIUS = 6;
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

/**
 * A duel side's damage scale and life multiplier on the life it is on, after `fired` reprieves: that life's share of the duel's
 * modifiers (`DuelSideOpts.stages`), measured from 1, of the life bonus and of what damage is divided by. So at a share of 1.5 a
 * ×10 life is ×14.5 and a damage scale of 0.3 (÷3.33) is ÷4.5.
 */
export function duelStage(
  d: DuelSideOpts | undefined,
  fired: number,
): { damageScale: number; lifeMult: number } {
  const damageScale = d?.damageScale ?? 1;
  const lifeMult = d?.lifeMult ?? 1;
  const stages = d?.stages;
  if (!stages?.length) return { damageScale, lifeMult };
  const k = stages[Math.min(fired, stages.length - 1)];
  return {
    damageScale: 1 / (1 + k * (1 / damageScale - 1)),
    lifeMult: 1 + k * (lifeMult - 1),
  };
}

/** Whether the character cannot be hurt right now (just after a Revive). */
export const invulnerable = (s: Side): boolean => s.reprieve.invulnT > 0;

/** The seconds pass. */
export function tickReprieve(s: Side, dt: number): void {
  if (s.reprieve.invulnT > 0) s.reprieve.invulnT = Math.max(0, s.reprieve.invulnT - dt);
}

/** The next reprieve that could fire now: a Retreat does nothing on a tenth map, so on one it is passed over for a Revive. */
function nextReprieve(w: World, s: Side): string | null {
  const used = [...s.reprieve.fired];
  for (const id of s.reprieve.held) {
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
export function reprieveFires(w: World, s: Side): boolean {
  const id = nextReprieve(w, s);
  if (!id) return false;
  const def = reprieveDef(id);
  const p = s.player;
  s.reprieve.fired.push(id);
  // In a duel the next life has its own share of the duel's modifiers, so the pool it rises with is the new one.
  if (s.opts.duel?.stages) {
    Object.assign(s, duelStage(s.opts.duel, s.reprieve.fired.length));
    refreshPlayerDefence(w, s);
  }
  p.life = Math.max(1, def.life * lifeCap(p));
  p.overkill = 0;
  for (const f of s.flasks) f.charges = f.spec.maxCharges;
  if (def.family === 'retreat') {
    w.status = 'abandoned';
    w.events.push({ t: 'reprieve', src: p.id, how: 'retreat', id: def.id });
    w.events.push({ t: 'abandoned' });
    return true;
  }
  s.reprieve.invulnT = def.invuln ?? 0;
  w.events.push({ t: 'reprieve', src: p.id, how: 'revive', id: def.id });
  if (def.pulse) {
    for (const m of w.actors) {
      if (m.isPlayer || m.team !== 1 || !m.alive) continue;
      if (Math.hypot(m.x - p.x, m.y - p.y) > PULSE_RADIUS) continue;
      knockBack(w, p, m, PULSE_KNOCK);
      m.stunT = Math.max(m.stunT, PULSE_STUN);
    }
  }
  return true;
}
