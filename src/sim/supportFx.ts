import type { SkillChoice } from '../calc/character';
import type { SkillProfile } from '../calc/skill';
import { CHARGE_KINDS } from '../calc/charges';
import { fireEffect } from './actions';
import { gainBuff } from './buffs';
import { chargeEnemy, gainBeamStack, orbAnswers } from './skillFx';
import { shootFrom } from './deploy';
import { spendCharges } from './charges';
import { hit } from './combat';
import { scaleProfile } from './shots';
import type { Action, Actor, World } from './types';

/**
 * What supports do around a use of a skill (docs/SPIRIT.md S13c): a Ruthless Blow every third use, Intensity built by casting, Seals
 * gained while idle and spent by the next cast, the repeats of Multistrike that go to random enemies with one shared critical roll,
 * the strike that hits more than one enemy, the spell that lands before and behind its target, a mirage archer called by a hit, a
 * shockwave called by a melee hit, and the mana counter of Inspiration.
 */

export type Mirage = { key: string; x: number; y: number; t: number; fireT: number };

const INTENSITY_LOSS = 0.25;
const SEAL_MAX = 3;
const MIRAGE_RANGE = 9.3;
const SHOCK_RADIUS = 2.2;

/** What a use of the skill starts as: the profile it is made at, and the multipliers of the repeats that follow. */
export type UseStart = {
  profile: SkillProfile;
  echoes: number;
  echoMult?: number[];
  elem?: number;
};

/** A Ruthless Blow: the melee damage and bleed damage higher, and a stun. */
function ruthlessProfile(p: SkillProfile): SkillProfile {
  const r = p.ruthless!;
  const q = scaleProfile(p, 1 + r.more / 100);
  return {
    ...q,
    hands: q.hands.map((h) => ({
      ...h,
      ailChunks: h.ailChunks.map((c) => ({
        ...c,
        k: [c.k[0], c.k[1] * (1 + r.bleed / 100), c.k[2]] as [number, number, number],
      })),
    })),
    stunFixed: r.stun,
  };
}

/** A use of a skill of the player's is about to begin: the supports decide what it is. */
export function startUse(w: World, a: Actor, p0: SkillProfile): UseStart {
  let p = p0;
  let echoes = 0;
  let echoMult: number[] | undefined;
  if (!a.isPlayer) return { profile: p, echoes };
  const id = p.skill.id;
  // A skill that picks an element for each use has the one chosen before; the next one is chosen now.
  let elem: number | undefined;
  if (p.skill.element) {
    elem = w.elem;
    const choices = [1, 2, 3].filter((x) => !(p.skill.element!.noRepeat && x === elem));
    w.elemLast = elem;
    w.elem = choices[w.rngCombat.int(0, choices.length - 1)];
  }
  if (p.ruthless) {
    const n = (w.uses[id] = (w.uses[id] ?? 0) + 1);
    if (n % 3 === 0) p = ruthlessProfile(p);
  }
  // Every third use freezes as though it dealt much more.
  orbAnswers(w, p);
  // The first skill used after a Phase Run ends its speed; the damage stays a moment.
  if (!p.skill.utility)
    for (const c of w.char.utilities) {
      const u = c.skill.utility;
      if (u?.kind === 'buff' && u.second && w.buffT[u.buff] > 0) {
        w.buffT[u.buff] = 0;
        w.buffT[u.second.buff] = Math.min(w.buffT[u.second.buff], u.second.keep);
      }
    }
  if (p.freezeThird > 0) {
    const n = (w.uses[id] = (w.uses[id] ?? 0) + 1);
    if (n % 3 === 0)
      p = { ...p, freeze: { ...p.freeze, dur: p.freeze.dur * (1 + p.freezeThird / 100) } };
  }
  if (p.intensify) {
    const st = (w.intensity[id] ??= 0);
    w.intensity[id] = Math.min(p.intensify.max, st + 1);
    const n = w.intensity[id];
    const q = scaleProfile(p, Math.pow(1 + p.intensify.more / 100, n));
    p = { ...q, radiusMult: q.radiusMult * Math.pow(1 - p.intensify.area / 100, n) };
  }
  if (p.multistrike) {
    echoMult = [];
    for (let i = 1; i <= p.repeats; i++) echoMult.push(1 + (p.multistrike.ramp * i) / 100);
  }
  if (p.unleash) {
    // The spell spends the seals it gained while idle: each is a repeat, at less damage.
    const s = w.seals[id];
    const n = s ? s.n : 0;
    if (n > 0) {
      s!.n = 0;
      s!.t = 0;
      echoes += n;
      const m = 1 - p.unleash.less / 100;
      echoMult = [...(echoMult ?? []), ...Array.from({ length: n }, () => m)];
    }
  }
  // Inspiration: the mana a supported skill spends is counted, and the charges are lost when it passes the limit.
  if (p.inspire > 0) {
    w.inspireMana += p.cost;
    if (w.inspireMana > p.inspire) {
      w.inspireMana = 0;
      for (const k of CHARGE_KINDS) {
        const n = w.char.charges[k];
        if (n > 0 && k === 'insight') spendCharges(w, k, n);
      }
    }
  }
  return { profile: p, echoes, echoMult, elem };
}

/** The Seals gained while the spell is not cast, the Intensity lost while the character moves, the mirage and the cooldowns. */
export function tickSupports(w: World, dt: number): void {
  const p = w.player;
  const casting = p.action?.profile.skill.id;
  for (const c of w.char.actives) {
    const u = c.usable ? w.char.profile(c, 0).unleash : null;
    if (!u) continue;
    const s = (w.seals[c.skill.id] ??= { n: 0, t: 0 });
    if (casting === c.skill.id || s.n >= SEAL_MAX) continue;
    s.t += dt;
    if (s.t >= u.every) {
      s.t -= u.every;
      s.n++;
    }
  }
  for (const id in w.intensity) {
    if (w.intensity[id] <= 0) continue;
    if (p.moving) {
      w.intensityT[id] = (w.intensityT[id] ?? 0) + dt;
      if (w.intensityT[id] >= INTENSITY_LOSS) {
        w.intensityT[id] -= INTENSITY_LOSS;
        w.intensity[id]--;
      }
    }
  }
  for (const id in w.shockCd) if (w.shockCd[id] > 0) w.shockCd[id] -= dt;
  const m = w.mirage;
  if (m) {
    m.t -= dt;
    m.fireT -= dt;
    if (m.t <= 0) w.mirage = null;
    else if (m.fireT <= 0) mirageShoots(w, m);
  }
}

/** The mirage archer shoots the nearest enemy in reach, with the skill it was called by. */
function mirageShoots(w: World, m: Mirage): void {
  const c = w.char.actives.find((x) => x.key === m.key);
  if (!c) return;
  const prof = w.char.profile(c, 0);
  const spec = prof.mirage;
  if (!spec) return;
  let best: Actor | null = null;
  let bd = MIRAGE_RANGE;
  for (const e of w.actors) {
    if (e.isPlayer || !e.alive || e.phaseT > 0) continue;
    const d = Math.hypot(e.x - m.x, e.y - m.y);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  if (!best) {
    m.fireT = 0.2;
    return;
  }
  shootFrom(w, m.x, m.y, c, best, 1 - spec.less / 100);
  m.fireT = prof.useTime / Math.max(0.05, 1 - spec.slow / 100);
}

/** After a hit of the player's lands: a mirage archer is called, a shockwave goes off. */
export function afterPlayerHit(w: World, dst: Actor, p: SkillProfile): void {
  // A skill whose hit gives the character a buff (Smite).
  if (p.skill.hitBuff && !p.skill.tags.includes('triggered')) gainBuff(w, p.skill.hitBuff.buff);
  if (!w.inFx) {
    if (p.skill.beams) gainBeamStack(w, p);
    if (p.skill.charge) chargeEnemy(w, dst, p);
  }
  if (p.mirage && !w.mirage && p.isAttack && dst.alive) {
    const c = w.char.actives.find((x) => x.skill.id === p.skill.id);
    if (c)
      w.mirage = {
        key: c.key,
        x: w.player.x,
        y: w.player.y,
        t: p.mirage.seconds,
        fireT: 0.2,
      };
  }
  if (p.shockwave && !w.inShock && p.skill.behaviour.kind === 'melee') {
    const id = p.skill.id;
    if ((w.shockCd[id] ?? 0) > 0) return;
    const c = w.char.actives.find((x) => x.skill.id === id);
    if (!c) return;
    w.shockCd[id] = p.shockwave.cooldown;
    // An attack of its own around the enemy that was hit: a share of the base attack damage, whatever the hit was.
    const base = Math.max(1, p.skill.baseMult);
    const q = scaleProfile(p, p.shockwave.mult / base);
    w.inShock = true;
    w.events.push({ t: 'explode', x: dst.x, y: dst.y, r: SHOCK_RADIUS * p.radiusMult, dtype: 0 });
    for (const e of w.actors)
      if (
        !e.isPlayer &&
        e.alive &&
        e !== dst &&
        Math.hypot(e.x - dst.x, e.y - dst.y) <= SHOCK_RADIUS * p.radiusMult + e.r
      )
        hit(w, w.player, e, q, 0, Math.hypot(e.x - w.player.x, e.y - w.player.y));
    w.inShock = false;
  }
}

/** A strike that hits more than one enemy at once: the others near it take the same blow, with the critical roll of the first. */
export function extraStrikes(w: World, a: Actor, act: Action, target: Actor): void {
  const p = act.profile;
  if (p.extraTargets <= 0 || !a.isPlayer) return;
  const b = p.skill.behaviour;
  const reach = (b.kind === 'melee' ? b.range : 1.6) + p.rangeBonus + 2.4;
  const others = w.actors
    .filter(
      (e) =>
        !e.isPlayer &&
        e.alive &&
        e !== target &&
        e.phaseT <= 0 &&
        Math.hypot(e.x - a.x, e.y - a.y) <= reach + e.r,
    )
    .sort((x, y) => Math.hypot(x.x - a.x, x.y - a.y) - Math.hypot(y.x - a.x, y.y - a.y));
  w.critLock = w.critSeen;
  for (const e of others.slice(0, p.extraTargets))
    hit(w, a, e, p, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
  w.critLock = null;
}

/** The areas before and behind the target of a spell that cascades: the effect is fired again at each. */
export function cascadeCast(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  if (!p.cascade || !a.isPlayer) return;
  const b = p.skill.behaviour;
  const r = (b.kind === 'burst' || b.kind === 'ground' ? b.radius : 2) * p.radiusMult;
  const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
  for (const side of [-1, 1]) {
    const x = act.aimX + Math.cos(ang) * r * 1.4 * side;
    const y = act.aimY + Math.sin(ang) * r * 1.4 * side;
    const spot = w.grid.collide(x, y, 0.3);
    fireEffect(w, a, { ...act, aimX: spot.x, aimY: spot.y, which: 'channelled' });
  }
}

/** The target of a repeat of Multistrike: a random enemy in reach, or the place where the character is. */
export function repeatTarget(w: World, a: Actor, act: Action): Actor | undefined {
  const p = act.profile;
  if (!p.multistrike || !a.isPlayer) return undefined;
  const b = p.skill.behaviour;
  const reach = (b.kind === 'melee' ? b.range : 1.6) + p.rangeBonus + 1.2;
  const near = w.actors.filter(
    (e) =>
      !e.isPlayer && e.alive && e.phaseT <= 0 && Math.hypot(e.x - a.x, e.y - a.y) <= reach + e.r,
  );
  return near.length ? near[w.rngCombat.int(0, near.length - 1)] : undefined;
}

export type { SkillChoice };
