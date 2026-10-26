import type { MoveState } from './movement';
import type { Defence } from '../calc/combat';
import type { FlaskSpec } from '../calc/flasks';
import type { MonsterStats } from '../calc/monster';
import type { SkillProfile } from '../calc/skill';
import type { Rng } from '../core/rng';
import type { MonsterModId, MonsterRarity } from '../data/monsters';
import type { AnyItem } from '../data/types';
import type { MapPlan } from '../gen/mapPlan';
import type { BlastShape } from '../data/encounters';
import type { Corpse } from './factions';
import type { HexState } from './hexes';
import type { Fx } from './statuses';
import type { SkillDot } from './skillDots';
import type { HexTotals } from '../data/hexes';
import type { Grid } from './grid';
import type { Side, SideOpts } from './side';

export type Dot = {
  dps: number;
  t: number;
  stack?: boolean;
  spread?: number;
  /** The side whose character's hit put it on (what it deals is credited to that side); none for a monster's or the ground's. */
  by?: Side;
};

export type Ailments = {
  ignites: Dot[];
  /** How many ignites burn at once (the strongest count), set by whoever ignited it. */
  igniteMax: number;
  /** The radius, in tiles, to which its shock, chill and freeze spread (Wildfire Spread); 0 for none. */
  spreadEle: number;
  bleeds: Dot[];
  poisons: Dot[];
  shock: number;
  shockT: number;
  chill: number;
  chillT: number;
  freezeT: number;
  /** The character's recovery after a freeze: it cannot be frozen again until this runs out. */
  freezeGraceT: number;
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
  /** What each repeat's damage is multiplied by (the ramp of Triple Cadence, the less of Double Release), by repeat. */
  echoMult?: number[];
  /** Whether the first strike of the use was a critical strike: the repeats share it. */
  crit?: boolean;
  /** The element this use picked (1 lightning, 2 cold, 3 fire), for a skill that picks one. */
  elem?: number;
  targetId: number;
  aimX: number;
  aimY: number;
  /** A spin: the hits of it already dealt (Spinning Dash). */
  spinN?: number;
  /** A spin that hits each enemy once a use: the enemies its sweeps have hit. */
  spinOnce?: number[];
  /** A skill that runs at its target over the wind-up: the distance run so far, and who it has hit on the way. */
  ran?: number;
  hitIds?: number[];
  /** The area of this use is shown by a ring that stays on the character (a channelled spin), not by a burst each time. */
  ringed?: boolean;
  /** The burst of this use is one of a rain (a mine's smaller bursts): what comes down on it, for the renderer. */
  fall?: 'arrow' | 'bolt';
};

export type MonsterState = 'idle' | 'chase' | 'leash';

export type Actor = {
  id: number;
  isPlayer: boolean;
  team: number;
  /** The side this actor fights for (a character and its minions); null for a monster (docs/DUEL.md section 3). */
  side: Side | null;
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
  /** When each skill's hurting ground last hurt the actor: one ground of a skill at a time, however many patches overlap. */
  groundAt?: Record<string, number>;
  stunT: number;
  graceT: number;
  leech: { life: number[]; es: number[]; mana: number[] };
  since: {
    damaged: number;
    kill: number;
    crit: number;
    hit: number;
    flask: number;
    stunEnemy: number;
    block: number;
    /** Seconds since this actor was last hit (for "been hit recently"). */
    beenHit: number;
    overload: number;
  };
  resShift: { v: number[]; t: number };
  moving: boolean;
  // Monster-only.
  mon?: MonsterStats;
  name: string;
  rarity: MonsterRarity | 'player';
  modIds: MonsterModId[];
  room: number;
  pack: number;
  home: { x: number; y: number };
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
  retreat: { t: number; cd: number };
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
  /** The life a killing blow went past (Cinder Herald burns by it). */
  overkill?: number;
  hex: {
    /** Resistance lowered by hexes, per damage type (index 0 unused). */
    res: number[];
    vuln: number;
    vulnAll: number;
    dmg: number;
    speed: number;
    /** The rest of what the hexes on this actor do (damage over time taken, accuracy, evasion, chances to be bled or maimed...). */
    more: HexTotals;
    /** Seconds before a Hexcaller can hex again. */
    cd: number;
  };
  /** The Choir (EXPANSION 7.3): the censer aura time left, a Zealous boost, and Fervour stacks with their time left. */
  choir: {
    buffT: number;
    zealT: number;
    fervour: number;
    fervourT: number;
  };
  rhythm: {
    /** Which beat of its rhythm it is on, the damage that beat carries, and whether it has enraged (docs/ROSTER.md 6.5). */
    beat: number;
    /** Seconds a monster rests before its next area blow (counted down while it can act; see AREA_PACE). */
    restT: number;
    patMult: number;
    enraged: boolean;
  };
  /** The phases (by index in the type's list) that have happened. */
  phaseMask: number;
  /** A Mirrored monster's twin, and the seconds the survivor has to follow it before it is made whole again. */
  mirror: { id: number; t: number };
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
  patrol: { points: { x: number; y: number }[]; i: number } | null;
  /** Timers of the abilities after the first eight, by index in the type's list (see sim/abilities.ts). */
  abT: number[];
  /** Sidearm, window and mode state (docs/ENCOUNTERS.md), for the types that have any. */
  enc: EncState | undefined;
  dash: {
    /** Where a charge or a leap is heading, and how long is left of it (zero: not in one). */
    t: number;
    /** Seconds of wind-up left before a leap or a charge (zero: not winding up). */
    windT: number;
    /** Tiles a second of the dash it is in. */
    v: number;
    x: number;
    y: number;
  };
  theft: {
    /** Seconds left of running away (a Cutpurse that has stolen), and what it took: the flask and the charges. */
    fleeT: number;
    stolen: number;
    stolenFlask: number;
  };
  /** The player: seconds left in which nothing recovers (a Bursar, the Treasurer). */
  suppressT: number;
  /** Where a burrowed Gnawing Queen will come up. */
  mark: { x: number; y: number };
  /** The time left of a Choirmaster channel. */
  channelT: number;
  chase: {
    /** A chasing monster: seconds it has spent held up (it walks but gets nowhere), and where it was and when it last tried to walk. */
    blockT: number;
    prevX: number;
    prevY: number;
    tryTick: number;
    /** The next tile of the way to the patrol point, and when it is worked out again. */
    pathT: number;
    nextX: number;
    nextY: number;
  };
};

export type Projectile = {
  id: number;
  owner: number;
  team: number;
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
  /** A lobbed orb: hops left, each a burst further on (Slag Lob). */
  bouncesLeft?: number;
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
  kind:
    'volatile' | 'slam' | 'explosion' | 'caustic' | 'burning' | 'chilling' | 'shocking' | 'sigil';
  /** A blast: damage when it lands. A lasting zone (caustic, burning, chilling, shocking): damage per second. */
  damage: number;
  /** Zones: time since the last damage pulse. */
  acc?: number;
  dtype: number;
  team: number;
  /** A pulse: how many tiles it throws the character back when it lands. */
  push?: number;
  /**
   * A blast's shape (docs/ENCOUNTERS.md 4); a circle when absent. A lane runs from (x, y) to (x2, y2) and is `width` wide; a
   * wedge opens from (x, y) toward `facing`, `half` radians either side; a donut strikes between `inner` and `radius`.
   */
  shape?: BlastShape;
  x2?: number;
  y2?: number;
  width?: number;
  facing?: number;
  half?: number;
  inner?: number;
  /** Seconds before its warning starts (a later step of a pattern); it is neither drawn nor a hazard until then. */
  delay?: number;
  /** What the death recap calls it. */
  label?: string;
  /** The monster that laid it (a hook drags toward it; some blasts end with their caster). */
  owner?: number;
  /** A hook: tiles it drags the character toward its owner when it lands on it. */
  pull?: number;
  /** Ground it leaves where it lands, and for how long. */
  leaves?: { kind: 'caustic' | 'burning' | 'chilling' | 'shocking'; seconds: number; dps: number };
  /**
   * A blow that follows the character until it lands and cannot be stepped out of (the Magistrate's Sentence, docs/BOSSES.md
   * 6): the dodge leaves it alone, and only defences answer it.
   */
  follow?: boolean;
  unavoidable?: boolean;
  /** Seconds it stuns the character it lands on, and an ailment it puts on it (a toll's shock). */
  stun?: number;
  afflict?: { kind: 'shock' | 'chill' | 'freeze' | 'ignite'; value: number; seconds: number };
};

/**
 * What a monster of the encounters (docs/ENCOUNTERS.md) carries: the timers of its sidearm and its window, and what it has
 * taken lately. Only types that have any of it get one (`hasEncounter`).
 */
export type EncState = {
  /** Seconds to its sidearm. */
  sideT: number;
  /** Its window: seconds to the next, the tell left before it opens, and the time left while it is open. */
  winT: number;
  warnT: number;
  openT: number;
  /** What it has taken lately, as shares of its life: a burst (decaying over about a second) and hits (over two). */
  burst: number;
  hits: number;
  /** Shares of its life lost to each damage type, all told (Quench, Adaptive). */
  lost: number[];
  /** Aegis: plates left, and seconds since it was last attacked. */
  plates: number;
  calmT: number;
  /** Seconds left: of being exposed (Broken guard, Core vent), of stone (Petrify), of a vent, of swelling, of a chant. */
  vulnT: number;
  stoneT: number;
  ventT: number;
  gorgedT: number;
  ritesT: number;
  /** Seconds before a mode may fire again (Fade, Core vent, Riled), and before a Counter-stance answers again. */
  modeCd: number;
  counterCd: number;
  /** One-off modes that have happened (Petrify, Last rites, Quench), a Fade in progress, and the second Cross of a vent. */
  done: number;
  fading: boolean;
  ventCross: boolean;
  /** Molten stacks; whether it was stunned last tick (a stun's start breaks a guard). */
  molten: number;
  wasStunned: boolean;
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
  /** Pulses so far (the first is the blow, the rest are the zone going on). */
  pulsed?: number;
  dtype: number;
  /** A rain with more arrows than its skill starts with: where they burst (src/sim/rain.ts); `stack`: every spot hits an enemy under it. */
  spots?: RainSpot[];
  stack?: boolean;
  /** A strip whose pulses burst one after another along it (`travels`): how many bursts it has in all. */
  bursts?: number;
};

/** One burst of a rain of arrows. */
export type RainSpot = { x: number; y: number; r: number };

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
  /** Times drunk on this map. */
  uses: number;
};

/**
 * The moments of a monster's support that the renderer draws (docs/VFX-AUDIT.md): a Choirmaster's heal landing (`mend`) or cut
 * short (`mendBroken`), a bell or censer taking hold (`aura`), a whistle, a Zealous death spurring allies (`zeal`), a Wight's
 * ward settling (`ward`), a Carrion Mother's pool opening (`pools`), a Reliquarian changing its immunity (`immune`), a
 * Mirrored survivor made whole (`whole`).
 */
export type CueKind =
  'mend' | 'mendBroken' | 'aura' | 'whistle' | 'zeal' | 'ward' | 'pools' | 'immune' | 'whole';

export type SimEvent =
  /** A Reprieve fired (docs/WAYSIDE.md 7): the character (`src`) was pulled out of the map, or stood up again. */
  | { t: 'reprieve'; src: number; how: 'retreat' | 'revive'; id: string }
  /**
   * `immune`: it struck a character that cannot be hurt just after a Revive, so it dealt nothing. `warded`: a Warden Pylon in range
   * kept it from dealing anything (`amount` is 0). `curled`: a curled beetle took less physical damage (`amount` is what was left).
   * `side`: damage with no attacker of its own (an explosion, an aura, a minion's blow) that a side dealt, by that side's id.
   * `reflect`: it is the reflection of a melee hit, thrown back by the actor with this id.
   */
  | {
      t: 'hit';
      src: number;
      dst: number;
      amount: number;
      crit: boolean;
      dtype: number;
      immune?: boolean;
      warded?: boolean;
      curled?: boolean;
      side?: number;
      reflect?: number;
    }
  /** `src` threw back part of a melee hit at `dst` (a Thorned monster, a Gilded Guard, a character's reflection). */
  | { t: 'reflect'; src: number; dst: number; amount: number; dtype: number }
  /** An enemy was thrown back by a hit or a pulse: it is drawn sliding to where it landed. */
  | { t: 'knock'; id: number }
  | { t: 'dot'; dst: number; amount: number }
  | { t: 'miss'; src: number; dst: number }
  | { t: 'block'; src: number; dst: number }
  | { t: 'stun'; dst: number; dur: number }
  | { t: 'ailment'; dst: number; kind: string }
  | { t: 'dot'; dst: number; id: string }
  | { t: 'death'; id: number }
  | { t: 'shatter'; id: number }
  /**
   * Skewer's impales: a spear was driven into `dst` (`stuck`, `n` now held), or a hit made the held ones pay out (`paid`, `n`
   * of them used up; the ones with hits left stay in).
   */
  | { t: 'impale'; dst: number; kind: 'stuck' | 'paid'; n: number }
  /**
   * An ailment or a damage-over-time debuff was passed on from `from` to `to` (Wildfire Spread, a kill that spreads, a
   * spreading debuff). `kind` is the ailment ('ignite', 'shock', 'chill', 'freeze') or 'dot', and `dtype` the damage type of it.
   */
  | { t: 'spread'; from: number; to: number; kind: string; dtype: number }
  /** A kill set the enemies about (x, y) burning, within `r` tiles (Cinder Herald): `n` of them. */
  | { t: 'kindle'; x: number; y: number; r: number; n: number }
  /** A character gained a level: `src` is the character (a duel has two). */
  | { t: 'levelUp'; src: number; level: number }
  | { t: 'drop'; id: number }
  | { t: 'pickup'; id: number }
  | { t: 'chest'; id: number }
  /** A character drank flask `idx` of its own: `src` is the character. `cleansed` names the ailments it took off (ignite, bleed, freeze, poison, shock, curse). */
  | { t: 'flaskUsed'; src: number; idx: number; cleansed?: string[] }
  | { t: 'projectileSpawned'; id: number }
  /**
   * A skill use began. `via` marks a shot fired by something the character put down (a totem, a trap), not by the character; `dep` then
   * says what fired it (`kind` is a deployable's, or 'mirage'), from where, at which spot, and whether the skill flies as a projectile.
   */
  | {
      t: 'use';
      src: number;
      skill: string;
      via?: 'deployed';
      dep?: {
        id: number;
        kind: string;
        x: number;
        y: number;
        tx: number;
        ty: number;
        shot: boolean;
        dtype: number;
      };
    }
  | { t: 'echo'; src: number; skill: string }
  /** A trigger cast a spell by itself (`src` is the character it belongs to). */
  | { t: 'trigger'; skill: string; kind: string; src?: number }
  /** A bolt from actor `from` to actor `to`, or from the point `at` (a Tempest Mote's orb) when `from` is 0. */
  | { t: 'chain'; from: number; to: number; dtype?: number; at?: { x: number; y: number } }
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
  /**
   * An area went off: a circle of radius `r` at (x, y), or, with `strip`, a band along (x1, y1, x2, y2) of half-width `r` (the
   * pulse of a wall or a stream; (x, y) is its middle). The renderer outlines exactly this ground (VISUAL_LANGUAGE.md).
   */
  | {
      t: 'explode';
      x: number;
      y: number;
      r: number;
      dtype: number;
      strip?: [number, number, number, number];
      /** Arrows or bolts come down on the area (a rain, a hail): the renderer draws them falling. */
      fall?: 'arrow' | 'bolt';
      /** The skill that made the area: the renderer draws what that skill is (src/render/styles/grim/areaMotifs.ts). */
      skill?: string;
      /** A later pulse of an area that pulses (a zone, a stream): the renderer draws it lighter than the first. */
      pulse?: boolean;
      /** A mark that hurts nothing and throws nothing (the dot a charge or a leap was aimed at): the renderer draws no blast for it. */
      dud?: boolean;
    }
  /**
   * Something was thrown from a point `high` pixels over (x, y) to the ground at (x2, y2), landing in `dur` s (a shard of ice from
   * a frost orb): the renderer draws it in flight; the area it bursts into follows as an `explode` when it lands.
   */
  | {
      t: 'hurl';
      x: number;
      y: number;
      x2: number;
      y2: number;
      dur: number;
      high: number;
      dtype: number;
    }
  /** A shaped blast of a pattern landed (docs/ENCOUNTERS.md 4); the effect carries its shape. */
  | { t: 'blast'; e: GroundEffect }
  /** A monster began the tell of its window (a Brace). */
  | { t: 'window'; id: number; kind: string }
  /** A beam from (x, y) to (x2, y2), `width` wide where it hurts (absent: a bolt that strikes a point). */
  | {
      t: 'beam';
      x: number;
      y: number;
      x2: number;
      y2: number;
      dtype: number;
      width?: number;
      skill?: string;
    }
  /** `skill` names the character's own blink skill that made it (absent for a monster's travel). */
  | { t: 'blink'; id: number; x: number; y: number; end: boolean; dtype?: number; skill?: string }
  /**
   * A monster dragged a character toward itself (a hook, a lance, a pattern's hooked lane): `dst` stood at (x, y) and now stands at
   * (x2, y2); the hook is at (hx, hy). The renderer draws the chain and the reel-in.
   */
  | {
      t: 'pull';
      src: number;
      dst: number;
      x: number;
      y: number;
      x2: number;
      y2: number;
      hx: number;
      hy: number;
    }
  /**
   * A pulse threw a character back (a Warding Pulse): `dst` stood at (x, y) and now stands at (x2, y2); the pulse went off at
   * (ox, oy) with radius `r`.
   */
  | {
      t: 'push';
      src: number;
      dst: number;
      x: number;
      y: number;
      x2: number;
      y2: number;
      ox: number;
      oy: number;
      r: number;
    }
  /** A monster began the warning of a charge: it rushes in a straight line `seconds` from now (the renderer marks the lane). */
  | { t: 'rush'; id: number; seconds: number }
  /** A blink that waits for something to cross the ground first (an arrow, a run): from (x, y) to (x2, y2) in `seconds`, then the blink ends. */
  | {
      t: 'warp';
      id: number;
      skill: string;
      x: number;
      y: number;
      x2: number;
      y2: number;
      seconds: number;
    }
  /** The aura of a mine did something to a hit: `double` the hit dealt double damage, `fire` it added fire damage. (mx, my) is the mine, (x, y) the enemy. */
  | { t: 'mineBonus'; kind: 'double' | 'fire'; x: number; y: number; mx: number; my: number }
  /** A character got back life, energy shield or mana, as a share (0 to 1) of that pool: summed over a moment, and only a share worth showing. */
  | { t: 'recover'; src: number; pool: 'life' | 'es' | 'mana'; pct: number }
  /** A character gave up life for something else (a trigger's sacrifice). */
  | { t: 'sacrifice'; src: number; amount: number }
  | { t: 'charge'; kind: string; count: number }
  /** Charges the character spent on purpose (to skip a cooldown, or to power a skill). */
  | { t: 'spend'; kind: string; n: number }
  /** A shout (a warcry) went out from (x, y) over everything within `r`. */
  | { t: 'cry'; x: number; y: number; r: number }
  /** A monster was healed, by its own doing or by a channel of another (`src`): the renderer sends green motes up it. */
  | { t: 'heal'; id: number; src?: number }
  /** What a monster's support, ward or immunity just did (`CueKind`): at (x, y), reaching `r` tiles; `n` is the element of an immunity. */
  | { t: 'cue'; kind: CueKind; id: number; x: number; y: number; r: number; n?: number }
  /** A Mirrored monster's twin appeared (`id`) beside the monster it mirrors (`of`). */
  | { t: 'twin'; id: number; of: number }
  /** A monster put a hex on a character (`to`), or renewed one it holds (`renew`); `from` is -1 for a sigil on the ground. */
  | { t: 'hexCast'; from: number; to: number; hex: string; renew: boolean }
  /** A thief took charges of a flask (`kind`) from the character `src`. */
  | { t: 'stolen'; src: number; to: number; kind: string }
  | { t: 'buff'; id: string }
  | { t: 'hex'; id: number; hex: string }
  /** A status was put on an enemy. */
  | { t: 'status'; dst: number; id: string }
  /** A totem, brand, trap or mine was put down at (x, y) (`end` false) or ended there (`end` true). */
  | { t: 'deploy'; id: number; kind: string; x: number; y: number; end: boolean }
  /** A trap or a mine went off at (x, y), at an enemy standing at (tx, ty). */
  | { t: 'sprung'; id: number; kind: string; x: number; y: number; tx: number; ty: number }
  /**
   * One blow of a minion (one event however many damage types it splits into), from (x, y) to the target at (x2, y2). The damage
   * is instant; the event is for the picture. `shot` is the body a ranged blow flies as (absent: a melee blow). `splash` is the
   * radius of the half-damage hit on the neighbours (0: none) and `caught` how many it found.
   */
  | {
      t: 'minionBlow';
      src: number;
      dst: number;
      minion: string;
      x: number;
      y: number;
      x2: number;
      y2: number;
      dtype: number;
      shot?: 'arrow' | 'orb' | 'bolt';
      splash: number;
      caught: number;
    }
  /** A mote (a minion with an aura) set off the trap or mine `device` from where it stands: from (x, y) to (tx, ty). */
  | {
      t: 'botSpark';
      src: number;
      device: number;
      x: number;
      y: number;
      tx: number;
      ty: number;
      aura: 'chill' | 'shock';
    }
  /** A character that could not move was put at its next waypoint: `src` is the character. */
  | { t: 'stuck'; src: number }
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
  /** A character fell: `src` is the character (the map is over when it is side 0's; a duel reads both). */
  | { t: 'playerDied'; src: number }
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
  /** The monster behind a slam or a blast, whose name the effect hides. */
  via?: string;
  dtype: number;
  amount: number;
  /** Life and energy shield the player had just before it. */
  hp: number;
};

/** One hit in a death recap: how long before the death, from whom, and what the player had left before it. */
export type RecapHit = {
  ago: number;
  name: string;
  via?: string;
  rarity: string;
  dtype: number;
  amount: number;
  hp: number;
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
  /** The boss that ends the map, on a boss map (its damage is in what the card said). */
  boss?: string;
  /** Damage taken in the last 5 seconds, by source and type, largest first. */
  lines: { name: string; dtype: number; amount: number }[];
  /** Resistances (fire, cold, lightning, chaos) and their caps, at the moment of death. */
  res: { fire: number; cold: number; lightning: number; chaos: number };
  maxRes: { fire: number; cold: number; lightning: number; chaos: number };
  /** Ailments the player carried. */
  ailments: string[];
  maxLife: number;
  maxEs: number;
  /** What the death record adds (absent from an older save): every hit of the last seconds, in order. */
  hits?: RecapHit[];
  /** Life, energy shield and mana at the moment of death. */
  vitals?: { life: number; es: number; mana: number };
  defence?: {
    armour: number;
    evasion: number;
    blockAttack: number;
    blockSpell: number;
    physReduction: number;
    lifeRegen: number;
    movement: number;
  };
  /** The flasks: charges, whether one was running, and how many times it was drunk on the map. */
  flasks?: { kind: string; charges: number; max: number; active: boolean; uses: number }[];
  /** The living monsters within 8 tiles: all, magic, rare, and bosses. */
  near?: { all: number; magic: number; rare: number; boss: number };
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
  /** The player's hits since the watch began: on the watched target, and on other enemies (it may be screened). */
  aimHits: number;
  strayHits: number;
  /** A target the player has given up on, and until when. */
  skipId: number;
  skipUntil: number;
  stuckT: number;
  stuckX: number;
  stuckY: number;
  /** The drop or chest the player is heading for, and since when (a loot hunt that goes nowhere is dropped). */
  lootId: number;
  lootSince: number;
  /** The fights so far (an opener is used once a fight), and when the character last had a target. */
  fight: number;
  lastEngaged: number;
  /** A kiting step (the `kite` spacing): seconds left, where to, and seconds before the next. */
  kiteT: number;
  kiteX: number;
  kiteY: number;
  kiteCd: number;
  /** Dodging spent (seconds, drained while the character does not dodge), and the seconds left of the rest it then takes from dodging. */
  dodgeT: number;
  dodgeRest: number;
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
export type AbandonPolicy = (w: World, s: Side) => boolean;

/** What the map decides (what a character brings is `SideOpts`, in side.ts). */
export type WorldOpts = {
  /** Asked every tick while the map runs; true starts the escape timer (if abandoning is allowed). */
  abandonPolicy?: AbandonPolicy;
  /** Called when a monster dies; returns dropped items. */
  loot?: (w: World, m: Actor) => AnyItem[];
  /** Called when a chest opens; returns its contents. */
  chestLoot?: (w: World, c: Chest) => AnyItem[];
  /** Simulated seconds after which the map starts an automatic abandon (default AUTO_ABANDON_AFTER; Infinity for none). */
  autoAbandonAt?: number;
  /** Hard cap on simulated seconds. */
  maxTime?: number;
  /** The exit never opens (an arena with nothing to clear, where a duel is fought: docs/DUEL.md 4.3). */
  noExit?: boolean;
};

/** What a caller asks of a map: the map's own options and the character's, in one bag that `createWorld` splits (until F2 gives it one bag a side). */
export type MapOpts = WorldOpts & SideOpts;

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
  /** Tiles walked since the last stride trigger. */
  stride?: number;
  /** Kill explosions so far this tick (capped, for speed). */
  explosions: number;
  /** Explosions waiting their turn: a chain of kills continues over the next ticks. */
  queue: { x: number; y: number; r: number; type: number; amount: number; from: number }[];
  draining: boolean;
};

export type World = {
  plan: MapPlan;
  grid: Grid;
  /** The sides of the map, each a character and what is theirs; side 0 is the local player's (docs/DUEL.md section 3). */
  sides: Side[];
  /**
   * The sides in the order they act in this tick (docs/DUEL.md 3.3, 4.4): `sides` itself or the same sides reversed, by a mix of
   * the tick and `orderSeed`, so that neither is first in every tie of a fight. With one side it is always `sides`. Set at the top
   * of `stepWorld`.
   */
  order: Side[];
  /**
   * What the order of the sides is drawn from, with the tick: a duel's seed (0 on a map). Two characters whose actions fall on the
   * same tick every time (the same rhythm, or two builds of one speed) would have the same one of them first at every exchange
   * of the fight if the order followed the parity of the tick, or of the tick and the seed (docs/DUEL.md 4.4).
   */
  orderSeed: number;
  t: number;
  tick: number;
  rngCombat: Rng;
  rngAi: Rng;
  rngLoot: Rng;
  /** Chance rolls and spell choices of triggers (separate, so triggers never disturb other streams). */
  rngTrig: Rng;
  actors: Actor[];
  nextId: number;
  projectiles: Projectile[];
  effects: GroundEffect[];
  /** Bodies of dead monsters (EXPANSION 5.8), and recent explosions that destroy fresh ones. */
  corpses: Corpse[];
  /** Whether any Warden Pylon has been spawned (so damage need not look for one on most maps). */
  hasPylons: boolean;
  blasts: { x: number; y: number; r: number; t: number }[];
  drops: Drop[];
  chests: Chest[];
  events: SimEvent[];
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
  opts: WorldOpts;
};
