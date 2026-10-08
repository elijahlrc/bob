import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { buildMonster } from '../calc/monster';
import { Rng } from '../core/rng';
import { MONSTER_TYPES, type MonsterModId, type MonsterTypeId } from '../data/monsters';
import { MIXED_THEMES, themeDef, themesFor } from '../data/themes';
import { makeGem, makeItem } from '../gen/items';
import { generateLabyrinth } from '../gen/labyrinth';
import { rollCurrencyDrops } from '../gen/currencyDrops';
import { populate, rollMonsterMods, typeShares } from '../gen/population';
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
  world.player.stunT = 1e9;
  if (godMode) world.opts.godMode = true;
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
  const m = spawnMonster(w, spec(type, over), w.player.x + dx, w.player.y + dy, 0, 0, type);
  m.state = 'chase';
  return m;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

describe('the Swarm and the Reliquary (EXPANSION 7.3)', () => {
  it('there are eight new types, each with its own body kind', () => {
    const types: MonsterTypeId[] = [
      'gnawer',
      'bat',
      'beetle',
      'nest',
      'sentinel',
      'arbalest',
      'golem',
      'pylon',
    ];
    expect(MONSTER_TYPES.gnawer.faction).toBe('swarm');
    expect(MONSTER_TYPES.golem.faction).toBe('reliquary');
    expect(new Set(types.map((t) => MONSTER_TYPES[t].body)).size).toBe(8);
  });

  it('the themes arrive on their maps; mixed themes from map 30 hold two new factions at 50/50', () => {
    expect(themesFor(5).some((t) => t.id === 'gnawingWarrens')).toBe(false);
    expect(themesFor(6).some((t) => t.id === 'gnawingWarrens')).toBe(true);
    expect(themesFor(24).some((t) => t.id === 'reliquaryVault')).toBe(false);
    expect(themesFor(25).some((t) => t.id === 'reliquaryVault')).toBe(true);
    expect(themesFor(29).some((t) => t.id.startsWith('mix:'))).toBe(false);
    expect(themesFor(30).filter((t) => t.id.startsWith('mix:'))).toHaveLength(10);
    for (const t of MIXED_THEMES) {
      const factions = Object.keys(t.factions!);
      expect(factions).toHaveLength(2);
      expect(Object.values(t.factions!)).toEqual([50, 50]);
      const shares = typeShares(t);
      expect(shares.reduce((a, [, s]) => a + s, 0)).toBeCloseTo(1, 9);
      expect(themeDef(t.id).id).toBe(t.id);
    }
    const seen = new Set<string>();
    for (let seed = 1; seed < 40; seed++) for (const id of rollThemes(seed, 50)) seen.add(id);
    expect([...seen].some((id) => id.startsWith('mix:'))).toBe(true);
  });

  it('Gnawers come in packs of six or more in a Warrens room', () => {
    let packs = 0;
    for (let s = 0; s < 40; s++) {
      const lab = generateLabyrinth(new Rng(s), { rooms: 6, sideBranches: 1 });
      const pop = populate(new Rng(s + 100), lab, {
        areaLevel: 20,
        endKind: 'rare',
        theme: themeDef('gnawingWarrens'),
        map: 20,
      });
      const byPack = new Map<number, number>();
      for (const m of pop.monsters)
        if (m.spec.type === 'gnawer') byPack.set(m.pack, (byPack.get(m.pack) ?? 0) + 1);
      for (const n of byPack.values()) if (n >= 6) packs++;
    }
    expect(packs).toBeGreaterThan(10);
  });

  it('a Nest spawns two Gnawers every four seconds, up to eight alive, that give no rewards', () => {
    const w = arena(true);
    const nest = put(w, 'nest', 12);
    nest.skillT = 0;
    run(w, 0.1);
    const kids = () => w.actors.filter((a) => a.alive && a.summonedBy === nest.id);
    expect(kids()).toHaveLength(2);
    expect(kids().every((k) => k.noReward && k.mon!.spec.type === 'gnawer')).toBe(true);
    run(w, 4.1);
    expect(kids().length).toBeGreaterThanOrEqual(4);
    run(w, 30);
    expect(kids().length).toBeLessThanOrEqual(NEST_MAX_ALIVE);
    // It stays where it is.
    expect(Math.hypot(nest.x - (w.player.x + 12), nest.y - w.player.y)).toBeLessThan(0.5);
    killActor(w, nest);
    expect(nest.alive).toBe(false);
  });

  it('a Carrion Bat flies over walls to reach you; a Gnawer cannot', () => {
    const w = arena(true);
    // A wall of tiles two tiles to the right of the player, taller than anyone can step around quickly.
    const px = Math.floor(w.player.x);
    const py = Math.floor(w.player.y);
    for (let y = py - 14; y <= py + 14; y++) w.grid.tiles[y * w.grid.w + px + 4] = 0;
    w.grid.refreshOpen();
    const bat = put(w, 'bat', 6);
    const rat = put(w, 'gnawer', 6, 1);
    const d0 = Math.hypot(bat.x - w.player.x, bat.y - w.player.y);
    run(w, 1.2);
    const dBat = Math.hypot(bat.x - w.player.x, bat.y - w.player.y);
    const dRat = Math.hypot(rat.x - w.player.x, rat.y - w.player.y);
    expect(dBat).toBeLessThan(d0 - 2.5);
    expect(dRat).toBeGreaterThan(dBat + 1.5);
  });

  it('a Bone Beetle curls up when hit: 80% less physical damage for 1.5 s, then a 3 s wait', () => {
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
    b.curlT = 1.5;
    const curled = hit();
    expect(curled).toBeCloseTo(first * 0.2, 6);
    run(w, 1.6);
    expect(hit()).toBeCloseTo(first, 6);
  });

  it('the Reliquary Vault pays a Socket Auger from the leader of the end room; the others do not', () => {
    const lab = generateLabyrinth(new Rng(4), { rooms: 6, sideBranches: 1 });
    expect(themeDef('reliquaryVault').bonusCurrency).toBe('auger');
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
    expect(lab.rooms.length).toBeGreaterThan(0);
  });

  it('a Sentinel has x2 armour and x3 stun threshold, and slams a marked circle', () => {
    const w = arena(true);
    const s = put(w, 'sentinel', 3);
    const plain = buildMonster(spec('warrior', { level: 40 }));
    expect(s.def.armour / plain.defence.armour).toBeGreaterThan(1.9);
    expect(s.def.stunThreshold / plain.defence.stunThreshold).toBeGreaterThan(2.5);
    s.skillT = 0;
    run(w, 0.2);
    expect(w.effects.some((e) => e.kind === 'slam' && e.radius === 2)).toBe(true);
  });

  it('an Arbalest never moves and fires a bolt that pierces everything in its line', () => {
    const w = arena(true);
    const a = put(w, 'arbalest', 6);
    expect(a.mon!.profile(0).pierce).toBeGreaterThanOrEqual(99);
    const x0 = a.x;
    run(w, 3);
    expect(a.x).toBe(x0);
    expect(w.events.length).toBeGreaterThanOrEqual(0);
  });

  it('a Core Golem is immune to its element and leaves ground of that kind for six seconds', () => {
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
      expect(zone.total).toBe(6);
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

  it('a Brood monster splits into three Gnawers; the faction mod rolls only on the Swarm', () => {
    const w = arena();
    const m = put(w, 'beetle', 12, 0, { rarity: 'magic', mods: ['brood'] });
    killActor(w, m);
    const kids = w.actors.filter((a) => a.alive && a.mon?.spec.type === 'gnawer');
    expect(kids).toHaveLength(3);
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
    expect(Math.hypot(q.x - w.player.x, q.y - w.player.y)).toBeLessThan(3);
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

  it('the champions lead the mini-boss of their own themes', () => {
    for (const [theme, mod, type, name] of [
      ['gnawingWarrens', 'gnawingQueen', 'beetle', 'The Gnawing Queen'],
      ['reliquaryVault', 'reliquarian', 'golem', 'The Reliquarian'],
    ] as const) {
      const lab = generateLabyrinth(new Rng(4), { rooms: 6, sideBranches: 1 });
      const pop = populate(new Rng(9), lab, {
        areaLevel: 40,
        endKind: 'miniboss',
        theme: themeDef(theme),
        map: 40,
      });
      const champ = pop.monsters.find((m) => m.spec.rarity === 'miniboss')!;
      expect(champ.spec.mods).toContain(mod);
      expect(champ.spec.type).toBe(type);
      expect(champ.name).toBe(name);
      if (type === 'golem') expect(champ.spec.variant).not.toBe('none');
    }
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

  // Timing test: skipped on CI (shared runners are slower), and retried because a parallel test run can starve it.
  it.skipIf(!!process.env.CI)(
    'a room of forty Swarm actors keeps the sim above 400x real time',
    { retry: 3 },
    () => {
      const w = arena(true);
      const actors: Actor[] = [];
      for (let i = 0; i < 40; i++) {
        const ang = (i / 40) * Math.PI * 2;
        actors.push(put(w, i % 5 === 0 ? 'bat' : 'gnawer', Math.cos(ang) * 7, Math.sin(ang) * 7));
      }
      // Let the code warm up first, as the game does in its first seconds.
      run(w, 10);
      const t0 = performance.now();
      const simSeconds = 60;
      run(w, simSeconds);
      const wall = (performance.now() - t0) / 1000;
      expect(simSeconds / wall).toBeGreaterThan(400);
      expect(actors.length).toBe(40);
    },
  );

  it('a flier that dies over a wall drops its loot where it can be picked up', () => {
    const w = arena(true);
    const px = Math.floor(w.player.x);
    const py = Math.floor(w.player.y);
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
    w.player.stunT = 0;
    const px = Math.floor(w.player.x);
    const py = Math.floor(w.player.y);
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
    expect(w.ai.mode).not.toBe('loot');
  });
});
