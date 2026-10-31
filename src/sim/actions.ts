import { angleDiff } from '../core/math';
import { MONSTER_TYPES } from '../data/monsters';
import { BLOCK_WINDOW, ECHO_GAP, HIT_AT, SHOT_ALERT } from '../data/constants';
import type { SkillProfile } from '../calc/skill';
import { firstMoreOf } from '../calc/skill';
import { fallOf, profileElement } from '../calc/skillLook';
import { areaPace } from '../calc/monster';
import { rollGains } from './buffs';
import { CHARGE_KINDS } from '../calc/charges';
import { rollCharges, spendCharges } from './charges';
import { hit, monsterHitOf } from './combat';
import { openZone, pullPlayer, registerBlast, shieldBlocks, speedMult } from './factions';
import { fireTriggers } from './triggers';
import { placeDeployable } from './deploy';
import { plantRain, pulseRain } from './rain';
import { channelUse, stackedUse } from './channel';
import { leaveGround, placeCrystal, placeGeyser, placePods, raiseWall } from './fields';
import { scaleProfile } from './shots';
import {
  afterProjectileHit,
  afterStrike,
  bounceLob,
  changeForm,
  coneBurst,
  fireProjectiles,
  projectileLanded,
  releaseCaught,
} from './shots';
import { catchProjectile, skillUsed } from './blinks';
import { placeStanceStorm } from './stances';
import { areaRadiusOf, repeatSpot } from './spread';
import { cascadeCast, extraStrikes, repeatTarget, startUse } from './supportFx';
import {
  addBlade,
  fireVolleys,
  leaveCreeping,
  lineWave,
  novaOnBolts,
  placeMarker,
  placeOrb,
  projectileFx,
  stickArrow,
} from './skillFx';
import { applyUtility } from './utility';
import { castPattern } from './blasts';
import type { Action, Actor, Projectile, World } from './types';
import { foeMinions, hunted, livingEnemiesOf } from './side';
import type { Side } from './side';

/** Begin an action (attack or cast). The previous action's overflow time carries over. */
export function startAction(
  w: World,
  a: Actor,
  which: Action['which'],
  p: SkillProfile,
  target: Actor,
): void {
  // What the supports make of this use: a Ruthless Blow, Intensity, the Seals spent as repeats.
  const started = startUse(w, a, p);
  // A fraction of a repeat is a chance to fire again (The Echoing Word, relic 19), rolled for this use.
  const whole = Math.floor(started.profile.repeats);
  const extra =
    started.profile.repeats > whole && w.rngTrig.chance(started.profile.repeats - whole) ? 1 : 0;
  p =
    started.echoes > 0 || extra > 0 || whole !== started.profile.repeats
      ? { ...started.profile, repeats: whole + extra + started.echoes }
      : started.profile;
  const n = p.hands.length;
  const hand = n > 1 ? a.handIdx % n : 0;
  let duration = p.isAttack && n > 1 && !p.bothHands ? p.hands[hand].time : p.useTime;
  // A monster that strikes in a rhythm: each blow takes a share of the usual time and carries the same share of the damage.
  a.rhythm.patMult = 1;
  if (a.mon) {
    const pat = MONSTER_TYPES[a.mon.spec.type].pattern;
    if (pat) {
      a.rhythm.patMult = pat[a.rhythm.beat % pat.length];
      a.rhythm.beat++;
      duration *= a.rhythm.patMult;
    }
    // An area blow is followed by a rest (AREA_PACE): the wind-up and its warning are as they were, the next blow comes later.
    if (p.skill.id === `monster_${a.mon.spec.type}`)
      a.rhythm.restT = duration * (areaPace(a.mon.spec) - 1);
  }
  a.action = {
    profile: p,
    which,
    hand,
    duration,
    elapsed: a.carry,
    fired: false,
    echoes: 0,
    echoMult: started.echoMult,
    elem: started.elem,
    targetId: target.id,
    aimX: target.x,
    aimY: target.y,
  };
  a.carry = 0;
  a.facing = Math.atan2(target.y - a.y, target.x - a.x);
  if (!a.isPlayer) {
    // A monster that strikes is seen, even a veiled one, and its movement style takes the cue (docs/ROSTER.md 6.3).
    a.mv.attacked = true;
    a.revealT = 1.5;
  }
  w.events.push({ t: 'use', src: a.id, skill: p.skill.id });
  if (a.isPlayer) skillUsed(a.side!, p.skill.id);
  if (a.isPlayer && p.isAttack) fireTriggers(w, a.side!, { on: 'attack', target, tags: p.tagMask });
  // Using a skill can grant a buff of its own (Blinking Cut's burst of speed).
  if (a.isPlayer) {
    rollGains(w, a.side!, 'use', p.gains);
    rollCharges(w, a.side!, 'use', p.gains);
  }
  if (a.isPlayer && !p.isAttack) {
    fireTriggers(w, a.side!, { on: 'cast', target, tags: p.tagMask });
    rollGains(w, a.side!, 'cast', p.gains);
    rollCharges(w, a.side!, 'cast', p.gains);
  }
  // Fighting is noisy: idle monsters nearby come running even if they have not seen the player.
  if (a.isPlayer)
    for (const m of w.actors)
      if (
        !m.isPlayer &&
        m.alive &&
        m.state === 'idle' &&
        Math.hypot(m.x - a.x, m.y - a.y) <= SHOT_ALERT
      ) {
        m.state = 'chase';
        m.lostT = 0;
      }
}

/**
 * Aim angle of arrow `i` of an `n`-arrow fan. With an even count a symmetric fan has no arrow on the aim
 * line, and every arrow can pass either side of a small target at range, so the fan is shifted by half a
 * step (alternating sides) to keep one arrow flying true.
 */
export function fanAngle(base: number, i: number, n: number, step: number, tick: number): number {
  const centre = (n - 1) / 2 + (n % 2 === 0 ? (tick % 2 === 0 ? 0.5 : -0.5) : 0);
  return base + (i - centre) * step;
}

export function actorById(w: World, id: number): Actor | undefined {
  // Actors are stored in id order for monsters spawned at map start; summons append.
  for (const a of w.actors) if (a.id === id) return a;
  for (const s of w.sides) for (const m of s.minions) if (m.id === id) return m;
  return undefined;
}

/**
 * When the next echo lands: a share of the use time after the first (and each earlier echo). The gap shrinks when there are
 * several echoes, so the last one still lands before the use ends (Triple Cadence repeats twice).
 */
const echoeAt = (act: Action) =>
  (HIT_AT +
    Math.min(ECHO_GAP, (0.98 - HIT_AT) / Math.max(1, Math.floor(act.profile.repeats))) *
      (act.echoes + 1)) *
  act.duration;

/** Advance the current action; fire it at 60% of its use time. */
export function updateAction(w: World, a: Actor, dt: number): void {
  const act = a.action;
  if (!act) return;
  if (a.stunT > 0) {
    a.action = null;
    return;
  }
  if (a.ail.freezeT > 0) return;
  const t = actorById(w, act.targetId);
  // A monster's area attack stops following its target a way into the wind-up, so the warning on the ground can be left.
  const lock = act.profile.skill.lockAim;
  const locked = lock !== undefined && act.elapsed >= lock * act.duration;
  if (t && t.alive && !act.fired && !locked) {
    act.aimX = t.x;
    act.aimY = t.y;
    a.facing = Math.atan2(t.y - a.y, t.x - a.x);
  }
  const adt = dt * (1 - a.ail.chill) * speedMult(a);
  act.elapsed += adt;
  if (act.profile.skill.run && a.isPlayer && !act.fired) runStep(w, a, act, t, adt);
  if (act.profile.skill.spin && a.isPlayer && act.which !== 'deployed') {
    spinStep(w, a, act, t, adt);
  } else if (!act.fired && act.elapsed >= HIT_AT * act.duration) {
    act.fired = true;
    // A monster has no side, and no critical roll for its strikes to share.
    const sd = a.side;
    if (sd) sd.critSeen = false;
    fire(w, a, act);
    act.crit = sd ? sd.critSeen : false;
  }
  // Echoes: the same use lands again a moment after the first, without a new wind-up or a new cost.
  if (
    act.which !== 'utility' &&
    act.fired &&
    act.echoes < Math.floor(act.profile.repeats) &&
    act.elapsed >= echoeAt(act)
  ) {
    act.echoes++;
    // The repeats of Triple Cadence go to random enemies near, harder each time, sharing the first strike's critical roll.
    const t2 = repeatTarget(w, a, act) ?? actorById(w, act.targetId);
    if (t2 && t2.alive) {
      act.aimX = t2.x;
      act.aimY = t2.y;
      if (act.profile.multistrike) act.targetId = t2.id;
    }
    // A repeat of an area lands a little off the one before, so a use never puts two areas on one spot.
    const reach = areaRadiusOf(act.profile);
    if (reach !== null && t2 && t2.alive) {
      const spot = repeatSpot(t2.x, t2.y, reach, act.echoes, a.id);
      const near = w.grid.collide(spot.x, spot.y, 0.3);
      act.aimX = near.x;
      act.aimY = near.y;
    }
    const mult = act.echoMult?.[act.echoes - 1] ?? 1;
    const prof = mult === 1 ? act.profile : scaleProfile(act.profile, mult);
    const sd = a.side;
    if (sd && act.profile.multistrike) sd.critLock = act.crit ?? null;
    // A repeat is a use of its own: what the first hit once (a dash through enemies) it may hit again.
    fire(w, a, { ...act, profile: prof, hitIds: [] });
    if (sd) sd.critLock = null;
    w.events.push({ t: 'echo', src: a.id, skill: act.profile.skill.id });
  }
  if (act.elapsed >= act.duration) {
    a.carry = act.elapsed - act.duration;
    a.action = null;
    a.handIdx++;
  }
}

/**
 * Advance a skill that runs at its target over its wind-up (a leap, a charge, a hook, a run): the character covers its travel in the
 * time before the blow, stopping at contact, and the blow lands on arrival. A charge hits what it runs into, once each, as it goes.
 */
function runStep(w: World, a: Actor, act: Action, target: Actor | undefined, dt: number): void {
  const p = act.profile;
  const run = p.skill.run!;
  if (act.ran === undefined) act.ran = 0;
  if (!target || !target.alive) return;
  const dx = target.x - a.x;
  const dy = target.y - a.y;
  const d = Math.hypot(dx, dy);
  a.facing = Math.atan2(dy, dx);
  const speed = (p.skill.travel ?? 0) / (HIT_AT * act.duration);
  const step = Math.min(speed * dt, Math.max(0, d - (target.r + a.r + 0.8)));
  if (step <= 1e-4) return;
  const spot = w.grid.collide(a.x + (dx / d) * step, a.y + (dy / d) * step, a.r);
  act.ran += Math.hypot(spot.x - a.x, spot.y - a.y);
  a.x = spot.x;
  a.y = spot.y;
  a.moving = true;
  if (run.style !== 'charge') return;
  // The charge so far is its distance: a longer run hits harder (Bulwark Rush).
  const ids = (act.hitIds ??= []);
  for (const e of enemiesOf(w, a)) {
    if (ids.includes(e.id) || e.phaseT > 0) continue;
    if (Math.hypot(e.x - a.x, e.y - a.y) > e.r + a.r + 0.3) continue;
    ids.push(e.id);
    a.side!.lastTravel = act.ran;
    hit(w, a, e, p, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
  }
}

/** How close to its target a spin stops, beyond the two bodies. */
const SPIN_GAP = 0.6;
/** The share of a spin in which it covers its dash: the rest it spends on the spot. */
const SPIN_DASH_SHARE = 0.8;

/**
 * One hit of a spin: the weapon sweeps all the way round the character. (A spin used another way, as an echo or from a trigger,
 * is one such hit, without moving.)
 */
function spinHit(p: SkillProfile): SkillProfile {
  const sp = p.skill.spin!;
  return {
    ...p,
    skill: {
      ...p.skill,
      spin: undefined,
      travel: undefined,
      travelThrough: undefined,
      behaviour: { kind: 'melee', range: sp.radius, arc: 360, radius: sp.radius },
    },
  };
}

/**
 * Advance a spin (Spinning Dash): the character runs at its target, fast enough to arrive in most of the spin, and stops at
 * contact (it spins on the spot from there). The hits are spread over the whole use, so everything the character passes, and
 * the target when it arrives, is hit again and again.
 */
function spinStep(w: World, a: Actor, act: Action, target: Actor | undefined, dt: number): void {
  const sp = act.profile.skill.spin!;
  if (!act.fired) {
    act.fired = true;
    act.spinN = 0;
    act.hitIds = [];
  }
  if (target && target.alive) {
    a.facing = Math.atan2(target.y - a.y, target.x - a.x);
    const d = Math.hypot(target.x - a.x, target.y - a.y);
    const speed = (act.profile.skill.travel ?? 0) / (SPIN_DASH_SHARE * act.duration);
    const step = Math.min(speed * dt, Math.max(0, d - (target.r + a.r + SPIN_GAP)));
    if (step > 1e-4) {
      const spot = w.grid.collide(
        a.x + ((target.x - a.x) / d) * step,
        a.y + ((target.y - a.y) / d) * step,
        a.r,
      );
      a.x = spot.x;
      a.y = spot.y;
      a.moving = true;
    }
  }
  const due = Math.min(sp.hits, Math.floor((act.elapsed / act.duration) * sp.hits + 0.5));
  // Each hit's sweep starts a turn further round, so the blade seems to go round and round.
  const face = a.facing;
  while ((act.spinN ?? 0) < due) {
    a.facing = face + ((act.spinN ?? 0) * 2 * Math.PI) / sp.hits;
    act.spinN = (act.spinN ?? 0) + 1;
    a.side!.critSeen = false;
    fire(w, a, { ...act, aimX: a.x, aimY: a.y });
    act.crit = act.crit || a.side!.critSeen;
  }
  a.facing = face;
}

/** What an actor's blow can reach: the living actors and minions of the other teams (a monster's area attack catches the characters and their minions). */
export function enemiesOf(w: World, a: Actor): Actor[] {
  return livingEnemiesOf(w, a.team);
}

/** The damage type of a skill's biggest chunk (what an effect looks like). */
const dominantType = (p: SkillProfile, hand: number): number => profileElement(p, hand);

/** A slam, or any blow of a boss: it shakes the ground. */
function isHeavy(a: Actor, p: SkillProfile): boolean {
  return a.rarity === 'boss' || p.skill.tags.includes('slam');
}

/** Distance from a point to a line segment. */
export function segmentDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** The `fall` field of an area event of a skill that is rain from the sky (VISUAL_LANGUAGE.md): arrows or bolts coming down. */
export function fallField(skill: { id: string; type: string }): { fall?: 'arrow' | 'bolt' } {
  const fall = fallOf(skill.id, skill.type);
  return fall ? { fall } : {};
}

/** Zones a skill left on the ground pulse, and end (rain, a cloud, a wall). */
export function tickSkillZones(w: World, s: Side, dt: number): void {
  if (s.zones.length === 0) return;
  let j = 0;
  for (const z of s.zones) {
    const owner = actorById(w, z.owner);
    if (!owner || !owner.alive) continue;
    if (z.delayT > 0) {
      z.delayT -= dt;
      s.zones[j++] = z;
      continue;
    }
    z.pulseT -= dt;
    if (z.pulseT <= 0) {
      z.pulseT += z.interval;
      z.pulsesLeft--;
      z.pulsed = (z.pulsed ?? 0) + 1;
      if (z.spots) {
        // A rain with extra arrows bursts in several places (src/sim/rain.ts).
        pulseRain(w, owner, z, enemiesOf(w, owner));
        if (z.pulsesLeft > 0) s.zones[j++] = z;
        continue;
      }
      if (z.bursts !== undefined && z.x2 !== undefined && z.y2 !== undefined) {
        // A burst a step further along the line each pulse.
        const k = z.bursts > 1 ? (z.pulsed - 1) / (z.bursts - 1) : 0;
        const bx = z.x + (z.x2 - z.x) * k;
        const by = z.y + (z.y2 - z.y) * k;
        w.events.push({
          t: 'explode',
          x: bx,
          y: by,
          r: z.radius,
          dtype: z.dtype,
          ...(owner.isPlayer ? { skill: z.profile.skill.id } : {}),
          ...fallField(z.profile.skill),
        });
        for (const e of enemiesOf(w, owner))
          if (Math.hypot(e.x - bx, e.y - by) <= z.radius + e.r)
            hit(w, owner, e, z.profile, z.hand, Math.hypot(e.x - owner.x, e.y - owner.y));
        if (z.pulsesLeft > 0) s.zones[j++] = z;
        continue;
      }
      w.events.push({
        t: 'explode',
        x: z.x2 === undefined ? z.x : (z.x + z.x2) / 2,
        y: z.y2 === undefined || z.y === undefined ? z.y : (z.y + z.y2) / 2,
        r: z.radius,
        dtype: z.dtype,
        ...(owner.isPlayer ? { skill: z.profile.skill.id } : {}),
        ...(z.pulsed && z.pulsed > 1 ? { pulse: true } : {}),
        ...(z.x2 !== undefined && z.y2 !== undefined
          ? { strip: [z.x, z.y, z.x2, z.y2] as [number, number, number, number] }
          : {}),
        ...fallField(z.profile.skill),
      });
      for (const e of enemiesOf(w, owner)) {
        const d =
          z.x2 === undefined || z.y2 === undefined
            ? Math.hypot(e.x - z.x, e.y - z.y)
            : segmentDist(e.x, e.y, z.x, z.y, z.x2, z.y2);
        if (d > z.radius + e.r) continue;
        hit(w, owner, e, z.profile, z.hand, Math.hypot(e.x - owner.x, e.y - owner.y));
      }
    }
    if (z.pulsesLeft > 0) s.zones[j++] = z;
  }
  s.zones.length = j;
}

/** The use a projectile in flight stands for, for what follows its hit (the element is the one the side last picked). */
function shotAction(pr: Projectile, owner: Actor): Action {
  return {
    profile: pr.profile,
    which: 'primary',
    hand: pr.hand,
    duration: 0,
    elapsed: 0,
    fired: true,
    echoes: 0,
    targetId: pr.lastHitId ?? -1,
    aimX: pr.x,
    aimY: pr.y,
    elem: owner.side?.elem,
  };
}

/** Resolve an action's effect: strikes, chains or projectiles. Triggers call it with no wind-up. */
export function fire(w: World, a: Actor, act: Action): void {
  // Spinning Dash sends out what a Toxin Circle has caught.
  if (a.isPlayer && act.profile.skill.releasesCaught) releaseCaught(w, a);
  fireEffect(w, a, act);
  // The later hits of a spin are only hits: what a use leaves behind (ground, blades, charges spent) is left once.
  if (act.spinN !== undefined && act.spinN > 1) return;
  leaveGround(w, a, act);
  cascadeCast(w, a, act);
  if (act.profile.skill.stanceStorm) placeStanceStorm(w, a, act);
  // An aftershock: the ground cracks, and a moment later it erupts, harder and wider.
  const aft = act.profile.skill.aftershock;
  if (aft && a.isPlayer && act.which !== 'deployed') {
    const b = act.profile.skill.behaviour;
    const atSelf = b.kind === 'burst' && b.origin === 'self';
    const q = scaleProfile(act.profile.quake ?? act.profile, 1 + aft.more / 100);
    a.side!.zones.push({
      id: w.nextId++,
      owner: a.id,
      profile: q,
      hand: act.hand,
      x: atSelf ? a.x : act.aimX,
      y: atSelf ? a.y : act.aimY,
      radius: (b.kind === 'burst' ? b.radius : 2) * q.radiusMult * (1 + aft.radius / 100),
      delayT: aft.delay,
      interval: 1,
      pulseT: 0,
      pulsesLeft: 1,
      dtype: profileElement(q, act.hand),
    });
  }
  // A skill that discharges the charges held (its damage grew with them) spends them once it has landed.
  if (a.isPlayer && act.profile.skill.consumeCharges)
    for (const kind of CHARGE_KINDS) {
      const n = a.side!.char.charges[kind];
      if (n > 0) spendCharges(w, a.side!, kind, n);
    }
}

/**
 * Carry the caster up to `most` tiles toward the target, stopping short of contact (a leap, a charge, a spin that closes in). A
 * `quiet` carry is a walk, not a blink: it leaves no blink for the renderer.
 */
export function carryToward(
  w: World,
  a: Actor,
  p: SkillProfile,
  act: Action,
  target: Actor,
  most: number,
  quiet = false,
): void {
  const d = Math.hypot(target.x - a.x, target.y - a.y);
  const step = Math.max(0, Math.min(most, d - (target.r + a.r + 0.8)));
  // (A monster has no side, and nothing that reads how far it was carried.)
  const sd = a.side;
  if (sd) sd.lastTravel = 0;
  if (step <= 0.05) return;
  if (sd) sd.lastTravel = step;
  const spot = w.grid.collide(
    a.x + ((target.x - a.x) / d) * step,
    a.y + ((target.y - a.y) / d) * step,
    a.r,
  );
  // A dash through the target hits everything within a body of the way.
  if (p.skill.travelThrough && a.isPlayer) {
    const x0 = a.x;
    const y0 = a.y;
    for (const e of enemiesOf(w, a))
      if (e.phaseT <= 0 && segmentDist(e.x, e.y, x0, y0, spot.x, spot.y) <= e.r + a.r + 0.3)
        hit(w, a, e, p, act.hand, Math.hypot(e.x - x0, e.y - y0));
  }
  if (!quiet) w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: false });
  a.x = spot.x;
  a.y = spot.y;
  if (!quiet) w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: true });
}

export function fireEffect(w: World, a: Actor, act: Action): void {
  if (act.which === 'utility') {
    applyUtility(w, a, act);
    return;
  }
  if (a.isPlayer && act.which !== 'deployed' && act.which !== 'default') {
    const c = a.side!.char.actives.find((x) => x.skill.id === act.profile.skill.id);
    if (c?.deploy) {
      placeDeployable(w, a, act);
      return;
    }
  }
  if (act.profile.skill.spin && a.isPlayer) {
    fireEffect(w, a, {
      ...act,
      profile: spinHit(act.profile),
      spinOnce: act.profile.skill.spin.once && act.spinN !== undefined ? act.hitIds : undefined,
    });
    return;
  }
  const p = act.profile;
  const b = p.skill.behaviour;
  const target = actorById(w, act.targetId);
  // A monster's pattern: the cast lays its blasts, each with its own warning (docs/ENCOUNTERS.md 4).
  if (p.skill.pattern && !a.isPlayer) {
    castPattern(w, a, act, p.skill.pattern);
    return;
  }
  if (p.skill.wave && a.isPlayer) {
    lineWave(w, a, act);
    return;
  }
  if (p.skill.castOn && a.isPlayer && novaOnBolts(w, a, act)) return;
  if (p.skill.volleys && a.isPlayer) {
    fireVolleys(w, a, act);
    return;
  }
  if (p.skill.vortex && a.isPlayer) {
    addBlade(a.side!, p);
    return;
  }
  if (p.skill.markers && a.isPlayer) {
    placeMarker(w, a.side!, act);
    return;
  }
  if (p.skill.stormOrb && a.isPlayer) {
    placeOrb(w, a, act);
    return;
  }
  // A frost crystal waits and bursts; a wall of ice goes up and holds the way (src/sim/fields.ts).
  if (p.skill.crystal && a.isPlayer) {
    placeCrystal(w, a, act);
    return;
  }
  if (p.skill.wall && a.isPlayer) {
    raiseWall(w, a, act);
    return;
  }
  if (p.skill.pods && a.isPlayer) {
    placePods(w, a, act);
    return;
  }
  if (p.skill.geyser && a.isPlayer) {
    placeGeyser(w, a, act);
    return;
  }
  // A slam that may spend a charge to hit harder over more ground.
  if (p.skill.chargedSlam && a.isPlayer && act.which !== 'channelled') {
    const cs = p.skill.chargedSlam;
    if (a.side!.char.charges[cs.charge] > 0 && w.rngTrig.chance(cs.chance / 100)) {
      spendCharges(w, a.side!, cs.charge, 1);
      const q = scaleProfile(p, 1 + cs.more / 100);
      fireEffect(w, a, {
        ...act,
        profile: { ...q, radiusMult: q.radiusMult * (1 + cs.radius / 100) },
        which: 'channelled',
      });
      return;
    }
  }
  // A channelled skill builds a stage with each use, and is released when the channel ends (src/sim/channel.ts).
  if (p.skill.channel && a.isPlayer && act.which !== 'channelled') {
    channelUse(w, a, act);
    return;
  }
  if (p.skill.stacks && a.isPlayer && act.which !== 'channelled') {
    stackedUse(w, a, act);
    return;
  }
  // A travelling skill (a leap, a charge) carries the caster toward the target before it lands.
  // (One that runs over its wind-up has already arrived.)
  if (p.skill.run && a.isPlayer && act.ran !== undefined) a.side!.lastTravel = act.ran;
  else if (p.skill.travel && target && target.alive)
    carryToward(w, a, p, act, target, p.skill.travel);
  if (b.kind === 'melee') {
    const reach = b.range + p.rangeBonus;
    if (b.arc) {
      const radius = (b.radius ?? reach) * p.radiusMult;
      const half = ((b.arc / 2) * Math.PI) / 180;
      // (The hits of a spin show as one ring that stays on the character, not a sweep each.)
      if (act.spinN === undefined)
        w.events.push({
          t: 'swing',
          src: a.id,
          x: a.x,
          y: a.y,
          facing: a.facing,
          radius: radius + a.r,
          arc: b.arc,
          dtype: dominantType(p, act.hand),
          heavy: isHeavy(a, p),
        });
      // A dash through enemies hits each once a use, whichever sweep reaches it first.
      const once = act.spinOnce;
      for (const e of enemiesOf(w, a)) {
        const d = Math.hypot(e.x - a.x, e.y - a.y);
        if (d > radius + e.r + a.r + 0.4) continue;
        const ang = Math.atan2(e.y - a.y, e.x - a.x);
        if (d > e.r && Math.abs(angleDiff(a.facing, ang)) > half) continue;
        if (once) {
          if (once.includes(e.id)) continue;
          once.push(e.id);
        }
        if (p.bothHands) for (let h = 0; h < p.hands.length; h++) hit(w, a, e, p, h, d);
        else hit(w, a, e, p, act.hand, d);
      }
      return;
    }
    if (!target || !target.alive) return;
    const d = Math.hypot(target.x - a.x, target.y - a.y);
    if (d > reach + target.r + a.r + 0.4) return;
    w.events.push({
      t: 'thrust',
      src: a.id,
      x: a.x,
      y: a.y,
      x2: target.x,
      y2: target.y,
      dtype: dominantType(p, act.hand),
      heavy: isHeavy(a, p),
    });
    // A skill that strikes with both weapons at once (Twin Blades) lands both blows.
    // (A monster has no side, so no outcome to follow.)
    if (a.side) a.side.lastOutcome = null;
    if (p.bothHands) for (let h = 0; h < p.hands.length; h++) hit(w, a, target, p, h, d);
    else hit(w, a, target, p, act.hand, d);
    // A strike that hits more enemies at once (Echoing Blow).
    extraStrikes(w, a, act, target);
    // A strike that sends more out after it (bolts, blades, balls) does so only if it landed.
    if (a.side?.lastOutcome === 'hit') afterStrike(w, a, act, target);
    return;
  }
  if (b.kind === 'chain') {
    if (!target || !target.alive) return;
    const hitIds: number[] = [];
    let cur = target;
    let from: Actor = a;
    for (let i = 0; i <= p.chains; i++) {
      const d = Math.hypot(cur.x - a.x, cur.y - a.y);
      // The first hit is the strongest: each chain still to come adds to it.
      // (The profile already carries the first hit's share, as the sheet counts it.)
      // The first target alone takes a brand's more damage (the profile carries it, as the sheet counts the first hit).
      const later = i > 0 ? 1 / firstMoreOf(p.skill) : 1;
      const q =
        b.ramp || later !== 1
          ? scaleProfile(
              p,
              ((1 + ((b.ramp ?? 0) * (p.chains - i)) / 100) /
                (1 + ((b.ramp ?? 0) * p.chains) / 100)) *
                later,
            )
          : p;
      hit(w, a, cur, q, act.hand, d);
      w.events.push({ t: 'chain', from: from.id, to: cur.id, dtype: dominantType(p, act.hand) });
      hitIds.push(cur.id);
      // Each jump also reaches a second enemy beside the one it landed on, which does not chain on.
      if (b.fork && i > 0) {
        let second: Actor | null = null;
        let sd = b.chainRange;
        for (const e of enemiesOf(w, a)) {
          if (hitIds.includes(e.id)) continue;
          const dd = Math.hypot(e.x - cur.x, e.y - cur.y);
          if (dd <= sd && w.grid.los(cur.x, cur.y, e.x, e.y)) {
            sd = dd;
            second = e;
          }
        }
        if (second) {
          hitIds.push(second.id);
          w.events.push({
            t: 'chain',
            from: cur.id,
            to: second.id,
            dtype: dominantType(p, act.hand),
          });
          hit(w, a, second, q, act.hand, Math.hypot(second.x - a.x, second.y - a.y));
        }
      }
      if (i === p.chains) break;
      let best: Actor | null = null;
      let bd = b.chainRange;
      for (const e of enemiesOf(w, a)) {
        if (hitIds.includes(e.id)) continue;
        const dd = Math.hypot(e.x - cur.x, e.y - cur.y);
        if (dd <= bd && w.grid.los(cur.x, cur.y, e.x, e.y)) {
          bd = dd;
          best = e;
        }
      }
      if (!best) break;
      from = cur;
      cur = best;
    }
    return;
  }
  if (b.kind === 'burst') {
    // Around the target (a slam, an item skill) or, as a nova, around the caster.
    const cx = b.origin === 'self' ? a.x : act.aimX;
    const cy = b.origin === 'self' ? a.y : act.aimY;
    const radius = b.radius * p.radiusMult;
    const dominant = profileElement(p);
    // A nova in front only (a half circle toward the target) shows as a sweep.
    const arc = b.origin === 'self' ? b.arc : undefined;
    const facing = Math.atan2(act.aimY - a.y, act.aimX - a.x);
    if (arc)
      w.events.push({
        t: 'swing',
        src: a.id,
        x: a.x,
        y: a.y,
        facing,
        radius: radius + a.r,
        arc,
        dtype: dominant,
        heavy: false,
      });
    else if (!act.ringed)
      w.events.push({
        t: 'explode',
        x: cx,
        y: cy,
        r: radius,
        dtype: dominant,
        ...(a.isPlayer ? { skill: p.skill.id } : {}),
        ...(act.fall ? { fall: act.fall } : {}),
      });
    const half = arc ? ((arc / 2) * Math.PI) / 180 : Math.PI;
    const inside = enemiesOf(w, a).filter((e) => {
      const d = Math.hypot(e.x - cx, e.y - cy);
      if (d > radius + e.r) return false;
      return (
        !arc || d <= e.r || Math.abs(angleDiff(facing, Math.atan2(e.y - cy, e.x - cx))) <= half
      );
    });
    // A debuff that holds only so many enemies takes the nearest.
    const cap = p.skillDot?.spec.maxTargets;
    if (cap && inside.length > cap)
      inside.sort((x, y) => Math.hypot(x.x - cx, x.y - cy) - Math.hypot(y.x - cx, y.y - cy));
    for (const e of cap ? inside.slice(0, cap) : inside)
      hit(w, a, e, p, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
    // A monster's lob leaves a zone where it landed: a ground effect, which the character can see and step out of.
    if (b.zone && !a.isPlayer)
      openZone(w, cx, cy, radius, b.zone.seconds, b.zone.kind, monsterHitOf(a) * b.zone.dps);
    return;
  }
  if (b.kind === 'beam') {
    // Everything on the line from the caster toward the target.
    const len = b.length * p.radiusMult;
    const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
    const x2 = a.x + Math.cos(ang) * len;
    const y2 = a.y + Math.sin(ang) * len;
    w.events.push({
      t: 'beam',
      x: a.x,
      y: a.y,
      x2,
      y2,
      dtype: dominantType(p, act.hand),
      width: b.width * p.radiusMult,
      ...(a.isPlayer ? { skill: p.skill.id } : {}),
    });
    // A hook drags the character it catches.
    if (!a.isPlayer && p.skill.pull) {
      const t = hunted(w, a);
      if (t.alive && segmentDist(t.x, t.y, a.x, a.y, x2, y2) <= (b.width * p.radiusMult) / 2 + t.r)
        pullPlayer(w, t.side!, a, p.skill.pull);
    }
    for (const e of enemiesOf(w, a)) {
      if (segmentDist(e.x, e.y, a.x, a.y, x2, y2) > (b.width * p.radiusMult) / 2 + e.r) continue;
      hit(w, a, e, p, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
    }
    return;
  }
  if (b.kind === 'ground') {
    const line = b.line !== undefined;
    const ang = Math.atan2(act.aimY - a.y, act.aimX - a.x);
    const radius = b.radius * p.radiusMult;
    // More arrows than the skill starts with: a rain of several bursts (rings or a stack, by the skill).
    const rain = line ? null : plantRain(w, p, act.aimX, act.aimY, radius);
    a.side!.zones.push({
      id: w.nextId++,
      owner: a.id,
      profile: rain ? rain.profile : p,
      hand: act.hand,
      x: line ? a.x : act.aimX,
      y: line ? a.y : act.aimY,
      x2: line ? a.x + Math.cos(ang) * (b.line as number) * p.radiusMult : undefined,
      y2: line ? a.y + Math.sin(ang) * (b.line as number) * p.radiusMult : undefined,
      radius,
      delayT: b.delay ?? 0,
      interval: p.zoneInterval,
      pulseT: 0,
      // Duration over interval, rounded down, as the calc counts it: a support that lengthens the zone adds pulses.
      pulsesLeft: Math.max(1, Math.floor((b.duration * p.skillDuration) / p.zoneInterval)),
      dtype: dominantType(p, act.hand),
      spots: rain?.spots,
      stack: rain?.stack,
      bursts:
        line && b.travels
          ? Math.max(1, Math.floor((b.duration * p.skillDuration) / p.zoneInterval))
          : undefined,
    });
    return;
  }
  // The burst in front of the shooter that goes with a shot, then the projectiles.
  coneBurst(w, a, act);
  fireProjectiles(w, a, act);
}

function explode(
  w: World,
  owner: Actor | undefined,
  pr: World['projectiles'][number],
  x: number,
  y: number,
): void {
  w.events.push({
    t: 'explode',
    x,
    y,
    r: pr.explodeRadius,
    dtype: pr.dtype,
    ...(owner?.isPlayer ? { skill: pr.profile.skill.id } : {}),
  });
  registerBlast(w, x, y, pr.explodeRadius);
  if (!owner) return;
  for (const e of w.actors) {
    if (!e.alive || e.team === pr.team) continue;
    if (Math.hypot(e.x - x, e.y - y) <= pr.explodeRadius + e.r)
      hit(w, owner, e, pr.profile, pr.hand, Math.hypot(e.x - pr.startX, e.y - pr.startY));
  }
  if (pr.kind === 'creep') leaveCreeping(w, owner, pr, x, y);
  // The minions of the other teams stand outside `w.actors`: a burst reaches them too.
  for (const e of foeMinions(w, pr.team))
    if (e.alive && Math.hypot(e.x - x, e.y - y) <= pr.explodeRadius + e.r)
      hit(w, owner, e, pr.profile, pr.hand, Math.hypot(e.x - pr.startX, e.y - pr.startY));
}

/** Fates reported in `projectileEnd` events: 0 wall, 1 out of range, 2 spent on an enemy, 3 exploded. */
function endProjectile(w: World, pr: World['projectiles'][number], fate: 0 | 1 | 2 | 3): void {
  w.events.push({
    t: 'projectileEnd',
    id: pr.id,
    owner: pr.owner,
    aim: pr.aimId,
    fate,
    closest: Number.isFinite(pr.minDist) ? pr.minDist : -1,
    lastHit: pr.lastHitId,
  });
}

/** Move projectiles, resolve wall and enemy collisions. */
export function updateProjectiles(w: World, dt: number): void {
  const list = w.projectiles;
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    const pr = list[i];
    let alive = true;
    const steps = 2;
    for (let s = 0; s < steps && alive; s++) {
      pr.x += (pr.vx * dt) / steps;
      pr.y += (pr.vy * dt) / steps;
      pr.travelled += (Math.hypot(pr.vx, pr.vy) * dt) / steps;
      const owner = actorById(w, pr.owner);
      if (pr.formAt !== undefined && !pr.formed && pr.travelled >= pr.formAt) changeForm(pr);
      if (
        owner?.isPlayer &&
        (pr.profile.skill.homing ||
          pr.profile.skill.wander ||
          pr.profile.skill.pulse ||
          pr.profile.skillDot?.spec.carried)
      )
        projectileFx(w, owner.side!, pr, dt / steps);
      const aim = pr.aimId ? actorById(w, pr.aimId) : undefined;
      if (aim) pr.minDist = Math.min(pr.minDist, Math.hypot(aim.x - pr.x, aim.y - pr.y));
      if (!w.grid.isFloor(Math.floor(pr.x), Math.floor(pr.y))) {
        // A shot that struck something before it reached the wall was not blocked by it. (Nor is it the character's to fix when a
        // totem, trap or mine shot it: walking closer does not move where those shoot from.)
        const os = owner?.isPlayer ? owner.side! : null;
        if (
          os &&
          pr.hitIds.length === 0 &&
          !os.char.actives.find((c) => c.skill.id === pr.profile.skill.id)?.deploy
        ) {
          os.stats.wallBlocked++;
          if (w.t - os.ai.blockedT > BLOCK_WINDOW) os.ai.blocked = 0;
          if (os.ai.blocked === 0) os.ai.blockedT = w.t;
          os.ai.blocked++;
        }
        if (pr.profile.skill.wander && pr.travelled < pr.maxRange) {
          // A wandering spark turns about at a wall and goes on.
          pr.x -= (pr.vx * dt) / steps;
          pr.y -= (pr.vy * dt) / steps;
          const sp = Math.hypot(pr.vx, pr.vy);
          const ang = Math.atan2(pr.vy, pr.vx) + Math.PI + w.rngCombat.float(-0.9, 0.9);
          pr.vx = Math.cos(ang) * sp;
          pr.vy = Math.sin(ang) * sp;
          continue;
        }
        if (pr.profile.skill.fuse && owner?.isPlayer) stickArrow(owner.side!, pr, null);
        if (pr.explodeRadius > 0)
          explode(w, owner, pr, pr.x - (pr.vx * dt) / steps, pr.y - (pr.vy * dt) / steps);
        projectileLanded(w, pr, owner);
        endProjectile(w, pr, 0);
        alive = false;
        break;
      }
      if (pr.travelled >= pr.maxRange) {
        const b = pr.profile.skill.behaviour;
        if (b.kind === 'projectile' && b.returns && !pr.back && owner?.alive) {
          // Turn around and fly back to the owner, hitting everything again on the way.
          const dx = owner.x - pr.x;
          const dy = owner.y - pr.y;
          const d = Math.hypot(dx, dy) || 1;
          const speed = Math.hypot(pr.vx, pr.vy);
          pr.vx = (dx / d) * speed;
          pr.vy = (dy / d) * speed;
          pr.back = true;
          pr.travelled = 0;
          pr.maxRange = d + 1;
          pr.hitIds = [];
          pr.pierceLeft = pr.profile.pierce;
          const rm = pr.profile.skill.returnMore;
          if (rm) pr.profile = scaleProfile(pr.profile, 1 + rm / 100);
        } else {
          // An arrow fired into the air comes down and bursts, on the spot it was thrown to (not a step past it).
          if (pr.kind === 'mortar' || pr.kind === 'creep') {
            const sp = Math.hypot(pr.vx, pr.vy) || 1;
            const over = Math.min(pr.travelled - pr.maxRange, (sp * dt) / steps);
            pr.x -= (pr.vx / sp) * over;
            pr.y -= (pr.vy / sp) * over;
            explode(w, owner, pr, pr.x, pr.y);
          }
          if (pr.bouncesLeft && owner) bounceLob(w, owner, pr);
          projectileLanded(w, pr, owner);
          endProjectile(w, pr, pr.kind === 'mortar' || pr.kind === 'creep' ? 3 : 1);
          alive = false;
          break;
        }
      }
      if (pr.back && owner && Math.hypot(owner.x - pr.x, owner.y - pr.y) < 0.8) {
        // A returning projectile that reaches its owner is caught, if the skill catches.
        if (owner.isPlayer) catchProjectile(owner.side!, pr.profile, pr.hand);
        endProjectile(w, pr, 1);
        alive = false;
        break;
      }
      // A projectile stops at the minions of the other teams as well (they stand outside `w.actors`).
      const na = w.actors.length;
      const foes = foeMinions(w, pr.team);
      const nm = foes.length;
      for (let k = 0; k < na + nm; k++) {
        const e = k < na ? w.actors[k] : foes[k - na];
        if (!e.alive || e.team === pr.team || pr.hitIds.includes(e.id)) continue;
        // The payload of an Arrow Tempest passes through everything on its way down.
        if (pr.kind === 'nova' || pr.kind === 'mortar' || pr.kind === 'orb') continue;
        const rr = e.r + pr.r;
        const dx = e.x - pr.x;
        const dy = e.y - pr.y;
        if (dx * dx + dy * dy > rr * rr) continue;
        pr.hitIds.push(e.id);
        pr.lastHitId = e.id;
        if (pr.explodeRadius > 0) {
          explode(w, owner, pr, pr.x, pr.y);
          endProjectile(w, pr, 3);
          alive = false;
          break;
        }
        // A Shieldbearer turns away what arrives at its front.
        if (shieldBlocks(w, e, pr.x, pr.y)) {
          w.events.push({ t: 'block', src: pr.owner, dst: e.id });
          endProjectile(w, pr, 2);
          alive = false;
          break;
        }
        // An arrow of Fuse Arrow sticks in the enemy, to explode.
        if (pr.profile.skill.fuse && owner?.isPlayer) {
          stickArrow(owner.side!, pr, e);
          endProjectile(w, pr, 2);
          alive = false;
          break;
        }
        if (owner) {
          if (owner.side) owner.side.lastOutcome = null;
          hit(w, owner, e, pr.profile, pr.hand, Math.hypot(e.x - pr.startX, e.y - pr.startY));
          // A strike shot from a bow (Primal Strike) bursts about what it hit, as the strike does. (Only a skill that is itself a
          // shot, and only a burst: the blades and bolts a strike sends out are projectiles too, and must not send out more.)
          const ah = pr.profile.skill.afterHit;
          if (
            ah &&
            (ah.kind === 'area' || ah.kind === 'element') &&
            pr.profile.skill.behaviour.kind === 'projectile' &&
            owner.side?.lastOutcome === 'hit'
          )
            afterStrike(w, owner, shotAction(pr, owner), e);
        }
        if (pr.pierceLeft > 0) pr.pierceLeft--;
        else if (afterProjectileHit(w, pr, owner)) break;
        else {
          // A thrown shield shatters where it hits.
          if (pr.kind === 'shield' || pr.kind === 'mirror') projectileLanded(w, pr, owner);
          endProjectile(w, pr, 2);
          alive = false;
          break;
        }
      }
    }
    if (alive) list[j++] = pr;
  }
  list.length = j;
}
