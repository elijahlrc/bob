import {
  BASE_HEX_LIMIT,
  BOSS_CURSE_EFFECT,
  HEXES,
  HEX_SECONDS,
  atLevel,
  hexSeconds,
  hexTotals,
  type HexId,
} from '../data/hexes';
import { curseAuraOf } from '../calc/character';
import { reservedMana } from './reserve';
import { gainBuff } from './buffs';
import { gainCharge } from './charges';
import { lifeCap } from './combat';
import { noteRecover } from './recovery';
import { bossOfType } from '../data/bosses';
import { flaskWards } from './afflict';
import type { Actor, World } from './types';
import { hunted, livingEnemiesOf } from './side';
import type { Side } from './side';

/**
 * Hexes in the sim (EXPANSION 5.7). A hex is a debuff on an actor with an effect value, lasting 6 seconds and
 * renewed by its source. An enemy holds at most the hex limit of the player's hexes; the player holds one monster
 * hex, and a new one replaces the old. The four effects are read where they matter: resistances and physical
 * vulnerability in the damage code, damage dealt in `applyHit`, speed in movement and action timing.
 */

export type HexState = { id: HexId; effect: number; t: number; level: number };

/** Put a hex on an actor, or renew it. When the actor is at its limit, the one with the least time left goes. */
export function applyHex(
  w: World,
  a: Actor,
  id: HexId,
  effect: number,
  limit: number,
  level = 10,
  seconds?: number,
): void {
  if (!a.alive || a.modIds.includes('hexWarded')) return;
  // Bosses take a third less (as in the reference game); a boss of docs/BOSSES.md takes what its card says (the Rotwife all of it).
  if (a.rarity === 'boss')
    effect *= a.mon
      ? (bossOfType(a.mon.spec.type)?.curseEffect ?? BOSS_CURSE_EFFECT)
      : BOSS_CURSE_EFFECT;
  // A curse lasts as long as its gem says; the hexes monsters cast (and ones with no length of their own) last six seconds.
  const length = seconds ?? hexSeconds(id, level);
  const have = a.hexes.find((h) => h.id === id);
  if (have) {
    have.t = length;
    have.level = level;
    have.effect = Math.max(have.effect, effect);
  } else {
    if (a.hexes.length >= Math.max(1, limit)) {
      let oldest = 0;
      a.hexes.forEach((h, i) => {
        if (h.t < a.hexes[oldest].t) oldest = i;
      });
      a.hexes.splice(oldest, 1);
    }
    a.hexes.push({ id, effect, t: length, level });
    w.events.push({ t: 'hex', id: a.id, hex: id });
  }
  recompute(a);
}

/** The player's hexes on a struck enemy: every hex the character applies on hit. */
export function applyPlayerHexes(w: World, s: Side, dst: Actor): void {
  const ch = s.char;
  if (!ch.hexes.length || dst.team === s.team) return;
  for (const h of ch.hexes) applyHex(w, dst, h.id, h.effect, ch.hexLimit, h.level);
}

/** A curse under Standing Curse is an aura: every enemy within its reach, hit or not, is cursed (refreshed twice a second). */
export function tickCurseAura(w: World, s: Side, dt: number): void {
  if (Math.floor(w.t * 2) === Math.floor((w.t - dt) * 2)) return;
  const p = s.player;
  for (const c of s.char.actives) {
    const u = c.skill.utility;
    if (!c.usable || u?.kind !== 'curse' || !curseAuraOf(c)) continue;
    const h = s.char.hexes.find((x) => x.id === u.hex);
    if (!h) continue;
    const radius = Math.max(u.radius, 3) * s.char.profile(c, 0).radiusMult * 1.5;
    for (const e of livingEnemiesOf(w, s.team))
      if (Math.hypot(e.x - p.x, e.y - p.y) <= radius + e.r)
        applyHex(w, e, h.id, h.effect, s.char.hexLimit, h.level);
  }
}

/** A monster hexes the player: the effect is reduced by "reduced effect of curses on you". */
export function monsterHexesPlayer(w: World, s: Side, id: HexId, effect: number): void {
  const p = s.player;
  // A flask of Unbinding keeps curses off while it runs (docs/BOSSES.md 11.2).
  if (flaskWards(p.side!, 'curse')) return;
  const mult = Math.max(0, s.char.db.mult('curseEffectOnSelf'));
  applyHex(w, p, id, effect * mult, BASE_HEX_LIMIT, 10, HEX_SECONDS);
}

/** The player's attack hits an enemy under a hex that gives something back on each hit (Mark of Plenty: life and mana). */
export function hexHit(w: World, s: Side, dst: Actor, melee = false): void {
  if (dst.hexes.length === 0 || dst.team === s.team) return;
  const p = s.player;
  const l0 = p.life;
  const m0 = p.mana;
  for (const h of dst.hexes) {
    const def = HEXES[h.id];
    if (melee && def.meleeBuff) gainBuff(w, s, def.meleeBuff);
    const give = def.onHit;
    if (!give) continue;
    if (give.life) p.life = Math.min(lifeCap(p), p.life + atLevel(give.life, h.level));
    if (give.mana)
      p.mana = Math.min(
        Math.max(0, p.def.maxMana - reservedMana(s)),
        p.mana + atLevel(give.mana, h.level),
      );
  }
  noteRecover(p, 'life', p.life - l0);
  noteRecover(p, 'mana', p.mana - m0);
}

/**
 * The player kills an enemy under hexes of its own: what each gives (life and mana back, a chance of a charge). Returns how
 * many of the hexes make its flasks fill more.
 */
export function hexKill(w: World, dead: Actor): number {
  let flasks = 0;
  const p = hunted(w, dead);
  const l0 = p.life;
  const m0 = p.mana;
  for (const h of dead.hexes) {
    const give = HEXES[h.id].onKill;
    if (!give) continue;
    if (give.life) p.life = Math.min(lifeCap(p), p.life + atLevel(give.life, h.level));
    if (give.mana)
      p.mana = Math.min(
        Math.max(0, p.def.maxMana - reservedMana(hunted(w, dead).side!)),
        p.mana + atLevel(give.mana, h.level),
      );
    if (give.charge && w.rngTrig.chance(atLevel(give.charge.chance, h.level) / 100))
      gainCharge(w, hunted(w, dead).side!, give.charge.kind);
    if (give.flasks) flasks += give.flasks;
  }
  noteRecover(p, 'life', p.life - l0);
  noteRecover(p, 'mana', p.mana - m0);
  return flasks;
}

/** Count the timers down; a hex that ends is removed. */
export function tickHexes(a: Actor, dt: number): void {
  if (!a.hexes.length) return;
  let changed = false;
  for (const h of a.hexes) h.t -= dt;
  const keep = a.hexes.filter((h) => h.t > 0);
  if (keep.length !== a.hexes.length) {
    a.hexes = keep;
    changed = true;
  }
  if (changed) recompute(a);
}

/** Refresh the numbers the damage and movement code read. */
export function recompute(a: Actor): void {
  const t = hexTotals(a.hexes, a.rarity);
  a.hex.more = t;
  a.hex.res = t.res;
  a.hex.vuln = t.vulnPhys;
  a.hex.vulnAll = t.vulnAll;
  a.hex.dmg = t.damageMult;
  a.hex.speed = t.speedMult;
}
