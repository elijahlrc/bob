import type { DamageType, Mod, SkillTag } from '../mods/types';
import type { TriggerDef } from './triggers';
import type { BuffId } from './buffs';
import type { MinionId } from './minions';
import type { HexId } from './hexes';
import type { StatusId } from './statuses';
import type { SkillType } from './skillTypes';
import { GEN_ACTIVE_GEMS, GEN_AURA_GEMS, GEN_SUPPORT_GEMS } from './gemsGen';

/** A value authored at gem level 1 and level 20 (DESIGN.md §11.5). */
export type LevelValue = number | readonly [number, number];

export type GemMod = Omit<Mod, 'value'> & {
  value: LevelValue;
  /** The value grows from the first level to the last as a curve (damage tables), not a line. */
  geo?: boolean;
};

/**
 * Damage a skill does over time as a debuff of its own (docs/SPIRIT.md S7): not an ailment, so the ailment modifiers do not reach it,
 * but damage over time, the skill's keywords and its type do. The base damage a second is the reference game's table for the level.
 */
export type DotSpec = {
  type: DamageType;
  /** Base damage a second at gem level 1 and 20. */
  dps: LevelValue;
  /** Seconds it lasts, before duration modifiers (which reach it only if the skill has the duration keyword). */
  seconds: number;
  /**
   * 'refresh': one at a time, renewed by each application. 'layers': each application adds a layer with its own time, up to `cap`.
   * 'stages': one that gains a stage with each application up to `cap`, each stage after the first adding `stagePct` of the base.
   */
  stack: 'refresh' | 'layers' | 'stages';
  cap?: number;
  stagePct?: number;
  /** The skill deals no hit of its own: it only inflicts this on whatever it reaches. */
  hitless?: boolean;
  /** It comes only from the ground the skill leaves (`leaves`), not from the hit. */
  ground?: boolean;
  /** Skill keywords beyond its own damage-over-time ones whose modifiers reach it (spell, projectile, area). */
  scales?: SkillTag[];
  /** A hit also puts it on the enemies within this many tiles of the target. */
  splash?: number;
  /** When the enemy dies it passes on to those near it with the time it had left; 'carry' only goes along with one that spreads. */
  spread?: boolean | 'carry';
  /** The caster mends this percent of the debuff's damage a second, for each enemy that carries it. */
  regen?: number;
  /** An enemy that did not carry it is slowed by this percent for this long. */
  hinder?: { v: number; seconds: number };
  /** At the cap of stages the enemy is exposed to the element. */
  exposure?: StatusId;
  /** More damage for each curse the skill applies from its link (Bane), in percent, and the percent longer each makes it last. */
  perCurse?: { more: LevelValue; longer: number };
};

export type GemAttr = 'str' | 'dex' | 'int' | 'dexint' | 'strint' | 'strdex';

export type SkillBehaviour =
  | { kind: 'melee'; range: number; range2h?: number; arc?: number; radius?: number }
  | {
      kind: 'projectile';
      count: number;
      countPer5?: number;
      spread: number;
      pierce?: number;
      explodeRadius?: number;
      range?: number;
      falloff?: number;
      /** The projectile turns around at the end of its range and flies back, hitting again on the way. */
      returns?: boolean;
    }
  | { kind: 'chain'; range: number; chains: number; chainsPer5?: number; chainRange: number }
  /**
   * An instant area. `origin` 'target' (the default) centres it on the target (slams, item-granted skills; `reach` is how
   * close the caster must be, default the radius); 'self' is a nova around the caster.
   */
  | {
      kind: 'burst';
      radius: number;
      origin?: 'target' | 'self';
      reach?: number;
      /** A monster's burst that also leaves a lasting zone where it lands (a lob), by kind, seconds and damage a second. */
      zone?: {
        kind: 'caustic' | 'burning' | 'chilling' | 'shocking';
        seconds: number;
        dps: number;
      };
    }
  /** An instant line from the caster toward the target that hits everything on it (a beam, a channelled ray's tick). */
  | { kind: 'beam'; length: number; width: number }
  /**
   * A zone on the ground that hits what stands in it every `interval` seconds for `duration` seconds, after an optional
   * `delay` (rain, storm, cascade, a cloud). It lands on the target within `reach` of the caster; with `line` it is a
   * strip of that length from the caster toward the target instead (a wall, a stream).
   */
  | {
      kind: 'ground';
      radius: number;
      duration: number;
      interval: number;
      delay?: number;
      reach?: number;
      line?: number;
    };

/**
 * A spell's base damage in one type: explicit numbers (hand-tuned gems), or a `spread` (the lowest and highest roll as a
 * share of the average) taken from the shared curve `spellBaseDamage(level)` times the gem's `effectiveness`.
 */
export type SpellDamageDef =
  | { type: DamageType; min: LevelValue; max: LevelValue }
  | { type: DamageType; spread: readonly [number, number]; share?: number };

/**
 * What a utility skill does instead of damage (COVERAGE 5.1): the character casts it by a policy, not on the player's say.
 * 'upkeep' recasts a buff when it ends and enemies are near; 'guard' casts when life is low or a big hit lands;
 * 'rally' casts when a pack or a rare enemy is near. A curse is cast on a target and the enemies around it; a blink
 * closes a gap to a target that is out of reach.
 */
export type UtilityDef =
  | {
      kind: 'buff';
      buff: BuffId;
      seconds: number;
      policy: 'upkeep' | 'guard' | 'rally' | 'banner';
      cooldown?: number;
      /** Spends charges when cast: up to `max` of them, each lengthening the buff and cutting the physical damage taken. */
      consume?: {
        charge: 'grit' | 'fervour' | 'insight';
        max: number;
        durationPct: number;
        physLess: number;
      };
      /** A banner (docs/SPIRIT.md S6): cast once to carry it, cast again to put it down. */
      banner?: {
        /** Radius of its aura in tiles, before area modifiers. */
        radius: number;
        /** The share of maximum mana held while it is carried. */
        reservePct: number;
        /** Seconds it stands once put down, before the stages. */
        placedSeconds: number;
        stageOn: 'kill' | 'impale';
        maxStages: number;
        /** What each stage adds once it is down: area, aura effect (percent) and seconds. */
        perStage: { area: number; effect: number; seconds: number };
        /** Put on the enemies in the aura: the status and its magnitude. */
        enemy: { id: StatusId; v: LevelValue };
        /** Put down: a buff for so many seconds a stage, its effect rising by `effectPerStage` percent a stage. */
        place: { buff: BuffId; secondsPerStage: number };
      };
      /** Needs this much rage to start, spends rage while it lasts (more each second) and ends when it is gone (Berserk). */
      rage?: { min: number; drain: number; accel: number };
      /** The percent of maximum life and energy shield lost a second while it lasts (Blood Rage), and a kill renews it. */
      degen?: number;
      refreshOnKill?: boolean;
      /** What the buff does while it lasts (the buff's condition is added to each). */
      mods: GemMod[];
    }
  | { kind: 'curse'; hex: HexId; radius: number }
  | {
      kind: 'blink';
      distance: number;
      cooldown: number;
      /** The skill's damage lands in a burst around the point left or the point reached. */
      burst?: 'depart' | 'arrive' | 'both';
      /** Goes to a corpse in preference to an enemy (Bodyswap): the burst is this percent larger in area, the corpse bursts for a share of its life, and the character adds a share of its own life to the burst. */
      corpse?: { areaMore: number; explodePct: number; lifePct: number };
      /** Burning ground along the way across (it afflicts with the skill's damage over time), and chilling ground where it left. */
      trail?: { seconds: number; radius: number };
      chill?: { seconds: number; radius: number };
      /** The teleport comes after a delay: the time the run would take (less by a percent), or an arrow's flight (times the usual arrow speed); bursts at both ends. */
      warp?: { lessDuration: LevelValue } | { speed: number };
      /** Elusive for the character, and the enemies that come within the radius are withered (stacks, seconds) until it does something else. */
      elusive?: { stacks: LevelValue; seconds: number; radius: LevelValue };
      /** A clone is left where the character stood. */
      clone?: { minion: MinionId; seconds: number };
    }
  /** A shout that puts statuses on the enemies around the character (a hinder that grows with the crowd, a death blast). */
  | {
      kind: 'shout';
      radius: number;
      cooldown: number;
      /** 'rally' (the default) waits for a pack or a rare enemy; 'upkeep' goes on as long as an enemy is within the radius. */
      policy?: 'rally' | 'upkeep';
      statuses: {
        id: StatusId;
        seconds: number;
        v: LevelValue;
        /** More of the main magnitude for each other enemy in the radius, in percent points. */
        perNearby?: LevelValue;
        x?: number;
      }[];
    }
  /** Summons minions (COVERAGE C6): `count` of them at once, for `seconds` if they are time-limited. `ownerMods` is what the character gains while they stand. */
  | {
      kind: 'summon';
      minion: MinionId;
      count: LevelValue;
      seconds?: number;
      ownerMods?: GemMod[];
      /** Raised from a corpse: the minion is that monster, at this level (Raise Spectre). */
      corpse?: { level: LevelValue };
      /** Made from a weapon lying on the ground that is used up by it (Animate Weapon); the cap on its item level, the damage and speed it adds. */
      animate?: { maxIlvl: LevelValue; addMin: LevelValue; addMax: LevelValue; speed: LevelValue };
      /** A golem: the other minions deal this much added physical damage while it stands; it deals more for each of them near, and has more life. */
      golem?: {
        addMin: LevelValue;
        addMax: LevelValue;
        perNearby: number;
        cap: number;
        life: LevelValue;
      };
      /** The one Guardian that wears the armour and weapons lying on the ground, one piece per cast (Animate Guardian). */
      warden?: {
        maxReq: LevelValue;
        addMin: LevelValue;
        addMax: LevelValue;
        life: LevelValue;
        melee: LevelValue;
      };
    }
  /**
   * An offering (docs/SPIRIT.md S12): uses up a corpse and up to four more about it, and for a time (longer for each corpse) gives
   * the minions the effects below. Only one stands at a time; a new one replaces it.
   */
  | {
      kind: 'offering';
      buff: BuffId;
      seconds: number;
      perCorpse: number;
      maxCorpses: number;
      atkInc?: LevelValue;
      moveInc?: LevelValue;
      castInc?: LevelValue;
      blockAtk?: LevelValue;
      blockSpell?: LevelValue;
      /** Life a minion recovers each time it blocks. */
      healOnBlock?: LevelValue;
      /** Percent of its life a minion gains as energy shield for each corpse used. */
      esPerCorpse?: number;
      physAsChaos?: LevelValue;
      res?: LevelValue;
    };

export type ActiveGemDef = {
  kind: 'active';
  id: string;
  name: string;
  attr: GemAttr;
  skillType: 'attack' | 'spell';
  tags: SkillTag[];
  /** Skill types beyond the tags (what supports can do with it): `totemable`, `trappable`, `triggerable`, ... */
  types?: SkillType[];
  behaviour: SkillBehaviour;
  /** Attacks: "deals N% of base damage". */
  baseMult?: LevelValue;
  /** Spells: base damage per type. */
  spellDamage?: SpellDamageDef[];
  /** Added damage effectiveness for spells, percent. */
  effectiveness?: number;
  castTime?: number;
  /** Spell base crit, percent. */
  crit?: number;
  cost: LevelValue;
  mods: GemMod[];
  /** Attacks: weapon tags, any of which must be present. */
  requiresWeapon?: SkillTag[];
  /** Sweep: dual wielding hits with both weapons. */
  bothWeapons?: boolean;
  /** Only usable while dual wielding. */
  needsDualWield?: boolean;
  /** Only usable while holding a shield. */
  needsShield?: boolean;
  /** A utility skill (a curse, a buff, a warcry, a blink): it does not deal damage and is never the primary skill. */
  utility?: UtilityDef;
  /** A damaging skill that also moves the caster this far toward the target (a leap, a charge). */
  travel?: number;
  /** Seconds before the skill can be used again; a use lost to the wait is regained one at a time (docs/SPIRIT.md S2). */
  cooldown?: LevelValue;
  /** How many uses the cooldown stores (default one). */
  cooldownUses?: number;
  /** Charges that can be spent to use the skill while it waits on its cooldown. */
  bypass?: { charge: 'grit' | 'fervour' | 'insight'; n: number };
  /**
   * A channelled skill (docs/SPIRIT.md S5): used again and again, building a stage each time, and released when the channel ends.
   */
  channel?: {
    /** The stages it builds before it is released. */
    cap: number;
    /** Whether each use hits as it goes (Blade Flurry, Incinerate) or only builds a stage (Flameblast). */
    tick: boolean;
    /** The damage of a use's own hit as a percentage of the skill's (Divine Ire's zaps while channelling deal half). */
    tickMult?: number;
    /** The channelling character cannot be stunned (Cyclone). */
    stunImmune?: boolean;
    /** Percent more damage per stage built, on the hits as it goes. */
    perStage?: number;
    /** The damage of the first use, as a percentage of the others (Cyclone's first hit deals half). */
    first?: number;
    /** Percent more area per stage built, on the hits as it goes. */
    tickRadiusPerStage?: number;
    /** A use also builds an extra stage while this many enemies are within the radius (a crowd charges Divine Ire faster). */
    crowdStage?: { min: number; radius: number };
    /** What the release does: percent more damage in all and per stage, more area per stage, another shape, one strike per stage. */
    release?: {
      perStage: number;
      base?: number;
      radiusPerStage?: number;
      behaviour?: SkillBehaviour;
      repeat?: boolean;
    };
  };
  /** A strike that, when it lands, sends more out: bolts from the weapon, blades from behind the enemy, balls that land and burst. */
  /** Arrows that fall around the target and each leave a spore pod: it afflicts and slows what is near, then bursts (Toxic Rain). */
  pods?: {
    /** Seconds before a pod bursts, the radius of its cloud and of its burst, and how far from the target the pods land (before more arrows widen it). */
    seconds: number;
    radius: number;
    burstRadius: number;
    spread: number;
    /** The percent each pod slows the enemies near it, and the most the pods can slow them together. */
    slow: number;
    slowMax: number;
  };
  /** A debuff of damage over time the skill inflicts (docs/SPIRIT.md S7). */
  dot?: DotSpec;
  /** An arrow that ignites also inflicts a burning debuff worth a share of the ignite's damage, up to `cap` at once. */
  burning?: { pct: LevelValue; seconds: number; cap: number };
  /** Seconds what the skill puts down stands (a trap, a mine, a totem), where it differs from the kind's usual. */
  deploySeconds?: number;
  /** A ballista: its totems attack at half speed. */
  ballista?: boolean;
  /** Arrows fired into the air that land in a line toward the target and burst where they land (Artillery Ballista). */
  mortar?: { radius: number; from: number };
  /** A totem that is active only while the character is near, and gives the character a buff while it is (the Cairns). */
  ancestral?: { buff: BuffId; range: number; mods: GemMod[] };
  /** Totems that cast a beam of damage over time at the character and at each other, in the range given (Cinder Bond). */
  bond?: { width: number; range: number; end: number };
  /** A mine that, going off, also sends projectiles raining down around it; and an aura that adds fire damage to hits near it. */
  mineRain?: { count: number; perPrior: number; radius: number; spread: number };
  mineAura?: { min: LevelValue; max: LevelValue; cap: LevelValue; radius: number };
  /** Seconds between a mine being set off and its going (0.25 by default). */
  detonation?: number;
  /** The skill cannot be used without a corpse (Pyre Burst). */
  needsCorpse?: boolean;
  /** A corpse made into a geyser that fires projectiles for a while, after exploding for a share of the corpse's life (Pyre Burst). */
  geyser?: {
    seconds: number;
    radius: number;
    interval: number;
    blast: number;
    max: number;
    explodePct: number;
    explodeRadius: number;
  };
  /** A storm the skill leaves in the stance the character is in: it hits for a time, and the character in it gains a buff (Bladestorm). */
  bladestorm?: {
    seconds: number;
    radius: number;
    interval: number;
    /** Percent more (less, when negative) damage than the skill's own hit. */
    more: number;
    max: number;
    /** The buffs the character in the storm gains, in the Blood stance and in the Sand stance; and how fast the Sand storm drifts ahead (tiles a second). */
    blood: BuffId;
    sand: BuffId;
    drift: number;
  };
  /** A projectile that changes form after flying a way: faster, piercing, critical (Frost Lance). */
  form?: { after: number; speed: number; critMore: number; critMulti: LevelValue };
  /** A skill whose cooldown recovers faster for the enemies near the character (Frostblink). */
  recoverNear?: { normal: LevelValue; rare: LevelValue; radius: number };
  /** The skill's cooldown does not run while this buff lasts. */
  pausedBy?: BuffId;
  /** The percent more damage a returning projectile deals on the way back. */
  returnMore?: number;
  /** A returning projectile that the character catches on its way back, this many at most (Venom Gyre); a skill that releases what was caught. */
  catches?: number;
  releasesCaught?: boolean;
  /** Orbs a channelled skill leaves standing (docs/SPIRIT.md S6). */
  orb?:
    | {
        /** An orb over the character that pelts the ground around with explosions; the stages built lengthen it and quicken it. */
        kind: 'frost';
        seconds: number;
        /** Percent longer for each stage built. */
        secondsPerStage: number;
        /** Seconds between volleys at no stages, the percent faster for each stage, and the percent more often while channelling. */
        interval: number;
        speedPerStage: number;
        channelMore: number;
        /** Explosions in a volley, the radius of each, and how far from the character they land. */
        count: number;
        radius: number;
        range: number;
      }
    | {
        /** An illusion that runs ahead while channelling (waves of damage along its path) and the character joins it at the end (Charged Dash). */
        kind: 'illusion';
        /** Times the character's movement speed, and the most tiles it runs. */
        speed: number;
        distance: number;
        radius: number;
        /** A wave for each so many stages; the final wave deals this percent more for each stage; waves deal this percent more once the illusion has stopped. */
        waveStages: number;
        finalPerStage: number;
        stillMore: number;
      }
    | {
        /** An orb for each use that jumps about the target place, exploding after each jump; when the channel ends the rest explode, harder. */
        kind: 'zap';
        seconds: number;
        /** Seconds between jumps, the radius of a jump's blast and of the final one, how far from the target place an orb lands. */
        jump: number;
        radius: number;
        releaseRadius: number;
        spread: number;
        /** Percent more damage on the final blast for each jump the orb still had left. */
        releaseMore: number;
      };
  /** Ground the skill leaves where it lands (docs/SPIRIT.md S6). */
  leaves?: {
    kind: 'consecrated' | 'chilling' | 'caustic';
    seconds: number;
    radius: number;
    /** How many times larger the ground ends than it began. */
    grow?: number;
    /** Chilling ground: the share of a hit it deals each second. */
    dps?: number;
    killCharge?: { kind: 'grit' | 'fervour' | 'insight'; chance: number };
  };
  /** A crystal that stands a moment, exposes what is near, and bursts (Frost Bomb). */
  crystal?: {
    radius: number;
    seconds: number;
    interval: number;
    exposure: number;
    regenLess: number;
    debuffSeconds: number;
  };
  /** A wall of ice across the way, that holds the tiles shut for a while and pushes what stands there back (Frost Wall). */
  wall?: { length: number; seconds: number; push: number };
  /** A second, harder hit a moment after the first, over a larger area (Earthquake). */
  aftershock?: { delay: number; more: number; radius: number };
  /** A chance to spend a charge to make the use a Charged Slam (Tectonic Slam). */
  chargedSlam?: {
    chance: number;
    charge: 'grit' | 'fervour' | 'insight';
    more: number;
    radius: number;
  };
  /** A skill that grows with use: each use that hits adds a stage (more area), and they fade when it stops hitting (Reave). */
  stacks?: { cap: number; areaPer: number; fadeAfter: number };
  afterHit?: {
    kind: 'bolts' | 'blades' | 'balls';
    count: LevelValue;
    /** Their damage as a percentage of the strike's. */
    mult: number;
    arc?: number;
    range: number;
    explodeRadius?: number;
  };
  /** A burst in a cone in front of the shooter with each shot (Galvanic Arrow), its damage a percentage of the shot's. */
  cone?: { angle: number; length: number; mult: number };
  /** The skill cannot be used directly: this trigger casts it (a counter-attack when the character is hit). */
  selfTrigger?: TriggerDef;
  /** The skill spends every charge the character holds when it lands (its damage grew with them); it waits for at least `min`. */
  consumeCharges?: { min: number };
  description: string;
};

export type SupportGemDef = {
  kind: 'support';
  id: string;
  name: string;
  attr: GemAttr;
  /** The supported skill must have at least one of these types (empty: any). */
  supports: SkillType[];
  /** ... and all of these. */
  needs?: SkillType[];
  /** The skill must have none of these. */
  excludes?: SkillType[];
  /** Types the support adds to the skill (a totem support makes it a totem). */
  adds?: SkillType[];
  costMult: number;
  mods: GemMod[];
  /** Raises the level of the skill it supports (Empower analog), by gem level. */
  levelBonus?: LevelValue;
  /** Trigger supports: the linked spells are cast by this trigger instead of by the player. */
  trigger?: TriggerDef;
  /** Hexing Strikes: the hex gems in the same item are applied to enemies the supported skill hits. */
  hexOnHit?: boolean;
  /** Mods that act on the whole character while a skill the support applies to is socketed (not only on that skill). */
  global?: GemMod[];
  /** Triggers the support gives the character while it applies to a socketed skill (a kill spreads ignites). */
  extraTriggers?: TriggerDef[];
  /** Blasphemy: the supported curse is always on every enemy the character hits, and reserves mana instead of being cast. */
  blasphemy?: { reservePct: number };
  /** The supported skill can be used only with weapons of these kinds. */
  limitWeapon?: SkillTag[];
  description: string;
};

/** What a stance does: mods on the character, a status on the enemies near, and less damage taken from the ones that are not. */
export type StanceSide = {
  mods: GemMod[];
  enemies?: { id: StatusId; seconds: number; v: LevelValue; x?: LevelValue };
  farLess?: LevelValue;
};

export type AuraGemDef = {
  kind: 'aura';
  id: string;
  name: string;
  attr: GemAttr;
  /** Percent of unreserved mana, or a flat amount by level. */
  reservePct?: number;
  reserveFlat?: LevelValue;
  mods: GemMod[];
  /**
   * A stance (docs/SPIRIT.md S9): effects for the Blood stance and for the Sand stance, and how far its effects on enemies reach.
   * The character is in one stance at a time, shared by every stance gem.
   */
  stance?: {
    radius: number;
    blood: StanceSide;
    sand: StanceSide;
  };
  /** What the aura does on events while it is active (a herald's explosions). */
  triggers?: TriggerDef[];
  description: string;
};

export type GemDef = ActiveGemDef | SupportGemDef | AuraGemDef;

export const ACTIVE_GEMS: ActiveGemDef[] = [
  {
    kind: 'active',
    id: 'crushingBlow',
    name: 'Crushing Blow',
    attr: 'str',
    skillType: 'attack',
    tags: ['attack', 'melee', 'strike'],
    behaviour: { kind: 'melee', range: 1.4, range2h: 1.7 },
    baseMult: [150, 190],
    cost: [1, 8],
    mods: [
      { stat: 'stunDuration', kind: 'inc', value: 25 },
      { stat: 'stunDamage', kind: 'inc', value: 25 },
    ],
    description: 'A single heavy blow that staggers its target.',
  },
  {
    kind: 'active',
    id: 'reapingArc',
    name: 'Reaping Arc',
    attr: 'str',
    skillType: 'attack',
    tags: ['attack', 'melee', 'area'],
    behaviour: { kind: 'melee', range: 2.2, arc: 120, radius: 2.2 },
    baseMult: [100, 140],
    cost: [1, 9],
    mods: [],
    bothWeapons: true,
    description: 'A wide arc that strikes every enemy in front of you.',
  },
  {
    kind: 'active',
    id: 'splitVolley',
    name: 'Split Volley',
    attr: 'dex',
    skillType: 'attack',
    tags: ['attack', 'projectile'],
    behaviour: { kind: 'projectile', count: 3, countPer5: 1, spread: 30, range: 9 },
    baseMult: [90, 120],
    cost: [1, 9],
    mods: [],
    requiresWeapon: ['bow'],
    description: 'Looses a fan of arrows.',
  },
  {
    kind: 'active',
    id: 'venomCut',
    name: 'Venom Cut',
    attr: 'dex',
    skillType: 'attack',
    tags: ['attack', 'melee', 'strike'],
    behaviour: { kind: 'melee', range: 1.4 },
    baseMult: [100, 130],
    cost: [1, 7],
    mods: [
      { stat: 'chance.poison', kind: 'base', value: 40 },
      { stat: 'damage', kind: 'more', value: 25, tags: ['poison'] },
    ],
    requiresWeapon: ['dagger', 'claw', 'sword'],
    description: 'A quick cut that leaves a lingering venom.',
  },
  {
    kind: 'active',
    id: 'flameBolt',
    name: 'Flame Bolt',
    attr: 'int',
    skillType: 'spell',
    tags: ['spell', 'projectile', 'area', 'fire'],
    behaviour: { kind: 'projectile', count: 1, spread: 0, explodeRadius: 1.2, range: 9 },
    spellDamage: [{ type: 'fire', min: [9, 520], max: [14, 780] }],
    effectiveness: 240,
    castTime: 0.75,
    crit: 6,
    cost: [3, 22],
    mods: [{ stat: 'chance.ignite', kind: 'base', value: 25 }],
    description: 'Hurls a bolt of flame that bursts on impact.',
  },
  {
    kind: 'active',
    id: 'arcChain',
    name: 'Arc Chain',
    attr: 'int',
    skillType: 'spell',
    tags: ['spell', 'chaining', 'lightning'],
    behaviour: { kind: 'chain', range: 7, chains: 2, chainsPer5: 1, chainRange: 4 },
    spellDamage: [{ type: 'lightning', min: [2, 70], max: [20, 650] }],
    effectiveness: 80,
    castTime: 0.8,
    crit: 5,
    cost: [3, 22],
    mods: [{ stat: 'chance.shock', kind: 'base', value: 10 }],
    description: 'A crackling bolt that leaps between enemies.',
  },
  {
    kind: 'active',
    id: 'frostLance',
    name: 'Frost Lance',
    attr: 'int',
    skillType: 'spell',
    tags: ['spell', 'projectile', 'cold'],
    behaviour: { kind: 'projectile', count: 2, spread: 6, range: 9 },
    form: { after: 3, speed: 4, critMore: 600, critMulti: [30, 49] },
    spellDamage: [{ type: 'cold', spread: [0.8, 1.2] }],
    effectiveness: 80,
    castTime: 0.7,
    crit: 7,
    cost: [8, 23],
    mods: [{ stat: 'projectilesSequential', kind: 'flag', value: 1 }],
    description:
      'Two spears of ice in a row, slow at first and then, far from you, fast, piercing and critical.',
  },
];

export const SUPPORT_GEMS: SupportGemDef[] = [
  {
    kind: 'support',
    id: 'bruteForce',
    name: 'Brute Force',
    attr: 'str',
    supports: ['melee'],
    costMult: 1.4,
    mods: [
      { stat: 'damage', kind: 'more', value: [40, 59], damageTypes: ['physical'], tags: ['melee'] },
    ],
    description: 'More melee physical damage.',
  },
  {
    kind: 'support',
    id: 'swiftAssault',
    name: 'Swift Assault',
    attr: 'dex',
    supports: ['attack'],
    costMult: 1.15,
    mods: [{ stat: 'attackSpeed', kind: 'inc', value: [25, 44] }],
    description: 'Increased attack speed.',
  },
  {
    kind: 'support',
    id: 'quickCast',
    name: 'Quick Cast',
    attr: 'int',
    supports: ['spell'],
    costMult: 1.2,
    mods: [{ stat: 'castSpeed', kind: 'inc', value: [20, 39] }],
    description: 'Increased cast speed.',
  },
  {
    kind: 'support',
    id: 'emberInfusion',
    name: 'Ember Infusion',
    attr: 'str',
    supports: ['attack'],
    costMult: 1.2,
    mods: [{ stat: 'gain.physical.fire', kind: 'base', value: [25, 34] }],
    description: 'Gain physical damage as extra fire damage.',
  },
  {
    kind: 'support',
    id: 'channelledElements',
    name: 'Channelled Elements',
    attr: 'int',
    supports: [],
    costMult: 1.3,
    mods: [
      { stat: 'damage', kind: 'more', value: [30, 49], damageTypes: ['fire', 'cold', 'lightning'] },
      { stat: 'cannotInflictEle', kind: 'flag', value: 1 },
    ],
    description: 'More elemental damage, but no elemental ailments.',
  },
  {
    kind: 'support',
    id: 'focusedRuin',
    name: 'Focused Ruin',
    attr: 'int',
    supports: ['spell'],
    costMult: 1.3,
    mods: [
      { stat: 'damage', kind: 'more', value: [30, 49], tags: ['spell'] },
      { stat: 'critChance', kind: 'inc', value: -100 },
    ],
    description: 'More spell damage; critical strikes are suppressed.',
  },
  {
    kind: 'support',
    id: 'echoingCast',
    name: 'Echoing Cast',
    attr: 'int',
    supports: ['spell'],
    costMult: 1.4,
    mods: [
      { stat: 'repeats', kind: 'base', value: 1 },
      { stat: 'castSpeed', kind: 'more', value: -20 },
      { stat: 'damage', kind: 'more', value: -10 },
    ],
    description: 'The spell is cast a second time, a moment after the first.',
  },
  {
    kind: 'support',
    id: 'volleySplit',
    name: 'Volley Split',
    attr: 'dex',
    supports: ['projectile'],
    costMult: 1.5,
    mods: [
      { stat: 'projectiles', kind: 'base', value: 2 },
      { stat: 'damage', kind: 'more', value: -25, tags: ['projectile'] },
    ],
    description: 'Two additional projectiles at reduced damage.',
  },
  {
    kind: 'support',
    id: 'piercingShot',
    name: 'Piercing Shot',
    attr: 'dex',
    supports: ['projectile'],
    costMult: 1.2,
    mods: [
      { stat: 'pierce', kind: 'base', value: [2, 5] },
      { stat: 'damage', kind: 'more', value: [0, 10], tags: ['projectile'] },
    ],
    description: 'Projectiles pass through enemies.',
  },
  {
    kind: 'support',
    id: 'denseBlast',
    name: 'Dense Blast',
    attr: 'int',
    supports: ['area'],
    costMult: 1.4,
    mods: [
      { stat: 'damage', kind: 'more', value: [35, 54], tags: ['area'] },
      { stat: 'aoe', kind: 'more', value: -30 },
    ],
    description: 'Smaller, more damaging areas.',
  },
  {
    kind: 'support',
    id: 'wideBlast',
    name: 'Wide Blast',
    attr: 'int',
    supports: ['area'],
    costMult: 1.4,
    mods: [{ stat: 'aoe', kind: 'inc', value: [30, 49] }],
    description: 'Larger areas of effect.',
  },
  {
    kind: 'support',
    id: 'precisionStrikes',
    name: 'Precision Strikes',
    attr: 'int',
    supports: [],
    costMult: 1.2,
    mods: [
      { stat: 'critChance', kind: 'inc', value: [30, 49] },
      { stat: 'critMulti', kind: 'base', value: [15, 34] },
    ],
    description: 'Better critical strikes.',
  },
  {
    kind: 'support',
    id: 'rendingEdge',
    name: 'Rending Edge',
    attr: 'str',
    supports: ['attack'],
    costMult: 1.2,
    mods: [
      { stat: 'chance.bleed', kind: 'base', value: 25 },
      { stat: 'damage', kind: 'more', value: [30, 49], tags: ['bleed'] },
    ],
    description: 'Hits cause stronger bleeding.',
  },
  {
    kind: 'support',
    id: 'toxinCoat',
    name: 'Toxin Coat',
    attr: 'dex',
    supports: [],
    costMult: 1.2,
    mods: [
      { stat: 'chance.poison', kind: 'base', value: 40 },
      { stat: 'damage', kind: 'more', value: [20, 39], tags: ['poison'] },
    ],
    description: 'Hits poison their targets.',
  },
  {
    kind: 'support',
    id: 'kindle',
    name: 'Kindle',
    attr: 'str',
    supports: ['attack'],
    costMult: 1.2,
    mods: [
      {
        stat: 'damage.min',
        kind: 'base',
        value: [42, 205],
        damageTypes: ['fire'],
        condition: { id: 'targetIgnited' },
      },
      {
        stat: 'damage.max',
        kind: 'base',
        value: [63, 308],
        damageTypes: ['fire'],
        condition: { id: 'targetIgnited' },
      },
    ],
    description: 'Adds fire damage to the attack against enemies that burn.',
  },
  {
    kind: 'support',
    id: 'bloodthirst',
    name: 'Bloodthirst',
    attr: 'str',
    supports: ['attack'],
    costMult: 1.3,
    mods: [{ stat: 'leech.life', kind: 'base', value: 2, tags: ['attack'] }],
    description: 'Attack damage is leeched as life.',
  },
  {
    kind: 'support',
    id: 'staggeringForce',
    name: 'Staggering Force',
    attr: 'str',
    supports: ['attack'],
    costMult: 1.15,
    mods: [
      { stat: 'stunDuration', kind: 'inc', value: [30, 49] },
      { stat: 'enemyStunThreshold', kind: 'base', value: 20 },
    ],
    description: 'Longer stuns, easier to stun.',
  },
];

/** Trigger supports (EXPANSION 5.5): the supported spells fire from a trigger. */
SUPPORT_GEMS.push(
  {
    kind: 'support',
    id: 'criticalRelay',
    name: 'Critical Relay',
    attr: 'int',
    supports: ['spell'],
    costMult: 1.3,
    mods: [{ stat: 'damage', kind: 'more', value: [20, 39] }],
    trigger: {
      on: 'crit',
      tags: ['attack'],
      chance: 100,
      cooldown: 0.15,
      effect: { kind: 'castSocketed' },
    },
    description:
      'Linked spells are cast when you critically strike with an attack, and deal more damage.',
  },
  {
    kind: 'support',
    id: 'woundedRetort',
    name: 'Wounded Retort',
    attr: 'int',
    supports: ['spell'],
    costMult: 1.3,
    mods: [],
    trigger: {
      on: 'hitTaken',
      threshold: 30,
      chance: 100,
      cooldown: 0.25,
      effect: { kind: 'castSocketed' },
    },
    description: 'Linked spells are cast whenever you have taken a large amount of damage.',
  },
);

export const AURA_GEMS: AuraGemDef[] = [
  {
    kind: 'aura',
    id: 'kindlingHalo',
    name: 'Kindling Halo',
    attr: 'str',
    reservePct: 50,
    mods: [
      { stat: 'damage.min', kind: 'base', value: [4, 120], damageTypes: ['fire'] },
      { stat: 'damage.max', kind: 'base', value: [7, 180], damageTypes: ['fire'] },
    ],
    description: 'Adds fire damage to attacks and spells.',
  },
  {
    kind: 'aura',
    id: 'stormHalo',
    name: 'Storm Halo',
    attr: 'int',
    reservePct: 50,
    mods: [
      { stat: 'damage.min', kind: 'base', value: [1, 20], damageTypes: ['lightning'] },
      { stat: 'damage.max', kind: 'base', value: [12, 300], damageTypes: ['lightning'] },
    ],
    description: 'Adds lightning damage to attacks and spells.',
  },
  {
    kind: 'aura',
    id: 'frostHalo',
    name: 'Frost Halo',
    attr: 'dexint',
    reservePct: 50,
    mods: [{ stat: 'gain.physical.cold', kind: 'base', value: [10, 19] }],
    description: 'Gain physical damage as extra cold damage.',
  },
  {
    kind: 'aura',
    id: 'veilOfGrace',
    name: 'Veil of Grace',
    attr: 'dex',
    reservePct: 50,
    mods: [{ stat: 'evasion', kind: 'base', value: [60, 1700] }],
    description: 'Grants evasion rating.',
  },
  {
    kind: 'aura',
    id: 'ironBastion',
    name: 'Iron Bastion',
    attr: 'str',
    reservePct: 50,
    mods: [{ stat: 'armour', kind: 'more', value: [20, 39] }],
    description: 'More armour.',
  },
  {
    kind: 'aura',
    id: 'arcaneWard',
    name: 'Arcane Ward',
    attr: 'int',
    reservePct: 35,
    mods: [{ stat: 'es', kind: 'base', value: [60, 500] }],
    description: 'Grants energy shield.',
  },
  {
    kind: 'aura',
    id: 'clearMind',
    name: 'Clear Mind',
    attr: 'int',
    reserveFlat: [35, 100],
    mods: [{ stat: 'manaRegenFlat', kind: 'base', value: [1.8, 8] }],
    description: 'Regenerates mana.',
  },
];

export const HEXING_STRIKES: SupportGemDef = {
  kind: 'support',
  id: 'hexingStrikes',
  name: 'Hexing Strikes',
  attr: 'int',
  supports: [],
  costMult: 1.3,
  mods: [],
  hexOnHit: true,
  description: 'Hexes in the same item are applied to enemies the skill hits.',
};

/**
 * Skills that exist only through items (EXPANSION 5.4). They never drop as gems; a unique's trigger
 * casts them.
 */
export const GRANTED_GEMS: ActiveGemDef[] = [
  {
    kind: 'active',
    id: 'aspectOfPrey',
    name: 'Prowler’s Veil',
    attr: 'dex',
    skillType: 'spell',
    tags: ['spell', 'duration'],
    types: ['triggerable'],
    behaviour: { kind: 'burst', radius: 1, origin: 'self' },
    castTime: 0.4,
    cost: [0, 0],
    mods: [],
    utility: {
      kind: 'buff',
      buff: 'catStealth',
      seconds: 6,
      policy: 'upkeep',
      cooldown: 9,
      mods: [
        { stat: 'evasion', kind: 'inc', value: [20, 60] },
        { stat: 'critChance', kind: 'inc', value: [20, 60] },
        { stat: 'moveSpeed', kind: 'inc', value: 10 },
      ],
    },
    description: 'A veil of stealth that sharpens your evasion and crits for a few seconds.',
  },
  {
    kind: 'active',
    id: 'aspectOfWing',
    name: 'Feathered Boon',
    attr: 'dex',
    skillType: 'spell',
    tags: ['spell', 'duration'],
    types: ['triggerable'],
    behaviour: { kind: 'burst', radius: 1, origin: 'self' },
    castTime: 0.4,
    cost: [0, 0],
    mods: [],
    utility: {
      kind: 'buff',
      buff: 'avianBoon',
      seconds: 8,
      policy: 'upkeep',
      cooldown: 12,
      mods: [
        { stat: 'damage', kind: 'more', value: [10, 25] },
        { stat: 'moveSpeed', kind: 'inc', value: [15, 30] },
      ],
    },
    description: 'A boon of wings that makes you hit harder and move faster for a while.',
  },
  {
    kind: 'active',
    id: 'aspectOfWeb',
    name: 'Weaver’s Lash',
    attr: 'dex',
    skillType: 'spell',
    tags: ['spell', 'curse', 'area', 'duration'],
    types: ['triggerable'],
    behaviour: { kind: 'burst', radius: 3, reach: 9 },
    castTime: 0.5,
    cost: [0, 0],
    mods: [],
    utility: { kind: 'curse', hex: 'hardTimes', radius: 3 },
    description: 'Spins webs about the enemies near the target: they take more damage.',
  },
  {
    kind: 'active',
    id: 'emberBurst',
    name: 'Ember Burst',
    attr: 'int',
    skillType: 'spell',
    tags: ['spell', 'area', 'fire'],
    behaviour: { kind: 'burst', radius: 2 },
    spellDamage: [{ type: 'fire', min: [7, 420], max: [11, 630] }],
    effectiveness: 200,
    castTime: 0.7,
    crit: 6,
    cost: [2, 16],
    mods: [{ stat: 'chance.ignite', kind: 'base', value: 20 }],
    description: 'A nova of flame around the target.',
  },
];

// The coverage plan's gems (docs/coverage/gems, generated).
ACTIVE_GEMS.push(...GEN_ACTIVE_GEMS);
SUPPORT_GEMS.push(...GEN_SUPPORT_GEMS);
AURA_GEMS.push(...GEN_AURA_GEMS);

/** Every gem that can drop. */
export const ALL_GEMS: GemDef[] = [...ACTIVE_GEMS, ...SUPPORT_GEMS, HEXING_STRIKES, ...AURA_GEMS];
const GEM_BY_ID = new Map<string, GemDef>([...ALL_GEMS, ...GRANTED_GEMS].map((g) => [g.id, g]));

export function gemDef(id: string): GemDef {
  const g = GEM_BY_ID.get(id);
  if (!g) throw new Error(`unknown gem ${id}`);
  return g;
}

/** §11.5 level requirement per gem level (index 0 = level 1). */
export const GEM_LEVEL_REQ = [
  1, 2, 4, 7, 11, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 67, 70,
] as const;

export const MAX_GEM_LEVEL = 25;
