import type { DamageType } from '../mods/types';

/**
 * Minions (COVERAGE C6): allies a summon skill puts on the map. They follow the character, run at the nearest enemy and
 * strike it, using numbers from the summoning gem's level and the character's minion modifiers. They cannot be hurt
 * (enemies go for the character), so a minion that is not time-limited stays until the map ends.
 */
export type MinionId =
  | 'skeleton'
  | 'zombie'
  | 'spirit'
  | 'stoneGolem'
  | 'chaosGolem'
  | 'flameGolem'
  | 'iceGolem'
  | 'lightningGolem'
  | 'carrionGolem'
  | 'relic'
  | 'bot'
  | 'clone'
  | 'blade'
  | 'sentinel'
  | 'spectre'
  | 'radiant'
  | 'phantasm';

export type MinionDef = {
  id: MinionId;
  name: string;
  /** Damage of one strike, as a share of the spell damage curve at the gem's level. */
  dmg: number;
  /** Strikes a second, and how far a strike reaches (tiles). */
  rate: number;
  reach: number;
  /** Tiles a second. */
  speed: number;
  ranged: boolean;
  dtype: DamageType;
  /** A strike hits everything this close to the target too (tiles); 0 for a single target. */
  splash: number;
  /** Colour on the map. */
  color: number;
};

export const MINIONS: Record<MinionId, MinionDef> = {
  skeleton: {
    id: 'skeleton',
    name: 'Bone Servant',
    dmg: 0.5,
    rate: 1.4,
    reach: 1.4,
    speed: 4.2,
    ranged: false,
    dtype: 'physical',
    splash: 0,
    color: 0xd8d0b8,
  },
  zombie: {
    id: 'zombie',
    name: 'Risen Corpse',
    dmg: 0.85,
    rate: 1,
    reach: 1.5,
    speed: 3,
    ranged: false,
    dtype: 'physical',
    splash: 0.8,
    color: 0x7a8a5a,
  },
  spirit: {
    id: 'spirit',
    name: 'Raging Shade',
    dmg: 0.45,
    rate: 2,
    reach: 1.3,
    speed: 6,
    ranged: false,
    dtype: 'fire',
    splash: 0,
    color: 0xff6a30,
  },
  stoneGolem: {
    id: 'stoneGolem',
    name: 'Stone Colossus',
    dmg: 1.2,
    rate: 0.9,
    reach: 1.7,
    speed: 3,
    ranged: false,
    dtype: 'physical',
    splash: 1,
    color: 0x9a9080,
  },
  chaosGolem: {
    id: 'chaosGolem',
    name: 'Blight Colossus',
    dmg: 1.1,
    rate: 1.1,
    reach: 1.7,
    speed: 3.2,
    ranged: false,
    dtype: 'chaos',
    splash: 0.8,
    color: 0x8030b0,
  },
  flameGolem: {
    id: 'flameGolem',
    name: 'Ember Colossus',
    dmg: 1.1,
    rate: 1,
    reach: 6,
    speed: 3,
    ranged: true,
    dtype: 'fire',
    splash: 0.8,
    color: 0xff5020,
  },
  iceGolem: {
    id: 'iceGolem',
    name: 'Rime Colossus',
    dmg: 1.2,
    rate: 0.9,
    reach: 1.7,
    speed: 3,
    ranged: false,
    dtype: 'cold',
    splash: 0.8,
    color: 0x80c8ff,
  },
  lightningGolem: {
    id: 'lightningGolem',
    name: 'Storm Colossus',
    dmg: 1.1,
    rate: 1.2,
    reach: 6,
    speed: 3,
    ranged: true,
    dtype: 'lightning',
    splash: 0.6,
    color: 0xc0a0ff,
  },
  carrionGolem: {
    id: 'carrionGolem',
    name: 'Carrion Colossus',
    dmg: 1,
    rate: 1,
    reach: 1.7,
    speed: 3.4,
    ranged: false,
    dtype: 'physical',
    splash: 0.8,
    color: 0x6a4a3a,
  },
  relic: {
    id: 'relic',
    name: 'Hallowed Relic',
    dmg: 0.8,
    rate: 1,
    reach: 6,
    speed: 3,
    ranged: true,
    dtype: 'fire',
    splash: 0,
    color: 0xffe080,
  },
  bot: {
    id: 'bot',
    name: 'Whirring Mote',
    dmg: 0,
    rate: 1,
    reach: 1,
    speed: 5,
    ranged: false,
    dtype: 'physical',
    splash: 0,
    color: 0xa0e0ff,
  },
  clone: {
    id: 'clone',
    name: 'Shadow Archer',
    dmg: 1,
    rate: 1.2,
    reach: 8,
    speed: 0,
    ranged: true,
    dtype: 'physical',
    splash: 0,
    color: 0x6a6a90,
  },
  blade: {
    id: 'blade',
    name: 'Waking Blade',
    dmg: 0.8,
    rate: 1.5,
    reach: 1.3,
    speed: 5,
    ranged: false,
    dtype: 'physical',
    splash: 0,
    color: 0xc0c0d0,
  },
  sentinel: {
    id: 'sentinel',
    name: 'Animated Sentinel',
    dmg: 1.3,
    rate: 0.9,
    reach: 1.7,
    speed: 3.4,
    ranged: false,
    dtype: 'physical',
    splash: 0.8,
    color: 0xb0a070,
  },
  spectre: {
    id: 'spectre',
    name: 'Bound Shade',
    dmg: 1,
    rate: 1.1,
    reach: 5,
    speed: 3.6,
    ranged: true,
    dtype: 'chaos',
    splash: 0,
    color: 0x70c0a0,
  },
  radiant: {
    id: 'radiant',
    name: 'Radiant Champion',
    dmg: 1.1,
    rate: 1.2,
    reach: 1.5,
    speed: 4.5,
    ranged: false,
    dtype: 'physical',
    splash: 0,
    color: 0xfff0b0,
  },
  phantasm: {
    id: 'phantasm',
    name: 'Haunting Wisp',
    dmg: 0.7,
    rate: 1.4,
    reach: 5,
    speed: 4,
    ranged: true,
    dtype: 'chaos',
    splash: 0,
    color: 0x90ffc0,
  },
};

/** Damage of one minion strike at a gem level before the character's modifiers, as a multiple of the curve. */
export const MINION_ENEMY_RES = 0.85;
