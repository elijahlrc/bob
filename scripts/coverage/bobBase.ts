/**
 * Picks the Bob item base for a reference unique: same item class, same defence type, the tier nearest its level.
 * Weapons keep their family (a thrusting sword, a rune dagger). Rings, amulets and belts have few bases, so the
 * reference base's implicit decides.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ITEM_BASES } from '../../src/data/bases';
import { COVERAGE_DIR, norm } from './reference';
import type { PobBase } from './pob-bases';

let cache: Map<string, PobBase> | null = null;

export function pobBase(name: string): PobBase | undefined {
  if (!cache) {
    const all = (
      JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'pob-bases.json'), 'utf8')) as {
        bases: PobBase[];
      }
    ).bases;
    cache = new Map(all.map((b) => [norm(b.name), b]));
  }
  return cache.get(norm(name));
}

const ARMOUR_LEVELS = [1, 20, 40, 60];
const WEAPON_LEVELS = [1, 15, 30, 45, 60];

const nearest = (levels: number[], level: number): number => {
  let best = 0;
  levels.forEach((l, i) => {
    if (Math.abs(l - level) < Math.abs(levels[best] - level)) best = i;
  });
  return best + 1;
};

const WEAPON_PREFIX: Record<string, string> = {
  'One Handed Sword': 'sword',
  'Thrusting One Handed Sword': 'thrust',
  'Two Handed Sword': 'sword2',
  'One Handed Axe': 'axe',
  'Two Handed Axe': 'axe2',
  'One Handed Mace': 'mace',
  'Two Handed Mace': 'mace2',
  Sceptre: 'sceptre',
  Dagger: 'dagger',
  Claw: 'claw',
  Wand: 'wand',
  Staff: 'staff',
  Bow: 'bow',
};

const SLOT_PREFIX: Record<string, string> = {
  'Body Armour': 'body',
  Helmet: 'helmet',
  Gloves: 'gloves',
  Boots: 'boots',
  Shield: 'shield',
};

function defType(b: PobBase): string {
  return (
    (b.armour > 0 ? 'ar' : '') + (b.evasion > 0 ? 'ev' : '') + (b.energyShield > 0 ? 'es' : '')
  );
}

/** The Bob base id for a reference base name and class, or null when none fits (flasks, jewels). */
export function bobBaseFor(refBaseName: string, refClass: string): string | null {
  const b = pobBase(refBaseName);
  if (!b) return null;
  const type = b.type || refClass;
  const has = (id: string) => ITEM_BASES.some((x) => x.id === id);
  const slot = SLOT_PREFIX[type];
  if (slot) {
    const d = defType(b) || 'ar';
    const tier = nearest(ARMOUR_LEVELS, b.level);
    const id = `${slot}_${d}_${tier}`;
    if (has(id)) return id;
    return has(`${slot}_ar_${tier}`) ? `${slot}_ar_${tier}` : null;
  }
  const w = WEAPON_PREFIX[type];
  if (w) {
    const family = w === 'dagger' && /spell damage/i.test(b.implicit) ? 'runedagger' : w;
    const id = `${family}_${nearest(WEAPON_LEVELS, b.level)}`;
    return has(id) ? id : `${w}_${nearest(WEAPON_LEVELS, b.level)}`;
  }
  const imp = b.implicit.toLowerCase();
  if (type === 'Ring') {
    if (imp.includes('fire resist')) return 'ring_fire';
    if (imp.includes('cold resist')) return 'ring_cold';
    if (imp.includes('lightning resist')) return 'ring_light';
    if (imp.includes('all elemental')) return 'ring_all';
    return 'ring_mana';
  }
  if (type === 'Amulet') {
    if (imp.includes('all attributes')) return 'amulet_all';
    if (imp.includes('strength')) return 'amulet_str';
    if (imp.includes('dexterity')) return 'amulet_dex';
    if (imp.includes('intelligence')) return 'amulet_int';
    return 'amulet_all';
  }
  if (type === 'Belt') {
    if (imp.includes('armour')) return 'belt_armour';
    if (imp.includes('energy shield')) return 'belt_es';
    return 'belt_life';
  }
  if (type === 'Quiver') return imp.includes('physical') ? 'quiver_phys' : 'quiver_acc';
  return null;
}
