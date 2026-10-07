import { describe, expect, it } from 'vitest';
import { DT } from '../data/constants';
import { makeFlask } from '../gen/items';
import { withStarterGems } from '../run/starterGems';
import { newRun } from '../run/run';
import { applyDamage, lifeCap, tickActor } from './combat';
import { createDummyWorld } from './dummy';
import { autoFlaskPolicy } from './flaskPolicy';
import { stepWorld } from './world';

function world(classId = 'vanguard') {
  const run = newRun(classId, 3);
  run.build.level = 20;
  const { world: w, dummy } = createDummyWorld(run.build, { distance: 20 });
  w.opts.freeResources = false;
  return { w, dummy, run };
}

describe('§6.3 damage routing', () => {
  it('ES absorbs non-chaos damage first; chaos bypasses ES', () => {
    const { w } = world();
    const p = w.player;
    p.def = { ...p.def, maxEs: 100 };
    p.es = 100;
    const life0 = p.life;
    applyDamage(w, p, [30, 0, 0, 0, 0]);
    expect(p.es).toBeCloseTo(70);
    expect(p.life).toBeCloseTo(life0);
    applyDamage(w, p, [0, 0, 0, 0, 20]);
    expect(p.es).toBeCloseTo(70);
    expect(p.life).toBeCloseTo(life0 - 20);
  });

  it('Mind Bulwark takes 30% from mana before life', () => {
    const { w } = world();
    const p = w.player;
    p.def = { ...p.def, manaBeforeLife: 0.3 };
    p.mana = 100;
    const life0 = p.life;
    applyDamage(w, p, [50, 0, 0, 0, 0]);
    expect(p.mana).toBeCloseTo(85);
    expect(p.life).toBeCloseTo(life0 - 35);
  });

  it('death ends the map', () => {
    const { w } = world();
    applyDamage(w, w.player, [1e6, 0, 0, 0, 0]);
    expect(w.player.alive).toBe(false);
    expect(w.status).toBe('dead');
  });
});

describe('§6.4 recovery', () => {
  it('leech recovers 2% of max life per second per instance, capped at 20%', () => {
    const { w } = world();
    const p = w.player;
    p.def = { ...p.def, lifeRegen: 0, maxLife: 1000 };
    p.life = 100;
    p.leechLife = [1000];
    tickActor(w, p, 1);
    expect(p.life).toBeCloseTo(120);
    p.leechLife = new Array(30).fill(1000);
    tickActor(w, p, 1);
    expect(p.life).toBeCloseTo(320);
  });

  it('leech instances end at full life', () => {
    const { w } = world();
    const p = w.player;
    p.life = lifeCap(w, p);
    p.leechLife = [50];
    tickActor(w, p, DT);
    expect(p.leechLife).toHaveLength(0);
  });

  it('life regeneration and ES recharge after the delay', () => {
    const { w } = world();
    const p = w.player;
    p.def = { ...p.def, lifeRegen: 10, maxEs: 100, esRecharge: 33.3, esDelay: 2 };
    p.life = 10;
    p.es = 0;
    p.sinceDamaged = 0;
    tickActor(w, p, 1);
    expect(p.life).toBeCloseTo(20);
    expect(p.es).toBe(0);
    tickActor(w, p, 1.5);
    expect(p.es).toBeGreaterThan(0);
  });
});

describe('§6.6 damage over time in the sim', () => {
  it('only the strongest ignite deals damage; poison stacks', () => {
    const { w, dummy } = world();
    const life0 = dummy.life;
    dummy.ail.ignites = [
      { dps: 10, t: 4 },
      { dps: 30, t: 4 },
    ];
    tickActor(w, dummy, 1);
    expect(life0 - dummy.life).toBeCloseTo(30);
    const l1 = dummy.life;
    dummy.ail.ignites = [];
    dummy.ail.poisons = [
      { dps: 5, t: 2 },
      { dps: 5, t: 2 },
      { dps: 5, t: 2 },
    ];
    tickActor(w, dummy, 1);
    expect(l1 - dummy.life).toBeCloseTo(15);
  });

  it('bleed deals double damage to moving targets', () => {
    const { w, dummy } = world();
    dummy.ail.bleeds = [{ dps: 10, t: 5 }];
    dummy.moving = true;
    const l0 = dummy.life;
    tickActor(w, dummy, 1);
    expect(l0 - dummy.life).toBeCloseTo(20);
  });
});

describe('§6.6a stun in the sim', () => {
  it('stun cancels the action and grants a grace period afterwards', () => {
    const { w } = world();
    const p = w.player;
    p.stunT = 0.35;
    p.action = null;
    tickActor(w, p, 0.4);
    expect(p.stunT).toBeLessThanOrEqual(0);
    expect(p.graceT).toBeCloseTo(0.5);
  });
});

describe('§6.9 flask policy', () => {
  it('uses a life flask below 50% life and queues recovery over its duration', () => {
    const { w, run } = world();
    const uid = () => run.nextUid++;
    w.build.flasks = [makeFlask(uid, 'flask_life_1', 1), null, null, null, null];
    // Rebuild flask state from the character.
    w.flasks = [
      {
        spec: {
          ...w.char.flasks[0],
          uid: 1,
          kind: 'life',
          life: 70,
          duration: 4,
          perUse: 7,
          maxCharges: 21,
        },
        charges: 21,
        activeT: 0,
        queued: false,
        lifeRate: 0,
        manaRate: 0,
        esRate: 0,
        esT: 0,
      },
    ];
    const p = w.player;
    p.life = lifeCap(w, p) * 0.3;
    expect(autoFlaskPolicy(w)).toEqual([0]);
    const l0 = p.life;
    stepWorld(w);
    expect(w.flasks[0].activeT).toBeGreaterThan(0);
    expect(w.flasks[0].charges).toBe(14);
    for (let i = 0; i < 60; i++) stepWorld(w);
    expect(p.life - l0).toBeGreaterThan(10);
    // While recovering, the policy does not use another life flask.
    expect(autoFlaskPolicy(w)).toEqual([]);
  });
});

describe('hybrid flasks refill mana as well as life (flask policy)', () => {
  function hybridWorld() {
    const run = withStarterGems(newRun('mystic', 3));
    run.build.level = 20;
    const uid = () => run.nextUid++;
    run.build.flasks = [makeFlask(uid, 'flask_hybrid_1', 1), null, null, null, null];
    const { world: w } = createDummyWorld(run.build, { distance: 20 });
    w.opts.freeResources = false;
    const spec = w.char.flasks[0];
    expect(spec.kind).toBe('hybrid');
    w.flasks[0].charges = spec.maxCharges;
    return w;
  }

  it('is drunk when mana runs low, even at full life', () => {
    const w = hybridWorld();
    const p = w.player;
    const cost = w.char.profile(w.primary).cost;
    expect(cost).toBeGreaterThan(0);
    p.life = lifeCap(w, p);
    p.mana = cost; // below twice the cost of the main skill
    expect(autoFlaskPolicy(w)).toEqual([0]);
  });

  it('is left alone with healthy life and mana, and while it is already active', () => {
    const w = hybridWorld();
    const p = w.player;
    p.life = lifeCap(w, p);
    p.mana = p.def.maxMana;
    expect(autoFlaskPolicy(w)).toEqual([]);
    p.mana = 0;
    w.flasks[0].activeT = 3;
    expect(autoFlaskPolicy(w)).toEqual([]);
  });

  it('still answers low life', () => {
    const w = hybridWorld();
    const p = w.player;
    p.mana = p.def.maxMana;
    p.life = lifeCap(w, p) * 0.2;
    expect(autoFlaskPolicy(w)).toEqual([0]);
  });
});
