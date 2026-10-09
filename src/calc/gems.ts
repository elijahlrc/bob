import { gerp, lerp } from '../core/math';
import { spellBaseDamage } from '../data/constants';
import {
  GEM_LEVEL_REQ,
  MAX_GEM_LEVEL,
  type ActiveGemDef,
  type DotSpec,
  type GemAttr,
  type GemDef,
  type GemMod,
  type LevelValue,
  type SkillBehaviour,
  type SpellDamageDef,
  type UtilityDef,
} from '../data/gems';
import type { Attrs } from '../data/types';
import type { SkillType } from '../data/skillTypes';
import type { BuffId } from '../data/buffs';
import type { DamageType, Mod, SkillTag } from '../mods/types';

/** Interpolate an L1/L20 value; levels above 20 extrapolate the same curve. */
export function levelValue(v: LevelValue, level: number, geometric = false): number {
  if (typeof v === 'number') return v;
  const t = (level - 1) / 19;
  return geometric ? gerp(v[0], v[1], t) : lerp(v[0], v[1], t);
}

export function gemMods(mods: readonly GemMod[], level: number, sourceId: string): Mod[] {
  return mods.map((m) => ({
    ...m,
    value: Math.round(levelValue(m.value, level) * 10) / 10,
    source: { kind: 'gem', id: sourceId },
  }));
}

/** Attribute requirement of a gem at a level (§11.5). */
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

/** The highest natural level (≤ 20) allowed by character level and attributes. */
export function naturalGemLevel(def: GemDef, charLevel: number, attrs: Attrs): number {
  let best = 1;
  for (let l = 1; l <= 20; l++) {
    if (GEM_LEVEL_REQ[l - 1] > charLevel) break;
    const r = gemAttrReq(def.attr, l);
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
export type SkillDef = {
  id: string;
  name: string;
  type: 'attack' | 'spell';
  tags: SkillTag[];
  /** Every skill type: the tags and the extra types. */
  types: SkillType[];
  behaviour: SkillBehaviour;
  level: number;
  /** Percent of base damage (attacks). */
  baseMult: number;
  spellDamage: { type: DamageType; min: number; max: number }[];
  /** Added damage effectiveness, percent. */
  effectiveness: number;
  castTime: number;
  /**
   * Seconds between uses (a gem's own cooldown, which applies to the primary skill as well); without one a secondary skill
   * waits the default, 6 uses long and at least 3 s.
   */
  cooldown?: number;
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
  burning?: { pct: LevelValue; seconds: number; cap: number };
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
    count: number;
    mult: number;
    arc?: number;
    range: number;
    explodeRadius?: number;
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
  utility?: UtilityDef;
  travel?: number;
  /** A monster's attack: the share of the wind-up after which its aim stops following the target (docs/ROSTER.md 5.3). */
  lockAim?: number;
  /** A monster's beam that drags the character this many tiles toward it when it lands (docs/ROSTER.md 7.2). */
  pull?: number;
};

/** A spell's base damage in one type at a level, from explicit numbers or from the shared curve. */
export function spellDamageAt(
  d: SpellDamageDef,
  effectiveness: number,
  level: number,
): { type: DamageType; min: number; max: number } {
  if ('spread' in d) {
    const avg = spellBaseDamage(level) * (effectiveness / 100) * (d.share ?? 1);
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

export function resolveActive(def: ActiveGemDef, level: number): SkillDef {
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
    baseMult: def.baseMult ? levelValue(def.baseMult, level) : 100,
    spellDamage: (def.spellDamage ?? []).map((d) =>
      spellDamageAt(d, def.effectiveness ?? 100, level),
    ),
    effectiveness: def.effectiveness ?? 100,
    castTime: def.castTime ?? 1,
    crit: def.crit ?? 0,
    cost: Math.round(levelValue(def.cost, level)),
    mods: gemMods(def.mods, level, def.id),
    requiresWeapon: def.requiresWeapon,
    bothWeapons: def.bothWeapons,
    utility: def.utility,
    travel: def.travel,
    cooldown: def.cooldown === undefined ? undefined : levelValue(def.cooldown, level),
    cooldownUses: def.cooldownUses,
    bypass: def.bypass,
    consumeCharges: def.consumeCharges,
    afterHit: def.afterHit && {
      ...def.afterHit,
      count: Math.round(levelValue(def.afterHit.count, level)),
    },
    cone: def.cone,
    channel: def.channel,
    stacks: def.stacks,
    leaves: def.leaves,
    dot: def.dot,
    pods: def.pods,
    burning: def.burning,
    orb: def.orb,
    form: def.form,
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
