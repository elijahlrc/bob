import type { InventoryItem } from '../data/types';
import type { RunState } from './run';

/**
 * The Wayside's part of a run (docs/WAYSIDE.md): the provisions carried and armed (reprieves among them),
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
  /** Provisions held, by id. */
  pouch: Record<string, number>;
  /** Provisions armed for the next map (they burn when it starts). */
  armed: string[];
  /** The provisions burning on the map being played (set when it starts, cleared when it ends). */
  active: string[];
  /** The Shrine's blessing, and the last level it holds on (null: an older save's, held until the next Shrine). */
  blessing: string | null;
  blessingUntil: number | null;
  /** Bargains still running (the Ferryman's and the Bargain Coin's). */
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
  return w;
}
