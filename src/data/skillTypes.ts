import type { SkillTag } from '../mods/types';

/**
 * Skill types (COVERAGE 5.2): what a support gem can support, and what role a skill plays. Every skill tag is a skill
 * type, so "supports attacks" and "supports melee" read the same way as before; the extra types below say what a
 * skill *can become* or *is*, and have no mod-scaling meaning of their own. The names are ours: the reference game's
 * names live only in `scripts/coverage`.
 */
export const EXTRA_SKILL_TYPES = [
  // What a skill can be used as.
  'totemable',
  'trappable',
  'mineable',
  'brandable',
  'triggerable',
  'repeatable',
  'volleyable',
  'cascadable',
  'rapidFire',
  // What a skill is.
  'instant',
  'buff',
  'reserving',
  'createsMinion',
  'golem',
  'offering',
  'stance',
  'blink',
  'travel',
  'orb',
  'retaliation',
  'mark',
  'hex',
  'damageOverTime',
  'banner',
  'critical',
] as const;
export type ExtraSkillType = (typeof EXTRA_SKILL_TYPES)[number];
export type SkillType = SkillTag | ExtraSkillType;

/** What a support gem needs of the skill it supports, and what it does to the skill's types. */
export type SupportRules = {
  /** The supported skill needs at least one of these (empty: any skill). */
  supports: SkillType[];
  /** ... and all of these. */
  needs?: SkillType[];
  /** The skill must have none of these. */
  excludes?: SkillType[];
  /** Types the support adds to the skill (Spell Totem makes it a totem). */
  adds?: SkillType[];
};

/** Whether a skill with these types satisfies a support's requirements (added types are not part of this check). */
export function typesAllow(rules: SupportRules, types: ReadonlySet<SkillType>): boolean {
  if (rules.supports.length > 0 && !rules.supports.some((t) => types.has(t))) return false;
  if (rules.needs && !rules.needs.every((t) => types.has(t))) return false;
  if (rules.excludes && rules.excludes.some((t) => types.has(t))) return false;
  return true;
}

/** Why a skill does not satisfy a support, in words (for the gem's status line). */
export function typesWhy(rules: SupportRules, types: ReadonlySet<SkillType>): string | null {
  if (rules.supports.length > 0 && !rules.supports.some((t) => types.has(t)))
    return `needs a ${rules.supports.join(' or ')} skill`;
  const missing = rules.needs?.find((t) => !types.has(t));
  if (missing) return `needs a ${missing} skill`;
  const bad = rules.excludes?.find((t) => types.has(t));
  if (bad) return `cannot support ${bad} skills`;
  return null;
}

/**
 * The supports that apply to a skill, and the types the skill ends up with. A support can add types (Spell Totem adds
 * "totem") that change what the others may do, so this is a greatest fixpoint: start with every candidate applying and
 * drop any whose rules fail against the skill's types plus what the *other* applying supports add, until nothing changes.
 */
export function resolveSupports<T extends SupportRules>(
  base: readonly SkillType[],
  candidates: readonly T[],
): { applied: T[]; types: Set<SkillType> } {
  let applied = [...candidates];
  for (let guard = 0; guard <= candidates.length; guard++) {
    const keep = applied.filter((s) => {
      const types = new Set<SkillType>(base);
      for (const o of applied) if (o !== s) for (const t of o.adds ?? []) types.add(t);
      return typesAllow(s, types);
    });
    if (keep.length === applied.length) break;
    applied = keep;
  }
  const types = new Set<SkillType>(base);
  for (const s of applied) for (const t of s.adds ?? []) types.add(t);
  return { applied, types };
}
