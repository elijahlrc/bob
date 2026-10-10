import {
  ADAPT_RESIST,
  ADAPT_SECONDS,
  ADAPT_SHARE,
  BRACE_HALF,
  COUNTER_GAP,
  COUNTER_MULT,
  SANCTUARY_RANGE,
  TYPE_WINDOWS,
  hasEncounter,
  modeOf,
} from '../data/encounters';
import { angleDiff } from '../core/math';
import type { SkillProfile } from '../calc/skill';
import { startAction } from './actions';
import { castPattern } from './blasts';
import { startCharge } from './abilities';
import { blinkBehind, openZone } from './factions';
import { monsterConds, monsterHitOf, rawHit } from './combat';
import type { Action, Actor, EncState, World } from './types';

/**
 * Sidearms, windows and modes (docs/ENCOUNTERS.md 3, 5 and 6): the second attack a monster uses on its way in, the spells in
 * which it cannot be hurt, and what it does when it is hurt in a certain way. The data is `data/encounters.ts`; the state is
 * `Actor.enc`, made only for the types that have any (and monsters with the Adaptive mod).
 */

/** Bits of `EncState.done`: the modes that happen once. */
const DONE_PETRIFY = 1;
const DONE_RITES = 2;
const DONE_QUENCH = 4;

/** Seconds over which a burst of damage, and a run of hits, fade from the count. */
const BURST_TAU = 1.2;
const HITS_TAU = 2;

/** The open Sanctuaries of a world (a hit on any monster asks whether one covers it). */
const sanctuaries = new WeakMap<World, Actor[]>();

/** Give a new monster its encounter state, with the first sidearm and window a random part of their time away. */
export function initEncounter(w: World, a: Actor): void {
  const type = a.mon?.spec.type;
  if (!type || (!hasEncounter(type) && !a.modIds.includes('adaptive'))) return;
  const side = a.mon!.sidearm?.spec;
  const win = TYPE_WINDOWS[type];
  const enc: EncState = {
    sideT: side ? side.every * w.rngAi.float(0.25, 1) : 0,
    winT: win ? win.every * w.rngAi.float(0.3, 1) : 0,
    warnT: 0,
    openT: 0,
    burst: 0,
    hits: 0,
    lost: [0, 0, 0, 0, 0],
    plates: modeOf(type, 'aegis')?.max ?? 0,
    calmT: 0,
    vulnT: 0,
    stoneT: 0,
    ventT: 0,
    gorgedT: 0,
    ritesT: 0,
    modeCd: 0,
    counterCd: 0,
    done: 0,
    fading: false,
    ventCross: false,
    molten: 0,
    wasStunned: false,
  };
  a.enc = enc;
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

/** Whether a monster is holding still for a window, a tell, a stone skin or a chant. */
export function inWindow(m: Actor): boolean {
  const e = m.enc;
  return e !== undefined && (e.warnT > 0 || e.openT > 0 || e.stoneT > 0 || e.ritesT > 0);
}

/**
 * A monster whose window is due opens it, between blows, when the character is near. The AI asks before it chooses its
 * next blow (a monster in a fight is otherwise never between blows). Returns whether it did.
 */
export function tryWindow(w: World, m: Actor): boolean {
  const e = m.enc;
  const spec = m.mon && TYPE_WINDOWS[m.mon.spec.type];
  if (!e || !spec || e.winT > 0 || e.vulnT > 0 || m.action || m.stunT > 0 || m.state !== 'chase')
    return false;
  const p = w.player;
  if (Math.hypot(p.x - m.x, p.y - m.y) > spec.near) return false;
  // A Sanctuary is sung for others: with nobody near to shelter, it waits.
  if (spec.id === 'sanctuary' && !w.actors.some((o) => sheltered(m, o))) {
    e.winT = 1;
    return false;
  }
  e.winT = spec.every;
  e.warnT = spec.warn;
  m.facing = Math.atan2(p.y - m.y, p.x - m.x);
  w.events.push({ t: 'window', id: m.id, kind: spec.id });
  return true;
}

/** Whether a Sanctuary sung by `s` covers `o`. */
function sheltered(s: Actor, o: Actor): boolean {
  return (
    o !== s &&
    o.alive &&
    !o.isPlayer &&
    o.mon !== undefined &&
    Math.hypot(o.x - s.x, o.y - s.y) <= SANCTUARY_RANGE
  );
}

/** End a monster's window at once (a stun, a broken guard). */
function closeWindow(w: World, m: Actor): void {
  const e = m.enc!;
  e.warnT = 0;
  e.openT = 0;
  const list = sanctuaries.get(w);
  if (list?.includes(m)) list.splice(list.indexOf(m), 1);
}

/** Run a chasing monster's window and modes for one tick. */
export function tickEncounter(w: World, m: Actor, dt: number): void {
  const e = m.enc;
  if (!e || !m.mon) return;
  const type = m.mon.spec.type;
  const p = w.player;
  e.burst *= Math.exp(-dt / BURST_TAU);
  e.hits *= Math.exp(-dt / HITS_TAU);
  e.calmT += dt;
  if (e.modeCd > 0) e.modeCd -= dt;
  if (e.counterCd > 0) e.counterCd -= dt;
  if (e.vulnT > 0) e.vulnT -= dt;
  if (e.gorgedT > 0) e.gorgedT -= dt;

  // Broken guard: the start of a stun drops the guard and leaves it exposed.
  const stunned = m.stunT > 0;
  if (stunned && !e.wasStunned) {
    const bg = modeOf(type, 'brokenGuard');
    if (bg) {
      e.vulnT = bg.seconds ?? 3;
      e.plates = 0;
      closeWindow(w, m);
      w.events.push({ t: 'window', id: m.id, kind: 'broken' });
    }
  }
  e.wasStunned = stunned;

  // The window: its tell, then the time it is open; a stun ends it.
  const spec = TYPE_WINDOWS[type];
  if (spec && (e.openT > 0 || e.warnT > 0)) {
    if (spec.id !== 'sanctuary') m.facing = Math.atan2(p.y - m.y, p.x - m.x);
    if (stunned) closeWindow(w, m);
    else if (e.warnT > 0) {
      e.warnT -= dt;
      if (e.warnT <= 0) {
        e.openT = spec.seconds;
        if (spec.id === 'sanctuary') {
          const list = sanctuaries.get(w) ?? [];
          list.push(m);
          sanctuaries.set(w, list);
        }
      }
    } else {
      e.openT -= dt;
      if (e.openT <= 0) closeWindow(w, m);
    }
  } else if (e.winT > 0) e.winT -= dt;

  // Aegis: the plates come back when it has been left alone.
  const aegis = modeOf(type, 'aegis');
  if (aegis && e.plates < (aegis.max ?? 4) && e.calmT >= (aegis.seconds ?? 5) && e.vulnT <= 0) {
    e.plates = aegis.max ?? 4;
    w.events.push({ t: 'window', id: m.id, kind: 'aegis' });
  }

  // Fade: out of reach, then back behind the character.
  if (e.fading) {
    m.phaseT -= dt;
    if (m.phaseT <= 0) {
      m.phaseT = 0;
      e.fading = false;
      blinkBehind(w, m);
    }
  }

  // Petrify: at its mark it turns to stone, mends, and bursts.
  const pet = modeOf(type, 'petrify');
  if (pet && !(e.done & DONE_PETRIFY) && m.life <= m.def.maxLife * (pet.at ?? 0.4)) {
    e.done |= DONE_PETRIFY;
    const secs = pet.seconds ?? 3;
    e.stoneT = secs;
    m.action = null;
    w.events.push({ t: 'window', id: m.id, kind: 'petrify' });
    w.effects.push({
      id: w.nextId++,
      x: m.x,
      y: m.y,
      radius: 2.6,
      t: 0.8,
      total: 0.8,
      kind: 'slam',
      damage: monsterHitOf(m) * 1.2,
      dtype: 0,
      faction: 1,
      shape: 'circle',
      delay: Math.max(0, secs - 0.8),
      label: 'Shatter',
      owner: m.id,
    });
  }
  if (e.stoneT > 0) {
    e.stoneT -= dt;
    m.life = Math.min(
      m.def.maxLife,
      m.life + (m.def.maxLife * (pet?.heal ?? 0.15) * dt) / (pet?.seconds ?? 3),
    );
  }

  // Core vent: a second Cross half-way through.
  if (e.ventT > 0) {
    e.ventT -= dt;
    if (!e.ventCross && e.ventT <= 2) {
      e.ventCross = true;
      castAt(w, m, 'cross');
    }
  }

  // Last rites: at its mark it chants, and the bodies round it burst when it ends.
  const rites = modeOf(type, 'lastRites');
  if (rites && !(e.done & DONE_RITES) && m.life <= m.def.maxLife * (rites.at ?? 0.3)) {
    e.done |= DONE_RITES;
    e.ritesT = rites.seconds ?? 3;
    m.action = null;
    w.events.push({ t: 'window', id: m.id, kind: 'rites' });
    const hit = monsterHitOf(m);
    const near = w.corpses
      .filter((c) => Math.hypot(c.x - m.x, c.y - m.y) <= (rites.range ?? 8))
      .slice(0, 6);
    for (const c of near)
      w.effects.push({
        id: w.nextId++,
        x: c.x,
        y: c.y,
        radius: 1.6,
        t: e.ritesT,
        total: e.ritesT,
        kind: 'slam',
        damage: hit,
        dtype: 4,
        faction: 1,
        shape: 'circle',
        label: 'Last rites',
        owner: m.id,
      });
  }
  if (e.ritesT > 0) {
    if (stunned) cancelRites(w, m);
    else {
      e.ritesT -= dt;
      // The bodies are spent in the burst.
      if (e.ritesT <= 0)
        w.corpses = w.corpses.filter((c) => Math.hypot(c.x - m.x, c.y - m.y) > (rites?.range ?? 8));
    }
  }
}

/** A Last rites stopped (a stun, its death): its bursts do not come. */
function cancelRites(w: World, m: Actor): void {
  m.enc!.ritesT = 0;
  w.effects = w.effects.filter((x) => !(x.owner === m.id && x.label === 'Last rites'));
  w.events.push({ t: 'window', id: m.id, kind: 'ritesBroken' });
}

/** Cast one of the patterns from a monster at the character, outside an action (a Core vent's Cross). */
function castAt(w: World, m: Actor, id: 'cross'): void {
  const p = w.player;
  const act = { profile: m.mon!.profile(0), aimX: p.x, aimY: p.y } as Action;
  castPattern(w, m, act, id);
}

/** A monster was attacked (whatever came of it): an Aegis waits its time again. */
export function noteAttacked(m: Actor): void {
  if (m.enc) m.enc.calmT = 0;
}

/**
 * Whether a monster's guard turns a hit aside: a Brace from the front, a plate of an Aegis, a stone skin, or a Sanctuary
 * that covers it. A plate is spent by the hit it stops.
 */
export function turnsAside(w: World, dst: Actor, src: Actor): boolean {
  const e = dst.enc;
  if (e) {
    if (e.stoneT > 0) return true;
    if (e.plates > 0) {
      e.plates--;
      w.events.push({ t: 'window', id: dst.id, kind: 'plate' });
      return true;
    }
    if (e.openT > 0 && dst.mon && TYPE_WINDOWS[dst.mon.spec.type]?.id === 'brace') {
      const from = Math.atan2(src.y - dst.y, src.x - dst.x);
      if (Math.abs(angleDiff(dst.facing, from)) <= BRACE_HALF) return true;
    }
  }
  const list = sanctuaries.get(w);
  if (list && list.length > 0)
    for (const s of list) if (s.alive && s.enc!.openT > 0 && sheltered(s, dst)) return true;
  return false;
}

/** The damage a hit on a monster does, after its modes: exposed, quenched, swollen, or feeding on fire. */
export function modeTaken(w: World, dst: Actor, dmg: number[]): void {
  const e = dst.enc;
  if (!e || !dst.mon) return;
  const type = dst.mon.spec.type;
  if (e.vulnT > 0 || e.ventT > 0) {
    const t = 1 + (modeOf(type, e.ventT > 0 ? 'coreVent' : 'brokenGuard')?.taken ?? 0.5);
    for (let i = 0; i < 5; i++) dmg[i] *= t;
  }
  if (e.done & DONE_QUENCH) dmg[0] *= 1 + (modeOf(type, 'quench')?.taken ?? 0.3);
  if (e.gorgedT > 0) {
    const t = 1 + (modeOf(type, 'gorged')?.taken ?? -0.2);
    for (let i = 0; i < 5; i++) dmg[i] *= t;
  }
  const molten = modeOf(type, 'molten');
  if (molten && dmg[3] > 0) {
    // Fire feeds it instead.
    dmg[3] = 0;
    if (e.molten < (molten.max ?? 5)) {
      e.molten++;
      w.events.push({ t: 'window', id: dst.id, kind: 'molten' });
    }
  }
}

/** Count what a monster has taken, and fire the modes that answer it (Fade, Core vent, Quench, Riled, Adaptive). */
export function noteTaken(w: World, m: Actor, dmg: number[]): void {
  const e = m.enc;
  if (!e || !m.mon || !m.alive) return;
  const type = m.mon.spec.type;
  const max = m.def.maxLife;
  let total = 0;
  for (let i = 0; i < 5; i++) {
    total += dmg[i];
    e.lost[i] += dmg[i] / max;
  }
  e.burst += total / max;
  e.hits += 1;
  const fade = modeOf(type, 'fade');
  if (fade && !e.fading && e.modeCd <= 0 && e.burst >= (fade.share ?? 0.25)) {
    e.fading = true;
    e.modeCd = fade.cooldown ?? 8;
    m.phaseT = fade.seconds ?? 1.5;
    m.action = null;
    w.events.push({ t: 'window', id: m.id, kind: 'fade' });
  }
  const vent = modeOf(type, 'coreVent');
  if (vent && e.ventT <= 0 && e.modeCd <= 0 && e.burst >= (vent.share ?? 0.3)) {
    e.ventT = vent.seconds ?? 4;
    e.modeCd = vent.cooldown ?? 14;
    e.ventCross = false;
    w.events.push({ t: 'window', id: m.id, kind: 'vent' });
    castAt(w, m, 'cross');
  }
  const quench = modeOf(type, 'quench');
  if (quench && !(e.done & DONE_QUENCH) && e.lost[2] >= (quench.share ?? 0.2)) {
    e.done |= DONE_QUENCH;
    w.events.push({ t: 'window', id: m.id, kind: 'quench' });
  }
  const riled = modeOf(type, 'riled');
  if (riled && e.modeCd <= 0 && e.hits >= (riled.hits ?? 6) && !m.dashT && !m.windT) {
    e.modeCd = riled.cooldown ?? 8;
    e.hits = 0;
    w.events.push({ t: 'window', id: m.id, kind: 'riled' });
    startCharge(w, m, 0.35);
  }
  if (m.modIds.includes('adaptive'))
    for (let i = 1; i < 5; i++)
      if (e.lost[i] >= ADAPT_SHARE) {
        e.lost[i] = 0;
        m.resShift[i] = ADAPT_RESIST;
        m.resShiftT = ADAPT_SECONDS;
        w.events.push({ t: 'window', id: m.id, kind: `adapt${i}` });
      }
}

/** A Counter-stance answers a melee blow with a heavy one of its own. */
export function counterBlow(w: World, dst: Actor, src: Actor, p: SkillProfile): void {
  const e = dst.enc;
  if (!e || e.openT <= 0 || e.counterCd > 0 || !src.isPlayer || !dst.alive) return;
  if (p.skill.behaviour.kind !== 'melee' || TYPE_WINDOWS[dst.mon!.spec.type]?.id !== 'counter')
    return;
  e.counterCd = COUNTER_GAP;
  dst.facing = Math.atan2(src.y - dst.y, src.x - dst.x);
  w.events.push({
    t: 'swing',
    src: dst.id,
    x: dst.x,
    y: dst.y,
    facing: dst.facing,
    radius: 1.6,
    arc: 110,
    dtype: 0,
    heavy: true,
  });
  rawHit(w, src, monsterHitOf(dst) * COUNTER_MULT, 0, 'Counter-stance');
}

/** A monster that has eaten swells (Gorged). */
export function noteDevoured(w: World, m: Actor): void {
  const g = m.mon && modeOf(m.mon.spec.type, 'gorged');
  if (!g || !m.enc) return;
  m.enc.gorgedT = g.seconds ?? 10;
  w.events.push({ t: 'window', id: m.id, kind: 'gorged' });
}

/** What the modes do to a monster's damage (Molten) and pace (Quench, Gorged). */
export function encDamageMult(m: Actor): number {
  const e = m.enc;
  if (!e || e.molten === 0) return 1;
  return 1 + e.molten * (modeOf(m.mon!.spec.type, 'molten')?.step ?? 0.12);
}
export function encMoveMult(m: Actor): number {
  const e = m.enc;
  if (!e) return 1;
  let k = 1;
  if (e.done & DONE_QUENCH) k *= 1 - (modeOf(m.mon!.spec.type, 'quench')?.slow ?? 0.5);
  if (e.gorgedT > 0) k *= 1 - (modeOf(m.mon!.spec.type, 'gorged')?.slow ?? 0.3);
  return k;
}
/** Whether a Slag Brute has been quenched (it leaves no burning trail). */
export const quenched = (m: Actor): boolean => !!m.enc && (m.enc.done & DONE_QUENCH) !== 0;

/** A monster with encounter state dies: a swollen Gorger bursts, a chant stops, a Wailer near grieves. */
export function onEncounterDeath(w: World, a: Actor): void {
  const e = a.enc;
  if (e?.gorgedT && e.gorgedT > 0) openZone(w, a.x, a.y, 2.2, 4, 'caustic', monsterHitOf(a) * 0.4);
  if (e && e.ritesT > 0) cancelRites(w, a);
  if (e) closeWindow(w, a);
  for (const o of w.actors) {
    if (!o.alive || !o.enc || o === a || !o.mon) continue;
    const g = modeOf(o.mon.spec.type, 'grieving');
    if (g && Math.hypot(o.x - a.x, o.y - a.y) <= (g.range ?? 6) && o.enc.sideT > 0) {
      o.enc.sideT = 0;
      w.events.push({ t: 'window', id: o.id, kind: 'grief' });
    }
  }
}

/** Marked (docs/ENCOUNTERS.md 7): the pack whose Handler marked the character, until when, and how much harder it hits. */
const marks = new WeakMap<World, { pack: number; until: number }>();
export const MARK_SECONDS = 4;
export const MARK_MORE = 0.2;

/** A Handler marks the character for its pack. */
export function markPlayer(w: World, by: Actor): void {
  marks.set(w, { pack: by.pack, until: w.t + MARK_SECONDS });
  w.events.push({ t: 'window', id: by.id, kind: 'mark' });
}

/** The mark on the character now, if any. */
export function markOf(w: World): { pack: number; until: number } | null {
  const m = marks.get(w);
  return m && m.until > w.t ? m : null;
}

/** What a monster's hit on the character is multiplied by: more if its pack has marked it. */
export function markedMult(w: World, src: Actor): number {
  const m = markOf(w);
  return m && src.pack === m.pack ? 1 + MARK_MORE : 1;
}
