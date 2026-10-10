import { abilitiesOf, type AbilityDef } from '../data/abilities';
import { monsterHitOf } from './combat';
import {
  blinkBehind,
  hexPlayerAtRandom,
  openZone,
  raise as raiseCorpse,
  spawnBeside,
} from './factions';
import { noteDevoured, quenched } from './encounters';
import type { Actor, World } from './types';

/**
 * The active abilities of the monster types (docs/ENEMIES.md 7.3), run every tick for a chasing monster. A type lists its
 * abilities in `data/abilities.ts`; the code for each is here. The numbers come from the list, so a faction that wants a
 * faster blink or a bigger slam changes a row, not a function.
 *
 * The first eight were the `switch` of `tickFactionBehaviour` and keep its timers (`skillT`, `blinkT`, `channelT`), which
 * the tests set directly; the abilities that came after use the per-ability timers `abT`.
 */

type Ctx = {
  w: World;
  m: Actor;
  dt: number;
  /** Distance to the player. */
  d: number;
  ab: AbilityDef;
  /** The index of the ability in the type's list (its timer in `abT`). */
  i: number;
};

/** Tiles a second of a leap and of a charge. */
const LEAP_SPEED = 15;
const CHARGE_SPEED = 10;
/** A charge runs on this far past the place it was aimed at. */
const CHARGE_OVERSHOOT = 3;

/** Run a leap or a charge: cooldown, then a warning on the ground, then the rush itself. */
function dashing({ w, m, dt, d, ab, i }: Ctx, kind: 'leap' | 'charge'): void {
  const p = w.player;
  if (m.dashT > 0) {
    advanceDash(w, m, dt);
    return;
  }
  if (m.windT > 0) {
    m.windT -= dt;
    if (m.windT <= 0) beginDash(m, kind);
    return;
  }
  m.abT[i] = (m.abT[i] ?? w.rngAi.float(0.5, ab.interval!)) - dt;
  if (m.abT[i] > 0) return;
  if (d < (kind === 'leap' ? 2.5 : 3) || d > ab.range! || !w.grid.los(m.x, m.y, p.x, p.y)) return;
  if (m.action || m.stunT > 0) return;
  m.abT[i] = ab.interval!;
  aimDash(w, m, kind, ab.telegraph!);
}

/** Wind up a leap or a charge at where the character stands now: the place is marked on the ground for the whole warning. */
function aimDash(w: World, m: Actor, kind: 'leap' | 'charge', telegraph: number): void {
  const p = w.player;
  m.windT = telegraph;
  m.dashX = p.x;
  m.dashY = p.y;
  w.effects.push({
    id: w.nextId++,
    x: p.x,
    y: p.y,
    radius: kind === 'leap' ? 1 : 0.8,
    t: telegraph,
    total: telegraph,
    kind: 'slam',
    damage: 0,
    dtype: 0,
    faction: 1,
  });
  // A charge is not abandoned by a blow it was in the middle of.
  m.action = null;
}

/** A charge on the spot, with a short warning (a Riled Rend-boar, docs/ENCOUNTERS.md 6); the charge ability carries it out. */
export function startCharge(w: World, m: Actor, telegraph: number): void {
  if (m.stunT > 0 || m.dashT > 0 || m.windT > 0) return;
  aimDash(w, m, 'charge', telegraph);
}

function beginDash(m: Actor, kind: 'leap' | 'charge'): void {
  const dx = m.dashX - m.x;
  const dy = m.dashY - m.y;
  const len = Math.max(0.01, Math.hypot(dx, dy));
  const dist = kind === 'charge' ? len + CHARGE_OVERSHOOT : len;
  m.dashV = kind === 'charge' ? CHARGE_SPEED : LEAP_SPEED;
  m.dashT = dist / m.dashV;
  m.dashX = m.x + (dx / len) * dist;
  m.dashY = m.y + (dy / len) * dist;
}

function advanceDash(w: World, m: Actor, dt: number): void {
  const dx = m.dashX - m.x;
  const dy = m.dashY - m.y;
  const len = Math.hypot(dx, dy);
  const move = Math.min(len, m.dashV * dt);
  const to = w.grid.collide(
    m.x + (dx / Math.max(len, 1e-6)) * move,
    m.y + (dy / Math.max(len, 1e-6)) * move,
    m.r,
  );
  const moved = Math.hypot(to.x - m.x, to.y - m.y);
  m.x = to.x;
  m.y = to.y;
  m.moving = true;
  m.dashT -= dt;
  // It stops at a wall, when it has run its length, or when it has reached the character.
  const p = w.player;
  const reach = (m.mon?.range ?? 1) + p.r + m.r;
  if (moved < move * 0.3 || len - move < 0.05 || Math.hypot(p.x - m.x, p.y - m.y) <= reach)
    m.dashT = 0;
}

const ACTIVE: Partial<Record<AbilityDef['id'], (c: Ctx) => void>> = {
  trail({ w, m, dt, ab, i }) {
    // A pool of burning ground where it has been, while it walks (one a little way behind it, so it never stands in its own).
    m.abT[i] = (m.abT[i] ?? ab.interval!) - dt;
    // A quenched Slag Brute leaves nothing behind it (docs/ENCOUNTERS.md 6).
    if (m.abT[i] > 0 || !m.moving || quenched(m)) return;
    m.abT[i] = ab.interval!;
    openZone(w, m.x, m.y, ab.range!, ab.amount!, 'burning', monsterHitOf(m) * 0.15);
  },
  devour({ w, m, dt, ab }) {
    // Eats a body within reach, and is the better for it. It looks twice a second, and eats once in its interval; the first
    // meal does not wait out the delay every monster starts with.
    if (m.skillT > ab.interval!) m.skillT = 0.4;
    m.skillT -= dt;
    if (m.skillT > 0) return;
    const c = w.corpses.find((o) => Math.hypot(o.x - m.x, o.y - m.y) <= ab.range!);
    if (!c) {
      m.skillT = 0.5;
      return;
    }
    w.corpses.splice(w.corpses.indexOf(c), 1);
    m.life = Math.min(m.def.maxLife, m.life + m.def.maxLife * ab.amount!);
    m.skillT = ab.interval!;
    w.events.push({ t: 'summon', id: m.id });
    // And swells with it (Gorged, docs/ENCOUNTERS.md 6).
    noteDevoured(w, m);
  },
  raiseCorpses({ w, m, dt, d, ab }) {
    m.skillT -= dt;
    if (m.skillT > 0 || d > 16) return;
    m.skillT = ab.interval!;
    const near = w.corpses
      .filter((c) => Math.hypot(c.x - m.x, c.y - m.y) <= ab.range!)
      .slice(0, ab.max!);
    for (const c of near) {
      raiseCorpse(w, c);
      w.corpses.splice(w.corpses.indexOf(c), 1);
    }
  },
  blink({ w, m, dt, d, ab }) {
    if (m.modIds.includes('unremembered')) return;
    if (m.blinkT > 0) {
      m.blinkT -= dt;
      if (m.blinkT <= 0) blinkBehind(w, m);
      return;
    }
    m.skillT -= dt;
    if (
      m.skillT <= 0 &&
      d > 3 &&
      d < 14 &&
      w.grid.los(m.x, m.y, w.player.x, w.player.y) &&
      !m.action
    ) {
      m.skillT = ab.interval!;
      m.blinkT = ab.telegraph!;
      w.events.push({ t: 'blink', id: m.id, x: m.x, y: m.y, end: false });
    }
  },
  spawn({ w, m, dt, ab }) {
    m.skillT -= dt;
    if (m.skillT > 0) return;
    m.skillT = ab.interval!;
    let alive = 0;
    for (const o of w.actors) if (o.alive && o.summonedBy === m.id) alive++;
    for (let i = 0; i < ab.amount! && alive < ab.max!; i++, alive++)
      spawnBeside(w, m, 'gnawer', 1.2);
  },
  slam({ w, m, dt, d, ab }) {
    m.skillT -= dt;
    if (m.skillT <= 0 && d <= 3 && !m.action && w.grid.los(m.x, m.y, w.player.x, w.player.y)) {
      m.skillT = ab.interval!;
      // A telegraphed slam on the spot where you stand.
      w.effects.push({
        id: w.nextId++,
        x: w.player.x,
        y: w.player.y,
        radius: ab.range!,
        t: 1,
        total: 1,
        kind: 'slam',
        damage: ab.amount! * monsterHitOf(m),
        dtype: 0,
        faction: 1,
      });
    }
  },
  aura({ w, m, ab }) {
    for (const o of w.actors)
      if (!o.isPlayer && o.alive && Math.hypot(o.x - m.x, o.y - m.y) <= ab.range!) o.buffT = 0.3;
  },
  hex({ w, m, dt, d, ab }) {
    m.skillT -= dt;
    if (m.skillT <= 0 && d < 12 && w.grid.los(m.x, m.y, w.player.x, w.player.y)) {
      m.skillT = ab.interval!;
      hexPlayerAtRandom(w);
    }
  },
  healChannel({ w, m, dt, ab }) {
    if (m.channelT > 0) {
      m.channelT -= dt;
      // A stun interrupts the channel.
      if (m.stunT > 0) {
        m.channelT = 0;
        m.skillT = ab.interval!;
      } else if (m.channelT <= 0) {
        m.skillT = ab.interval!;
        for (const o of w.actors)
          if (!o.isPlayer && o.alive && Math.hypot(o.x - m.x, o.y - m.y) <= ab.range!)
            o.life = Math.min(o.def.maxLife, o.life + o.def.maxLife * ab.amount!);
      }
      return;
    }
    m.skillT -= dt;
    if (m.skillT <= 0 && !m.action && m.stunT <= 0) {
      const hurt = w.actors.some(
        (o) =>
          !o.isPlayer &&
          o.alive &&
          o.life < o.def.maxLife * 0.9 &&
          Math.hypot(o.x - m.x, o.y - m.y) <= ab.range!,
      );
      if (hurt) m.channelT = ab.telegraph!;
      else m.skillT = 1;
    }
  },
  leap: (c) => dashing(c, 'leap'),
  charge: (c) => dashing(c, 'charge'),
  whistle({ w, m, dt, d, ab, i }) {
    m.abT[i] = (m.abT[i] ?? w.rngAi.float(1, ab.interval!)) - dt;
    if (m.abT[i] > 0 || d > 14) return;
    m.abT[i] = ab.interval!;
    for (const o of w.actors)
      if (!o.isPlayer && o.alive && Math.hypot(o.x - m.x, o.y - m.y) <= ab.range!) o.buffT = 4;
  },
  suppress({ w, d, ab }) {
    if (d <= ab.range!) w.player.suppressT = 0.25;
  },
  shell({ w, m, ab }) {
    for (const o of w.actors) {
      if (o.isPlayer || !o.alive || o === m || o.mon?.spec.type === m.mon?.spec.type) continue;
      if (o.shellBy || Math.hypot(o.x - m.x, o.y - m.y) > ab.range!) continue;
      o.shellBy = m.id;
      o.es = Math.max(o.es, o.def.maxLife * ab.amount!);
    }
  },
};

/** The ids of the active abilities that have code (a test checks that every one a type lists is here). */
export const IMPLEMENTED_ABILITIES = Object.keys(ACTIVE);

/** The Charging mod (docs/ENEMIES.md 7.2): any monster that has it rushes like a boar. */
export const CHARGING_MOD: AbilityDef = { id: 'charge', interval: 8, range: 9, telegraph: 0.6 };
export function tickChargingMod(w: World, m: Actor, dt: number): void {
  const p = w.player;
  ACTIVE.charge?.({
    w,
    m,
    dt,
    d: Math.hypot(p.x - m.x, p.y - m.y),
    ab: CHARGING_MOD,
    // A slot of its own, past the abilities of any type.
    i: 9,
  });
}

/** Run every active ability of a chasing monster for one tick. */
export function tickAbilities(w: World, m: Actor, dt: number): void {
  if (!m.mon) return;
  const abilities = abilitiesOf(m.mon.spec.type);
  if (abilities.length === 0) return;
  const p = w.player;
  const d = Math.hypot(p.x - m.x, p.y - m.y);
  for (const [i, ab] of abilities.entries()) ACTIVE[ab.id]?.({ w, m, dt, d, ab, i });
}
