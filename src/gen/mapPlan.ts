import { Rng } from '../core/rng';
import { affixesConflict, affixReward, MAP_AFFIXES, mapAffixDef } from '../data/mapAffixes';
import { themeDef, type ThemeDef } from '../data/themes';
import { generateLabyrinth, type Labyrinth } from './labyrinth';
import { populate, type EndKind, type Population } from './population';

/** Everything needed to play one map (§5.3). */
export type MapPlan = {
  seed: number;
  map: number;
  areaLevel: number;
  resistPenalty: number;
  theme: ThemeDef;
  /** Ids of the map affixes (EXPANSION 7.5). */
  affixes: string[];
  /** XP multiplier of the map: the theme's bonus and the affixes' experience rewards. */
  xpMult: number;
  endKind: EndKind;
  lab: Labyrinth;
  pop: Population;
};

export function roomsForMap(n: number): number {
  return 4 + Math.floor(n / 25);
}

export function resistPenaltyForMap(n: number): number {
  return n <= 30 ? 0 : n <= 60 ? 30 : 60;
}

export function endKindForMap(n: number): EndKind {
  return n === 100 ? 'boss' : n % 10 === 0 ? 'miniboss' : 'rare';
}

/** How many affixes a map carries, by map number (docs/MAPS.md 6.1): none on the first four maps, then more as the run goes on. */
export function affixCountRange(map: number): [number, number] {
  return map < 5 ? [0, 0] : map < 20 ? [0, 1] : map < 40 ? [1, 2] : map < 60 ? [2, 3] : [3, 4];
}

/**
 * The affixes an offered map carries. Rolled from the run seed, the map and which offer it is, so the offer
 * is fixed. Affixes that conflict (the same stat, or the same element) never share a map.
 */
export function rollMapAffixes(seed: number, map: number, offer: number): string[] {
  const [lo, hi] = affixCountRange(map);
  if (hi === 0) return [];
  const rng = new Rng(seed).fork(`affixes${map}.${offer}`);
  const want = rng.int(lo, hi);
  const picked: string[] = [];
  for (const id of rng.shuffle(MAP_AFFIXES.filter((a) => !a.chalkOnly).map((a) => a.id))) {
    if (picked.length >= want) break;
    if (picked.every((p) => !affixesConflict(p, id))) picked.push(id);
  }
  return picked.sort();
}

/**
 * `map` is the map number (rooms, end room, resist tier); `areaLevel` is the level of the monsters and
 * loot: the map number plus the offer's offset (docs/MAPS.md section 5).
 */
export function makeMapPlan(
  seed: number,
  map: number,
  themeId: string,
  affixes: string[] = [],
  areaLevel: number = map,
): MapPlan {
  const root = new Rng(seed);
  const genRng = root.fork('mapgen');
  const sideBranches = map <= 4 ? 0 : genRng.int(0, 2);
  const lab = generateLabyrinth(genRng, { rooms: roomsForMap(map), sideBranches });
  const theme = themeDef(themeId);
  const endKind = endKindForMap(map);
  const xpMult =
    theme.xpMult *
    (1 +
      affixes.reduce((n, id) => n + (affixReward(mapAffixDef(id), areaLevel).experience ?? 0), 0));
  const pop = populate(root.fork('monsters'), lab, {
    areaLevel,
    endKind,
    theme,
    map,
    affixes,
  });
  return {
    seed,
    map,
    areaLevel,
    resistPenalty: resistPenaltyForMap(map),
    theme,
    affixes,
    xpMult,
    endKind,
    lab,
    pop,
  };
}
