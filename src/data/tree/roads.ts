import { mod } from '../../mods/types';
import type { RoadStat } from './builder';
import type { RegionId } from './spec';

/**
 * What a road is made of (docs/TREE-REDESIGN.md 3.1): small nodes of generic stats that any build that goes that way can use,
 * never a weapon or a skill type. Values are the units of `power.ts` (one small node), so a road node is worth the same as a
 * cluster's small node of the same stat.
 */
const P = {
  life: { name: 'Maximum Life', mods: [mod('life', 'inc', 5)] },
  mana: { name: 'Maximum Mana', mods: [mod('mana', 'inc', 8)] },
  es: { name: 'Maximum Energy Shield', mods: [mod('es', 'inc', 5)] },
  armour: { name: 'Armour', mods: [mod('armour', 'inc', 12)] },
  evasion: { name: 'Evasion Rating', mods: [mod('evasion', 'inc', 12)] },
  damage: { name: 'Damage', mods: [mod('damage', 'inc', 7)] },
  spellDamage: { name: 'Spell Damage', mods: [mod('damage', 'inc', 7, { tags: ['spell'] })] },
  castSpeed: { name: 'Cast Speed', mods: [mod('castSpeed', 'inc', 4)] },
  attackSpeed: { name: 'Attack Speed', mods: [mod('attackSpeed', 'inc', 3)] },
  crit: { name: 'Critical Strike Chance', mods: [mod('critChance', 'inc', 20)] },
  accuracy: { name: 'Accuracy Rating', mods: [mod('accuracy', 'inc', 10)] },
  moveSpeed: { name: 'Movement Speed', mods: [mod('moveSpeed', 'inc', 5)] },
  regen: { name: 'Life Regeneration', mods: [mod('lifeRegenPct', 'base', 0.4)] },
  res: { name: 'Elemental Resistances', mods: [mod('resist.allEle', 'base', 4)] },
} satisfies Record<string, RoadStat>;

/** The pool of each region's roads, and of the middle's. */
export const ROAD_POOLS: Record<RegionId | 'hub', RoadStat[]> = {
  int: [P.es, P.mana, P.spellDamage, P.castSpeed],
  dexint: [P.evasion, P.es, P.damage, P.crit],
  dex: [P.evasion, P.moveSpeed, P.attackSpeed, P.life],
  strdex: [P.armour, P.evasion, P.damage, P.life],
  str: [P.life, P.armour, P.damage, P.regen],
  strint: [P.life, P.mana, P.armour, P.es],
  hub: [P.life, P.damage, P.res, P.moveSpeed],
};
