import { fireTriggers } from './triggers';
import { bossAI } from './bosses';
import { abilitiesOf } from '../data/abilities';
import { skillRange, type SkillChoice } from '../calc/character';
import type { Defence } from '../calc/combat';
import type { SkillProfile } from '../calc/skill';
import {
  ENGAGE_RANGE,
  BLOCK_LIMIT,
  BLOCK_WINDOW,
  LEASH_TIME,
  LOOT_RANGE,
  AMBUSH_RANGE,
  MONSTER_AGGRO,
  PATROL_SPEED,
  PACK_ALERT,
  REPATH_INTERVAL,
  REPOSITION_DIST,
  REPOSITION_TIME,
  RETREAT_COOLDOWN,
  RETREAT_TIME,
  SCREENED_HITS,
  SCREENED_SKIP,
  SCREENED_TIME,
  SKIP_TIME,
  STALL_TIME,
  STUCK_TIME,
} from '../data/constants';
import { MONSTER_TYPES } from '../data/monsters';
import { actorById, segmentDist, startAction } from './actions';
import { bloaterBurst, corpseNear, isZone, moveMult, shieldedByPylon } from './factions';
import { flaskMask, monsterConds, playerConds } from './combat';
import { skillReady, useSkill } from './cooldowns';
import { canPay, payCost } from './cost';
import { deployFull } from './deploy';
import { inTelegraph, telegraphs } from './telegraph';
import { inBlast, pending } from './blasts';
import { inWindow, trySidearm, tryWindow } from './encounters';
import {
  afterBlow,
  revealed,
  senseOf,
  steer,
  targetOf,
  whileStunned,
  withdrawing,
} from './movement';
import { running } from './blinks';
import { stepping } from './steps';
import {
  contactRange,
  enemiesNear,
  markOpened,
  openerDue,
  primeRange,
  utilityPick,
} from './utility';
import type { RotationEntry } from '../calc/strategy';
import {
  CLOSE_RANGE,
  FIGHT_GAP,
  DODGE_DRAIN,
  DODGE_MAX,
  DODGE_REST,
  KITE_COOLDOWN,
  KITE_RANGE,
  KITE_TIME,
  PACK_RADIUS,
  PACK_SIZE,
  STRATEGY_DEFAULTS,
  type SkillWhen,
} from '../data/strategy';
import type { Actor, World } from './types';
import { foeMinions, hunted, livingEnemiesOf } from './side';
import type { Side } from './side';

function canAct(a: Actor): boolean {
  return a.alive && !a.action && a.stunT <= 0 && a.ail.freezeT <= 0;
}

/** Whether the player is using a skill it walks on through (Orbiting Blades): it moves, but starts nothing new. */
function castingOnTheMove(a: Actor): boolean {
  return a.alive && !!a.action?.profile.skill.castMoving && a.stunT <= 0 && a.ail.freezeT <= 0;
}

/** Move an actor toward a point at its speed, sliding along walls. */
export function step(w: World, a: Actor, dx: number, dy: number, dt: number): void {
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return;
  const speed =
    a.def.moveSpeed * (1 - a.ail.chill) * moveMult(a) * (a.action?.profile.skill.castMoving ?? 1);
  const d = Math.min(len, speed * dt);
  const nx = a.x + (dx / len) * d;
  const ny = a.y + (dy / len) * d;
  // Fliers cross walls; they only stay inside the map.
  const c =
    a.flies || a.phases
      ? {
          x: Math.max(0.5, Math.min(w.grid.w - 0.5, nx)),
          y: Math.max(0.5, Math.min(w.grid.h - 0.5, ny)),
        }
      : w.grid.collide(nx, ny, a.r);
  const walked = Math.hypot(c.x - a.x, c.y - a.y);
  a.x = c.x;
  a.y = c.y;
  a.moving = true;
  // Each stride of the character's walk can set off a trigger (a burst of fire with each step).
  if (a.isPlayer && a.side && a.side.char.triggers.length) {
    const t = a.side.trig;
    t.stride = (t.stride ?? 0) + walked;
    while (t.stride >= STRIDE) {
      t.stride -= STRIDE;
      fireTriggers(w, a.side, { on: 'step' });
    }
  }
}

/** Tiles of walking between two stride triggers. */
const STRIDE = 1;

/** Walk toward a point using direct movement when visible, otherwise A*. */
function moveTo(w: World, s: Side, a: Actor, tx: number, ty: number, dt: number): void {
  const ai = s.ai;
  if (w.grid.los(a.x, a.y, tx, ty) && clearPath(w, a.x, a.y, tx, ty, a.r)) {
    ai.path = [];
    step(w, a, tx - a.x, ty - a.y, dt);
    return;
  }
  const key = `${Math.floor(tx)},${Math.floor(ty)}`;
  ai.pathT -= dt;
  if (key !== ai.pathKey || ai.pathT <= 0 || ai.path.length === 0) {
    ai.pathKey = key;
    ai.pathT = REPATH_INTERVAL;
    ai.path = w.grid.astar(a.x, a.y, tx, ty) ?? [];
  }
  // Skip ahead to the farthest visible path node (up to a few) for smoother motion.
  while (
    ai.path.length > 1 &&
    w.grid.los(a.x, a.y, ai.path[1].x, ai.path[1].y) &&
    clearPath(w, a.x, a.y, ai.path[1].x, ai.path[1].y, a.r)
  )
    ai.path.shift();
  const next = ai.path[0];
  if (!next) {
    step(w, a, tx - a.x, ty - a.y, dt);
    return;
  }
  if (Math.hypot(next.x - a.x, next.y - a.y) < 0.15) ai.path.shift();
  step(w, a, next.x - a.x, next.y - a.y, dt);
}

/** LOS with clearance: checks parallel rays offset by the radius. */
function clearPath(w: World, x0: number, y0: number, x1: number, y1: number, r: number): boolean {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ox = (-dy / len) * r * 0.9;
  const oy = (dx / len) * r * 0.9;
  return (
    w.grid.los(x0 + ox, y0 + oy, x1 + ox, y1 + oy) && w.grid.los(x0 - ox, y0 - oy, x1 - ox, y1 - oy)
  );
}

/** Seconds the player will chase one drop or chest before it gives up on it. */
const LOOT_GIVE_UP = 20;

/**
 * Types the player shoots first when they are within reach (EXPANSION 5.9): nests and pylons, and what a boss brings (a
 * Magistrate's Witnesses, the Unmaker's shards: docs/BOSSES.md 11.1).
 */
const SUPPORT_TYPES = new Set(['nest', 'pylon', 'witness', 'shard']);
/** Of those, the ones that must be in sight: a pylon and a shard are gone for even through a wall. */
const SUPPORT_NEEDS_SIGHT = new Set(['nest', 'witness']);
const SUPPORT_PRIORITY = 4;

/** How much nearer a rare, champion or boss enemy counts with the `rares` target priority, in tiles. */
const RARE_PRIORITY = 4;

function findTarget(w: World, s: Side): Actor | null {
  const p = s.player;
  const prio = s.char.build.strategy?.target ?? STRATEGY_DEFAULTS.target;
  // In a duel the character engages the nearest enemy at any distance (docs/DUEL.md 3.4), and its enemies are the other side's
  // character and its minions. On a map the one side's enemies are the monsters of `w.actors`, as ever.
  const duel = !!s.opts.duel;
  const foes = w.sides.length === 1 ? w.actors : livingEnemiesOf(w, s.team);
  let best: Actor | null = null;
  let bd = Infinity;
  for (const m of foes) {
    if (m.team === s.team || !m.alive || m.phaseT > 0) continue;
    if (m.id === s.ai.skipId && w.t < s.ai.skipUntil) continue;
    const real = Math.hypot(m.x - p.x, m.y - p.y);
    if (!duel && real > ENGAGE_RANGE) continue;
    // Spawners and shield-givers come first: a nest feeds the pack and a pylon makes it untouchable.
    if (!revealed(w, m)) continue;
    // A monster a Warden Pylon wards is never chosen: every blow on it is wasted. It can be chosen in the ward's off second.
    if (w.hasPylons && shieldedByPylon(w, m)) continue;
    const support = !!m.mon && SUPPORT_TYPES.has(m.mon.spec.type);
    // The target priority (Strategy tab): rares count as nearer, or the weakest goes first (distance breaks a tie). Weakest is
    // the least life left in points, not as a share: by share a boss with a scratch on it outranks its whole fresh escort.
    // (The other character counts as a boss: the one a `rares` priority goes for first, and never one to give up on.)
    const d =
      prio === 'lowest'
        ? (support ? -1e9 : 0) + m.life + real * 1e-6
        : real -
          (support ? SUPPORT_PRIORITY : 0) -
          (prio === 'rares' && (m.isPlayer || isBig(m)) ? RARE_PRIORITY : 0);
    if (d > bd + 1e-9) continue;
    if (Math.abs(d - bd) <= 1e-9 && best && m.life >= best.life) continue;
    // Out of sight is no reason to ignore a pylon: everything around it is untouchable until it falls.
    if (!support && !w.grid.los(p.x, p.y, m.x, m.y)) continue;
    if (support && SUPPORT_NEEDS_SIGHT.has(m.mon!.spec.type) && !w.grid.los(p.x, p.y, m.x, m.y))
      continue;
    best = m;
    bd = d;
  }
  return best;
}

/** The character's choice of target now (for tests). */
export const findTargetForTest = (w: World, s: Side): Actor | null => findTarget(w, s);

/** A debuff that is renewed, not stacked, is cast again when it is about to end, not while it holds (Creeping Plague). */
function alreadyAfflicted(p: SkillProfile, target: Actor): boolean {
  const sd = p.skillDot;
  if (!sd || sd.spec.stack !== 'refresh' || !sd.spec.hitless) return false;
  return target.sdots.some((d) => d.src === p.skill.id && d.t > 0.8);
}

/** A skill that needs a corpse waits for one near the target, in reach of the character. */
function corpseReady(w: World, s: Side, p: SkillProfile, target: Actor): boolean {
  if (!p.skill.needsCorpse) return true;
  const pl = s.player;
  const c = corpseNear(w, target.x, target.y, 6);
  return !!c && Math.hypot(c.x - pl.x, c.y - pl.y) <= skillRange(p) + 2;
}

/** Whether a skill can hurt a target at all: some of its damage is of a type the target is not immune to. */
export function canHurt(p: SkillProfile, def: Defence): boolean {
  const sd = p.skillDot;
  if (sd && !def.immune[sd.type] && !(sd.type === 4 && def.immuneChaos)) return true;
  return p.hands.some((h) =>
    h.chunks.some((c) => c.max > 0 && !def.immune[c.type] && !(c.type === 4 && def.immuneChaos)),
  );
}

/** Whether the player, from where it stands, can use a skill on the target. */
function inReach(w: World, s: Side, prof: SkillProfile, target: Actor): boolean {
  const p = s.player;
  const melee = prof.skill.behaviour.kind === 'melee';
  const reach = Math.max(skillRange(prof), primeRange(s, prof)) + target.r + (melee ? p.r : 0);
  const d = Math.hypot(target.x - p.x, target.y - p.y);
  return d <= reach && (melee || w.grid.los(p.x, p.y, target.x, target.y));
}

type Pick = {
  which: 'utility' | 'secondary' | 'primary' | 'default';
  prof: SkillProfile;
  costsLife: boolean;
  choice: SkillChoice;
  entry?: RotationEntry<SkillChoice>;
  /** Seconds before a utility skill can be cast again. */
  cd: number;
};

const isBig = (a: Actor) => a.rarity === 'boss' || a.rarity === 'miniboss' || a.rarity === 'rare';

/** Whether a skill's condition (Strategy tab) holds in the fight as it is now. */
function whenHolds(w: World, s: Side, when: SkillWhen, target: Actor): boolean {
  if (when === 'any') return true;
  if (when === 'rare') return isBig(target);
  if (when === 'boss') return target.rarity === 'boss' || target.rarity === 'miniboss';
  const p = s.player;
  const pack = enemiesNear(w, p.team, p.x, p.y, PACK_RADIUS).length >= PACK_SIZE;
  return when === 'pack' ? pack : !pack;
}

/** A damage skill that keeps its debuff on the target is not cast again while the debuff has a while to run. */
function debuffHolds(prof: SkillProfile, target: Actor): boolean {
  return target.sdots.some((d) => d.src === prof.skill.id && d.t > prof.useTime + 0.3);
}

/**
 * A skill kept up that leaves something standing is not cast again while what it left holds: Tempest Mote's orb has a while to run
 * and the target is in its reach; Pyre Burst's geysers stand at their cap, each with a while to run, and one reaches the target;
 * Orbiting Blades has every blade it can hold, the shortest with a while to run.
 */
function standingHolds(s: Side, prof: SkillProfile, target: Actor): boolean {
  const left = prof.useTime + 0.3;
  const sk = prof.skill;
  const near = (x: number, y: number, r: number) =>
    Math.hypot(target.x - x, target.y - y) <= r + target.r;
  if (sk.stormOrb) {
    const o = s.stormOrb;
    if (!o || o.profile.skill.id !== sk.id || o.t <= left) return false;
    return near(o.x, o.y, sk.stormOrb.radius * o.profile.radiusMult);
  }
  if (sk.geyser) {
    // Counted as the cap is (placeGeyser, src/sim/fields.ts): every geyser of the side.
    const mine = s.fields.filter((f) => f.kind === 'geyser');
    return (
      mine.length >= sk.geyser.max &&
      mine.every((f) => f.t > left) &&
      mine.some((f) => near(f.x, f.y, f.radius))
    );
  }
  if (sk.vortex) {
    const v = s.vortex;
    return (
      !!v && v.key === sk.id && v.blades.length >= sk.vortex.max && Math.min(...v.blades) > left
    );
  }
  return false;
}

/**
 * What the character does now against its target (the Strategy tab, docs/PLAYER-AI.md): the first of its skills, in the order the
 * strategy gives, whose role and condition call for it and that it can use from where it stands; then the first main skill it can
 * use (it walks into reach for it); then, with no main skill to use, a periodic one that is ready early; and last the weapon.
 */
function chooseSkill(w: World, s: Side, target: Actor): Pick {
  const conds = playerConds(w, s, target);
  const p = s.player;
  const usable = (c: SkillChoice, prof: SkillProfile): boolean =>
    skillReady(s, c) &&
    canHurt(prof, target.def) &&
    canPay(s, c.costsLife, prof.cost) &&
    !deployFull(s, c, prof) &&
    corpseReady(w, s, prof, target);
  for (const e of s.char.rotation) {
    if (!whenHolds(w, s, e.when, target)) continue;
    const c = e.choice;
    if (c.skill.utility) {
      const u = utilityPick(w, s, e, target);
      if (u)
        return {
          which: 'utility',
          prof: u.prof,
          costsLife: c.costsLife,
          choice: c,
          entry: e,
          cd: u.cd,
        };
      continue;
    }
    if (
      e.role === 'periodic' &&
      c.skill.cooldown === undefined &&
      (s.secondaryReady[c.key] ?? 0) > w.t
    )
      continue;
    if (e.role === 'opener' && !openerDue(s, c.key, target)) continue;
    if (e.role === 'emergency' && p.life >= p.def.maxLife * e.life) continue;
    const prof = s.char.profile(c, conds, flaskMask(s));
    if (e.role === 'keepUp' && (debuffHolds(prof, target) || standingHolds(s, prof, target)))
      continue;
    if (!usable(c, prof) || !inReach(w, s, prof, target)) continue;
    return { which: 'secondary', prof, costsLife: c.costsLife, choice: c, entry: e, cd: 0 };
  }
  let starved = false;
  for (const e of s.char.mains) {
    if (!whenHolds(w, s, e.when, target)) continue;
    const c = e.choice;
    // A summon cast like a damage skill (Call Furies) is used whenever it would add a minion.
    if (c.skill.utility) {
      const u = utilityPick(w, s, e, target);
      if (u)
        return {
          which: 'utility',
          prof: u.prof,
          costsLife: c.costsLife,
          choice: c,
          entry: e,
          cd: u.cd,
        };
      continue;
    }
    const prof = s.char.profile(c, conds, flaskMask(s));
    if (!canPay(s, c.costsLife, prof.cost)) starved = true;
    // Against a target immune to everything the skill deals, the next skill (or the weapon) is used.
    if (!usable(c, prof) || alreadyAfflicted(prof, target)) continue;
    return { which: 'primary', prof, costsLife: c.costsLife, choice: c, entry: e, cd: 0 };
  }
  // No main skill can be used (its cooldown, an immune target): a periodic skill that is ready is better than the weapon. Not when
  // the main skill waits for mana: the free weapon lets the mana come back, where another skill would keep it low.
  if (!starved)
    for (const e of s.char.rotation) {
      const c = e.choice;
      if (c.skill.utility || e.role !== 'periodic' || !whenHolds(w, s, e.when, target)) continue;
      const prof = s.char.profile(c, conds, flaskMask(s));
      if (!usable(c, prof) || !inReach(w, s, prof, target)) continue;
      return { which: 'secondary', prof, costsLife: c.costsLife, choice: c, entry: e, cd: 0 };
    }
  return {
    which: 'default',
    prof: s.char.profile(s.char.defaultAttack, conds, flaskMask(s)),
    costsLife: false,
    choice: s.char.defaultAttack,
    cd: 0,
  };
}

/**
 * A lasting zone, a blast about to land or a monster's area attack winding up that covers a point, if any (with a margin in
 * tiles). The warnings of docs/ROSTER.md 5.3 (a wedge, a ring, a lane) count as much as a ground effect.
 */
export function hazardAt(
  w: World,
  team: number,
  x: number,
  y: number,
  margin = 0,
): { x: number; y: number; radius: number } | null {
  for (const e of w.effects) {
    if (isZone(e)) {
      if (Math.hypot(x - e.x, y - e.y) <= e.radius + margin) return e;
      continue;
    }
    // A blast is a hazard once its warning shows (a later step of a pattern is not yet), by its shape. A blow that follows
    // the character (a Sentence) cannot be stepped out of, so the character does not try.
    if (e.team !== team && e.t > 0 && !e.unavoidable && !pending(e) && inBlast(e, x, y, margin))
      return e;
  }
  for (const t of telegraphs(w))
    if (inTelegraph(t, x, y, margin))
      return { x: t.x, y: t.y, radius: 'radius' in t ? t.radius : t.width / 2 };
  return null;
}

/**
 * Whether a living body of another team stands on the straight way from one point to another, for a body of radius `r`: a monster,
 * or the other side's character or one of its minions.
 */
function bodyOnWay(
  w: World,
  team: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
): boolean {
  for (const m of w.actors) {
    if (m.team === team || !m.alive) continue;
    if (segmentDist(m.x, m.y, x0, y0, x1, y1) < r + m.r + 0.05) return true;
  }
  for (const m of foeMinions(w, team)) {
    if (!m.alive) continue;
    if (segmentDist(m.x, m.y, x0, y0, x1, y1) < r + m.r + 0.05) return true;
  }
  return false;
}

/**
 * Step out of a hazard (EXPANSION 5.8): the nearest clear spot, but only one from which the target is still in
 * reach, so the player never walks out of the fight. Returns whether it moved.
 */
function avoidHazard(w: World, s: Side, dt: number): boolean {
  const p = s.player;
  const ai = s.ai;
  if (ai.dodgeRest > 0) {
    ai.dodgeRest -= dt;
    return false;
  }
  if (!hazardAt(w, s.team, p.x, p.y, p.r)) {
    ai.dodgeT = Math.max(0, ai.dodgeT - DODGE_DRAIN * dt);
    return false;
  }
  const target = s.ai.targetId ? actorById(w, s.ai.targetId) : undefined;
  const prof = s.primary.usable
    ? s.char.profile(s.primary, 0)
    : s.char.profile(s.char.defaultAttack, 0);
  const melee = prof.skill.behaviour.kind === 'melee';
  const reach = skillRange(prof) + (target ? target.r : 0) + (melee ? p.r : 0);
  let best: { x: number; y: number; d: number } | null = null;
  for (let k = 0; k < 16; k++) {
    const ang = (k / 16) * Math.PI * 2;
    for (const len of [1.5, 2.5, 3.5]) {
      const c = w.grid.collide(p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len, p.r);
      if (Math.hypot(c.x - p.x, c.y - p.y) < len - 0.2) continue;
      if (hazardAt(w, s.team, c.x, c.y, p.r + 0.3) || !w.grid.los(p.x, p.y, c.x, c.y)) continue;
      // A way out through a monster is none: the body shoves it along and its warning goes with it.
      if (bodyOnWay(w, s.team, p.x, p.y, c.x, c.y, p.r)) continue;
      if (target && target.alive) {
        const d = Math.hypot(target.x - c.x, target.y - c.y);
        if (d > reach || (!melee && !w.grid.los(c.x, c.y, target.x, target.y))) continue;
      }
      if (!best || len < best.d) best = { x: c.x, y: c.y, d: len };
      break;
    }
  }
  if (!best) return false;
  // A dodge that has gone on too long is given up: the character stands and fights for a while.
  ai.dodgeT += dt;
  if (ai.dodgeT >= DODGE_MAX) {
    ai.dodgeT = 0;
    ai.dodgeRest = DODGE_REST;
    return false;
  }
  moveTo(w, s, p, best.x, best.y, dt);
  return true;
}

/**
 * The `kite` spacing (Strategy tab): a ranged character steps back when an enemy comes within `KITE_RANGE`, to a spot from which
 * its target is still in reach and in sight, for a moment, and then fights on. Returns whether it moved.
 */
function kiteStep(w: World, s: Side, target: Actor, dt: number): boolean {
  const p = s.player;
  const ai = s.ai;
  ai.kiteCd -= dt;
  if (ai.kiteT > 0) {
    ai.kiteT -= dt;
    if (Math.hypot(ai.kiteX - p.x, ai.kiteY - p.y) > 0.2) {
      moveTo(w, s, p, ai.kiteX, ai.kiteY, dt);
      return true;
    }
    ai.kiteT = 0;
  }
  if (s.char.build.strategy?.spacing !== 'kite' || ai.kiteCd > 0) return false;
  const prof = s.char.profile(s.primary, 0);
  if (prof.skill.behaviour.kind === 'melee') return false;
  const range = skillRange(prof) + target.r;
  // A skill of short reach gains nothing by backing off.
  if (range < KITE_RANGE + 2) return false;
  let near: Actor | null = null;
  let nd = KITE_RANGE;
  for (const m of livingEnemiesOf(w, s.team)) {
    if (m.phaseT > 0 || m.stationary) continue;
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < nd) {
      nd = d;
      near = m;
    }
  }
  if (!near) return false;
  let best: { x: number; y: number; score: number } | null = null;
  for (let k = 0; k < 16; k++) {
    const ang = (k / 16) * Math.PI * 2;
    for (const len of [2.5, 3.5]) {
      const c = w.grid.collide(p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len, p.r);
      if (Math.hypot(c.x - p.x, c.y - p.y) < len - 0.2) continue;
      if (hazardAt(w, s.team, c.x, c.y, p.r + 0.3) || !w.grid.los(p.x, p.y, c.x, c.y)) continue;
      if (bodyOnWay(w, s.team, p.x, p.y, c.x, c.y, p.r)) continue;
      if (Math.hypot(target.x - c.x, target.y - c.y) > range) continue;
      if (!w.grid.los(c.x, c.y, target.x, target.y)) continue;
      const score = Math.hypot(near.x - c.x, near.y - c.y);
      if (!best || score > best.score) best = { x: c.x, y: c.y, score };
    }
  }
  // Only a step that gains real distance is worth taking.
  if (!best || best.score < nd + 1.5) return false;
  ai.kiteT = KITE_TIME;
  ai.kiteCd = KITE_COOLDOWN;
  ai.kiteX = best.x;
  ai.kiteY = best.y;
  s.stats.kites++;
  moveTo(w, s, p, best.x, best.y, dt);
  return true;
}

export function playerAI(w: World, s: Side, dt: number): void {
  const p = s.player;
  const ai = s.ai;
  p.moving = false;
  // A skill used on the move: the character walks on while it casts (and starts nothing new until it is done).
  const busy = !!p.action;
  if (!canAct(p) && !castingOnTheMove(p)) return;
  if (avoidHazard(w, s, dt)) return;

  // Engage. (A duel has no range to engage within, and no target to give up on: docs/DUEL.md 3.4.)
  const duel = !!s.opts.duel;
  let target = ai.targetId ? actorById(w, ai.targetId) : undefined;
  // A target the pylons' ward comes up over is let go at once, and another chosen on this tick (findTarget passes over it while
  // the ward holds).
  if (
    target &&
    (!target.alive ||
      (!duel && Math.hypot(target.x - p.x, target.y - p.y) > ENGAGE_RANGE + 3) ||
      (w.hasPylons && shieldedByPylon(w, target)))
  )
    target = undefined;
  ai.scanT -= dt;
  const strategy = s.char.build.strategy;
  // With the `stick` priority, a target is kept until it falls or gets away.
  const stick = strategy?.target === 'stick' && !!target;
  if (!target || (ai.scanT <= 0 && !stick)) {
    ai.scanT = 0.1;
    target = findTarget(w, s) ?? undefined;
  }
  if (target && target.id === ai.skipId && w.t < ai.skipUntil) target = undefined;
  // Rotting Stride and Slipstream Run are run in: no attack until they are over (a skill used would end them).
  if (target && running(s)) target = undefined;
  if (target) {
    // Stall breaker: a target that takes no damage for a long time is dropped for a while, so the
    // run moves on (and the monster, if it is chasing, comes to the player instead). A duel has none: a stall ends it instead
    // (docs/DUEL.md 4.3).
    if (!duel) {
      if (ai.watchId !== target.id || target.life < ai.watchLife - 1e-6) {
        ai.watchId = target.id;
        ai.watchLife = target.life;
        ai.watchT = w.t;
        ai.aimHits = 0;
        ai.strayHits = 0;
      } else if (
        w.t - ai.watchT > SCREENED_TIME &&
        ai.aimHits === 0 &&
        ai.strayHits >= SCREENED_HITS
      ) {
        // Screened: every hit lands on something in front of it. Deal with that first; no stall, it was not the target's doing.
        ai.skipId = target.id;
        ai.skipUntil = w.t + SCREENED_SKIP;
        ai.watchId = 0;
        ai.targetId = 0;
        return;
      } else if (w.t - ai.watchT > STALL_TIME && target.rarity !== 'boss') {
        // (A boss is never given up on: its shield or its regrowth may hold its life up for a while, docs/BOSSES.md 11.1.)
        ai.skipId = target.id;
        ai.skipUntil = w.t + SKIP_TIME;
        ai.watchId = 0;
        ai.targetId = 0;
        s.stats.stalls++;
        w.events.push({ t: 'stall', id: target.id });
        return;
      }
    }
    ai.targetId = target.id;
    ai.mode = 'engage';
    // A new fight begins after a quiet spell (an opener is used once a fight).
    if (w.t - ai.lastEngaged > FIGHT_GAP) ai.fight++;
    ai.lastEngaged = w.t;
    if (kiteStep(w, s, target, dt)) return;
    const pick = chooseSkill(w, s, target);
    const { which, prof, costsLife, choice, entry } = pick;
    // A skill used on the move: walk on toward what the blades reach until it is done.
    const contact = contactRange(w, s);
    if (busy && which === 'utility') {
      if (contact > 0 && Math.hypot(target.x - p.x, target.y - p.y) > contact + target.r)
        moveTo(w, s, p, target.x, target.y, dt);
      return;
    }
    if (which === 'utility') {
      payCost(s, costsLife, prof.cost);
      s.utilityReady[choice.key] = w.t + pick.cd;
      useSkill(w, s, choice);
      if (entry?.role === 'opener') markOpened(s, choice.key, target);
      startAction(w, p, 'utility', prof, target);
      return;
    }
    const melee = prof.skill.behaviour.kind === 'melee';
    // A burning aura or circling blades only reach what is close: walk in among the enemies, whatever the attack's range. While
    // the ring is thin the blades are cast from farther off (the character walks in as it casts them).
    const prime = busy ? 0 : primeRange(s, prof);
    const reach0 = Math.max(skillRange(prof), prime) + target.r + (melee ? p.r : 0);
    // The `close` spacing (Strategy tab): a ranged character stands nearer than its skill's range.
    const close = !melee && strategy?.spacing === 'close' ? CLOSE_RANGE + target.r : Infinity;
    const reach = Math.min(reach0, contact > 0 && !prime ? contact + target.r : Infinity, close);
    const d = Math.hypot(target.x - p.x, target.y - p.y);
    const inRange = d <= reach && (melee || w.grid.los(p.x, p.y, target.x, target.y));
    // Arrows keep hitting walls (a wide fan in a narrow corridor): close in for a clearer shot.
    if (!melee && ai.repoT <= 0 && ai.blocked >= BLOCK_LIMIT && w.t - ai.blockedT <= BLOCK_WINDOW) {
      ai.repoT = REPOSITION_TIME;
      ai.blocked = 0;
    }
    if (ai.repoT > 0) {
      ai.repoT -= dt;
      if (d > REPOSITION_DIST) {
        moveTo(w, s, p, target.x, target.y, dt);
        return;
      }
    }
    if (inRange && busy) return;
    if (inRange) {
      if (which === 'primary' || which === 'secondary') payCost(s, costsLife, prof.cost);
      if (entry?.role === 'periodic' && choice.skill.cooldown === undefined)
        s.secondaryReady[choice.key] = w.t + s.char.cooldownOf(choice, playerConds(w, s, target));
      if (which === 'primary' || which === 'secondary') useSkill(w, s, choice);
      if (entry?.role === 'opener') markOpened(s, choice.key, target);
      startAction(w, p, which, prof, target);
      return;
    }
    moveTo(w, s, p, target.x, target.y, dt);
    return;
  }
  ai.targetId = 0;

  // A duel is for the other character: with nothing to hit (it is phased out, or out of sight, or this character is running in
  // Slipstream Run) walk toward it, so that the distance closes rather than stands; no loot, no exit, no waypoints (docs/DUEL.md 3.4).
  if (duel) {
    ai.mode = 'engage';
    let foe: Actor | null = null;
    let fd = Infinity;
    for (const o of w.sides) {
      if (o.team === s.team || !o.player.alive) continue;
      const d = Math.hypot(o.player.x - p.x, o.player.y - p.y);
      if (d < fd) {
        fd = d;
        foe = o.player;
      }
    }
    if (foe) moveTo(w, s, p, foe.x, foe.y, dt);
    return;
  }

  // Loot.
  let lootX = 0;
  let lootY = 0;
  let lootD = LOOT_RANGE;
  let lootKind: 'drop' | 'chest' | null = null;
  let lootIdx = -1;
  w.drops.forEach((d, i) => {
    const dd = Math.hypot(d.x - p.x, d.y - p.y);
    if (dd < lootD) {
      lootD = dd;
      lootX = d.x;
      lootY = d.y;
      lootKind = 'drop';
      lootIdx = i;
    }
  });
  w.chests.forEach((c, i) => {
    if (c.opened) return;
    const dd = Math.hypot(c.x - p.x, c.y - p.y);
    if (dd < lootD) {
      lootD = dd;
      lootX = c.x;
      lootY = c.y;
      lootKind = 'chest';
      lootIdx = i;
    }
  });
  // A hunt for something that cannot be reached is given up after a while, rather than for ever.
  if (lootKind) {
    const id = lootKind === 'drop' ? w.drops[lootIdx].id : w.chests[lootIdx].id;
    if (ai.lootId !== id) {
      ai.lootId = id;
      ai.lootSince = w.t;
    } else if (w.t - ai.lootSince > LOOT_GIVE_UP) {
      if (lootKind === 'drop') w.drops.splice(lootIdx, 1);
      else w.chests[lootIdx].opened = true;
      ai.lootId = 0;
      lootKind = null;
    }
  }
  if (lootKind) {
    ai.mode = 'loot';
    if (lootD < 0.7) {
      if (lootKind === 'drop') {
        const d = w.drops[lootIdx];
        w.drops.splice(lootIdx, 1);
        s.picked.push(d.item);
        s.stats.picked++;
        w.events.push({ t: 'pickup', id: d.id });
      } else {
        const c = w.chests[lootIdx];
        c.opened = true;
        w.events.push({ t: 'chest', id: c.id });
        for (const item of w.opts.chestLoot?.(w, c) ?? []) {
          const id = w.nextId++;
          w.drops.push({
            id,
            x: c.x + w.rngLoot.float(-0.4, 0.4),
            y: c.y + w.rngLoot.float(-0.4, 0.4),
            item,
          });
          w.events.push({ t: 'drop', id });
        }
      }
      return;
    }
    moveTo(w, s, p, lootX, lootY, dt);
    return;
  }

  // Exit, or advance along the waypoints.
  const wps = w.plan.lab.waypoints;
  if (ai.wp >= wps.length) {
    if (w.exitOpen) {
      ai.mode = 'exit';
      const ex = w.plan.lab.exit;
      if (Math.hypot(ex.x - p.x, ex.y - p.y) < 0.6) {
        w.status = 'cleared';
        w.events.push({ t: 'cleared' });
        return;
      }
      moveTo(w, s, p, ex.x, ex.y, dt);
      return;
    }
    // End room not yet clear: hunt the nearest remaining end-room monster.
    let best: Actor | null = null;
    let bd = Infinity;
    for (const m of w.actors) {
      // A Quarry's champions count wherever they stand.
      const hunted = m.room === w.endRoom || (w.plan.type === 'quarry' && m.rarity === 'miniboss');
      if (m.team === s.team || !m.alive || !hunted) continue;
      const d = Math.hypot(m.x - p.x, m.y - p.y);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    if (best) {
      if (best.state === 'idle') best.state = 'chase';
      moveTo(w, s, p, best.x, best.y, dt);
    }
    return;
  }
  ai.mode = 'advance';
  const wp = wps[ai.wp];
  if (Math.hypot(wp.x - p.x, wp.y - p.y) < 1) {
    ai.wp++;
    ai.stuckT = 0;
    ai.stuckX = p.x;
    ai.stuckY = p.y;
    return;
  }
  ai.stuckT += dt;
  if (ai.stuckT >= STUCK_TIME) {
    if (Math.hypot(p.x - ai.stuckX, p.y - ai.stuckY) < 1) {
      p.x = wp.x;
      p.y = wp.y;
      ai.wp++;
      s.stats.stuck++;
      w.events.push({ t: 'stuck', src: p.id });
    }
    ai.stuckT = 0;
    ai.stuckX = p.x;
    ai.stuckY = p.y;
  }
  moveTo(w, s, p, wp.x, wp.y, dt);
}

function monsterMove(w: World, m: Actor, tx: number, ty: number, dt: number): void {
  if (m.stationary) return;
  const d = Math.hypot(tx - m.x, ty - m.y);
  if (m.flies || m.phases) {
    // Straight at the target, weaving from side to side.
    const wob = Math.sin(w.t * 5 + m.id) * 0.7;
    const dx = tx - m.x;
    const dy = ty - m.y;
    step(w, m, dx - dy * wob * 0.5, dy + dx * wob * 0.5, dt);
    return;
  }
  if (d < 8 && w.grid.los(m.x, m.y, tx, ty)) {
    step(w, m, tx - m.x, ty - m.y, dt);
    return;
  }
  const dir = w.grid.flowDir(m.x, m.y);
  if (dir) step(w, m, dir.x, dir.y, dt);
  else step(w, m, tx - m.x, ty - m.y, dt);
}

export function alertPack(w: World, m: Actor): void {
  const reach = (m.mon && senseOf(m).alert) ?? PACK_ALERT;
  for (const o of w.actors) {
    if (o.isPlayer || !o.alive || o.state !== 'idle') continue;
    if (Math.hypot(o.x - m.x, o.y - m.y) <= reach) {
      o.state = 'chase';
      o.hold = false;
      o.lostT = 0;
    }
  }
}

/** Seconds a chasing monster must be held up before it turns on a minion in its way. */
const BLOCKED_TIME = 0.35;

/** Seconds a ranged monster must be held up before it shoots a minion instead of walking on to the character. */
const RANGED_BLOCKED_TIME = 1.5;

/** The nearest standing minion a melee monster can strike from where it stands. */
function minionInReach(w: World, m: Actor, range: number): Actor | null {
  let best: Actor | null = null;
  let bd = Infinity;
  for (const v of hunted(w, m).side!.minions) {
    if (!v.alive) continue;
    const d = Math.hypot(v.x - m.x, v.y - m.y);
    if (d <= range + v.r + m.r && d < bd) {
      best = v;
      bd = d;
    }
  }
  return best;
}

/** The nearest standing minion a ranged monster can shoot at: in range and in sight. */
function minionInSight(w: World, m: Actor, range: number): Actor | null {
  let best: Actor | null = null;
  let bd = Infinity;
  for (const v of hunted(w, m).side!.minions) {
    if (!v.alive) continue;
    const d = Math.hypot(v.x - m.x, v.y - m.y);
    if (d <= range && d < bd && w.grid.los(m.x, m.y, v.x, v.y)) {
      best = v;
      bd = d;
    }
  }
  return best;
}

/**
 * Walk toward the player, noting whether it gets anywhere. A monster that keeps trying to walk and barely moves is held
 * up (by the minions, or by the crowd around it); `blockT` counts the seconds.
 */
function chaseStep(w: World, m: Actor, tx: number, ty: number, dt: number, pace = 1): void {
  if (m.chase.tryTick === w.tick - 1) {
    const moved = Math.hypot(m.x - m.chase.prevX, m.y - m.chase.prevY);
    const want = m.def.moveSpeed * (1 - m.ail.chill) * moveMult(m) * dt * pace;
    if (moved < want * 0.4) m.chase.blockT += dt;
    else m.chase.blockT = Math.max(0, m.chase.blockT - 2 * dt);
  }
  m.chase.tryTick = w.tick;
  m.chase.prevX = m.x;
  m.chase.prevY = m.y;
  monsterMove(w, m, tx, ty, dt * pace);
}

/** A patrol walks from one of its two points to the other and back, slowly, until it notices the character. */
function patrolStep(w: World, m: Actor, dt: number): void {
  const patrol = m.patrol!;
  const to = patrol.points[patrol.i];
  if (Math.hypot(to.x - m.x, to.y - m.y) < 1.2) {
    patrol.i = 1 - patrol.i;
    m.chase.pathT = 0;
    return;
  }
  m.chase.pathT -= dt;
  if (m.chase.pathT <= 0) {
    m.chase.pathT = 0.4;
    const n = w.grid.astar(m.x, m.y, to.x, to.y)?.[0];
    m.chase.nextX = n ? n.x : to.x;
    m.chase.nextY = n ? n.y : to.y;
  }
  step(w, m, m.chase.nextX - m.x, m.chase.nextY - m.y, dt * PATROL_SPEED);
}

export function monsterAI(w: World, m: Actor, dt: number): void {
  m.moving = false;
  if (m.dummy) return;
  whileStunned(m);
  if (!canAct(m)) return;
  // A Gloomstalker stands still while its blink gathers.
  if (
    m.blinkT > 0 ||
    m.phaseT > 0 ||
    m.channelT > 0 ||
    m.dash.windT > 0 ||
    m.dash.t > 0 ||
    stepping(m)
  )
    return;
  // A monster in a window (a Brace) holds its ground until it ends.
  if (m.enc && (inWindow(m) || tryWindow(w, m))) return;
  const p = hunted(w, m);
  if (!p.alive) return;
  const d = Math.hypot(p.x - m.x, p.y - m.y);
  if (m.state === 'idle') {
    // An ambush lies still until the character is close, wherever the character is looking.
    if (m.hold) {
      if (d <= AMBUSH_RANGE) {
        m.hold = false;
        m.state = 'chase';
        m.lostT = 0;
        alertPack(w, m);
      }
      return;
    }
    m.noticeT -= dt;
    if (m.noticeT <= 0) {
      m.noticeT = 0.25;
      // Slipstream Run halves how far the character is noticed from.
      const seen =
        (senseOf(m).aggro ?? MONSTER_AGGRO) * (hunted(w, m).side!.buffT.phaseRun > 0 ? 0.5 : 1);
      if (d <= seen && w.grid.los(m.x, m.y, p.x, p.y)) {
        m.state = 'chase';
        m.lostT = 0;
        alertPack(w, m);
        return;
      }
    }
    if (m.patrol && !m.stationary) patrolStep(w, m, dt);
    return;
  }
  if (m.state === 'leash') {
    if (Math.hypot(m.home.x - m.x, m.home.y - m.y) < 0.5) {
      m.state = 'idle';
      m.life = m.def.maxLife;
      return;
    }
    const path = w.grid.astar(m.x, m.y, m.home.x, m.home.y);
    const n = path?.[0];
    if (n) step(w, m, n.x - m.x, n.y - m.y, dt);
    else step(w, m, m.home.x - m.x, m.home.y - m.y, dt);
    return;
  }
  // A boss of its own kind moves and strikes its own way for a while, or always (docs/BOSSES.md).
  if (m.enc && m.rarity === 'boss' && bossAI(w, m, dt)) return;
  const los = d < 16 && w.grid.los(m.x, m.y, p.x, p.y);
  if (los) m.lostT = 0;
  else {
    m.lostT += dt;
    // Some give up sooner, and a hunter never does (a leash of nought).
    const leash = senseOf(m).leash ?? LEASH_TIME;
    if (leash > 0 && m.lostT > leash && m.rarity !== 'boss') {
      m.state = 'leash';
      return;
    }
  }
  // A thief that has taken something runs from the character with it.
  if (m.theft.fleeT > 0) {
    m.theft.fleeT -= dt;
    const away = w.grid.collide(m.x - (p.x - m.x), m.y - (p.y - m.y), m.r);
    step(w, m, away.x - m.x, away.y - m.y, dt);
    return;
  }
  // A second attack on the way in: a thrown spear, a lob, a pattern (docs/ENCOUNTERS.md 3).
  if (m.mon!.sidearm && trySidearm(w, m, dt, d, los)) return;
  // Nests and pylons do nothing but what the faction code gives them.
  if (MONSTER_TYPES[m.mon!.spec.type].noAttack) return;
  const prof = m.mon!.profile(monsterConds(m));
  const range = m.mon!.range;
  // Whom it goes for: the character, or (a hunter) its minions first.
  const tg = targetOf(w, m);
  const dtg = tg === p ? d : Math.hypot(tg.x - m.x, tg.y - m.y);
  const tlos = tg === p ? los : w.grid.los(m.x, m.y, tg.x, tg.y);
  // A monster that has struck and is withdrawing, or hiding behind a wall, does not strike until it has had its time.
  afterBlow(w, m, tg);
  if (withdrawing(m)) {
    const s = steer(w, m, tg, dtg, dt);
    if (s) chaseStep(w, m, s.x, s.y, dt, s.pace);
    return;
  }
  // After an area blow it rests (AREA_PACE in data/shapes.ts), so it casts fewer, harder ones rather than a stream of them.
  if (m.rhythm.restT > 0) {
    m.rhythm.restT -= dt;
    return;
  }
  // Whether it fights at arm's length is the type's, not its shape's: a Sentinel's nova is still a melee blow.
  if (MONSTER_TYPES[m.mon!.spec.type].attack !== 'melee') {
    if (m.stationary) {
      if (d <= range && los) startAction(w, m, 'monster', prof, p);
      else {
        // It cannot reach the player: a minion in sight will do.
        const v = hunted(w, m).side!.minions.length > 0 ? minionInSight(w, m, range) : null;
        if (v) startAction(w, m, 'monster', prof, v);
      }
      return;
    }
    // Retreat when crowded: short half-speed bursts with a cooldown, so they don't kite forever. A kiter (a Slinger, a
    // Handler) backs off sooner, faster and more often.
    const kites = abilitiesOf(m.mon!.spec.type).some((a) => a.id === 'kite');
    m.retreat.cd -= dt;
    if (d < (kites ? 4.5 : 2) && m.retreat.t <= 0 && m.retreat.cd <= 0) {
      m.retreat.t = kites ? RETREAT_TIME * 1.5 : RETREAT_TIME;
      m.retreat.cd = kites ? 1.2 : RETREAT_COOLDOWN;
    }
    if (m.retreat.t > 0) {
      m.retreat.t -= dt;
      const away = w.grid.collide(m.x - (p.x - m.x), m.y - (p.y - m.y), m.r);
      step(w, m, away.x - m.x, away.y - m.y, dt * (kites ? 0.8 : 0.5));
      return;
    }
    if (dtg <= range && tlos) {
      startAction(w, m, 'monster', prof, tg);
      return;
    }
    // It cannot hit the player from here: it walks on toward the player, and shoots a minion in range and in sight only
    // once it is held up (a ranged monster goes for the character, not for what stands about it).
    const v =
      hunted(w, m).side!.minions.length > 0 && m.chase.blockT >= RANGED_BLOCKED_TIME && tg === p
        ? minionInSight(w, m, range)
        : null;
    if (v) {
      startAction(w, m, 'monster', prof, v);
      return;
    }
    const s = steer(w, m, tg, dtg, dt);
    if (s) chaseStep(w, m, s.x, s.y, dt, s.pace);
    return;
  }
  if (dtg <= range + tg.r + m.r) {
    m.chase.blockT = 0;
    // A Bloater does not strike: it bursts on contact.
    if (m.mon!.spec.type === 'bloater') bloaterBurst(w, m);
    else startAction(w, m, 'monster', prof, tg);
    return;
  }
  // Held up on the way to the player (by minions, say): whatever minion is in reach gets hit instead.
  if (m.chase.blockT >= BLOCKED_TIME && hunted(w, m).side!.minions.length > 0) {
    const v = minionInReach(w, m, range);
    if (v) {
      startAction(w, m, 'monster', prof, v);
      return;
    }
  }
  const s = steer(w, m, tg, dtg, dt);
  if (s) chaseStep(w, m, s.x, s.y, dt, s.pace);
}

/** No two actors can touch from further apart than this (the largest radius, a boss, twice over). */
const MAX_ACTOR_REACH = 2;

/** Soft separation between nearby actors. */
export function separate(w: World): void {
  // Dead actors stay in the world's list, so look only at the living (a big map has hundreds of the dead).
  const list: Actor[] = [];
  for (const m of w.actors) if (m.alive && !m.isPlayer) list.push(m);
  // Sorted by x, the inner loop can stop as soon as the next actor is too far to the right to touch.
  list.sort((a, b) => a.x - b.x);
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.state === 'idle' || a.stationary) continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      const dx = b.x - a.x;
      const rr = a.r + b.r;
      if (dx > MAX_ACTOR_REACH) break;
      const dy = b.y - a.y;
      if (dy > rr || dy < -rr || dx > rr) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 < 1e-9) continue;
      const d = Math.sqrt(d2);
      // A stationary monster does not budge: the other one gives way entirely.
      const push = b.stationary ? rr - d : (rr - d) / 2;
      const nx = dx / d;
      const ny = dy / d;
      // Away from the walls (nearly everywhere) a push needs no wall check.
      const ax = a.x - nx * push;
      const ay = a.y - ny * push;
      if (w.grid.clear(ax, ay)) {
        a.x = ax;
        a.y = ay;
      } else {
        const ca = w.grid.collide(ax, ay, a.r);
        a.x = ca.x;
        a.y = ca.y;
      }
      if (!b.stationary) {
        const bx = b.x + nx * push;
        const by = b.y + ny * push;
        if (w.grid.clear(bx, by)) {
          b.x = bx;
          b.y = by;
        } else {
          const cb = w.grid.collide(bx, by, b.r);
          b.x = cb.x;
          b.y = cb.y;
        }
      }
    }
    // Character vs monster: the monster yields most of the overlap; under Slipstream Run the character passes through.
    for (const s of w.sides) {
      if (s.buffT.phaseRun > 0) continue;
      const p = s.player;
      const dx = a.x - p.x;
      const dy = a.y - p.y;
      const rr = a.r + p.r;
      const d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 1e-9) {
        const d = Math.sqrt(d2);
        const push = rr - d;
        const ca = w.grid.collide(a.x + (dx / d) * push * 0.8, a.y + (dy / d) * push * 0.8, a.r);
        a.x = ca.x;
        a.y = ca.y;
        const cp = w.grid.collide(p.x - (dx / d) * push * 0.2, p.y - (dy / d) * push * 0.2, p.r);
        p.x = cp.x;
        p.y = cp.y;
      }
    }
  }
  if (w.sides.length > 1) separateSides(w);
  for (const s of w.sides) if (s.minions.length > 0) separateMinions(w, s, list);
}

/** Two bodies that overlap each give way half of it (the ones of the other teams: the character is not pushed by its own minions). */
function pushApart(w: World, a: Actor, b: Actor): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const rr = a.r + b.r;
  const d2 = dx * dx + dy * dy;
  if (d2 >= rr * rr) return;
  // Exactly on top of each other there is no way to say which way is out: a is sent west and b east.
  const d = Math.sqrt(d2);
  const nx = d > 1e-9 ? dx / d : 1;
  const ny = d > 1e-9 ? dy / d : 0;
  const half = (rr - d) / 2;
  const ca = w.grid.collide(a.x - nx * half, a.y - ny * half, a.r);
  a.x = ca.x;
  a.y = ca.y;
  const cb = w.grid.collide(b.x + nx * half, b.y + ny * half, b.r);
  b.x = cb.x;
  b.y = cb.y;
}

/**
 * The characters of different sides are bodies too: each gives way half of what they overlap by (a melee blow reaches its
 * range plus both radii, so two characters standing in each other would be in reach of anything). Under Slipstream Run a character
 * passes through.
 */
function separateSides(w: World): void {
  const sides = w.sides;
  for (let i = 0; i < sides.length; i++) {
    const a = sides[i];
    if (!a.player.alive || a.buffT.phaseRun > 0) continue;
    for (let j = i + 1; j < sides.length; j++) {
      const b = sides[j];
      if (!b.player.alive || b.buffT.phaseRun > 0 || b.team === a.team) continue;
      pushApart(w, a.player, b.player);
    }
  }
}

/**
 * Minions are bodies like any other: monsters cannot walk through them, so they hold a corridor and draw blows. A
 * monster that is awake and free to move gives way half; one that sleeps or never moves gives none, and the minion
 * yields instead. The player pushes minions aside.
 */
function separateMinions(w: World, s: Side, list: Actor[]): void {
  const p = s.player;
  const ms = s.minions;
  const nudge = (a: Actor, dx: number, dy: number): void => {
    const x = a.x + dx;
    const y = a.y + dy;
    if (w.grid.clear(x, y)) {
      a.x = x;
      a.y = y;
    } else {
      const c = w.grid.collide(x, y, a.r);
      a.x = c.x;
      a.y = c.y;
    }
  };
  for (let i = 0; i < ms.length; i++) {
    const m = ms[i];
    if (!m.alive) continue;
    for (const a of list) {
      const dx = a.x - m.x;
      const rr = a.r + m.r;
      if (dx > rr || dx < -rr) continue;
      const dy = a.y - m.y;
      if (dy > rr || dy < -rr) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 < 1e-9) continue;
      const d = Math.sqrt(d2);
      const gap = rr - d;
      const holds = a.state === 'idle' || a.stationary;
      const nx = dx / d;
      const ny = dy / d;
      nudge(m, -nx * (holds ? gap : gap / 2), -ny * (holds ? gap : gap / 2));
      if (!holds) nudge(a, nx * (gap / 2), ny * (gap / 2));
    }
    for (let j = i + 1; j < ms.length; j++) {
      const o = ms[j];
      if (!o.alive) continue;
      const dx = o.x - m.x;
      const dy = o.y - m.y;
      const rr = o.r + m.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 < 1e-9) continue;
      const d = Math.sqrt(d2);
      const half = (rr - d) / 2;
      nudge(m, (-dx / d) * half, (-dy / d) * half);
      nudge(o, (dx / d) * half, (dy / d) * half);
    }
    const dx = m.x - p.x;
    const dy = m.y - p.y;
    const rr = m.r + p.r;
    const d2 = dx * dx + dy * dy;
    if (d2 < rr * rr && d2 > 1e-9) {
      const d = Math.sqrt(d2);
      nudge(m, (dx / d) * (rr - d), (dy / d) * (rr - d));
    }
    // The characters of the other sides are not pushed aside as the minion's own is: each gives way half.
    if (w.sides.length > 1)
      for (const o of w.sides)
        if (o.team !== s.team && o.player.alive && o.buffT.phaseRun <= 0) pushApart(w, m, o.player);
  }
}
