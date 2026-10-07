import type { Character, SkillChoice } from '../calc/character';
import type { Defence } from '../calc/combat';
import type { FlaskSpec } from '../calc/flasks';
import type { MonsterStats } from '../calc/monster';
import type { SkillProfile } from '../calc/skill';
import type { Rng } from '../core/rng';
import type { MonsterModId, MonsterRarity } from '../data/monsters';
import type { AnyItem, Build } from '../data/types';
import type { MapPlan } from '../gen/mapPlan';
import type { BuffId } from '../data/buffs';
import type { Corpse } from './factions';
import type { HexState } from './hexes';
import type { Grid } from './grid';

export type Dot = { dps: number; t: number; stack?: boolean };

export type Ailments = {
  ignites: Dot[];
  /** How many ignites burn at once (the strongest count), set by whoever ignited it. */
  igniteMax: number;
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
  /** Which skill: 'primary', 'secondary', 'default', 'monster' or 'triggered'. */
  which: 'primary' | 'secondary' | 'default' | 'monster' | 'triggered' | 'utility';
  hand: number;
  duration: number;
  elapsed: number;
  fired: boolean;
  /** Repeats (Echoing Cast) already fired after the first. */
  echoes: number;
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
  /** Seconds since this actor was last hit (for "been hit recently"). */
  tBeenHit: number;
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
  /** Training dummy: never acts (convergence tests). */
  dummy: boolean;
  /** Ranged monsters: remaining retreat time and its cooldown. */
  retreatT: number;
  retreatCd: number;
  /** A monster raised from a corpse: no rewards, leaves no corpse, and a Shambler does not rise twice. */
  risen: boolean;
  /** A faction ability timer (raise, blink), and the time left of a blink telegraph. */
  skillT: number;
  blinkT: number;
  /** The Lantern Wight whose energy shield shell this monster carries. */
  shellBy: number;
  /** Seconds left of a phase-out (the Unremembered): immune, unseen and idle. */
  phaseT: number;
  /** Hexes on this actor (EXPANSION 5.7) and what they add up to. */
  hexes: HexState[];
  /** Impales on this actor: the physical damage each recorded, and the hits it has left. */
  impales: { dmg: number; hits: number }[];
  /** Resistance lowered by hexes, per damage type (index 0 unused). */
  hexRes: number[];
  hexVuln: number;
  hexVulnAll: number;
  hexDmg: number;
  hexSpeed: number;
  /** The Choir (EXPANSION 7.3): the censer aura time left, a Zealous boost, and Fervour stacks with their time left. */
  buffT: number;
  zealT: number;
  fervour: number;
  fervourT: number;
  /** Moves over walls (bats), never moves (nests, pylons, arbalests), and the time left of a beetle curled up. */
  flies: boolean;
  stationary: boolean;
  curlT: number;
  /** Where a burrowed Gnawing Queen will come up. */
  markX: number;
  markY: number;
  /** Seconds before a Hexcaller can hex again, and the time left of a Choirmaster channel. */
  hexCd: number;
  channelT: number;
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
  /** Who the shooter aimed at, and the closest this projectile came to them (diagnostics). */
  aimId: number;
  minDist: number;
  lastHitId: number;
  explodeRadius: number;
  startX: number;
  startY: number;
  dtype: number;
  /** A returning projectile: flying back toward its owner. */
  back?: boolean;
};

export type GroundEffect = {
  id: number;
  x: number;
  y: number;
  radius: number;
  t: number;
  total: number;
  kind: 'volatile' | 'slam' | 'explosion' | 'caustic' | 'burning' | 'chilling' | 'shocking';
  /** A blast: damage when it lands. A lasting zone (caustic, burning, chilling, shocking): damage per second. */
  damage: number;
  /** Zones: time since the last damage pulse. */
  acc?: number;
  dtype: number;
  faction: 0 | 1;
};

/** A zone a player skill left on the ground: it hits what stands in it every `interval` s, `pulsesLeft` times. */
export type SkillZone = {
  id: number;
  owner: number;
  profile: SkillProfile;
  hand: number;
  x: number;
  y: number;
  /** The far end of a strip (a wall or a stream); a circle has none. */
  x2?: number;
  y2?: number;
  radius: number;
  /** Seconds before the first pulse, between pulses, and to the next pulse. */
  delayT: number;
  interval: number;
  pulseT: number;
  /** Pulses still to come: duration over interval, rounded down (the calc counts the same). */
  pulsesLeft: number;
  dtype: number;
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
  /** Energy shield returned over time by a life-to-ES flask, and the time left. */
  esRate: number;
  esT: number;
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
  | { t: 'echo'; src: number; skill: string }
  | { t: 'trigger'; skill: string; kind: string }
  | { t: 'chain'; from: number; to: number }
  | { t: 'explode'; x: number; y: number; r: number; dtype: number }
  | { t: 'beam'; x: number; y: number; x2: number; y2: number; dtype: number }
  | { t: 'blink'; id: number; x: number; y: number; end: boolean }
  | { t: 'charge'; kind: string; count: number }
  | { t: 'buff'; id: string }
  | { t: 'hex'; id: number; hex: string }
  | { t: 'stuck' }
  | { t: 'stall'; id: number }
  | {
      t: 'projectileEnd';
      id: number;
      owner: number;
      aim: number;
      fate: 0 | 1 | 2 | 3;
      closest: number;
      lastHit: number;
    }
  | { t: 'exitOpen' }
  | { t: 'cleared' }
  | { t: 'playerDied' }
  | { t: 'summon'; id: number };

export type MapStatus = 'running' | 'cleared' | 'dead' | 'timeout';

/** One piece of damage the player took (kept for the last few seconds, for the death recap). */
export type DamageRecord = {
  t: number;
  /** What dealt it: a monster's name, or an effect such as "Burning". */
  name: string;
  rarity: string;
  mods: string[];
  dtype: number;
  amount: number;
};

/** Why the player died (EXPANSION section 9): the last seconds of damage, the killer, and your defences. */
export type DeathRecap = {
  time: number;
  killer: string;
  killerRarity: string;
  killerMods: string[];
  /** Damage taken in the last 5 seconds, by source and type, largest first. */
  lines: { name: string; dtype: number; amount: number }[];
  /** Resistances (fire, cold, lightning, chaos) and their caps, at the moment of death. */
  res: { fire: number; cold: number; lightning: number; chaos: number };
  maxRes: { fire: number; cold: number; lightning: number; chaos: number };
  /** Ailments the player carried. */
  ailments: string[];
  maxLife: number;
  maxEs: number;
};

export type PlayerAI = {
  mode: 'advance' | 'engage' | 'loot' | 'exit';
  wp: number;
  path: { x: number; y: number }[];
  pathKey: string;
  pathT: number;
  targetId: number;
  scanT: number;
  /** Stall breaker: the target being watched, its life when last damaged, and when. */
  /** Player projectiles that hit walls recently (resets after a quiet spell), and when the count began. */
  blocked: number;
  blockedT: number;
  /** Seconds left of closing in for a clearer shot. */
  repoT: number;
  watchId: number;
  watchLife: number;
  watchT: number;
  /** A target the player has given up on, and until when. */
  skipId: number;
  skipUntil: number;
  stuckT: number;
  stuckX: number;
  stuckY: number;
  /** The drop or chest the player is heading for, and since when (a loot hunt that goes nowhere is dropped). */
  lootId: number;
  lootSince: number;
};

export type WorldOpts = {
  /** Called when a monster dies; returns dropped items. */
  loot?: (w: World, m: Actor) => AnyItem[];
  /** Called when a chest opens; returns its contents. */
  chestLoot?: (w: World, c: Chest) => AnyItem[];
  /** Hard cap on simulated seconds. */
  maxTime?: number;
  /** Refill the player's life and mana every tick (training-dummy tests). */
  freeResources?: boolean;
  /** Balance probes: the player cannot die (life is restored at 1). */
  godMode?: boolean;
};

/** Runtime state of the triggers (EXPANSION 5.5), keyed by trigger source. */
export type TriggerRuntime = {
  /** Seconds left on each source's cooldown. */
  cooldown: Record<string, number>;
  /** Damage taken since a hit-taken trigger last fired. */
  taken: Record<string, number>;
  /** The spell of each source that is next in line (they are cast in turn). */
  next: Record<string, number>;
  /** True while a triggered skill is being cast: nothing triggers from it. */
  busy: boolean;
  /** Kill explosions so far this tick (capped, for speed). */
  explosions: number;
  /** Explosions waiting their turn: a chain of kills continues over the next ticks. */
  queue: { x: number; y: number; r: number; type: number; amount: number; from: number }[];
  draining: boolean;
};

export type World = {
  plan: MapPlan;
  grid: Grid;
  t: number;
  tick: number;
  rngCombat: Rng;
  rngAi: Rng;
  rngLoot: Rng;
  /** Chance rolls and spell choices of triggers (separate, so triggers never disturb other streams). */
  rngTrig: Rng;
  /** Seconds left on the charges of each kind (EXPANSION 5.6), and the characters built for each count held. */
  chargeT: Record<'grit' | 'fervour' | 'insight', number>;
  /** Seconds left of each buff (src/data/buffs.ts), the rage held, seconds since rage was fed, and the drain timer. */
  buffT: Record<BuffId, number>;
  rage: number;
  rageT: number;
  rageDrain: number;
  chars: Map<string, Character>;
  /** The Trophy Cord: monster mods held, by mod id, and the seconds left of each. */
  trophy: Record<string, number>;
  trig: TriggerRuntime;
  /** When each secondary skill (by choice key) can next be cast (EXPANSION 5.5a). */
  secondaryReady: Record<string, number>;
  /** When each utility skill (by choice key) can next be cast. */
  utilityReady: Record<string, number>;
  actors: Actor[];
  player: Actor;
  nextId: number;
  projectiles: Projectile[];
  effects: GroundEffect[];
  /** Zones the player's skills left on the ground. */
  zones: SkillZone[];
  /** Bodies of dead monsters (EXPANSION 5.8), and recent explosions that destroy fresh ones. */
  corpses: Corpse[];
  /** Whether any Warden Pylon has been spawned (so damage need not look for one on most maps). */
  hasPylons: boolean;
  blasts: { x: number; y: number; r: number; t: number }[];
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
    stalls: number;
    /** Player projectiles stopped by walls. */
    wallBlocked: number;
    picked: number;
    damageTaken: number;
    damageDealt: number;
  };
  picked: AnyItem[];
  /** Damage the player took in the last few seconds. */
  dmgLog: DamageRecord[];
};
