import { layCorpses } from './gemKit';
import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { minionBody, minionUptime } from '../calc/minion';
import { MINIONS } from '../data/minions';
import { makeGem, makeItem } from '../gen/items';
import { WALL } from '../gen/labyrinth';
import { newRun } from '../run/run';
import { spawnMonster, stepWorld } from './world';
import { createDummyWorld } from './dummy';
import { summonMinions, type Minion } from './minions';
import type { Actor, World } from './types';

let n = 91000;
const uid = () => n++;

/** An arena with a mystic who has a spell and a zombie summon; the training dummy is out of the way. */
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
  dummy.alive = false;
  world.opts.freeResources = false;
  // Raise Husk uses up a corpse for each cast.
  layCorpses(world, world.player.x, world.player.y, 30);
  return world;
}

function summon(w: World): Minion[] {
  const c = w.char.utilities[0];
  expect(c.skill.utility?.kind).toBe('summon');
  summonMinions(w, c, w.char.profile(c, 0, 0));
  return w.minions;
}

function monsterAt(w: World, type: 'warrior' | 'archer', x: number, y: number): Actor {
  const m = spawnMonster(
    w,
    { type, variant: 'none', rarity: 'normal', level: 30, mods: [] },
    x,
    y,
    0,
    0,
    'Test Monster',
  );
  m.state = 'chase';
  return m;
}

function run(w: World, seconds: number, until?: () => boolean): void {
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(w);
    if (until?.()) return;
  }
}

describe('mortal minions', () => {
  it('a minion has life and defences from its kind and the map level, and the modifiers scale them', () => {
    const base = minionBody('zombie', 30, 1, 1);
    expect(base.life).toBeGreaterThan(100);
    expect(base.def.maxLife).toBe(base.life);
    expect(base.def.armour).toBeGreaterThan(0);
    expect(base.def.res[3]).toBe(MINIONS.zombie.res);
    expect(minionBody('zombie', 30, 2, 1).life).toBeCloseTo(base.life * 2, -1);
    expect(minionBody('zombie', 30, 1, 0.5).def.damageTakenMult).toBeCloseTo(0.5, 5);
    expect(minionBody('stoneGolem', 30, 1, 1).life).toBeGreaterThan(base.life);
    expect(minionBody('zombie', 60, 1, 1).life).toBeGreaterThan(base.life);
  });

  it('a summon makes its minions with life, on the player side and outside the monster list', () => {
    const w = arena();
    const ms = summon(w);
    expect(ms.length).toBeGreaterThan(1);
    for (const m of ms) {
      expect(m.life).toBe(m.def.maxLife);
      expect(m.faction).toBe(0);
      expect(w.actors.includes(m)).toBe(false);
    }
  });

  it('a monster blast catches minions and can kill them', () => {
    const w = arena();
    const [a, b] = summon(w);
    const far = w.minions[w.minions.length - 1];
    far.x = w.player.x + 12;
    w.player.life = w.player.def.maxLife;
    const half = a.def.maxLife / 2;
    for (const [m, dmg] of [
      [a, half],
      [b, a.def.maxLife * 20],
    ] as const) {
      w.effects.push({
        id: w.nextId++,
        x: m.x,
        y: m.y,
        radius: 0.5,
        t: 0.05,
        total: 0.05,
        kind: 'volatile',
        damage: dmg,
        dtype: 0,
        faction: 1,
      });
    }
    const before = w.minions.length;
    run(w, 0.5);
    expect(a.alive).toBe(true);
    expect(a.life).toBeLessThan(a.def.maxLife);
    expect(b.alive).toBe(false);
    expect(w.minions.includes(b)).toBe(false);
    expect(w.minions.length).toBe(before - 1);
    expect(far.life).toBe(far.def.maxLife);
  });

  it('a burning zone burns a minion standing in it', () => {
    const w = arena();
    const [a] = summon(w);
    w.effects.push({
      id: w.nextId++,
      x: a.x,
      y: a.y,
      radius: 2,
      t: 5,
      total: 5,
      kind: 'burning',
      damage: a.def.maxLife * 0.2,
      dtype: 3,
      faction: 1,
      acc: 0,
    });
    run(w, 2);
    expect(a.life).toBeLessThan(a.def.maxLife);
  });

  it('a monster goes for the player, not the minions beside it', () => {
    const w = arena();
    summon(w);
    const m = monsterAt(w, 'warrior', w.player.x + 1.4, w.player.y);
    for (const v of w.minions) {
      v.x = m.x + 0.2;
      v.y = m.y + 0.8;
      v.speed = 0;
    }
    run(w, 3, () => w.player.life < w.player.def.maxLife);
    expect(w.player.life).toBeLessThan(w.player.def.maxLife);
    expect(w.minions.every((v) => v.life === v.def.maxLife)).toBe(true);
  });

  it('a monster held up behind a minion in a corridor hits the minion', () => {
    const w = arena();
    const ms = summon(w);
    // A one-tile corridor leads from the player's spot to the east.
    const g = w.grid;
    for (let y = 1; y < g.h - 1; y++)
      for (let x = 10; x < g.w - 1; x++) if (y !== 15) g.tiles[y * g.w + x] = WALL;
    g.refreshOpen();
    const keep = ms[0];
    for (const v of ms) {
      if (v === keep) continue;
      v.alive = false;
    }
    keep.x = 11.5;
    keep.y = 15.5;
    keep.speed = 0;
    w.player.x = 8.5;
    w.player.y = 15.5;
    monsterAt(w, 'warrior', 14.5, 15.5);
    w.player.life = w.player.def.maxLife;
    run(w, 6, () => keep.life < keep.def.maxLife || !keep.alive);
    expect(keep.life < keep.def.maxLife || !keep.alive).toBe(true);
    expect(w.player.life).toBe(w.player.def.maxLife);
  });

  it('a ranged monster that cannot see the player walks on toward the player, not shooting the minion it can see', () => {
    const w = arena();
    const ms = summon(w);
    const g = w.grid;
    // A wall hides the player from the archer, with a way round it; the minion stands in the open on the archer's side.
    for (let y = 10; y <= 20; y++) g.tiles[y * g.w + 12] = WALL;
    g.refreshOpen();
    const keep = ms[0];
    for (const v of ms) if (v !== keep) v.alive = false;
    keep.speed = 0;
    keep.x = 16.5;
    keep.y = 15.5;
    w.player.x = 8.5;
    w.player.y = 15.5;
    const archer = monsterAt(w, 'archer', 20.5, 15.5);
    archer.state = 'chase';
    run(w, 1.2);
    expect(keep.life).toBe(keep.def.maxLife);
    expect(archer.x).toBeLessThan(20.5);
  });

  it('a ranged monster that is held up for long shoots the minion in its way', () => {
    const w = arena();
    const ms = summon(w);
    const g = w.grid;
    // The player is walled off entirely: the archer can get nowhere, so the minion it can see is its target.
    for (let y = 1; y < g.h - 1; y++) g.tiles[y * g.w + 12] = WALL;
    g.refreshOpen();
    const keep = ms[0];
    for (const v of ms) if (v !== keep) v.alive = false;
    keep.speed = 0;
    keep.x = 16.5;
    keep.y = 15.5;
    w.player.x = 8.5;
    w.player.y = 15.5;
    const archer = monsterAt(w, 'archer', 20.5, 15.5);
    archer.state = 'chase';
    run(w, 10, () => keep.life < keep.def.maxLife || !keep.alive);
    expect(keep.life < keep.def.maxLife || !keep.alive).toBe(true);
    expect(w.player.life).toBe(w.player.def.maxLife);
  });

  it('casting the summon again fills the places of the fallen and does not heal the rest', () => {
    const w = arena();
    const ms = [...summon(w)];
    const count = ms.length;
    ms[0].alive = false;
    ms[1].life = ms[1].def.maxLife / 3;
    const hurt = ms[1].life;
    // The fallen are cleared by the next tick.
    stepWorld(w);
    expect(w.minions.length).toBe(count - 1);
    summon(w);
    expect(w.minions.length).toBe(count);
    expect(ms[1].life).toBeGreaterThanOrEqual(hurt);
    expect(ms[1].life).toBeLessThan(ms[1].def.maxLife);
  });

  it("player attacks and effects do not hurt the player's own minions", () => {
    const w = arena();
    const [a] = summon(w);
    const m = monsterAt(w, 'warrior', a.x + 1.5, a.y);
    m.dummy = true;
    run(w, 5);
    expect(a.life).toBe(a.def.maxLife);
  });

  it('monsters cannot stand inside minions', () => {
    const w = arena();
    const ms = summon(w);
    const keep = ms[0];
    for (const v of ms) if (v !== keep) v.alive = false;
    keep.speed = 0;
    keep.x = 14.5;
    keep.y = 15.5;
    const m = monsterAt(w, 'warrior', 14.5, 15.7);
    stepWorld(w);
    const d = Math.hypot(m.x - keep.x, m.y - keep.y);
    expect(d).toBeGreaterThanOrEqual(keep.r + m.r - 0.02);
  });

  it('minion life and damage taken count in the calc: sturdier minions are worth more', () => {
    const w = arena();
    const plain = w.char.sheet().minionDps;
    expect(plain).toBeGreaterThan(0);
    expect(minionUptime('zombie', 30, 1, 1)).toBeGreaterThan(minionUptime('skeleton', 30, 1, 1));
    expect(minionUptime('zombie', 30, 1.5, 1)).toBeGreaterThan(minionUptime('zombie', 30, 1, 1));
    expect(minionUptime('zombie', 30, 1, 0.7)).toBeGreaterThan(minionUptime('zombie', 30, 1, 1));
    // A Hardy Pack in the sockets raises the sheet's minion damage a second through uptime and not through damage.
    const run = newRun('mystic', 1);
    const b = run.build;
    b.level = 30;
    b.equipment.mainHand = makeItem(uid, 'wand_3', 30, 1);
    delete b.equipment.offHand;
    const body = makeItem(uid, 'body_ar_1', 30, 3);
    body.sockets = ['flameBolt', 'raiseHusk', 'hardyPack'].map((g) => makeGem(uid, g));
    b.equipment.body = body;
    b.primaryGem = body.sockets[0]?.uid;
    const sturdy = new Character(b, { areaLevel: 30 }).sheet().minionDps;
    expect(sturdy).toBeGreaterThan(plain);
  });

  it('minions mend only when something gives them regeneration', () => {
    expect(minionBody('zombie', 30, 1, 1).def.lifeRegen).toBe(0);
    const mends = minionBody('zombie', 30, 1, 1, 1);
    expect(mends.def.lifeRegen).toBeCloseTo(mends.life * 0.01, 3);
    const w = arena();
    const [a] = summon(w);
    a.life = a.def.maxLife / 2;
    run(w, 5);
    expect(a.life).toBe(a.def.maxLife / 2);
  });
});
