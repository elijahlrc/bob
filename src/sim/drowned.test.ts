import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { CURRENCIES, TABLET_SETS } from '../data/currency';
import { FACTION_NAMES, MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { THEMES, themesFor } from '../data/themes';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { applyDamage, hit } from './combat';
import { createDummyWorld } from './dummy';
import { pullPlayer } from './factions';
import { revealed } from './movement';
import { telegraphs } from './telegraph';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A level 40 character, frozen to the spot and deathless, in an open arena with no dummies. */
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

function put(
  w: World,
  type: MonsterTypeId,
  dx: number,
  dy = 0,
  over: Partial<MonsterSpec> = {},
): Actor {
  const spec: MonsterSpec = {
    type,
    variant: 'none',
    rarity: 'normal',
    level: 30,
    mods: [],
    ...over,
  };
  const m = spawnMonster(w, spec, w.player.x + dx, w.player.y + dy, 0, 0, type);
  m.state = 'chase';
  return m;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

describe('the Drowned as data (docs/ROSTER.md 7.2)', () => {
  it('is a faction with four types, a place in the offers, an essence and tablets', () => {
    expect(FACTION_NAMES.drowned).toBe('the Drowned');
    const types = Object.values(MONSTER_TYPES).filter((t) => t.faction === 'drowned');
    expect(types.map((t) => t.id).sort()).toEqual(['drowner', 'leech', 'tidecaller', 'wrack']);
    for (const t of types) expect(t.innate).toBe(true);
    expect(themesFor(19).some((t) => t.id === 'drownedVault')).toBe(false);
    expect(themesFor(20).some((t) => t.id === 'drownedVault')).toBe(true);
    expect(themesFor(24).some((t) => t.id === 'brineCistern')).toBe(true);
    for (const id of ['drownedVault', 'brineCistern'])
      expect(THEMES.find((t) => t.id === id)!.chief!.mod).toBe('tidewarden');
    expect(CURRENCIES.find((c) => c.faction === 'drowned')?.id).toBe('brineSalt');
    expect(TABLET_SETS.drowned.length).toBeGreaterThanOrEqual(2);
    // The mixed themes (from map 30) pair it with the others.
    expect(THEMES.some((t) => t.id.startsWith('mix:') && t.id.includes('drownedVault'))).toBe(true);
  });
});

describe('the Drowned in play', () => {
  it('a Tidecaller marks a lane, and drags the character it catches toward it', () => {
    const w = arena();
    const tc = put(w, 'tidecaller', 8);
    let lane = false;
    const d0 = Math.hypot(tc.x - w.player.x, tc.y - w.player.y);
    for (let i = 0; i < 6 * 60; i++) {
      stepWorld(w);
      if (telegraphs(w).some((t) => t.kind === 'lane')) lane = true;
    }
    expect(lane).toBe(true);
    // The hook landed: the character is nearer, and was staggered.
    expect(Math.hypot(tc.x - w.player.x, tc.y - w.player.y)).toBeLessThan(d0 - 1.5);
  });

  it('a pull never takes the character into the thing that pulls', () => {
    const w = arena();
    const tc = put(w, 'tidecaller', 2);
    pullPlayer(w, tc, 10);
    expect(Math.hypot(tc.x - w.player.x, tc.y - w.player.y)).toBeGreaterThan(tc.r + w.player.r);
    expect(w.player.stunT).toBeGreaterThan(0);
  });

  it("a Wrack's blows slow, and a Brine Leech drains what it bites", () => {
    const w = arena();
    const wrack = put(w, 'wrack', 1.2);
    hit(w, wrack, w.player, wrack.mon!.profile(0), 0, 1);
    expect(w.player.ail.chill).toBeGreaterThan(0);
    const leech = put(w, 'leech', 1.2);
    leech.life = leech.def.maxLife * 0.5;
    const before = leech.life;
    hit(w, leech, w.player, leech.mon!.profile(0), 0, 1);
    run(w, 0.5);
    expect(leech.life).toBeGreaterThan(before);
  });

  it('a Drowner dives out of sight, is untouchable under the floor, and comes up beside the character', () => {
    const w = arena();
    const d = put(w, 'drowner', 9);
    d.mv.burrowCd = 0;
    stepWorld(w);
    expect(d.burrowT).toBeGreaterThan(0);
    expect(d.phases).toBe(true);
    expect(revealed(w, d)).toBe(false);
    const life = d.life;
    applyDamage(w, d, [500, 0, 0, 0, 0]);
    expect(d.life).toBe(life);
    run(w, 3);
    expect(d.burrowT).toBe(0);
    expect(d.phases).toBe(false);
    expect(Math.hypot(d.x - w.player.x, d.y - w.player.y)).toBeLessThan(3);
    // Up again, it can be hurt.
    applyDamage(w, d, [50, 0, 0, 0, 0]);
    expect(d.life).toBeLessThan(life);
  });

  it('the Tidewarden hooks the character in every ten seconds, and calls Brine Leeches at half life', () => {
    const w = arena();
    const chief = put(w, 'wrack', 9, 0, { rarity: 'miniboss', mods: ['tidewarden'] });
    const d0 = Math.hypot(chief.x - w.player.x, chief.y - w.player.y);
    chief.raiserT = 0.05;
    run(w, 1);
    expect(Math.hypot(chief.x - w.player.x, chief.y - w.player.y)).toBeLessThan(d0 - 2);
    const leeches = () => w.actors.filter((a) => a.alive && a.mon?.spec.type === 'leech').length;
    expect(leeches()).toBe(0);
    chief.life = chief.def.maxLife * 0.4;
    run(w, 0.3);
    expect(leeches()).toBe(3);
  });
});
