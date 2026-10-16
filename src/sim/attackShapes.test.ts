import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import type { MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { startAction } from './actions';
import { hit } from './combat';
import { hazardAt } from './ai';
import { createDummyWorld } from './dummy';
import { inTelegraph, telegraphs } from './telegraph';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A level 40 character in an open arena, fixed to the spot, with no dummies. */
function arena(): World {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 40, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 30 });
  world.sides[0].player.stunT = 1e9;
  world.sides[0].opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

const spec = (type: MonsterTypeId): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level: 30,
  mods: [],
});

function put(w: World, type: MonsterTypeId, dx: number, dy = 0): Actor {
  const m = spawnMonster(
    w,
    spec(type),
    w.sides[0].player.x + dx,
    w.sides[0].player.y + dy,
    0,
    0,
    type,
  );
  m.state = 'chase';
  return m;
}

/** Start the monster's own attack at the character and step until its warning is up. */
function windUp(w: World, m: Actor, ticks = 12): void {
  startAction(w, m, 'monster', m.mon!.profile(0), w.sides[0].player);
  for (let i = 0; i < ticks; i++) stepWorld(w);
}

describe('attack shapes (docs/ROSTER.md section 5)', () => {
  it('a swing winds up a wedge in front of the monster, and its aim stops following the target', () => {
    const w = arena();
    const m = put(w, 'brute', 1.8);
    windUp(w, m, 20);
    const t = telegraphs(w)[0];
    expect(t.kind).toBe('arc');
    if (t.kind !== 'arc') return;
    // The character is in the wedge, a point behind the monster is not.
    expect(inTelegraph(t, w.sides[0].player.x, w.sides[0].player.y, w.sides[0].player.r)).toBe(
      true,
    );
    expect(inTelegraph(t, m.x + 2, m.y, 0.3)).toBe(false);
    // The aim is still following the character 0.3 s in, and fixed by 0.7 s (a lock at 0.3 of a 1.14 s wind-up).
    for (let i = 0; i < 24; i++) stepWorld(w);
    const locked = telegraphs(w)[0];
    expect(locked.kind).toBe('arc');
    if (locked.kind !== 'arc') return;
    // The character is somewhere else now: the wedge does not turn to it.
    w.sides[0].player.y -= 3;
    for (let i = 0; i < 6; i++) stepWorld(w);
    const after = telegraphs(w)[0];
    expect(after.kind).toBe('arc');
    if (after.kind === 'arc') expect(after.facing).toBeCloseTo(locked.facing, 5);
    expect(inTelegraph(after, w.sides[0].player.x, w.sides[0].player.y, w.sides[0].player.r)).toBe(
      false,
    );
  });

  it('the warning is a hazard to the character: hazardAt sees a wedge, a ring and a lane', () => {
    const w = arena();
    const brute = put(w, 'brute', 1.8);
    windUp(w, brute, 20);
    expect(
      hazardAt(w, w.sides[0].team, w.sides[0].player.x, w.sides[0].player.y, w.sides[0].player.r),
    ).not.toBeNull();
    expect(hazardAt(w, w.sides[0].team, brute.x + 3, brute.y)).toBeNull();
    brute.alive = false;
    w.actors = w.actors.filter((a) => a.alive || a.isPlayer);
    const sentinel = put(w, 'sentinel', 1.6);
    windUp(w, sentinel, 20);
    const ring = telegraphs(w)[0];
    expect(ring.kind).toBe('ring');
    expect(hazardAt(w, w.sides[0].team, sentinel.x + 1, sentinel.y)).not.toBeNull();
    expect(hazardAt(w, w.sides[0].team, sentinel.x + 6, sentinel.y)).toBeNull();
    sentinel.alive = false;
    const arb = put(w, 'arbalest', 8);
    windUp(w, arb, 20);
    const lane = telegraphs(w).find((t) => t.kind === 'lane');
    expect(lane).toBeDefined();
    if (lane?.kind !== 'lane') return;
    expect(inTelegraph(lane, w.sides[0].player.x, w.sides[0].player.y, w.sides[0].player.r)).toBe(
      true,
    );
    expect(inTelegraph(lane, w.sides[0].player.x, w.sides[0].player.y + 4, 0.3)).toBe(false);
  });

  it('a lob opens a zone where it lands, and the character can see it', () => {
    const w = arena();
    const m = put(w, 'spitter', 5);
    windUp(w, m, 90);
    const zone = w.effects.find((e) => e.kind === 'caustic');
    expect(zone).toBeDefined();
    expect(hazardAt(w, w.sides[0].team, zone!.x, zone!.y)).not.toBeNull();
  });

  it('a nova round a monster does not follow anything: it is centred on the monster', () => {
    const w = arena();
    const m = put(w, 'wailer', 2.5);
    windUp(w, m, 10);
    const t = telegraphs(w)[0];
    expect(t.kind).toBe('ring');
    if (t.kind === 'ring') {
      expect(t.x).toBeCloseTo(m.x, 5);
      expect(t.y).toBeCloseTo(m.y, 5);
    }
  });

  it('a melee type stays a melee type whatever its shape: a Sentinel walks up, it does not hold off', () => {
    const w = arena();
    const m = put(w, 'sentinel', 8);
    const d0 = Math.hypot(m.x - w.sides[0].player.x, m.y - w.sides[0].player.y);
    for (let i = 0; i < 120; i++) stepWorld(w);
    expect(Math.hypot(m.x - w.sides[0].player.x, m.y - w.sides[0].player.y)).toBeLessThan(d0 - 2);
  });
});

describe('a carapace (docs/ROSTER.md 6.2)', () => {
  it("no single hit takes more than its share of a Sentinel's life, and a hit under it is untouched", () => {
    const w = arena();
    const sentinel = put(w, 'sentinel', 12);
    const big = put(w, 'warrior', 14);
    // A far stronger monster of the same kind hits it: the hit would take most of its life, and is cut to a fifth.
    const strong = spawnMonster(
      w,
      { ...spec('warrior'), level: 100, rarity: 'boss' },
      w.sides[0].player.x + 16,
      w.sides[0].player.y,
      0,
      0,
      'big',
    );
    const max = sentinel.def.maxLife;
    // Its Aegis would turn the blow aside (docs/ENCOUNTERS.md 5): this is about the carapace.
    sentinel.enc!.plates = 0;
    hit(w, strong, sentinel, strong.mon!.profile(0), 0, 1);
    expect(max - sentinel.life).toBeLessThanOrEqual(max * 0.2 + 1e-6);
    expect(max - sentinel.life).toBeGreaterThan(max * 0.05);
    // The same hit on a warrior, which has no carapace, takes far more of its life.
    hit(w, strong, big, strong.mon!.profile(0), 0, 1);
    expect(big.def.maxLife - big.life).toBeGreaterThan(big.def.maxLife * 0.2);
  });
});
