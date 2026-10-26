import type { GemMod, SupportGemDef } from '../data/gems';
import type { DamageType } from '../mods/types';
import type { SkillType } from '../data/skillTypes';
import { levelValue, type SkillDef } from './gems';

/**
 * Whether a support can do anything to a skill, asked of the data (docs/SUPPORTS-PLAN.md 4.1).
 *
 * A support is a list of mods; a skill is its tags, types, behaviour and effects. A mod is dead on a skill when
 *  1. its `tags` name a keyword the skill cannot have (Wide Crush's damage needs `area`), or
 *  2. its stat is one that only some behaviours honour, and this skill's behaviour is not one of them
 *     (`projectiles` on a skill that fires none), or
 *  3. it is about hits and the skill makes none (damage on a curse).
 * A support is live on a skill when any of its upsides is live. The price of a support (a negative `more`, a cost) is
 * not an upside, so a support whose only live part is its price is dead, and is not offered.
 *
 * `reaches` is the one place that knows which behaviours honour a stat. The profile builder asks it too
 * (`projectileBase`), so what the sheet counts and what the check says cannot drift apart.
 */

/** The ways a projectile skill gets its projectiles into the air (the early returns of `fireProjectiles`). */
export type ProjectilePath =
  'pods' | 'creep' | 'mirror' | 'pulse' | 'shield' | 'mortar' | 'tornado' | 'lob' | 'fan';

/** Which path a projectile-kind skill takes, in the order the sim checks them; null for other behaviours. */
export function projectilePath(s: SkillDef): ProjectilePath | null {
  if (s.behaviour.kind !== 'projectile') return null;
  if (s.pods) return 'pods';
  if (s.leaves?.creep !== undefined) return 'creep';
  if (s.mirror) return 'mirror';
  if (s.pulse) return 'pulse';
  if (s.shield) return 'shield';
  if (s.mods.some((m) => m.stat === 'tornadoShot')) return 'tornado';
  if (s.bounces) return 'lob';
  if (s.mortar) return 'mortar';
  return 'fan';
}

/** Whether the shots of a fan skill end at the first thing they touch, so they cannot fork, chain or pierce on. */
function explodes(s: SkillDef): boolean {
  const b = s.behaviour;
  return b.kind === 'projectile' && (b.explodeRadius ?? 0) > 0;
}

/** Shots that pierce on their own cannot also fork or chain (`fireProjectiles`). */
function piercesAlready(s: SkillDef): boolean {
  return s.behaviour.kind === 'projectile' && (s.behaviour.pierce ?? 0) > 0;
}

/**
 * The projectile count a skill starts from, which supports add to; null when the skill's projectiles cannot be
 * counted (a single orb, a clone, a skull, a melee thrust, a chain). Read by the profile builder.
 */
export function projectileBase(s: SkillDef): number | null {
  const b = s.behaviour;
  switch (b.kind) {
    case 'projectile': {
      const path = projectilePath(s);
      return path === 'creep' || path === 'mirror' || path === 'pulse' ? null : b.count;
    }
    case 'ground':
      return b.count ?? null;
    default:
      // A strike that sends bolts, blades or balls after it can send more.
      return afterHitCounts(s) ? 1 : null;
  }
}

/** Whether the strike's own follow-up is a number of missiles. */
export function afterHitCounts(s: SkillDef): boolean {
  const k = s.afterHit?.kind;
  return k === 'bolts' || k === 'blades' || k === 'balls';
}

/** Whether the skill has an area for supports that widen it to widen: arcs, bursts, rains, clouds, explosions. */
export function hasArea(s: SkillDef): boolean {
  const b = s.behaviour;
  if (b.kind === 'burst' || b.kind === 'ground' || b.kind === 'beam') return true;
  if (b.kind === 'melee' && b.arc) return true;
  if (b.kind === 'projectile' && (b.explodeRadius ?? 0) > 0) return true;
  if (b.kind === 'chain') return false;
  return !!(
    s.mortar ||
    s.pods ||
    s.pulse ||
    s.fuse ||
    s.wave ||
    s.vortex ||
    s.markers ||
    s.stormOrb ||
    s.crystal ||
    s.orb ||
    s.leaves ||
    s.aftershock ||
    s.charge ||
    s.stacks ||
    s.geyser ||
    s.bounces ||
    s.cone ||
    s.stanceStorm ||
    s.volleys ||
    s.dot?.splash ||
    s.dot?.carried ||
    s.afterHit?.explodeRadius ||
    s.afterHit?.kind === 'area' ||
    s.afterHit?.kind === 'element' ||
    s.channel
  );
}

/** Whether the skill has a time that duration modifiers lengthen or shorten. */
function hasDuration(s: SkillDef): boolean {
  if (s.behaviour.kind === 'ground') return true;
  if (s.utility) return true;
  return !!(
    s.leaves ||
    s.dot ||
    s.crystal ||
    s.wall ||
    s.orb ||
    s.vortex ||
    s.stanceStorm ||
    s.geyser ||
    s.pods ||
    s.mirror ||
    s.hitBuff ||
    s.fuse ||
    s.charge ||
    s.beams ||
    s.bond ||
    s.ancestral ||
    s.channel ||
    s.markers ||
    s.stormOrb ||
    s.volleys ||
    s.types.includes('minion' as SkillType) ||
    s.types.includes('totem' as SkillType)
  );
}

/**
 * Whether a skill can deal damage of a type. A spell deals what it is written with, what it converts to and what it gains as; an attack
 * deals what the weapon and gear give it, so only physical can be taken away from it (all of it converted).
 */
export function dealsType(s: SkillDef, t: DamageType): boolean {
  if (s.type === 'attack') {
    if (t !== 'physical') return true;
    let converted = 0;
    for (const m of s.mods)
      if (m.stat.startsWith('convertSkill.physical.') && !m.condition) converted += m.value;
    return converted < 100;
  }
  if (s.spellDamage.some((d) => d.type === t) || s.dot?.type === t) return true;
  for (const m of s.mods) {
    if (m.stat.startsWith('convertSkill.') || m.stat.startsWith('gain.')) {
      if (m.stat.split('.').pop() === t) return true;
    } else if (m.damageTypes?.includes(t) && m.stat.startsWith('damage.')) return true;
  }
  return false;
}

/** Whether the skill makes hits at all: a curse, a buff or a blink does not, so nothing about hits can act on it. */
export function dealsDamage(s: SkillDef): boolean {
  if (!s.utility) return true;
  return s.spellDamage.length > 0 || !!s.dot || (s.type === 'attack' && s.baseMult > 0);
}

/** The stats that are about hits (damage, crit, ailments, leech, conversion). */
const HIT_STAT_PREFIXES = [
  'damage',
  'critChance',
  'critMulti',
  'accuracy',
  'penetration',
  'chance.',
  'gain.',
  'convert',
  'leech.',
  'lifeOnHit',
  'manaOnHit',
  'esOnHit',
  'status.',
  'stun',
  'enemy',
  'cullingStrike',
  'impale',
  'bleed.',
  'poison.',
  'ignite.',
  'effect.',
  'duration.',
  'dot.',
  'perPoison',
  'spread.',
  'noElemental',
  'noChaos',
  'noPhysical',
  'cannotInflict',
  'meleeAilmentMore',
  'closeCombat',
  'ruthless',
  'shockwave',
  'extraTargets',
  'projectile',
  'pierce',
  'chains',
  'arrowNova',
  'mirage',
];

/** Why a stat, set by a support, cannot act on a skill; null when it can (or when nothing is known against it). */
type Gate = (s: SkillDef) => string | null;

const dead = (why: string): string => why;

function noProjectiles(s: SkillDef): string {
  const b = s.behaviour;
  switch (b.kind) {
    case 'projectile': {
      const path = projectilePath(s);
      if (path === 'creep') return `${s.name} sends a single skull`;
      if (path === 'mirror') return `${s.name} sends a single arrow`;
      if (path === 'pulse') return `${s.name} is a single orb`;
      return `${s.name} has no projectiles to add to`;
    }
    case 'chain':
      return `${s.name} is one bolt that chains`;
    case 'ground':
      return `${s.name} is not made of arrows`;
    case 'melee':
      return `${s.name} strikes and fires nothing`;
    case 'burst':
      return `${s.name} fires no projectiles of its own`;
    default:
      return `${s.name} fires no projectiles`;
  }
}

const fanOnly: Gate = (s) => {
  if (projectilePath(s) === 'fan') return null;
  return projectileBase(s) === null
    ? noProjectiles(s)
    : dead(`${s.name} does not fire its projectiles in lines`);
};

/** The stats only some behaviours honour. A stat that is not here acts on every skill that is about hits. */
const REACH: Record<string, Gate> = {
  projectiles: (s) => (projectileBase(s) === null ? noProjectiles(s) : null),
  projectilesParallel: fanOnly,
  projectilesSequential: fanOnly,
  arrowNova: (s) => {
    const p = projectilePath(s);
    return p === 'fan' || p === 'mortar' || p === 'tornado'
      ? null
      : dead(`${s.name} does not shoot arrows that can burst into a ring`);
  },
  projectilesFork: (s) => {
    if (s.behaviour.kind !== 'projectile') return noProjectiles(s);
    if (projectilePath(s) !== 'fan') return dead(`${s.name}'s projectiles cannot fork`);
    if (explodes(s) || s.fuse || piercesAlready(s))
      return dead(`${s.name}'s shots end where they hit`);
    return null;
  },
  pierce: (s) => {
    const b = s.behaviour;
    const p = projectilePath(s);
    if (b.kind === 'projectile') {
      if (p === 'fan' && !explodes(s) && !s.fuse) return null;
      return dead(`${s.name}'s shots end where they hit`);
    }
    if (s.afterHit?.kind === 'bolts' || s.afterHit?.kind === 'blades') return null;
    return noProjectiles(s);
  },
  chains: (s) => {
    const b = s.behaviour;
    if (b.kind === 'chain') return null;
    if (b.kind !== 'projectile') return noProjectiles(s);
    if (projectilePath(s) !== 'fan' || explodes(s) || s.fuse || piercesAlready(s))
      return dead(`${s.name}'s shots cannot chain`);
    return null;
  },
  projectileSpeed: (s) => {
    if (s.behaviour.kind === 'projectile' && projectilePath(s) !== 'pods') return null;
    if (s.afterHit?.kind === 'bolts' || s.afterHit?.kind === 'blades') return null;
    return noProjectiles(s);
  },
  closeQuarters: (s) =>
    s.behaviour.kind === 'projectile' && s.type === 'attack' ? null : noProjectiles(s),
  aoe: (s) => (hasArea(s) ? null : dead(`${s.name} has no area to widen`)),
  extraTargets: (s) =>
    s.behaviour.kind === 'melee' && !s.behaviour.arc
      ? null
      : dead(`${s.name} is not a single-target strike`),
  'shockwave.mult': (s) =>
    s.behaviour.kind === 'melee' ? null : dead(`${s.name} is not a weapon strike`),
  'shockwave.cooldown': (s) =>
    s.behaviour.kind === 'melee' ? null : dead(`${s.name} is not a weapon strike`),
  skillDuration: (s) => (hasDuration(s) ? null : dead(`${s.name} has nothing that lasts`)),
  cascade: (s) =>
    s.behaviour.kind === 'burst' && s.behaviour.origin === 'self'
      ? dead(`${s.name} is centred on you, with nowhere to the sides`)
      : null,
};

/** The keywords a skill has for good (not the damage type, ailment or weapon, which gear and other supports can change). */
const STATIC_TAGS = new Set([
  'attack',
  'spell',
  'melee',
  'projectile',
  'area',
  'duration',
  'minion',
  'curse',
  'aura',
  'strike',
  'chaining',
  'channelling',
]);

/** Tags the skill has, counting the types supports add (a totem support makes a skill a totem). */
function skillKeywords(s: SkillDef): ReadonlySet<string> {
  return new Set<string>(s.types);
}

/** The flags that make a support cost something rather than give something. */
const PRICE_FLAGS = new Set([
  'noElementalDamage',
  'noChaosDamage',
  'noPhysicalDamage',
  'cannotInflictEle',
]);

const levelEnd = (v: GemMod['value']): number => levelValue(v, 20);

/** A mod that takes something away (a negative more/inc/base, a flag that forbids): the price of a support, not an upside. */
export function isPrice(m: GemMod): boolean {
  if (m.kind === 'flag') return PRICE_FLAGS.has(m.stat);
  return levelEnd(m.value) <= 0 && (m.kind === 'more' || m.kind === 'inc' || m.kind === 'base');
}

const isHitStat = (stat: string): boolean => HIT_STAT_PREFIXES.some((p) => stat.startsWith(p));

/** Why one mod cannot act on a skill; null when it can. `keywords` are the skill's types with what the other supports add. */
export function modWhy(
  m: GemMod,
  s: SkillDef,
  keywords: ReadonlySet<string> = skillKeywords(s),
): string | null {
  for (const t of m.tags ?? []) {
    if (STATIC_TAGS.has(t) && !keywords.has(t)) return dead(`${s.name} has no ${t} to scale`);
    // The `area` keyword is only worth something on a skill that has an area (a thrust tagged `area` has none).
    if (t === 'area' && !hasArea(s)) return dead(`${s.name} has no area`);
  }
  // A bonus to a damage type the skill cannot deal (cold penetration on a fire spell, physical on an arrow that is all fire).
  // (Added damage and gains make damage of a type, so they need nothing to start from.)
  if (
    m.damageTypes?.length &&
    (m.stat === 'damage' || m.stat === 'penetration') &&
    !m.damageTypes.some((t) => dealsType(s, t))
  )
    return dead(`${s.name} deals no ${m.damageTypes.join(' or ')} damage`);
  const gate = REACH[m.stat];
  if (gate) {
    const why = gate(s);
    if (why) return why;
  }
  if (!dealsDamage(s) && isHitStat(m.stat)) return dead(`${s.name} does no damage`);
  return null;
}

/** The mods of a support that are not its price. */
function upsides(sup: SupportGemDef): GemMod[] {
  return sup.mods.filter((m) => !isPrice(m));
}

export type Liveness = { live: true } | { live: false; why: string };

/**
 * Whether a support does anything on a skill. A support with no mod of its own to speak of (a trigger, a level bonus, a global
 * mod, a hex, a cost cut) is live wherever its types allow it.
 */
export function supportLive(
  sup: SupportGemDef,
  s: SkillDef,
  keywords?: ReadonlySet<string>,
): Liveness {
  const ups = upsides(sup);
  const other =
    !!sup.trigger ||
    !!sup.extraTriggers?.length ||
    !!sup.global?.length ||
    sup.levelBonus !== undefined ||
    !!sup.curseAura ||
    !!sup.hexOnHit;
  if (ups.length === 0 || other) return { live: true };
  // What a support is for is what it does to the skill (more projectiles, pierce, a wider area), not the damage it adds to go with
  // it: when it has such a mod, one of those must be able to act. A plain damage bonus alone does not make Piercing Shot worth
  // having on a skill that cannot pierce.
  // A side effect on duration does not define a support that also speeds a skill up (Swift Snares), only one that is about it.
  const mechanics = ups.filter((m) => REACH[m.stat] !== undefined && m.stat !== 'skillDuration');
  const defining = mechanics.length > 0 ? mechanics : ups;
  let first: string | null = null;
  for (const m of defining) {
    const why = modWhy(m, s, keywords);
    if (why === null) return { live: true };
    first ??= why;
  }
  return { live: false, why: first ?? `${sup.name} has nothing to act on` };
}
