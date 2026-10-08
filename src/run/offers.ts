import { Rng } from '../core/rng';
import { themesFor } from '../data/themes';
import { rollMapAffixes } from '../gen/mapPlan';

/**
 * What the camp offers for the next level (docs/MAPS.md section 4). R0 has only plain maps at the
 * map's own level; Respite, level offsets and the map types arrive in later milestones, and widen
 * these unions when they do.
 */
export type OfferKind = 'map';
export type MapTypeId = 'plain';

export type MapOffer = {
  /** Stable within a run: `${map}.${slot}`. Seeds the layout. */
  id: string;
  kind: OfferKind;
  type: MapTypeId;
  /** The level of the monsters and loot. */
  areaLevel: number;
  /** Offset from the map number (always 0 until R3). */
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

/** The offer in a slot: its theme and the affixes the map rolls (docs/MAPS.md 4.1). */
export function makeOffer(seed: number, map: number, slot: number, themeId: string): MapOffer {
  return {
    id: `${map}.${slot}`,
    kind: 'map',
    type: 'plain',
    areaLevel: map,
    offset: 0,
    themeId,
    affixes: rollMapAffixes(seed, map, slot),
  };
}

/** The set of offers for a level. Rolled once when the previous level ends, then stored in the save. */
export function rollOffers(seed: number, map: number): MapOffer[] {
  return rollThemes(seed, map).map((themeId, slot) => makeOffer(seed, map, slot, themeId));
}
