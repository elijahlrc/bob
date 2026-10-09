import type { AnyItem, InventoryItem, Rarity } from '../data/types';
import type { RunState } from './run';

/**
 * What the player has found, looked at and kept (docs/MOBILE.md 3.8): the unseen list, the map each item was found
 * on, favourites, and the choice of old items for the clean-up. Everything here is keyed by an item's uid, which stays
 * the same through equip, unequip and every craft, so a star follows its item.
 */

/** Record a new item, gem or flask: when it was found, and that the player has not seen it yet. Currency has no uid. */
export function noteFound(run: RunState, it: AnyItem): void {
  if (it.kind === 'currency') return;
  run.acquired[it.uid] = run.map;
  if (!run.unseen.includes(it.uid)) run.unseen.push(it.uid);
}

/** The player has looked at these items (or at all of them). */
export function markSeen(run: RunState, uids: readonly number[] | 'all'): void {
  if (uids === 'all') run.unseen = [];
  else {
    const gone = new Set(uids);
    run.unseen = run.unseen.filter((u) => !gone.has(u));
  }
}

/** The inventory items not yet seen, in inventory order. */
export function unseenItems(run: RunState): InventoryItem[] {
  const u = new Set(run.unseen);
  return run.inventory.filter((x) => u.has(x.uid));
}

/** The rarity of anything in the inventory, for the clean-up: a flask with affixes counts as magic, a gem as normal. */
export function itemRarity(it: InventoryItem): Rarity {
  if (it.kind === 'item') return it.rarity;
  if (it.kind === 'flask')
    return it.uniqueId ? 'unique' : it.affixes.length > 0 ? 'magic' : 'normal';
  return 'normal';
}

/** Unseen rares and uniques: what pauses Auto-continue (the player should look at them first). */
export function unseenRares(run: RunState): InventoryItem[] {
  return unseenItems(run).filter((x) => {
    const r = itemRarity(x);
    return x.kind !== 'gem' && (r === 'rare' || r === 'unique');
  });
}

export const isFavourite = (run: RunState, uid: number): boolean => run.favourites.includes(uid);

/** Star or unstar an item. */
export function toggleFavourite(run: RunState, uid: number): boolean {
  const on = !isFavourite(run, uid);
  run.favourites = on ? [...run.favourites, uid] : run.favourites.filter((u) => u !== uid);
  return on;
}

/** How many levels ago an item was found: 0 for an item found on the current level (or with no record). */
export function ageOf(run: RunState, uid: number): number {
  const at = run.acquired[uid];
  return at === undefined ? 0 : Math.max(0, run.map - at);
}

export type CleanOpts = {
  /** Items found MORE than this many levels ago are old. */
  olderThan: number;
  items: boolean;
  flasks: boolean;
  gems: boolean;
  rarities: Record<Rarity, boolean>;
  includeUnseen: boolean;
};

/** The defaults of the clean-up panel: items and flasks, not uniques, not gems, not what has not been looked at. */
export const DEFAULT_CLEAN: CleanOpts = {
  olderThan: 10,
  items: true,
  flasks: true,
  gems: false,
  rarities: { normal: true, magic: true, rare: true, unique: false },
  includeUnseen: false,
};

export type CleanPlan = {
  /** What the clean-up would salvage. */
  items: InventoryItem[];
  /** What it would keep, by reason (an item that is both starred and unseen counts as starred). */
  kept: { favourite: number; unseen: number; young: number; other: number };
};

/**
 * Choose the old items of the inventory. An item is chosen when it is old, of a chosen kind and rarity, not a favourite
 * and (unless asked) already seen. Equipped gear and socketed gems are not in the inventory, so they cannot be chosen.
 */
export function oldItems(run: RunState, opts: CleanOpts = DEFAULT_CLEAN): CleanPlan {
  const unseen = new Set(run.unseen);
  const plan: CleanPlan = {
    items: [],
    kept: { favourite: 0, unseen: 0, young: 0, other: 0 },
  };
  for (const it of run.inventory) {
    const kindOn = it.kind === 'item' ? opts.items : it.kind === 'flask' ? opts.flasks : opts.gems;
    if (!kindOn || !opts.rarities[itemRarity(it)]) {
      plan.kept.other++;
      continue;
    }
    if (isFavourite(run, it.uid)) plan.kept.favourite++;
    else if (ageOf(run, it.uid) <= opts.olderThan) plan.kept.young++;
    else if (unseen.has(it.uid) && !opts.includeUnseen) plan.kept.unseen++;
    else plan.items.push(it);
  }
  return plan;
}

/** Forget uids that are nowhere any more (salvaged or discarded), so the lists do not grow for ever. */
export function pruneFound(run: RunState): void {
  const live = new Set<number>();
  for (const it of run.inventory) live.add(it.uid);
  for (const it of run.discarded ?? []) live.add(it.uid);
  for (const it of Object.values(run.build.equipment)) {
    live.add(it.uid);
    for (const g of it.sockets) if (g) live.add(g.uid);
  }
  for (const f of run.build.flasks) if (f) live.add(f.uid);
  if (run.reward) for (const it of run.reward) live.add(it.uid);
  run.unseen = run.unseen.filter((u) => live.has(u));
  run.favourites = run.favourites.filter((u) => live.has(u));
  for (const k of Object.keys(run.acquired))
    if (!live.has(Number(k))) delete run.acquired[Number(k)];
}

/** Give every item a run already has the map counter of now (a new run's starting gear, a migrated save). */
export function stampAll(run: RunState, map = run.map): void {
  const put = (uid: number) => {
    if (run.acquired[uid] === undefined) run.acquired[uid] = map;
  };
  for (const it of run.inventory) put(it.uid);
  for (const it of Object.values(run.build.equipment)) {
    put(it.uid);
    for (const g of it.sockets) if (g) put(g.uid);
  }
  for (const f of run.build.flasks) if (f) put(f.uid);
}
