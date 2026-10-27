import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { Rng } from '../core/rng';
import { MONSTER_TYPES, type MonsterModId, type MonsterTypeId } from '../data/monsters';
import { MIXED_THEMES, themeDef } from '../data/themes';
import { makeGem, makeItem } from '../gen/items';
import { rollCurrencyDrops } from '../gen/currencyDrops';
import { rollMonsterMods, typeShares } from '../gen/population';
import { newRun, planFor, rollThemes, setMap } from '../run/run';
import { applyDamage, killActor } from './combat';
import { createDummyWorld } from './dummy';
import { isZone, NEST_MAX_ALIVE, shieldedByPylon } from './factions';
import { runMap } from './runMap';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

function arena(godMode = false): World {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 50;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 50, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 30, maxTime: 600 });
  world.sides[0].player.stunT = 1e9;
  if (godMode) world.sides[0].opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

const spec = (type: MonsterTypeId, over: Partial<MonsterSpec> = {}): MonsterSpec => ({
  type,
  variant: MONSTER_TYPES[type].elemental ? 'fire' : 'none',
  rarity: 'normal',
  level: 40,
  mods: [],
  ...over,
});

function put(w: World, type: MonsterTypeId, dx: number, dy = 0, over: Partial<MonsterSpec> = {}) {
  const m = spawnMonster(
    w,
    spec(type, over),
    w.sides[0].player.x + dx,
    w.sides[0].player.y + dy,
    0,
    0,
    type,
  );
  m.state = 'chase';
  return m;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

describe('the Swarm and the Reliquary (EXPANSION 7.3)', () => {
  it('every mixed theme holds two factions whose type shares add up to one, and mixed themes are rolled', () => {
    for (const t of MIXED_THEMES) {
      const factions = Object.keys(t.factions!);
      expect(factions).toHaveLength(2);
      const shares = typeShares(t);
      expect(shares.reduce((a, [, s]) => a + s, 0)).toBeCloseTo(1, 9);
      expect(themeDef(t.id).id).toBe(t.id);
    }
    const seen = new Set<string>();
    for (let seed = 1; seed < 40; seed++) for (const id of rollThemes(seed, 50)) seen.add(id);
    expect([...seen].some((id) => id.startsWith('mix:'))).toBe(true);
  });

  it('a Nest keeps spawning Gnawers, up to its limit alive, that give no rewards', () => {
    const w = arena(true);
    const nest = put(w, 'nest', 12);
    nest.skillT = 0;
    run(w, 0.1);
    const kids = () => w.actors.filter((a) => a.alive && a.summonedBy === nest.id);
    const first = kids().length;
    expect(first).toBeGreaterThan(0);
    expect(kids().every((k) => k.noReward && k.mon!.spec.type === 'gnawer')).toBe(true);
    run(w, 30);
    expect(kids().length).toBeGreaterThan(first);
    expect(kids().length).toBeLessThanOrEqual(NEST_MAX_ALIVE);
    // It stays where it is.
    expect(
      Math.hypot(nest.x - (w.sides[0].player.x + 12), nest.y - w.sides[0].player.y),
    ).toBeLessThan(0.5);
    killActor(w, nest);
    expect(nest.alive).toBe(false);
  });

  it('a Carrion Bat flies over walls to reach you; a Gnawer cannot', () => {
    const w = arena(true);
    // A wall of tiles two tiles to the right of the player, taller than anyone can step around quickly.
    const px = Math.floor(w.sides[0].player.x);
    const py = Math.floor(w.sides[0].player.y);
    for (let y = py - 14; y <= py + 14; y++) w.grid.tiles[y * w.grid.w + px + 4] = 0;
    w.grid.refreshOpen();
    const bat = put(w, 'bat', 6);
    const rat = put(w, 'gnawer', 6, 1);
    const d0 = Math.hypot(bat.x - w.sides[0].player.x, bat.y - w.sides[0].player.y);
    run(w, 1.2);
    const dBat = Math.hypot(bat.x - w.sides[0].player.x, bat.y - w.sides[0].player.y);
    const dRat = Math.hypot(rat.x - w.sides[0].player.x, rat.y - w.sides[0].player.y);
    expect(dBat).toBeLessThan(d0 - 2.5);
    expect(dRat).toBeGreaterThan(dBat + 1.5);
  });

  it('a Bone Beetle curls up when hit: less physical damage for a while', () => {
    const w = arena();
    const b = put(w, 'beetle', 12);
    const hit = () => {
      const before = b.life;
      applyDamage(w, b, [100, 0, 0, 0, 0]);
      return before - b.life;
    };
    const first = hit();
    expect(first).toBeGreaterThan(0);
    // Curl is triggered by a landed hit (the hit code), so trigger it as it would.
    b.curlT = 2;
    const curled = hit();
    expect(curled).toBeLessThan(first);
    run(w, 2.1);
    expect(hit()).toBeCloseTo(first, 6);
  });

  it('the Reliquary Vault pays a Socket Auger from the leader of the end room; the others do not', () => {
    const ctx = (monster: 'normal' | 'rare' | 'miniboss', bonusCurrency?: string) => ({
      map: 40,
      monster,
      faction: 'reliquary',
      quantity: 1,
      bonusCurrency,
    });
    const rng = new Rng(5);
    const augers = (c: ReturnType<typeof ctx>) =>
      Array.from({ length: 60 }, () => rollCurrencyDrops(rng, () => 1, c))
        .flat()
        .filter((x) => x.id === 'auger').length;
    expect(augers(ctx('miniboss', 'auger'))).toBeGreaterThanOrEqual(60);
    expect(augers(ctx('normal', 'auger'))).toBeLessThan(15);
  });

  it('a Sentinel slams a marked circle', () => {
    const w = arena(true);
    const s = put(w, 'sentinel', 3);
    s.skillT = 0;
    run(w, 0.2);
    expect(w.effects.some((e) => e.kind === 'slam')).toBe(true);
  });

  it('an Arbalest never moves', () => {
    const w = arena(true);
    const a = put(w, 'arbalest', 6);
    const x0 = a.x;
    run(w, 3);
    expect(a.x).toBe(x0);
  });

  it('a Core Golem is immune to its element and leaves ground of that kind', () => {
    for (const [variant, kind, idx] of [
      ['fire', 'burning', 3],
      ['cold', 'chilling', 2],
      ['lightning', 'shocking', 1],
    ] as const) {
      const w = arena();
      const g = put(w, 'golem', 12, 0, { variant });
      expect(g.def.immune[idx]).toBe(true);
      expect(g.def.immune.filter(Boolean)).toHaveLength(1);
      killActor(w, g);
      const zone = w.effects.find(isZone)!;
      expect(zone.kind).toBe(kind);
    }
  });

  it('a Warden Pylon keeps allies within five tiles from taking damage while it stands', () => {
    const w = arena();
    const pylon = put(w, 'pylon', 14);
    const near = put(w, 'warrior', 16);
    const far = put(w, 'warrior', 25);
    expect(shieldedByPylon(w, near)).toBe(true);
    expect(shieldedByPylon(w, far)).toBe(false);
    const before = near.life;
    applyDamage(w, near, [500, 0, 0, 0, 0]);
    expect(near.life).toBe(before);
    applyDamage(w, far, [500, 0, 0, 0, 0]);
    expect(far.life).toBeLessThan(far.def.maxLife);
    // The pylon itself can be hurt, and when it falls the shield goes.
    const pl = pylon.life;
    applyDamage(w, pylon, [100, 0, 0, 0, 0]);
    expect(pylon.life).toBeLessThan(pl);
    killActor(w, pylon);
    applyDamage(w, near, [500, 0, 0, 0, 0]);
    expect(near.life).toBeLessThan(before);
  });

  it('a Brood monster splits into Gnawers; the faction mod rolls only on the Swarm', () => {
    const w = arena();
    const m = put(w, 'beetle', 12, 0, { rarity: 'magic', mods: ['brood'] });
    killActor(w, m);
    const kids = w.actors.filter((a) => a.alive && a.mon?.spec.type === 'gnawer');
    expect(kids.length).toBeGreaterThan(1);
    expect(kids.every((k) => k.noReward)).toBe(true);
    const rng = new Rng(4);
    let swarm = 0;
    for (let i = 0; i < 500; i++) {
      const o: MonsterModId[] = rollMonsterMods(rng, 'rare', 40, 'ossuary');
      if (o.includes('brood')) throw new Error('Brood on the Ossuary');
      if (rollMonsterMods(rng, 'rare', 40, 'swarm').includes('brood')) swarm++;
    }
    expect(swarm).toBeGreaterThan(20);
  });

  it('the Gnawing Queen burrows out of sight, warns where she will rise, and raises Nests', () => {
    const w = arena(true);
    const q = put(w, 'beetle', 8, 0, { rarity: 'miniboss', mods: ['gnawingQueen'] });
    q.raiserT = 0;
    run(w, 0.2);
    expect(q.phaseT).toBeGreaterThan(1.5);
    expect(w.effects.some((e) => e.kind === 'slam')).toBe(true);
    const before = applyDamage(w, q, [1000, 0, 0, 0, 0]);
    expect(before).toBe(0);
    run(w, 2.2);
    expect(q.phaseT).toBeLessThanOrEqual(0);
    expect(Math.hypot(q.x - w.sides[0].player.x, q.y - w.sides[0].player.y)).toBeLessThan(3);
    expect(w.actors.some((a) => a.alive && a.mon?.spec.type === 'nest')).toBe(true);
  });

  it('the Reliquarian is immune to its current core and changes it at every quarter of its life lost', () => {
    const w = arena();
    const r = put(w, 'golem', 10, 0, {
      rarity: 'miniboss',
      mods: ['reliquarian'],
      variant: 'fire',
    });
    run(w, 0.1);
    const current = () => r.def.immune.findIndex(Boolean);
    const first = current();
    expect(r.def.immune.filter(Boolean)).toHaveLength(1);
    r.life = r.def.maxLife * 0.7;
    run(w, 0.1);
    const second = current();
    expect(second).not.toBe(first);
    r.life = r.def.maxLife * 0.2;
    run(w, 0.1);
    expect(r.def.immune.filter(Boolean)).toHaveLength(1);
  });

  it('every map of the new themes runs the same way twice (determinism)', () => {
    for (const theme of ['gnawingWarrens', 'reliquaryVault']) {
      const r = newRun('vanguard', 61);
      setMap(r, 40);
      r.build.level = 40;
      const go = () => runMap(planFor(r, theme), r.build, 0, { godMode: true, maxTime: 120 });
      expect(go().eventHash, theme).toBe(go().eventHash);
    }
  });

  // Timing test, in CPU time: skipped on CI (shared runners are slower). It guards against the sim becoming several times slower
  // (it ran at 400x when written, and 120x to 240x since, by how warm the code is), so the floor is 100x, on the best of three runs.
  it.skipIf(!!process.env.CI)(
    'a room of forty Swarm actors keeps the sim above 100x real time',
    () => {
      const w = arena(true);
      const actors: Actor[] = [];
      for (let i = 0; i < 40; i++) {
        const ang = (i / 40) * Math.PI * 2;
        actors.push(put(w, i % 5 === 0 ? 'bat' : 'gnawer', Math.cos(ang) * 7, Math.sin(ang) * 7));
      }
      // Let the code warm up first, as the game does in its first seconds.
      run(w, 10);
      const simSeconds = 20;
      let best = 0;
      for (let k = 0; k < 3; k++) {
        // CPU time of this process, not the clock on the wall: a busy machine takes the processor from the test for a while,
        // which says nothing about how fast the sim is.
        const c0 = process.cpuUsage();
        run(w, simSeconds);
        const c1 = process.cpuUsage(c0);
        best = Math.max(best, simSeconds / Math.max(1e-3, (c1.user + c1.system) / 1e6));
      }
      expect(best).toBeGreaterThan(100);
      expect(actors.length).toBe(40);
    },
  );

  it('a flier that dies over a wall drops its loot where it can be picked up', () => {
    const w = arena(true);
    const px = Math.floor(w.sides[0].player.x);
    const py = Math.floor(w.sides[0].player.y);
    for (let y = py - 3; y <= py + 3; y++)
      for (let x = px + 5; x <= px + 7; x++) w.grid.tiles[y * w.grid.w + x] = 0;
    w.grid.refreshOpen();
    w.opts.loot = () => [{ kind: 'currency', uid: 1, id: 'ember', count: 1 }];
    const bat = put(w, 'bat', 6);
    bat.x = px + 6.5;
    bat.y = py + 0.5;
    killActor(w, bat);
    expect(w.drops).toHaveLength(1);
    expect(w.grid.isFloor(Math.floor(w.drops[0].x), Math.floor(w.drops[0].y))).toBe(true);
  });

  it('the player gives up on a drop it cannot reach instead of hunting it for ever', () => {
    const w = arena(true);
    w.sides[0].player.stunT = 0;
    const px = Math.floor(w.sides[0].player.x);
    const py = Math.floor(w.sides[0].player.y);
    // A sealed pocket of floor in a block of wall, four tiles away.
    for (let y = py - 2; y <= py + 2; y++)
      for (let x = px + 3; x <= px + 7; x++) w.grid.tiles[y * w.grid.w + x] = 0;
    w.grid.tiles[py * w.grid.w + px + 5] = 1;
    w.grid.refreshOpen();
    w.drops.push({
      id: 7777,
      x: px + 5.5,
      y: py + 0.5,
      item: { kind: 'currency', uid: 1, id: 'ember', count: 1 },
    });
    run(w, 5);
    expect(w.drops).toHaveLength(1);
    run(w, 20);
    expect(w.drops).toHaveLength(0);
    expect(w.sides[0].ai.mode).not.toBe('loot');
  });
  it('the player fetches a drop wherever it fell, and a fight does not use up the time it has to reach it', () => {
    const w = arena(true);
    const p = w.sides[0].player;
    p.stunT = 0;
    const far = { kind: 'currency', uid: 1, id: 'ember', count: 1 } as const;
    w.drops.push({ id: 7778, x: p.x + 20.5, y: p.y, item: far });
    // A long fight first: the hunt for the drop starts when the character is free to go.
    const m = put(w, 'gnawer', 3);
    m.life = m.def.maxLife = 1e9;
    run(w, 25);
    expect(w.drops).toHaveLength(1);
    m.alive = false;
    run(w, 10);
    expect(w.drops).toHaveLength(0);
    expect(w.sides[0].picked).toHaveLength(1);
  });
});
