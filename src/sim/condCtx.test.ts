import { describe, expect, it } from 'vitest';
import type { Mod } from '../mods/types';
import { makeFlask } from '../gen/items';
import { lootMults } from '../run/run';
import { buildFor, classFor } from './gemKit';
import { killActor, rawHit } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import { chargeEnemy } from './skillFx';
import { gainVirulence } from './skillFx';
import { spawnMonster, stepWorld } from './world';
import type { Actor, World } from './types';

/**
 * A mod that holds only under a condition must count when the sim asks for it (a query with the empty context never sees it).
 * Each test gives the character a conditional mod and compares the sim with the condition true and false.
 */

const STR = classFor('str');
const DEX = classFor('dex');
const INT = classFor('int');

function neighbour(w: World, x: number, y: number, life = 1e9): Actor {
  const m = spawnMonster(
    w,
    { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
    x,
    y,
    0,
    0,
    'Neighbour',
  );
  m.def = dummyDefence({ maxLife: life });
  m.life = life;
  return m;
}

/** A world for a character that carries `mods` on its body armour. */
function worldWith(
  gems: string[],
  distance: number,
  main: string,
  cls: string,
  mods: Mod[],
  tweak?: (b: ReturnType<typeof buildFor>) => void,
) {
  const b = buildFor(gems, main, cls);
  b.equipment.body!.uniqueMods = mods;
  tweak?.(b);
  const run = createDummyWorld(b, { distance, maxTime: 120 });
  run.world.sides[0].opts.freeResources = true;
  run.world.sides[0].opts.godMode = true;
  return run;
}

const when = (id: 'hitRecently' | 'flaskActive' | 'onLowLife') => ({ condition: { id } });
const kill = (w: World, x: number, y: number): void => {
  const m = neighbour(w, x, y, 10);
  m.life = 1;
  killActor(w, m);
};

describe('conditional mods are seen by the sim', () => {
  it('flask charges per kill count a mod that holds while a flask is active', () => {
    const mods: Mod[] = [{ stat: 'flaskCharges', kind: 'inc', value: 100, ...when('flaskActive') }];
    let u = 5000;
    const { world: w } = worldWith(['crushingBlow'], 9, 'sword_3', STR, mods, (b) => {
      b.flasks = [makeFlask(() => u++, 'flask_haste', 50), null, null, null, null];
    });
    const f = w.sides[0].flasks[0];
    f.spec = { ...f.spec, maxCharges: 100 };
    f.charges = 0;
    f.activeT = 0;
    kill(w, w.player.x + 3, w.player.y);
    const plain = f.charges;
    f.charges = 0;
    f.activeT = 10;
    kill(w, w.player.x + 3, w.player.y);
    expect(f.charges).toBeCloseTo(plain * 2, 5);
  });

  it('life on kill per charge held counts the charges the character holds', () => {
    const mods: Mod[] = [
      { stat: 'chargeOn.kill.fervour', kind: 'base', value: 100 },
      { stat: 'lifeOnKill', kind: 'base', value: 20, per: { stat: 'charges.fervour', div: 1 } },
    ];
    const { world: w } = worldWith(['crushingBlow'], 9, 'sword_3', STR, mods);
    kill(w, w.player.x + 3, w.player.y);
    expect(w.char.charges.fervour).toBeGreaterThan(0);
    w.player.life = 100;
    kill(w, w.player.x + 3, w.player.y);
    expect(w.player.life).toBeGreaterThanOrEqual(100 + 20);
  });

  it('item quantity and rarity count a mod that holds on low life', () => {
    const mods: Mod[] = [
      { stat: 'itemRarity', kind: 'inc', value: 100, ...when('onLowLife') },
      { stat: 'itemQuantity', kind: 'inc', value: 50, ...when('onLowLife') },
    ];
    const { world: w } = worldWith(['crushingBlow'], 9, 'sword_3', STR, mods);
    expect(lootMults(w).rarity).toBeCloseTo(1, 5);
    w.player.life = 1;
    expect(lootMults(w).rarity).toBeCloseTo(2, 5);
    expect(lootMults(w).quantity).toBeCloseTo(1.5, 5);
  });

  it("Herald of Ash's burn counts damage mods that hold now", () => {
    const burn = (hit: boolean): number => {
      const mods: Mod[] = [{ stat: 'damage', kind: 'more', value: 100, ...when('hitRecently') }];
      const { world: w, dummy } = worldWith(
        ['crushingBlow', 'cinderHerald'],
        1.4,
        'sword_3',
        STR,
        mods,
      );
      const near = neighbour(w, dummy.x + 1.5, dummy.y);
      w.player.stunT = 1e9;
      w.player.tHit = hit ? 0 : 99;
      dummy.def = dummyDefence({ maxLife: 100 });
      dummy.life = 100;
      w.player.tHit = hit ? 0 : 99;
      rawHit(w, dummy, 1100, 0);
      return near.sdots.find((d) => d.src === '@herald')!.raw;
    };
    expect(burn(true)).toBeCloseTo(burn(false) * 2, 3);
  });

  it("a burning aura's damage counts damage mods that hold now", () => {
    const hurt = (hit: boolean): number => {
      const mods: Mod[] = [{ stat: 'damage', kind: 'more', value: 100, ...when('hitRecently') }];
      const { world: w } = worldWith(['arcChain', 'searingMantle'], 9, 'wand_3', INT, mods);
      w.player.stunT = 1e9;
      const near = neighbour(w, w.player.x + 1, w.player.y);
      for (let i = 0; i < 90; i++) {
        w.player.tHit = hit ? 0 : 99;
        stepWorld(w);
      }
      return 1e9 - near.life;
    };
    const off = hurt(false);
    expect(off).toBeGreaterThan(0);
    expect(hurt(true)).toBeGreaterThan(off * 1.8);
  });

  it("Infernal Blow's burst counts damage mods that hold now", () => {
    const burst = (hit: boolean): number => {
      const mods: Mod[] = [{ stat: 'damage', kind: 'more', value: 100, ...when('hitRecently') }];
      const { world: w, dummy } = worldWith(['cinderBlow'], 1.4, 'sword_3', STR, mods);
      w.player.stunT = 1e9;
      const near = neighbour(w, dummy.x + 1.0, dummy.y);
      dummy.def = dummyDefence({ maxLife: 1e9 });
      const prof = w.char.profile(w.primary, 0);
      w.charged[dummy.id] = { n: prof.skill.charge!.max - 1, t: 5, key: 'cinderBlow' };
      w.player.tHit = hit ? 0 : 99;
      chargeEnemy(w, w.sides[0], dummy, prof);
      return 1e9 - near.life;
    };
    const off = burst(false);
    expect(off).toBeGreaterThan(0);
    expect(burst(true)).toBeGreaterThan(off * 1.8);
  });

  it("Cinder Bond's beams count damage mods that hold now", () => {
    const beam = (hit: boolean): number => {
      const mods: Mod[] = [{ stat: 'damage', kind: 'more', value: 100, ...when('hitRecently') }];
      const { world: w } = worldWith(['cinderBond'], 5, 'wand_3', INT, mods);
      const c = w.char.actives.find((x) => x.skill.id === 'cinderBond')!;
      for (const s of [4, -4])
        w.sides[0].deployables.push({
          id: ++w.sides[0].deploySeq,
          kind: 'totem',
          key: c.key,
          x: w.player.x + s,
          y: w.player.y,
          t: 8,
          fireT: 0,
        });
      const onBeam = neighbour(w, w.player.x + 2, w.player.y);
      for (let i = 0; i < 60; i++) {
        w.player.tHit = hit ? 0 : 99;
        stepWorld(w);
      }
      return onBeam.sdots.find((d) => d.src === 'cinderBond')!.raw;
    };
    expect(beam(true)).toBeGreaterThan(beam(false) * 1.8);
  });

  it("Herald of Agony's crawler counts minion mods that hold now", () => {
    const crawler = (hit: boolean): number => {
      const mods: Mod[] = [
        { stat: 'minionDamage', kind: 'more', value: 100, ...when('hitRecently') },
      ];
      const { world: w } = worldWith(['venomStrike', 'sourHerald'], 9, 'dagger_3', DEX, mods);
      w.player.tHit = hit ? 0 : 99;
      gainVirulence(w, w.sides[0]);
      return w.sides[0].minions.find((m) => m.kind === 'crawler')!.dmg;
    };
    expect(crawler(true)).toBeCloseTo(crawler(false) * 2, 5);
  });
});
