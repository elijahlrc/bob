import type { InventoryItem } from '../data/types';
import type { RunState } from './run';

/**
 * The Wayside's part of a run (docs/WAYSIDE.md): the Market's stock, the provisions carried and armed, the Reprieve held,
 * the blessing and curses that last across levels, and a few "seen it once" flags. Every field has a default, and
 * `RunState.wayside` is optional, so an older save and a test fixture need no migration beyond `waysideOf`.
 */
export type Ware = {
  /** Stable within the stock: `${slot}`. */
  id: string;
  kind: 'gear' | 'gem' | 'flask' | 'provision' | 'currency' | 'reprieve';
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

export type Curse = {
  id: string;
  /** The last level (`run.map`) it still holds on. */ until: number;
};

export type Wayside = {
  /** The Market's stock for the level being prepared, and the level it was rolled for (`ensureMarket`). */
  market: Ware[];
  marketLevel: number;
  /** Provisions held, by id. */
  pouch: Record<string, number>;
  /** Provisions armed for the next map (they burn when it starts). */
  armed: string[];
  /** The provisions burning on the map being played (set when it starts, cleared when it ends). */
  active: string[];
  /** The Reprieve held, if any (data/reprieves.ts). */
  reprieve: string | null;
  /** How many Reprieves the run has taken so far (the run is capped). */
  reprieves: number;
  /** The Shrine's blessing, until the next stop replaces it. */
  blessing: string | null;
  /** Bargains still running (the Ferryman's and the Bargain Coin's). */
  curses: Curse[];
  /** The stops taken so far. */
  stops: number;
  /** First-use explainers already shown. */
  seen: Record<string, boolean>;
};

export const newWayside = (): Wayside => ({
  market: [],
  marketLevel: 0,
  pouch: {},
  armed: [],
  active: [],
  reprieve: null,
  reprieves: 0,
  blessing: null,
  curses: [],
  stops: 0,
  seen: {},
});

/** The run's Wayside state, filled in with defaults the first time it is asked for (an older save has none). */
export function waysideOf(run: RunState): Wayside {
  const w = (run.wayside ??= newWayside());
  // A save made before a field existed gets its default.
  const d = newWayside();
  for (const k of Object.keys(d) as (keyof Wayside)[])
    if (w[k] === undefined) (w as never)[k] = d[k] as never;
  return w;
}
