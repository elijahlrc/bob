/**
 * Biomes (docs/MAP-VARIETY.md section 3.1): how a map is laid out and how it looks, whoever lives there. A biome is rolled
 * apart from the theme, so any faction can meet the character in any biome; it is shown on entering the map, not on the
 * offer card. Special map types pin their biome.
 */
import { Rng } from '../core/rng';
import type { MapTypeId } from './mapTypes';

export type BiomeId =
  'crypt' | 'cavern' | 'ruins' | 'marsh' | 'forge' | 'hollow' | 'shrine' | 'warren';

/** Which generator lays the biome out (src/gen/layouts.ts). */
export type LayoutKind = 'chain' | 'cave' | 'field' | 'loops' | 'warren';

export type BiomeDef = {
  id: BiomeId;
  name: string;
  /** One line shown when the map is entered. */
  text: string;
  layout: LayoutKind;
  /** First map on which the roll can give it. */
  from: number;
  /** Weight in the roll. */
  weight: number;
};

export const BIOMES: BiomeDef[] = [
  {
    id: 'crypt',
    name: 'Crypt',
    text: 'Narrow halls and small chambers.',
    layout: 'chain',
    from: 1,
    weight: 10,
  },
  {
    id: 'cavern',
    name: 'Cavern',
    text: 'Winding caves with no straight walls.',
    layout: 'cave',
    from: 1,
    weight: 10,
  },
  {
    id: 'ruins',
    name: 'Ruins',
    text: 'Broken halls with more than one way round.',
    layout: 'loops',
    from: 3,
    weight: 8,
  },
  {
    id: 'marsh',
    name: 'Marsh',
    text: 'Open wet ground with scattered pools.',
    layout: 'cave',
    from: 3,
    weight: 6,
  },
  {
    id: 'forge',
    name: 'Forge',
    text: 'Great halls joined by short passages.',
    layout: 'chain',
    from: 5,
    weight: 6,
  },
  {
    id: 'hollow',
    name: 'Hollow',
    text: 'One wide open ground broken by pillars.',
    layout: 'field',
    from: 5,
    weight: 6,
  },
  {
    id: 'shrine',
    name: 'Shrine',
    text: 'Stately halls in a long procession.',
    layout: 'chain',
    from: 1,
    weight: 8,
  },
  {
    id: 'warren',
    name: 'Warren',
    text: 'A tangle of small cells and short passages.',
    layout: 'warren',
    from: 8,
    weight: 6,
  },
];

export function biomeDef(id: string): BiomeDef {
  return BIOMES.find((b) => b.id === id) ?? BIOMES[0];
}

/** The biome a map type is always set in (a special map is a special place); the others take any. */
export const PINNED_BIOME: Partial<Record<MapTypeId, BiomeId>> = {
  quarry: 'cavern',
  holdout: 'hollow',
  collapse: 'ruins',
  crawl: 'warren',
};

/**
 * The biomes of a level's three offers: drawn one at a time by weight from the stream of the level, each different from
 * the ones already drawn while the pool allows. A pinned type ignores this (`biomeFor`).
 */
export function rollBiomes(seed: number, map: number, count = 3): BiomeId[] {
  const r = new Rng(seed).fork(`biomes${map}`);
  const pool = BIOMES.filter((b) => b.from <= map);
  const out: BiomeDef[] = [];
  for (let i = 0; i < count; i++) {
    const fresh = pool.filter((b) => !out.includes(b));
    out.push(r.weighted(fresh.length ? fresh : pool, (b) => b.weight));
  }
  return out.map((b) => b.id);
}

/** A debug override (the Debug panel): when set, every map has this biome. */
let forced: BiomeId | null = null;
export function forceBiome(id: BiomeId | null): void {
  forced = id;
}

/** The biome of the offer in a slot of a level. */
export function biomeFor(seed: number, map: number, slot: number, type: MapTypeId): BiomeId {
  return forced ?? PINNED_BIOME[type] ?? rollBiomes(seed, map)[slot % 3];
}
