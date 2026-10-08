import { Rng } from '../core/rng';
import { typesFor, type MapTypeId } from '../data/mapTypes';
import {
  leaderOf,
  OSSUARY_CAP_FROM,
  ossuaryLed,
  themesFor,
  themeWeight,
  type ThemeDef,
} from '../data/themes';
import { rollMapAffixes } from '../gen/mapPlan';
import { fullVitals, type Vitals } from '../sim/types';

/**
 * What the camp offers for the next level (docs/MAPS.md section 4): a map, or a Respite, which is no map at all but
 * a rest that restores everything and still passes the level.
 */
export type OfferKind = 'map' | 'respite';
export type { MapTypeId };

export type MapOffer = {
  /** Stable within a run: `${map}.${slot}`. Seeds the layout. */
  id: string;
  kind: OfferKind;
  type: MapTypeId;
  /** The level of the monsters and loot: the map number plus the offset. */
  areaLevel: number;
  /** Offset from the map number: 0, −2 or +2 (clamped to levels 1 to 100). */
  offset: number;
  /** Empty for a Respite. */
  themeId: string;
  /** Chalk edits this list in place. Empty for a Respite. */
  affixes: string[];
};

/** Offers per level. */
export const OFFERS_PER_SET = 3;

/**
 * Different themes for the offered maps of a level (docs/ENEMIES.md 4.2). Drawn one at a time by weight from the stream
 * of the level: each draw prefers a theme whose leading faction is not already in the set, and from map 4 the set holds
 * at most one skeleton-led theme; when the pool cannot satisfy a rule the rule gives way (never to a repeated theme).
 */
export function rollThemes(seed: number, map: number): string[] {
  const r = new Rng(seed).fork(`themes${map}`);
  const pool = themesFor(map);
  const chosen: ThemeDef[] = [];
  while (chosen.length < OFFERS_PER_SET) {
    const left = pool.filter((t) => !chosen.includes(t));
    if (!left.length) break;
    const leaders = new Set(chosen.map(leaderOf));
    const capped = map >= OSSUARY_CAP_FROM && chosen.some(ossuaryLed);
    const allowed = left.filter((t) => !(capped && ossuaryLed(t)));
    const fresh = allowed.filter((t) => !leaders.has(leaderOf(t)));
    const from = fresh.length ? fresh : allowed.length ? allowed : left;
    chosen.push(r.weighted(from, (t) => themeWeight(t, map)));
  }
  return chosen.map((t) => t.id);
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

/** The offer in a slot: its theme, level, type and the affixes the map rolls (docs/MAPS.md 4.1). */
export function makeOffer(
  seed: number,
  map: number,
  slot: number,
  themeId: string,
  offset = 0,
  type: MapTypeId = 'plain',
): MapOffer {
  const areaLevel = Math.min(100, Math.max(1, map + offset));
  return {
    id: `${map}.${slot}`,
    kind: 'map',
    type,
    areaLevel,
    offset: areaLevel - map,
    themeId,
    affixes: rollMapAffixes(seed, map, slot),
  };
}

/** Each offer on an eligible map is typed with this chance (once any type is unlocked). */
export const TYPE_CHANCE = 0.35;
/** One typed offer per set before this map, two from it. */
export const TWO_TYPES_FROM = 40;

/** A Respite is offered only when life, mana or a flask is below this fraction. */
export const RESPITE_BELOW = 0.9;
/** ... and is always offered when life is below this fraction. */
export const RESPITE_ALWAYS_BELOW = 0.4;
/** The chance that each of the other two slots is a Respite, when one is allowed. */
export const RESPITE_CHANCE = 0.1;

function anyBelow(v: Vitals, f: number): boolean {
  return v.life < f || v.mana < f || Object.values(v.flasks).some((c) => c < f);
}

/** A Respite takes the place of a map in a slot. */
export function makeRespite(map: number, slot: number): MapOffer {
  return {
    id: `${map}.${slot}`,
    kind: 'respite',
    type: 'plain',
    areaLevel: map,
    offset: 0,
    themeId: '',
    affixes: [],
  };
}

/**
 * The set of offers for a level. Rolled once when the previous level ends, then stored in the save.
 * The first offer (the anchor) is always a map at the map's own level; the others may sit two levels above or
 * below it, and one of them may be a Respite when the character is worn down (docs/MAPS.md 4.2).
 */
export function rollOffers(seed: number, map: number, vitals: Vitals = fullVitals()): MapOffer[] {
  const rng = new Rng(seed).fork(`offsets${map}`);
  const weights = isHurt(vitals) ? [60, 40, 20] : OFFSET_WEIGHTS;
  const typeRng = new Rng(seed).fork(`types${map}`);
  const restRng = new Rng(seed).fork(`rest${map}`);
  const unlocked = typesFor(map);
  // A Respite needs a map after the first four and not a mini-boss or boss map (every tenth).
  const mayRest = map >= OFFSETS_FROM_MAP && map % 10 !== 0 && anyBelow(vitals, RESPITE_BELOW);
  const r1 = restRng.chance(RESPITE_CHANCE);
  const r2 = restRng.chance(RESPITE_CHANCE);
  const restSlot = !mayRest ? -1 : vitals.life < RESPITE_ALWAYS_BELOW ? 2 : r1 ? 1 : r2 ? 2 : -1;
  let typed = 0;
  return rollThemes(seed, map).map((themeId, slot) => {
    const offset = slot === 0 || map < OFFSETS_FROM_MAP ? 0 : rng.weighted([...OFFSETS], weights);
    // The type roll is made for every slot, so the sets do not shift when a cap is reached.
    const hit = typeRng.chance(TYPE_CHANCE);
    const pick = unlocked.length ? typeRng.pick(unlocked).id : 'plain';
    if (slot === restSlot) return makeRespite(map, slot);
    const room = typed < (map >= TWO_TYPES_FROM ? 2 : 1);
    const type: MapTypeId = hit && room && unlocked.length ? pick : 'plain';
    if (type !== 'plain') typed++;
    return makeOffer(seed, map, slot, themeId, offset, type);
  });
}
