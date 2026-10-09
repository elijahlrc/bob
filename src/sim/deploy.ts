import { skillRange, type DeployKind, type SkillChoice } from '../calc/character';
import { levelValue } from '../calc/gems';
import type { SkillProfile } from '../calc/skill';
import { actorById, fire, segmentDist } from './actions';
import { flaskMask, playerConds, rawHit } from './combat';
import { scaleProfile } from './shots';
import { applySkillDot } from './skillDots';
import type { Action, Actor, World } from './types';

/**
 * Deployables in the sim (COVERAGE 5.3, docs/SPIRIT.md S10): totems and brands stand and shoot on their own, traps go off when an
 * enemy steps close, mines are set off together once enough enemies stand near one. Each uses the character's numbers (a hit from
 * one is the character's skill, fired from where it stands) and lasts a while. The calc sheet counts them as extra uses.
 *
 * What the reference game adds, and is built here: a ballista attacks at half speed; an Ancestral totem is active only while the
 * character is near and gives the character a buff meanwhile; Searing Bond totems cast beams of damage over time at the character and
 * at each other; mines go off in a sequence (Chained Charges: each deals more than the one before) and the aura of a mine adds
 * to the hits against enemies near it (High-Impact: double damage; Pyroclast: fire damage); a Pyroclast mine rains projectiles.
 */
export type Deployable = {
  id: number;
  kind: DeployKind;
  /** The skill choice (key) it fires. */
  key: string;
  x: number;
  y: number;
  /** Seconds it has left. */
  t: number;
  /** Seconds until a totem or brand shoots again, or a trap or mine is armed. */
  fireT: number;
  /** A mine that has been set off: the time it goes (on the world clock), and its place in the sequence. */
  goAt?: number;
  seq?: number;
  /** Where the enemy that set it off stood. */
  aimX?: number;
  aimY?: number;
  /** A totem that is only active while the character is near. */
  active?: boolean;
  /** What the aura of a mine adds to the hits against the enemies near it. */
  aura?: { double: number; min: number; max: number; cap: number; radius: number };
};

/** How long each kind of deployable stands, in seconds (the skill bar counts down over this). */
export const DEPLOY_SECONDS: Record<DeployKind, number> = {
  totem: 10,
  brand: 12,
  trap: 8,
  mine: 14,
};
/** Distance at which an enemy sets off a trap, and at which a mine is set off. */
const TRAP_RADIUS = 1.6;
const MINE_RADIUS = 3.5;
const MINE_ARM = 0.6;
/** Seconds between a mine being set off and going, unless the skill says otherwise; and between the mines of a chain. */
const DETONATION = 0.25;
const CHAIN_GAP = 0.25;
/** How many sets of traps or mines can lie about at once (a set is as many as the skill puts down together). */
const SETS = 3;
/** Where a placed totem stands, toward the target, in tiles from the character. */
const TOTEM_OFFSET = 1.5;
/** A mine looks for something to hit this far from itself, in tiles. */
const MINE_SEEK = 8;

export function choiceByKey(w: World, key: string): SkillChoice | undefined {
  return w.char.actives.find((c) => c.key === key) ?? w.char.secondaries.find((c) => c.key === key);
}

export function deployedCount(w: World, key: string): number {
  let n = 0;
  for (const d of w.deployables) if (d.key === key) n++;
  return n;
}

/** How many of a deploying skill's totems, brands, traps or mines may stand at once. */
export function deployCap(c: SkillChoice, prof: SkillProfile): number {
  return c.deploy === 'totem' || c.deploy === 'brand' ? prof.deployCount : prof.deployCount * SETS;
}

/** Whether the skill has all it can have down already: the AI uses another skill meanwhile. */
export function deployFull(w: World, c: SkillChoice, prof: SkillProfile): boolean {
  if (!c.deploy) return false;
  return deployedCount(w, c.key) >= deployCap(c, prof);
}

/** How long what a skill puts down stands: its own length, or a support's, or the kind's usual. */
export function deploySecondsOf(c: SkillChoice, prof: SkillProfile): number {
  const base =
    prof.deploySeconds > 0
      ? prof.deploySeconds
      : (c.skill.deploySeconds ?? DEPLOY_SECONDS[c.deploy!]);
  return c.deploy === 'trap' || c.deploy === 'mine' ? base : base * prof.skillDuration;
}

const enemies = (w: World): Actor[] =>
  w.actors.filter((e) => !e.isPlayer && e.alive && e.phaseT <= 0);

/** The use of a deploying skill lands: put its totem, brand, traps or mines down. */
export function placeDeployable(w: World, a: Actor, act: Action): void {
  const c = w.char.actives.find((x) => x.skill.id === act.profile.skill.id);
  if (!c?.deploy) return;
  const target = actorById(w, act.targetId);
  const n = act.profile.deployCount;
  // "Increased duration" of totems, traps, mines and brands.
  const seconds = deploySecondsOf(c, act.profile);
  const mineAura = c.skill.mineAura;
  const aura =
    c.deploy === 'mine' && (act.profile.mineDouble > 0 || mineAura)
      ? {
          double: act.profile.mineDouble,
          min: mineAura ? levelValue(mineAura.min, c.skill.level) : 0,
          max: mineAura ? levelValue(mineAura.max, c.skill.level) : 0,
          cap: mineAura ? levelValue(mineAura.cap, c.skill.level) : 0,
          radius: mineAura?.radius ?? MINE_RADIUS,
        }
      : undefined;
  const put = (x: number, y: number) => {
    const spot = w.grid.collide(x, y, 0.3);
    w.deployables.push({
      id: ++w.deploySeq,
      kind: c.deploy!,
      key: c.key,
      x: spot.x,
      y: spot.y,
      t: seconds,
      fireT: c.deploy === 'mine' ? MINE_ARM : c.deploy === 'trap' ? 0.3 : 0.4,
      aura,
    });
    w.events.push({ t: 'deploy', kind: c.deploy!, x: spot.x, y: spot.y, end: false });
  };
  if (c.deploy === 'totem') {
    // Only as many as the skill allows stand: the oldest gives way.
    const mine = w.deployables.filter((d) => d.key === c.key);
    if (mine.length >= n) w.deployables.splice(w.deployables.indexOf(mine[0]), 1);
    const dx = target ? target.x - a.x : 1;
    const dy = target ? target.y - a.y : 0;
    const len = Math.hypot(dx, dy) || 1;
    // A totem of beams stands beyond the enemy, so that the beam to the character crosses it.
    const off = c.skill.bond && target ? len + 1 : TOTEM_OFFSET;
    put(a.x + (dx / len) * off, a.y + (dy / len) * off);
    return;
  }
  const tx = target ? target.x : a.x;
  const ty = target ? target.y : a.y;
  if (c.deploy === 'brand') {
    const mine = w.deployables.filter((d) => d.key === c.key);
    if (mine.length >= n) w.deployables.splice(w.deployables.indexOf(mine[0]), 1);
    put(tx, ty);
    return;
  }
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    put(tx + (n > 1 ? Math.cos(ang) * 1.2 : 0), ty + (n > 1 ? Math.sin(ang) * 1.2 : 0));
  }
}

/** The character's skill, fired from where a deployable stands at an enemy. */
function shoot(
  w: World,
  d: Deployable,
  c: SkillChoice,
  target: Actor,
  scale = 1,
  aim?: { x: number; y: number },
): void {
  let prof = w.char.profile(c, playerConds(w, target), flaskMask(w));
  if (scale !== 1) prof = scaleProfile(prof, scale);
  const from: Actor = Object.create(w.player) as Actor;
  from.x = d.x;
  from.y = d.y;
  const ax = aim?.x ?? target.x;
  const ay = aim?.y ?? target.y;
  from.facing = Math.atan2(ay - d.y, ax - d.x);
  const act: Action = {
    profile: prof,
    which: 'deployed',
    hand: 0,
    duration: prof.useTime,
    elapsed: prof.useTime,
    fired: true,
    echoes: 0,
    targetId: target.id,
    aimX: ax,
    aimY: ay,
  };
  w.events.push({ t: 'use', src: w.player.id, skill: prof.skill.id });
  fire(w, from, act);
}

/** The character's skill fired from a spot at an enemy, at a share of its damage (the mirage archer). */
export function shootFrom(
  w: World,
  x: number,
  y: number,
  c: SkillChoice,
  target: Actor,
  scale: number,
): void {
  const d: Deployable = { id: 0, kind: 'totem', key: c.key, x, y, t: 1, fireT: 0 };
  shoot(w, d, c, target, scale);
}

/** The enemy nearest to a point within reach, if any. */
function nearestFoe(foes: Actor[], x: number, y: number, reach: number): Actor | null {
  let best: Actor | null = null;
  let bd = Infinity;
  for (const e of foes) {
    const dist = Math.hypot(e.x - x, e.y - y);
    if (dist <= reach + e.r && dist < bd) {
      best = e;
      bd = dist;
    }
  }
  return best;
}

/**
 * A mine is set off: every armed mine of its skill goes, in order of nearness to the enemy that did it. They go together after
 * the detonation time, or one after another when the skill chains them.
 */
function setOffMines(w: World, key: string, c: SkillChoice, by: Actor): void {
  const prof = w.char.profile(c, w.char.configConds, flaskMask(w));
  const det = c.skill.detonation ?? DETONATION;
  const chained = prof.mineChain > 0;
  const set = w.deployables
    .filter((d) => d.key === key && d.kind === 'mine' && d.fireT <= 0 && d.goAt === undefined)
    .sort((a, b) => Math.hypot(a.x - by.x, a.y - by.y) - Math.hypot(b.x - by.x, b.y - by.y));
  set.forEach((d, i) => {
    d.goAt = w.t + det + (chained ? CHAIN_GAP * i : 0);
    d.seq = i;
    d.aimX = by.x;
    d.aimY = by.y;
  });
}

/** A mine goes: its skill's burst at the nearest enemy, harder for the mines that went before it, and the rain that follows. */
function detonate(w: World, d: Deployable, c: SkillChoice, foes: Actor[]): void {
  const target =
    nearestFoe(foes, d.x, d.y, MINE_SEEK) ??
    nearestFoe(foes, d.aimX ?? d.x, d.aimY ?? d.y, MINE_SEEK);
  if (!target) return;
  const prof = w.char.profile(c, playerConds(w, target), flaskMask(w));
  const seq = d.seq ?? 0;
  shoot(w, d, c, target, 1 + (prof.mineChain * seq) / 100);
  // Projectiles rain down around it, a smaller burst each, more of them the further along in the sequence.
  const rain = c.skill.mineRain;
  if (rain) {
    const n = rain.count + Math.floor(seq / Math.max(1, rain.perPrior));
    const small = { ...prof, radiusMult: prof.radiusMult * rain.radius };
    for (let i = 0; i < n; i++) {
      const ang = w.rngTrig.float(0, Math.PI * 2);
      const r = rain.spread * Math.sqrt(w.rngTrig.float(0, 1));
      const spot = { x: d.x + Math.cos(ang) * r, y: d.y + Math.sin(ang) * r };
      const from: Actor = Object.create(w.player) as Actor;
      from.x = d.x;
      from.y = d.y;
      const act: Action = {
        profile: small,
        which: 'deployed',
        hand: 0,
        duration: prof.useTime,
        elapsed: prof.useTime,
        fired: true,
        echoes: 0,
        targetId: target.id,
        aimX: spot.x,
        aimY: spot.y,
      };
      fire(w, from, act);
    }
  }
}

/** What the mines near an enemy add to the hits against it: a chance to deal double damage, and some fire damage. */
export function mineAuraAt(
  w: World,
  x: number,
  y: number,
): { double: number; min: number; max: number } | null {
  let double = 0;
  let min = 0;
  let max = 0;
  let cap = 0;
  for (const d of w.deployables) {
    const a = d.aura;
    if (!a || d.kind !== 'mine' || Math.hypot(d.x - x, d.y - y) > a.radius) continue;
    double += a.double;
    min += a.min;
    max += a.max;
    cap = Math.max(cap, a.cap);
  }
  if (double <= 0 && max <= 0) return null;
  const k = cap > 0 && max > cap ? cap / max : 1;
  return { double: Math.min(100, double), min: min * k, max: max * k };
}

/** The extra damage the aura of a mine adds to a hit that landed (fire, from Pyroclast). */
export function mineAuraHit(w: World, dst: Actor): void {
  const a = mineAuraAt(w, dst.x, dst.y);
  if (a && a.max > 0) rawHit(w, dst, a.min + w.rngCombat.float(0, 1) * (a.max - a.min), 3, 'Mine');
}

/** The beams of Cinder Bond: from each of its totems to the character and to the other totems, burning what they cross. */
function bondBeams(w: World, bonds: Deployable[], c: SkillChoice, foes: Actor[]): void {
  const spec = c.skill.bond!;
  const prof = w.char.profile(c, w.char.configConds, flaskMask(w));
  const p = w.player;
  const segs: [Deployable, number, number][] = [];
  for (const d of bonds) {
    if (Math.hypot(d.x - p.x, d.y - p.y) <= spec.range && w.grid.los(d.x, d.y, p.x, p.y))
      segs.push([d, p.x, p.y]);
    for (const o of bonds)
      if (
        o.id > d.id &&
        Math.hypot(d.x - o.x, d.y - o.y) <= spec.range &&
        w.grid.los(d.x, d.y, o.x, o.y)
      )
        segs.push([d, o.x, o.y]);
  }
  for (const e of foes)
    for (const [d, x2, y2] of segs) {
      const near =
        segmentDist(e.x, e.y, d.x, d.y, x2, y2) <= spec.width / 2 + e.r ||
        Math.hypot(e.x - d.x, e.y - d.y) <= spec.end + e.r ||
        Math.hypot(e.x - x2, e.y - y2) <= spec.end + e.r;
      if (near) {
        // The damage of several beams does not stack: one debuff, renewed.
        applySkillDot(w, e, prof, { seconds: 0.5 });
        break;
      }
    }
}

/** Totems and brands shoot when an enemy is in reach; traps and mines go off; everything ends when its time is up. */
export function tickDeployables(w: World, dt: number): void {
  if (w.deployables.length === 0) return;
  const foes = enemies(w);
  const p = w.player;
  const bonds = new Map<string, Deployable[]>();
  let j = 0;
  for (const d of w.deployables) {
    d.t -= dt;
    d.fireT -= dt;
    const c = choiceByKey(w, d.key);
    let keep = d.t > 0 && !!c;
    if (keep && c && d.kind === 'totem' && c.skill.ancestral) {
      // An Ancestral totem is active while the character is near and in sight of it, and gives the character its buff.
      const an = c.skill.ancestral;
      d.active = Math.hypot(d.x - p.x, d.y - p.y) <= an.range && w.grid.los(d.x, d.y, p.x, p.y);
      if (d.active) w.buffT[an.buff] = Math.max(w.buffT[an.buff], 0.3);
    }
    if (keep && c && d.kind === 'totem' && c.skill.bond) {
      const list = bonds.get(d.key) ?? [];
      list.push(d);
      bonds.set(d.key, list);
    } else if (keep && c && d.kind === 'mine') {
      if (d.goAt !== undefined) {
        if (w.t >= d.goAt) {
          detonate(w, d, c, foes);
          keep = false;
        }
      } else if (d.fireT <= 0) {
        // An armed mine with an enemy near sets the whole set off.
        const by = nearestFoe(foes, d.x, d.y, MINE_RADIUS);
        if (by) setOffMines(w, d.key, c, by);
        else d.fireT = 0.05;
      }
    } else if (keep && c && d.fireT <= 0) {
      if (d.kind === 'totem' || d.kind === 'brand') {
        if (d.active === false) {
          d.fireT = 0.1;
        } else {
          const prof = w.char.profile(c, w.char.configConds, flaskMask(w));
          const reach = skillRange(prof);
          let best: Actor | null = null;
          let bd = Infinity;
          for (const e of foes) {
            const dist = Math.hypot(e.x - d.x, e.y - d.y);
            if (dist <= reach + e.r && dist < bd && w.grid.los(d.x, d.y, e.x, e.y)) {
              best = e;
              bd = dist;
            }
          }
          if (best) {
            shoot(w, d, c, best);
            // A ballista attacks at half speed.
            d.fireT = Math.max(0.2, prof.useTime * (c.skill.ballista ? 2 : 1));
          } else d.fireT = 0.1;
        }
      } else {
        const best = nearestFoe(foes, d.x, d.y, TRAP_RADIUS);
        if (best) {
          shoot(w, d, c, best);
          keep = false;
        } else d.fireT = 0.05;
      }
    }
    if (keep) w.deployables[j++] = d;
    else w.events.push({ t: 'deploy', kind: d.kind, x: d.x, y: d.y, end: true });
  }
  w.deployables.length = j;
  // Beams are cast four times a second.
  if (bonds.size > 0 && Math.floor(w.t * 4) !== Math.floor((w.t - dt) * 4))
    for (const [key, list] of bonds) {
      const c = choiceByKey(w, key);
      if (c) bondBeams(w, list, c, foes);
    }
}
