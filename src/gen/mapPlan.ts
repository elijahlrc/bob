import { Rng } from '../core/rng';
import { MAP_AFFIXES } from '../data/mapAffixes';
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

/**
 * The affixes an offered map carries: none before map 20, then 0–1, 1–2 and 2–3 as the run goes
 * on. Rolled from the run seed, the map and which of the two offers it is, so the offer is fixed.
 */
export function rollMapAffixes(seed: number, map: number, offer: number): string[] {
  if (map < 20) return [];
  const rng = new Rng(seed).fork(`affixes${map}.${offer}`);
  const [lo, hi] = map < 40 ? [0, 1] : map < 60 ? [1, 2] : [2, 3];
  const pool = MAP_AFFIXES.filter((a) => !a.chalkOnly).map((a) => a.id);
  return rng.shuffle(pool).slice(0, rng.int(lo, hi)).sort();
}

export function makeMapPlan(
  seed: number,
  map: number,
  themeId: string,
  affixes: string[] = [],
): MapPlan {
  const root = new Rng(seed);
  const genRng = root.fork('mapgen');
  const sideBranches = map <= 4 ? 0 : genRng.int(0, 2);
  const lab = generateLabyrinth(genRng, { rooms: roomsForMap(map), sideBranches });
  const theme = themeDef(themeId);
  const endKind = endKindForMap(map);
  const pop = populate(root.fork('monsters'), lab, {
    areaLevel: map,
    endKind,
    theme,
    map,
    affixes,
  });
  return {
    seed,
    map,
    areaLevel: map,
    resistPenalty: resistPenaltyForMap(map),
    theme,
    affixes,
    endKind,
    lab,
    pop,
  };
}
