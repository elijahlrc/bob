import { priceAt } from '../data/sale';
import { EQUIP_SLOTS, type Item } from '../data/types';
import {
  addableFamilies,
  awlsmithSockets,
  addRandomAffix,
  nextTier,
  raiseTier,
  type CraftResult,
} from './craft';
import { takeRespite, TOTAL_MAPS, type RunState } from './run';
import { awlsmithItems } from './stops';
import { heldReward, waysideOf } from './wayside';

/**
 * The Respite (docs/ATTRITION.md): craft, then rest. Craft works on an item: a random affix, an affix a tier up, or a socket
 * (the Awlsmith's old service). Each craft shows its result at once; the first of a visit is free and the next cost Bone Dust
 * by the item's level. Resting refills everything and passes the level; once a craft is made, resting is the only way out.
 */
export type RespiteCraft =
  | { kind: 'affix'; itemUid: number }
  | { kind: 'tier'; itemUid: number; family: string }
  | { kind: 'socket'; itemUid: number };

/**
 * Bone Dust for the nth craft of a visit (0 is the first) before the item's level, which raises it as wares are priced
 * (`priceAt`); past the list, the last price again.
 */
export const RESPITE_CRAFT_DUST = [0, 20, 60, 180];

const worn = (run: RunState): Item[] =>
  EQUIP_SLOTS.map((s) => run.build.equipment[s]).filter((x): x is Item => !!x);

/** The visit in progress, if the player has crafted at a Respite. */
export const respiteVisit = (run: RunState) => waysideOf(run).respite;

/** What the next craft of this visit costs on an item. */
export function respiteCraftCost(run: RunState, it: Item): number {
  const n = respiteVisit(run)?.crafts ?? 0;
  const base = RESPITE_CRAFT_DUST[Math.min(n, RESPITE_CRAFT_DUST.length - 1)];
  const dust = base ? priceAt(base, it.ilvl) : 0;
  // Thrifty Hands halves it (docs/ATTRITION.md).
  return heldReward(run, 'thriftyHands') > 0 ? Math.ceil(dust / 2) : dust;
}

/** The items a craft can work on: worn items for the affix crafts, worn or carried ones with room for a socket. */
export function respiteItems(run: RunState, kind: RespiteCraft['kind']): Item[] {
  if (kind === 'socket') return awlsmithItems(run);
  if (kind === 'affix') return worn(run).filter((it) => addableFamilies(it).length > 0);
  return worn(run).filter((it) => it.affixes.some((a) => nextTier(it, a.family, run.map)));
}

/** Whether a craft can be made at the Respite in a slot: null when it can, else why not. */
export function respiteProblem(run: RunState, slot: number, craft: RespiteCraft): string | null {
  if (run.phase !== 'camp') return 'not in camp';
  if (run.offers[slot]?.kind !== 'respite') return 'no Respite here';
  if (run.map >= TOTAL_MAPS) return 'The last level has no Respite';
  const visit = respiteVisit(run);
  if (visit && visit.slot !== slot) return 'no Respite here';
  const item = respiteItems(run, craft.kind).find((it) => it.uid === craft.itemUid);
  if (!item)
    return craft.kind === 'socket'
      ? 'That item has no room for a socket'
      : craft.kind === 'affix'
        ? 'That item cannot take another affix'
        : 'That item has no affix to raise';
  if (craft.kind === 'tier' && !nextTier(item, craft.family, run.map))
    return 'That affix is at the best tier this level allows';
  const cost = respiteCraftCost(run, item);
  if (run.dust < cost) return `That needs ${cost} Bone Dust`;
  return null;
}

/** Make a craft at the Respite: paid, applied and counted; the visit then belongs to this level. */
export function craftAtRespite(run: RunState, slot: number, craft: RespiteCraft): CraftResult {
  const why = respiteProblem(run, slot, craft);
  if (why) return { ok: false, reason: why };
  const cost = respiteCraftCost(
    run,
    respiteItems(run, craft.kind).find((it) => it.uid === craft.itemUid)!,
  );
  const res =
    craft.kind === 'affix'
      ? addRandomAffix(run, craft.itemUid)
      : craft.kind === 'tier'
        ? raiseTier(run, craft.itemUid, craft.family)
        : awlsmithSockets(run, craft.itemUid, 0);
  if (!res.ok) return res;
  run.dust -= cost;
  const way = waysideOf(run);
  way.respite = { slot, crafts: (way.respite?.crafts ?? 0) + 1 };
  return res;
}

/** Rest and leave: everything refilled, the level passes, whether or not crafts were made. */
export function restAtRespite(run: RunState): void {
  takeRespite(run);
}
