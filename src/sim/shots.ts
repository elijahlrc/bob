import type { SkillProfile } from '../calc/skill';
import { formedProfile } from '../calc/skill';
import { levelValue } from '../calc/gems';
import { PROJECTILE_SPEED } from '../data/constants';
import { actorById } from './actions';
import { hit } from './combat';
import type { Action, Actor, Projectile, World } from './types';

/**
 * How projectiles come about and what they do after a hit (docs/SPIRIT.md S4). A fan, a barrage fired one after another,
 * parallel lanes, an arrow that lands and bursts into a ring, an arrow that scatters at its end; a projectile that forks or
 * chains when it hits; and the skills that strike and then send projectiles out (bolts from the weapon, blades from behind the
 * struck enemy, balls that land and burst). The reference game's rule stands (3.9): the projectiles of one use cannot hit the same
 * enemy twice, unless the skill fires them in sequence or is flagged to shotgun.
 */

export type PendingShot = {
  at: number;
  owner: number;
  profile: SkillProfile;
  hand: number;
  x: number;
  y: number;
  angle: number;
  aimId: number;
  hitIds: number[];
  dtype: number;
};

const FORK_ANGLE = (60 * Math.PI) / 180;
/** How far a chaining projectile looks for the next enemy, in tiles. */
const CHAIN_RANGE = 3.5;
/** The seconds between the projectiles of a barrage. */
const BARRAGE_GAP = 0.07;
/** Lane spacing of parallel projectiles, in tiles. */
const LANE = 0.6;
/** The randomised spread of a barrage, in radians (about twenty degrees across). */
const BARRAGE_SPREAD = (20 * Math.PI) / 180;
/** Arrows of a ring (Arrow Nova) and of a scatter (Tornado Shot) fly this far, in tiles. */
const BURST_RANGE = 6;
const TORNADO_SECONDARIES = 3;

function dominantType(p: SkillProfile, hand: number): number {
  let dtype = 0;
  let best = -1;
  for (const c of p.hands[Math.min(hand, p.hands.length - 1)].chunks)
    if (c.max > best) {
      best = c.max;
      dtype = c.type;
    }
  return dtype;
}

const scaled = new WeakMap<SkillProfile, Map<number, SkillProfile>>();
/** The profile with its hits multiplied by a factor (the bolts of a strike deal less than the strike). */
export function scaleProfile(p: SkillProfile, f: number): SkillProfile {
  if (f === 1) return p;
  let m = scaled.get(p);
  if (!m) scaled.set(p, (m = new Map()));
  let q = m.get(f);
  if (!q) m.set(f, (q = { ...p, hands: p.hands.map((h) => ({ ...h, hitMult: h.hitMult * f })) }));
  return q;
}

export function launch(
  w: World,
  owner: Actor,
  p: SkillProfile,
  hand: number,
  x: number,
  y: number,
  angle: number,
  o: {
    hitIds: number[];
    aimId: number;
    range: number;
    explode?: number;
    pierce?: number;
    fork?: number;
    chain?: number;
    kind?: Projectile['kind'];
    ring?: number;
    speedMult?: number;
  },
): Projectile {
  const speed = PROJECTILE_SPEED * p.projSpeedMult * (o.speedMult ?? 1);
  const pr: Projectile = {
    id: w.nextId++,
    owner: owner.id,
    faction: owner.faction,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 0.15,
    travelled: 0,
    maxRange: o.range,
    profile: p,
    hand,
    hitIds: o.hitIds,
    pierceLeft: o.pierce ?? p.pierce,
    aimId: o.aimId,
    minDist: Infinity,
    lastHitId: 0,
    explodeRadius: o.explode ?? 0,
    startX: x,
    startY: y,
    dtype: dominantType(p, hand),
    forkLeft: o.fork ?? 0,
    chainLeft: o.chain ?? 0,
    kind: o.kind,
    ring: o.ring,
    formAt: p.skill.form?.after,
  };
  w.projectiles.push(pr);
  w.events.push({ t: 'projectileSpawned', id: pr.id });
  return pr;
}

/** Aim angle of arrow `i` of an `n`-arrow fan (a symmetric fan of an even count is shifted by half a step, alternately). */
function fan(base: number, i: number, n: number, step: number, tick: number): number {
  const centre = (n - 1) / 2 + (n % 2 === 0 ? (tick % 2 === 0 ? 0.5 : -0.5) : 0);
  return base + (i - centre) * step;
}

/** A projectile skill is used: put its projectiles in the air, in the way the skill says. */
export function fireProjectiles(w: World, a: Actor, act: Action): void {
  const p = act.profile;
  const b = p.skill.behaviour;
  if (b.kind !== 'projectile') return;
  const n = p.projectiles;
  const base = Math.atan2(act.aimY - a.y, act.aimX - a.x);
  const range = (b.range ?? 9) + 2;
  const explode = (b.explodeRadius ?? 0) * p.radiusMult;
  const mode = p.projMode;
  // Projectiles that pierce neither fork nor chain.
  const fork = mode.fork && p.pierce <= 0 ? 1 : 0;
  const chain = p.pierce <= 0 ? p.chains : 0;
  const aimDist = Math.hypot(act.aimX - a.x, act.aimY - a.y);

  if (p.skill.shield) {
    // The shield goes ahead alone; where it ends, it shatters into shards.
    const sp = p.skill.shield;
    launch(w, a, p, act.hand, a.x, a.y, base, {
      hitIds: [],
      aimId: act.targetId,
      range,
      pierce: 0,
      kind: 'shield',
      ring: Math.round(levelValue(sp.shards, p.skill.level)) + Math.max(0, n - b.count),
    });
    return;
  }
  if (mode.nova) {
    // The arrow goes up and comes down at the target; the ring comes from where it lands.
    launch(w, a, p, act.hand, a.x, a.y, base, {
      hitIds: [],
      aimId: act.targetId,
      range: Math.min(range, Math.max(1, aimDist)),
      pierce: 99,
      kind: 'nova',
      ring: n,
    });
    return;
  }
  if (p.skill.mortar) {
    // Arrows fired into the air that come down in a line toward the target, each bursting where it lands.
    const m = p.skill.mortar;
    for (let i = 0; i < n; i++) {
      const frac = n > 1 ? m.from + ((1 - m.from) * i) / (n - 1) : 1;
      launch(w, a, p, act.hand, a.x, a.y, base, {
        hitIds: [],
        aimId: act.targetId,
        range: Math.max(1, aimDist * frac),
        explode: m.radius * p.radiusMult,
        pierce: 999,
        kind: 'mortar',
      });
    }
    return;
  }
  if (mode.tornado) {
    launch(w, a, p, act.hand, a.x, a.y, base, {
      hitIds: [],
      aimId: act.targetId,
      range: Math.min(range, Math.max(1, aimDist)),
      pierce: 99,
      kind: 'tornado',
      ring: TORNADO_SECONDARIES,
    });
    return;
  }
  const step = ((b.spread > 0 && b.count > 1 ? b.spread / (b.count - 1) : 10) * Math.PI) / 180;
  // One hit list for the whole use, unless the skill lets its projectiles hit the same enemy.
  const shared: number[] = [];
  const list = () => (mode.shotgun || mode.sequential ? [] : shared);
  if (mode.sequential) {
    // A barrage: one projectile after another, a little off line, each hitting on its own.
    const gap = Math.min(BARRAGE_GAP, (0.6 * act.duration) / Math.max(1, n));
    for (let i = 0; i < n; i++) {
      // A barrage scatters about twenty degrees across; a skill that names a narrower spread keeps to it (Frost Lance).
      const jitter =
        (w.rngCombat.float(0, 1) - 0.5) *
        (b.spread > 0 ? (b.spread * Math.PI) / 180 : BARRAGE_SPREAD);
      const shot: PendingShot = {
        at: w.t + i * gap,
        owner: a.id,
        profile: p,
        hand: act.hand,
        x: a.x,
        y: a.y,
        angle: base + jitter,
        aimId: act.targetId,
        hitIds: [],
        dtype: 0,
      };
      if (i === 0) launchShot(w, shot, range, explode, fork, chain);
      else w.shots.push(shot);
    }
    return;
  }
  for (let i = 0; i < n; i++) {
    if (mode.parallel) {
      // Side by side, all the same way (Volley): the front is wider, the cone is not.
      const off = (i - (n - 1) / 2) * LANE;
      launch(w, a, p, act.hand, a.x - Math.sin(base) * off, a.y + Math.cos(base) * off, base, {
        hitIds: list(),
        aimId: act.targetId,
        range,
        explode,
        fork,
        chain,
      });
    } else {
      launch(w, a, p, act.hand, a.x, a.y, fan(base, i, n, step, w.tick), {
        hitIds: list(),
        aimId: act.targetId,
        range,
        explode,
        fork,
        chain,
      });
    }
  }
}

function launchShot(
  w: World,
  s: PendingShot,
  range: number,
  explode: number,
  fork: number,
  chain: number,
): void {
  const owner = actorById(w, s.owner);
  if (!owner) return;
  launch(w, owner, s.profile, s.hand, s.x, s.y, s.angle, {
    hitIds: s.hitIds,
    aimId: s.aimId,
    range,
    explode,
    fork,
    chain,
  });
}

/** Fire the projectiles of a barrage whose turn has come. */
export function tickShots(w: World): void {
  if (w.shots.length === 0) return;
  let j = 0;
  for (const s of w.shots) {
    if (s.at > w.t) {
      w.shots[j++] = s;
      continue;
    }
    const b = s.profile.skill.behaviour;
    if (b.kind !== 'projectile') continue;
    const mode = s.profile.projMode;
    const fork = mode.fork && s.profile.pierce <= 0 ? 1 : 0;
    const chain = s.profile.pierce <= 0 ? s.profile.chains : 0;
    launchShot(
      w,
      s,
      (b.range ?? 9) + 2,
      (b.explodeRadius ?? 0) * s.profile.radiusMult,
      fork,
      chain,
    );
  }
  w.shots.length = j;
}

/** A projectile that has gone far enough changes form: faster, through everything, with a far better chance to crit. */
export function changeForm(pr: Projectile): void {
  const f = pr.profile.skill.form;
  if (!f || pr.formed) return;
  pr.formed = true;
  pr.vx *= f.speed;
  pr.vy *= f.speed;
  pr.maxRange = Math.max(pr.maxRange, pr.travelled + (pr.maxRange - pr.travelled) * f.speed);
  pr.pierceLeft = 999;
  pr.profile = formedProfile(pr.profile);
}

/** A skill that releases what a Venom Gyre caught sends it outward in a spiral, none of it returning. */
export function releaseCaught(w: World, a: Actor): void {
  const c = w.caught;
  if (!c) return;
  w.caught = null;
  const b = c.profile.skill.behaviour;
  if (b.kind !== 'projectile') return;
  const profile: SkillProfile = {
    ...c.profile,
    skill: { ...c.profile.skill, behaviour: { ...b, returns: false } },
  };
  for (let i = 0; i < c.n; i++)
    w.shots.push({
      at: w.t + i * 0.04,
      owner: a.id,
      profile,
      hand: c.hand,
      x: a.x,
      y: a.y,
      angle: a.facing + (i * 2 * Math.PI) / Math.max(1, c.n) + i * 0.25,
      aimId: 0,
      hitIds: [],
      dtype: 0,
    });
}

function enemiesOfOwner(w: World, owner: Actor): Actor[] {
  return owner.isPlayer ? w.actors.filter((e) => !e.isPlayer && e.alive) : [w.player];
}

/**
 * A projectile has hit and spent its piercing. It forks into two (once), or turns toward the next enemy in reach (while it has
 * chains left), or is done. Returns whether it flies on.
 */
export function afterProjectileHit(w: World, pr: Projectile, owner: Actor | undefined): boolean {
  if (pr.forkLeft > 0) {
    // Two projectiles go on past the enemy, away from each other at 120 degrees.
    const heading = Math.atan2(pr.vy, pr.vx);
    const speed = Math.hypot(pr.vx, pr.vy);
    for (const side of [-1, 1]) {
      const ang = heading + side * FORK_ANGLE;
      w.projectiles.push({
        ...pr,
        id: w.nextId++,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        forkLeft: 0,
        travelled: 0,
        maxRange: pr.maxRange - pr.travelled * 0.5,
        startX: pr.x,
        startY: pr.y,
      });
      w.events.push({ t: 'projectileSpawned', id: w.projectiles[w.projectiles.length - 1].id });
    }
    return false;
  }
  if (pr.chainLeft > 0 && owner) {
    let best: Actor | null = null;
    let bd = CHAIN_RANGE;
    for (const e of enemiesOfOwner(w, owner)) {
      if (!e.alive || pr.hitIds.includes(e.id)) continue;
      const d = Math.hypot(e.x - pr.x, e.y - pr.y);
      if (d < bd && w.grid.los(pr.x, pr.y, e.x, e.y)) {
        bd = d;
        best = e;
      }
    }
    if (best) {
      const speed = Math.hypot(pr.vx, pr.vy);
      const ang = Math.atan2(best.y - pr.y, best.x - pr.x);
      pr.vx = Math.cos(ang) * speed;
      pr.vy = Math.sin(ang) * speed;
      pr.chainLeft--;
      pr.travelled = 0;
      pr.maxRange = CHAIN_RANGE + 2;
      return true;
    }
  }
  return false;
}

/** A projectile that lands (Arrow Nova) or reaches the end of its way (Tornado Shot) sends its arrows out all round. */
export function projectileLanded(w: World, pr: Projectile, owner: Actor | undefined): void {
  if (!pr.ring || !owner) return;
  const shield = pr.kind === 'shield' ? pr.profile.skill.shield : undefined;
  const p = shield ? scaleProfile(pr.profile, 1 - shield.less / 100) : pr.profile;
  // The shards do not strike again what the shield did.
  const hitIds: number[] = shield ? [...pr.hitIds] : [];
  const phase = w.rngCombat.float(0, Math.PI * 2);
  for (let i = 0; i < pr.ring; i++) {
    const ang =
      pr.kind === 'nova' || shield
        ? phase + (i / pr.ring) * Math.PI * 2
        : w.rngCombat.float(0, Math.PI * 2);
    launch(w, owner, p, pr.hand, pr.x, pr.y, ang, {
      hitIds,
      aimId: pr.aimId,
      range: BURST_RANGE,
      pierce: shield ? 99 : p.pierce,
    });
  }
}

/**
 * A strike that sends more out after it (bolts from the weapon, blades from behind the enemy it struck, balls that land and
 * burst). Only a strike that hit sends them.
 */
export function afterStrike(w: World, a: Actor, act: Action, struck: Actor | null): void {
  const spec = act.profile.skill.afterHit;
  if (!spec || !struck) return;
  const p = scaleProfile(act.profile, spec.mult / 100);
  const hitIds: number[] = [];
  const toward = Math.atan2(struck.y - a.y, struck.x - a.x);
  // The use's element picks what an element strike sends out: an area, a wave of three, a chain of lightning.
  const kind =
    spec.kind === 'element'
      ? act.elem === 3
        ? 'area'
        : act.elem === 2
          ? 'wave'
          : 'chain'
      : spec.kind;
  if (kind === 'area') {
    // The enemies about the one struck, which is not hit again; the area is larger about one that suffers the element's ailment.
    const big =
      spec.ailmentRadius && struck.alive && ailedBy(struck, act.elem ?? 0)
        ? 1 + spec.ailmentRadius / 100
        : 1;
    const r = (spec.explodeRadius ?? 1.4) * p.radiusMult * big;
    w.events.push({
      t: 'explode',
      x: struck.x,
      y: struck.y,
      r,
      dtype: dominantType(act.profile, act.hand),
    });
    for (const e of enemiesOfOwner(w, a))
      if (e.id !== struck.id && Math.hypot(e.x - struck.x, e.y - struck.y) <= r + e.r)
        hit(w, a, e, p, act.hand, Math.hypot(e.x - a.x, e.y - a.y));
  } else if (kind === 'wave') {
    // Three icy projectiles through everything in front.
    const arc = ((spec.arc ?? 70) * Math.PI) / 180;
    for (let i = 0; i < spec.count; i++) {
      const ang = spec.count > 1 ? toward + (i / (spec.count - 1) - 0.5) * arc : toward;
      launch(w, a, p, act.hand, a.x, a.y, ang, {
        hitIds: [],
        aimId: struck.id,
        range: spec.range,
        pierce: 99,
      });
    }
  } else if (kind === 'chain') {
    // A bolt of lightning that leaps from the one struck to the nearest ones, each once.
    const done = new Set<number>([struck.id]);
    let from: Actor = struck;
    for (let i = 0; i < (spec.chains ?? 4); i++) {
      let best: Actor | null = null;
      let bd = CHAIN_RANGE;
      for (const e of enemiesOfOwner(w, a)) {
        if (done.has(e.id)) continue;
        const d = Math.hypot(e.x - from.x, e.y - from.y);
        if (d <= bd && w.grid.los(from.x, from.y, e.x, e.y)) {
          bd = d;
          best = e;
        }
      }
      if (!best) break;
      done.add(best.id);
      w.events.push({ t: 'chain', from: from.id, to: best.id, dtype: 1 });
      hit(w, a, best, p, act.hand, Math.hypot(best.x - a.x, best.y - a.y));
      from = best;
    }
  } else if (spec.kind === 'bolts') {
    const arc = ((spec.arc ?? 85) * Math.PI) / 180;
    for (let i = 0; i < spec.count; i++) {
      const ang = spec.count > 1 ? toward + (i / (spec.count - 1) - 0.5) * arc : toward;
      launch(w, a, p, act.hand, a.x, a.y, ang, { hitIds, aimId: struck.id, range: spec.range });
    }
  } else if (spec.kind === 'blades') {
    // From behind the enemy that was struck, at the others near it; with none, on past it.
    const others = enemiesOfOwner(w, a).filter(
      (e) =>
        e.alive && e.id !== struck.id && Math.hypot(e.x - struck.x, e.y - struck.y) <= spec.range,
    );
    for (let i = 0; i < spec.count; i++) {
      const t = others.length ? others[i % others.length] : null;
      const ang = t
        ? Math.atan2(t.y - struck.y, t.x - struck.x)
        : toward + (w.rngCombat.float(0, 1) - 0.5) * 1.2;
      launch(w, a, p, act.hand, struck.x, struck.y, ang, {
        hitIds,
        aimId: t ? t.id : struck.id,
        range: spec.range,
      });
    }
  } else {
    // Balls: thrown to the ground around the struck enemy, and burst where they land.
    for (let i = 0; i < spec.count; i++) {
      const ang = toward + (w.rngCombat.float(0, 1) - 0.5) * ((270 * Math.PI) / 180) + Math.PI * 0;
      const d = 0.6 + w.rngCombat.float(0, 1) * 1.6;
      const spot = w.grid.collide(struck.x + Math.cos(ang) * d, struck.y + Math.sin(ang) * d, 0.2);
      w.zones.push({
        id: w.nextId++,
        owner: a.id,
        profile: p,
        hand: act.hand,
        x: spot.x,
        y: spot.y,
        x2: undefined,
        y2: undefined,
        radius: (spec.explodeRadius ?? 1.2) * p.radiusMult,
        delayT: 0.3 + w.rngCombat.float(0, 0.3),
        interval: 1,
        pulseT: 0,
        pulsesLeft: 1,
        dtype: dominantType(p, act.hand),
      });
    }
  }
}

/** Whether the enemy suffers the ailment its element goes with (ignite for fire, chill or freeze for cold, shock for lightning). */
function ailedBy(e: Actor, elem: number): boolean {
  return elem === 3
    ? e.ail.ignites.length > 0
    : elem === 2
      ? e.ail.chill > 0 || e.ail.freezeT > 0
      : elem === 1
        ? e.ail.shock > 0
        : false;
}

/** A burst in a cone in front of the shooter that hits everything in it (Galvanic Arrow), once for the shot, not for each arrow. */
export function coneBurst(w: World, a: Actor, act: Action): void {
  const spec = act.profile.skill.cone;
  if (!spec) return;
  const p = scaleProfile(act.profile, spec.mult / 100);
  const facing = Math.atan2(act.aimY - a.y, act.aimX - a.x);
  const half = (spec.angle * Math.PI) / 360;
  w.events.push({
    t: 'swing',
    src: a.id,
    x: a.x,
    y: a.y,
    facing,
    radius: spec.length,
    arc: spec.angle,
    dtype: dominantType(p, act.hand),
    heavy: false,
  });
  for (const e of enemiesOfOwner(w, a)) {
    const d = Math.hypot(e.x - a.x, e.y - a.y);
    if (d > spec.length + e.r) continue;
    const ang = Math.atan2(e.y - a.y, e.x - a.x);
    let diff = ang - facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (d > e.r && Math.abs(diff) > half) continue;
    hit(w, a, e, p, act.hand, d);
  }
}
