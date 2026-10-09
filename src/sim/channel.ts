import type { SkillProfile } from '../calc/skill';
import { fireEffect } from './actions';
import { orbUse, releaseZaps } from './fields';
import { scaleProfile } from './shots';
import type { Action, Actor, World } from './types';

/**
 * Channelling (docs/SPIRIT.md S5). A channelled skill is used again and again while there is something to hit; each use pays its
 * mana, builds a stage and, if the skill hits as it goes, hits harder for the stages already built. When the channel ends (the
 * stage cap, the target gone, a stun, a lull) it is released: one blast, one beam, one volley of extra strikes, with the stages
 * behind it. The character holds the key as long as a good player would and lets go when there is nothing left to hit.
 */

export type ChannelState = {
  key: string;
  stage: number;
  /** When the skill was last used, and what it was aimed at. */
  lastT: number;
  profile: SkillProfile;
  hand: number;
  targetId: number;
  aimX: number;
  aimY: number;
};

/** A lull this long ends the channel. */
const LULL = 0.9;

function actFrom(st: ChannelState, profile: SkillProfile): Action {
  return {
    profile,
    which: 'channelled',
    hand: st.hand,
    duration: 0,
    elapsed: 0,
    fired: true,
    echoes: 0,
    targetId: st.targetId,
    aimX: st.aimX,
    aimY: st.aimY,
  };
}

/** The skill's profile with the area (radius, or beam length) grown by a share. */
function grown(p: SkillProfile, share: number): SkillProfile {
  return share === 0 ? p : { ...p, radiusMult: p.radiusMult * (1 + share / 100) };
}

/** Let go: fire what the stages built, once, and start again from nothing. */
export function releaseChannel(w: World, a: Actor): void {
  const st = w.channel;
  if (!st) return;
  w.channel = null;
  const spec = st.profile.skill.channel;
  if (st.profile.skill.orb?.kind === 'zap') releaseZaps(w, st.profile.skill.id);
  if (!spec?.release || st.stage <= 0) return;
  const r = spec.release;
  const f = Math.max(0, 1 + (r.base ?? 0) / 100 + (r.perStage * st.stage) / 100);
  let p = scaleProfile(st.profile, f);
  p = grown(p, (r.radiusPerStage ?? 0) * st.stage);
  if (r.behaviour) p = { ...p, skill: { ...p.skill, behaviour: r.behaviour } };
  if (r.repeat) {
    // One extra strike for each stage built, each at the full bonus (Blade Flurry).
    const q = scaleProfile(st.profile, 1 + ((spec.perStage ?? 0) * spec.cap) / 100);
    for (let i = 0; i < st.stage; i++) fireEffect(w, a, actFrom(st, q));
    return;
  }
  fireEffect(w, a, actFrom(st, p));
}

/** A channelled skill is used: build a stage, hit if it hits as it goes, and release at the cap. */
export function channelUse(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.channel!;
  let st = w.channel;
  if (st && (st.key !== p.skill.id || w.t - st.lastT > LULL)) {
    releaseChannel(w, a);
    st = null;
  }
  if (!st) {
    st = {
      key: p.skill.id,
      stage: 0,
      lastT: w.t,
      profile: p,
      hand: act.hand,
      targetId: act.targetId,
      aimX: act.aimX,
      aimY: act.aimY,
    };
    w.channel = st;
  }
  st.profile = p;
  st.targetId = act.targetId;
  st.aimX = act.aimX;
  st.aimY = act.aimY;
  st.lastT = w.t;
  if (spec.tick) {
    // The first use of Cyclone hits for half; each stage built makes the hit of Blade Flurry and Incinerate harder.
    const base = st.stage === 0 && spec.first !== undefined ? spec.first / 100 : 1;
    const f = base * ((spec.tickMult ?? 100) / 100) * (1 + ((spec.perStage ?? 0) * st.stage) / 100);
    let q = scaleProfile(p, f);
    q = grown(q, (spec.tickRadiusPerStage ?? 0) * st.stage);
    fireEffect(w, a, { ...act, profile: q, which: 'channelled' });
  }
  // Stages also come from hits: a crowd charges the skill faster (Divine Ire).
  let gain = 1;
  if (spec.crowdStage) {
    let near = 0;
    for (const e of w.actors)
      if (!e.isPlayer && e.alive && Math.hypot(e.x - a.x, e.y - a.y) <= spec.crowdStage.radius)
        near++;
    if (near >= spec.crowdStage.min) gain += 1;
  }
  st.stage = Math.min(spec.cap, st.stage + gain);
  if (p.skill.orb) orbUse(w, a, act, st.stage);
  // An orb keeps being fed at the cap; the others are let go.
  else if (st.stage >= spec.cap) releaseChannel(w, a);
}

export type StackState = { key: string; n: number; lastHit: number; fadeT: number };

/** A skill that grows with use (Reave): its area follows the stages built, and a use that hits builds another. */
export function stackedUse(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.stacks!;
  let st = w.stacks;
  if (!st || st.key !== p.skill.id)
    st = w.stacks = { key: p.skill.id, n: 0, lastHit: w.t, fadeT: 0 };
  const before = w.hitsLanded;
  const q = grown(p, spec.areaPer * st.n);
  fireEffect(w, a, { ...act, profile: q, which: 'channelled' });
  if (w.hitsLanded > before) {
    st.n = Math.min(spec.cap, st.n + 1);
    st.lastHit = w.t;
    st.fadeT = 0;
  }
}

/** Every step: a channel that has gone quiet is released; a stun breaks it. */
export function tickChannel(w: World): void {
  const sk = w.stacks;
  if (sk && sk.n > 0) {
    // With nothing hit for a while the stages go, one at a time.
    const fade = w.char.primary.skill.stacks?.fadeAfter ?? 3;
    if (w.t - sk.lastHit > fade) {
      sk.fadeT += 1 / 60;
      if (sk.fadeT >= 1) {
        sk.n--;
        sk.fadeT = 0;
      }
    }
  }
  const st = w.channel;
  if (!st) return;
  const p = w.player;
  if (p.stunT > 0 || p.ail.freezeT > 0) {
    // Stunned or frozen, the stages are lost, and the orbs of a storm are let go.
    if (st.profile.skill.orb?.kind === 'zap') releaseZaps(w, st.profile.skill.id);
    w.channel = null;
    return;
  }
  if (w.t - st.lastT > LULL) releaseChannel(w, p);
}
