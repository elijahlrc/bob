import { describe, expect, it } from 'vitest';
import { Character, sheetDps } from '../calc/character';
import type { SkillTactic, Strategy } from '../data/strategy';
import type { Build } from '../data/types';
import type { MonsterSpec } from '../calc/monster';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import type { World } from './types';
import { spawnMonster, stepWorld } from './world';

/**
 * The Strategy tab (DESIGN.md Appendix A, 2026-10-09): roles, conditions and order for the skills, and the target priority, the
 * spacing and the flask thresholds.
 */

/** A level 30 build with the gems in the body armour (the first is starred), and a weapon. */
function build(gems: string[], mainHand = 'mace2_3', cls = 'vanguard'): Build {
  const run = newRun(cls, 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 30;
  b.equipment.mainHand = makeItem(uid, mainHand, 30, 1);
  const body = makeItem(uid, 'body_ar_1', 30, 1);
  body.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

const uidOf = (b: Build, i: number) => b.equipment.body!.sockets[i]!.uid;

/** The build with a strategy; `skills` is by socket index. */
function withStrategy(
  b: Build,
  skills: Record<number, SkillTactic>,
  rest: Omit<Strategy, 'skills'> = {},
): Build {
  const out: Strategy = { ...rest, skills: {} };
  for (const [i, t] of Object.entries(skills)) out.skills![String(uidOf(b, Number(i)))] = t;
  return { ...b, strategy: out };
}

/** How often each skill is used by the character over a while against the dummy. */
function uses(w: World, seconds: number): Record<string, number> {
  const out: Record<string, number> = {};
  const end = w.t + seconds;
  while (w.t < end && w.status === 'running') {
    stepWorld(w);
    for (const e of w.events)
      if (e.t === 'use' && e.src === w.player.id) out[e.skill] = (out[e.skill] ?? 0) + 1;
  }
  return out;
}

function put(w: World, dx: number, dy: number, over: Partial<MonsterSpec> = {}) {
  const spec: MonsterSpec = {
    type: 'warrior',
    variant: 'none',
    rarity: 'normal',
    level: 30,
    mods: [],
    ...over,
  };
  const m = spawnMonster(w, spec, w.player.x + dx, w.player.y + dy, 0, 0, 'warrior');
  m.state = 'chase';
  return m;
}

describe('the strategy: defaults', () => {
  it('the starred skill is the main one, the other damage skills periodic, the utility skills on their own judgement', () => {
    const c = new Character(build(['crushingBlow', 'flameBolt', 'ironHide']), {});
    expect(c.mains.map((e) => [e.choice.skill.id, e.role])).toEqual([['crushingBlow', 'main']]);
    expect(c.rotation.map((e) => [e.choice.skill.id, e.role])).toEqual([
      ['ironHide', 'auto'],
      ['flameBolt', 'periodic'],
    ]);
    expect(c.primary.skill.id).toBe('crushingBlow');
    expect(c.rotation.every((e) => e.isDefault)).toBe(true);
  });

  it('with no skill waiting for a kind of fight, a pack and a boss make the same damage', () => {
    const s = new Character(build(['crushingBlow', 'flameBolt']), {}).sheet();
    expect(s.scenarios!.pack).toBeCloseTo(s.scenarios!.boss, 9);
    expect(sheetDps(s)).toBeCloseTo(s.scenarios!.pack, 9);
  });
});

describe('the strategy: roles and order', () => {
  it('a skill switched off is never cast', () => {
    const b = withStrategy(build(['crushingBlow', 'flameBolt']), { 1: { role: 'off' } });
    const c = new Character(b, {});
    expect(c.secondaries).toEqual([]);
    expect(c.unused.map((e) => e.choice.skill.id)).toEqual(['flameBolt']);
    const { world } = createDummyWorld(b, { distance: 1.6, maxTime: 60 });
    expect(uses(world, 15).flameBolt ?? 0).toBe(0);
  });

  it('a skill made main instead of the starred one takes its place', () => {
    const b = withStrategy(build(['crushingBlow', 'flameBolt']), {
      0: { role: 'periodic' },
      1: { role: 'main' },
    });
    const c = new Character(b, {});
    expect(c.primary.skill.id).toBe('flameBolt');
    expect(c.secondaries.map((x) => x.skill.id)).toEqual(['crushingBlow']);
  });

  it('the order the strategy gives is kept, and a skill it does not name goes where its default order puts it', () => {
    const b0 = build(['crushingBlow', 'flameBolt', 'suddenFrost', 'ironHide']);
    const byDefault = new Character(b0, {}).rotation.map((e) => e.choice.skill.id);
    expect(byDefault[0]).toBe('ironHide');
    // Name the two periodic skills the other way round, and leave the guard out.
    const named = byDefault.filter((id) => id !== 'ironHide').reverse();
    const ids = ['crushingBlow', 'flameBolt', 'suddenFrost', 'ironHide'];
    const b = { ...b0, strategy: { order: named.map((id) => uidOf(b0, ids.indexOf(id))) } };
    expect(new Character(b, {}).rotation.map((e) => e.choice.skill.id)).toEqual([
      'ironHide',
      ...named,
    ]);
  });

  it('a periodic skill with a pause set waits that long between uses', () => {
    const b = withStrategy(build(['crushingBlow', 'flameBolt']), { 1: { every: 8 } });
    const c = new Character(b, {});
    expect(c.cooldownOf(c.secondaries[0])).toBe(8);
    const { world } = createDummyWorld(b, { distance: 1.6, maxTime: 60 });
    // Twenty seconds: at most three uses (at once, after 8 s and after 16 s).
    expect(uses(world, 20).flameBolt).toBeLessThanOrEqual(3);
  });

  it('an opener is used once a fight', () => {
    const b = withStrategy(build(['crushingBlow', 'flameBolt']), { 1: { role: 'opener' } });
    const { world } = createDummyWorld(b, { distance: 1.6, maxTime: 60 });
    const u = uses(world, 15);
    expect(u.flameBolt).toBe(1);
    expect(u.crushingBlow).toBeGreaterThan(5);
  });

  it('when the main skill waits on its cooldown, a ready periodic skill is used instead of the weapon', () => {
    const b = build(['suddenFrost', 'flameBolt'], 'staff_3', 'mystic');
    const c = new Character(b, {});
    expect(c.primary.skill.id).toBe('suddenFrost');
    const { world } = createDummyWorld(b, { distance: 3, maxTime: 60 });
    const u = uses(world, 20);
    expect(u.defaultAttack ?? 0).toBe(0);
    // Far more often than its usual pause allows.
    expect(u.flameBolt).toBeGreaterThan(20 / c.cooldownOf(c.secondaries[0]) + 2);
  });
  it('a main skill that waits for mana is not stood in for by a periodic skill: the weapon lets the mana come back', () => {
    const b = build(['flameBolt', 'crushingBlow']);
    const c = new Character(b, {});
    const mainCost = c.profile(c.primary).cost;
    const boltCost = c.profile(c.secondaries[0]).cost;
    expect(mainCost).toBeGreaterThan(boltCost);
    const { world } = createDummyWorld(b, { distance: 1.6, maxTime: 60 });
    world.opts.freeResources = false;
    const out: Record<string, number> = {};
    // Mana held between the two costs: the periodic skill could be paid for, the main one not.
    for (let i = 0; i < 60 * 10; i++) {
      world.player.mana = (mainCost + boltCost) / 2;
      stepWorld(world);
      for (const e of world.events)
        if (e.t === 'use' && e.src === world.player.id) out[e.skill] = (out[e.skill] ?? 0) + 1;
    }
    expect(out.flameBolt ?? 0).toBe(0);
    expect(out.defaultAttack).toBeGreaterThan(3);
    // Only as often as its pause allows (ten seconds: at once, then every pause).
    expect(out.crushingBlow).toBeLessThanOrEqual(
      Math.ceil(10 / c.cooldownOf(c.secondaries[0])) + 1,
    );
  });
});

describe('the strategy: conditions', () => {
  it('a main skill for packs and one for few enemies: the sheet works out both fights, and the sim picks by the fight', () => {
    const b = withStrategy(build(['crushingBlow', 'flameBolt']), {
      0: { role: 'main', when: 'single' },
      1: { role: 'main', when: 'pack' },
    });
    const c = new Character(b, {});
    expect(c.mainFor('pack').skill.id).toBe('flameBolt');
    expect(c.mainFor('boss').skill.id).toBe('crushingBlow');
    const s = c.sheet();
    expect(s.scenarios!.pack).not.toBeCloseTo(s.scenarios!.boss, 3);
    expect(sheetDps(s)).toBeCloseTo(0.7 * s.scenarios!.pack + 0.3 * s.scenarios!.boss, 6);
    // A lone dummy is no pack.
    const { world } = createDummyWorld(b, { distance: 1.6, maxTime: 60 });
    const u = uses(world, 10);
    expect(u.flameBolt ?? 0).toBe(0);
    expect(u.crushingBlow).toBeGreaterThan(3);
  });

  it('an emergency guard waits for low life', () => {
    const b = withStrategy(build(['crushingBlow', 'ironHide']), {
      1: { role: 'emergency', life: 0.5 },
    });
    const { world } = createDummyWorld(b, { distance: 1.6, maxTime: 60 });
    // The dummy arena keeps life full: life is set by hand here.
    world.opts.freeResources = false;
    expect(uses(world, 5).ironHide ?? 0).toBe(0);
    world.player.life = world.player.def.maxLife * 0.3;
    expect(uses(world, 1).ironHide).toBe(1);
  });
});

describe('the strategy: target and spacing', () => {
  it('rares first: a rare a little further off is fought before a nearer normal enemy', () => {
    for (const [target, want] of [
      ['nearest', 'normal'],
      ['rares', 'rare'],
    ] as const) {
      const b = { ...build(['crushingBlow']), strategy: { target } };
      const { world } = createDummyWorld(b, { distance: 8.5, maxTime: 60 });
      const near = put(world, 0, 4);
      const rare = put(world, 0, -7, { rarity: 'rare' });
      stepWorld(world);
      expect(world.ai.targetId).toBe(want === 'rare' ? rare.id : near.id);
    }
  });

  it('weakest: the enemy with the least of its life left goes first', () => {
    const b = { ...build(['crushingBlow']), strategy: { target: 'lowest' as const } };
    const { world } = createDummyWorld(b, { distance: 8.5, maxTime: 60 });
    put(world, 0, 3);
    const hurt = put(world, 0, -6);
    hurt.life = hurt.def.maxLife * 0.2;
    stepWorld(world);
    expect(world.ai.targetId).toBe(hurt.id);
  });

  it('stick to target: the target is kept when another enemy comes nearer', () => {
    const results: Record<string, boolean> = {};
    for (const target of ['nearest', 'stick'] as const) {
      const b = { ...build(['crushingBlow']), strategy: { target } };
      const { world } = createDummyWorld(b, { distance: 8.5, maxTime: 60 });
      const first = put(world, 0, 5);
      stepWorld(world);
      expect(world.ai.targetId).toBe(first.id);
      put(world, 1.5, 0);
      for (let i = 0; i < 12; i++) stepWorld(world);
      results[target] = world.ai.targetId === first.id;
    }
    expect(results).toEqual({ nearest: false, stick: true });
  });

  it('a kiting archer steps back from an enemy that comes close; one that holds its ground does not', () => {
    const kites: Record<string, number> = {};
    for (const spacing of ['kite', 'hold'] as const) {
      const run = newRun('strider', 1);
      const uid = () => run.nextUid++;
      const b = run.build;
      b.level = 40;
      b.equipment.mainHand = makeItem(uid, 'bow_3', 40, 1);
      b.equipment.mainHand.sockets = [makeGem(uid, 'splitVolley')];
      b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
      delete b.equipment.offHand;
      b.strategy = { spacing };
      const { world } = createDummyWorld(b, { distance: 6, maxTime: 60 });
      put(world, 2, 0, { level: 1 });
      uses(world, 3);
      kites[spacing] = world.stats.kites;
    }
    expect(kites.kite).toBeGreaterThan(0);
    expect(kites.hold).toBe(0);
  });
});
