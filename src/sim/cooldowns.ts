import type { SkillChoice } from '../calc/character';
import { levelValue } from '../calc/gems';
import { spendCharges } from './charges';
import type { World } from './types';
import type { Side } from './side';

/**
 * Skills with a cooldown of their own (docs/SPIRIT.md S2). A skill holds up to `cooldownUses` uses (one by default); using
 * one starts a timer, and when it runs out a use is regained and, if the skill is still short of its maximum, the timer
 * starts again. A skill that names a `bypass` can be used with no use left by spending that many charges, which is the
 * reference game's "the cooldown can be bypassed by expending a charge".
 */

/** The seconds a use takes to come back, with the character's cooldown recovery. */
export function cooldownSeconds(s: Side, c: SkillChoice): number {
  return (c.skill.cooldown ?? 0) / Math.max(0.1, s.char.profile(c, 0).cooldownRecovery);
}

const maxUses = (c: SkillChoice) => c.skill.cooldownUses ?? 1;

/** The uses a skill with a cooldown holds now (a skill without one always holds one). */
export function usesHeld(s: Side, c: SkillChoice): number {
  if (c.skill.cooldown === undefined) return 1;
  return s.cooldowns[c.key]?.uses ?? maxUses(c);
}

/** Whether the character holds the charges that skip the cooldown. */
export function canBypass(s: Side, c: SkillChoice): boolean {
  const b = c.skill.bypass;
  return !!b && s.char.charges[b.charge] >= b.n;
}

/** Whether the skill can be used now: a use is held, or charges can pay for one. */
export function offCooldown(s: Side, c: SkillChoice): boolean {
  return c.skill.cooldown === undefined || usesHeld(s, c) > 0 || canBypass(s, c);
}

/** Whether the character holds what a charge-spending skill waits for (it is no use with nothing to spend). */
export function hasChargesToSpend(s: Side, c: SkillChoice): boolean {
  const need = c.skill.consumeCharges;
  if (!need) return true;
  const held = s.char.charges;
  return held.grit + held.fervour + held.insight >= need.min;
}

/** Whether the character can use the skill now: off cooldown, and holding what it spends. */
export function skillReady(s: Side, c: SkillChoice): boolean {
  return offCooldown(s, c) && hasChargesToSpend(s, c);
}

/** The skill is used: take a use, or spend the charges that stand in for one. */
export function useSkill(w: World, s: Side, c: SkillChoice): void {
  if (c.skill.cooldown === undefined) return;
  const st = (s.cooldowns[c.key] ??= { uses: maxUses(c), t: 0 });
  if (st.uses > 0) {
    st.uses--;
    if (st.t <= 0) st.t = cooldownSeconds(s, c);
  } else if (c.skill.bypass) spendCharges(w, s, c.skill.bypass.charge, c.skill.bypass.n);
  // The skill bar counts a skill that waits down the way it counts a secondary.
  s.secondaryReady[c.key] = st.uses > 0 ? 0 : w.t + st.t;
}

/** How much faster a cooldown runs for the enemies near the character (Frostblink: a little for each, a lot for a rare one). */
function recoverRate(w: World, s: Side, c: SkillChoice): number {
  const r = c.skill.recoverNear;
  if (!r) return 1;
  const p = s.player;
  let more = 0;
  for (const e of w.actors) {
    if (e.isPlayer || !e.alive || Math.hypot(e.x - p.x, e.y - p.y) > r.radius + e.r) continue;
    const big = e.rarity === 'rare' || e.rarity === 'miniboss' || e.rarity === 'boss';
    more += levelValue(big ? r.rare : r.normal, c.skill.level);
  }
  return 1 + more / 100;
}

/** Run the cooldowns down: a use comes back when its timer ends. */
export function tickCooldowns(w: World, s: Side, dt: number): void {
  for (const key in s.cooldowns) {
    const st = s.cooldowns[key];
    if (st.t <= 0) continue;
    const c0 = s.char.actives.find((x) => x.key === key);
    // A cooldown that waits out a buff (Withering Step) does not run while it lasts.
    if (c0?.skill.pausedBy && s.buffT[c0.skill.pausedBy] > 0) continue;
    st.t -= dt * (c0 ? recoverRate(w, s, c0) : 1);
    if (st.t > 0) continue;
    const c = s.char.actives.find((x) => x.key === key);
    const max = c ? maxUses(c) : 1;
    st.uses = Math.min(max, st.uses + 1);
    st.t = st.uses < max && c ? cooldownSeconds(s, c) : 0;
    s.secondaryReady[key] = st.uses > 0 ? 0 : w.t + st.t;
  }
}
