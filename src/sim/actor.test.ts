import { describe, expect, it } from 'vitest';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { newActor, standIn } from './actor';
import { createDummyWorld } from './dummy';
import { layCorpses } from './gemKit';
import { summonMinions } from './minions';

let n = 92000;
const uid = () => n++;

/** An arena with a mystic who has a zombie summon: a character, a monster (the training dummy) and, once summoned, minions. */
function arena() {
  const run = newRun('mystic', 1);
  const b = run.build;
  b.level = 30;
  b.equipment.mainHand = makeItem(uid, 'wand_3', 30, 1);
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 30, 2);
  body.sockets = ['flameBolt', 'raiseHusk'].map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]?.uid;
  b.flasks = [null, null, null, null, null];
  const { world, dummy } = createDummyWorld(b, { distance: 3 });
  world.sides[0].opts.freeResources = false;
  layCorpses(world, world.sides[0].player.x, world.sides[0].player.y, 30);
  return { world, dummy };
}

/** Own enumerable properties: those of the literal in `newActor` and those assigned after it. */
const props = (o: object) => Object.keys(o).length;

/**
 * Why a limit: V8 builds an object from a literal of 128 or more properties much more slowly than one of 127 (the fast,
 * struct-like layout is kept below that size); one field more in `newActor`'s literal made the whole sim about 15% slower
 * (docs/PERFORMANCE.md section 5). The literal had 127 properties, so a single new field was a trap. Fields that are one thing
 * are now grouped into one sub-object each (`since`, `hex`, `dash`...), which leaves a wide margin (88 properties for an actor).
 * If this fails, group the new field with the ones it belongs with, or make a group of its own, rather than raising the limit.
 */
const LIMIT = 100;

describe('the size of an actor (a literal of 128 properties is slow in V8)', () => {
  it('an actor from newActor has at most 100 properties', () => {
    expect(props(newActor(1, true, 0, 0, 0.4))).toBeLessThanOrEqual(LIMIT);
  });

  it('a monster from spawnMonster has at most 100 properties', () => {
    const { dummy } = arena();
    expect(dummy.mon).toBeDefined();
    expect(props(dummy)).toBeLessThanOrEqual(LIMIT);
  });

  it('a minion from makeMinion has at most 100 properties', () => {
    const { world } = arena();
    const s = world.sides[0];
    const c = s.char.utilities[0];
    summonMinions(world, s, c, s.char.profile(c, 0, 0));
    expect(s.minions.length).toBeGreaterThan(0);
    for (const m of s.minions) expect(props(m)).toBeLessThanOrEqual(LIMIT);
  });

  it('a side has at most 94 properties (74 when it was measured, and room for 20 more)', () => {
    const { world } = arena();
    expect(props(world.sides[0])).toBeLessThanOrEqual(94);
  });
});

describe('the groups of an actor', () => {
  it('no two actors share a group, an array or an object they set (the constant NO_SUP apart)', () => {
    const a = newActor(1, false, 0, 0, 0.4) as unknown as Record<string, unknown>;
    const b = newActor(2, false, 0, 0, 0.4) as unknown as Record<string, unknown>;
    for (const k of Object.keys(a)) {
      if (k === 'sup' || typeof a[k] !== 'object' || a[k] === null) continue;
      expect(a[k], k).not.toBe(b[k]);
    }
  });

  it('a stand-in reads what the actor has and keeps what it sets on itself', () => {
    const p = newActor(1, true, 3, 4, 0.4);
    p.life = 50;
    p.since.hit = 7;
    const from = standIn(p);
    from.x = 9;
    expect(from.life).toBe(50);
    expect(from.since.hit).toBe(7);
    // A hit sets the seconds since the last hit on the one that struck: not on the actor it stands in for.
    from.since.hit = 0;
    from.since.crit = 0;
    expect(from.since.hit).toBe(0);
    expect(p.since.hit).toBe(7);
    expect(p.since.crit).toBe(99);
    expect(p.x).toBe(3);
  });
});
