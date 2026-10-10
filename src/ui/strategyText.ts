import { skillRange, type Character, type SkillChoice } from '../calc/character';
import type { RotationEntry } from '../calc/strategy';
import type { SkillWhen } from '../data/strategy';

/** The plain-language lines of the Strategy tab: what the character does with each skill. */

const pct = (v: number) => `${Math.round(v * 100)}%`;
const secs = (v: number) => `${Math.round(v * 10) / 10} s`;

const WHEN_SUFFIX: Record<SkillWhen, string> = {
  any: '',
  pack: ', with 3 or more enemies near',
  single: ', with fewer than 3 enemies near',
  rare: ', against rares and bosses',
  boss: ', against champions and bosses',
};

/** What a utility skill's own judgement (the `auto` role) does. */
function autoText(c: SkillChoice): string {
  const u = c.skill.utility!;
  switch (u.kind) {
    case 'buff':
      if (u.banner) return 'Carried, then planted when a fight is on';
      if (u.policy === 'guard') return 'When life falls below 60% (one guard at a time)';
      if (u.rage) return 'When there is rage enough to start it';
      if (u.second) return 'When hurt with an enemy near, or with 3 or more enemies close';
      if (u.policy === 'rally') return 'With a pack (3 or more) or a rare near';
      return 'Kept up while an enemy is near';
    case 'shout':
      return u.policy === 'upkeep'
        ? 'While an enemy is within its radius'
        : 'With a pack or a rare within its radius';
    case 'curse':
      return 'On packs and rares, and on enemies above half life';
    case 'offering':
      return 'When there are corpses near and minions to empower';
    case 'summon':
      if (u.taunt) return 'When a pack closes in, a rare appears, or life is below 70%';
      return u.corpse ? 'Kept at full count, from corpses near' : 'Kept at full count';
    case 'blink':
      return u.escape
        ? 'To get away: when hurt with an enemy near, or crowded'
        : 'To close the gap to a target out of reach, or to burst on a pack';
  }
}

/** What keeping a skill up means for its kind. */
function keepUpText(c: SkillChoice): string {
  const u = c.skill.utility;
  if (!u) return 'Cast again when its debuff on the target runs low';
  switch (u.kind) {
    case 'buff':
      return 'Kept up whenever an enemy is near';
    case 'shout':
      return 'Whenever ready, with an enemy within its radius';
    case 'curse':
      return 'Kept on the target, whatever the enemy';
    default:
      return 'Kept going';
  }
}

/** One line on what the character does with a skill. */
export function describeEntry(ch: Character, e: RotationEntry<SkillChoice>): string {
  const c = e.choice;
  const when = WHEN_SUFFIX[e.when];
  switch (e.role) {
    case 'off':
      return 'Never used';
    case 'main':
      return `Used whenever no skill above is called for${when}`;
    case 'opener':
      return `Once at the start of each fight, and once on each rare or boss${when}`;
    case 'emergency':
      return `When life falls below ${pct(e.life)}${when}`;
    case 'keepUp':
      return keepUpText(c) + when;
    case 'auto':
      return autoText(c) + when;
    case 'periodic': {
      const own = c.skill.cooldown !== undefined;
      const base = own
        ? `Whenever its cooldown allows (every ${secs(ch.cooldownOf(c))})`
        : `Every ${secs(ch.cooldownOf(c))}`;
      const short =
        skillRange(ch.profile(c, ch.configConds)) <
        skillRange(ch.profile(ch.primary, ch.configConds)) - 0.05;
      return (
        base +
        when +
        (short ? '; less reach than the main skill, so only when an enemy is within it' : '')
      );
    }
  }
}

/** A warning about the main skills, if any: a kind of fight in which none of them fits, so the weapon is used. */
export function mainsWarning(ch: Character): string | null {
  if (ch.mains.length === 0)
    return 'No main skill: the character fights with its weapon between other skills.';
  if (ch.mains.some((e) => e.when === 'any')) return null;
  const covers = (f: (w: SkillWhen) => boolean) => ch.mains.some((e) => f(e.when));
  const pack = covers((w) => w === 'pack');
  const few = covers((w) => w === 'single');
  if (pack && few) return null;
  return pack
    ? 'With fewer than 3 enemies near and no main skill for that, the character uses its weapon.'
    : few
      ? 'With 3 or more enemies near and no main skill for that, the character uses its weapon.'
      : 'Against normal and magic enemies no main skill fits: the character uses its weapon.';
}
