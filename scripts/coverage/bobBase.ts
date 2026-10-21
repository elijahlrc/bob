/**
 * Picks the Bob item base for a reference unique: the base the game has for that very reference base (every droppable
 * reference base has one, under the name reference/coverage/base-names.json gives it). A reference base the game does not take on
 * (the special bases, a quest sword, a league belt or ring) falls back to the base of the same class, type and nearest
 * level.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ITEM_BASES, itemBase } from '../../src/data/bases';
import { COVERAGE_DIR, norm } from './reference';
import type { RefBase } from './ref-bases-extract';

let cache: Map<string, RefBase> | null = null;
let names: Record<string, string> | null = null;

export function refBase(name: string): RefBase | undefined {
  if (!cache) {
    const all = (
      JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'ref-bases.json'), 'utf8')) as {
        bases: RefBase[];
      }
    ).bases;
    cache = new Map(all.map((b) => [norm(b.name), b]));
  }
  return cache.get(norm(name));
}

/** Our name for a reference base, from reference/coverage/base-names.json. */
export function bobNameFor(refBaseName: string): string | undefined {
  if (!names)
    names = JSON.parse(readFileSync(resolve(COVERAGE_DIR, 'base-names.json'), 'utf8')) as Record<
      string,
      string
    >;
  return names[refBaseName];
}

const WEAPON_FAMILY: Record<string, string> = {
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

function defType(b: RefBase): string {
  const t =
    (b.armour > 0 ? 'ar' : '') + (b.evasion > 0 ? 'ev' : '') + (b.energyShield > 0 ? 'es' : '');
  // A three-way base and a base with no defences (a special set) sit with the armour-and-evasion ones.
  return t === '' || t === 'arevees' ? (t === '' ? 'ar' : 'arev') : t;
}

/** The droppable base of a family (an id prefix) nearest a level. */
function nearestOf(prefix: string, level: number): string | null {
  let best: { id: string; level: number } | null = null;
  for (const b of ITEM_BASES) {
    if (b.uniqueOnly || !b.id.startsWith(`${prefix}_l`)) continue;
    if (!best || Math.abs(b.level - level) < Math.abs(best.level - level)) best = b;
  }
  return best?.id ?? null;
}

/** The Bob base id for a reference base name and class, or null when none fits (flasks, jewels). */
export function bobBaseFor(refBaseName: string, refClass: string): string | null {
  const b = refBase(refBaseName);
  if (!b) return null;
  const own = bobNameFor(b.name);
  if (own) {
    const hit = ITEM_BASES.find((x) => x.name === own);
    if (hit) return hit.id;
  }
  const type = b.type || refClass;
  const slot = SLOT_PREFIX[type];
  if (slot) return nearestOf(`${slot}_${defType(b)}`, b.level) ?? nearestOf(`${slot}_ar`, b.level);
  const w = WEAPON_FAMILY[type];
  if (w) return nearestOf(w, b.level);
  const known = (id: string) => {
    try {
      return itemBase(id).id;
    } catch {
      return null;
    }
  };
  if (type === 'Ring') return known('ring_mana');
  if (type === 'Amulet') return known('amulet_all');
  if (type === 'Belt') return known('belt_life');
  if (type === 'Quiver') return known('quiver_acc');
  return null;
}
