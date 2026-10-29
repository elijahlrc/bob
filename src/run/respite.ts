import { EQUIP_SLOTS, type Item } from '../data/types';
import { restAtCamp } from './camp';
import {
  addableFamilies,
  awlsmithSockets,
  addRandomAffix,
  nextTier,
  raiseTier,
  type CraftResult,
} from './craft';
import { advanceLevel, takeRespite, TOTAL_MAPS, type RunState } from './run';
import { awlsmithItems } from './stops';
import { heldReward, waysideOf } from './wayside';

/**
 * The Respite (docs/ATTRITION.md): rest or craft. Rest refills everything and passes the level at once. Craft works on an
 * item: a random affix, an affix a tier up, or a socket (the Awlsmith's old service). Each craft shows its result at once; the
 * first of a visit is free and the next cost Bone Dust; once one is made the visit is the level's, and leaving passes it with
 * no refill.
 */
export type RespiteCraft =
  | { kind: 'affix'; itemUid: number }
  | { kind: 'tier'; itemUid: number; family: string }
  | { kind: 'socket'; itemUid: number };

/** Bone Dust for the nth craft of a visit (0 is the first); past the list, the last price again. */
export const RESPITE_CRAFT_DUST = [0, 30, 90, 270];

const worn = (run: RunState): Item[] =>
  EQUIP_SLOTS.map((s) => run.build.equipment[s]).filter((x): x is Item => !!x);

/** The visit in progress, if the player is crafting at a Respite. */
export const respiteVisit = (run: RunState) => waysideOf(run).respite;

/** What the next craft of this visit costs. */
export function respiteCraftCost(run: RunState): number {
  const n = respiteVisit(run)?.crafts ?? 0;
  const dust = RESPITE_CRAFT_DUST[Math.min(n, RESPITE_CRAFT_DUST.length - 1)];
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
  if (!respiteItems(run, craft.kind).some((it) => it.uid === craft.itemUid))
    return craft.kind === 'socket'
      ? 'That item has no room for a socket'
      : craft.kind === 'affix'
        ? 'That item cannot take another affix'
        : 'That item has no affix to raise';
  if (craft.kind === 'tier') {
    const it = worn(run).find((x) => x.uid === craft.itemUid)!;
    if (!nextTier(it, craft.family, run.map))
      return 'That affix is at the best tier this level allows';
  }
  const cost = respiteCraftCost(run);
  if (run.dust < cost) return `That needs ${cost} Bone Dust`;
  return null;
}

/** Make a craft at the Respite: paid, applied and counted; the visit then belongs to this level. */
export function craftAtRespite(run: RunState, slot: number, craft: RespiteCraft): CraftResult {
  const why = respiteProblem(run, slot, craft);
  if (why) return { ok: false, reason: why };
  const cost = respiteCraftCost(run);
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

/** Rest: everything refilled, the level passes. Not once a craft has been made: a Respite is one or the other. */
export function restAtRespite(run: RunState): boolean {
  if (respiteVisit(run)) return false;
  takeRespite(run);
  return true;
}

/** Leave a Respite where crafts were made: the level passes with camp's usual rest, no refill. */
export function leaveRespite(run: RunState): void {
  const visit = respiteVisit(run);
  if (!visit || run.phase !== 'camp') return;
  run.history.push({
    map: run.map,
    areaLevel: run.map,
    status: 'respite',
    time: 0,
    levelAfter: run.build.level,
    kills: 0,
    stuck: 0,
  });
  run.vitals = restAtCamp(run.build, run.map, run.vitals);
  advanceLevel(run);
}
