import { skillRange, type SkillChoice } from '../calc/character';
import type { SkillProfile } from '../calc/skill';
import { hexEffect } from '../data/hexes';
import { actorById } from './actions';
import { gainBuff } from './buffs';
import { flaskMask, playerConds, rawHit } from './combat';
import { canPay } from './cost';
import { applyHex } from './hexes';
import { minionCount, summonCount, summonMinions, summonRespawn } from './minions';
import type { Action, Actor, World } from './types';

/**
 * Utility skills in the sim (COVERAGE 5.1): curses, buffs, guards, warcries and blinks have no damage of their own,
 * so the character casts them by a policy, one per decision, ahead of its damage skills. A cast takes its use time
 * from the primary skill, and costs mana like any other.
 */

/** How far a utility is cast from, in tiles (a curse is a spell: it needs the target in sight). */
const CAST_RANGE = 9;
/** Enemies this close to the player make a pack for a warcry or a guard. */
const PACK_RADIUS = 7;
const PACK_SIZE = 3;
/** A guard goes up when life falls below this share. */
const GUARD_LIFE = 0.6;

export type UtilityPick = { choice: SkillChoice; prof: SkillProfile; cd: number };

function enemiesNear(w: World, x: number, y: number, r: number): Actor[] {
  return w.actors.filter(
    (e) => !e.isPlayer && e.alive && e.phaseT <= 0 && Math.hypot(e.x - x, e.y - y) <= r,
  );
}

/** The utility skill to cast now against this target, if the policy says so. */
export function chooseUtility(w: World, target: Actor): UtilityPick | null {
  const ch = w.char;
  if (!ch.utilities.length) return null;
  const p = w.player;
  const d = Math.hypot(target.x - p.x, target.y - p.y);
  const conds = playerConds(w, target);
  for (const c of ch.utilities) {
    if ((w.utilityReady[c.key] ?? 0) > w.t) continue;
    const u = c.skill.utility!;
    const prof = ch.profile(c, conds, flaskMask(w));
    if (!canPay(w, c.costsLife, prof.cost)) continue;
    if (u.kind === 'buff') {
      if (d > CAST_RANGE + 1) continue;
      const left = w.buffT[u.buff];
      if (left > prof.useTime + 0.3) continue;
      if (u.policy === 'guard') {
        const hit = p.life / Math.max(1, p.def.maxLife) < GUARD_LIFE;
        if (!hit || left > 0) continue;
      } else if (u.policy === 'rally') {
        const pack = enemiesNear(w, p.x, p.y, PACK_RADIUS).length >= PACK_SIZE;
        const big =
          target.rarity === 'boss' || target.rarity === 'miniboss' || target.rarity === 'rare';
        if (!pack && !big) continue;
      } else if (enemiesNear(w, p.x, p.y, PACK_RADIUS).length < 1) continue;
      return { choice: c, prof, cd: u.cooldown ?? 0.5 };
    }
    if (u.kind === 'curse') {
      if (d > CAST_RANGE || !w.grid.los(p.x, p.y, target.x, target.y)) continue;
      const have = target.hexes.find((h) => h.id === u.hex);
      if (have && have.t > prof.useTime + 0.5) continue;
      if (!have && target.hexes.length >= Math.max(1, ch.hexLimit)) continue;
      const pack = enemiesNear(w, target.x, target.y, u.radius).length >= PACK_SIZE;
      const big =
        target.rarity === 'boss' || target.rarity === 'miniboss' || target.rarity === 'rare';
      if (!pack && !big && target.life < 0.5 * target.def.maxLife) continue;
      return { choice: c, prof, cd: 0.5 };
    }
    if (u.kind === 'summon') {
      // Minions are summoned in the first fight and again when they are gone or have run out.
      if (d > CAST_RANGE + 6 || minionCount(w, c.key) >= summonCount(c, prof)) continue;
      return { choice: c, prof, cd: summonRespawn(c) };
    }
    // A blink closes the gap to a target the primary skill cannot reach yet.
    const reach = skillRange(ch.profile(w.primary, conds, flaskMask(w))) + target.r;
    if (d > reach + 2 && d <= u.distance + reach && w.grid.los(p.x, p.y, target.x, target.y))
      return { choice: c, prof, cd: u.cooldown };
  }
  return null;
}

/** Radius of a burning aura, in tiles. */
const BURN_RADIUS = 2.8;
const BURN_EVERY = 0.5;

/** A burning aura damages the enemies near the player (and the player, without killing it) twice a second. */
export function tickAuraBurn(w: World, dt: number): void {
  const b = w.char.burn;
  if (b.pct <= 0 && b.self <= 0) return;
  w.auraBurnT += dt;
  if (w.auraBurnT < BURN_EVERY) return;
  w.auraBurnT -= BURN_EVERY;
  const p = w.player;
  if (!p.alive) return;
  const amount = (b.pct / 100) * p.def.maxLife * BURN_EVERY;
  if (amount > 0)
    for (const e of enemiesNear(w, p.x, p.y, BURN_RADIUS)) rawHit(w, e, amount, 3, 'Burning aura');
  if (b.self > 0) p.life = Math.max(1, p.life - (b.self / 100) * p.def.maxLife * BURN_EVERY);
}

/** What a utility cast does when it lands: the buff starts, the curse falls on the target and the pack around it, the player blinks. */
export function applyUtility(w: World, a: Actor, act: Action): void {
  const c = w.char.utilities.find((x) => x.skill.id === act.profile.skill.id);
  const u = c?.skill.utility;
  if (!c || !u) return;
  if (u.kind === 'buff') {
    gainBuff(w, u.buff);
    // The buff's own length is the gem's: a utility buff lasts as long as its gem says.
    w.buffT[u.buff] = Math.max(w.buffT[u.buff], u.seconds * w.char.db.mult('buffDuration'));
    return;
  }
  if (u.kind === 'summon') {
    summonMinions(w, c, act.profile);
    return;
  }
  const target = actorById(w, act.targetId);
  if (!target || !target.alive) return;
  if (u.kind === 'curse') {
    const effect = hexEffect(u.hex, c.skill.level) * w.char.db.mult('curseEffect');
    for (const e of enemiesNear(w, target.x, target.y, u.radius))
      applyHex(w, e, u.hex, Math.round(effect * 10) / 10, w.char.hexLimit);
    return;
  }
  // Blink: land next to the target, a little inside the primary skill's reach.
  const d = Math.hypot(target.x - a.x, target.y - a.y);
  const step = Math.max(0, Math.min(u.distance, d - (target.r + a.r + 1)));
  const nx = a.x + ((target.x - a.x) / d) * step;
  const ny = a.y + ((target.y - a.y) / d) * step;
  const spot = w.grid.collide(nx, ny, a.r);
  w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: false });
  a.x = spot.x;
  a.y = spot.y;
  w.events.push({ t: 'blink', id: a.id, x: a.x, y: a.y, end: true });
}
