import { mod, type CondId, type Mod } from '../mods/types';

/**
 * The buff layer (COVERAGE C2, from AUDIT-3.9): timed states the player gains from events. Each buff is a condition
 * with fixed effects (the mods below, added to the character only when something can grant the buff), and the sim holds
 * the seconds left of each. Rage is different: it is a count, and each point is worth a little.
 * The names are descriptive; the effects follow the reference game's numbers.
 */
export type BuffId =
  | 'fortify'
  | 'onslaught'
  | 'unholyMight'
  | 'arcaneSurge'
  | 'bloodSurge'
  | 'steelHide'
  | 'moltenGuard'
  | 'deathless'
  | 'phaseRun'
  | 'enduringCry'
  | 'rallyingCry'
  | 'infernalCry'
  | 'warBanner'
  | 'dreadBanner'
  | 'witherStep';
export const BUFF_IDS: BuffId[] = [
  'fortify',
  'onslaught',
  'unholyMight',
  'arcaneSurge',
  'bloodSurge',
  'steelHide',
  'moltenGuard',
  'deathless',
  'phaseRun',
  'enduringCry',
  'rallyingCry',
  'infernalCry',
  'warBanner',
  'dreadBanner',
  'witherStep',
];

export type BuffDef = {
  id: BuffId;
  name: string;
  /** Seconds a gain lasts, before duration mods. */
  seconds: number;
  /** The condition that is true while the buff is up. */
  cond: CondId;
  text: string;
  /** What the buff does, as mods that hold while the condition is true. */
  mods: Mod[];
  /** Utility-skill buffs: what the gem gives is in the gem (its mods), and the sheet assumes it up only when it mostly is. */
  gem?: boolean;
};

const when = (cond: CondId): { condition: { id: CondId } } => ({ condition: { id: cond } });

export const BUFFS: Record<BuffId, BuffDef> = {
  bloodSurge: {
    id: 'bloodSurge',
    name: 'Blood Surge',
    seconds: 10,
    cond: 'bloodSurge',
    text: 'Blood Surge',
    mods: [],
    gem: true,
  },
  steelHide: {
    id: 'steelHide',
    name: 'Steel Hide',
    seconds: 3,
    cond: 'steelHide',
    text: 'Steel Hide',
    mods: [],
    gem: true,
  },
  moltenGuard: {
    id: 'moltenGuard',
    name: 'Molten Guard',
    seconds: 4,
    cond: 'moltenGuard',
    text: 'Molten Guard',
    mods: [],
    gem: true,
  },
  deathless: {
    id: 'deathless',
    name: 'Deathless',
    seconds: 4,
    cond: 'deathless',
    text: 'Deathless',
    mods: [],
    gem: true,
  },
  phaseRun: {
    id: 'phaseRun',
    name: 'Slipstream',
    seconds: 4,
    cond: 'phaseRun',
    text: 'Slipstream',
    mods: [],
    gem: true,
  },
  enduringCry: {
    id: 'enduringCry',
    name: 'Steadfast',
    seconds: 8,
    cond: 'enduringCry',
    text: 'Steadfast',
    mods: [],
    gem: true,
  },
  rallyingCry: {
    id: 'rallyingCry',
    name: 'Rallied',
    seconds: 8,
    cond: 'rallyingCry',
    text: 'Rallied',
    mods: [],
    gem: true,
  },
  infernalCry: {
    id: 'infernalCry',
    name: 'Kindled Fury',
    seconds: 8,
    cond: 'infernalCry',
    text: 'Kindled Fury',
    mods: [],
    gem: true,
  },
  warBanner: {
    id: 'warBanner',
    name: 'Standard of Valour',
    seconds: 8,
    cond: 'warBanner',
    text: 'Standard of Valour',
    mods: [],
    gem: true,
  },
  dreadBanner: {
    id: 'dreadBanner',
    name: 'Standard of Dread',
    seconds: 8,
    cond: 'dreadBanner',
    text: 'Standard of Dread',
    mods: [],
    gem: true,
  },
  witherStep: {
    id: 'witherStep',
    name: 'Rot Stride',
    seconds: 4,
    cond: 'witherStep',
    text: 'Rot Stride',
    mods: [],
    gem: true,
  },
  fortify: {
    id: 'fortify',
    name: 'Fortified',
    seconds: 4,
    cond: 'fortified',
    text: '20% less damage taken from hits',
    mods: [mod('hitTaken', 'more', -20, when('fortified'))],
  },
  onslaught: {
    id: 'onslaught',
    name: 'Quickened',
    seconds: 4,
    cond: 'onslaught',
    text: '20% increased attack, cast and movement speed',
    mods: [
      mod('attackSpeed', 'inc', 20, when('onslaught')),
      mod('castSpeed', 'inc', 20, when('onslaught')),
      mod('moveSpeed', 'inc', 20, when('onslaught')),
    ],
  },
  unholyMight: {
    id: 'unholyMight',
    name: 'Dread Might',
    seconds: 4,
    cond: 'unholyMight',
    text: 'Gain 30% of physical damage as extra chaos damage',
    mods: [mod('gain.physical.chaos', 'base', 30, when('unholyMight'))],
  },
  arcaneSurge: {
    id: 'arcaneSurge',
    name: 'Arcane Tide',
    seconds: 4,
    cond: 'arcaneSurge',
    text: '10% more spell damage, 10% increased cast speed, and 0.5% of maximum mana regenerated a second',
    mods: [
      mod('damage', 'more', 10, { tags: ['spell'], ...when('arcaneSurge') }),
      mod('castSpeed', 'inc', 10, when('arcaneSurge')),
      mod('manaRegenPct', 'base', 0.5, when('arcaneSurge')),
    ],
  },
};

/** The events a buff can be gained on, and the stat id of the chance, in percent: `buffOn.<event>.<buff>`. */
export const BUFF_EVENTS = [
  'stun',
  'cast',
  'kill',
  'hit',
  'meleeHit',
  'crit',
  'block',
  'hitTaken',
  'flask',
] as const;
export type BuffEvent = (typeof BUFF_EVENTS)[number];
export const buffStat = (event: BuffEvent, id: BuffId): string => `buffOn.${event}.${id}`;

/** Whether any mod gives a way to gain this buff. */
export function hasBuffSource(mods: readonly Mod[], id: BuffId): boolean {
  return mods.some((m) => m.stat.startsWith('buffOn.') && m.stat.endsWith(`.${id}`) && m.value > 0);
}

/**
 * Recovery on an event (a kill, a hit landed or taken, a block, a critical strike, a flask): a flat amount or a share of
 * the maximum of a pool, `recover.<event>.<pool>` and `recoverPct.<event>.<pool>`.
 */
export const RECOVER_POOLS = ['life', 'mana', 'es'] as const;
export type RecoverPool = (typeof RECOVER_POOLS)[number];
export const recoverStat = (event: BuffEvent, pool: RecoverPool): string =>
  `recover.${event}.${pool}`;
export const recoverPctStat = (event: BuffEvent, pool: RecoverPool): string =>
  `recoverPct.${event}.${pool}`;

export function hasRecoverSource(mods: readonly Mod[]): boolean {
  return mods.some(
    (m) => (m.stat.startsWith('recover.') || m.stat.startsWith('recoverPct.')) && m.value > 0,
  );
}

// Rage: a count from 0 to the maximum, worth 1% increased attack damage, 0.5% increased attack speed and 0.2%
// increased movement speed a point. One is lost every half second unless rage was gained or the player was hit lately.
export const BASE_MAX_RAGE = 50;
/** The dynamic mask the calc and the sim pass around holds flask bits below this shift and the rage count above. */
export const DYN_SHIFT = 8;
/** Rage the character sheet assumes when something can grant it. */
export const ASSUMED_RAGE = 20;
export const RAGE_DECAY_EVERY = 0.5;
/** Seconds after gaining rage or being hit before rage starts to drain. */
export const RAGE_HOLD = 4;
/** The stat id for gaining rage on an event: a number of points per event, `rageOn.<event>`. */
export const rageStat = (event: BuffEvent): string => `rageOn.${event}`;

/** What `n` points of rage add. */
export function rageMods(n: number): Mod[] {
  if (n <= 0) return [];
  const source = { kind: 'base' as const, id: 'rage' };
  return [
    mod('damage', 'inc', 1 * n, { tags: ['attack'] }),
    mod('attackSpeed', 'inc', 0.5 * n),
    mod('moveSpeed', 'inc', 0.2 * n),
  ].map((m) => ({ ...m, source }));
}

export function hasRageSource(mods: readonly Mod[]): boolean {
  return mods.some((m) => m.stat.startsWith('rageOn.') && m.value > 0);
}
