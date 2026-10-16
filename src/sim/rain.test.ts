import { describe, expect, it } from 'vitest';
import { Character, volleyHits } from '../calc/character';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import type { World } from './types';
import { stepWorld } from './world';

/** Extra arrows on a rain of arrows, and supports that cannot act on a skill (docs/SUPPORTS-PLAN.md). */

function holding(main: string, gems: string[], cls = 'strider'): Build {
  const run = newRun(cls, 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 50;
  const weapon = makeItem(uid, main, 50, gems.length);
  weapon.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

/** Uses of the primary skill, hits on the dummy and the most places a zone of the skill burst in, over `seconds`. */
function tally(w: World, targetId: number, seconds: number, skill: string) {
  let uses = 0;
  let hits = 0;
  let spots = 0;
  let explosions = 0;
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(w);
    for (const z of w.zones) spots = Math.max(spots, z.spots?.length ?? 1);
    for (const e of w.events) {
      if (e.t === 'use' && e.src === w.player.id && e.skill === skill) uses++;
      if (e.t === 'hit' && e.src === w.player.id && e.dst === targetId) hits++;
      if (e.t === 'explode') explosions++;
    }
  }
  return { uses, hits, spots, explosions };
}

function sheetOf(gems: string[], main = 'bow_3') {
  const c = new Character(holding(main, gems), {});
  return { c, p: c.profile(c.primary, 0) };
}

describe('Arrow Shower: extra arrows widen the shower (Rain of Arrows)', () => {
  it('counts the arrows a support adds', () => {
    const base = sheetOf(['arrowShower']).p.projectiles;
    expect(sheetOf(['arrowShower', 'twinSalvo']).p.projectiles).toBe(base + 2);
    expect(sheetOf(['arrowShower', 'wideSalvo']).p.projectiles).toBe(base + 4);
  });

  it('with the skill’s own arrows it is the one zone it always was', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['arrowShower']), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = tally(world, dummy.id, 6, 'arrowShower');
    expect(t.uses).toBeGreaterThan(1);
    expect(t.spots).toBe(1);
  });

  it('with extra arrows the extra ones burst on rings, and an enemy under several is hit once', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['arrowShower', 'wideSalvo']), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = tally(world, dummy.id, 8, 'arrowShower');
    expect(t.uses).toBeGreaterThan(1);
    // Four more arrows than the shower starts with: the shower and four bursts round it.
    expect(t.spots).toBe(5);
    expect(t.hits / t.uses).toBeLessThanOrEqual(1.05);
  });

  it('the sheet counts one hit on a target however many arrows there are', () => {
    const { p } = sheetOf(['arrowShower', 'wideSalvo']);
    expect(volleyHits(p, 3)).toBe(1);
  });
});

describe('Ember Downpour: extra arrows are more explosions on the same place (Blast Rain)', () => {
  it('each explosion is a share of the use, so the skill’s own count deals what it always dealt', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['emberDownpour']), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = tally(world, dummy.id, 8, 'emberDownpour');
    expect(t.uses).toBeGreaterThan(1);
    expect(t.hits / t.uses).toBeLessThanOrEqual(1.05);
  });

  it('two more arrows are two more hits on the target', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['emberDownpour', 'twinSalvo']), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = tally(world, dummy.id, 8, 'emberDownpour');
    expect(t.uses).toBeGreaterThan(1);
    // Eight explosions at 6 + 2 arrows, every one hitting.
    expect(t.hits).toBeGreaterThan(8);
    expect(t.hits % 8).toBe(0);
  });

  it('the sheet counts the extra explosions as hits', () => {
    const { p } = sheetOf(['emberDownpour', 'twinSalvo']);
    expect(volleyHits(p, 3)).toBeCloseTo(8 / 6, 5);
    expect(volleyHits(sheetOf(['emberDownpour']).p, 3)).toBe(1);
  });
});

describe('strikes that send bolts after them take more projectiles', () => {
  it('Rime Splinter sends the bolts it has and the ones a support adds', () => {
    const base = sheetOf(['rimeSplinter'], 'sword_3').p.projectiles;
    const more = sheetOf(['rimeSplinter', 'twinSalvo'], 'sword_3').p.projectiles;
    expect(more).toBe(base + 2);
  });
});

describe('a support that can do nothing to a skill is not in effect and costs nothing', () => {
  const links = (skill: string, support: string, main = 'bow_3') => {
    const c = new Character(holding(main, [skill, support]), {});
    const a = c.actives.find((x) => x.skill.id === skill)!;
    return a;
  };

  it('Piercing Shot does nothing to a rain of arrows, and says why', () => {
    const a = links('arrowShower', 'piercingShot');
    expect(a.supports).toHaveLength(0);
    expect(a.costMult).toBe(1);
    expect(a.inert?.[0].why).toMatch(/Arrow Shower/);
  });
});

describe('what the new and changed supports do', () => {
  /** Damage dealt to the dummy over `seconds`, and the uses in that time. */
  function damage(
    gems: string[],
    main: string,
    distance: number,
    seconds: number,
    cls = 'strider',
  ) {
    const { world, dummy } = createDummyWorld(holding(main, gems, cls), { distance, maxTime: 60 });
    world.opts.freeResources = true;
    let total = 0;
    for (let i = 0; i < seconds * 60; i++) {
      stepWorld(world);
      for (const e of world.events)
        if (e.t === 'hit' && e.src === world.player.id && e.dst === dummy.id) total += e.amount;
    }
    return total;
  }

  it('Triple Cadence deals a little more than the plain skill, not three times as much', () => {
    const plain = damage(['sweepingCut'], 'sword_3', 1.2, 30);
    const cadence = damage(['sweepingCut', 'tripleCadence'], 'sword_3', 1.2, 30);
    expect(cadence / plain).toBeGreaterThan(1.1);
    expect(cadence / plain).toBeLessThan(2);
  });

  it('Flanking Volley makes an Arrow Shower come down three times', () => {
    const { world, dummy } = createDummyWorld(holding('bow_3', ['arrowShower', 'flankingVolley']), {
      distance: 3,
      maxTime: 60,
    });
    world.opts.freeResources = true;
    const t = tally(world, dummy.id, 8, 'arrowShower');
    expect(t.uses).toBeGreaterThan(1);
    // The shower and one before and one behind it, each a burst of its own.
    expect(t.explosions / t.uses).toBeGreaterThanOrEqual(2.5);
  });

  it('Snare Cluster throws several traps, scattered; Triple Snare several, in a ring', () => {
    const cluster = sheetOf(['blazeTrap', 'snareCluster'], 'staff_3').p;
    const ring = sheetOf(['blazeTrap', 'tripleSnare'], 'staff_3').p;
    expect(cluster.deployCount).toBeGreaterThan(1);
    expect(cluster.deployScatter).toBe(true);
    expect(ring.deployCount).toBeGreaterThan(1);
    expect(ring.deployScatter).toBe(false);
  });

  it('a spell is not repeated by a totem: Echoing Cast gives way to Standing Cast', () => {
    const c = new Character(holding('wand_3', ['suddenFrost', 'standingCast', 'echoingCast']), {});
    const a = c.actives.find((x) => x.skill.id === 'suddenFrost')!;
    const ids = a.supports.map((s) => s.def.id);
    expect(ids).toContain('standingCast');
    expect(ids).not.toContain('echoingCast');
  });
});
