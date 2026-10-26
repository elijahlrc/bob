import type { SkillProfile } from '../calc/skill';
import { actorById, carryToward, fireEffect } from './actions';
import { moveMult } from './factions';
import { orbUse, releaseGhost, releaseZaps } from './fields';
import { scaleProfile } from './shots';
import { scatterSpores } from './skillFx';
import type { Action, Actor, World } from './types';
import { livingEnemiesOf } from './side';
import type { Side } from './side';

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
  /** When it began. */
  startT: number;
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
  const st = a.side!.channel;
  if (!st) return;
  a.side!.channel = null;
  const spec = st.profile.skill.channel;
  if (st.profile.skill.orb?.kind === 'zap') releaseZaps(w, a.side!, st.profile.skill.id);
  if (st.profile.skill.orb?.kind === 'illusion')
    releaseGhost(w, a.side!, st.profile.skill.id, false);
  if (!spec?.release || st.stage <= 0) return;
  const r = spec.release;
  const f = Math.max(0, 1 + (r.base ?? 0) / 100 + (r.perStage * st.stage) / 100);
  let p = scaleProfile(st.profile, f);
  p = grown(p, (r.radiusPerStage ?? 0) * st.stage);
  if (r.behaviour) p = { ...p, skill: { ...p.skill, behaviour: r.behaviour } };
  if (r.ignite !== undefined) {
    const more = 1 + r.ignite / 100;
    p = {
      ...p,
      ignite: { ...p.ignite, chance: 1 },
      hands: p.hands.map((h) => ({
        ...h,
        ailChunks: h.ailChunks.map((c) => ({
          ...c,
          k: [c.k[0] * more, c.k[1], c.k[2]] as [number, number, number],
        })),
      })),
    };
  }
  if (r.repeat) {
    // One extra strike for each stage built, each at the full bonus (Flurry of Edges).
    const q = scaleProfile(st.profile, 1 + ((spec.perStage ?? 0) * spec.cap) / 100);
    for (let i = 0; i < st.stage; i++) fireEffect(w, a, actFrom(st, q));
    return;
  }
  fireEffect(w, a, actFrom(st, p));
  if (st.profile.skill.sporePods) scatterSpores(w, a, actFrom(st, p), st.stage);
}

/** A channelled skill is used: build a stage, hit if it hits as it goes, and release at the cap. */
export function channelUse(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.channel!;
  let st = a.side!.channel;
  if (st && (st.key !== p.skill.id || w.t - st.lastT > LULL)) {
    releaseChannel(w, a);
    st = null;
  }
  if (!st) {
    st = {
      key: p.skill.id,
      stage: 0,
      lastT: w.t,
      startT: w.t,
      profile: p,
      hand: act.hand,
      targetId: act.targetId,
      aimX: act.aimX,
      aimY: act.aimY,
    };
    a.side!.channel = st;
  }
  st.profile = p;
  st.targetId = act.targetId;
  st.aimX = act.aimX;
  st.aimY = act.aimY;
  st.lastT = w.t;
  // A spin that travels (Twister Blade) closes in on its target as it goes, at the character's walking pace: it does not stop to chase.
  const target = p.skill.travel ? actorById(w, act.targetId) : undefined;
  if (target?.alive) {
    const pace = a.def.moveSpeed * (1 - a.ail.chill) * moveMult(a) * p.useTime;
    carryToward(w, a, p, act, target, Math.min(p.skill.travel!, pace), true);
  }
  if (spec.tick) {
    // The first use of Twister Blade hits for half; each stage built makes the hit of Flurry of Edges and Blaze Stream harder.
    const base = st.stage === 0 && spec.first !== undefined ? spec.first / 100 : 1;
    const f = base * ((spec.tickMult ?? 100) / 100) * (1 + ((spec.perStage ?? 0) * st.stage) / 100);
    let q = scaleProfile(p, f);
    q = grown(q, (spec.tickRadiusPerStage ?? 0) * st.stage);
    const b = p.skill.behaviour;
    const ringed = b.kind === 'burst' && b.origin === 'self' && !b.arc;
    fireEffect(w, a, { ...act, profile: q, which: 'channelled', ringed });
  }
  // Stages also come from hits: a crowd charges the skill faster (Judgement Tempest).
  let gain = 1;
  if (spec.crowdStage) {
    let near = 0;
    for (const e of livingEnemiesOf(w, a.team))
      if (Math.hypot(e.x - a.x, e.y - a.y) <= spec.crowdStage.radius) near++;
    if (near >= spec.crowdStage.min) gain += 1;
  }
  // A tick that hits a rare or unique enemy builds more.
  if (spec.uniqueStage) {
    const b = p.skill.behaviour;
    const r = (b.kind === 'burst' ? b.radius : 2) * p.radiusMult;
    for (const e of livingEnemiesOf(w, a.team))
      if (
        e.rarity !== 'normal' &&
        e.rarity !== 'magic' &&
        Math.hypot(e.x - a.x, e.y - a.y) <= r + e.r
      )
        gain += spec.uniqueStage;
  }
  st.stage = Math.min(spec.cap, st.stage + gain);
  if (p.skill.orb) orbUse(w, a, act, st.stage);
  // An orb keeps being fed at the cap, and so does a channel with nothing to release or one that is held (Twister Blade just keeps its
  // stages and spins on; Blaze Stream keeps burning and sends its last wave when the fight pauses); the others (and an illusion at
  // its last stage) are let go.
  const letGo = p.skill.orb ? p.skill.orb.kind === 'illusion' : !!spec.release && !spec.hold;
  if (letGo && st.stage >= spec.cap) releaseChannel(w, a);
}

export type StackState = { key: string; n: number; lastHit: number; fadeT: number };

/** A skill that grows with use (Sweeping Cut): its area follows the stages built, and a use that hits builds another. */
export function stackedUse(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const spec = p.skill.stacks!;
  let st = a.side!.stacks;
  if (!st || st.key !== p.skill.id)
    st = a.side!.stacks = { key: p.skill.id, n: 0, lastHit: w.t, fadeT: 0 };
  const before = a.side!.hitsLanded;
  const q = grown(p, spec.areaPer * st.n);
  fireEffect(w, a, { ...act, profile: q, which: 'channelled' });
  if (a.side!.hitsLanded > before) {
    st.n = Math.min(spec.cap, st.n + 1);
    st.lastHit = w.t;
    st.fadeT = 0;
  }
}

/** Every step: a channel that has gone quiet is released; a stun breaks it. */
export function tickChannel(w: World, s: Side): void {
  const sk = s.stacks;
  if (sk && sk.n > 0) {
    // With nothing hit for a while the stages go, one at a time.
    const fade = s.char.primary.skill.stacks?.fadeAfter ?? 3;
    if (w.t - sk.lastHit > fade) {
      sk.fadeT += 1 / 60;
      if (sk.fadeT >= 1) {
        sk.n--;
        sk.fadeT = 0;
      }
    }
  }
  const st = s.channel;
  // Infusion: after channelling a while it is held; it stays six seconds after the channel is over.
  if (s.infusing) {
    if (!st || st.key !== s.infusing) {
      s.buffT.infusion = 6;
      s.infusing = null;
    } else s.buffT.infusion = 6;
  }
  if (!st) return;
  const p = s.player;
  if (st.profile.infuse && !s.infusing && w.t - st.startT >= st.profile.infuse.after) {
    s.infusing = st.key;
    s.buffT.infusion = 6;
  }
  if (p.stunT > 0 || p.ail.freezeT > 0) {
    // Stunned or frozen, the stages are lost, and the orbs of a storm are let go.
    if (st.profile.skill.orb?.kind === 'zap') releaseZaps(w, s, st.profile.skill.id);
    if (st.profile.skill.orb?.kind === 'illusion') releaseGhost(w, s, st.profile.skill.id, true);
    s.channel = null;
    return;
  }
  if (w.t - st.lastT > LULL) releaseChannel(w, p);
}
