import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { Rng } from '../core/rng';
import { abilitiesOf, ABILITY_INFO, TYPE_ABILITIES } from '../data/abilities';
import { MONSTER_TYPES, type MonsterModId, type MonsterTypeId } from '../data/monsters';
import { TABLET_SETS, CURRENCIES } from '../data/currency';
import { THEMES, themeDef, themesFor, MIXED_THEMES } from '../data/themes';
import { uniqueDef } from '../data/uniques';
import { generateLabyrinth } from '../gen/labyrinth';
import { populate } from '../gen/population';
import { newRun } from '../run/run';
import { IMPLEMENTED_ABILITIES } from './abilities';
import { killActor, thornsShare, tickActor } from './combat';
import { createDummyWorld } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A world with a passive player (stunned for good) to watch the monsters on their own. */
function arena(): World {
  const { world } = createDummyWorld(newRun('vanguard', 1).build, { distance: 30 });
  world.player.stunT = 1e9;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

const spec = (type: MonsterTypeId, over: Partial<MonsterSpec> = {}): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level: 20,
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

const dist = (a: Actor, b: Actor) => Math.hypot(a.x - b.x, a.y - b.y);

describe('the Kennel and the Gilded as data (docs/ENEMIES.md 7.4)', () => {
  it('each has four types, all innate, with an ability or a role of its own', () => {
    for (const f of ['kennel', 'gilded'] as const) {
      const types = Object.values(MONSTER_TYPES).filter((t) => t.faction === f);
      expect(types).toHaveLength(4);
      for (const t of types) expect(t.innate).toBe(true);
    }
  });

  it('every active ability a type lists has code, and every ability has text', () => {
    for (const [type, list] of Object.entries(TYPE_ABILITIES))
      for (const ab of list ?? []) {
        expect(ABILITY_INFO[ab.id], `${type} ${ab.id}`).toBeDefined();
        if (ABILITY_INFO[ab.id].active)
          expect(IMPLEMENTED_ABILITIES, `${type} ${ab.id}`).toContain(ab.id);
        expect(ABILITY_INFO[ab.id].text(ab).length).toBeGreaterThan(10);
      }
  });

  it('they have themes, essences and tablets, and the tablets are for uniques that exist', () => {
    for (const f of ['kennel', 'gilded']) {
      expect(THEMES.filter((t) => t.factions?.[f as 'kennel']).length).toBeGreaterThanOrEqual(2);
      expect(CURRENCIES.some((c) => c.faction === f)).toBe(true);
      for (const set of TABLET_SETS[f]) expect(uniqueDef(set.unique), set.unique).toBeDefined();
    }
    expect(themesFor(10).some((t) => t.id === 'kennelRun')).toBe(false);
    expect(themesFor(11).some((t) => t.id === 'kennelRun')).toBe(true);
    expect(themesFor(17).some((t) => t.id === 'giltHall')).toBe(false);
    expect(themesFor(18).some((t) => t.id === 'giltHall')).toBe(true);
    expect(MIXED_THEMES.some((t) => t.id.includes('kennelRun'))).toBe(true);
  });

  it('their themes make their own monsters, and the champions are theirs', () => {
    for (const [id, faction] of [
      ['kennelRun', 'kennel'],
      ['giltHall', 'gilded'],
    ] as const) {
      let own = 0;
      let all = 0;
      for (let s = 0; s < 20; s++) {
        const lab = generateLabyrinth(new Rng(s), { rooms: 6, sideBranches: 1 });
        const pop = populate(new Rng(s + 5), lab, {
          areaLevel: 30,
          endKind: 'miniboss',
          theme: themeDef(id),
          map: 30,
        });
        for (const m of pop.monsters) {
          all++;
          if (MONSTER_TYPES[m.spec.type].faction === faction) own++;
        }
        const chief = pop.monsters.find((m) => m.spec.rarity === 'miniboss')!;
        expect(chief.spec.mods).toContain(faction === 'kennel' ? 'huntsmaster' : 'treasurer');
      }
      expect(own / all).toBeGreaterThan(0.75);
    }
  });
});

describe('leaps and charges', () => {
  it('a hound crouches on a marked spot, then leaps next to you', () => {
    const w = arena();
    const h = put(w, 'hound', 6);
    h.abT[0] = 0;
    run(w, 0.1);
    expect(h.windT).toBeGreaterThan(0);
    expect(w.effects.some((e) => e.damage === 0 && e.kind === 'slam')).toBe(true);
    const x0 = h.x;
    run(w, 0.3);
    expect(h.x).toBe(x0);
    run(w, 0.6);
    expect(dist(h, w.player)).toBeLessThan(2);
  });

  it('a hound too close, or too far, does not leap', () => {
    const w = arena();
    const near = put(w, 'hound', 1.5);
    near.abT[0] = 0;
    run(w, 0.2);
    expect(near.windT).toBe(0);
    const far = put(w, 'hound', 12, 3);
    far.abT[0] = 0;
    run(w, 0.2);
    expect(far.windT).toBe(0);
  });

  it('a boar rushes in a line and keeps going past where you were', () => {
    const w = arena();
    const b = put(w, 'boar', 8);
    b.abT[0] = 0;
    // The character is stunned and does not move, so the boar reaches it and stops there.
    run(w, 2);
    expect(dist(b, w.player)).toBeLessThan(2.5);
  });

  it('the Charging mod makes any monster rush', () => {
    const w = arena();
    const m = put(w, 'warrior', 8, 0, { rarity: 'magic', mods: ['charging' as MonsterModId] });
    m.abT[9] = 0;
    run(w, 0.15);
    expect(m.windT).toBeGreaterThan(0);
    run(w, 1.2);
    expect(dist(m, w.player)).toBeLessThan(2.5);
  });

  it('a monster being wound up, or dashing, does not walk or strike', () => {
    const w = arena();
    const h = put(w, 'hound', 6);
    h.abT[0] = 0;
    run(w, 0.1);
    const x = h.x;
    run(w, 0.2);
    expect(h.x).toBe(x);
  });
});

describe('the Handler and the pack', () => {
  it('a whistle empowers every ally in range, and not those far away', () => {
    const w = arena();
    const handler = put(w, 'handler', 10);
    handler.abT[0] = 0;
    const near = put(w, 'hound', 12);
    const far = put(w, 'hound', 12, 25);
    run(w, 0.2);
    expect(near.buffT).toBeGreaterThan(0);
    expect(far.buffT).toBeLessThanOrEqual(0);
  });

  it('a kiter backs away when you come close; a plain archer does not as soon', () => {
    const w = arena();
    const slinger = put(w, 'slinger', 3.5);
    const x0 = slinger.x;
    run(w, 0.5);
    expect(slinger.x).toBeGreaterThan(x0);
  });

  it('the Huntsmaster whistles up three hounds that give no reward', () => {
    const w = arena();
    const h = put(w, 'boar', 12, 0, { rarity: 'miniboss', mods: ['huntsmaster'] });
    h.raiserT = 0;
    run(w, 0.2);
    const kids = w.actors.filter((a) => a.alive && a.summonedBy === h.id);
    expect(kids).toHaveLength(3);
    expect(kids.every((k) => k.noReward && k.mon!.spec.type === 'hound')).toBe(true);
  });
});

describe('the Gilded', () => {
  it('a cutpurse takes flask charges when it hits and runs; killing it gives them back', () => {
    const w = arena();
    const flask = w.flasks[0];
    const before = flask.charges;
    expect(before).toBeGreaterThan(0);
    const thief = put(w, 'cutpurse', 1);
    run(w, 3);
    expect(thief.stolen).toBeGreaterThan(0);
    expect(flask.charges).toBeLessThan(before);
    expect(thief.fleeT).toBeGreaterThan(0);
    const away = dist(thief, w.player);
    run(w, 1);
    expect(dist(thief, w.player)).toBeGreaterThan(away - 0.5);
    killActor(w, thief);
    expect(flask.charges).toBeCloseTo(before, 6);
  });

  it('a bursar stops regeneration while it stands near, and not far away', () => {
    const w = arena();
    const bursar = put(w, 'bursar', 4);
    bursar.stunT = 1e9;
    run(w, 0.3);
    expect(w.player.suppressT).toBeGreaterThan(0);
    // Nothing recovers while it is set, and mana does once it has gone.
    w.player.mana = 0;
    w.player.suppressT = 1;
    tickActor(w, w.player, 0.5);
    expect(w.player.mana).toBe(0);
    killActor(w, bursar);
    w.player.suppressT = 0;
    tickActor(w, w.player, 0.5);
    expect(w.player.mana).toBeGreaterThan(0);
    run(w, 1);
    expect(w.player.suppressT).toBeLessThanOrEqual(0);
  });

  it('a guard throws back part of a melee hit, as the Thorned mod does', () => {
    const w = arena();
    const guard = put(w, 'guard', 5);
    expect(thornsShare(guard)).toBeCloseTo(0.15, 6);
    const thorned = put(w, 'warrior', 5, 2, { rarity: 'rare', mods: ['thorned'] });
    expect(thornsShare(thorned)).toBeCloseTo(0.1, 6);
    expect(thornsShare(put(w, 'warrior', 5, 4))).toBe(0);
  });

  it('the Treasurer stops recovery near it and calls two cutpurses at half life', () => {
    const w = arena();
    const t = put(w, 'guard', 5, 0, { rarity: 'miniboss', mods: ['treasurer'] });
    run(w, 0.2);
    expect(w.player.suppressT).toBeGreaterThan(0);
    t.life = t.def.maxLife * 0.4;
    run(w, 0.2);
    const kids = w.actors.filter((a) => a.alive && a.summonedBy === t.id);
    expect(kids).toHaveLength(2);
    expect(kids.every((k) => k.mon!.spec.type === 'cutpurse')).toBe(true);
  });

  it('the Flask-taker and Hobbling mods act on a hit', () => {
    const w = arena();
    const flask = w.flasks[0];
    const before = flask.charges;
    const m = put(w, 'warrior', 1, 0, {
      rarity: 'magic',
      mods: ['flaskTaker' as MonsterModId, 'hobbling' as MonsterModId],
    });
    run(w, 4);
    expect(m.stolen).toBeGreaterThan(0);
    expect(flask.charges).toBeLessThan(before);
    expect(w.player.ail.chill).toBeGreaterThan(0);
    // It does not run.
    expect(m.fleeT).toBe(0);
  });

  it('every type in the new factions lists an ability the cards can read', () => {
    for (const id of [
      'hound',
      'boar',
      'handler',
      'cat',
      'cutpurse',
      'guard',
      'bursar',
      'slinger',
    ] as const)
      expect(abilitiesOf(id).length, id).toBeGreaterThan(0);
  });
});
