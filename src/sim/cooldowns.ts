import type { SkillChoice } from '../calc/character';
import { spendCharges } from './charges';
import type { World } from './types';

/**
 * Skills with a cooldown of their own (docs/SPIRIT.md S2). A skill holds up to `cooldownUses` uses (one by default); using
 * one starts a timer, and when it runs out a use is regained and, if the skill is still short of its maximum, the timer
 * starts again. A skill that names a `bypass` can be used with no use left by spending that many charges, which is the
 * reference game's "the cooldown can be bypassed by expending a charge".
 */

/** The seconds a use takes to come back, with the character's cooldown recovery. */
export function cooldownSeconds(w: World, c: SkillChoice): number {
  return (c.skill.cooldown ?? 0) / Math.max(0.1, w.char.db.mult('cooldownRecovery'));
}

const maxUses = (c: SkillChoice) => c.skill.cooldownUses ?? 1;

/** The uses a skill with a cooldown holds now (a skill without one always holds one). */
export function usesHeld(w: World, c: SkillChoice): number {
  if (c.skill.cooldown === undefined) return 1;
  return w.cooldowns[c.key]?.uses ?? maxUses(c);
}

/** Whether the character holds the charges that skip the cooldown. */
export function canBypass(w: World, c: SkillChoice): boolean {
  const b = c.skill.bypass;
  return !!b && w.char.charges[b.charge] >= b.n;
}

/** Whether the skill can be used now: a use is held, or charges can pay for one. */
export function offCooldown(w: World, c: SkillChoice): boolean {
  return c.skill.cooldown === undefined || usesHeld(w, c) > 0 || canBypass(w, c);
}

/** Whether the character holds what a charge-spending skill waits for (it is no use with nothing to spend). */
export function hasChargesToSpend(w: World, c: SkillChoice): boolean {
  const need = c.skill.consumeCharges;
  if (!need) return true;
  const held = w.char.charges;
  return held.grit + held.fervour + held.insight >= need.min;
}

/** Whether the character can use the skill now: off cooldown, and holding what it spends. */
export function skillReady(w: World, c: SkillChoice): boolean {
  return offCooldown(w, c) && hasChargesToSpend(w, c);
}

/** The skill is used: take a use, or spend the charges that stand in for one. */
export function useSkill(w: World, c: SkillChoice): void {
  if (c.skill.cooldown === undefined) return;
  const st = (w.cooldowns[c.key] ??= { uses: maxUses(c), t: 0 });
  if (st.uses > 0) {
    st.uses--;
    if (st.t <= 0) st.t = cooldownSeconds(w, c);
  } else if (c.skill.bypass) spendCharges(w, c.skill.bypass.charge, c.skill.bypass.n);
  // The skill bar counts a skill that waits down the way it counts a secondary.
  w.secondaryReady[c.key] = st.uses > 0 ? 0 : w.t + st.t;
}

/** Run the cooldowns down: a use comes back when its timer ends. */
export function tickCooldowns(w: World, dt: number): void {
  for (const key in w.cooldowns) {
    const st = w.cooldowns[key];
    if (st.t <= 0) continue;
    st.t -= dt;
    if (st.t > 0) continue;
    const c = w.char.actives.find((x) => x.key === key);
    const max = c ? maxUses(c) : 1;
    st.uses = Math.min(max, st.uses + 1);
    st.t = st.uses < max && c ? cooldownSeconds(w, c) : 0;
    w.secondaryReady[key] = st.uses > 0 ? 0 : w.t + st.t;
  }
}
