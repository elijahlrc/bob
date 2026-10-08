import { Hasher } from '../core/hash';
import type { MapTypeId } from '../data/mapTypes';
import type { AnyItem, Build } from '../data/types';
import type { MapPlan } from '../gen/mapPlan';
import type { FlaskPolicy } from './flaskPolicy';
import { buildRecap } from './recap';
import type { DeathRecap, MapStatus, Vitals, World, WorldOpts } from './types';
import { vitalsOf } from './vitals';
import { createWorld, stepWorld } from './world';

export type MapResult = {
  status: MapStatus;
  /** The map type, when it was not plain (a whole Crawl reports as 'crawl'). */
  type?: MapTypeId;
  /** The level of the map that was played (the monsters' level). */
  areaLevel: number;
  time: number;
  ticks: number;
  /** Character level and XP progress after the map. */
  level: number;
  xp: number;
  xpGained: number;
  kills: number;
  stuck: number;
  picked: AnyItem[];
  /** Hash of the full event log (determinism checks). */
  eventHash: number;
  lifeFrac: number;
  /** What the player carries out of the map (life, mana, energy shield and flask charges, as fractions). */
  vitals: Vitals;
  /** Why the player died, when they did (EXPANSION section 9). */
  recap?: DeathRecap;
};

export function hashEvents(h: Hasher, w: World): void {
  for (const e of w.events) {
    h.str(e.t);
    for (const v of Object.values(e)) if (typeof v === 'number') h.num(v);
  }
}

/** Run a map headlessly as fast as possible (§8.2). */
export function runMap(
  plan: MapPlan,
  build: Build,
  xp: number,
  opts: WorldOpts = {},
  policy?: FlaskPolicy,
  onTick?: (w: World) => void,
): MapResult {
  const w = createWorld({ plan, build, xp, opts });
  const h = new Hasher();
  while (w.status === 'running') {
    stepWorld(w, policy);
    hashEvents(h, w);
    onTick?.(w);
  }
  h.num(w.player.x).num(w.player.y).num(w.player.life);
  return worldResult(w, h.digest());
}

/** Summarise a finished world. */
export function worldResult(w: World, eventHash = 0): MapResult {
  return {
    status: w.status,
    ...(w.plan.type !== 'plain' ? { type: w.plan.type } : {}),
    areaLevel: w.plan.areaLevel,
    time: w.t,
    ticks: w.tick,
    level: w.build.level,
    xp: w.xp,
    xpGained: w.stats.xpGained,
    kills: w.stats.kills,
    stuck: w.stats.stuck,
    picked: w.picked,
    eventHash,
    lifeFrac: w.player.life / Math.max(1, w.player.def.maxLife),
    vitals: vitalsOf(w),
    ...(w.status === 'dead' ? { recap: buildRecap(w) } : {}),
  };
}
