import { describe, expect, it } from 'vitest';
import { emptyAilments, type HitResult } from '../calc/combat';
import type { MonsterSpec } from '../calc/monster';
import type { MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { applyDamage, applyHit } from './combat';
import { createDummyWorld } from './dummy';
import { noteDevoured } from './encounters';
import { damageMult, moveMult } from './factions';
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

const spec = (type: MonsterTypeId, level = 40): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level,
  mods: [],
});

function put(w: World, type: MonsterTypeId, dx: number, dy = 0): Actor {
  const m = spawnMonster(w, spec(type), w.player.x + dx, w.player.y + dy, 0, 0, type);
  m.state = 'chase';
  return m;
}

const steps = (w: World, n: number) => {
  for (let i = 0; i < n; i++) stepWorld(w);
};

/** Land a hit of exactly these damages (physical, lightning, cold, fire, chaos) from the character. */
function strike(w: World, dst: Actor, dmg: number[], src: Actor = w.player): void {
  const res: HitResult = {
    outcome: 'hit',
    crit: false,
    dmg: [...dmg],
    total: dmg.reduce((s, x) => s + x, 0),
    H: [...dmg],
    ailments: emptyAilments(),
    stun: 0,
  };
  applyHit(w, src, dst, w.char.profile(w.primary, 0), res);
}

/** A share of a monster's life, as physical damage. */
const share = (m: Actor, k: number) => [m.def.maxLife * k, 0, 0, 0, 0];

describe('windows and modes (docs/ENCOUNTERS.md 5 and 6)', () => {
  it('an Aegis stops four hits however small, then the fifth lands; the plates grow back when it is left alone', () => {
    const w = arena();
    const m = put(w, 'sentinel', 12);
    expect(m.enc!.plates).toBe(4);
    for (let i = 0; i < 4; i++) strike(w, m, [1, 0, 0, 0, 0]);
    expect(m.life).toBe(m.def.maxLife);
    strike(w, m, [1, 0, 0, 0, 0]);
    expect(m.life).toBeLessThan(m.def.maxLife);
    // Struck now and then, the plates stay down; left alone for five seconds, they come back.
    steps(w, 200);
    strike(w, m, [1, 0, 0, 0, 0]);
    steps(w, 200);
    expect(m.enc!.plates).toBe(0);
    steps(w, 140);
    expect(m.enc!.plates).toBe(4);
  });

  it('a stun breaks a guard: the plates fall and the monster takes half again as much', () => {
    const w = arena();
    const m = put(w, 'sentinel', 12);
    m.stunT = 0.5;
    steps(w, 1);
    expect(m.enc!.plates).toBe(0);
    expect(m.enc!.vulnT).toBeGreaterThan(0);
    const before = m.life;
    strike(w, m, [100, 0, 0, 0, 0]);
    // The damage is given after mitigation: 100 becomes 150.
    expect(before - m.life).toBeCloseTo(150, 0);
  });

  it('a Gloomstalker hurt for a quarter of its life fades out of reach, then comes back behind the character', () => {
    const w = arena();
    const m = put(w, 'gloomstalker', 6);
    strike(w, m, share(m, 0.3));
    expect(m.phaseT).toBeGreaterThan(0);
    const life = m.life;
    strike(w, m, share(m, 0.2));
    applyDamage(w, m, share(m, 0.1));
    expect(m.life).toBe(life);
    steps(w, 100);
    expect(m.phaseT).toBe(0);
    expect(Math.hypot(m.x - w.player.x, m.y - w.player.y)).toBeLessThan(2.5);
  });

  it('a Charnel Heap at 40% fuses to stone: hits do nothing, it mends, and a ring bursts when it ends', () => {
    const w = arena();
    const m = put(w, 'heap', 8);
    m.life = m.def.maxLife * 0.39;
    steps(w, 1);
    expect(m.enc!.stoneT).toBeGreaterThan(0);
    const life = m.life;
    strike(w, m, share(m, 0.2));
    expect(m.life).toBeGreaterThanOrEqual(life);
    expect(w.effects.some((e) => e.label === 'Shatter')).toBe(true);
    steps(w, 200);
    expect(m.enc!.stoneT).toBeLessThanOrEqual(0);
    expect(m.life).toBeGreaterThan(m.def.maxLife * 0.5);
  });

  it("a Core Golem's vent opens on a burst: it takes half again as much and casts a Cross", () => {
    const w = arena();
    const m = put(w, 'golem', 12);
    strike(w, m, share(m, 0.35));
    expect(m.enc!.ventT).toBeGreaterThan(0);
    expect(w.effects.filter((e) => e.label === 'Cross').length).toBeGreaterThan(0);
    const before = m.life;
    strike(w, m, [100, 0, 0, 0, 0]);
    expect(before - m.life).toBeCloseTo(150, 0);
  });

  it('cold quenches a Slag Brute for good: slower, and its physical hurt is greater', () => {
    const w = arena();
    const m = put(w, 'slagbrute', 12);
    const pace = moveMult(m);
    strike(w, m, [0, 0, m.def.maxLife * 0.22, 0, 0]);
    expect(moveMult(m)).toBeCloseTo(pace * 0.5, 5);
    const before = m.life;
    strike(w, m, [100, 0, 0, 0, 0]);
    expect(before - m.life).toBeCloseTo(130, 0);
  });

  it('fire feeds a Cinderling instead of hurting it', () => {
    const w = arena();
    const m = put(w, 'cinderling', 8);
    const dmg = damageMult(m);
    strike(w, m, [0, 0, 0, 50, 0]);
    expect(m.life).toBe(m.def.maxLife);
    expect(m.enc!.molten).toBe(1);
    expect(damageMult(m)).toBeGreaterThan(dmg);
  });

  it('six quick hits rile a Rend-boar into a charge', () => {
    const w = arena();
    const m = put(w, 'boar', 6);
    for (let i = 0; i < 6; i++) strike(w, m, [1, 0, 0, 0, 0]);
    expect(m.windT).toBeGreaterThan(0);
  });

  it('a Hag at 30% chants over the bodies round it; a stun stops the chant and its bursts', () => {
    const w = arena();
    const m = put(w, 'hag', 8);
    for (let i = 0; i < 3; i++)
      w.corpses.push({
        id: 9000 + i,
        x: m.x + i * 0.5,
        y: m.y + 1,
        age: 0,
        spec: spec('warrior'),
        room: 0,
        pack: 0,
        name: 'w',
        life: 10,
      });
    m.life = m.def.maxLife * 0.29;
    steps(w, 1);
    expect(m.enc!.ritesT).toBeGreaterThan(0);
    expect(w.effects.filter((e) => e.label === 'Last rites').length).toBe(3);
    m.stunT = 0.5;
    steps(w, 1);
    expect(w.effects.some((e) => e.label === 'Last rites')).toBe(false);
  });

  it('a Wailer keens at once when an ally dies near it', () => {
    const w = arena();
    const m = put(w, 'wailer', 5);
    m.enc!.sideT = 9;
    const ally = put(w, 'warrior', 5, 1);
    applyDamage(w, ally, share(ally, 2));
    expect(ally.alive).toBe(false);
    expect(m.enc!.sideT).toBe(0);
  });

  it('a Gorger that has eaten is slower, and bursts in a cloud if it dies swollen', () => {
    const w = arena();
    const m = put(w, 'gorger', 12);
    const pace = moveMult(m);
    noteDevoured(w, m);
    expect(moveMult(m)).toBeLessThan(pace);
    applyDamage(w, m, share(m, 2));
    expect(w.effects.some((e) => e.kind === 'caustic')).toBe(true);
  });

  it("a Counter-stance answers the character's melee blow", () => {
    const w = arena();
    const m = put(w, 'guard', 1.6);
    m.enc!.openT = 1;
    const before = w.dmgLog.length;
    strike(w, m, [1, 0, 0, 0, 0]);
    expect(w.dmgLog.slice(before).some((l) => l.name === 'Counter-stance')).toBe(true);
  });

  it("a Sanctuary shelters the Choirmaster's allies, not the Choirmaster, until a stun silences it", () => {
    const w = arena();
    const c = put(w, 'choirmaster', 6);
    const ally = put(w, 'censer', 6, 1.5);
    c.enc!.winT = 0;
    for (let i = 0; i < 300 && c.enc!.openT <= 0; i++) stepWorld(w);
    expect(c.enc!.openT).toBeGreaterThan(0);
    strike(w, ally, [50, 0, 0, 0, 0]);
    expect(ally.life).toBe(ally.def.maxLife);
    // The Choirmaster itself is not sheltered (its energy shield takes the first of it).
    const pool = c.life + c.es;
    strike(w, c, [50, 0, 0, 0, 0]);
    expect(c.life + c.es).toBeLessThan(pool);
    c.stunT = 0.5;
    steps(w, 1);
    strike(w, ally, [50, 0, 0, 0, 0]);
    expect(ally.life).toBeLessThan(ally.def.maxLife);
  });

  it('an Adaptive monster resists the element that hurt it most', () => {
    const w = arena();
    const m = spawnMonster(
      w,
      { ...spec('warrior'), rarity: 'rare', mods: ['adaptive'] },
      w.player.x + 8,
      w.player.y,
      0,
      0,
      'a',
    );
    strike(w, m, [0, 0, 0, m.def.maxLife * 0.3, 0]);
    expect(m.resShift[3]).toBe(50);
    expect(m.resShiftT).toBeGreaterThan(0);
  });
});
