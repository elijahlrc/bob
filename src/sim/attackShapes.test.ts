import { describe, expect, it } from 'vitest';
import { buildMonster, type MonsterSpec } from '../calc/monster';
import { MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { SHAPE_INFO, shapeText, type ShapeId } from '../data/shapes';
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
  world.player.stunT = 1e9;
  world.opts.godMode = true;
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
  const m = spawnMonster(w, spec(type), w.player.x + dx, w.player.y + dy, 0, 0, type);
  m.state = 'chase';
  return m;
}

/** Start the monster's own attack at the character and step until its warning is up. */
function windUp(w: World, m: Actor, ticks = 12): void {
  startAction(w, m, 'monster', m.mon!.profile(0), w.player);
  for (let i = 0; i < ticks; i++) stepWorld(w);
}

const WITH_SHAPE = (Object.keys(MONSTER_TYPES) as MonsterTypeId[]).filter(
  (id) => MONSTER_TYPES[id].shape,
);

describe('attack shapes (docs/ROSTER.md section 5)', () => {
  it('a shape sets the behaviour a type attacks with', () => {
    const kind = (id: MonsterTypeId) => buildMonster(spec(id)).profile(0).skill.behaviour;
    expect(kind('brute')).toMatchObject({ kind: 'melee', arc: 150 });
    expect(kind('flagellant')).toMatchObject({ kind: 'melee', arc: 150 });
    expect(kind('sentinel')).toMatchObject({ kind: 'burst', origin: 'self' });
    expect(kind('wailer')).toMatchObject({ kind: 'burst', origin: 'self' });
    expect(kind('spitter')).toMatchObject({
      kind: 'burst',
      origin: 'target',
      zone: { kind: 'caustic' },
    });
    expect(kind('arbalest')).toMatchObject({ kind: 'beam' });
    expect(kind('archer')).toMatchObject({ kind: 'projectile', count: 1 });
    expect(kind('warrior')).toMatchObject({ kind: 'melee' });
    expect(kind('warrior')).not.toHaveProperty('arc');
  });

  it('a salvo fires again, and an orb flies slowly', () => {
    expect(buildMonster(spec('archer')).profile(0).repeats).toBe(1);
    expect(buildMonster(spec('slinger')).profile(0).repeats).toBe(1);
    expect(buildMonster(spec('flagellant')).profile(0).repeats).toBe(1);
    expect(buildMonster(spec('warrior')).profile(0).repeats).toBe(0);
    expect(buildMonster(spec('mage')).profile(0).projSpeedMult).toBeCloseTo(0.5, 5);
    expect(buildMonster(spec('spitter')).profile(0).projSpeedMult).toBe(1);
  });

  it("a shape spreads the type's hit: an arrow of a salvo hits for less than a plain arrow", () => {
    const hit = (id: MonsterTypeId) => {
      const c = buildMonster(spec(id)).profile(0).hands[0].chunks;
      return c.reduce((s, x) => s + (x.min + x.max) / 2, 0);
    };
    // The Archer's dmgMult is 0.8 and each shot of its salvo is half of it.
    const plain = hit('warrior') * 0.8;
    expect(hit('archer')).toBeCloseTo(plain * 0.5, 0);
  });

  it('a swing winds up a wedge in front of the monster, and its aim stops following the target', () => {
    const w = arena();
    const m = put(w, 'brute', 1.8);
    windUp(w, m, 20);
    const t = telegraphs(w)[0];
    expect(t.kind).toBe('arc');
    if (t.kind !== 'arc') return;
    // The character is in the wedge, a point behind the monster is not.
    expect(inTelegraph(t, w.player.x, w.player.y, w.player.r)).toBe(true);
    expect(inTelegraph(t, m.x + 2, m.y, 0.3)).toBe(false);
    // The aim is still following the character 0.3 s in, and fixed by 0.7 s (a lock at 0.3 of a 1.14 s wind-up).
    for (let i = 0; i < 24; i++) stepWorld(w);
    const locked = telegraphs(w)[0];
    expect(locked.kind).toBe('arc');
    if (locked.kind !== 'arc') return;
    // The character is somewhere else now: the wedge does not turn to it.
    w.player.y -= 3;
    for (let i = 0; i < 6; i++) stepWorld(w);
    const after = telegraphs(w)[0];
    expect(after.kind).toBe('arc');
    if (after.kind === 'arc') expect(after.facing).toBeCloseTo(locked.facing, 5);
    expect(inTelegraph(after, w.player.x, w.player.y, w.player.r)).toBe(false);
  });

  it('the warning is a hazard to the character: hazardAt sees a wedge, a ring and a lane', () => {
    const w = arena();
    const brute = put(w, 'brute', 1.8);
    windUp(w, brute, 20);
    expect(hazardAt(w, w.player.x, w.player.y, w.player.r)).not.toBeNull();
    expect(hazardAt(w, brute.x + 3, brute.y)).toBeNull();
    brute.alive = false;
    w.actors = w.actors.filter((a) => a.alive || a.isPlayer);
    const sentinel = put(w, 'sentinel', 1.6);
    windUp(w, sentinel, 20);
    const ring = telegraphs(w)[0];
    expect(ring.kind).toBe('ring');
    expect(hazardAt(w, sentinel.x + 1, sentinel.y)).not.toBeNull();
    expect(hazardAt(w, sentinel.x + 6, sentinel.y)).toBeNull();
    sentinel.alive = false;
    const arb = put(w, 'arbalest', 8);
    windUp(w, arb, 20);
    const lane = telegraphs(w).find((t) => t.kind === 'lane');
    expect(lane).toBeDefined();
    if (lane?.kind !== 'lane') return;
    expect(inTelegraph(lane, w.player.x, w.player.y, w.player.r)).toBe(true);
    expect(inTelegraph(lane, w.player.x, w.player.y + 4, 0.3)).toBe(false);
  });

  it('a lob opens a zone where it lands, and the character can see it', () => {
    const w = arena();
    const m = put(w, 'spitter', 5);
    windUp(w, m, 90);
    const zone = w.effects.find((e) => e.kind === 'caustic');
    expect(zone).toBeDefined();
    expect(zone!.radius).toBeCloseTo(1.6, 5);
    expect(hazardAt(w, zone!.x, zone!.y)).not.toBeNull();
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
      expect(t.radius).toBeCloseTo(3, 5);
    }
  });

  it('a melee type stays a melee type whatever its shape: a Sentinel walks up, it does not hold off', () => {
    const w = arena();
    const m = put(w, 'sentinel', 8);
    const d0 = Math.hypot(m.x - w.player.x, m.y - w.player.y);
    for (let i = 0; i < 120; i++) stepWorld(w);
    expect(Math.hypot(m.x - w.player.x, m.y - w.player.y)).toBeLessThan(d0 - 2);
  });

  it('every shape has a card string, and the shapes that ask something of the character carry a tag', () => {
    for (const id of Object.keys(SHAPE_INFO) as ShapeId[]) {
      expect(SHAPE_INFO[id].name.length).toBeGreaterThan(2);
      expect(SHAPE_INFO[id].text({ id }).length).toBeGreaterThan(8);
    }
    for (const id of WITH_SHAPE) {
      const s = MONSTER_TYPES[id].shape!;
      expect(shapeText(s), id).toContain(SHAPE_INFO[s.id].name);
      if (s.id !== 'orb') expect(SHAPE_INFO[s.id].tag, id).toBeDefined();
    }
    expect(shapeText(undefined)).toBeNull();
    expect(shapeText({ id: 'strike' })).toBeNull();
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
      w.player.x + 16,
      w.player.y,
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
