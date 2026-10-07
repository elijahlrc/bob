import type { ClassDef } from './types';

/**
 * DESIGN.md §5.2. Classes differ only in attributes, starting weapons and tree start. A character starts with no
 * gems: the first skill gems come as rewards after the first maps (`SKILL_REWARD_MAPS`).
 */
export const CLASSES: ClassDef[] = [
  {
    id: 'vanguard',
    name: 'Vanguard',
    attrs: { str: 32, dex: 14, int: 14 },
    color: 0xc0503a,
    startWeapons: ['mace2_1'],
  },
  {
    id: 'strider',
    name: 'Strider',
    attrs: { str: 14, dex: 32, int: 14 },
    color: 0x5aa04a,
    startWeapons: ['bow_1'],
    startOffHand: 'quiver_acc',
  },
  {
    id: 'mystic',
    name: 'Mystic',
    attrs: { str: 14, dex: 14, int: 32 },
    color: 0x5a78d0,
    startWeapons: ['wand_1'],
  },
  {
    id: 'reaver',
    name: 'Reaver',
    attrs: { str: 23, dex: 23, int: 14 },
    color: 0xd09a3a,
    startWeapons: ['sword_1'],
    startOffHand: 'shield_ar_1',
  },
  {
    id: 'zealot',
    name: 'Zealot',
    attrs: { str: 23, dex: 14, int: 23 },
    color: 0xd0c070,
    startWeapons: ['sceptre_1'],
    startOffHand: 'shield_es_1',
  },
  {
    id: 'shade',
    name: 'Shade',
    attrs: { str: 14, dex: 23, int: 23 },
    color: 0x9a5ac0,
    startWeapons: ['dagger_1', 'dagger_1'],
  },
];

export function classDef(id: string): ClassDef {
  const c = CLASSES.find((x) => x.id === id);
  if (!c) throw new Error(`unknown class ${id}`);
  return c;
}
