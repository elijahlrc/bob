import type { CondId, SkillTag } from '../mods/types';

/** Conditions that hold while an aura gem is active, and the gem each needs ("while affected by Herald of Ice"). */
export const AURA_CONDS: [CondId, string][] = [
  ['heraldAsh', 'cinderHerald'],
  ['heraldIce', 'rimeHerald'],
  ['heraldThunder', 'stormHerald'],
  ['heraldAgony', 'sourHerald'],
];

/** Conditions that follow from the weapon held, and the weapon tag each needs. They never change during a fight. */
export const WIELD_CONDS: [CondId, SkillTag][] = [
  ['wieldingStaff', 'staff'],
  ['wieldingBow', 'bow'],
  ['wieldingSword', 'sword'],
  ['wieldingAxe', 'axe'],
  ['wieldingMace', 'mace'],
  ['wieldingDagger', 'dagger'],
  ['wieldingClaw', 'claw'],
  ['wieldingWand', 'wand'],
  ['wieldingSceptre', 'sceptre'],
];
