import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import type { MonsterModId, MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { applyHit, knockBack, rawHit } from './combat';
import { createDummyWorld } from './dummy';
import type { Actor, SimEvent, World } from './types';
import { spawnMonster } from './world';

/** What the renderer is told about hits (docs/VISUAL_LANGUAGE.md, "Hits"): who dealt them, what they really did, what was thrown back. */

const ok = (amount = 100) => ({
  outcome: 'hit' as const,
  crit: false,
  dmg: [amount, 0, 0, 0, 0],
  total: amount,
  H: [amount, 0, 0, 0, 0],
  ailments: { ignite: 0, bleed: 0, poison: 0, shock: 0, chill: 0, freeze: 0 },
  stun: 0,
});

const spec = (
  type: MonsterTypeId,
  mods: MonsterModId[] = [],
  over: Partial<MonsterSpec> = {},
): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level: 30,
  mods,
  ...over,
});

/** A mace-wielding player in the training arena, with its dummies set aside. */
function arena(): { world: World; player: Actor } {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 30;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 30, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 20 });
  for (const a of world.actors) if (a.dummy) a.alive = false;
  const player = world.sides[0].player;
  player.life = player.def.maxLife = 1e6;
  return { world, player };
}

function put(
  world: World,
  type: MonsterTypeId,
  dx: number,
  dy = 0,
  mods: MonsterModId[] = [],
  over: Partial<MonsterSpec> = {},
): Actor {
  const p = world.sides[0].player;
  return spawnMonster(world, spec(type, mods, over), p.x + dx, p.y + dy, 0, 0, type);
}

const hits = (w: World): Extract<SimEvent, { t: 'hit' }>[] =>
  w.events.filter((e): e is Extract<SimEvent, { t: 'hit' }> => e.t === 'hit');

describe('damage that is not a skill hit says whose it is', () => {
  it("an explosion of the character's names the character's side, and an enemy's does not", () => {
    const { world } = arena();
    const mon = put(world, 'warrior', 3);
    world.events.length = 0;
    rawHit(world, mon, 50, 3, world.sides[0], 'Explosion');
    const [e] = hits(world);
    expect(e.src).toBe(0);
    expect(e.side).toBe(world.sides[0].id);
    expect(e.amount).toBeGreaterThan(0);
    world.events.length = 0;
    rawHit(world, mon, 50, 3, null, 'Blast');
    expect(hits(world)[0].side).toBeUndefined();
  });

  it("a minion's blow names its side too", () => {
    const { world, player } = arena();
    const mon = put(world, 'warrior', 3);
    const minion = { ...player, id: 9999, isPlayer: false, side: world.sides[0] } as Actor;
    world.events.length = 0;
    applyHit(world, minion, mon, world.sides[0].char.profile(world.sides[0].char.primary), ok(10));
    expect(hits(world)[0].side).toBe(world.sides[0].id);
    world.events.length = 0;
    applyHit(world, player, mon, world.sides[0].char.profile(world.sides[0].char.primary), ok(10));
    expect(hits(world)[0].side).toBeUndefined();
  });
});

describe('a reflection is told apart', () => {
  for (const [name, type, mods] of [
    ['the Thorned affix', 'warrior', ['thorned']],
    ['a Gilded Guard', 'guard', []],
  ] as const) {
    it(`${name} throws back a hit that names who threw it`, () => {
      const { world, player } = arena();
      const mon = put(world, type, 1, 0, [...mods], { rarity: mods.length ? 'rare' : 'normal' });
      const melee = world.sides[0].char.profile(world.sides[0].char.primary);
      expect(melee.skill.behaviour.kind).toBe('melee');
      world.events.length = 0;
      applyHit(world, player, mon, melee, ok(2000));
      const reflect = world.events.find((e) => e.t === 'reflect');
      expect(reflect).toBeDefined();
      if (reflect?.t !== 'reflect') return;
      expect(reflect.src).toBe(mon.id);
      expect(reflect.dst).toBe(player.id);
      expect(reflect.amount).toBeGreaterThan(0);
      // The hit it comes with carries the reflector, and says the same number.
      const thrown = hits(world).find((h) => h.dst === player.id)!;
      expect(thrown.reflect).toBe(mon.id);
      expect(thrown.amount).toBeCloseTo(reflect.amount, 9);
      // The blow itself is not a reflection.
      expect(hits(world).find((h) => h.dst === mon.id)!.reflect).toBeUndefined();
    });
  }
});

describe('a protected hit does not show damage that was never dealt', () => {
  it('a monster under a Warden Pylon takes nothing, and the hit says so', () => {
    const { world, player } = arena();
    const mon = put(world, 'warrior', 2);
    put(world, 'pylon', 4);
    expect(world.hasPylons).toBe(true);
    const melee = world.sides[0].char.profile(world.sides[0].char.primary);
    const before = mon.life;
    world.events.length = 0;
    applyHit(world, player, mon, melee, ok(500));
    const h = hits(world).find((e) => e.dst === mon.id)!;
    expect(h.warded).toBe(true);
    expect(h.amount).toBe(0);
    expect(mon.life).toBe(before);
    // An explosion is turned aside the same way.
    world.events.length = 0;
    rawHit(world, mon, 500, 3, world.sides[0], 'Explosion');
    const r = hits(world)[0];
    expect(r.warded).toBe(true);
    expect(r.amount).toBe(0);
    expect(mon.life).toBe(before);
  });

  it('a curled beetle shows the damage it took, not the damage that was thrown', () => {
    const { world, player } = arena();
    const mon = put(world, 'beetle', 2);
    const melee = world.sides[0].char.profile(world.sides[0].char.primary);
    mon.curlT = 2;
    const before = mon.life;
    world.events.length = 0;
    applyHit(world, player, mon, melee, ok(100));
    const h = hits(world).find((e) => e.dst === mon.id)!;
    expect(h.curled).toBe(true);
    expect(h.amount).toBeLessThan(100);
    expect(h.amount).toBeGreaterThan(0);
    expect(before - mon.life).toBeCloseTo(h.amount, 6);
    // An unprotected monster is shown the whole of it.
    const other = put(world, 'warrior', 3);
    world.events.length = 0;
    applyHit(world, player, other, melee, ok(100));
    const o = hits(world).find((e) => e.dst === other.id)!;
    expect(o.curled).toBeUndefined();
    expect(o.warded).toBeUndefined();
  });
});

describe('a knockback is told', () => {
  it('an enemy that is moved says so, and one that stays put does not', () => {
    const { world, player } = arena();
    const mon = put(world, 'warrior', 2);
    const x = mon.x;
    world.events.length = 0;
    knockBack(world, player, mon, 3);
    expect(mon.x).not.toBe(x);
    expect(world.events.filter((e) => e.t === 'knock')).toEqual([{ t: 'knock', id: mon.id }]);
    world.events.length = 0;
    knockBack(world, player, mon, 0);
    expect(world.events.filter((e) => e.t === 'knock')).toHaveLength(0);
  });
});
