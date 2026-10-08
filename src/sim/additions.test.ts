import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { typeShares } from '../gen/population';
import { themeDef } from '../data/themes';
import { newRun, planFor, worldOptsFor } from '../run/run';
import { abilitiesOf } from '../data/abilities';
import { hit, killActor } from './combat';
import { createDummyWorld } from './dummy';
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

describe('the additions to the factions (docs/ROSTER.md 7.1)', () => {
  it('a Gorger eats a body within reach and is healed by it', () => {
    const w = arena();
    const dead = put(w, 'warrior', 12, 3);
    killActor(w, dead);
    expect(w.corpses).toHaveLength(1);
    const g = put(w, 'gorger', 12, 1.5);
    g.life = g.def.maxLife * 0.4;
    run(w, 1.2);
    expect(w.corpses).toHaveLength(0);
    expect(g.life).toBeGreaterThan(g.def.maxLife * 0.6);
    // With nothing to eat it heals nothing.
    const before = g.life;
    run(w, 4);
    expect(g.life).toBeLessThanOrEqual(before + 1);
  });

  it('a Charnel Heap falls apart into three Bone Crawlers', () => {
    const w = arena();
    const heap = put(w, 'heap', 12);
    const crawlers = () => w.actors.filter((a) => a.alive && a.mon?.spec.type === 'crawler').length;
    expect(crawlers()).toBe(0);
    killActor(w, heap);
    expect(crawlers()).toBe(3);
  });

  it("a Bone Crawler's grip slows the character", () => {
    const w = arena();
    const c = put(w, 'crawler', 1.2);
    expect(w.player.ail.chill).toBe(0);
    hit(w, c, w.player, c.mon!.profile(0), 0, 1);
    expect(w.player.ail.chill).toBeGreaterThan(0);
    // A warrior's blow does not.
    const w2 = arena();
    const warrior = put(w2, 'warrior', 1.2);
    hit(w2, warrior, w2.player, warrior.mon!.profile(0), 0, 1);
    expect(w2.player.ail.chill).toBe(0);
  });

  it('a Lurking Coffer lies still as a chest until the character comes close, then bites', () => {
    const w = arena();
    const c = put(w, 'coffer', 8);
    // The world sets a monster with an ambush to lie in wait when it is made (world.ts); here it is made by hand.
    expect(abilitiesOf('coffer').some((a) => a.id === 'ambush')).toBe(true);
    c.hold = true;
    c.state = 'idle';
    run(w, 2);
    expect(c.state).toBe('idle');
    c.x = w.player.x + 3;
    c.y = w.player.y;
    run(w, 0.3);
    expect(c.state).toBe('chase');
  });

  it('what a Lurking Coffer drops is more than most', () => {
    const run1 = newRun('vanguard', 3);
    run1.build.level = 30;
    const plan = planFor(run1, run1.offers[0]);
    const opts = worldOptsFor(run1, plan);
    const w = arena();
    let coffer = 0;
    let warrior = 0;
    for (let i = 0; i < 400; i++) {
      coffer += opts.loot!(w, put(w, 'coffer', 12)).length;
      warrior += opts.loot!(w, put(w, 'warrior', 12)).length;
    }
    expect(coffer).toBeGreaterThan(warrior * 1.6);
  });

  it('a heavy type has a first level: the Heap is not met on the first maps, and the Crawler waits a little', () => {
    const theme = themeDef('ashenCrypt');
    const at = (level: number) => typeShares({ ...theme, level }).map(([id]) => id);
    expect(at(3)).not.toContain('heap');
    expect(at(3)).not.toContain('crawler');
    expect(at(5)).toContain('crawler');
    expect(at(5)).not.toContain('heap');
    expect(at(20)).toContain('heap');
    // Without a level every type counts (the threat model reads the whole roster).
    expect(typeShares(theme).map(([id]) => id)).toContain('heap');
  });

  it('a Tolling Bell hangs where it is and drives its allies on', () => {
    const w = arena();
    const bell = put(w, 'bell', 12);
    const ally = put(w, 'warrior', 13);
    const x0 = bell.x;
    let driven = false;
    for (let i = 0; i < 120; i++) {
      stepWorld(w);
      if (ally.buffT > 0) driven = true;
    }
    expect(bell.x).toBe(x0);
    expect(MONSTER_TYPES.bell.flies).toBe(true);
    expect(driven).toBe(true);
  });

  it('a Silkspinner lobs a web: a ground effect that slows', () => {
    const w = arena();
    put(w, 'spinner', 5);
    run(w, 3);
    const web = w.effects.find((e) => e.kind === 'chilling');
    expect(web).toBeDefined();
    expect(web!.radius).toBeCloseTo(1.7, 5);
  });

  it('a Hollow Watcher hexes from a distance and marks a lane', () => {
    const w = arena();
    const eye = put(w, 'watcher', 8);
    expect(eye.mon!.profile(0).skill.behaviour.kind).toBe('beam');
    let hexed = false;
    for (let i = 0; i < 12 * 60; i++) {
      stepWorld(w);
      if (w.player.hexes.length > 0) hexed = true;
    }
    expect(hexed).toBe(true);
  });
});
