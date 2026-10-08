import { abilitiesOf, type AbilityDef } from '../data/abilities';
import { monsterHitOf } from './combat';
import { blinkBehind, hexPlayerAtRandom, raise as raiseCorpse, spawnBeside } from './factions';
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

const ACTIVE: Partial<Record<AbilityDef['id'], (c: Ctx) => void>> = {
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
  shell({ w, m, ab }) {
    for (const o of w.actors) {
      if (o.isPlayer || !o.alive || o === m || o.mon?.spec.type === m.mon?.spec.type) continue;
      if (o.shellBy || Math.hypot(o.x - m.x, o.y - m.y) > ab.range!) continue;
      o.shellBy = m.id;
      o.es = Math.max(o.es, o.def.maxLife * ab.amount!);
    }
  },
};

/** Run every active ability of a chasing monster for one tick. */
export function tickAbilities(w: World, m: Actor, dt: number): void {
  if (!m.mon) return;
  const abilities = abilitiesOf(m.mon.spec.type);
  if (abilities.length === 0) return;
  const p = w.player;
  const d = Math.hypot(p.x - m.x, p.y - m.y);
  for (const [i, ab] of abilities.entries()) ACTIVE[ab.id]?.({ w, m, dt, d, ab, i });
}
