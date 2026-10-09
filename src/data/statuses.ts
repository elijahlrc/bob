/**
 * Statuses a skill can put on an enemy (docs/SPIRIT.md S3): the debuffs that are not curses and not ailments. A skill names
 * one with a chance on hit (`status.<id>.chance`), and the status says what it does and how it lasts. Magnitudes are the
 * reference game's 3.9 values; `v` is the main one (a slow, a share of hits that miss), `x` a second one a gem can give.
 */
export type StatusId =
  | 'hinder'
  | 'maim'
  | 'blind'
  | 'immobilised'
  | 'bound'
  | 'ensnared'
  | 'withered'
  | 'exposedLightning'
  | 'exposedCold'
  | 'exposedFire'
  | 'overpowered'
  | 'doomed';

export const STATUS_IDS: StatusId[] = [
  'hinder',
  'maim',
  'blind',
  'immobilised',
  'bound',
  'ensnared',
  'withered',
  'exposedLightning',
  'exposedCold',
  'exposedFire',
  'overpowered',
  'doomed',
];

export type StatusDef = {
  id: StatusId;
  name: string;
  /** Seconds a gain lasts unless the skill says otherwise (before duration modifiers). */
  seconds: number;
  /** The main magnitude, in percent, unless the skill gives its own. */
  v: number;
  /** How many stacks it can have; 1 means it is renewed, not stacked. */
  max: number;
  /** What it does, for the inspect panel: a line with `{v}` and `{n}`. */
  text: string;
};

export const STATUSES: Record<StatusId, StatusDef> = {
  hinder: {
    id: 'hinder',
    name: 'Hindered',
    seconds: 0.5,
    v: 30,
    max: 1,
    text: '{v}% reduced movement speed',
  },
  maim: {
    id: 'maim',
    name: 'Maimed',
    seconds: 4,
    v: 30,
    max: 1,
    text: '{v}% reduced movement speed',
  },
  blind: {
    id: 'blind',
    name: 'Blinded',
    seconds: 4,
    v: 50,
    max: 1,
    text: '{v}% less chance to hit with attacks',
  },
  immobilised: {
    id: 'immobilised',
    name: 'Immobilised',
    seconds: 1,
    v: 100,
    max: 1,
    text: 'cannot move',
  },
  bound: {
    id: 'bound',
    name: 'Shackled',
    seconds: 3,
    v: 80,
    max: 1,
    text: '{v}% reduced movement speed, fading, and {x}% increased damage from traps and mines',
  },
  ensnared: {
    id: 'ensnared',
    name: 'Ensnared',
    seconds: 4,
    v: 40,
    max: 3,
    text: '{n} snares, each {v}% less movement speed; {x}% increased damage from projectile attack hits',
  },
  withered: {
    id: 'withered',
    name: 'Withered',
    seconds: 2,
    v: 6,
    max: 15,
    text: '{n} stacks: {v}% increased chaos damage taken each',
  },
  exposedLightning: {
    id: 'exposedLightning',
    name: 'Exposed to Lightning',
    seconds: 4,
    v: 25,
    max: 1,
    text: '-{v}% to lightning resistance',
  },
  exposedCold: {
    id: 'exposedCold',
    name: 'Exposed to Cold',
    seconds: 4,
    v: 25,
    max: 1,
    text: '-{v}% to cold resistance',
  },
  exposedFire: {
    id: 'exposedFire',
    name: 'Exposed to Fire',
    seconds: 4,
    v: 25,
    max: 1,
    text: '-{v}% to fire resistance',
  },
  overpowered: {
    id: 'overpowered',
    name: 'Overpowered',
    seconds: 4,
    v: 5,
    max: 100,
    text: '{n} stacks: {v}% reduced chance to block each',
  },
  doomed: {
    id: 'doomed',
    name: 'Doomed',
    seconds: 6,
    v: 8,
    max: 1,
    text: 'explodes for {v}% of its life when it dies',
  },
};

/** The damage type index (0 physical, 1 lightning, 2 cold, 3 fire, 4 chaos) an exposure lowers the resistance of. */
export const EXPOSURE_TYPE: Partial<Record<StatusId, number>> = {
  exposedLightning: 1,
  exposedCold: 2,
  exposedFire: 3,
};

/** The stat ids of a skill's chance to inflict a status on hit (percent), and its overrides. */
export const statusChance = (id: StatusId): string => `status.${id}.chance`;
/** A skill's own length for a status, in seconds. */
export const statusSeconds = (id: StatusId): string => `status.${id}.seconds`;
/** A skill's own main magnitude, in percent. */
export const statusMagnitude = (id: StatusId): string => `status.${id}.v`;
/** A skill's second magnitude (the damage a maimed enemy takes, the damage a snared one takes from projectiles). */
export const statusExtra = (id: StatusId): string => `status.${id}.x`;
/** Stat id of the chance a hit makes a monster flee. */
export const FLEE_CHANCE = 'status.flee.chance';
export const STATUS_STAT = /^status\./;
