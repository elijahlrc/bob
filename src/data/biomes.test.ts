import { describe, expect, it } from 'vitest';
import { BIOMES, PINNED_BIOME, biomeDef, biomeFor, rollBiomes } from './biomes';
import { MAP_TYPES } from './mapTypes';

describe('biomes', () => {
  it('every biome has a name, a line of text and a distinct id', () => {
    expect(new Set(BIOMES.map((b) => b.id)).size).toBe(BIOMES.length);
    for (const b of BIOMES) {
      expect(b.name.length).toBeGreaterThan(2);
      expect(b.text.length).toBeGreaterThan(5);
      expect(b.weight).toBeGreaterThan(0);
    }
  });

  it('the roll is fixed by the seed and the map, and the three offers differ', () => {
    for (let map = 1; map <= 100; map += 7) {
      const a = rollBiomes(11, map);
      expect(rollBiomes(11, map)).toEqual(a);
      expect(new Set(a).size).toBe(3);
      for (const id of a) expect(biomeDef(id).from).toBeLessThanOrEqual(map);
    }
  });

  it('every biome turns up', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) for (const id of rollBiomes(seed, 60)) seen.add(id);
    expect([...seen].sort()).toEqual(BIOMES.map((b) => b.id).sort());
  });

  it('a pinned map type always has its biome', () => {
    for (const t of MAP_TYPES) {
      const pin = PINNED_BIOME[t.id];
      if (!pin) continue;
      for (let slot = 0; slot < 3; slot++) expect(biomeFor(5, 30, slot, t.id)).toBe(pin);
    }
    expect(biomeFor(5, 30, 1, 'plain')).toBe(rollBiomes(5, 30)[1]);
  });
});
