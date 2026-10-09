import type { Character, SkillChoice } from '../calc/character';
import type { MoveState } from './movement';
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
import type { Fx } from './statuses';
import type { PendingShot } from './shots';
import type { ChannelState, StackState } from './channel';
import type { BannerState } from './banners';
import type { CaughtState, WarpState, WitherState } from './blinks';
import type { Field } from './fields';
import type { SkillDot } from './skillDots';
import type { OfferingState } from './minionFx';
import type { Mirage } from './supportFx';
import type { HexTotals } from '../data/hexes';
import type { Deployable } from './deploy';
import type { Minion } from './minions';
import type { Grid } from './grid';

export type Dot = { dps: number; t: number; stack?: boolean; spread?: number };

export type Ailments = {
  ignites: Dot[];
  /** How many ignites burn at once (the strongest count), set by whoever ignited it. */
  igniteMax: number;
  /** The radius, in tiles, to which its shock, chill and freeze spread (Elemental Proliferation); 0 for none. */
  spreadEle: number;
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
  which:
    | 'primary'
    | 'secondary'
    | 'default'
    | 'monster'
    | 'triggered'
    | 'utility'
    | 'deployed'
    | 'channelled';
  hand: number;
  duration: number;
  elapsed: number;
  fired: boolean;
  /** Repeats (Echoing Cast) already fired after the first. */
  echoes: number;
  /** What each repeat's damage is multiplied by (the ramp of Multistrike, the less of Unleash), by repeat. */
  echoMult?: number[];
  /** Whether the first strike of the use was a critical strike: the repeats share it. */
  crit?: boolean;
  /** The element this use picked (1 lightning, 2 cold, 3 fire), for a skill that picks one. */
  elem?: number;
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
  leechEs: number[];
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
  /** The statuses on this actor (docs/SPIRIT.md S3). */
  fx: Fx;
  /** Impales on this actor: the physical damage each recorded, and the hits it has left. */
  impales: { dmg: number; hits: number }[];
  /** Damage over time that skills inflicted as debuffs of their own (src/sim/skillDots.ts). */
  sdots: SkillDot[];
  /** The life a killing blow went past (Herald of Ash burns by it). */
  overkill?: number;
  /** Resistance lowered by hexes, per damage type (index 0 unused). */
  hexRes: number[];
  hexVuln: number;
  hexVulnAll: number;
  hexDmg: number;
  hexSpeed: number;
  /** The rest of what the hexes on this actor do (damage over time taken, accuracy, evasion, chances to be bled or maimed...). */
  hexMore: HexTotals;
  /** The Choir (EXPANSION 7.3): the censer aura time left, a Zealous boost, and Fervour stacks with their time left. */
  buffT: number;
  zealT: number;
  fervour: number;
  fervourT: number;
  /** Which beat of its rhythm it is on, the damage that beat carries, and whether it has enraged (docs/ROSTER.md 6.5). */
  beat: number;
  patMult: number;
  enraged: boolean;
  /** The phases (by index in the type's list) that have happened. */
  phaseMask: number;
  /** A Mirrored monster's twin, and the seconds the survivor has to follow it before it is made whole again. */
  mirrorId: number;
  mirrorT: number;
  /** Seconds this monster has stood where the character cannot reach it (see strand.ts). */
  strandT: number;
  /** Seconds to a Warding Pulse. */
  pulseT: number;
  /** Passes through walls at a walk (the Hollow), and the state of its movement style (docs/ROSTER.md 6.3). */
  phases: boolean;
  mv: MoveState;
  /** Seconds left of a dive under the floor (a Drowner): out of sight, and nothing touches it. */
  burrowT: number;
  /** Seconds left in which a veiled monster is seen (it has just struck or been struck). */
  revealT: number;
  /** Moves over walls (bats), never moves (nests, pylons, arbalests), and the time left of a beetle curled up. */
  flies: boolean;
  stationary: boolean;
  curlT: number;
  /** Lies in wait (an Ambush) until the character is close or it is hit. */
  hold: boolean;
  /** A Patrol: the two points it walks between while it has not noticed the character, and which one it is heading for. */
  patrol: { x: number; y: number }[] | null;
  patrolI: number;
  /** The next tile of the way to the patrol point, and when it is worked out again. */
  pathT: number;
  nextX: number;
  nextY: number;
  /** Timers of the abilities after the first eight, by index in the type's list (see sim/abilities.ts). */
  abT: number[];
  /** Where a charge or a leap is heading, and how long is left of it (zero: not in one). */
  dashT: number;
  /** Seconds of wind-up left before a leap or a charge (zero: not winding up). */
  windT: number;
  /** Tiles a second of the dash it is in. */
  dashV: number;
  /** Seconds left of running away (a Cutpurse that has stolen), and what it took: the flask and the charges. */
  fleeT: number;
  stolen: number;
  stolenFlask: number;
  /** The player: seconds left in which nothing recovers (a Bursar, the Treasurer). */
  suppressT: number;
  dashX: number;
  dashY: number;
  /** Where a burrowed Gnawing Queen will come up. */
  markX: number;
  markY: number;
  /** Seconds before a Hexcaller can hex again, and the time left of a Choirmaster channel. */
  hexCd: number;
  channelT: number;
  /** A chasing monster: seconds it has spent held up (it walks but gets nowhere), and where it was and when it last tried to walk. */
  blockT: number;
  prevX: number;
  prevY: number;
  tryTick: number;
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
  /** Forks left (a projectile forks once), and chains left. */
  forkLeft: number;
  chainLeft: number;
  /** An arrow that lands and bursts into a ring (nova), or goes on to scatter at its end (tornado); the arrows it sends. */
  /** An orb's time to its next pulse. */
  pulseT?: number;
  kind?: 'nova' | 'tornado' | 'mortar' | 'shield' | 'orb' | 'mirror' | 'creep';
  ring?: number;
  /** Where it changes form (Frost Lance), and whether it has. */
  formAt?: number;
  formed?: boolean;
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
  /** A pulse: how many tiles it throws the character back when it lands. */
  push?: number;
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
  | { t: 'dot'; dst: number; id: string }
  | { t: 'death'; id: number }
  | { t: 'shatter'; id: number }
  | { t: 'levelUp'; level: number }
  | { t: 'drop'; id: number }
  | { t: 'pickup'; id: number }
  | { t: 'chest'; id: number }
  | { t: 'flaskUsed'; idx: number }
  | { t: 'projectileSpawned'; id: number }
  | { t: 'use'; src: number; skill: string }
  | { t: 'echo'; src: number; skill: string }
  | { t: 'trigger'; skill: string; kind: string }
  | { t: 'chain'; from: number; to: number; dtype?: number }
  /** A melee sweep (the arc, in degrees, centred on `facing`) and a melee thrust at one target; `heavy` is a slam or a boss blow. */
  | {
      t: 'swing';
      src: number;
      x: number;
      y: number;
      facing: number;
      radius: number;
      arc: number;
      dtype: number;
      heavy: boolean;
    }
  | {
      t: 'thrust';
      src: number;
      x: number;
      y: number;
      x2: number;
      y2: number;
      dtype: number;
      heavy: boolean;
    }
  | { t: 'explode'; x: number; y: number; r: number; dtype: number }
  | { t: 'beam'; x: number; y: number; x2: number; y2: number; dtype: number }
  | { t: 'blink'; id: number; x: number; y: number; end: boolean }
  | { t: 'charge'; kind: string; count: number }
  /** Charges the character spent on purpose (to skip a cooldown, or to power a skill). */
  | { t: 'spend'; kind: string; n: number }
  | { t: 'buff'; id: string }
  | { t: 'hex'; id: number; hex: string }
  /** A status was put on an enemy. */
  | { t: 'status'; dst: number; id: string }
  | { t: 'deploy'; kind: string; x: number; y: number; end: boolean }
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
  | { t: 'abandonStarted' }
  | { t: 'abandonCancelled' }
  | { t: 'abandoned' }
  | { t: 'summon'; id: number };

export type MapStatus = 'running' | 'cleared' | 'dead' | 'timeout' | 'abandoned';

/** One piece of damage the player took (kept for the last few seconds, for the death recap). */
export type DamageRecord = {
  t: number;
  /** What dealt it: a monster's name, or an effect such as "Burning". */
  name: string;
  rarity: string;
  mods: string[];
  /** The monster type that dealt it (absent for an effect). */
  type?: string;
  dtype: number;
  amount: number;
};

/** Why the player died (EXPANSION section 9): the last seconds of damage, the killer, and your defences. */
export type DeathRecap = {
  time: number;
  killer: string;
  killerRarity: string;
  killerMods: string[];
  /** The monster type of the killer (absent for an effect or an older save), and the map it died on. */
  killerType?: string;
  themeId?: string;
  affixes?: string[];
  areaLevel?: number;
  mapType?: string;
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

/**
 * What a character carries from one map to the next (docs/MAPS.md section 8): fractions of the maximum,
 * so a change of gear at camp keeps them meaningful. Flask charges are by flask uid; a flask missing here is full.
 */
export type Vitals = {
  life: number;
  mana: number;
  es: number;
  flasks: Record<number, number>;
};

export const fullVitals = (): Vitals => ({ life: 1, mana: 1, es: 1, flasks: {} });

/** Decides each tick whether the player leaves the map (docs/MAPS.md section 7); the Abandon button is the manual one. */
export type AbandonPolicy = (w: World) => boolean;

export type WorldOpts = {
  /** Asked every tick while the map runs; true starts the escape timer (if abandoning is allowed). */
  abandonPolicy?: AbandonPolicy;
  /** Life, mana, energy shield and flask charges the player starts with (default: all full). */
  start?: Vitals;
  /** Called when a monster dies; returns dropped items. */
  loot?: (w: World, m: Actor) => AnyItem[];
  /** Called when a chest opens; returns its contents. */
  chestLoot?: (w: World, c: Chest) => AnyItem[];
  /** Simulated seconds after which the map starts an automatic abandon (default AUTO_ABANDON_AFTER; Infinity for none). */
  autoAbandonAt?: number;
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
  /** A guard that cut the physical damage taken for as long as its buff runs (spent charges made it stronger). */
  guard: { buff: BuffId; physMult: number } | null;
  /** Skills with a cooldown of their own (by choice key): the uses held and the seconds until the next one is regained. */
  cooldowns: Record<string, { uses: number; t: number }>;
  /** When each utility skill (by choice key) can next be cast. */
  utilityReady: Record<string, number>;
  /** Time since the burning aura last struck. */
  auraBurnT: number;
  /** The totems, brands, traps and mines on the ground. */
  deployables: Deployable[];
  deploySeq: number;
  /** The minions standing. */
  minions: Minion[];
  actors: Actor[];
  player: Actor;
  nextId: number;
  projectiles: Projectile[];
  /** Ground and standing things the player's skills made: consecrated and chilling ground, crystals, storms, walls. */
  fields: Field[];
  /** The banner the character carries or has put down (src/sim/banners.ts). */
  banner: BannerState | null;
  /** A teleport on its way, Withering Step's aura, and the projectiles a Venom Gyre has caught (src/sim/blinks.ts). */
  warp: WarpState | null;
  wither: WitherState | null;
  caught: CaughtState | null;
  /** Seconds a Berserk has lasted (its drain of rage rises with it). */
  berserkT: number;
  /** The offering that stands, if one does (src/sim/minionFx.ts). */
  offering: OfferingState | null;
  /** Counters the supports keep (src/sim/supportFx.ts): uses of a skill, Intensity, Seals, a mirage archer, Inspiration's mana. */
  uses: Record<string, number>;
  intensity: Record<string, number>;
  intensityT: Record<string, number>;
  seals: Record<string, { n: number; t: number }>;
  mirage: Mirage | null;
  inspireMana: number;
  /** The channelling skill whose Infusion is held, if one is. */
  infusing: string | null;
  shockCd: Record<string, number>;
  inShock: boolean;
  /** The critical roll the strikes of one use share: set while the extra strikes of a use are made. */
  critLock: boolean | null;
  critSeen: boolean;
  /** The element of the next use of a skill that picks one (1 lightning, 2 cold, 3 fire), and the last one used. */
  elem: number;
  elemLast: number;
  /** The buff of Static Strike: its stacks (seconds left) and the time toward the next beams. */
  staticFx: { key: string; stacks: number[]; acc: number } | null;
  /** Molten Shell: the pool left, the damage it has taken, and what comes of it. */
  shell: {
    left: number;
    taken: number;
    absorb: number;
    reflect: number;
    radius: number;
    buff: BuffId;
    profile: SkillProfile;
  } | null;
  /** Herald of Agony: the Virulence held (it runs out), and the time to the next patch of Rimeplate's trail. */
  virulence: number;
  /** The mana the supported skills have spent toward Arcane Surge. */
  surgeMana: number;
  /** The relic's regeneration: seconds left, and the life a second for the character and for the minions; and its nova's cooldown. */
  relicRegen: { t: number; me: number; minions: number };
  relicT: number;
  /** When rage was last gained from a melee hit. */
  rageGainT: number;
  trailT: number;
  /** The blades of Blade Vortex: seconds left of each, and the time toward the next round. */
  vortex: { key: string; blades: number[]; acc: number } | null;
  /** The markers of Storm Call. */
  markers: { x: number; y: number; t: number; profile: SkillProfile; hand: number }[];
  /** The orb of Orb of Storms. */
  stormOrb: {
    x: number;
    y: number;
    t: number;
    acc: number;
    profile: SkillProfile;
    hand: number;
  } | null;
  /** The arrows stuck in an enemy (or the ground) awaiting their fuse. */
  fuses: {
    target: number;
    x: number;
    y: number;
    t: number;
    arrows: { profile: SkillProfile; hand: number }[];
  }[];
  /** The pods of Scourge Arrow waiting to bloom. */
  spores: {
    x: number;
    y: number;
    t: number;
    profile: SkillProfile;
    hand: number;
    arrows: number;
    range: number;
  }[];
  /** The enemies carrying a charged debuff (Infernal Blow), by id. */
  charged: Record<number, { n: number; t: number; key: string }>;
  /** Set while a skill's own secondary hits are made, so they do not feed the skill again. */
  inFx: boolean;
  /** How far the last travelling skill carried the character, in tiles. */
  lastTravel: number;
  /** The channelled skill being held: its stages so far. */
  channel: ChannelState | null;
  /** The stages of a skill that grows with use, and how many hits the player has landed (a use that hits builds a stage). */
  stacks: StackState | null;
  hitsLanded: number;
  /** The projectiles of a barrage still to be fired, one after another. */
  shots: PendingShot[];
  /** How the last hit of the player's resolved (a strike that sends more out waits to see it land). */
  lastOutcome: 'hit' | 'miss' | 'block' | null;
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
  /** Seconds until the player leaves after pressing Abandon, or null when not leaving. */
  abandonT: number | null;
  /** The escape timer was started by the map running too long, not by the player: it cannot be cancelled. */
  abandonAuto: boolean;
  /** The Crescendo step the monsters are at (0 on any other map): they deal and take damage as if stronger (docs/MAPS.md 9.1). */
  surge: number;
  /** Collapse: how far along the way the fall has reached (0 before it starts), and how far ahead of it the player is. */
  collapseFront: number;
  collapseGap: number;
  /** Holdout: the waves that have come, which have been cleared, and the monsters in each. */
  holdout: { spawned: number; cleared: number; done: boolean[]; ids: number[][] };
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
