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
import { BOSS_MAP_NO_AFFIX, bossForMap } from '../data/bosses';
import { STOP_FROM, STOPS, type StopId } from '../data/stops';

/**
 * What the camp offers for the next level (docs/MAPS.md section 4): a map, or a Respite, which is no map at all but
 * a rest that restores everything and still passes the level.
 */
export type OfferKind = 'map' | 'respite' | 'stop';
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
  /** Empty for a Respite or a stop. */
  themeId: string;
  /** Chalk edits this list in place. Empty for a Respite or a stop. */
  affixes: string[];
  /** Which stop this is, when `kind` is 'stop' (docs/WAYSIDE.md section 5). */
  stop?: StopId;
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
/**
 * Weights of the offsets [0, −2, +2] for a non-anchor offer. Until 2026-10-28 the −2 weight doubled when life or a flask
 * was below 60%; the offers no longer look at the character (the owner).
 */
const OFFSET_WEIGHTS = [60, 20, 20];

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
    affixes: rollMapAffixes(seed, map, slot, bossForMap(map) ? BOSS_MAP_NO_AFFIX : []),
  };
}

/** Each offer on an eligible map is typed with this chance (once any type is unlocked). */
export const TYPE_CHANCE = 0.35;
/** One typed offer per set before this map, two from it. */
export const TWO_TYPES_FROM = 40;

/**
 * The chance that a set holds a Respite, in one of the two slots after the anchor. Since 2026-10-28 (flask scarcity, the
 * owner) the Respite does not look at the character: it was offered only below 90% life, mana or flask (10% a slot) and
 * always below 40% life; now the seed alone decides, and the level before a boss always has one.
 */
export const RESPITE_CHANCE = 0.3;

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

/** A stop takes the place of a map in a slot (docs/WAYSIDE.md 5.1): the level passes, as with a Respite, and a service is given. */
export function makeStop(map: number, slot: number, stop: StopId): MapOffer {
  return {
    id: `${map}.${slot}`,
    kind: 'stop',
    type: 'plain',
    areaLevel: map,
    offset: 0,
    themeId: '',
    affixes: [],
    stop,
  };
}

/**
 * The chance that a level that may hold a stop does (docs/ATTRITION.md, 2026-10-29): about four levels in five may, so stops
 * come about one level in five, at random rather than two to every window of five as before.
 */
export const STOP_CHANCE = 0.32;

const schedules = new Map<number, (StopId | null)[]>();

/**
 * Every level's stop for a run (indexed by level), drawn from the seed alone: from `STOP_FROM`, never on a fifth or tenth level
 * (a reward pick or a gate is due there), never past level 99, never two levels in a row, and never the kind of the stop before.
 */
export function stopSchedule(seed: number): (StopId | null)[] {
  const known = schedules.get(seed);
  if (known) return known;
  const out: (StopId | null)[] = Array.from({ length: 101 }, () => null);
  let prev: StopId | null = null;
  for (let l = STOP_FROM; l < 100; l++) {
    if (l % 5 === 0 || out[l - 1]) continue;
    const rng = new Rng(seed).fork(`stop${l}`);
    if (!rng.chance(STOP_CHANCE)) continue;
    const open = STOPS.filter((s) => s.weight > 0 && s.from <= l);
    const pool = open.filter((s) => s.id !== prev);
    const from = pool.length ? pool : open;
    if (!from.length) continue;
    prev = out[l] = rng.weighted(from, (s) => s.weight).id;
  }
  if (schedules.size > 16) schedules.clear();
  schedules.set(seed, out);
  return out;
}

/** The stop on offer at a level, if the schedule puts one there. */
export function stopAt(seed: number, map: number): StopId | null {
  return map >= 0 && map <= 100 ? stopSchedule(seed)[map] : null;
}

/**
 * The set of offers for a level. Rolled once when the previous level ends, then stored in the save. A boss map has one.
 * The first offer (the anchor) is always a map at the map's own level; the others may sit two levels above or
 * below it, and one of them may be a Respite (docs/MAPS.md 4.2). The seed and the level alone decide it, never the
 * character's state (the owner, 2026-10-28).
 */
export function rollOffers(seed: number, map: number): MapOffer[] {
  // A boss map is the one way on (docs/BOSSES.md 10): a single map at its own level, its theme the first drawn.
  if (bossForMap(map)) return [makeOffer(seed, map, 0, rollThemes(seed, map)[0])];
  const rng = new Rng(seed).fork(`offsets${map}`);
  const typeRng = new Rng(seed).fork(`types${map}`);
  const restRng = new Rng(seed).fork(`rest${map}`);
  const unlocked = typesFor(map);
  // A Respite needs a map after the first four and not a mini-boss or boss map (every tenth).
  const mayRest = map >= OFFSETS_FROM_MAP && map % 10 !== 0;
  const rest = restRng.chance(RESPITE_CHANCE);
  const restAt = restRng.chance(0.5) ? 1 : 2;
  // The level before a boss always offers one (2026-10-28): kills no longer refill the flasks a boss fight needs.
  const beforeBoss = bossForMap(map + 1) !== null;
  const restSlot = !mayRest ? -1 : beforeBoss ? 2 : rest ? restAt : -1;
  // A stop takes a slot that is neither the anchor nor the Respite's; its streams are its own, so the maps are the same with or without it.
  const stop = stopAt(seed, map);
  const free = [1, 2].filter((s) => s !== restSlot);
  const stopSlot = stop && free.length ? new Rng(seed).fork(`stopslot${map}`).pick(free) : -1;
  let typed = 0;
  return rollThemes(seed, map).map((themeId, slot) => {
    const offset =
      slot === 0 || map < OFFSETS_FROM_MAP ? 0 : rng.weighted([...OFFSETS], OFFSET_WEIGHTS);
    // The type roll is made for every slot, so the sets do not shift when a cap is reached.
    const hit = typeRng.chance(TYPE_CHANCE);
    const pick = unlocked.length ? typeRng.pick(unlocked).id : 'plain';
    if (slot === restSlot) return makeRespite(map, slot);
    if (slot === stopSlot) return makeStop(map, slot, stop!);
    const room = typed < (map >= TWO_TYPES_FROM ? 2 : 1);
    const type: MapTypeId = hit && room && unlocked.length ? pick : 'plain';
    if (type !== 'plain') typed++;
    return makeOffer(seed, map, slot, themeId, offset, type);
  });
}
