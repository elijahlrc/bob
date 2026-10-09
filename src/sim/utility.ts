import { skillRange, type SkillChoice } from '../calc/character';
import type { SkillProfile } from '../calc/skill';
import { hexEffect } from '../data/hexes';
import { actorById } from './actions';
import { bannerAction, useBanner } from './banners';
import { blinkCast, blinkGroupBusy } from './blinks';
import { skillReady } from './cooldowns';
import { levelValue } from '../calc/gems';
import { gainBuff } from './buffs';
import { applyStatus } from './statuses';
import { spendCharges } from './charges';
import { flaskMask, playerConds, rawHit } from './combat';
import { canPay } from './cost';
import { applyHex } from './hexes';
import {
  animatableDrop,
  animateWeapon,
  minionCount,
  raiseSpectre,
  summonCount,
  summonMinions,
  summonRespawn,
} from './minions';
import { corpseNear } from './factions';
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

/** The key the guard skills share in `utilityReady`. */
const GUARDS = '@guard';
/** The key the warcries share. */
const WARCRIES = '@warcry';
const WARCRY_SECONDS = 4;

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
    // The warcries wait on one another (3.9: a shared four seconds).
    if (c.skill.tags.includes('warcry') && (w.utilityReady[WARCRIES] ?? 0) > w.t) continue;
    // The guard skills wait on one another (3.9).
    if (u.kind === 'buff' && u.policy === 'guard' && (w.utilityReady[GUARDS] ?? 0) > w.t) continue;
    const prof = ch.profile(c, conds, flaskMask(w));
    if (!canPay(w, c.costsLife, prof.cost)) continue;
    if (u.kind === 'buff' && u.banner) {
      if (!bannerAction(w, c, target)) continue;
      return { choice: c, prof, cd: u.cooldown ?? 1 };
    }
    if (u.kind === 'buff') {
      if (d > CAST_RANGE + 1) continue;
      // Berserk needs rage to start; Blood Rage is not begun on low life.
      if (u.rage && w.rage < u.rage.min) continue;
      if (u.degen && p.life < p.def.maxLife * 0.6) continue;
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
    if (u.kind === 'shout') {
      // Cast when a pack or a rare enemy is near, like a rallying cry; a standing channel (Wither) goes on while any enemy is near.
      if (u.policy === 'upkeep') {
        if (enemiesNear(w, p.x, p.y, u.radius).length < 1) continue;
        return { choice: c, prof, cd: u.cooldown };
      }
      const pack = enemiesNear(w, p.x, p.y, u.radius + 2).length >= PACK_SIZE;
      const big =
        target.rarity === 'boss' || target.rarity === 'miniboss' || target.rarity === 'rare';
      if (d > u.radius + 2 || (!pack && !big)) continue;
      return { choice: c, prof, cd: u.cooldown };
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
      // A spectre needs a corpse to raise, an animated weapon one on the ground that the character can spare.
      if (u.corpse && !corpseNear(w, p.x, p.y, CAST_RANGE)) continue;
      if (u.animate) {
        if (!animatableDrop(w, c, CAST_RANGE)) continue;
        return { choice: c, prof, cd: summonRespawn(c) };
      }
      // Minions are summoned in the first fight and again when they are gone or have run out.
      if (d > CAST_RANGE + 6 || minionCount(w, c.key) >= summonCount(c, prof)) continue;
      return { choice: c, prof, cd: summonRespawn(c) };
    }
    // A blink closes the gap to a target the primary skill cannot reach yet; one with an effect where it leaves or lands is also
    // used when that would fall on a pack, and Withering Step when a fight is on.
    if (u.kind !== 'blink') continue;
    if (c.skill.cooldown !== undefined && !skillReady(w, c)) continue;
    if (blinkGroupBusy(w, c)) continue;
    const reach = skillRange(ch.profile(w.primary, conds, flaskMask(w))) + target.r;
    const gap =
      d > reach + 2 && d <= u.distance + reach && w.grid.los(p.x, p.y, target.x, target.y);
    const radius =
      (prof.skill.behaviour.kind === 'burst' ? prof.skill.behaviour.radius : 2) * prof.radiusMult;
    const packHere =
      (u.burst === 'depart' || u.burst === 'both') &&
      enemiesNear(w, p.x, p.y, radius * 1.3).length >= PACK_SIZE;
    // Bodyswap goes to a corpse with enemies about it.
    const corpseGo =
      !!u.corpse &&
      w.corpses.some(
        (c0) =>
          Math.hypot(c0.x - p.x, c0.y - p.y) <= u.distance + 1 &&
          enemiesNear(w, c0.x, c0.y, 2.5).length >= 2,
      );
    const packThere =
      u.burst === 'arrive' && gap && enemiesNear(w, target.x, target.y, radius * 1.3).length >= 2;
    const fight =
      !!u.elusive &&
      w.buffT.elusive <= 0 &&
      d <= CAST_RANGE &&
      (enemiesNear(w, p.x, p.y, PACK_RADIUS).length >= PACK_SIZE ||
        target.rarity === 'rare' ||
        target.rarity === 'boss' ||
        target.rarity === 'miniboss');
    if (u.warp && w.warp) continue;
    if (gap || packHere || packThere || fight || corpseGo)
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
  // The enemies burn for a share of the character's life, with the character's damage over time modifiers.
  const amount = (b.pct / 100) * p.def.maxLife * BURN_EVERY * w.char.db.mult('damage');
  if (amount > 0)
    for (const e of enemiesNear(w, p.x, p.y, BURN_RADIUS)) rawHit(w, e, amount, 3, 'Burning aura');
  // The character burns too, as fire damage that its resistance and energy shield answer to; it never kills.
  if (b.self > 0) {
    const was = w.opts.godMode;
    w.opts.godMode = true;
    rawHit(w, p, (b.self / 100) * p.def.maxLife * BURN_EVERY, 3, 'Righteous Fire');
    w.opts.godMode = was;
    p.life = Math.max(1, p.life);
  }
}

/** What a utility cast does when it lands: the buff starts, the curse falls on the target and the pack around it, the player blinks. */
export function applyUtility(w: World, a: Actor, act: Action): void {
  const c = w.char.utilities.find((x) => x.skill.id === act.profile.skill.id);
  const u = c?.skill.utility;
  if (!c || !u) return;
  if (c.skill.tags.includes('warcry')) w.utilityReady[WARCRIES] = w.t + WARCRY_SECONDS;
  if (u.kind === 'shout') {
    const near = enemiesNear(w, a.x, a.y, u.radius);
    for (const e of near)
      for (const s of u.statuses) {
        const v =
          levelValue(s.v, c.skill.level) +
          levelValue(s.perNearby ?? 0, c.skill.level) * (near.length - 1);
        applyStatus(w, e, s.id, { seconds: s.seconds * w.char.db.mult('buffDuration'), v, x: s.x });
      }
    return;
  }
  if (u.kind === 'buff' && u.banner) {
    useBanner(w, c, act.profile.radiusMult);
    return;
  }
  if (u.kind === 'buff') {
    const before = w.buffT[u.buff];
    // Berserk lasts as long as the rage does, and its cooldown waits for the end.
    if (u.rage) {
      w.berserkT = 0.001;
      w.buffT[u.buff] = 1e9;
      w.utilityReady[c.key] = 1e9;
      w.events.push({ t: 'buff', id: u.buff });
      return;
    }
    gainBuff(w, u.buff);
    // The charges a guard spends make it last longer and take more of the physical damage away.
    let spent = 0;
    if (u.consume) {
      spent = Math.min(u.consume.max, w.char.charges[u.consume.charge]);
      if (spent > 0) spendCharges(w, u.consume.charge, spent);
      w.guard = {
        buff: u.buff,
        physMult: Math.pow(1 - u.consume.physLess / 100, spent),
      };
    }
    // The buff's own length is the gem's: a utility buff lasts as long as its gem says.
    const length = u.seconds * (1 + ((u.consume?.durationPct ?? 0) / 100) * spent);
    w.buffT[u.buff] = Math.max(before, length * w.char.db.mult('buffDuration'));
    // A guard's cooldown does not run while it lasts, and the other guards wait out the same time.
    if (u.policy === 'guard') {
      const until = w.t + w.buffT[u.buff] + (u.cooldown ?? 0);
      w.utilityReady[GUARDS] = until;
      w.utilityReady[c.key] = until;
    }
    return;
  }
  if (u.kind === 'summon') {
    if (u.corpse) {
      const corpse = corpseNear(w, a.x, a.y, CAST_RANGE);
      if (corpse) raiseSpectre(w, c, act.profile, corpse);
    } else if (u.animate) {
      const drop = animatableDrop(w, c, CAST_RANGE);
      if (drop) animateWeapon(w, c, act.profile, drop);
    } else summonMinions(w, c, act.profile);
    return;
  }
  const target = actorById(w, act.targetId);
  if (!target || !target.alive) return;
  if (u.kind === 'curse') {
    const effect = hexEffect(u.hex, c.skill.level) * w.char.db.mult('curseEffect');
    for (const e of enemiesNear(w, target.x, target.y, u.radius))
      applyHex(w, e, u.hex, Math.round(effect * 10) / 10, w.char.hexLimit, c.skill.level);
    return;
  }
  // Blink: land next to the target, a little inside the primary skill's reach (src/sim/blinks.ts).
  blinkCast(w, a, act.profile, c, target);
}
