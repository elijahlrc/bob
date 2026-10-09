import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import type { TriggerDef } from '../data/triggers';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { mod, type Mod } from '../mods/types';
import { newRun, setMap } from '../run/run';
import { scoreBuild } from '../run/bot';
import { applyHit, killActor } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import { MAX_EXPLOSIONS_PER_TICK, tickTriggers } from './triggers';
import type { Actor, SimEvent, World } from './types';
import { spawnMonster, stepWorld } from './world';

/**
 * A melee build (Crushing Blow in a two-hander) whose body armour carries `triggers` and the given
 * spells, plus optional extra mods on the body armour.
 */
function buildFor(
  triggers: TriggerDef[],
  spells: string[] = ['arcChain'],
  extra: Mod[] = [],
): Build {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  const weapon = makeItem(uid, 'mace2_3', 40, 1);
  weapon.sockets = [makeGem(uid, 'crushingBlow')];
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 40, Math.max(1, spells.length), 'unique');
  body.sockets = spells.map((g) => makeGem(uid, g));
  body.uniqueMods = extra;
  body.uniqueTriggers = triggers;
  b.equipment.body = body;
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

const onHit = (over: Partial<TriggerDef> = {}): TriggerDef => ({
  on: 'hit',
  chance: 100,
  cooldown: 0.5,
  effect: { kind: 'castSocketed' },
  ...over,
});

type Tally = { uses: number; triggers: number; hits: number; trigHits: number; time: number };

/** Run the dummy world and count what happened. Triggered hits follow a 'trigger' event in a tick. */
function run(build: Build, seconds: number, seed = 1, distance = 1.6, mana?: number) {
  const { world, dummy } = createDummyWorld(build, { distance, maxTime: seconds, seed });
  const t: Tally = { uses: 0, triggers: 0, hits: 0, trigHits: 0, time: 0 };
  while (world.status === 'running') {
    if (mana !== undefined) world.player.mana = mana;
    stepWorld(world);
    let after = false;
    for (const e of world.events as SimEvent[]) {
      if (e.t === 'use' && e.src === world.player.id) {
        t.uses++;
        after = false;
      } else if (e.t === 'trigger') {
        t.triggers++;
        after = true;
      } else if (e.t === 'hit' && e.src === world.player.id) {
        if (after) t.trigHits++;
        else t.hits++;
      }
    }
  }
  t.time = world.t;
  return { world, dummy, t };
}

describe('triggers: casting a socketed spell (EXPANSION 5.5)', () => {
  it('fire on every hit when the cooldown is short, and the spell is not the primary', () => {
    const b = buildFor([onHit({ cooldown: 0.1 })]);
    const c = new Character(b, {});
    expect(c.primary.skill.id).toBe('crushingBlow');
    expect(c.triggers).toHaveLength(1);
    expect(c.triggers[0].skills.map((s) => s.skill.id)).toEqual(['arcChain']);
    const { t } = run(b, 30);
    expect(t.uses).toBeGreaterThan(15);
    expect(t.triggers).toBe(t.hits); // one trigger per landed hit of the primary
    expect(t.trigHits).toBeGreaterThan(0);
  });

  it('a triggered spell cannot be chosen as the primary skill', () => {
    const b = buildFor([onHit()]);
    b.primaryGem = b.equipment.body!.sockets[0]!.uid;
    const c = new Character(b, {});
    expect(c.primary.gemUid).not.toBe(b.primaryGem);
    expect(c.primary.skill.id).toBe('crushingBlow');
  });

  it('respect the cooldown', () => {
    const { t } = run(buildFor([onHit({ cooldown: 4 })]), 60);
    // Hits come about every 1.3 s, so a 4 s cooldown allows at most one trigger per 4 s.
    expect(t.triggers).toBeLessThanOrEqual(15);
    expect(t.triggers).toBeGreaterThan(8);
  });

  it('roll their chance', () => {
    const half = run(buildFor([onHit({ chance: 50, cooldown: 0 })]), 120, 3).t;
    const ratio = half.triggers / half.hits;
    expect(ratio).toBeGreaterThan(0.4);
    expect(ratio).toBeLessThan(0.6);
  });

  it('fire only on crits for a crit trigger', () => {
    const noCrit = run(
      buildFor([onHit({ on: 'crit', cooldown: 0 })], ['arcChain'], [mod('neverCrit', 'flag', 1)]),
      30,
    ).t;
    expect(noCrit.triggers).toBe(0);
    const crit = run(
      buildFor(
        [onHit({ on: 'crit', cooldown: 0 })],
        ['arcChain'],
        [mod('critChance', 'base', 500), mod('critMulti', 'base', 50)],
      ),
      30,
    ).t;
    expect(crit.triggers).toBeGreaterThan(crit.hits * 0.85);
  });

  it('only count skills with the right tags', () => {
    const projectile = run(buildFor([onHit({ tags: ['projectile'] })]), 30).t;
    expect(projectile.triggers).toBe(0);
    const melee = run(buildFor([onHit({ tags: ['melee'] })]), 30).t;
    expect(melee.triggers).toBeGreaterThan(5);
  });

  it('fire when you attack, before the hit lands', () => {
    const { t } = run(buildFor([onHit({ on: 'attack', cooldown: 0 })]), 30);
    expect(t.triggers).toBe(t.uses);
  });

  it('cost no mana, and fire with none left (3.9)', () => {
    const none = run(buildFor([onHit({ cooldown: 0 })]), 20, 1, 1.6, 0).t;
    expect(none.triggers).toBeGreaterThan(5);
    expect(none.hits).toBeGreaterThan(5);
  });

  it('never trigger from a triggered skill', () => {
    // Arc Chain hits too, and would trigger itself in a loop if hits from triggered skills counted.
    const { t } = run(buildFor([onHit({ cooldown: 0 })]), 30);
    expect(t.triggers).toBeLessThanOrEqual(t.hits);
  });
});

describe('triggers: effects on kills, blocks and damage taken', () => {
  function pack(trigger: TriggerDef, n: number, spacing = 0.1) {
    // A line of n enemies has to fit inside the arena: a monster placed in a wall is set down elsewhere.
    const { world, dummy } = createDummyWorld(buildFor([trigger], []), {
      distance: 2,
      size: Math.max(30, Math.ceil(n * spacing) + 20),
    });
    dummy.def = dummyDefence({ maxLife: 1000 });
    dummy.life = 1000;
    const others: Actor[] = [];
    for (let i = 0; i < n; i++) {
      const m = spawnMonster(
        world,
        { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
        dummy.x + (i + 1) * spacing,
        dummy.y,
        0,
        0,
        'Neighbour',
      );
      m.def = dummyDefence({ maxLife: 1000 });
      m.life = 1000;
      others.push(m);
    }
    return { world, dummy, others };
  }

  it("a kill explosion hurts nearby enemies for a share of the dead enemy's life", () => {
    const trig: TriggerDef = {
      on: 'kill',
      targetHas: 'shock',
      chance: 100,
      cooldown: 0,
      effect: { kind: 'explode', pctOfMaxLife: 10, dtype: 'lightning', radius: 3 },
    };
    const { world, dummy, others } = pack(trig, 2);
    killActor(world, dummy);
    // No shock on the dummy, so nothing happens.
    expect(others[0].life).toBe(1000);
    const again = pack(trig, 2);
    again.dummy.ail.shock = 0.2;
    killActor(again.world, again.dummy);
    for (const o of again.others) expect(o.life).toBeCloseTo(1000 - 100);
  });

  it('kill explosions are capped per tick, and a chain runs on over the next ticks', () => {
    const trig: TriggerDef = {
      on: 'kill',
      chance: 100,
      cooldown: 0,
      // Each explosion reaches only the next enemy in the line.
      effect: { kind: 'explode', pctOfMaxLife: 200, dtype: 'fire', radius: 0.6 },
    };
    const { world, dummy, others } = pack(trig, 60, 0.9);
    killActor(world, dummy);
    expect(world.trig.explosions).toBe(MAX_EXPLOSIONS_PER_TICK);
    expect(others.filter((o) => !o.alive)).toHaveLength(MAX_EXPLOSIONS_PER_TICK);
    // Each later tick detonates up to the cap again (only the trigger upkeep runs here, so the
    // monsters stay where they are).
    for (let i = 0; i < 3; i++) {
      tickTriggers(world, 1 / 60);
      expect(world.trig.explosions).toBeLessThanOrEqual(MAX_EXPLOSIONS_PER_TICK);
    }
    expect(others.every((o) => !o.alive)).toBe(true);
  });

  it('a kill can spread shock to enemies nearby', () => {
    const trig: TriggerDef = {
      on: 'kill',
      targetHas: 'shock',
      chance: 100,
      cooldown: 0,
      effect: { kind: 'spread', ailment: 'shock', radius: 3 },
    };
    const { world, dummy, others } = pack(trig, 2);
    dummy.ail.shock = 0.25;
    dummy.ail.shockT = 2;
    killActor(world, dummy);
    for (const o of others) {
      expect(o.ail.shock).toBeCloseTo(0.25);
      expect(o.ail.shockT).toBeGreaterThan(1);
    }
  });

  it('a kill can spread ignite', () => {
    const trig: TriggerDef = {
      on: 'kill',
      targetHas: 'ignite',
      chance: 100,
      cooldown: 0,
      effect: { kind: 'spread', ailment: 'ignite', radius: 3 },
    };
    const { world, dummy, others } = pack(trig, 1);
    dummy.ail.ignites.push({ dps: 50, t: 3 });
    killActor(world, dummy);
    expect(others[0].ail.ignites).toEqual([{ dps: 50, t: 3 }]);
  });

  it('blocking can recover energy shield from armour', () => {
    const trig: TriggerDef = {
      on: 'block',
      chance: 100,
      cooldown: 0.5,
      effect: { kind: 'recover', pool: 'es', pctOf: 'armour', value: 10 },
    };
    const { world, dummy } = createDummyWorld(buildFor([trig], []), { distance: 2 });
    const p = world.player;
    p.def = { ...p.def, armour: 2000, maxEs: 1000 };
    p.es = 0;
    const blocked = {
      outcome: 'block' as const,
      crit: false,
      dmg: [0, 0, 0, 0, 0],
      total: 0,
      H: [0, 0, 0, 0, 0],
      ailments: { ignite: 0, bleed: 0, poison: 0, shock: 0, chill: 0, freeze: 0 },
      stun: 0,
    };
    const prof = world.char.profile(world.char.primary);
    applyHit(world, dummy, p, prof, blocked);
    expect(p.es).toBeCloseTo(200);
    applyHit(world, dummy, p, prof, blocked); // still cooling down
    expect(p.es).toBeCloseTo(200);
    for (let i = 0; i < 40; i++) stepWorld(world);
    // Stepping rebuilds the player's defences, so set the test values again.
    p.def = { ...p.def, armour: 2000, maxEs: 1000 };
    p.es = 0;
    applyHit(world, dummy, p, prof, blocked);
    expect(p.es).toBeGreaterThan(100);
  });

  it('damage taken fires a trigger once enough has been taken', () => {
    const trig: TriggerDef = {
      on: 'hitTaken',
      threshold: 30,
      chance: 100,
      cooldown: 0.5,
      effect: { kind: 'recover', pool: 'life', pctOf: 'maxLife', value: 5 },
    };
    const { world, dummy } = createDummyWorld(buildFor([trig], []), { distance: 2 });
    const p = world.player;
    const max = p.def.maxLife;
    p.life = max * 0.5;
    const hit = (amount: number) => ({
      outcome: 'hit' as const,
      crit: false,
      dmg: [amount, 0, 0, 0, 0],
      total: amount,
      H: [amount, 0, 0, 0, 0],
      ailments: { ignite: 0, bleed: 0, poison: 0, shock: 0, chill: 0, freeze: 0 },
      stun: 0,
    });
    const prof = world.char.profile(world.char.primary);
    p.def = { ...p.def, maxLife: max };
    const before = p.life;
    applyHit(world, dummy, p, prof, hit(max * 0.1));
    const afterOne = p.life;
    expect(afterOne).toBeCloseTo(before - max * 0.1); // 10% taken: below the 30% threshold
    applyHit(world, dummy, p, prof, hit(max * 0.1));
    applyHit(world, dummy, p, prof, hit(max * 0.1)); // 30% taken in total: fires, healing 5% of max
    expect(p.life).toBeCloseTo(before - max * 0.3 + max * 0.05);
  });
});

describe('triggers on the character sheet', () => {
  it('list the skills they cast, with their own DPS, and count toward the total', () => {
    const b = buildFor([onHit({ cooldown: 0.5 })]);
    const c = new Character(b, { areaLevel: 40 });
    const sheet = c.sheet();
    expect(sheet.triggered).toHaveLength(1);
    expect(sheet.triggered[0].skill.id).toBe('arcChain');
    expect(sheet.triggered[0].dps).toBeGreaterThan(0);
    expect(sheet.triggeredDps).toBe(sheet.triggered[0].dps);
    const without = new Character(buildFor([]), { areaLevel: 40 }).sheet();
    expect(without.triggered).toHaveLength(0);
    // The bot sees the extra damage.
    const run = newRun('vanguard', 1);
    setMap(run, 40);
    expect(scoreBuild(run, b)).toBeGreaterThan(scoreBuild(run, buildFor([])));
  });

  it('a trigger whose cause the primary skill never produces adds nothing', () => {
    const c = new Character(buildFor([onHit({ tags: ['projectile'] })]), { areaLevel: 40 });
    expect(c.sheet().triggered).toHaveLength(0);
  });
});

describe('calc ↔ sim convergence for triggers (EXPANSION 5.5)', () => {
  it('a hit-triggered Arc Chain matches the calc within 5%', () => {
    const b = buildFor([onHit({ cooldown: 0.5 })]);
    const calc = new Character(b, { targetDistance: 1.6 }).triggerSheets(0, {
      def: dummyDefence(),
      shock: 0,
      resShift: [0, 0, 0, 0, 0],
    })[0];
    expect(calc.skill.hitDps).toBeGreaterThan(0);
    let dmg = 0;
    let time = 0;
    for (const seed of [1, 2, 3]) {
      const { world, dummy } = createDummyWorld(b, { distance: 1.6, maxTime: 400, seed });
      while (world.status === 'running') {
        stepWorld(world);
        let after = false;
        for (const e of world.events) {
          if (e.t === 'use') after = false;
          else if (e.t === 'trigger') after = true;
          else if (e.t === 'hit' && e.src === world.player.id && after) dmg += e.amount;
        }
      }
      time += world.t;
      expect(dummy.alive).toBe(true);
    }
    const ratio = dmg / time / calc.skill.hitDps;
    expect(
      ratio,
      `sim ${(dmg / time).toFixed(1)} vs calc ${calc.skill.hitDps.toFixed(1)}`,
    ).toBeGreaterThan(0.95);
    expect(ratio).toBeLessThan(1.05);
  });
});

export type { World };
