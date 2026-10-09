import type { SkillProfile } from '../calc/skill';
import { EXPOSURE_TYPE, STATUSES, STATUS_IDS, type StatusId } from '../data/statuses';
import type { Actor, World } from './types';

/**
 * Statuses on enemies (docs/SPIRIT.md S3): the debuffs that are neither curses nor ailments. A status has a time left, a main
 * magnitude `v` (a slow, a share of attacks that miss), a second one `x` its source gave, and a stack count `n`. What each does
 * is read where it matters: movement in `step`, hit chance in `hit`, damage taken in `targetState` and `rawHit`.
 */
export type StatusState = { t: number; t0: number; v: number; x: number; n: number };
export type Fx = Partial<Record<StatusId, StatusState>>;

export type StatusOpts = { seconds?: number; v?: number; x?: number; stacks?: number };

/** How much of a snare's slow a monster of this rarity takes (the reference game: 40% normal and magic, 30% rare, 25% unique). */
const ENSNARE_RARITY: Record<string, number> = { rare: 0.75, miniboss: 0.625, boss: 0.625 };

/** Put a status on an actor, or renew it; a stacking one gains `stacks`, up to its maximum. */
export function applyStatus(w: World, a: Actor, id: StatusId, o: StatusOpts = {}): void {
  if (!a.alive || a.isPlayer) return;
  const d = STATUSES[id];
  const seconds = o.seconds ?? d.seconds;
  let v = o.v ?? d.v;
  if (id === 'ensnared') v *= ENSNARE_RARITY[a.rarity] ?? 1;
  const x = o.x ?? 0;
  const have = a.fx[id];
  if (!have) {
    a.fx[id] = { t: seconds, t0: seconds, v, x, n: Math.min(d.max, o.stacks ?? 1) };
    w.events.push({ t: 'status', dst: a.id, id });
    return;
  }
  have.n = Math.min(d.max, have.n + (o.stacks ?? (d.max > 1 ? 1 : 0)) || 1);
  // A stronger source takes over; the same one renews the time.
  if (v >= have.v || seconds > have.t) {
    have.v = Math.max(have.v, v);
    have.x = Math.max(have.x, x);
    have.t = Math.max(have.t, seconds);
    have.t0 = Math.max(have.t0, have.t);
  }
}

/** Count the times down; a status that ends is removed. */
export function tickStatuses(a: Actor, dt: number): void {
  for (const key in a.fx) {
    const id = key as StatusId;
    const s = a.fx[id]!;
    s.t -= dt;
    if (s.t <= 0) delete a.fx[id];
  }
}

/** Whether the actor carries any status (most do not, so the hot paths check first). */
function bare(a: Actor): boolean {
  for (const _ in a.fx) return false;
  return true;
}

const NO_TAKEN = { res: [0, 0, 0, 0, 0], vulnType: [0, 0, 0, 0, 0] };

/** What an enemy's movement speed is multiplied by: hindered, maimed, shackled, snared, or held in place. */
export function moveFactor(a: Actor): number {
  if (bare(a)) return 1;
  const fx = a.fx;
  if (fx.immobilised) return 0;
  let m = 1;
  if (fx.hinder) m *= 1 - fx.hinder.v / 100;
  if (fx.maim) m *= 1 - fx.maim.v / 100;
  // A shackle starts strong and fades to nothing over its time.
  if (fx.bound) m *= 1 - (fx.bound.v / 100) * Math.max(0, fx.bound.t / fx.bound.t0);
  if (fx.ensnared) m *= Math.pow(1 - fx.ensnared.v / 100, fx.ensnared.n);
  return Math.max(0, m);
}

/** What the chance to hit of an attacker is multiplied by: a blinded one misses more. */
export function hitChanceFactor(a: Actor): number {
  return a.fx.blind ? 1 - a.fx.blind.v / 100 : 1;
}

/** Points (fraction) off an enemy's chance to block: Overpowered, each stack. */
export function blockLessOf(a: Actor): number {
  const o = a.fx.overpowered;
  return o ? (o.n * o.v) / 100 : 0;
}

/** What the statuses on an enemy do to the damage it takes: resistances lowered, and increased damage taken by type. */
export function statusTaken(a: Actor): { res: number[]; vulnType: number[] } {
  if (bare(a)) return NO_TAKEN;
  const res = [0, 0, 0, 0, 0];
  const vulnType = [0, 0, 0, 0, 0];
  const fx = a.fx;
  for (const id of STATUS_IDS) {
    const type = EXPOSURE_TYPE[id];
    const s = fx[id];
    if (type !== undefined && s) res[type] += s.v;
  }
  if (fx.maim) vulnType[0] += fx.maim.x / 100;
  if (fx.withered) vulnType[4] += (fx.withered.n * fx.withered.v) / 100;
  return { res, vulnType };
}

/** Extra damage (fraction) an enemy takes from this kind of hit, from the statuses that single out traps, mines or projectile attacks. */
export function hitTakenExtra(a: Actor, p: SkillProfile): number {
  let extra = 0;
  const trapLike = p.skill.tags.includes('trap') || p.skill.tags.includes('mine');
  if (trapLike && a.fx.bound) extra += a.fx.bound.x / 100;
  if (a.fx.ensnared && p.isAttack && p.skill.tags.includes('projectile'))
    extra += a.fx.ensnared.x / 100;
  return extra;
}

/** A hit of the player's lands: roll the statuses and the flee the skill can inflict. */
export function rollStatuses(w: World, dst: Actor, p: SkillProfile, blocked = false): void {
  if (!dst.alive || dst.isPlayer) return;
  for (const s of p.statuses) {
    // Overpowered is what a blocked hit does; every other status needs the hit to land.
    if ((s.id === 'overpowered') !== blocked) continue;
    if (s.chance < 1 && !w.rngTrig.chance(s.chance)) continue;
    applyStatus(w, dst, s.id, { seconds: s.seconds, v: s.v, x: s.x });
  }
  if (!blocked && p.fleeChance > 0 && w.rngTrig.chance(p.fleeChance)) {
    // Rare monsters do not flee, and magic ones shrug it off half the time.
    if (dst.rarity === 'normal' || (dst.rarity === 'magic' && w.rngTrig.chance(0.5)))
      dst.fleeT = Math.max(dst.fleeT, 3);
  }
}
