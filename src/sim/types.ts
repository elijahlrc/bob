import type { Character, SkillChoice } from '../calc/character';
import type { Defence } from '../calc/combat';
import type { FlaskSpec } from '../calc/flasks';
import type { MonsterStats } from '../calc/monster';
import type { SkillProfile } from '../calc/skill';
import type { Rng } from '../core/rng';
import type { MonsterModId, MonsterRarity } from '../data/monsters';
import type { AnyItem, Build } from '../data/types';
import type { MapPlan } from '../gen/mapPlan';
import type { Grid } from './grid';

export type Dot = { dps: number; t: number; stack?: boolean };

export type Ailments = {
  ignites: Dot[];
  bleeds: Dot[];
  poisons: Dot[];
  shock: number;
  shockT: number;
  chill: number;
  chillT: number;
  freezeT: number;
};

export type Action = {
  profile: SkillProfile;
  /** Which skill: 'primary', 'default' or 'monster'. */
  which: 'primary' | 'default' | 'monster';
  hand: number;
  duration: number;
  elapsed: number;
  fired: boolean;
  targetId: number;
  aimX: number;
  aimY: number;
};

export type MonsterState = 'idle' | 'chase' | 'leash';

export type Actor = {
  id: number;
  isPlayer: boolean;
  faction: 0 | 1;
  x: number;
  y: number;
  r: number;
  facing: number;
  alive: boolean;
  life: number;
  es: number;
  mana: number;
  /** Cached defence for the current state. */
  def: Defence;
  action: Action | null;
  carry: number;
  handIdx: number;
  ail: Ailments;
  stunT: number;
  graceT: number;
  leechLife: number[];
  leechMana: number[];
  sinceDamaged: number;
  tKill: number;
  tCrit: number;
  tHit: number;
  tFlask: number;
  tStunEnemy: number;
  tBlock: number;
  tOverload: number;
  resShift: number[];
  resShiftT: number;
  moving: boolean;
  // Monster-only.
  mon?: MonsterStats;
  name: string;
  rarity: MonsterRarity | 'player';
  modIds: MonsterModId[];
  room: number;
  pack: number;
  homeX: number;
  homeY: number;
  state: MonsterState;
  lostT: number;
  noticeT: number;
  noReward: boolean;
  raiserT: number;
  slamT: number;
  bossPhase: number;
  summonedBy: number;
};

export type Projectile = {
  id: number;
  owner: number;
  faction: 0 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  travelled: number;
  maxRange: number;
  profile: SkillProfile;
  hand: number;
  hitIds: number[];
  pierceLeft: number;
  explodeRadius: number;
  startX: number;
  startY: number;
  dtype: number;
};

export type GroundEffect = {
  id: number;
  x: number;
  y: number;
  radius: number;
  t: number;
  total: number;
  kind: 'volatile' | 'slam' | 'explosion';
  damage: number;
  dtype: number;
  faction: 0 | 1;
};

export type Drop = { id: number; x: number; y: number; item: AnyItem };
export type Chest = { id: number; x: number; y: number; room: number; opened: boolean };

export type FlaskState = {
  spec: FlaskSpec;
  charges: number;
  /** Remaining active time for utility buffs / recovery. */
  activeT: number;
  queued: boolean;
  /** Recovery per second while active (life/mana flasks). */
  lifeRate: number;
  manaRate: number;
};

export type SimEvent =
  | { t: 'hit'; src: number; dst: number; amount: number; crit: boolean; dtype: number }
  | { t: 'dot'; dst: number; amount: number }
  | { t: 'miss'; src: number; dst: number }
  | { t: 'block'; src: number; dst: number }
  | { t: 'stun'; dst: number; dur: number }
  | { t: 'ailment'; dst: number; kind: string }
  | { t: 'death'; id: number }
  | { t: 'levelUp'; level: number }
  | { t: 'drop'; id: number }
  | { t: 'pickup'; id: number }
  | { t: 'chest'; id: number }
  | { t: 'flaskUsed'; idx: number }
  | { t: 'projectileSpawned'; id: number }
  | { t: 'use'; src: number; skill: string }
  | { t: 'chain'; from: number; to: number }
  | { t: 'explode'; x: number; y: number; r: number; dtype: number }
  | { t: 'stuck' }
  | { t: 'exitOpen' }
  | { t: 'cleared' }
  | { t: 'playerDied' }
  | { t: 'summon'; id: number };

export type MapStatus = 'running' | 'cleared' | 'dead' | 'timeout';

export type PlayerAI = {
  mode: 'advance' | 'engage' | 'loot' | 'exit';
  wp: number;
  path: { x: number; y: number }[];
  pathKey: string;
  pathT: number;
  targetId: number;
  scanT: number;
  stuckT: number;
  stuckX: number;
  stuckY: number;
};

export type WorldOpts = {
  /** Called when a monster dies; returns dropped items. */
  loot?: (w: World, m: Actor) => AnyItem[];
  /** Called when a chest opens; returns its contents. */
  chestLoot?: (w: World, c: Chest) => AnyItem[];
  /** Hard cap on simulated seconds. */
  maxTime?: number;
};

export type World = {
  plan: MapPlan;
  grid: Grid;
  t: number;
  tick: number;
  rngCombat: Rng;
  rngAi: Rng;
  rngLoot: Rng;
  actors: Actor[];
  player: Actor;
  nextId: number;
  projectiles: Projectile[];
  effects: GroundEffect[];
  drops: Drop[];
  chests: Chest[];
  events: SimEvent[];
  build: Build;
  char: Character;
  primary: SkillChoice;
  flasks: FlaskState[];
  xp: number;
  status: MapStatus;
  exitOpen: boolean;
  endRoom: number;
  ai: PlayerAI;
  opts: WorldOpts;
  stats: {
    kills: number;
    xpGained: number;
    stuck: number;
    picked: number;
    damageTaken: number;
    damageDealt: number;
  };
  picked: AnyItem[];
};
