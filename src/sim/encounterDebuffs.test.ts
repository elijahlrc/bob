import { describe, expect, it } from 'vitest';
import { emptyAilments, type HitResult } from '../calc/combat';
import type { MonsterSpec } from '../calc/monster';
import type { MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { tithing } from './abilities';
import { applyHit, hit } from './combat';
import { createDummyWorld } from './dummy';
import { MARK_MORE, markOf, markPlayer } from './encounters';
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
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

const spec = (type: MonsterTypeId): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level: 40,
  mods: [],
});

function put(w: World, type: MonsterTypeId, dx: number, dy = 0, pack = 0): Actor {
  const m = spawnMonster(w, spec(type), w.player.x + dx, w.player.y + dy, 0, pack, type);
  m.state = 'chase';
  return m;
}

const steps = (w: World, n: number) => {
  for (let i = 0; i < n; i++) stepWorld(w);
};

/** A hit of exactly this physical damage, from a monster on the character. */
function struck(w: World, src: Actor, amount: number): number {
  const p = w.player;
  const before = p.life + p.es;
  const res: HitResult = {
    outcome: 'hit',
    crit: false,
    dmg: [amount, 0, 0, 0, 0],
    total: amount,
    H: [amount, 0, 0, 0, 0],
    ailments: emptyAilments(),
    stun: 0,
  };
  applyHit(w, src, p, src.mon!.profile(0), res);
  return before - (p.life + p.es);
}

describe('debuffs on the character (docs/ENCOUNTERS.md 7)', () => {
  it("a Bursar's Tithe drains the character while it can see it, and mends the Bursar", () => {
    const w = arena();
    const m = put(w, 'bursar', 6);
    m.life = m.def.maxLife * 0.5;
    steps(w, 70);
    expect(tithing(m)).toBe(true);
    expect(m.life).toBeGreaterThan(m.def.maxLife * 0.5);
    const drawn = w.dmgLog.filter((l) => l.name === 'Tithe');
    expect(drawn.length).toBeGreaterThan(1);
    // About its hit a second.
    expect(drawn[0].amount).toBeGreaterThan(3);
  });

  it("a Handler's mark makes its pack hit harder, and only its pack", () => {
    const w = arena();
    const handler = put(w, 'handler', 8, 0, 3);
    const own = put(w, 'hound', 2, 0, 3);
    const other = put(w, 'hound', -2, 0, 4);
    const plain = struck(w, own, 50);
    markPlayer(w, handler);
    expect(markOf(w)).not.toBeNull();
    expect(struck(w, own, 50)).toBeCloseTo(plain * (1 + MARK_MORE), 0);
    expect(struck(w, other, 50)).toBeCloseTo(plain, 0);
    steps(w, 300);
    expect(markOf(w)).toBeNull();
  });

  it("a Hexer's sigil hexes the character who stands in it, after a moment's grace", () => {
    const w = arena();
    const m = put(w, 'hexer', 6);
    m.skillT = 0;
    // It draws between bolts.
    for (let i = 0; i < 200 && !w.effects.some((e) => e.kind === 'sigil'); i++) stepWorld(w);
    expect(w.effects.some((e) => e.kind === 'sigil')).toBe(true);
    expect(w.player.hexes.length).toBe(0);
    steps(w, 40);
    expect(w.player.hexes.length).toBeGreaterThan(0);
  });

  it("a Gloomstalker's shade blinds: the character's attacks miss more", () => {
    const w = arena();
    const m = put(w, 'gloomstalker', 6);
    const prof = m.mon!.sidearm!.profile(0);
    w.opts.godMode = true;
    for (let i = 0; i < 20 && !w.player.fx.blind; i++) hit(w, m, w.player, prof, 0, 6);
    expect(w.player.fx.blind).toBeDefined();
    expect(w.player.fx.blind!.v).toBe(50);
  });
});
