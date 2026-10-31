import type { Shade } from './shades';
import {
  isRelicId,
  relicDef,
  RUN_REWARDS,
  type RelicHoldings,
  type RunRewardDef,
  type RunRewardId,
} from '../data/runRewards';
import type { Attrs, InventoryItem } from '../data/types';
import { relicCount } from '../calc/relics';
import { Character } from '../calc/character';
import type { Rng } from '../core/rng';
import type { RunState } from './run';

/**
 * The Wayside's part of a run (docs/WAYSIDE.md): the provisions carried and armed (reprieves among them),
 * the blessing and curses that last across levels, and a few "seen it once" flags. Every field has a default, and
 * `RunState.wayside` is optional, so an older save and a test fixture need no migration beyond `waysideOf`.
 */
export type Ware = {
  /** Stable within the stock: `${slot}`. */
  id: string;
  kind: 'gear' | 'gem' | 'flask' | 'provision' | 'currency' | 'reprieve' | 'reward';
  /** Bone Dust, after the level factor. */
  price: number;
  /** The item itself, for gear, a gem and a flask (it joins the inventory when bought). */
  item?: InventoryItem;
  /** A provision's id (data/provisions.ts), a Reprieve's id (data/reprieves.ts) or a currency's id. */
  ref?: string;
  /** A currency bundle's size. */
  count?: number;
  sold?: boolean;
};

export type StopVisit = {
  slot: number;
  /** The Knucklebone Man's throws this visit. */
  throws?: number;
  /** The fallen character of the Envious Dead or Another's Remains. */
  shade?: Shade;
  /** The Envious Dead's duel: under way, won or lost (a draw is lost). */
  duel?: 'fought' | 'won' | 'lost';
};

export type Curse = {
  id: string;
  /** The last level (`run.map`) it still holds on. */ until: number;
};

export type Wayside = {
  /** Provisions held, by id. */
  pouch: Record<string, number>;
  /** Provisions armed for the next map (they burn when it starts). */
  armed: string[];
  /** The provisions burning on the map being played (set when it starts, cleared when it ends). */
  active: string[];
  /** The Shrine's blessing, and the last level it holds on (null: an older save's, held until the next Shrine). */
  blessing: string | null;
  blessingUntil: number | null;
  /** Bargains still running (the Bloodletter's and the Bargain Coin's). */
  curses: Curse[];
  /** The stops taken so far. */
  stops: number;
  /** First-use explainers already shown. */
  seen: Record<string, boolean>;
  /** The provision the last cleared map left in the pouch (shown in camp), if any. */
  found: string | null;
  /** A Respite where the player is crafting (docs/ATTRITION.md): its slot and the crafts made; the level passes on leaving. */
  respite: { slot: number; crafts: number } | null;
  /** Restocks bought at a Quartermaster this level, by offer id. */
  restocks: Record<string, number>;
  /**
   * A stop being visited that keeps its screen open until the level passes (docs/ATTRITION.md): the Knucklebone Man once a
   * throw is made, a rivals stop once its shade is drawn (kept so a reload finds the same one), the Envious Dead's duel.
   */
  stopVisit: StopVisit | null;
  /** Relics held before they moved to the build (2026-10-30): read once by `waysideOf`, then empty. */
  rewards: Record<string, number>;
  /** The relics a stop drew this level, by `keptRelics`'s key: drawn once, so changing gear cannot draw them again. */
  relicDraws: Record<string, string[]>;
};

export const newWayside = (): Wayside => ({
  pouch: {},
  armed: [],
  active: [],
  blessing: null,
  blessingUntil: null,
  curses: [],
  stops: 0,
  seen: {},
  found: null,
  respite: null,
  restocks: {},
  rewards: {},
  relicDraws: {},
  stopVisit: null,
});

/** The run's Wayside state, filled in with defaults the first time it is asked for (an older save has none). */
export function waysideOf(run: RunState): Wayside {
  const w = (run.wayside ??= newWayside());
  // A save made before a field existed gets its default.
  const d = newWayside();
  for (const k of Object.keys(d) as (keyof Wayside)[])
    if (w[k] === undefined) (w as never)[k] = d[k] as never;
  // A run saved while a reprieve had a slot of its own: it is a provision in the pouch now.
  const old = w as unknown as { reprieve?: string | null; reprieves?: number };
  if (old.reprieve) {
    w.pouch[old.reprieve] = (w.pouch[old.reprieve] ?? 0) + 1;
  }
  delete old.reprieve;
  delete old.reprieves;
  // Relics live on the build since 2026-10-30, so the sheet and the sim see them; one Gravewarden's Satchel gives what two
  // Deeper Pouches did.
  if (Object.keys(w.rewards).length) {
    const held: RelicHoldings = { ...run.build.relics };
    for (const [id, n] of Object.entries(w.rewards))
      if (n > 0 && isRelicId(id))
        held[id] = Math.min(relicDef(id).max, (held[id] ?? 0) + (id === 'deeperPouch' ? 1 : n));
    run.build = { ...run.build, relics: held };
    w.rewards = {};
  }
  return w;
}

/** How many of a relic the run holds (docs/ATTRITION.md). */
export const heldReward = (run: RunState, id: string): number => {
  waysideOf(run);
  return isRelicId(id) ? relicCount(run.build, id) : 0;
};

/** Give the run a relic (bought, picked or won). A relic used on the tree comes with its uses. */
export function grantRelic(run: RunState, id: RunRewardId): void {
  waysideOf(run);
  const held = { ...run.build.relics };
  held[id] = Math.min(relicDef(id).max, (held[id] ?? 0) + 1);
  run.build = { ...run.build, relics: held };
}

/** The relics a run could still be given: offered from their level, and below their most. */
export function openRelics(run: RunState): RunRewardDef[] {
  return RUN_REWARDS.filter((r) => r.from <= run.map && heldReward(run, r.id) < r.max);
}

/**
 * How likely a relic is to be offered (the owner, 2026-10-30): an attribute relic by the character's attribute, or the mean of
 * its two; any other by the mean of all three. So at 200/20/20 a strength relic comes ten times as often as a dexterity one.
 */
export function relicWeight(r: RunRewardDef, a: Attrs): number {
  const of = r.attrs ?? (['str', 'dex', 'int'] as const);
  return Math.max(1, of.reduce((s, k) => s + a[k], 0) / of.length);
}

/** Up to `n` different relics the run could still be given, drawn by its attributes now. */
export function drawRelics(run: RunState, rng: Rng, n: number): RunRewardDef[] {
  const a = new Character(run.build).attrs;
  const pool = openRelics(run);
  const out: RunRewardDef[] = [];
  while (out.length < n && pool.length) {
    const i = rng.weightedIndex(pool.map((r) => relicWeight(r, a)));
    out.push(...pool.splice(i, 1));
  }
  return out;
}

/**
 * A stop's relics (the Quartermaster's ware, the Envious Dead's three): drawn the first time they are asked for, then kept for
 * the level, so the attributes they were drawn by are those of the moment the stop showed them (the owner, 2026-10-30).
 */
export function keptRelics(run: RunState, key: string, rng: Rng, n: number): RunRewardId[] {
  const w = waysideOf(run);
  const kept = (w.relicDraws[key] ??= drawRelics(run, rng, n).map((r) => r.id));
  return kept.filter((id): id is RunRewardId => isRelicId(id) && heldReward(run, id) < relicDef(id).max);
}
