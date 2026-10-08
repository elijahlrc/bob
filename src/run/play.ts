import { CRAWL_SEGMENTS } from '../data/mapTypes';
import { runMap, type MapResult } from '../sim/runMap';
import type { World, WorldOpts } from '../sim/types';
import type { MapOffer } from './offers';
import { planFor, worldOptsFor, type RunState } from './run';

/** One result for a whole Crawl: the maps' time, kills and loot added up, and where the last of them left things. */
export function combineCrawl(parts: MapResult[]): MapResult {
  const last = parts[parts.length - 1];
  const sum = (f: (r: MapResult) => number) => parts.reduce((n, r) => n + f(r), 0);
  return {
    ...last,
    type: 'crawl',
    time: sum((r) => r.time),
    ticks: sum((r) => r.ticks),
    xpGained: sum((r) => r.xpGained),
    kills: sum((r) => r.kills),
    stuck: sum((r) => r.stuck),
    picked: parts.flatMap((r) => r.picked),
  };
}

/**
 * Play an offered map headlessly from the run's state: a single map, or the three maps of a Crawl back to back (the
 * character and what it carries pass from one to the next with no camp between). The bot and the tests use this; the
 * game does the same step by step in the controller.
 */
export function playOffer(
  run: RunState,
  offer: MapOffer,
  tweak?: (opts: WorldOpts) => void,
  onTick?: (w: World) => void,
): MapResult {
  let build = run.build;
  let xp = run.xp;
  let start = run.vitals;
  const parts: MapResult[] = [];
  const segments = offer.type === 'crawl' ? CRAWL_SEGMENTS : 1;
  for (let s = 0; s < segments; s++) {
    const plan = planFor(run, offer, s);
    const opts = { ...worldOptsFor(run, plan), start };
    tweak?.(opts);
    const res = runMap(plan, build, xp, opts, undefined, onTick);
    parts.push(res);
    if (res.status !== 'cleared') break;
    build = { ...build, level: res.level };
    xp = res.xp;
    start = res.vitals;
  }
  return parts.length === 1 ? parts[0] : combineCrawl(parts);
}
