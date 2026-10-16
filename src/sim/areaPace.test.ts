import { describe, expect, it } from 'vitest';
import { areaPace, buildMonster, type MonsterSpec } from '../calc/monster';
import { DT } from '../data/constants';
import { MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { AREA_PACE, isAreaShape } from '../data/shapes';
import { DODGE_MAX, DODGE_REST } from '../data/strategy';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { openZone } from './factions';
import { createDummyWorld } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

const spec = (type: MonsterTypeId, rarity: MonsterSpec['rarity'] = 'normal'): MonsterSpec => ({
  type,
  variant: 'none',
  rarity,
  level: 30,
  mods: [],
});

const hitOf = (s: MonsterSpec) =>
  buildMonster(s)
    .profile(0)
    .hands[0].chunks.reduce((n, c) => n + (c.min + c.max) / 2, 0);

/** An open arena with the character free to act, no dummies, and nothing to hurt it. */
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
  world.sides[0].opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

describe('area blows come fewer and harder (AREA_PACE)', () => {
  const area = (Object.keys(MONSTER_TYPES) as MonsterTypeId[]).filter(
    (id) => isAreaShape(MONSTER_TYPES[id].shape) && !MONSTER_TYPES[id].bossOnly,
  );

  it('there are types that slam, lob or nova, and each hits AREA_PACE times as hard as its shape says', () => {
    expect(area.length).toBeGreaterThan(5);
    for (const id of area) {
      const t = MONSTER_TYPES[id];
      expect(areaPace(spec(id)), id).toBe(AREA_PACE);
      // The hit of the type at this level, then its shape's share of it, then the pace.
      const plain =
        hitOf({ ...spec('warrior'), type: 'warrior' }) * t.dmgMult * (t.shape!.mult ?? 1);
      expect(hitOf(spec(id)) / plain, id).toBeCloseTo(AREA_PACE, 1);
    }
  });

  it('swings, lanes, arrows and a boss keep their pace', () => {
    for (const id of ['brute', 'arbalest', 'archer', 'warrior'] as MonsterTypeId[])
      expect(areaPace(spec(id)), id).toBe(1);
    expect(areaPace(spec('sentinel', 'boss'))).toBe(1);
  });

  it('a monster rests after an area blow: the same wind-up, then a pause as long as the blow', () => {
    const w = arena();
    w.sides[0].player.stunT = 1e9;
    const m: Actor = spawnMonster(
      w,
      spec('sentinel'),
      w.sides[0].player.x + 1.6,
      w.sides[0].player.y,
      0,
      0,
      'S',
    );
    m.state = 'chase';
    const starts: number[] = [];
    for (let i = 0; i < 60 * 14; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'use' && e.src === m.id) starts.push(w.tick);
      w.events.length = 0;
    }
    expect(starts.length).toBeGreaterThanOrEqual(3);
    const prof = m.mon!.profile(0);
    const gap = ((starts[1]! - starts[0]!) * DT) / prof.useTime;
    // One blow's length plus a rest of the same length: about twice the use time between two blows.
    expect(gap).toBeGreaterThan(AREA_PACE - 0.15);
    expect(gap).toBeLessThan(AREA_PACE + 0.4);
  });
});

describe('the character stops dodging after a while', () => {
  /** Keep a zone under the character's feet at all times: a room so full of blasts that there is always one to step out of. */
  function spam(w: World, seconds: number, check: (t: number) => void): void {
    for (let i = 0; i < Math.round(seconds / DT); i++) {
      const hasZone = w.effects.some((e) => e.kind === 'caustic' && e.t > 1);
      if (!hasZone) openZone(w, w.sides[0].player.x, w.sides[0].player.y, 1.2, 30, 'caustic', 0);
      for (const e of w.effects)
        if (e.kind === 'caustic') {
          e.x = w.sides[0].player.x;
          e.y = w.sides[0].player.y;
        }
      stepWorld(w);
      check(i * DT);
    }
  }

  it(`dodges for ${DODGE_MAX} s, then holds its ground for ${DODGE_REST} s, then dodges again`, () => {
    const w = arena();
    const seen: { t: number; rest: number; spent: number }[] = [];
    spam(w, 17, (t) =>
      seen.push({ t, rest: w.sides[0].ai.dodgeRest, spent: w.sides[0].ai.dodgeT }),
    );
    const at = (t: number) => seen.find((s) => s.t >= t)!;
    expect(at(5).rest).toBe(0);
    expect(at(DODGE_MAX - 0.5).rest).toBe(0);
    expect(at(DODGE_MAX + 0.5).rest).toBeGreaterThan(DODGE_REST - 1.2);
    expect(at(DODGE_MAX + DODGE_REST - 0.5).rest).toBeGreaterThan(0);
    // The rest is over some time after, and the character dodges again.
    expect(at(DODGE_MAX + DODGE_REST + 1).rest).toBeLessThanOrEqual(0);
    expect(at(DODGE_MAX + DODGE_REST + 1.5).spent).toBeGreaterThan(0.5);
  });
});
