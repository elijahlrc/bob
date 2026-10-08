import { Rng } from '../core/rng';
import { themesFor } from '../data/themes';
import { rollMapAffixes } from '../gen/mapPlan';
import { fullVitals, type Vitals } from '../sim/types';

/**
 * What the camp offers for the next level (docs/MAPS.md section 4). Only plain maps exist so far; Respite and
 * the map types arrive in later milestones and widen these unions when they do.
 */
export type OfferKind = 'map';
export type MapTypeId = 'plain';

export type MapOffer = {
  /** Stable within a run: `${map}.${slot}`. Seeds the layout. */
  id: string;
  kind: OfferKind;
  type: MapTypeId;
  /** The level of the monsters and loot: the map number plus the offset. */
  areaLevel: number;
  /** Offset from the map number: 0, −2 or +2 (clamped to levels 1 to 100). */
  offset: number;
  themeId: string;
  /** Chalk edits this list in place. */
  affixes: string[];
};

/** Offers per level. */
export const OFFERS_PER_SET = 3;

/** Different themes for the offered maps of a level. */
export function rollThemes(seed: number, map: number): string[] {
  const r = new Rng(seed).fork(`themes${map}`);
  return r.shuffle(themesFor(map).map((t) => t.id)).slice(0, OFFERS_PER_SET);
}

/** The offered maps' offsets from the map number: higher is harder and richer, lower is a place to recover. */
export const OFFSETS = [0, -2, 2] as const;
/** Level offsets start here; the first four maps (and the early skill picks) are all at the map's own level. */
export const OFFSETS_FROM_MAP = 5;
/** Weights of the offsets [0, −2, +2] for a non-anchor offer; the −2 weight doubles when the character is hurt. */
const OFFSET_WEIGHTS = [60, 20, 20];
/** Below this fraction of life, or of any flask's charges, the character counts as hurt. */
export const HURT_BELOW = 0.6;

/** Whether the character is low enough on life or flask charges that a recovery offer should show up more often. */
export function isHurt(v: Vitals): boolean {
  return v.life < HURT_BELOW || Object.values(v.flasks).some((f) => f < HURT_BELOW);
}

/** The offer in a slot: its theme, level and the affixes the map rolls (docs/MAPS.md 4.1). */
export function makeOffer(
  seed: number,
  map: number,
  slot: number,
  themeId: string,
  offset = 0,
): MapOffer {
  const areaLevel = Math.min(100, Math.max(1, map + offset));
  return {
    id: `${map}.${slot}`,
    kind: 'map',
    type: 'plain',
    areaLevel,
    offset: areaLevel - map,
    themeId,
    affixes: rollMapAffixes(seed, map, slot),
  };
}

/**
 * The set of offers for a level. Rolled once when the previous level ends, then stored in the save.
 * The first offer (the anchor) is always at the map's own level; the others may sit two levels above or
 * below it (docs/MAPS.md 4.2).
 */
export function rollOffers(seed: number, map: number, vitals: Vitals = fullVitals()): MapOffer[] {
  const rng = new Rng(seed).fork(`offsets${map}`);
  const weights = isHurt(vitals) ? [60, 40, 20] : OFFSET_WEIGHTS;
  return rollThemes(seed, map).map((themeId, slot) => {
    const offset = slot === 0 || map < OFFSETS_FROM_MAP ? 0 : rng.weighted([...OFFSETS], weights);
    return makeOffer(seed, map, slot, themeId, offset);
  });
}
