import type { Rng } from '../core/rng';
import { CURRENCIES, TABLET_PREFIX, TABLET_SETS } from '../data/currency';
import type { MonsterRarity } from '../data/monsters';
import type { CurrencyItem } from '../data/types';
import type { UidSource } from './items';

/**
 * Currency and tablet drops (EXPANSION 8.4 and 8.5). Currency drops are picked up like items but go
 * into a pouch. The rates below are _tunable_: the target is the number of currency items a map
 * gives in each band of the run (0.5, 1.5, 3 and 4).
 */

/** Expected currency items from one monster, before the map's multiplier. */
const CURRENCY_RATE: Record<MonsterRarity, number> = {
  normal: 0.004,
  magic: 0.03,
  rare: 0.16,
  miniboss: 1.5,
  boss: 3,
};

/** The multiplier on those rates by map: more currency, and more of it, as the run goes on. */
export function currencyBand(map: number): number {
  return map <= 10 ? 1.2 : map <= 30 ? 3.85 : map <= 60 ? 4.8 : 6.5;
}

/** Chance that a monster of this rarity drops a tablet. */
const TABLET_RATE: Record<MonsterRarity, number> = {
  normal: 0.003,
  magic: 0.015,
  rare: 0.1,
  miniboss: 1,
  boss: 1,
};

export type CurrencyContext = {
  map: number;
  monster: MonsterRarity;
  faction: string;
  /** The player's and the map's item quantity, as a multiplier (1 = none). */
  quantity: number;
  /** Extra essences the theme pays out, as a multiple of the usual rate (0 = none). */
  essenceBonus?: number;
  /** Extra currency items the theme pays out, as a multiple of the usual rate (0 = none). */
  currencyBonus?: number;
  /** A currency the theme always adds to the drops of a mini-boss or boss (EXPANSION 7.4), by id. */
  bonusCurrency?: string;
};

/** A whole number of events with the given expected value. */
function count(rng: Rng, expected: number): number {
  const whole = Math.floor(expected);
  return whole + (rng.chance(expected - whole) ? 1 : 0);
}

/** The currencies that can drop at random on a map. */
export function droppable(map: number) {
  return CURRENCIES.filter((c) => c.weight > 0 && c.minMap <= map);
}

/** Roll the currency, essence and tablets one dead monster leaves behind. */
export function rollCurrencyDrops(rng: Rng, uid: UidSource, ctx: CurrencyContext): CurrencyItem[] {
  const out: CurrencyItem[] = [];
  const pool = droppable(ctx.map);
  const n = pool.length
    ? count(
        rng,
        CURRENCY_RATE[ctx.monster] *
          currencyBand(ctx.map) *
          ctx.quantity *
          (1 + (ctx.currencyBonus ?? 0)),
      )
    : 0;
  for (let i = 0; i < n; i++) {
    const c = rng.weighted(pool, (x) => x.weight);
    out.push({ kind: 'currency', uid: uid(), id: c.id, count: 1 });
  }
  // A faction's essence drops from its rare monsters and mini-bosses.
  const ess = CURRENCIES.find((c) => c.faction === ctx.faction && c.minMap <= ctx.map);
  if (ess) {
    const rate =
      ctx.monster === 'rare' ? 0.12 : ctx.monster === 'normal' || ctx.monster === 'magic' ? 0 : 1;
    if (rate > 0 && rng.chance(Math.min(1, rate * ctx.quantity * (1 + (ctx.essenceBonus ?? 0)))))
      out.push({ kind: 'currency', uid: uid(), id: ess.id, count: 1 });
  }
  // The theme of the map may add one particular currency to what the leader of the end room drops.
  if (ctx.bonusCurrency && (ctx.monster === 'miniboss' || ctx.monster === 'boss'))
    out.push({ kind: 'currency', uid: uid(), id: ctx.bonusCurrency, count: 1 });
  const sets = TABLET_SETS[ctx.faction];
  if (sets && rng.chance(Math.min(1, TABLET_RATE[ctx.monster] * ctx.quantity))) {
    const t = rng.pick(sets);
    out.push({ kind: 'currency', uid: uid(), id: TABLET_PREFIX + t.unique, count: 1 });
  }
  return out;
}

/** A reward bundle: a few of one currency that has started to drop. */
export function rollCurrencyBundle(rng: Rng, uid: UidSource, map: number): CurrencyItem {
  const pool = droppable(map);
  const c = pool.length ? rng.weighted(pool, (x) => x.weight) : CURRENCIES[0];
  return { kind: 'currency', uid: uid(), id: c.id, count: rng.int(2, 3) };
}
