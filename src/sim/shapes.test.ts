import { describe, expect, it } from 'vitest';
import { DEFAULT_ATTACK, type SkillDef } from '../calc/gems';
import { buildProfile, type SkillProfile } from '../calc/skill';
import type { SkillBehaviour } from '../data/gems';
import { ModDB } from '../mods/modDb';
import { newRun } from '../run/run';
import { fire, segmentDist, tickSkillZones, updateProjectiles } from './actions';
import { createDummyWorld } from './dummy';
import type { Action, Actor, World } from './types';

/** The new skill shapes (COVERAGE C2): nova, slam, beam, ground zones and returning projectiles. */

const spell = (behaviour: SkillBehaviour, extra: Partial<SkillDef> = {}): SkillDef => ({
  ...DEFAULT_ATTACK,
  id: 'testShape',
  type: 'spell',
  tags: ['spell'],
  types: ['spell'],
  behaviour,
  spellDamage: [{ type: 'fire', min: 10, max: 10 }],
  effectiveness: 100,
  castTime: 0.5,
  crit: 0,
  ...extra,
});

function profileOf(skill: SkillDef): SkillProfile {
  return buildProfile({
    skill,
    db: new ModDB(),
    hands: [],
    extraTags: [],
    costMult: 1,
    conds: 0,
    statValue: () => 0,
  });
}

function arena() {
  const run = newRun('mystic', 1);
  const { world, dummy } = createDummyWorld(run.build, { distance: 3 });
  world.opts.godMode = true;
  return { w: world, player: world.player, first: dummy };
}

/** Another target-like actor at a spot, copied from the first. */
function enemyAt(w: World, like: Actor, x: number, y: number): Actor {
  const a: Actor = {
    ...like,
    ail: { ...like.ail, ignites: [], bleeds: [], poisons: [] },
    hexes: [],
    impales: [],
    resShift: [0, 0, 0, 0, 0],
    leechLife: [],
    leechMana: [],
  };
  a.id = w.nextId++;
  a.x = x;
  a.y = y;
  a.life = a.def.maxLife;
  w.actors.push(a);
  return a;
}

function cast(w: World, p: SkillProfile, aim: Actor): void {
  const act: Action = {
    profile: p,
    which: 'primary',
    hand: 0,
    duration: 0,
    elapsed: 0,
    fired: true,
    echoes: 0,
    targetId: aim.id,
    aimX: aim.x,
    aimY: aim.y,
  };
  fire(w, w.player, act);
}

const damaged = (a: Actor) => a.life < a.def.maxLife;

describe('shapes: burst as a nova around the caster', () => {
  it('hits everything around the caster in its radius, and nothing outside', () => {
    const { w, player, first } = arena();
    first.x = player.x + 2;
    first.y = player.y;
    const behind = enemyAt(w, first, player.x - 2, player.y);
    const far = enemyAt(w, first, player.x + 6, player.y);
    cast(w, profileOf(spell({ kind: 'burst', radius: 3, origin: 'self' })), first);
    expect(damaged(first)).toBe(true);
    expect(damaged(behind)).toBe(true);
    expect(damaged(far)).toBe(false);
  });

  it('a burst on the target, as a slam does, hits around the target instead', () => {
    const { w, player, first } = arena();
    first.x = player.x + 5;
    first.y = player.y;
    const near = enemyAt(w, first, first.x + 1.5, first.y);
    const nearCaster = enemyAt(w, first, player.x + 1, player.y);
    cast(w, profileOf(spell({ kind: 'burst', radius: 2, reach: 6 })), first);
    expect(damaged(first)).toBe(true);
    expect(damaged(near)).toBe(true);
    expect(damaged(nearCaster)).toBe(false);
  });
});

describe('shapes: beam', () => {
  it('hits everything on the line, up to its length, and nothing beside it', () => {
    const { w, player, first } = arena();
    first.x = player.x + 3;
    first.y = player.y;
    const second = enemyAt(w, first, player.x + 7, player.y + 0.2);
    const beside = enemyAt(w, first, player.x + 5, player.y + 3);
    const beyond = enemyAt(w, first, player.x + 12, player.y);
    cast(w, profileOf(spell({ kind: 'beam', length: 9, width: 1 })), first);
    expect(damaged(first)).toBe(true);
    expect(damaged(second)).toBe(true);
    expect(damaged(beside)).toBe(false);
    expect(damaged(beyond)).toBe(false);
    expect(w.events.some((e) => e.t === 'beam')).toBe(true);
  });

  it('measures the distance from a point to a segment', () => {
    expect(segmentDist(2, 1, 0, 0, 4, 0)).toBeCloseTo(1);
    expect(segmentDist(-3, 0, 0, 0, 4, 0)).toBeCloseTo(3);
    expect(segmentDist(7, 4, 0, 0, 4, 0)).toBeCloseTo(5);
  });
});

describe('shapes: ground zones', () => {
  const rain = spell({ kind: 'ground', radius: 2, duration: 2, interval: 0.5 });
  const run = (w: World, seconds: number) => {
    for (let i = 0; i < Math.round(seconds * 60); i++) tickSkillZones(w, 1 / 60);
  };

  it('pulses at its interval for its duration, on what stands in it', () => {
    const { w, first } = arena();
    cast(w, profileOf(rain), first);
    expect(w.zones).toHaveLength(1);
    const before = first.life;
    run(w, 3);
    const pulses = Math.round((before - first.life) / 10);
    expect(pulses).toBe(4); // 2 s at one pulse every 0.5 s
    expect(w.zones).toHaveLength(0);
  });

  it('waits out its delay, then lands once when it is a blast', () => {
    const { w, first } = arena();
    cast(
      w,
      profileOf(spell({ kind: 'ground', radius: 2, duration: 0.5, interval: 0.5, delay: 1 })),
      first,
    );
    run(w, 0.9);
    expect(damaged(first)).toBe(false);
    run(w, 1.2);
    expect(first.life).toBeCloseTo(first.def.maxLife - 10);
  });

  it('as a strip it covers a line from the caster toward the target', () => {
    const { w, player, first } = arena();
    first.x = player.x + 4;
    first.y = player.y;
    const beside = enemyAt(w, first, player.x + 4, player.y + 4);
    cast(
      w,
      profileOf(spell({ kind: 'ground', radius: 1, duration: 1, interval: 0.5, line: 8 })),
      first,
    );
    run(w, 1.2);
    expect(damaged(first)).toBe(true);
    expect(damaged(beside)).toBe(false);
  });

  it('a profile counts the pulses a target that stays put takes', () => {
    expect(profileOf(rain).pulses).toBe(4);
    expect(profileOf(spell({ kind: 'beam', length: 5, width: 1 })).pulses).toBe(1);
  });
});

describe('shapes: returning projectiles', () => {
  it('turn around at the end of their range and hit again on the way back', () => {
    const { w, player, first } = arena();
    first.x = player.x + 3;
    first.y = player.y;
    const p = profileOf(
      spell({ kind: 'projectile', count: 1, spread: 0, range: 6, returns: true, pierce: 5 }),
    );
    p.pierce = 5;
    cast(w, p, first);
    expect(w.projectiles).toHaveLength(1);
    let hits = 0;
    let last = first.life;
    for (let i = 0; i < 60 * 4; i++) {
      updateProjectiles(w, 1 / 60);
      if (first.life < last) {
        hits++;
        last = first.life;
      }
    }
    expect(hits).toBe(2);
    expect(w.projectiles).toHaveLength(0);
  });
});
