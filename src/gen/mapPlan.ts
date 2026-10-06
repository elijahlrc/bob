import { Rng } from '../core/rng';
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

export function makeMapPlan(seed: number, map: number, themeId: string): MapPlan {
  const root = new Rng(seed);
  const genRng = root.fork('mapgen');
  const sideBranches = map <= 4 ? 0 : genRng.int(0, 2);
  const lab = generateLabyrinth(genRng, { rooms: roomsForMap(map), sideBranches });
  const theme = themeDef(themeId);
  const endKind = endKindForMap(map);
  const pop = populate(root.fork('monsters'), lab, { areaLevel: map, endKind, theme, map });
  return {
    seed,
    map,
    areaLevel: map,
    resistPenalty: resistPenaltyForMap(map),
    theme,
    endKind,
    lab,
    pop,
  };
}
