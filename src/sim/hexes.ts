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
import { reservedMana } from './reserve';
import { gainBuff } from './buffs';
import { gainCharge } from './charges';
import { lifeCap } from './combat';
import type { Actor, World } from './types';

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
  if (a.rarity === 'boss') effect *= BOSS_CURSE_EFFECT;
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
export function applyPlayerHexes(w: World, dst: Actor): void {
  const ch = w.char;
  if (!ch.hexes.length || dst.isPlayer) return;
  for (const h of ch.hexes) applyHex(w, dst, h.id, h.effect, ch.hexLimit, h.level);
}

/** A monster hexes the player: the effect is reduced by "reduced effect of curses on you". */
export function monsterHexesPlayer(w: World, id: HexId, effect: number): void {
  const p = w.player;
  const mult = Math.max(0, w.char.db.mult('curseEffectOnSelf'));
  applyHex(w, p, id, effect * mult, BASE_HEX_LIMIT, 10, HEX_SECONDS);
}

/** The player's attack hits an enemy under a hex that gives something back on each hit (Mark of Plenty: life and mana). */
export function hexHit(w: World, dst: Actor, melee = false): void {
  if (dst.hexes.length === 0 || dst.isPlayer) return;
  const p = w.player;
  for (const h of dst.hexes) {
    const def = HEXES[h.id];
    if (melee && def.meleeBuff) gainBuff(w, def.meleeBuff);
    const give = def.onHit;
    if (!give) continue;
    if (give.life) p.life = Math.min(lifeCap(w, p), p.life + atLevel(give.life, h.level));
    if (give.mana)
      p.mana = Math.min(
        Math.max(0, p.def.maxMana - reservedMana(w)),
        p.mana + atLevel(give.mana, h.level),
      );
  }
}

/**
 * The player kills an enemy under hexes of its own: what each gives (life and mana back, a chance of a charge). Returns how
 * many of the hexes make its flasks fill more.
 */
export function hexKill(w: World, dead: Actor): number {
  let flasks = 0;
  const p = w.player;
  for (const h of dead.hexes) {
    const give = HEXES[h.id].onKill;
    if (!give) continue;
    if (give.life) p.life = Math.min(lifeCap(w, p), p.life + atLevel(give.life, h.level));
    if (give.mana)
      p.mana = Math.min(
        Math.max(0, p.def.maxMana - reservedMana(w)),
        p.mana + atLevel(give.mana, h.level),
      );
    if (give.charge && w.rngTrig.chance(atLevel(give.charge.chance, h.level) / 100))
      gainCharge(w, give.charge.kind);
    if (give.flasks) flasks += give.flasks;
  }
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
  a.hexMore = t;
  a.hexRes = t.res;
  a.hexVuln = t.vulnPhys;
  a.hexVulnAll = t.vulnAll;
  a.hexDmg = t.damageMult;
  a.hexSpeed = t.speedMult;
}
