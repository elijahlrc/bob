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
  int: [P.es, P.mana],
  dexint: [P.evasion, P.es],
  dex: [P.evasion, P.moveSpeed, P.life],
  strdex: [P.armour, P.evasion, P.life],
  str: [P.life, P.armour, P.regen],
  strint: [P.life, P.mana, P.armour, P.es],
  hub: [P.life, P.res, P.moveSpeed],
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
    [P.accuracy, P.castSpeed, P.attackSpeed, P.evasion],
  ],
  dex: [
    [P.evasion, P.life, P.attackSpeed, P.moveSpeed],
    [P.accuracy, P.attackSpeed, P.crit, P.evasion],
  ],
  strdex: [
    [P.life, P.armour, P.attackSpeed, P.evasion],
    [P.accuracy, P.armour, P.attackSpeed, P.res],
  ],
  str: [
    [P.life, P.armour, P.attackSpeed, P.armour],
    [P.armour, P.attackSpeed, P.regen, P.accuracy],
  ],
  strint: [
    [P.life, P.armour, P.es, P.castSpeed],
    [P.armour, P.res, P.castSpeed, P.regen],
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
    { name: 'Sure Sight', theme: 'accuracy', smalls: 'accuracy' },
  ],
  dex: [
    { name: 'Light Tread', theme: 'evasion', smalls: 'moveSpeed' },
    { name: 'Settled Grip', theme: 'attackSpeed', smalls: 'accuracy' },
  ],
  strdex: [
    { name: 'Stout Frame', theme: 'lifePct', smalls: 'armour' },
    { name: 'Whetted Edge', theme: 'meleePhys', smalls: 'attackSpeed' },
  ],
  str: [
    { name: 'Iron Constitution', theme: 'lifePct', smalls: 'regen' },
    { name: 'Thick Hide', theme: 'armour', smalls: 'armour' },
  ],
  strint: [
    { name: 'Vigil Mantle', theme: 'armourEs', smalls: 'armour' },
    { name: 'Quiet Focus', theme: 'spell', smalls: 'castSpeed' },
  ],
};

/**
 * Basic clusters added where the ground around a start is thinnest (iteration 6, the user: still sparse around the starts; about
 * fifty nodes of the basics). What the reference tree has near its class starts is the model of the mix (life, mana, damage,
 * attributes, accuracy, the speeds, energy shield, resistances: only the kinds, none of its nodes, names or places); these are ours.
 * `fillSparse` in layout.ts puts them, each class at least one, the rest where the ground is emptiest. `smalls` names a stat of the
 * roads for the small nodes instead of the theme's; `strength` raises the notable (the floor of power.ts).
 */
export type FillSpec = {
  name: string;
  theme: string;
  smalls?: keyof typeof P;
  strength?: number;
  smallCount?: number;
};
export const FILL: Record<RegionId, FillSpec[]> = {
  int: [
    { name: 'Still Waters', theme: 'mana', smalls: 'castSpeed' },
    { name: 'Kindled Mind', theme: 'spell', smalls: 'crit' },
    { name: 'Quiet Tide', theme: 'esRecharge' },
    { name: 'Candle at Noon', theme: 'spell' },
    { name: 'Weighed Silence', theme: 'reservation' },
    { name: 'Clear Skies', theme: 'maxRes' },
  ],
  dexint: [
    { name: 'Quiet Footing', theme: 'moveSpeed', smalls: 'evasion', strength: 1.4 },
    { name: 'Sharp Instinct', theme: 'accuracy', smalls: 'accuracy' },
    { name: 'Dim Lantern', theme: 'castSpeed' },
    { name: 'Thin Ice Step', theme: 'esEvasion' },
    { name: "Cat's Patience", theme: 'accuracy', smalls: 'accuracy' },
    { name: 'Shadow Stitch', theme: 'esEvasion' },
  ],
  dex: [
    { name: 'Swift Quiver', theme: 'projectile' },
    { name: "Hawk's Patience", theme: 'accuracy', smalls: 'attackSpeed', smallCount: 4 },
    { name: 'Reed-Walker', theme: 'moveSpeed', strength: 1.4 },
    { name: 'Dry Wind', theme: 'moveSpeed', smalls: 'evasion', strength: 1.4 },
    { name: 'Quick Draw Habit', theme: 'attackSpeed' },
    { name: 'Far Sight', theme: 'projSpeed' },
  ],
  strdex: [
    { name: 'Hardened Hands', theme: 'armour' },
    { name: 'Even Breath', theme: 'lifeRegen', smallCount: 4 },
    { name: 'Rolled Shoulder', theme: 'physReduction' },
    { name: 'Boot Leather', theme: 'moveSpeed', strength: 1.4 },
    { name: 'Anvil Hours', theme: 'meleePhys' },
    { name: 'Layered Wool', theme: 'physReduction', smalls: 'regen' },
  ],
  str: [
    { name: 'Mulish Will', theme: 'lifeRegen' },
    { name: 'Stone Resolve', theme: 'eleRes' },
    { name: 'Set Jaw', theme: 'stunThreshold' },
    { name: 'Crude Plate', theme: 'armour', smalls: 'armour' },
    { name: 'Heft', theme: 'meleePhys', smalls: 'attackSpeed' },
    { name: 'Banked Coals', theme: 'lifeRegen', smalls: 'regen' },
  ],
  strint: [
    { name: 'Candleward', theme: 'eleRes' },
    { name: 'Measured Breath', theme: 'mana' },
    { name: 'Plain Habit', theme: 'armourEs' },
    { name: 'Vestry Hours', theme: 'es', smalls: 'armour' },
    { name: 'Tithe of Calm', theme: 'reservation' },
    { name: 'Warm Hands', theme: 'lifeRegen', smalls: 'regen' },
  ],
};

/**
 * The threads of a start (iteration 6, the user: a fork between various simple basic lines is brainless; take inspiration from the
 * reference tree). Near a class start every stretch of road between two forks is one stat, a thread, and the threads that leave a
 * fork are different stats; so a fork is a choice between lines that are about something, and a few lead to a basic notable on the
 * path. `THREADS` is the stats a class's threads are drawn from, in turn (life and energy shield once each at most: a lever).
 */
export const THREADS: Record<RegionId, (keyof typeof P)[]> = {
  int: ['es', 'mana', 'castSpeed', 'spellDamage', 'crit', 'res'],
  dexint: ['evasion', 'es', 'crit', 'castSpeed', 'attackSpeed', 'accuracy'],
  dex: ['evasion', 'attackSpeed', 'moveSpeed', 'accuracy', 'life', 'crit'],
  strdex: ['life', 'armour', 'attackSpeed', 'evasion', 'res', 'accuracy'],
  str: ['life', 'armour', 'accuracy', 'regen', 'attackSpeed', 'res'],
  strint: ['life', 'es', 'armour', 'mana', 'castSpeed', 'res'],
};

/** The theme (notableThemes.ts) of a basic notable at the end of a thread of a stat. */
const THREAD_THEME: Partial<Record<keyof typeof P, { theme: string; strength?: number }>> = {
  life: { theme: 'hardy' },
  es: { theme: 'esRecharge' },
  armour: { theme: 'sturdy' },
  evasion: { theme: 'evasion' },
  mana: { theme: 'mana' },
  castSpeed: { theme: 'castSpeed' },
  attackSpeed: { theme: 'attackSpeed' },
  crit: { theme: 'critChance', strength: 1.3 },
  accuracy: { theme: 'accuracy' },
  moveSpeed: { theme: 'moveSpeed', strength: 1.4 },
  regen: { theme: 'lifeRegen' },
  res: { theme: 'maxRes' },
  spellDamage: { theme: 'spell' },
};

/** The basic notables on the paths near a start: a thread of this stat leads to it. Names are ours. */
export const PATH_NOTABLES: Record<RegionId, { stat: keyof typeof P; name: string }[]> = {
  int: [
    { stat: 'es', name: 'Hushed Reserve' },
    { stat: 'mana', name: 'Deep Draught' },
    { stat: 'spellDamage', name: 'Practised Weave' },
  ],
  dexint: [
    { stat: 'evasion', name: 'Reed in the Wind' },
    { stat: 'es', name: 'Shaded Ward' },
    { stat: 'castSpeed', name: 'Quick Whisper' },
  ],
  dex: [
    { stat: 'evasion', name: 'Dust Behind' },
    { stat: 'attackSpeed', name: 'Loosed Cord' },
    { stat: 'life', name: 'Long Wind' },
  ],
  strdex: [
    { stat: 'life', name: 'Hale Constitution' },
    { stat: 'armour', name: 'Plate and Padding' },
    { stat: 'attackSpeed', name: 'Practised Swing' },
    { stat: 'res', name: 'Cold Water Drill' },
  ],
  str: [
    { stat: 'life', name: 'Ox-Hearted' },
    { stat: 'armour', name: 'Wrapped in Hide' },
    { stat: 'regen', name: 'Tireless Breath' },
    { stat: 'res', name: 'Weathered Skin' },
  ],
  strint: [
    { stat: 'life', name: 'Lantern-Bearer' },
    { stat: 'es', name: 'Sacristy Glow' },
    { stat: 'armour', name: 'Chainmail Prayer' },
    { stat: 'res', name: 'Chapel Hush' },
  ],
};
export { THREAD_THEME };
