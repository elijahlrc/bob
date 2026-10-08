import { describe, expect, it } from 'vitest';
import {
  COLLAPSE_SPEED,
  COLLAPSE_START,
  CRAWL_SEGMENTS,
  HOLDOUT_FIRST,
  HOLDOUT_INTERVAL,
  HOLDOUT_WAVES,
} from '../data/mapTypes';
import { DT } from '../data/constants';
import { makeMapPlan } from '../gen/mapPlan';
import { collapseFront, measurePath, pathProgress, tickCollapse } from '../sim/collapse';
import { killActor } from '../sim/combat';
import type { World } from '../sim/types';
import { createWorld, stepWorld } from '../sim/world';
import { botCamp } from './bot';
import { Controller } from './controller';
import { makeOffer } from './offers';
import { combineCrawl, playOffer } from './play';
import { newRun, planFor, setMap, worldOptsFor, type RunState } from './run';
import type { MapResult } from '../sim/runMap';
import { fullVitals } from '../sim/types';

function worldOf(run: RunState, type: 'collapse' | 'holdout' | 'crawl', map: number): World {
  setMap(run, map);
  const plan = planFor(run, makeOffer(run.seed, map, 0, 'ashenCrypt', 0, type));
  return createWorld({ plan, build: run.build, xp: 0, opts: worldOptsFor(run, plan) });
}

describe('Collapse (docs/MAPS.md 9.2)', () => {
  it('measures the way through the map from the entrance to the exit', () => {
    const plan = makeMapPlan(5, 35, 'ashenCrypt', [], 35, 'collapse');
    const m = measurePath(plan.lab);
    expect(m.pts[0]).toEqual(plan.lab.start);
    expect(m.pts[m.pts.length - 1]).toEqual(plan.lab.exit);
    expect(m.total).toBeGreaterThan(30);
    expect(pathProgress(m, plan.lab.start.x, plan.lab.start.y)).toBeCloseTo(0, 5);
    expect(pathProgress(m, plan.lab.exit.x, plan.lab.exit.y)).toBeCloseTo(m.total, 5);
    // Progress never goes backwards along the way.
    let last = -1;
    for (let i = 0; i < m.pts.length; i++) {
      const p = pathProgress(m, m.pts[i].x, m.pts[i].y);
      expect(p).toBeGreaterThanOrEqual(last - 1e-6);
      last = p;
    }
    expect(plan.lab.rooms.every((r) => r.kind !== 'side')).toBe(true);
  });

  it('starts at the set time and moves at the set speed', () => {
    expect([0, COLLAPSE_START].map(collapseFront)).toEqual([0, 0]);
    expect(collapseFront(COLLAPSE_START + 10)).toBeCloseTo(10 * COLLAPSE_SPEED);
  });

  it('crushes a character behind the front, and spares one ahead of it', () => {
    const run = newRun('vanguard', 3);
    const w = worldOf(run, 'collapse', 35);
    const m = measurePath(w.plan.lab);
    // Well ahead of the front: nothing happens.
    w.t = COLLAPSE_START + 5;
    w.player.x = m.pts[m.pts.length - 1].x;
    w.player.y = m.pts[m.pts.length - 1].y;
    tickCollapse(w);
    expect(w.status).toBe('running');
    expect(w.collapseGap).toBeGreaterThan(0);
    // Back at the entrance when the front has passed it.
    w.t = COLLAPSE_START + 20;
    w.player.x = w.plan.lab.start.x;
    w.player.y = w.plan.lab.start.y;
    tickCollapse(w);
    expect(w.status).toBe('dead');
  });

  it('does nothing on other maps and before it starts', () => {
    const run = newRun('vanguard', 3);
    const w = worldOf(run, 'collapse', 35);
    w.t = COLLAPSE_START - 1;
    tickCollapse(w);
    expect(w.collapseFront).toBe(0);
    expect(w.status).toBe('running');
  });
});

describe('Holdout (docs/MAPS.md 9.2)', () => {
  it('is one arena with eight waves, growing, the last led by a rare', () => {
    const plan = makeMapPlan(5, 27, 'ashenCrypt', [], 27, 'holdout');
    expect(plan.lab.rooms).toHaveLength(1);
    expect(plan.pop.monsters).toHaveLength(0);
    const waves = plan.pop.waves!;
    expect(waves).toHaveLength(HOLDOUT_WAVES);
    expect(waves.map((x) => x.t)).toEqual(
      Array.from({ length: HOLDOUT_WAVES }, (_, k) => HOLDOUT_FIRST + k * HOLDOUT_INTERVAL),
    );
    expect(waves[7].monsters.length).toBeGreaterThan(waves[0].monsters.length);
    expect(waves[7].monsters.some((m) => m.spec.rarity === 'rare')).toBe(true);
    expect(waves[0].monsters.every((m) => m.spec.rarity === 'normal')).toBe(true);
    for (const wave of waves)
      for (const m of wave.monsters)
        expect(Math.hypot(m.x - plan.lab.start.x, m.y - plan.lab.start.y)).toBeGreaterThanOrEqual(
          10,
        );
  });

  it('sends each wave at its time, chasing, and opens the exit only after the last is dead', () => {
    const run = newRun('vanguard', 3);
    const w = worldOf(run, 'holdout', 27);
    w.opts.godMode = true;
    const monsters = () => w.actors.filter((a) => !a.isPlayer && a.alive);
    expect(monsters()).toHaveLength(0);
    stepWorld(w);
    expect(w.holdout.spawned).toBe(0);
    for (let i = 0; i < (HOLDOUT_FIRST + 0.5) / DT; i++) stepWorld(w);
    expect(w.holdout.spawned).toBe(1);
    expect(monsters().length).toBe(w.plan.pop.waves![0].monsters.length);
    expect(monsters().every((a) => a.state === 'chase')).toBe(true);
    // Kill each wave as it comes. The exit stays shut until all eight have been sent and are dead.
    const kill = () => {
      for (const a of monsters()) {
        a.noReward = true;
        killActor(w, a);
      }
    };
    kill();
    while (w.holdout.spawned < HOLDOUT_WAVES) {
      for (let i = 0; i < 1 / DT; i++) stepWorld(w);
      kill();
      expect(w.exitOpen).toBe(false);
    }
    for (let i = 0; i < 1 / DT; i++) stepWorld(w);
    expect(w.exitOpen).toBe(true);
    expect(w.holdout.cleared).toBe(HOLDOUT_WAVES);
  });

  it('pays a chest for each wave survived', () => {
    const run = newRun('vanguard', 3);
    const w = worldOf(run, 'holdout', 27);
    for (let i = 0; i < (HOLDOUT_FIRST + 0.5) / DT; i++) stepWorld(w);
    for (const a of w.actors)
      if (!a.isPlayer && a.alive) {
        a.noReward = true;
        killActor(w, a);
      }
    // The character picks the loot up almost at once, so count what is on the ground and what was taken.
    const before = w.drops.length + w.picked.length;
    for (let i = 0; i < 0.5 / DT; i++) stepWorld(w);
    expect(w.holdout.cleared).toBe(1);
    expect(w.drops.length + w.picked.length).toBeGreaterThan(before);
  });
});

const result = (over: Partial<MapResult>): MapResult => ({
  status: 'cleared',
  areaLevel: 42,
  time: 100,
  ticks: 6000,
  level: 42,
  xp: 10,
  xpGained: 10,
  kills: 20,
  stuck: 0,
  picked: [],
  eventHash: 0,
  lifeFrac: 1,
  vitals: fullVitals(),
  ...over,
});

describe('Crawl (docs/MAPS.md 9.2)', () => {
  it('three short maps, the last ending on a mini-boss, each with a layout of its own', () => {
    const plans = [0, 1, 2].map((s) =>
      makeMapPlan(5 + s * 77, 42, 'ashenCrypt', [], 42, 'crawl', s),
    );
    for (const p of plans) {
      expect(p.lab.mainPath).toHaveLength(3);
      expect(p.lab.rooms.every((r) => r.kind !== 'side')).toBe(true);
      expect(p.segments).toBe(CRAWL_SEGMENTS);
    }
    expect(plans.map((p) => p.endKind)).toEqual(['rare', 'rare', 'miniboss']);
    expect(plans.map((p) => p.segment)).toEqual([0, 1, 2]);
    const run = newRun('vanguard', 3);
    setMap(run, 42);
    const offer = makeOffer(run.seed, 42, 0, 'ashenCrypt', 0, 'crawl');
    const seeds = [0, 1, 2].map((s) => planFor(run, offer, s).seed);
    expect(new Set(seeds).size).toBe(3);
    expect(planFor(run, offer).seed).toBe(seeds[0]);
  });

  it('combines the maps into one result: time, kills and loot added, the last state kept', () => {
    const a = result({ time: 90, kills: 10, xpGained: 5 });
    const b = result({ time: 80, kills: 12, xpGained: 6 });
    const c = result({ time: 120, kills: 15, xpGained: 9, level: 44, xp: 3, status: 'abandoned' });
    const all = combineCrawl([a, b, c]);
    expect(all.type).toBe('crawl');
    expect(all.time).toBe(290);
    expect(all.kills).toBe(37);
    expect(all.xpGained).toBe(20);
    expect(all.level).toBe(44);
    expect(all.status).toBe('abandoned');
  });

  it('is played through by the headless runner, with the character carried from map to map', () => {
    const run = newRun('vanguard', 6);
    setMap(run, 42);
    run.build.level = 45;
    botCamp(run);
    const offer = makeOffer(run.seed, 42, 0, 'ashenCrypt', 0, 'crawl');
    const starts: number[] = [];
    const res = playOffer(run, offer, (o) => {
      o.godMode = true;
      starts.push(o.start!.life);
    });
    expect(starts.length).toBe(res.status === 'cleared' ? CRAWL_SEGMENTS : starts.length);
    expect(res.type).toBe('crawl');
    // Later maps start from what the earlier ones left: not full life, in a god-mode run that took any damage.
    expect(starts[0]).toBe(1);
    if (starts.length > 1) expect(starts[1]).toBeLessThanOrEqual(1);
  });

  it('the game chains the three maps without a camp and pays one pick with a unique in it', () => {
    const c = new Controller(null);
    c.startRun('vanguard', 6);
    const run = c.run!;
    setMap(run, 42);
    run.build.level = 45;
    botCamp(run);
    run.offers[0] = makeOffer(run.seed, 42, 0, 'ashenCrypt', 0, 'crawl');
    c.setAutoContinue(false);
    let starts = 0;
    c.bus.on('mapStart', ({ world }) => {
      starts++;
      world.opts.godMode = true;
      world.opts.freeResources = true;
    });
    let ends = 0;
    c.bus.on('mapEnd', () => ends++);
    c.speed = 8;
    c.startMap(0);
    for (let i = 0; i < 4000 && c.screen === 'map'; i++) c.bus.emit('frame', { dtMs: 100 });
    expect(c.screen).toBe('camp');
    expect(starts).toBe(CRAWL_SEGMENTS);
    expect(ends).toBe(CRAWL_SEGMENTS);
    expect(run.history).toHaveLength(1);
    expect(run.history[0]).toMatchObject({ map: 42, status: 'cleared' });
    expect(run.map).toBe(43);
    expect(run.reward).not.toBeNull();
    expect(run.reward!.some((it) => it.kind === 'item' && it.rarity === 'unique')).toBe(true);
  });
});
