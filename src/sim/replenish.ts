/**
 * Replenish (the owner, 2026-11-02, docs/SUSTAIN.md): a character's life leech, life on hit and life on kill win
 * back at most a share (`Defence.replenishShare`) of the life it lost in the last few seconds (`replenishWindow`), less
 * what they already won back in that time. So a character can recover much of what it just took, but never heals to
 * full unless it was full when that damage landed. Life lost to its own costs and burning counts; damage to energy shield does not, unless life
 * leech goes to the shield instead (the Shade Leech keystone). What a hit leeches past the room left is lost.
 *
 * Only characters replenish: monsters and minions leech as before.
 */
import type { Actor, World } from './types';

type Ledger = {
  /** [time, amount] of life lost, and of life won back, inside the window. */
  lost: [number, number][];
  got: [number, number][];
  /** The world's time at the last upkeep, for losses noted where the world is not at hand (a skill's life cost). */
  now: number;
  /** When replenish last won anything back. */
  at: number;
};

const ledgers = new WeakMap<Actor, Ledger>();

/** How long "while leeching" lasts after replenish last won something back (a few ticks: it is paid out every tick). */
const REPLENISHING_GRACE = 0.25;

export const replenishes = (a: Actor): boolean => a.isPlayer;

function ledgerOf(a: Actor): Ledger {
  let l = ledgers.get(a);
  if (!l) ledgers.set(a, (l = { lost: [], got: [], now: 0, at: -Infinity }));
  return l;
}

function prune(l: Ledger, t: number, window: number): void {
  const from = t - window;
  while (l.lost.length && l.lost[0][0] < from) l.lost.shift();
  while (l.got.length && l.got[0][0] < from) l.got.shift();
}

/** Keep the ledger's clock (called from the actor's upkeep). */
export function replenishTick(w: World, a: Actor): void {
  if (!replenishes(a)) return;
  const l = ledgerOf(a);
  l.now = w.t;
  prune(l, w.t, a.def.replenishWindow);
}

/** Life (or, with leech to the shield, energy shield) the character lost: it fills the pool. */
export function noteLifeLost(a: Actor, amount: number, t?: number): void {
  if (!replenishes(a) || amount <= 0) return;
  const l = ledgerOf(a);
  l.lost.push([t ?? l.now, amount]);
}

/** What replenish may still win back now. */
export function replenishRoom(a: Actor): number {
  if (!replenishes(a)) return Infinity;
  const l = ledgerOf(a);
  let lost = 0;
  let got = 0;
  for (const [, v] of l.lost) lost += v;
  for (const [, v] of l.got) got += v;
  return Math.max(0, lost * a.def.replenishShare - got);
}

/** Take up to `amount` from the pool: returns what may be recovered, and counts it as won back. */
export function replenish(a: Actor, amount: number): number {
  if (!replenishes(a) || amount <= 0) return Math.max(0, amount);
  const take = Math.min(amount, replenishRoom(a));
  if (take > 0) {
    const l = ledgerOf(a);
    l.got.push([l.now, take]);
    l.at = l.now;
  }
  return take;
}

/** Whether the character is replenishing (the "while leeching" condition). */
export function replenishing(w: World, a: Actor): boolean {
  return w.t - ledgerOf(a).at < REPLENISHING_GRACE;
}
