import { skillRange, type DeployKind, type SkillChoice } from '../calc/character';
import type { SkillProfile } from '../calc/skill';
import { actorById, fire } from './actions';
import { flaskMask, playerConds } from './combat';
import type { Action, Actor, World } from './types';

/**
 * Deployables in the sim (COVERAGE 5.3): totems and brands stand and shoot on their own, traps go off when an enemy
 * steps close, mines go off once armed when enemies are near. Each uses the character's numbers (a hit from one is
 * the character's skill, fired from where it stands) and lasts a while. The calc sheet counts them as extra uses.
 */
export type Deployable = {
  id: number;
  kind: DeployKind;
  /** The skill choice (key) it fires. */
  key: string;
  x: number;
  y: number;
  /** Seconds it has left. */
  t: number;
  /** Seconds until a totem or brand shoots again, or a trap or mine is armed. */
  fireT: number;
};

/** How long each kind of deployable stands, in seconds (the skill bar counts down over this). */
export const DEPLOY_SECONDS: Record<DeployKind, number> = {
  totem: 10,
  brand: 12,
  trap: 8,
  mine: 14,
};
/** Distance at which an enemy sets off a trap, and at which a mine goes off. */
const TRAP_RADIUS = 1.6;
const MINE_RADIUS = 3.5;
const MINE_ARM = 0.6;
/** How many sets of traps or mines can lie about at once (a set is as many as the skill puts down together). */
const SETS = 3;
/** Where a placed totem stands, toward the target, in tiles from the character. */
const TOTEM_OFFSET = 1.5;

export function choiceByKey(w: World, key: string): SkillChoice | undefined {
  return w.char.actives.find((c) => c.key === key) ?? w.char.secondaries.find((c) => c.key === key);
}

export function deployedCount(w: World, key: string): number {
  let n = 0;
  for (const d of w.deployables) if (d.key === key) n++;
  return n;
}

/** How many of a deploying skill's totems, brands, traps or mines may stand at once. */
export function deployCap(c: SkillChoice, prof: SkillProfile): number {
  return c.deploy === 'totem' || c.deploy === 'brand' ? prof.deployCount : prof.deployCount * SETS;
}

/** Whether the skill has all it can have down already: the AI uses another skill meanwhile. */
export function deployFull(w: World, c: SkillChoice, prof: SkillProfile): boolean {
  if (!c.deploy) return false;
  return deployedCount(w, c.key) >= deployCap(c, prof);
}

const enemies = (w: World): Actor[] =>
  w.actors.filter((e) => !e.isPlayer && e.alive && e.phaseT <= 0);

/** The use of a deploying skill lands: put its totem, brand, traps or mines down. */
export function placeDeployable(w: World, a: Actor, act: Action): void {
  const c = w.char.actives.find((x) => x.skill.id === act.profile.skill.id);
  if (!c?.deploy) return;
  const target = actorById(w, act.targetId);
  const n = act.profile.deployCount;
  // "Increased duration" of totems, traps, mines and brands.
  const seconds = DEPLOY_SECONDS[c.deploy] * act.profile.skillDuration;
  const put = (x: number, y: number) => {
    const spot = w.grid.collide(x, y, 0.3);
    w.deployables.push({
      id: ++w.deploySeq,
      kind: c.deploy!,
      key: c.key,
      x: spot.x,
      y: spot.y,
      t: seconds,
      fireT: c.deploy === 'mine' ? MINE_ARM : c.deploy === 'trap' ? 0.3 : 0.4,
    });
    w.events.push({ t: 'deploy', kind: c.deploy!, x: spot.x, y: spot.y, end: false });
  };
  if (c.deploy === 'totem') {
    // Only as many as the skill allows stand: the oldest gives way.
    const mine = w.deployables.filter((d) => d.key === c.key);
    if (mine.length >= n) w.deployables.splice(w.deployables.indexOf(mine[0]), 1);
    const dx = target ? target.x - a.x : 1;
    const dy = target ? target.y - a.y : 0;
    const len = Math.hypot(dx, dy) || 1;
    put(a.x + (dx / len) * TOTEM_OFFSET, a.y + (dy / len) * TOTEM_OFFSET);
    return;
  }
  const tx = target ? target.x : a.x;
  const ty = target ? target.y : a.y;
  if (c.deploy === 'brand') {
    const mine = w.deployables.filter((d) => d.key === c.key);
    if (mine.length >= n) w.deployables.splice(w.deployables.indexOf(mine[0]), 1);
    put(tx, ty);
    return;
  }
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    put(tx + (n > 1 ? Math.cos(ang) * 1.2 : 0), ty + (n > 1 ? Math.sin(ang) * 1.2 : 0));
  }
}

/** The character's skill, fired from where a deployable stands at an enemy. */
function shoot(w: World, d: Deployable, c: SkillChoice, target: Actor): void {
  const prof = w.char.profile(c, playerConds(w, target), flaskMask(w));
  const from: Actor = Object.create(w.player) as Actor;
  from.x = d.x;
  from.y = d.y;
  from.facing = Math.atan2(target.y - d.y, target.x - d.x);
  const act: Action = {
    profile: prof,
    which: 'deployed',
    hand: 0,
    duration: prof.useTime,
    elapsed: prof.useTime,
    fired: true,
    echoes: 0,
    targetId: target.id,
    aimX: target.x,
    aimY: target.y,
  };
  w.events.push({ t: 'use', src: w.player.id, skill: prof.skill.id });
  fire(w, from, act);
}

/** Totems and brands shoot when an enemy is in reach; traps and mines go off; everything ends when its time is up. */
export function tickDeployables(w: World, dt: number): void {
  if (w.deployables.length === 0) return;
  const foes = enemies(w);
  let j = 0;
  for (const d of w.deployables) {
    d.t -= dt;
    d.fireT -= dt;
    const c = choiceByKey(w, d.key);
    let keep = d.t > 0 && !!c;
    if (keep && c && d.fireT <= 0) {
      if (d.kind === 'totem' || d.kind === 'brand') {
        const prof = w.char.profile(c, w.char.configConds, flaskMask(w));
        const reach = skillRange(prof);
        let best: Actor | null = null;
        let bd = Infinity;
        for (const e of foes) {
          const dist = Math.hypot(e.x - d.x, e.y - d.y);
          if (dist <= reach + e.r && dist < bd && w.grid.los(d.x, d.y, e.x, e.y)) {
            best = e;
            bd = dist;
          }
        }
        if (best) {
          shoot(w, d, c, best);
          d.fireT = Math.max(0.2, prof.useTime);
        } else d.fireT = 0.1;
      } else {
        const radius = d.kind === 'trap' ? TRAP_RADIUS : MINE_RADIUS;
        let best: Actor | null = null;
        let bd = Infinity;
        for (const e of foes) {
          const dist = Math.hypot(e.x - d.x, e.y - d.y);
          if (dist <= radius + e.r && dist < bd) {
            best = e;
            bd = dist;
          }
        }
        if (best) {
          shoot(w, d, c, best);
          keep = false;
        } else d.fireT = 0.05;
      }
    }
    if (keep) w.deployables[j++] = d;
    else w.events.push({ t: 'deploy', kind: d.kind, x: d.x, y: d.y, end: true });
  }
  w.deployables.length = j;
}
