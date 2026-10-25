import type { Actor, World } from './types';

/**
 * What a character gets back besides its own regeneration (leech, life and mana on hit or kill, a relic's mending, a drain, a flask,
 * a trigger) as one cue for the renderer (docs/VISUAL_LANGUAGE.md, "Recovery"). The sites that give something back note the amount
 * here; once a moment (`tickRecover`) what has gathered becomes a `recover` event, if it is a share of the pool worth showing. A
 * steady leech therefore reads as a faint stream, a flask or a big kill as a burst, and a trickle shows nothing. It changes no number.
 */
export type RecoverPool = 'life' | 'es' | 'mana';

const POOLS: readonly RecoverPool[] = ['life', 'es', 'mana'];

/** The share of a pool that has to gather before a cue is made, and the least time between two cues for a pool (seconds). */
export const RECOVER_SHARE = 0.015;
export const RECOVER_GAP = 0.35;
/** Gathered recovery that nothing has added to for this long is forgotten (seconds). */
const RECOVER_FORGET = 1;

type Gather = {
  sum: Record<RecoverPool, number>;
  fresh: Record<RecoverPool, boolean>;
  idle: Record<RecoverPool, number>;
  last: Record<RecoverPool, number>;
};

const gathers = new WeakMap<Actor, Gather>();

function gatherOf(p: Actor): Gather {
  let g = gathers.get(p);
  if (!g) {
    g = {
      sum: { life: 0, es: 0, mana: 0 },
      fresh: { life: false, es: false, mana: false },
      idle: { life: 0, es: 0, mana: 0 },
      last: { life: -9, es: -9, mana: -9 },
    };
    gathers.set(p, g);
  }
  return g;
}

/** A character got back `amount` of a pool (what was really added, after the cap). */
export function noteRecover(p: Actor, pool: RecoverPool, amount: number): void {
  if (!p.isPlayer || !(amount > 0)) return;
  const g = gatherOf(p);
  g.sum[pool] += amount;
  g.fresh[pool] = true;
}

const maxOf = (p: Actor, pool: RecoverPool): number =>
  pool === 'life' ? p.def.maxLife : pool === 'es' ? p.def.maxEs : p.def.maxMana;

/** Once a tick, for a character: make a `recover` event of what has gathered, if it is enough and the pool has not just had one. */
export function tickRecover(w: World, p: Actor, dt: number): void {
  const g = gathers.get(p);
  if (!g) return;
  for (const pool of POOLS) {
    const sum = g.sum[pool];
    if (sum <= 0) continue;
    const max = maxOf(p, pool);
    if (max <= 0) {
      g.sum[pool] = 0;
      continue;
    }
    if (sum / max >= RECOVER_SHARE && w.t - g.last[pool] >= RECOVER_GAP) {
      w.events.push({ t: 'recover', src: p.id, pool, pct: Math.min(1, sum / max) });
      g.sum[pool] = 0;
      g.last[pool] = w.t;
      g.idle[pool] = 0;
    } else if (g.fresh[pool]) g.idle[pool] = 0;
    else if ((g.idle[pool] += dt) > RECOVER_FORGET) {
      g.sum[pool] = 0;
      g.idle[pool] = 0;
    }
    g.fresh[pool] = false;
  }
}
