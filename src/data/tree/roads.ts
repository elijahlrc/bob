import { mod } from '../../mods/types';
import type { RoadStat } from './builder';
import type { RegionId } from './spec';

/**
 * What a road is made of (docs/TREE-REDESIGN.md 3.1): small nodes of generic stats that any build that goes that way can use,
 * never a weapon or a skill type. Values are the units of `power.ts` (one small node), so a road node is worth the same as a
 * cluster's small node of the same stat.
 */
export const P = {
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

/**
 * The basics of each class, on the small nodes of the first stretch of its two roads out of the start (iteration 5, the user: the
 * first ten or so very core; `layout.ts`). Life and energy shield are a lever: five to ten percent on the way out in all, the
 * rest is what most builds of the class use (the speeds, the defence it is built on, damage). The first road goes to the district of
 * the very core, the second to the next one.
 */
export const START_KIT: Record<RegionId, [RoadStat[], RoadStat[]]> = {
  int: [
    [P.es, P.castSpeed, P.mana, P.spellDamage],
    [P.crit, P.spellDamage, P.castSpeed, P.mana],
  ],
  dexint: [
    [P.evasion, P.es, P.crit, P.evasion],
    [P.damage, P.castSpeed, P.attackSpeed, P.evasion],
  ],
  dex: [
    [P.evasion, P.life, P.attackSpeed, P.moveSpeed],
    [P.accuracy, P.attackSpeed, P.damage, P.evasion],
  ],
  strdex: [
    [P.life, P.armour, P.attackSpeed, P.evasion],
    [P.damage, P.armour, P.accuracy, P.attackSpeed],
  ],
  str: [
    [P.life, P.armour, P.damage, P.armour],
    [P.armour, P.attackSpeed, P.regen, P.damage],
  ],
  strint: [
    [P.life, P.armour, P.es, P.damage],
    [P.armour, P.damage, P.castSpeed, P.regen],
  ],
};

/**
 * One basic notable on each road out of a start (iteration 5): a side option on the way, of the very core of the class. A cluster of
 * ours (`theme` of notableThemes.ts), its small nodes the stat of the road named in `smalls` so that life and energy shield do not
 * pile up. Names are ours.
 */
export const STARTERS: Record<
  RegionId,
  [
    { name: string; theme: string; smalls?: keyof typeof P },
    { name: string; theme: string; smalls?: keyof typeof P },
  ]
> = {
  int: [
    { name: 'Lamplit Well', theme: 'es', smalls: 'spellDamage' },
    { name: 'Quick Study', theme: 'castSpeed', smalls: 'crit' },
  ],
  dexint: [
    { name: 'Dusk Step', theme: 'esEvasion', smalls: 'evasion' },
    { name: 'Sure Sight', theme: 'accuracy' },
  ],
  dex: [
    { name: 'Light Tread', theme: 'evasion', smalls: 'moveSpeed' },
    { name: 'Settled Grip', theme: 'attackSpeed', smalls: 'accuracy' },
  ],
  strdex: [
    { name: 'Stout Frame', theme: 'lifePct', smalls: 'armour' },
    { name: 'Whetted Edge', theme: 'meleePhys', smalls: 'damage' },
  ],
  str: [
    { name: 'Iron Constitution', theme: 'lifePct', smalls: 'damage' },
    { name: 'Thick Hide', theme: 'armour', smalls: 'armour' },
  ],
  strint: [
    { name: 'Vigil Mantle', theme: 'armourEs', smalls: 'armour' },
    { name: 'Quiet Focus', theme: 'spell', smalls: 'damage' },
  ],
};
