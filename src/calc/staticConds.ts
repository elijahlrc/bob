import type { CondId, SkillTag } from '../mods/types';

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
