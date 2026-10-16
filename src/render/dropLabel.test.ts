import { describe, expect, it } from 'vitest';
import type { AnyItem } from '../data/types';
import { DROP_COLOR, dropRarity } from './dropLabel';

const item = (rarity: 'normal' | 'unique'): AnyItem => ({
  kind: 'item',
  uid: 1,
  baseId: 'x',
  rarity,
  name: 'Gloom Grip',
  ilvl: 1,
  implicits: [],
  affixes: [],
  sockets: [],
});

describe('drop labels', () => {
  it('colours every drop kind', () => {
    const kinds: AnyItem[] = [
      item('normal'),
      item('unique'),
      { kind: 'gem', uid: 2, gemId: 'crushingBlow' },
      { kind: 'currency', uid: 3, id: 'ember', count: 1 },
      { kind: 'flask', uid: 4, baseId: 'f', ilvl: 1, name: 'F', affixes: [] },
      { kind: 'flask', uid: 5, baseId: 'f', ilvl: 1, name: 'F', affixes: [], uniqueId: 'u' },
    ];
    for (const k of kinds) expect(DROP_COLOR[dropRarity(k)]).toBeDefined();
    expect(dropRarity(kinds[5])).toBe('unique');
  });
});
