import { flaskRules, STRATEGY_DEFAULTS } from '../data/strategy';
import { armourReduction } from '../calc/formulas';
import type { FlaskSpec } from '../calc/flasks';
import { lifeCap } from './combat';
import { flasksSealed } from './theft';
import type { World } from './types';
import { livingEnemiesOf } from './side';
import type { Side } from './side';

/** Whether a cleansing flask would clear something on the character now (docs/BOSSES.md 11.2). */
function cleansNow(side: Side, s: FlaskSpec): boolean {
  const p = side.player;
  const a = p.ail;
  return (
    (s.removeBleed && a.bleeds.length > 0) ||
    (s.removePoison && a.poisons.length > 0) ||
    (s.removeIgnite && a.ignites.length > 0) ||
    (s.removeFreeze && (a.freezeT > 0 || a.chill >= 0.2)) ||
    (s.removeShock && a.shockT > 0) ||
    (s.removeCurse && p.hexes.length > 0)
  );
}

/**
 * A blow that cannot be dodged is about to land (a Sentence, docs/BOSSES.md 11.1), and it would take more than the character
 * has: a life flask now, whatever the threshold.
 */
function braceFor(w: World, s: Side): boolean {
  const p = s.player;
  for (const e of w.effects) {
    if (!e.unavoidable || e.t > 0.6 || e.damage <= 0) continue;
    const taken =
      e.dtype === 0
        ? e.damage *
          (1 - Math.min(0.9, armourReduction(p.def.armour, e.damage) + p.def.physReduction))
        : e.damage * (1 - Math.min(p.def.res[e.dtype], p.def.maxRes[e.dtype]) / 100);
    if (p.life + p.es < taken * 1.15) return true;
  }
  return false;
}

/**
 * Automatic flask use (§6.9). Replaceable later by manual input: the sim asks the policy which
 * flask indices to use this tick.
 */
export type FlaskPolicy = (w: World, s: Side) => number[];

export const autoFlaskPolicy: FlaskPolicy = (w, s) => {
  const p = s.player;
  const out: number[] = [];
  // The Unmaker holds them (docs/BOSSES.md 9).
  if (flasksSealed(w)) return out;
  const brace = w.effects.length > 0 && braceFor(w, s);
  const cap = lifeCap(p);
  const manaCap = Math.max(0, p.def.maxMana - s.char.reservedMana);
  // What the Strategy tab sets for each belt slot (thresholds by position unless set).
  const rules = flaskRules(
    s.flasks.map((f) => f.spec.kind),
    s.char.build.strategy,
  );
  let nearbyRare = false;
  let nearbyBoss = false;
  let nearby = 0;
  let nearest = Infinity;
  // The surroundings only matter to a utility flask that could be drunk now: most ticks there is none.
  const wantsSurroundings = s.flasks.some(
    (f) => f.spec.kind === 'utility' && f.activeT <= 0 && f.charges >= f.spec.perUse,
  );
  if (wantsSurroundings) {
    let nearest2 = Infinity;
    for (const m of livingEnemiesOf(w, p.team)) {
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearest2) nearest2 = d2;
      if (d2 > 64) continue;
      nearby++;
      if (m.rarity === 'rare' || m.rarity === 'miniboss' || m.rarity === 'boss') nearbyRare = true;
      if (m.rarity === 'miniboss' || m.rarity === 'boss') nearbyBoss = true;
    }
    nearest = Math.sqrt(nearest2);
  }
  let usedLife = false;
  s.flasks.forEach((f, i) => {
    if (f.charges < f.spec.perUse) return;
    const k = f.spec.kind;
    const rule = rules[i];
    const idle = f.activeT <= 0 && !f.queued;
    // A flask that cleanses is drunk for what it cleanses, as a player would (the reference game's cleansing suffixes).
    const cleanse = f.activeT <= 0 && cleansNow(s, f.spec);
    // Life flasks in belt order, each below its own threshold; one a tick, and one still running does not stop the next
    // (docs/ATTRITION.md: a slow flask first, the last kept for the worst moment).
    if (
      (k === 'life' || k === 'hybrid') &&
      !usedLife &&
      idle &&
      (p.life < cap * (rule.life ?? 0) || brace || cleanse)
    ) {
      out.push(i);
      usedLife = true;
      return;
    }
    // Mana flasks below their own threshold only: regeneration covers a skill that can't be paid for this moment, and a
    // floor at its cost drained casters' flasks (the playtests, docs/ATTRITION.md). A hybrid flask also refills mana: it is
    // drunk for low mana as a mana flask is.
    if ((k === 'mana' || k === 'hybrid') && idle && p.mana < manaCap * (rule.mana ?? 0)) {
      out.push(i);
      return;
    }
    if (k === 'mana' && cleanse) {
      out.push(i);
      return;
    }
    if (k === 'utility' && f.activeT <= 0) {
      if (cleanse) out.push(i);
      else if (f.spec.lifeToEs) {
        // It leaves you at 1 life for two seconds: drink it early, with a fight coming but no enemy
        // close, at nearly full life, and only if the energy shield can hold what comes back.
        const safe =
          nearest > 6 && nearest < 16 && p.life >= cap * 0.9 && p.def.maxEs >= p.life * 0.7;
        if (safe) out.push(i);
      } else {
        const use = rule.use ?? STRATEGY_DEFAULTS.utilityFlask;
        if (
          (use === 'bosses' && nearbyBoss) ||
          (use === 'rares' && nearbyRare) ||
          (use === 'packs' && (nearbyRare || nearby >= 5)) ||
          (use === 'always' && nearby >= 1)
        )
          out.push(i);
      }
    }
  });
  return out;
};
