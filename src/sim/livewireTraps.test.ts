import { describe, expect, it } from 'vitest';
import { classFor, buildFor } from './gemKit';
import { createDummyWorld, dummyDefence } from './dummy';
import { stepWorld } from './world';

const DEX = classFor('dex');

function trapWorld(gems: string[]) {
  const run = createDummyWorld(buildFor(gems, 'wand_3', DEX), { distance: 4, maxTime: 120 });
  run.world.opts.freeResources = true;
  run.world.opts.godMode = true;
  run.dummy.def = dummyDefence({ maxLife: 3000 });
  run.dummy.life = 3000;
  return run;
}

describe('Livewire supports traps, mines and totems', () => {
  it('a trap with Livewire takes it: no gem is left idle, and the hit gains lightning and a chance to shock', () => {
    for (const skill of ['jawsTrap', 'blazeTrap', 'drainTrap']) {
      const plain = trapWorld([skill]).world;
      const { world: w } = trapWorld([skill, 'livewire']);
      expect(w.char.primary.inert ?? [], skill).toEqual([]);
      const p = w.char.profile(w.primary, 0);
      const lightning = (x: typeof p) =>
        x.hands.reduce(
          (n, h) => n + h.chunks.filter((c) => c.type === 1).reduce((s, c) => s + c.max, 0),
          0,
        );
      expect(lightning(p), skill).toBeGreaterThan(lightning(plain.char.profile(plain.primary, 0)));
      expect(w.char.buffSource.innervation, skill).toBe(true);
    }
  });

  it('killing a shocked enemy with a trap gives Innervation', () => {
    const { world: w, dummy } = trapWorld(['boltTrap', 'livewire']);
    dummy.def = dummyDefence({ maxLife: 400 });
    dummy.life = 400;
    let got = false;
    for (let i = 0; i < 60 * 60 && !got; i++) {
      stepWorld(w);
      if (dummy.alive && dummy.ail.shock <= 0 && dummy.life < 150) dummy.ail.shock = 0.2;
      if (w.buffT.innervation > 0) got = true;
    }
    expect(got).toBe(true);
  });
});
