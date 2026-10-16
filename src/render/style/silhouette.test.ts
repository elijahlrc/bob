import { describe, expect, it } from 'vitest';
import { MONSTER_TYPES, type MonsterTypeId } from '../../data/monsters';
import { sheetSvg } from './sheet';

const TYPES = Object.keys(MONSTER_TYPES) as MonsterTypeId[];

describe('the contact sheet', () => {
  it('draws every type, in colour and in one flat colour, in several poses', () => {
    const colour = sheetSvg();
    for (const id of TYPES) expect(colour).toContain(MONSTER_TYPES[id].name);
    expect(colour.startsWith('<svg')).toBe(true);
    const mono = sheetSvg({
      mono: true,
      k: 0.6,
      poses: [
        ['idle', 0],
        ['walk', 0.25],
        ['attack', 0.5],
      ],
      types: ['warrior', 'hexer'],
    });
    expect(mono).toContain(MONSTER_TYPES.hexer.name);
    expect(mono).not.toContain(MONSTER_TYPES.gnawer.name);
  });
});
