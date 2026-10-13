/**
 * Density styles (docs/MAP-VARIETY.md section 3.3): how a map's monsters are spread over it. A pack's size follows the
 * area of its room; the style then changes the map as a whole. Rolled with the offer, so the card can say it.
 */
import { Rng } from '../core/rng';
import type { MapTypeId } from './mapTypes';

export type DensityId = 'standard' | 'sparse' | 'packed' | 'clustered' | 'scattered';

export type DensityDef = {
  id: DensityId;
  name: string;
  /** One sentence for the offer card. */
  text: string;
  /** Multiplies the monsters of a room. */
  countMult: number;
  /** Moves packs from plain to magic and rare (a sparse map has fewer, tougher packs). */
  toughShift: number;
  /** Clustered: the chance that a room is left empty, its monsters going to the other rooms. */
  emptyChance: number;
  /** Scattered: the largest group; the room's monsters are split into groups of one to this many. */
  groupMax: number;
  /** Weight in the roll. */
  weight: number;
};

export const DENSITIES: DensityDef[] = [
  {
    id: 'standard',
    name: 'Standard',
    text: '',
    countMult: 1,
    toughShift: 0,
    emptyChance: 0,
    groupMax: 0,
    weight: 40,
  },
  {
    id: 'sparse',
    name: 'Sparse',
    text: 'Few monsters, spread thin, but more of them are magic or rare.',
    countMult: 0.6,
    toughShift: 0.2,
    emptyChance: 0,
    groupMax: 0,
    weight: 15,
  },
  {
    id: 'packed',
    name: 'Packed',
    text: 'Half as many monsters again in every room.',
    countMult: 1.5,
    toughShift: 0,
    emptyChance: 0,
    groupMax: 0,
    weight: 15,
  },
  {
    id: 'clustered',
    name: 'Clustered',
    text: 'A few large packs with empty ground between them.',
    countMult: 1.8,
    toughShift: 0,
    emptyChance: 0.5,
    groupMax: 0,
    weight: 15,
  },
  {
    id: 'scattered',
    name: 'Scattered',
    text: 'Small groups and stragglers all over the map.',
    countMult: 1,
    toughShift: 0,
    emptyChance: 0,
    groupMax: 3,
    weight: 15,
  },
];

export function densityDef(id: string): DensityDef {
  return DENSITIES.find((d) => d.id === id) ?? DENSITIES[0];
}

/** The first map that can have a style other than standard. */
export const DENSITY_FROM = 3;

/** Types whose crowd is already their own (a Throng, a Quarry, a Holdout, a Crawl), and so take no style. */
const NO_STYLE: MapTypeId[] = ['throng', 'quarry', 'holdout', 'crawl'];

/** A debug override (the Debug panel): when set, every map has this style. */
let forced: DensityId | null = null;
export function forceDensity(id: DensityId | null): void {
  forced = id;
}

/**
 * The style of an offered map: fixed by the run seed and the offer, and standard on the early maps, on the boss and
 * champion maps (every tenth) and on the types with a crowd of their own.
 */
export function densityFor(seed: number, offerId: string, map: number, type: MapTypeId): DensityId {
  const r = new Rng(seed).fork(`density.${offerId}`);
  const pick = r.weighted(DENSITIES, (d) => d.weight).id;
  if (forced) return forced;
  if (map < DENSITY_FROM || map % 10 === 0 || NO_STYLE.includes(type)) return 'standard';
  return pick;
}
