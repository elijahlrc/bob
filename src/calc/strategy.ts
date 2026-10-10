import type { SkillDef } from './gems';
import {
  EMERGENCY_LIFE,
  type SkillRole,
  type SkillTactic,
  type SkillWhen,
  type Strategy,
} from '../data/strategy';

/** One skill in the order the character considers its skills, with what the strategy makes of it. */
export type RotationEntry<C> = {
  choice: C;
  role: SkillRole;
  when: SkillWhen;
  /** Seconds between uses of a periodic skill without a cooldown of its own (undefined: the usual pause). */
  every?: number;
  /** The share of life below which an emergency skill is used. */
  life: number;
  /** Whether the role and the condition are the defaults (nothing set on the Strategy tab). */
  isDefault: boolean;
};

/** The roles a skill can be given: what makes sense for its kind. */
export function rolesFor(skill: SkillDef): SkillRole[] {
  const u = skill.utility;
  if (!u) {
    const roles: SkillRole[] = ['main', 'periodic', 'opener', 'emergency'];
    if (skill.dot) roles.push('keepUp');
    return [...roles, 'off'];
  }
  switch (u.kind) {
    case 'buff':
      if (u.banner) return ['auto', 'off'];
      if (u.policy === 'guard') return ['auto', 'emergency', 'keepUp', 'off'];
      return ['auto', 'keepUp', 'opener', 'emergency', 'off'];
    case 'shout':
      if (u.policy === 'upkeep') return ['auto', 'off'];
      return ['auto', 'keepUp', 'opener', 'emergency', 'off'];
    case 'curse':
      return ['auto', 'keepUp', 'opener', 'off'];
    case 'summon':
      return u.taunt ? ['auto', 'emergency', 'off'] : ['auto', 'off'];
    case 'blink':
      return u.escape ? ['auto', 'emergency', 'off'] : ['auto', 'off'];
    default:
      return ['auto', 'off'];
  }
}

/** Whether a role takes a condition (`when`): every role but `off`. */
export const takesWhen = (role: SkillRole): boolean => role !== 'off';

/** What the strategy says about one gem (nothing, for a skill no gem gives). */
export function tacticOf(strategy: Strategy | undefined, gemUid: number | null): SkillTactic {
  if (gemUid === null) return {};
  return strategy?.skills?.[String(gemUid)] ?? {};
}

/** The role a skill has: the one set, if it suits the skill, or the default. */
export function roleOf(skill: SkillDef, t: SkillTactic, fallback: SkillRole): SkillRole {
  return t.role && rolesFor(skill).includes(t.role) ? t.role : fallback;
}

/** The entry for one skill, from its tactic and its default role. */
export function entryOf<C>(
  choice: C,
  skill: SkillDef,
  t: SkillTactic,
  fallback: SkillRole,
): RotationEntry<C> {
  const role = roleOf(skill, t, fallback);
  const when = t.when ?? 'any';
  return {
    choice,
    role,
    when,
    every: skill.cooldown === undefined ? t.every : undefined,
    life: t.life ?? EMERGENCY_LIFE,
    isDefault: role === fallback && when === 'any' && t.every === undefined && t.life === undefined,
  };
}

/**
 * The order of the skills: the order the strategy gives, and a skill it does not name (a gem socketed since) where its
 * default order puts it, ahead of the first named skill that comes after it by default.
 */
export function ordered<C>(
  byDefault: RotationEntry<C>[],
  uidOf: (c: C) => number | null,
  order: number[] | undefined,
): RotationEntry<C>[] {
  if (!order || order.length === 0) return byDefault;
  const at = new Map(order.map((uid, i) => [uid, i]));
  const named = byDefault
    .filter((e) => at.has(uidOf(e.choice) ?? -1))
    .sort((a, b) => at.get(uidOf(a.choice)!)! - at.get(uidOf(b.choice)!)!);
  const out = [...named];
  byDefault.forEach((e, i) => {
    if (at.has(uidOf(e.choice) ?? -1)) return;
    // The named skills that come after this one by default: put it before the first of them.
    const later = new Set(byDefault.slice(i + 1).map((x) => x.choice));
    const k = out.findIndex((x) => later.has(x.choice));
    if (k < 0) out.push(e);
    else out.splice(k, 0, e);
  });
  return out;
}
