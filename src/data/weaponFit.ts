import type { SkillTag } from '../mods/types';
import type { ActiveGemDef } from './gems';

/** What the character holds, as a skill's weapon rules ask it (`Character.weaponHold()`). */
export type WeaponHold = {
  tags: ReadonlySet<SkillTag>;
  dualWielding: boolean;
  holdingShield: boolean;
};

type Rules = Pick<
  ActiveGemDef,
  'id' | 'name' | 'requiresWeapon' | 'needsTwoHand' | 'needsDualWield' | 'needsShield'
>;

/**
 * Why the weapons in hand bar a skill ("Rupture Line needs a mace or sceptre or axe or staff"), or null when they do not.
 * The one rule for `Character` (the skill sits unused) and for the early gem picks (a pick the character can use).
 */
export function weaponBar(skill: Rules, hold: WeaponHold): string | null {
  let reason: string | null = null;
  if (skill.requiresWeapon && !skill.requiresWeapon.some((t) => hold.tags.has(t))) {
    const w = skill.requiresWeapon.join(' or ');
    reason = `${skill.name} needs ${/^[aeiou]/.test(w) ? 'an' : 'a'} ${w}`;
  }
  if (skill.needsTwoHand && !hold.tags.has('twoHand'))
    reason = `${skill.name} needs a two-handed weapon`;
  if (skill.needsDualWield && !hold.dualWielding) reason = `${skill.name} needs two weapons`;
  if (skill.needsShield && !hold.holdingShield) reason = `${skill.name} needs a shield`;
  if (skill.id === 'venomCut' && (hold.tags.has('twoHand') || hold.tags.has('bow')))
    reason = `${skill.name} needs a one-handed weapon`;
  return reason;
}
