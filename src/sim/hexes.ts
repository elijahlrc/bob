import { BASE_HEX_LIMIT, BOSS_CURSE_EFFECT, HEX_SECONDS, type HexId } from '../data/hexes';
import type { Actor, World } from './types';

/**
 * Hexes in the sim (EXPANSION 5.7). A hex is a debuff on an actor with an effect value, lasting 6 seconds and
 * renewed by its source. An enemy holds at most the hex limit of the player's hexes; the player holds one monster
 * hex, and a new one replaces the old. The four effects are read where they matter: resistances and physical
 * vulnerability in the damage code, damage dealt in `applyHit`, speed in movement and action timing.
 */

export type HexState = { id: HexId; effect: number; t: number };

/** Put a hex on an actor, or renew it. When the actor is at its limit, the one with the least time left goes. */
export function applyHex(w: World, a: Actor, id: HexId, effect: number, limit: number): void {
  if (!a.alive || a.modIds.includes('hexWarded')) return;
  if (a.rarity === 'boss') effect *= BOSS_CURSE_EFFECT;
  const have = a.hexes.find((h) => h.id === id);
  if (have) {
    have.t = HEX_SECONDS;
    have.effect = Math.max(have.effect, effect);
  } else {
    if (a.hexes.length >= Math.max(1, limit)) {
      let oldest = 0;
      a.hexes.forEach((h, i) => {
        if (h.t < a.hexes[oldest].t) oldest = i;
      });
      a.hexes.splice(oldest, 1);
    }
    a.hexes.push({ id, effect, t: HEX_SECONDS });
    w.events.push({ t: 'hex', id: a.id, hex: id });
  }
  recompute(a);
}

/** The player's hexes on a struck enemy: every hex the character applies on hit. */
export function applyPlayerHexes(w: World, dst: Actor): void {
  const ch = w.char;
  if (!ch.hexes.length || dst.isPlayer) return;
  for (const h of ch.hexes) applyHex(w, dst, h.id, h.effect, ch.hexLimit);
}

/** A monster hexes the player: the effect is reduced by "reduced effect of curses on you". */
export function monsterHexesPlayer(w: World, id: HexId, effect: number): void {
  const p = w.player;
  const mult = Math.max(0, w.char.db.mult('curseEffectOnSelf'));
  applyHex(w, p, id, effect * mult, BASE_HEX_LIMIT);
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
  let res = 0;
  let vuln = 0;
  let dmg = 1;
  let speed = 1;
  for (const h of a.hexes) {
    if (h.id === 'brittleDoom') res += h.effect;
    else if (h.id === 'openWounds') vuln += h.effect / 100;
    else if (h.id === 'feebleGrip') dmg *= 1 - h.effect / 100;
    else speed *= 1 - h.effect / 100;
  }
  a.hexRes = res;
  a.hexVuln = vuln;
  a.hexDmg = dmg;
  a.hexSpeed = speed;
}
