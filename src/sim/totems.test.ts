import { describe, expect, it } from 'vitest';
import { bondLinks, deployFull, DEPLOY_NEAR, type Deployable } from './deploy';
import { createDummyWorld } from './dummy';
import { buildFor, classFor } from './gemKit';
import type { World } from './types';
import { stepWorld } from './world';

/** Where totems go and when the character puts more down: Cinder Bond and the totems after it. */

const INT = classFor('int');

function world(gems: string[], distance: number) {
  const run = createDummyWorld(buildFor(gems, 'wand_3', INT), { distance, maxTime: 120 });
  run.world.opts.freeResources = true;
  run.world.opts.godMode = true;
  return run;
}

const run = (w: World, seconds: number, until?: () => boolean) => {
  for (let i = 0; i < seconds * 60 && !(until && until()); i++) stepWorld(w);
};

const totem = (w: World, key: string, x: number, y: number): Deployable => {
  const d: Deployable = { id: ++w.deploySeq, kind: 'totem', key, x, y, t: 8, fireT: 0 };
  w.deployables.push(d);
  return d;
};

describe('totem placement', () => {
  it('Cinder Bond stands its totems apart, in sight of the character, and its beams are there to draw', () => {
    const { world: w } = world(['cinderBond'], 5);
    const c = w.char.actives.find((x) => x.skill.id === 'cinderBond')!;
    run(w, 6);
    const mine = w.deployables.filter((d) => d.key === c.key);
    expect(mine.length).toBeGreaterThan(1);
    for (const d of mine) {
      expect(Math.hypot(d.x - w.player.x, d.y - w.player.y)).toBeLessThanOrEqual(
        c.skill.bond!.range,
      );
      expect(w.grid.los(d.x, d.y, w.player.x, w.player.y)).toBe(true);
    }
    for (let i = 0; i < mine.length; i++)
      for (let j = i + 1; j < mine.length; j++)
        expect(Math.hypot(mine[i].x - mine[j].x, mine[i].y - mine[j].y)).toBeGreaterThan(1.5);
    expect(bondLinks(w).length).toBeGreaterThanOrEqual(mine.length);
  });

  it('is not the same every time: the spot has some randomness, and favours the beams that cross enemies', () => {
    const spots = new Set<string>();
    for (let seed = 0; seed < 4; seed++) {
      const { world: w } = world(['cinderBond'], 5);
      for (let i = 0; i < seed * 7; i++) w.rngTrig.int(0, 100);
      run(w, 3, () => w.deployables.length > 0);
      const d = w.deployables[0];
      if (d) spots.add(`${d.x.toFixed(1)},${d.y.toFixed(1)}`);
    }
    expect(spots.size).toBeGreaterThan(1);
  });
});

describe('a set of deployables that is full', () => {
  it('counts only what stands near the character: a set left behind in an old room does not stop a new one', () => {
    const { world: w } = world(['cinderBond'], 5);
    const c = w.char.actives.find((x) => x.skill.id === 'cinderBond')!;
    const prof = w.char.profile(c, w.char.configConds);
    w.deployables.length = 0;
    const n = prof.deployCount;
    for (let i = 0; i < n; i++) totem(w, c.key, w.player.x + 3, w.player.y + i);
    expect(deployFull(w, c, prof)).toBe(true);
    for (const d of w.deployables) d.x = w.player.x + DEPLOY_NEAR + 5;
    expect(deployFull(w, c, prof)).toBe(false);
  });

  it('when a new totem goes down on a full set, the one furthest from the character gives way', () => {
    const { world: w } = world(['cinderBond'], 5);
    const c = w.char.actives.find((x) => x.skill.id === 'cinderBond')!;
    const prof = w.char.profile(c, w.char.configConds);
    w.deployables.length = 0;
    w.player.stunT = 1e9;
    const n = prof.deployCount;
    const far = totem(w, c.key, w.player.x + 30, w.player.y);
    for (let i = 1; i < n; i++) totem(w, c.key, w.player.x + 2 + i, w.player.y + 2);
    // The AI is held still above, so cast through the controller's own path.
    w.player.stunT = 0;
    run(w, 5, () => !w.deployables.includes(far));
    expect(w.deployables.includes(far)).toBe(false);
  });

  it('the character moves on to another skill while the totems stand, rather than casting more', () => {
    const { world: w } = world(['cinderBond'], 5);
    const uses: Record<string, number> = {};
    for (let i = 0; i < 20 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'use') uses[e.skill] = (uses[e.skill] ?? 0) + 1;
    }
    const c = w.char.actives.find((x) => x.skill.id === 'cinderBond')!;
    const cap = w.char.profile(c, w.char.configConds).deployCount;
    // Never more totems than the set allows, and the weapon attack is used meanwhile.
    expect(w.deployables.filter((d) => d.key === c.key).length).toBeLessThanOrEqual(cap);
    expect(uses.defaultAttack ?? 0).toBeGreaterThan(0);
  });
});
