import { describe, expect, it } from 'vitest';
import { buildFor, classFor } from './gemKit';
import { createDummyWorld, dummyDefence } from './dummy';
import { rawHit } from './combat';
import type { Actor, SimEvent, World } from './types';
import { spawnMonster, stepWorld } from './world';

/**
 * What the sim tells the renderer so that what was done to an enemy can be shown on it (docs/VISUAL_LANGUAGE.md, "On the enemy"): the
 * impales a spear leaves and pays, an ailment or a debuff passed on, a kill that sets its neighbours burning, a frozen body that shatters.
 */

const INT = classFor('int');
const STR = classFor('str');
const DEX = classFor('dex');

function neighbour(w: World, x: number, y: number): Actor {
  const m = spawnMonster(
    w,
    { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
    x,
    y,
    0,
    0,
    'Neighbour',
  );
  m.def = dummyDefence({ maxLife: 1e9 });
  m.life = 1e9;
  return m;
}

function world(gems: string[], distance: number, main: string, cls: string) {
  const run = createDummyWorld(buildFor(gems, main, cls), { distance, maxTime: 120 });
  run.world.sides[0].opts.freeResources = true;
  run.world.sides[0].opts.godMode = true;
  run.dummy.def = dummyDefence({ maxLife: 1e9 });
  run.dummy.life = 1e9;
  return run;
}

/** Step the world and gather the events of every step. */
function play(w: World, seconds: number, until?: (e: SimEvent[]) => boolean): SimEvent[] {
  const out: SimEvent[] = [];
  for (let i = 0; i < seconds * 60 && w.status === 'running'; i++) {
    stepWorld(w);
    out.push(...w.events);
    if (until?.(out)) break;
  }
  return out;
}

describe('impales (Skewer)', () => {
  it('says when a spear is driven in and when the held ones pay out, and how many were used up', () => {
    const { world: w, dummy } = world(['crushingBlow', 'skewer'], 1.4, 'sword_3', STR);
    const events = play(w, 25);
    const stuck = events.filter((e) => e.t === 'impale' && e.kind === 'stuck');
    const paid = events.filter((e) => e.t === 'impale' && e.kind === 'paid');
    expect(stuck.length).toBeGreaterThan(0);
    expect(paid.length).toBeGreaterThan(0);
    for (const e of [...stuck, ...paid]) {
      const i = e as Extract<SimEvent, { t: 'impale' }>;
      expect(i.dst).toBe(dummy.id);
      expect(i.n).toBeGreaterThanOrEqual(0);
      expect(i.n).toBeLessThanOrEqual(5);
    }
    // A spear wears out after its hits: some payout used one up.
    expect(paid.some((e) => (e as Extract<SimEvent, { t: 'impale' }>).n > 0)).toBe(true);
  });
});

describe('ailments and debuffs passed on', () => {
  it('Wildfire Seed: an ignite that spreads says from whom to whom', () => {
    const { world: w, dummy } = world(['torchArrow', 'wildfireSeed'], 3, 'bow_3', DEX);
    const near = neighbour(w, dummy.x + 1.5, dummy.y);
    const events = play(w, 30, (es) =>
      es.some((e) => e.t === 'spread' && e.kind === 'ignite' && e.to === near.id),
    );
    const link = events.find((e) => e.t === 'spread' && e.kind === 'ignite' && e.to === near.id);
    expect(link).toBeDefined();
    const l = link as Extract<SimEvent, { t: 'spread' }>;
    expect(l.from).toBe(dummy.id);
    expect(l.dtype).toBe(3);
    // The ailment itself still has its own event, unchanged.
    expect(events.some((e) => e.t === 'ailment' && e.dst === near.id && e.kind === 'ignite')).toBe(
      true,
    );
  });

  it('Wildfire Spread: shock and chill are linked too (chill had no event at all)', () => {
    const { world: w, dummy } = world(['searingLance', 'wildfireSpread'], 3, 'wand_3', INT);
    const near = neighbour(w, dummy.x + 1.5, dummy.y);
    dummy.ail.shock = 0.2;
    dummy.ail.shockT = 4;
    dummy.ail.chill = 0.2;
    dummy.ail.chillT = 4;
    dummy.ail.spreadEle = 2;
    const events = play(w, 1.2);
    const kinds = new Set(
      events
        .filter((e) => e.t === 'spread' && e.from === dummy.id && e.to === near.id)
        .map((e) => (e as Extract<SimEvent, { t: 'spread' }>).kind),
    );
    expect(kinds.has('shock')).toBe(true);
    expect(kinds.has('chill')).toBe(true);
  });

  it('a damage-over-time debuff that spreads from a dead enemy says so, with its damage type', () => {
    const { world: w, dummy } = world(['creepingPlague'], 3, 'wand_3', INT);
    play(w, 1);
    const near = neighbour(w, dummy.x + 2.2, dummy.y);
    w.events.length = 0;
    rawHit(w, dummy, 1e12, 0, null);
    const link = w.events.find((e) => e.t === 'spread' && e.to === near.id) as
      Extract<SimEvent, { t: 'spread' }> | undefined;
    expect(link).toBeDefined();
    expect(link!.from).toBe(dummy.id);
    expect(link!.kind).toBe('dot');
    expect(link!.dtype).toBe(4);
  });
});

describe('Cinder Herald', () => {
  it('a kill that sets the enemies near the corpse burning says where and how many', () => {
    const { world: w, dummy } = world(['crushingBlow', 'cinderHerald'], 1.4, 'sword_3', STR);
    const near = neighbour(w, dummy.x + 1.5, dummy.y);
    neighbour(w, dummy.x + 9, dummy.y);
    w.sides[0].player.stunT = 1e9;
    dummy.def = dummyDefence({ maxLife: 100 });
    dummy.life = 100;
    w.events.length = 0;
    rawHit(w, dummy, 1100, 0, null);
    const k = w.events.find((e) => e.t === 'kindle') as Extract<SimEvent, { t: 'kindle' }>;
    expect(k).toBeDefined();
    expect(k.x).toBeCloseTo(dummy.x);
    expect(k.y).toBeCloseTo(dummy.y);
    expect(k.r).toBeGreaterThan(1);
    expect(k.n).toBe(1);
    expect(near.sdots.some((d) => d.src === '@herald')).toBe(true);
  });
});

describe('a frozen enemy shattered', () => {
  it('says so before its death, in the same step', () => {
    const { world: w, dummy } = world(['rimeMallet'], 1.4, 'mace_3', STR);
    dummy.def = dummyDefence({ maxLife: 100000 });
    dummy.life = 20000;
    dummy.ail.freezeT = 5;
    const events = play(w, 1.5, () => !dummy.alive);
    const at = events.findIndex((e) => e.t === 'shatter' && e.id === dummy.id);
    expect(at).toBeGreaterThanOrEqual(0);
    const death = events.findIndex((e) => e.t === 'death' && e.id === dummy.id);
    expect(death).toBeGreaterThan(at);
  });
});
