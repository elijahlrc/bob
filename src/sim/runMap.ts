import { Hasher } from '../core/hash';
import type { AnyItem, Build } from '../data/types';
import type { MapPlan } from '../gen/mapPlan';
import type { FlaskPolicy } from './flaskPolicy';
import type { MapStatus, World, WorldOpts } from './types';
import { createWorld, stepWorld } from './world';

export type MapResult = {
  status: MapStatus;
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
  };
}
