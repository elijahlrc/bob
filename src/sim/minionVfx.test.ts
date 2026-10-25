import { describe, expect, it } from 'vitest';
import { MINIONS } from '../data/minions';
import { buildFor, classFor } from './gemKit';
import { createDummyWorld, dummyDefence } from './dummy';
import { spawnMonster, stepWorld } from './world';
import type { Actor, SimEvent, World } from './types';

/** What the sim tells the renderer about a minion's blows and motes (docs/VISUAL_LANGUAGE.md, "Minions"). */

const INT = classFor('int');
const DEX = classFor('dex');

function arena(gems: string[], distance: number, cls: string, main = 'wand_3') {
  const run = createDummyWorld(buildFor(gems, main, cls, 'none'), { distance, maxTime: 120 });
  run.world.sides[0].opts.freeResources = true;
  run.world.sides[0].opts.godMode = true;
  run.dummy.def = dummyDefence({ maxLife: 1e9 });
  run.dummy.life = 1e9;
  return run;
}

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

type Blow = Extract<SimEvent, { t: 'minionBlow' }>;

/** The minion blows of a few seconds, with the minions in the world standing still where they are put by `setup`. */
function blows(w: World, seconds: number, setup?: () => void): Blow[] {
  const out: Blow[] = [];
  let ready = false;
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(w);
    if (!ready && w.sides[0].minions.length > 0) {
      ready = true;
      setup?.();
    }
    const here = new Set<number>();
    for (const e of w.events)
      if (e.t === 'minionBlow') {
        // One event for a blow, however many damage types it splits into.
        expect(here.has(e.src)).toBe(false);
        here.add(e.src);
        out.push(e);
      }
  }
  return out;
}

describe('a minion blow is told to the renderer, once', () => {
  it('a melee blow has no flight, and says how far it splashes and how many it caught', () => {
    const { world: w, dummy } = arena(['stoneColossus'], 3, INT);
    neighbour(w, dummy.x + 0.4, dummy.y + 0.3);
    const got = blows(w, 12);
    expect(got.length).toBeGreaterThan(0);
    for (const b of got) {
      expect(b.minion).toBe('stoneGolem');
      expect(b.shot).toBeUndefined();
      expect(b.splash).toBe(MINIONS.stoneGolem.splash);
    }
    expect(got.some((b) => b.caught > 0)).toBe(true);
  });

  it('a blow with no splash says so', () => {
    const { world: w } = arena(['callBonewalkers'], 3, INT);
    const got = blows(w, 12);
    expect(got.length).toBeGreaterThan(0);
    for (const b of got) {
      expect(b.splash).toBe(0);
      expect(b.caught).toBe(0);
    }
  });

  it('a ranged minion shoots the body of its element: an orb of fire, a bolt of lightning, an arrow of steel', () => {
    for (const [gem, shot, dtype] of [
      ['emberColossus', 'orb', 3],
      ['stormColossus', 'bolt', 1],
    ] as const) {
      const { world: w, dummy } = arena([gem], 5, INT);
      const got = blows(w, 12);
      expect(got.length, gem).toBeGreaterThan(0);
      for (const b of got) {
        expect(b.shot, gem).toBe(shot);
        expect(b.dtype, gem).toBe(dtype);
        // From the minion to what it strikes.
        expect(Math.hypot(b.x2 - dummy.x, b.y2 - dummy.y), gem).toBeLessThan(1);
        expect(Math.hypot(b.x2 - b.x, b.y2 - b.y), gem).toBeGreaterThan(0.5);
      }
    }
    // A physical ranged blow is an arrow (the archer's own kind).
    const { world: w } = arena(['stormColossus'], 5, INT);
    const got = blows(w, 12, () => {
      for (const m of w.sides[0].minions) m.kind = 'clone';
    });
    expect(got.length).toBeGreaterThan(0);
    expect(got.some((b) => b.shot === 'arrow')).toBe(true);
  });
});

describe('a mote that sets off a trap says so', () => {
  it('a spark runs from the mote to the device it sets off', () => {
    const { world: w, dummy } = arena(['jawsTrap', 'whirringMotes'], 6, DEX);
    const sparks: Extract<SimEvent, { t: 'botSpark' }>[] = [];
    const sprung: number[] = [];
    const s = w.sides[0];
    const key = s.char.actives.find((c) => c.skill.id === 'jawsTrap')!.key;
    let laid = 0;
    for (let i = 0; i < 60 * 40; i++) {
      stepWorld(w);
      // A trap lies beyond the reach at which an enemy springs it, but within the motes' sight of the enemy.
      if (!laid && s.minions.some((m) => m.bot)) {
        laid = w.nextId++;
        s.deployables.push({
          id: laid,
          kind: 'trap',
          key,
          x: dummy.x - 3,
          y: dummy.y,
          t: 30,
          fireT: 0,
        });
      }
      for (const e of w.events) {
        if (e.t === 'botSpark') sparks.push(e);
        if (e.t === 'sprung') sprung.push(e.id);
      }
    }
    expect(sparks.length).toBeGreaterThan(0);
    for (const s of sparks) {
      expect(['chill', 'shock']).toContain(s.aura);
      expect(s.src).toBeGreaterThan(0);
      // The device it sprang is one that went off in the same moment.
      expect(sprung).toContain(s.device);
    }
  });
});
