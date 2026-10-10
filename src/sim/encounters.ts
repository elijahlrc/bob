import { BRACE_HALF, TYPE_WINDOWS, hasEncounter } from '../data/encounters';
import { angleDiff } from '../core/math';
import { startAction } from './actions';
import { monsterConds } from './combat';
import type { Actor, World } from './types';

/**
 * Sidearms and windows (docs/ENCOUNTERS.md 3 and 5): the second attack a monster uses on its way in, and the spells in which
 * it cannot be hurt. The data is `data/encounters.ts`; the state is `Actor.enc`, made only for the types that have any.
 */

/** Give a new monster its encounter state, with the first sidearm and window a random part of their time away. */
export function initEncounter(w: World, a: Actor): void {
  const type = a.mon?.spec.type;
  if (!type || !hasEncounter(type)) return;
  const side = a.mon!.sidearm?.spec;
  const win = TYPE_WINDOWS[type];
  a.enc = {
    sideT: side ? side.every * w.rngAi.float(0.25, 1) : 0,
    winT: win ? win.every * w.rngAi.float(0.3, 1) : 0,
    warnT: 0,
    openT: 0,
  };
}

/**
 * A chasing monster uses its sidearm when it is ready, the character is in its window of range and in sight, and it is not
 * already acting. Returns whether it started one.
 */
export function trySidearm(w: World, m: Actor, dt: number, d: number, los: boolean): boolean {
  const side = m.mon!.sidearm;
  const e = m.enc;
  if (!side || !e) return false;
  e.sideT -= dt;
  if (e.sideT > 0 || m.action || !los) return false;
  const s = side.spec;
  if (d < s.from || d > s.to) return false;
  const p = w.player;
  // A pack does not carpet the floor: no lob where a pool of the same kind lies already.
  const zone = s.shape?.id === 'lob' ? (s.shape.zone ?? 'caustic') : null;
  if (zone && w.effects.some((z) => z.kind === zone && Math.hypot(z.x - p.x, z.y - p.y) < 3)) {
    e.sideT = 1;
    return false;
  }
  e.sideT = s.every;
  startAction(w, m, 'monster', side.profile(monsterConds(m)), p);
  return true;
}

/** Whether a monster is in its window, or giving its tell (it stands still for both). */
export function inWindow(m: Actor): boolean {
  return m.enc !== undefined && (m.enc.warnT > 0 || m.enc.openT > 0);
}

/** Run a chasing monster's window: the clock, the tell, the time it is open; a stun ends it. */
export function tickWindow(w: World, m: Actor, dt: number): void {
  const e = m.enc;
  const spec = m.mon && TYPE_WINDOWS[m.mon.spec.type];
  if (!e || !spec) return;
  const p = w.player;
  if (e.openT > 0 || e.warnT > 0) {
    // A braced shield turns to follow the character.
    m.facing = Math.atan2(p.y - m.y, p.x - m.x);
    if (m.stunT > 0) {
      e.openT = 0;
      e.warnT = 0;
      return;
    }
    if (e.warnT > 0) {
      e.warnT -= dt;
      if (e.warnT <= 0) e.openT = spec.seconds;
    } else e.openT -= dt;
    return;
  }
  if (e.winT > 0) e.winT -= dt;
}

/**
 * A monster whose window is due opens it, between blows, when the character is near. The AI asks before it chooses its
 * next blow (a monster in a fight is otherwise never between blows). Returns whether it did.
 */
export function tryWindow(w: World, m: Actor): boolean {
  const e = m.enc;
  const spec = m.mon && TYPE_WINDOWS[m.mon.spec.type];
  if (!e || !spec || e.winT > 0 || m.action || m.stunT > 0 || m.state !== 'chase') return false;
  const p = w.player;
  if (Math.hypot(p.x - m.x, p.y - m.y) > spec.near) return false;
  e.winT = spec.every;
  e.warnT = spec.warn;
  m.facing = Math.atan2(p.y - m.y, p.x - m.x);
  w.events.push({ t: 'window', id: m.id, kind: spec.id });
  return true;
}

/** Whether a monster's open window stops a hit from this attacker (a Brace: from the front). */
export function windowStops(dst: Actor, src: Actor): boolean {
  const e = dst.enc;
  if (!e || e.openT <= 0 || !dst.mon) return false;
  const spec = TYPE_WINDOWS[dst.mon.spec.type];
  if (spec?.id === 'brace') {
    const from = Math.atan2(src.y - dst.y, src.x - dst.x);
    return Math.abs(angleDiff(dst.facing, from)) <= BRACE_HALF;
  }
  return false;
}
