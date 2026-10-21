import { skillRange, type SkillChoice } from '../calc/character';
import type { SkillProfile } from '../calc/skill';
import { hexEffect, hexSeconds } from '../data/hexes';
import { actorById } from './actions';
import { bannerAction, useBanner } from './banners';
import { blinkCast, blinkGroupBusy } from './blinks';
import { skillReady } from './cooldowns';
import { levelValue } from '../calc/gems';
import { gainBuff } from './buffs';
import { applyStatus } from './statuses';
import { spendCharges } from './charges';
import { flaskMask, playerConds, playerCtx, rawHit } from './combat';
import { canPay } from './cost';
import { applyHex } from './hexes';
import { minionCount, raiseSpectre, summonCount, summonMinions, summonRespawn } from './minions';
import { corpseNear, takeCorpse } from './factions';
import { castOffering, offeringWanted } from './minionFx';
import { startShell, vortexRadius } from './skillFx';
import type { Action, Actor, World } from './types';
import { ESCAPE_CROWD_RADIUS, ESCAPE_NEAR, PACK_RADIUS, PACK_SIZE } from '../data/strategy';
import type { RotationEntry } from '../calc/strategy';
import { enemiesWithin } from './side';
import type { Side } from './side';

/**
 * Utility skills in the sim (COVERAGE 5.1): curses, buffs, guards, warcries and blinks have no damage of their own,
 * so the character casts them by a policy, one per decision, ahead of its damage skills. A cast takes its use time
 * from the primary skill, and costs mana like any other.
 */

/** How far a utility is cast from, in tiles (a curse is a spell: it needs the target in sight). */
const CAST_RANGE = 9;
/** A guard goes up when life falls below this share. */
const GUARD_LIFE = 0.6;

/** The key the guard skills share in `utilityReady`. */
const GUARDS = '@guard';
/** The key the warcries share. */
const WARCRIES = '@warcry';
const WARCRY_SECONDS = 4;

export type UtilityPick = { choice: SkillChoice; prof: SkillProfile; cd: number };

export function enemiesNear(w: World, team: number, x: number, y: number, r: number): Actor[] {
  return enemiesWithin(w, team, x, y, r, false);
}

const isBig = (a: Actor) => a.rarity === 'boss' || a.rarity === 'miniboss' || a.rarity === 'rare';

/**
 * Whether a utility skill is to be cast now against this target, by its role on the Strategy tab: `auto` is the skill's own
 * judgement (below), `keepUp` keeps it going whenever an enemy is near, `opener` casts it at the start of a fight and on each rare,
 * and `emergency` when life falls below the entry's threshold. The caller has checked the entry's condition (`when`).
 */
export function utilityPick(
  w: World,
  s: Side,
  e: RotationEntry<SkillChoice>,
  target: Actor,
): UtilityPick | null {
  const ch = s.char;
  const c = e.choice;
  const p = s.player;
  if ((s.utilityReady[c.key] ?? 0) > w.t) return null;
  const u = c.skill.utility!;
  // The warcries wait on one another (the reference game: a shared four seconds).
  if (c.skill.tags.includes('warcry') && (s.utilityReady[WARCRIES] ?? 0) > w.t) return null;
  // The guard skills wait on one another (as in the reference game).
  if (u.kind === 'buff' && u.policy === 'guard' && (s.utilityReady[GUARDS] ?? 0) > w.t) return null;
  const d = Math.hypot(target.x - p.x, target.y - p.y);
  const prof = ch.profile(c, playerConds(w, s, target), flaskMask(s));
  if (!canPay(s, c.costsLife, prof.cost)) return null;
  if (e.role === 'auto') return autoPick(w, s, c, prof, target, d);
  if (e.role === 'opener' && !openerDue(s, c.key, target)) return null;
  if (e.role === 'emergency' && p.life >= p.def.maxLife * e.life) return null;
  if (e.role === 'escape' && !wantsOut(w, s, e)) return null;
  const near = (r: number) => enemiesNear(w, p.team, p.x, p.y, r).length >= 1;
  if (u.kind === 'buff') {
    if (d > CAST_RANGE + 1 || !near(PACK_RADIUS)) return null;
    if (u.rage && s.rage < u.rage.min) return null;
    if (s.buffT[u.buff] > prof.useTime + 0.3) return null;
    return { choice: c, prof, cd: u.cooldown ?? 0.5 };
  }
  if (u.kind === 'shout') {
    if (d > u.radius + 2) return null;
    return { choice: c, prof, cd: u.cooldown };
  }
  if (u.kind === 'curse') {
    if (d > CAST_RANGE || !w.grid.los(p.x, p.y, target.x, target.y)) return null;
    const have = target.hexes.find((h) => h.id === u.hex);
    if (have && have.t > prof.useTime + 0.5) return null;
    if (!have && target.hexes.length >= Math.max(1, ch.hexLimit)) return null;
    return { choice: c, prof, cd: 0.5 };
  }
  if (u.kind === 'summon') {
    if (c.skill.cooldown !== undefined && !skillReady(s, c)) return null;
    if (d > CAST_RANGE + 6 || minionCount(s, c.key) >= summonCount(c, prof)) return null;
    return { choice: c, prof, cd: summonRespawn(c) };
  }
  if (u.kind === 'blink') {
    if (c.skill.cooldown !== undefined && !skillReady(s, c)) return null;
    if (blinkGroupBusy(w, s, c) || !near(5)) return null;
    return { choice: c, prof, cd: u.cooldown };
  }
  return null;
}

/**
 * Whether the character wants out (the `escape` role): hurt, with an enemy near enough to be hurt by, or boxed in by a pack,
 * each as far as the entry has it switched on. The same rule as the escape skills that decide for themselves.
 */
export function wantsOut(
  w: World,
  s: Side,
  e: Pick<RotationEntry<SkillChoice>, 'life' | 'lowLife' | 'surrounded'>,
): boolean {
  const p = s.player;
  const hurt =
    e.lowLife &&
    p.life < p.def.maxLife * e.life &&
    enemiesNear(w, p.team, p.x, p.y, ESCAPE_NEAR).length >= 1;
  return (
    hurt ||
    (e.surrounded && enemiesNear(w, p.team, p.x, p.y, ESCAPE_CROWD_RADIUS).length >= PACK_SIZE)
  );
}

/** An opener is due on its first use of a fight, and on a rare or boss target it has not yet been used on. */
export function openerDue(s: Side, key: string, target: Actor): boolean {
  const o = s.openers[key];
  if (!o || o.fight !== s.ai.fight) return true;
  return isBig(target) && !o.ids.includes(target.id);
}

/** An opener has been used against this target. */
export function markOpened(s: Side, key: string, target: Actor): void {
  const o = s.openers[key];
  const ids = o && o.fight === s.ai.fight ? o.ids : [];
  s.openers[key] = { fight: s.ai.fight, ids: [...ids.slice(-15), target.id] };
}

/** A utility skill's own judgement (the `auto` role), ahead of the damage skills by default (COVERAGE 5.1). */
function autoPick(
  w: World,
  s: Side,
  c: SkillChoice,
  prof: SkillProfile,
  target: Actor,
  d: number,
): UtilityPick | null {
  const ch = s.char;
  const p = s.player;
  const u = c.skill.utility!;
  if (u.kind === 'buff' && u.banner) {
    if (!bannerAction(w, s, c, target)) return null;
    return { choice: c, prof, cd: u.cooldown ?? 1 };
  }
  if (u.kind === 'buff') {
    if (d > CAST_RANGE + 1) return null;
    // Rampage Call needs rage to start; Surge of Blood is not begun on low life.
    if (u.rage && s.rage < u.rage.min) return null;
    if (u.degen && p.life < p.def.maxLife * 0.6) return null;
    const left = s.buffT[u.buff];
    if (left > prof.useTime + 0.3) return null;
    if (u.policy === 'guard') {
      const hit = p.life / Math.max(1, p.def.maxLife) < GUARD_LIFE;
      if (!hit || left > 0) return null;
    } else if (u.policy === 'rally') {
      const pack = enemiesNear(w, p.team, p.x, p.y, PACK_RADIUS).length >= PACK_SIZE;
      if (!pack && !isBig(target)) return null;
    } else if (u.second) {
      // A buff the first skill ends is a run: begun to get through a crowd or away when hurt, not at every fight.
      const hurt = p.life < p.def.maxLife * 0.7 && enemiesNear(w, p.team, p.x, p.y, 5).length >= 1;
      const crowded = enemiesNear(w, p.team, p.x, p.y, 4).length >= PACK_SIZE;
      if (!hurt && !crowded) return null;
    } else if (enemiesNear(w, p.team, p.x, p.y, PACK_RADIUS).length < 1) return null;
    return { choice: c, prof, cd: u.cooldown ?? 0.5 };
  }
  if (u.kind === 'shout') {
    // Cast when a pack or a rare enemy is near, like a rallying cry; a standing channel (Rot Touch) goes on while any enemy is near.
    if (u.policy === 'upkeep') {
      if (enemiesNear(w, p.team, p.x, p.y, u.radius).length < 1) return null;
      return { choice: c, prof, cd: u.cooldown };
    }
    const pack = enemiesNear(w, p.team, p.x, p.y, u.radius + 2).length >= PACK_SIZE;
    if (d > u.radius + 2 || (!pack && !isBig(target))) return null;
    return { choice: c, prof, cd: u.cooldown };
  }
  if (u.kind === 'curse') {
    if (d > CAST_RANGE || !w.grid.los(p.x, p.y, target.x, target.y)) return null;
    const have = target.hexes.find((h) => h.id === u.hex);
    if (have && have.t > prof.useTime + 0.5) return null;
    if (!have && target.hexes.length >= Math.max(1, ch.hexLimit)) return null;
    const pack = enemiesNear(w, p.team, target.x, target.y, u.radius).length >= PACK_SIZE;
    if (!pack && !isBig(target) && target.life < 0.5 * target.def.maxLife) return null;
    return { choice: c, prof, cd: 0.5 };
  }
  if (u.kind === 'offering') {
    if (!offeringWanted(w, s, CAST_RANGE + 2)) return null;
    return { choice: c, prof, cd: 0.5 };
  }
  if (u.kind === 'summon') {
    if (c.skill.cooldown !== undefined && !skillReady(s, c)) return null;
    // A spectre needs a corpse to raise.
    if ((u.corpse || u.corpseCost) && !corpseNear(w, p.x, p.y, CAST_RANGE)) return null;
    // A decoy goes up when a pack closes in, or life runs low.
    if (
      u.taunt &&
      enemiesNear(w, p.team, p.x, p.y, PACK_RADIUS).length < PACK_SIZE &&
      !isBig(target) &&
      p.life >= p.def.maxLife * 0.7
    )
      return null;
    // Minions are summoned in the first fight and again when they are gone or have run out.
    if (d > CAST_RANGE + 6 || minionCount(s, c.key) >= summonCount(c, prof)) return null;
    return { choice: c, prof, cd: summonRespawn(c) };
  }
  // A blink closes the gap to a target the primary skill cannot reach yet; one with an effect where it leaves or lands is also
  // used when that would fall on a pack, and Rotting Stride to run through a pack (the character then makes no attack while it lasts).
  if (u.kind !== 'blink') return null;
  if (c.skill.cooldown !== undefined && !skillReady(s, c)) return null;
  if (blinkGroupBusy(w, s, c)) return null;
  // A blink to get away is used when hurt with enemies about, or when a pack has closed in.
  if (u.escape) {
    const hurt = p.life < p.def.maxLife * 0.7 && enemiesNear(w, p.team, p.x, p.y, 5).length >= 1;
    const crowded = enemiesNear(w, p.team, p.x, p.y, 4).length >= PACK_SIZE;
    return hurt || crowded ? { choice: c, prof, cd: u.cooldown } : null;
  }
  const conds = playerConds(w, s, target);
  const reach = skillRange(ch.profile(s.primary, conds, flaskMask(s))) + target.r;
  const gap = d > reach + 2 && d <= u.distance + reach && w.grid.los(p.x, p.y, target.x, target.y);
  const radius =
    (prof.skill.behaviour.kind === 'burst' ? prof.skill.behaviour.radius : 2) * prof.radiusMult;
  const packHere =
    (u.burst === 'depart' || u.burst === 'both') &&
    enemiesNear(w, p.team, p.x, p.y, radius * 1.3).length >= PACK_SIZE;
  // Shadow Swap goes to a corpse with enemies about it.
  const corpseGo =
    !!u.corpse &&
    w.corpses.some(
      (c0) =>
        Math.hypot(c0.x - p.x, c0.y - p.y) <= u.distance + 1 &&
        enemiesNear(w, p.team, c0.x, c0.y, 2.5).length >= 2,
    );
  const packThere =
    u.burst === 'arrive' &&
    gap &&
    enemiesNear(w, p.team, target.x, target.y, radius * 1.3).length >= 2;
  const fight =
    !!u.elusive &&
    s.buffT.elusive <= 0 &&
    d <= CAST_RANGE &&
    enemiesNear(w, p.team, p.x, p.y, PACK_RADIUS).length >= PACK_SIZE;
  if (u.warp && s.warp) return null;
  if (gap || packHere || packThere || fight || corpseGo) return { choice: c, prof, cd: u.cooldown };
  return null;
}

/** Radius of a burning aura, in tiles. */
const BURN_RADIUS = 2.8;

/**
 * How near the character wants to stand to an enemy so that what it carries about itself reaches: a burning aura (Searing Mantle) or
 * circling blades (Orbiting Blades). Zero when it carries nothing of the kind. The character walks in among the enemies, as a player
 * of such a build does, instead of standing off at the range of its attack.
 */
export function contactRange(_w: World, s: Side): number {
  let r = s.char.burn.pct > 0 && !burnOff.has(s) ? BURN_RADIUS * 0.8 : 0;
  const v = s.vortex;
  if (v && v.blades.length > 0) r = Math.max(r, vortexRadius(s) * 0.8);
  else {
    // The first blade is still being cast: it walks in as it casts.
    const spec = s.player.action?.profile.skill.vortex;
    if (spec) r = Math.max(r, spec.radius * s.player.action!.profile.radiusMult * 0.8);
  }
  return r;
}

/** Blades are cast from this far off while the ring is under this share of full: a blade needs nothing in reach. */
export const PRIME_RANGE = 6;
export const PRIME_SHARE = 0.5;

/** How far off the character may cast a skill of circling blades now (zero for any other skill, or a ring half full or more). */
export function primeRange(s: Side, p: SkillProfile): number {
  const spec = p.skill.vortex;
  if (!spec) return 0;
  const v = s.vortex;
  const n = v && v.key === p.skill.id ? v.blades.length : 0;
  return n < spec.max * PRIME_SHARE ? PRIME_RANGE : 0;
}
const BURN_EVERY = 0.5;
/** The character switches a burning aura off below this share of its life, as a player clicks Searing Mantle off, and on again from the second. */
export const BURN_OFF_BELOW = 0.4;
export const BURN_ON_FROM = 0.75;
/** The sides whose character has its burning aura switched off just now (each its own: two characters of a world switch on their own life). */
const burnOff = new WeakSet<Side>();

/** A burning aura damages the enemies near the player (and the player, without killing it) twice a second. */
export function tickAuraBurn(w: World, s: Side, dt: number): void {
  const b = s.char.burn;
  if (b.pct <= 0 && b.self <= 0) return;
  s.auraBurnT += dt;
  if (s.auraBurnT < BURN_EVERY) return;
  s.auraBurnT -= BURN_EVERY;
  const p = s.player;
  if (!p.alive) return;
  const frac = p.life / Math.max(1, p.def.maxLife);
  if (burnOff.has(s)) {
    if (frac >= BURN_ON_FROM) burnOff.delete(s);
    else return;
  } else if (frac < BURN_OFF_BELOW) {
    burnOff.add(s);
    return;
  }
  // The enemies burn for a share of the character's life, with the character's damage over time modifiers. The life is the
  // sheet's: a duel's larger pool (docs/DUEL-BALANCE.md 4.2) is toughness, not damage.
  const amount =
    (b.pct / 100) *
    (p.def.maxLife / s.lifeMult) *
    BURN_EVERY *
    s.char.db.mult('damage', playerCtx(w, s));
  if (amount > 0)
    for (const e of enemiesNear(w, p.team, p.x, p.y, BURN_RADIUS))
      rawHit(w, e, amount, 3, s, 'Burning aura');
  // The character burns too, as fire damage that its resistance and energy shield answer to; it never kills.
  if (b.self > 0) {
    const was = s.opts.godMode;
    s.opts.godMode = true;
    rawHit(w, p, (b.self / 100) * p.def.maxLife * BURN_EVERY, 3, null, 'Searing Mantle');
    s.opts.godMode = was;
    p.life = Math.max(1, p.life);
  }
}

/** What a utility cast does when it lands: the buff starts, the curse falls on the target and the pack around it, the player blinks. */
export function applyUtility(w: World, a: Actor, act: Action): void {
  const c = a.side!.char.utilities.find((x) => x.skill.id === act.profile.skill.id);
  const u = c?.skill.utility;
  if (!c || !u) return;
  if (c.skill.tags.includes('warcry')) a.side!.utilityReady[WARCRIES] = w.t + WARCRY_SECONDS;
  if (u.kind === 'shout') {
    w.events.push({ t: 'cry', x: a.x, y: a.y, r: u.radius });
    const near = enemiesNear(w, a.team, a.x, a.y, u.radius);
    for (const e of near)
      for (const s of u.statuses) {
        // A warcry's shout is scaled by `warcryEffect`, as its buffs are on the character (calc/character.ts).
        const cryEffect = c.skill.tags.includes('warcry')
          ? a.side!.char.db.mult('warcryEffect')
          : 1;
        const v =
          (levelValue(s.v, c.skill.level) +
            levelValue(s.perNearby ?? 0, c.skill.level) * (near.length - 1)) *
          cryEffect;
        applyStatus(w, e, s.id, {
          seconds: s.seconds * a.side!.char.db.mult('buffDuration') * act.profile.skillDuration,
          v,
          x: s.x,
        });
      }
    return;
  }
  if (u.kind === 'buff' && u.banner) {
    useBanner(w, a.side!, c, act.profile);
    return;
  }
  if (u.kind === 'buff') {
    const before = a.side!.buffT[u.buff];
    // Rampage Call lasts as long as the rage does, and its cooldown waits for the end.
    if (u.rage) {
      a.side!.berserkT = 0.001;
      a.side!.buffT[u.buff] = 1e9;
      a.side!.utilityReady[c.key] = 1e9;
      w.events.push({ t: 'buff', id: u.buff });
      return;
    }
    gainBuff(w, a.side!, u.buff);
    if (u.second) gainBuff(w, a.side!, u.second.buff);
    if (u.shell) startShell(a.side!, u.buff, u.shell, c.skill.level, act.profile);
    // The charges a guard spends make it last longer and take more of the physical damage away.
    let spent = 0;
    if (u.consume) {
      spent = Math.min(u.consume.max, a.side!.char.charges[u.consume.charge]);
      if (spent > 0) spendCharges(w, a.side!, u.consume.charge, spent);
      a.side!.guard = {
        buff: u.buff,
        physMult: Math.pow(1 - u.consume.physLess / 100, spent),
      };
    }
    // The buff's own length is the gem's: a utility buff lasts as long as its gem says.
    const length = u.seconds * (1 + ((u.consume?.durationPct ?? 0) / 100) * spent);
    a.side!.buffT[u.buff] = Math.max(
      before,
      length * a.side!.char.db.mult('buffDuration') * act.profile.skillDuration,
    );
    if (u.second) a.side!.buffT[u.second.buff] = Math.max(0, a.side!.buffT[u.buff]);
    // A guard's cooldown does not run while it lasts, and the other guards wait out the same time.
    if (u.policy === 'guard') {
      const until = w.t + a.side!.buffT[u.buff] + (u.cooldown ?? 0);
      a.side!.utilityReady[GUARDS] = until;
      a.side!.utilityReady[c.key] = until;
    }
    return;
  }
  if (u.kind === 'offering') {
    castOffering(w, a.side!, c);
    return;
  }
  if (u.kind === 'summon') {
    if (u.corpse) {
      const corpse = corpseNear(w, a.x, a.y, CAST_RANGE);
      if (corpse) raiseSpectre(w, a.side!, c, act.profile, corpse);
    } else {
      if (u.corpseCost) {
        const corpse = corpseNear(w, a.x, a.y, CAST_RANGE);
        if (!corpse) return;
        takeCorpse(w, corpse);
      }
      summonMinions(w, a.side!, c, act.profile);
    }
    return;
  }
  const target = actorById(w, act.targetId);
  if (!target || !target.alive) return;
  if (u.kind === 'curse') {
    const effect = hexEffect(u.hex, c.skill.level) * a.side!.char.db.mult('curseEffect');
    for (const e of enemiesNear(w, a.team, target.x, target.y, u.radius))
      applyHex(
        w,
        e,
        u.hex,
        Math.round(effect * 10) / 10,
        a.side!.char.hexLimit,
        c.skill.level,
        hexSeconds(u.hex, c.skill.level) * act.profile.skillDuration,
      );
    return;
  }
  // Blink: land next to the target, a little inside the primary skill's reach (src/sim/blinks.ts).
  blinkCast(w, a, act.profile, c, target);
}
