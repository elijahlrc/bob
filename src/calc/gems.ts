import { gerp, lerp } from '../core/math';
import { spellBaseDamage } from '../data/constants';
import { GEM_LADDERS, GEM_START } from '../data/gemLevels';
import {
  MAX_GEM_LEVEL,
  FX_KEYS,
  type ActiveGemDef,
  type SkillFx,
  type DotSpec,
  type GemAttr,
  type GemDef,
  type GemMod,
  type LevelTable,
  type LevelValue,
  type SkillBehaviour,
  type SpellDamageDef,
  type UtilityDef,
} from '../data/gems';
import type { Attrs } from '../data/types';
import type { SkillType } from '../data/skillTypes';
import type { BuffId } from '../data/buffs';
import type { HitEffect, PatternId, ProjectileLook } from '../data/encounters';
import type { DamageType, Mod, SkillTag } from '../mods/types';

function tableValue(at: readonly number[], level: number): number {
  const n = at.length;
  if (n === 0) return 0;
  const l = Math.max(1, Math.round(level));
  if (l <= n) return at[l - 1];
  if (n === 1) return at[0];
  const a = at[n - 2];
  const b = at[n - 1];
  return a > 0 && b > 0 ? b * (b / a) ** (l - n) : b + (b - a) * (l - n);
}

/** Interpolate an L1/L20 value; levels above 20 extrapolate the same curve. A table is read at the level, and grows past its end
 * as its last two entries do. */
export function levelValue(v: LevelValue, level: number, geometric = false): number {
  if (typeof v === 'number') return v;
  if (!Array.isArray(v)) return tableValue((v as LevelTable).table, level);
  const t = (level - 1) / 19;
  return geometric ? gerp(v[0], v[1], t) : lerp(v[0], v[1], t);
}

export function gemMods(mods: readonly GemMod[], level: number, sourceId: string): Mod[] {
  return mods.map(({ geo, ...m }) => ({
    ...m,
    value: Math.round(levelValue(m.value, level, geo) * 10) / 10,
    source: { kind: 'gem', id: sourceId },
  }));
}

/** The character level a gem's first level requires (gem levels, DESIGN.md Appendix A): it drops from areas of that level on. */
export function gemStart(def: { id: string }): number {
  return GEM_START[def.id] ?? 1;
}

/** The character level a gem level requires: the reference ladder of the gem's first level. */
export function gemLevelReq(def: { id: string }, level: number): number {
  const ladder = GEM_LADDERS[gemStart(def)];
  return ladder[Math.max(1, Math.min(level, ladder.length)) - 1];
}

const STANDARD = GEM_LADDERS[1];

/**
 * Where a gem level stands on the ladder of a gem that starts at level 1: the level whose requirement is the same, between two
 * steps if it falls between them. What follows the character's level rather than the gem's (the shared curve of spell and
 * minion damage, the attribute requirement) reads this, so a level 1 gem that needs character level 28 hits like a level 9 one.
 * It is the gem level itself for a gem that starts at level 1, and for every gem from level 21, where all ladders agree.
 */
export function scaleLevel(def: { id: string }, level: number): number {
  if (gemStart(def) === 1 || level < 1 || level > STANDARD.length) return level;
  const req = gemLevelReq(def, level);
  for (let i = 0; i < STANDARD.length - 1; i++)
    if (req <= STANDARD[i + 1])
      return i + 1 + (req - STANDARD[i]) / (STANDARD[i + 1] - STANDARD[i]);
  return STANDARD.length;
}

/** Attribute requirement of a gem at a level (§11.5), at the level's place on the standard ladder. */
export function gemAttrReq(attr: GemAttr, level: number): Attrs {
  const full = Math.round(10 + ((98 - 10) * (Math.min(level, 20) - 1)) / 19);
  const hybrid = Math.round(full * 0.6);
  switch (attr) {
    case 'str':
      return { str: full, dex: 0, int: 0 };
    case 'dex':
      return { str: 0, dex: full, int: 0 };
    case 'int':
      return { str: 0, dex: 0, int: full };
    case 'dexint':
      return { str: 0, dex: hybrid, int: hybrid };
    case 'strint':
      return { str: hybrid, dex: 0, int: hybrid };
    case 'strdex':
      return { str: hybrid, dex: hybrid, int: 0 };
  }
}

/**
 * The highest natural level (≤ 20) allowed by character level and attributes. Never below 1: a gem held below its first level
 * (one found before gems waited for their level) works as a level 1 gem until the character catches up.
 */
export function naturalGemLevel(def: GemDef, charLevel: number, attrs: Attrs): number {
  let best = 1;
  for (let l = 1; l <= 20; l++) {
    if (gemLevelReq(def, l) > charLevel) break;
    const r = gemAttrReq(def.attr, scaleLevel(def, l));
    if (attrs.str < r.str || attrs.dex < r.dex || attrs.int < r.int) break;
    best = l;
  }
  return best;
}

/** The tags a gem counts as for tag-filtered bonuses: an active's skill tags, or "aura". */
export function gemTagsOf(def: GemDef): readonly SkillTag[] {
  return def.kind === 'active' ? def.tags : def.kind === 'aura' ? ['aura'] : [];
}

export function gemLevel(def: GemDef, charLevel: number, attrs: Attrs, bonus: number): number {
  return Math.min(MAX_GEM_LEVEL, naturalGemLevel(def, charLevel, attrs) + bonus);
}

/** A level-resolved skill, ready for the profile builder. Monsters and the default attack use it too. */
export type SkillDef = SkillFx & {
  id: string;
  name: string;
  type: 'attack' | 'spell';
  tags: SkillTag[];
  /** Every skill type: the tags and the extra types. */
  types: SkillType[];
  behaviour: SkillBehaviour;
  level: number;
  /**
   * The level on the shared curve of spell and minion damage (`scaleLevel`): the gem level for a gem that starts at level 1,
   * higher for one that needs a higher character level.
   */
  curveLevel: number;
  /** Percent of base damage (attacks). */
  baseMult: number;
  /** Attacks: the percent flat added damage is taken at, where it is not `baseMult` (ActiveGemDef). */
  addedMult?: number;
  spellDamage: { type: DamageType; min: number; max: number }[];
  /** Added damage effectiveness, percent. */
  effectiveness: number;
  castTime: number;
  /**
   * Seconds between uses (a gem's own cooldown, which applies to the primary skill as well); without one a secondary skill
   * waits the default, 6 uses long and at least 3 s.
   */
  cooldown?: number;
  /** An attack's own seconds per use in place of the weapon's, and seconds added to the weapon's (ActiveGemDef). */
  attackTime?: number;
  addedAttackTime?: number;
  /** How many uses the cooldown stores. */
  cooldownUses?: number;
  /** Charges that can be spent to use the skill while it waits on its cooldown. */
  bypass?: { charge: 'grit' | 'fervour' | 'insight'; n: number };
  /**
   * A channelled skill (docs/SPIRIT.md S5): used again and again, building a stage each time, and released when the channel ends.
   */
  channel?: {
    /** The stages it builds before it is released. */
    cap: number;
    /** Whether each use hits as it goes (Flurry of Edges, Blaze Stream) or only builds a stage (Furnace Roar). */
    tick: boolean;
    /** The damage of a use's own hit as a percentage of the skill's (Judgement Tempest's zaps while channelling deal half). */
    tickMult?: number;
    /** The channelling character cannot be stunned (Twister Blade). */
    stunImmune?: boolean;
    /** Held at the cap instead of released there: it goes on until the fight pauses, and the release (if any) is the last thing it does (Blaze Stream). */
    hold?: boolean;
    /** Percent more damage per stage built, on the hits as it goes. */
    perStage?: number;
    /** The damage of the first use, as a percentage of the others (Twister Blade's first hit deals half). */
    first?: number;
    /** Percent more area per stage built, on the hits as it goes. */
    tickRadiusPerStage?: number;
    /** A use also builds an extra stage while this many enemies are within the radius (a crowd charges Judgement Tempest faster). */
    crowdStage?: { min: number; radius: number };
    /** Extra stages for each rare or unique enemy a tick hits (Judgement Tempest: one). */
    uniqueStage?: number;
    /** What the release does: percent more damage in all and per stage, more area per stage, another shape, one strike per stage. */
    release?: {
      perStage: number;
      base?: number;
      radiusPerStage?: number;
      behaviour?: SkillBehaviour;
      repeat?: boolean;
      ignite?: number;
    };
  };
  /** Arrows that fall around the target and each leave a spore pod: it afflicts and slows what is near, then bursts (Venom Shower). */
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
  burning?: { pct: LevelValue; seconds: number; cap: number };
  stanceStorm?: ActiveGemDef['stanceStorm'];
  needsCorpse?: boolean;
  geyser?: ActiveGemDef['geyser'];
  deploySeconds?: number;
  ballista?: boolean;
  mortar?: { radius: number; from: number };
  ancestral?: { buff: BuffId; range: number; mods: GemMod[] };
  bond?: { width: number; range: number; end: number };
  mineRain?: { count: LevelValue; perPrior?: number; radius: number; spread: number };
  mineAura?: ActiveGemDef['mineAura'];
  travelThrough?: boolean;
  spin?: ActiveGemDef['spin'];
  run?: ActiveGemDef['run'];
  detonation?: number;

  form?: { after: number; speed: number; critMore: number; critMulti: LevelValue };
  recoverNear?: { normal: LevelValue; rare: LevelValue; radius: number };
  pausedBy?: BuffId;
  catches?: number;
  returnMore?: number;
  releasesCaught?: boolean;
  /** Orbs a channelled skill leaves standing (docs/SPIRIT.md S6). */
  orb?: ActiveGemDef['orb'];
  /** Ground the skill leaves where it lands (docs/SPIRIT.md S6). */
  leaves?: {
    creep?: number;
    max?: number;
    kind: 'consecrated' | 'chilling' | 'caustic' | 'burning';
    seconds: number;
    radius: number;
    /** How many times larger the ground ends than it began. */
    grow?: number;
    /** Chilling ground: the share of a hit it deals each second. */
    dps?: number;
    killCharge?: { kind: 'grit' | 'fervour' | 'insight'; chance: number };
  };
  /** A crystal that stands a moment, exposes what is near, and bursts (Rime Core). */
  crystal?: {
    radius: number;
    seconds: number;
    interval: number;
    exposure: number;
    regenLess: number;
    debuffSeconds: number;
  };
  /** A wall of ice across the way, that holds the tiles shut for a while and pushes what stands there back (Glacier Wall). */
  wall?: { length: number; seconds: number; push: number };
  /** A second, harder hit a moment after the first, over a larger area (Faultline). */
  aftershock?: ActiveGemDef['aftershock'];
  /** A chance to spend a charge to make the use a Charged Slam (Magma Crack). */
  chargedSlam?: {
    chance: number;
    charge: 'grit' | 'fervour' | 'insight';
    more: number;
    radius: number;
  };
  /** A skill that grows with use: each use that hits adds a stage (more area), and they fade when it stops hitting (Sweeping Cut). */
  stacks?: { cap: number; areaPer: number; fadeAfter: number };
  afterHit?: {
    kind: 'bolts' | 'blades' | 'balls' | 'area' | 'element';
    count: number;
    mult: number;
    arc?: number;
    range: number;
    explodeRadius?: number;
    ailmentRadius?: number;
    chains?: number;
  };
  cone?: { angle: number; length: number; mult: number };
  /** The skill spends every charge held when it lands, and waits for at least `min` of them. */
  consumeCharges?: { min: number };
  /** Spell base crit, percent. */
  crit: number;
  cost: number;
  mods: Mod[];
  requiresWeapon?: SkillTag[];
  bothWeapons?: boolean;
  needsTwoHand?: boolean;
  utility?: UtilityDef;
  travel?: number;
  /** A monster's attack: the share of the wind-up after which its aim stops following the target (docs/ROSTER.md 5.3). */
  lockAim?: number;
  /** A monster's beam that drags the character this many tiles toward it when it lands (docs/ROSTER.md 7.2). */
  pull?: number;
  /** A monster's pattern of blasts, cast when the action fires (docs/ENCOUNTERS.md 4). */
  pattern?: PatternId;
  /** How a monster's thrown projectile looks. */
  look?: ProjectileLook;
  /** What a monster's hit does to the character besides damage. */
  debuff?: HitEffect;
};

/** A spell's base damage in one type at a level, from explicit numbers or from the shared curve. */
export function spellDamageAt(
  d: SpellDamageDef,
  effectiveness: number,
  level: number,
  /** The level on the shared curve (`scaleLevel`); explicit numbers are the gem level's own. */
  curveLevel = level,
): { type: DamageType; min: number; max: number } {
  if ('spread' in d) {
    const avg = spellBaseDamage(curveLevel) * (effectiveness / 100) * (d.share ?? 1);
    return { type: d.type, min: Math.round(avg * d.spread[0]), max: Math.round(avg * d.spread[1]) };
  }
  return {
    type: d.type,
    min: Math.round(levelValue(d.min, level, true)),
    max: Math.round(levelValue(d.max, level, true)),
  };
}

/** What supports may do with a skill whose gem lists no types of its own: spells can be totemised, trapped and mined. */
function defaultTypes(def: ActiveGemDef): SkillType[] {
  if (def.utility || def.tags.some((t) => ['totem', 'trap', 'mine', 'brand'].includes(t)))
    return [];
  return def.skillType === 'spell'
    ? ['totemable', 'trappable', 'mineable', 'triggerable', 'repeatable']
    : ['repeatable'];
}

/** The special doings a gem names, as the skill carries them. */
function fxOf(def: SkillFx): SkillFx {
  const o: Record<string, unknown> = {};
  for (const k of FX_KEYS) if (def[k] !== undefined) o[k] = def[k];
  return o as SkillFx;
}

/**
 * A gem at a level is the same skill every time, and the sheet asks for it again for every build it works out (the Skills tab tries
 * each gem in each socket). What comes back is shared: copy it before changing it.
 */
const resolved = new Map<string, SkillDef>();

export function resolveActive(def: ActiveGemDef, level: number): SkillDef {
  const key = `${def.id}|${level}`;
  let skill = resolved.get(key);
  if (!skill) resolved.set(key, (skill = resolveActiveUncached(def, level)));
  return skill;
}

function resolveActiveUncached(def: ActiveGemDef, level: number): SkillDef {
  const b = def.behaviour;
  const per5 = Math.floor(level / 5);
  const behaviour: SkillBehaviour =
    b.kind === 'projectile' && b.countPer5
      ? { ...b, count: b.count + b.countPer5 * per5 }
      : b.kind === 'chain' && b.chainsPer5
        ? { ...b, chains: b.chains + b.chainsPer5 * per5 }
        : b;
  return {
    id: def.id,
    name: def.name,
    type: def.skillType,
    tags: def.tags,
    types: [...new Set<SkillType>([...def.tags, ...(def.types ?? defaultTypes(def))])],
    behaviour,
    level,
    curveLevel: scaleLevel(def, level),
    baseMult: def.baseMult ? levelValue(def.baseMult, level) : 100,
    addedMult: def.addedMult === undefined ? undefined : levelValue(def.addedMult, level),
    spellDamage: (def.spellDamage ?? []).map((d) =>
      spellDamageAt(d, def.effectiveness ?? 100, level, scaleLevel(def, level)),
    ),
    effectiveness: def.effectiveness ?? 100,
    castTime: def.castTime ?? 1,
    crit: def.crit ?? 0,
    cost: Math.round(levelValue(def.cost, level)),
    mods: gemMods(def.mods, level, def.id),
    requiresWeapon: def.requiresWeapon,
    bothWeapons: def.bothWeapons,
    needsTwoHand: def.needsTwoHand,
    utility: def.utility,
    travel: def.travel,
    cooldown: def.cooldown === undefined ? undefined : levelValue(def.cooldown, level),
    attackTime: def.attackTime === undefined ? undefined : levelValue(def.attackTime, level),
    addedAttackTime: def.addedAttackTime,
    cooldownUses: def.cooldownUses,
    bypass: def.bypass,
    consumeCharges: def.consumeCharges,
    afterHit: def.afterHit && {
      ...def.afterHit,
      count: Math.round(levelValue(def.afterHit.count, level)),
      chains:
        def.afterHit.chains === undefined
          ? undefined
          : Math.round(levelValue(def.afterHit.chains, level)),
    },
    ...fxOf(def),
    cone: def.cone,
    channel: def.channel,
    stacks: def.stacks,
    leaves: def.leaves,
    dot: def.dot,
    pods: def.pods,
    burning: def.burning,
    orb: def.orb,
    form: def.form,
    stanceStorm: def.stanceStorm,
    needsCorpse: def.needsCorpse,
    geyser: def.geyser,
    deploySeconds: def.deploySeconds,
    travelThrough: def.travelThrough,
    spin: def.spin,
    run: def.run,
    ballista: def.ballista,
    mortar: def.mortar,
    ancestral: def.ancestral,
    bond: def.bond,
    mineRain: def.mineRain,
    mineAura: def.mineAura,
    detonation: def.detonation,
    recoverNear: def.recoverNear,
    pausedBy: def.pausedBy,
    catches: def.catches,
    returnMore: def.returnMore,
    releasesCaught: def.releasesCaught,
    crystal: def.crystal,
    wall: def.wall,
    aftershock: def.aftershock,
    chargedSlam: def.chargedSlam,
  };
}

/** The free default attack (§6.7): weapon attack, 100% base damage, no cost, no supports. */
export const DEFAULT_ATTACK: SkillDef = {
  id: 'defaultAttack',
  name: 'Default Attack',
  type: 'attack',
  tags: ['attack', 'melee'],
  types: ['attack', 'melee'],
  behaviour: { kind: 'melee', range: 1.3 },
  level: 1,
  curveLevel: 1,
  baseMult: 100,
  spellDamage: [],
  effectiveness: 100,
  castTime: 1,
  crit: 0,
  cost: 0,
  mods: [],
};

/** Default attack variant for bows (fires a single arrow). */
export const DEFAULT_BOW_ATTACK: SkillDef = {
  ...DEFAULT_ATTACK,
  id: 'defaultBowAttack',
  tags: ['attack', 'projectile'],
  types: ['attack', 'projectile'],
  behaviour: { kind: 'projectile', count: 1, spread: 0, range: 9 },
};

/** Default attack variant for wands: a bolt, shot as a bow shoots an arrow. */
export const DEFAULT_WAND_ATTACK: SkillDef = {
  ...DEFAULT_BOW_ATTACK,
  id: 'defaultWandAttack',
};
