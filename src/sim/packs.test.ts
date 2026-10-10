import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { MONSTER_TYPES, type MonsterModId, type MonsterTypeId } from '../data/monsters';
import { patternText, phaseTexts } from '../data/phases';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { startAction } from './actions';
import { killActor } from './combat';
import { createDummyWorld } from './dummy';
import { damageMult, speedMult } from './factions';
import { tickPhases } from './phases';
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
  pack = 0,
): Actor {
  const spec: MonsterSpec = {
    type,
    variant: 'none',
    rarity: 'normal',
    level: 30,
    mods: [],
    ...over,
  };
  const m = spawnMonster(w, spec, w.player.x + dx, w.player.y + dy, 0, pack, type);
  m.state = 'chase';
  return m;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

describe('rhythms (docs/ROSTER.md 6.5)', () => {
  it('a type that strikes in a rhythm takes the beats of it in turn, each with the damage to match', () => {
    const w = arena();
    const m = put(w, 'flagellant', 3);
    const base = m.mon!.profile(0).useTime;
    const durations: number[] = [];
    const mults: number[] = [];
    for (let i = 0; i < 6; i++) {
      startAction(w, m, 'monster', m.mon!.profile(0), w.player);
      durations.push(m.action!.duration / base);
      mults.push(m.patMult);
      m.action = null;
    }
    const pat = MONSTER_TYPES.flagellant.pattern!;
    expect(durations.map((d) => +d.toFixed(3))).toEqual([...pat, ...pat].map((d) => +d.toFixed(3)));
    expect(mults).toEqual([...pat, ...pat]);
    // The rhythm keeps the pace: the mean beat is a whole one, and the damage follows the time.
    expect(pat.reduce((a, b) => a + b, 0) / pat.length).toBeCloseTo(1, 1);
    m.patMult = pat[2];
    expect(damageMult(m)).toBeGreaterThan(1.8);
    expect(patternText(pat)).toContain('quick');
    expect(patternText(pat)).toContain('heavy');
    expect(patternText(undefined)).toBeNull();
  });
});

describe('phases (docs/ROSTER.md 6.5)', () => {
  it('a type enrages at a share of its life: faster, harder-hitting, and only once', () => {
    const w = arena();
    const m = put(w, 'flagellant', 14);
    expect(m.enraged).toBe(false);
    const s0 = speedMult(m);
    const d0 = damageMult(m);
    m.life = m.def.maxLife * 0.49;
    tickPhases(w, m);
    expect(m.enraged).toBe(true);
    expect(speedMult(m) / s0).toBeCloseTo(1.3, 5);
    expect(damageMult(m) / d0).toBeCloseTo(1.25, 5);
    expect(m.phaseMask).toBe(1);
  });

  it('a summoner runs when hurt, then comes back', () => {
    const w = arena();
    const hag = put(w, 'handler', 10);
    hag.life = hag.def.maxLife * 0.29;
    tickPhases(w, hag);
    expect(hag.fleeT).toBeGreaterThan(3);
    const d0 = Math.hypot(hag.x - w.player.x, hag.y - w.player.y);
    run(w, 2);
    expect(Math.hypot(hag.x - w.player.x, hag.y - w.player.y)).toBeGreaterThan(d0 + 1);
    run(w, 5);
    expect(hag.fleeT).toBeLessThanOrEqual(0);
  });

  it('a type can break into others at a share of its life', () => {
    const w = arena();
    const m = put(w, 'warrior', 12);
    const type = MONSTER_TYPES.warrior;
    type.phases = [{ at: 0.5, do: 'split', into: 'gnawer', count: 3 }];
    try {
      const before = w.actors.filter((a) => a.alive && a.mon?.spec.type === 'gnawer').length;
      m.life = m.def.maxLife * 0.4;
      tickPhases(w, m);
      tickPhases(w, m);
      expect(w.actors.filter((a) => a.alive && a.mon?.spec.type === 'gnawer').length - before).toBe(
        3,
      );
    } finally {
      delete type.phases;
    }
  });

  it('phases have words', () => {
    expect(phaseTexts(MONSTER_TYPES.flagellant.phases).join(' ')).toContain('Enrages at 50%');
    expect(phaseTexts(MONSTER_TYPES.handler.phases).join(' ')).toContain('Runs from you');
    expect(phaseTexts(undefined)).toEqual([]);
  });
});

describe('packs that fight as packs (docs/ROSTER.md 6.7)', () => {
  it('a flanking pack spreads round the character instead of queueing', () => {
    const w = arena();
    const boars = [0, 1, 2, 3, 4].map((i) => put(w, 'boar', 15, i * 0.3 - 0.6, {}, 7));
    let spread = 0;
    for (let i = 0; i < 180; i++) {
      stepWorld(w);
      const ys = boars.map((b) => b.y);
      spread = Math.max(spread, Math.max(...ys) - Math.min(...ys));
    }
    expect(spread).toBeGreaterThan(2.5);
  });

  it('a ranged member keeps behind the front of its pack', () => {
    const w = arena();
    const front = put(w, 'guard', 12, 0, {}, 3);
    front.stationary = true;
    const mage = put(w, 'mage', 18, 0, {}, 3);
    run(w, 8);
    expect(mage.x).toBeGreaterThan(front.x - 0.5);
  });

  it('when a leader falls the rest of its pack reacts by faction', () => {
    const w = arena();
    const handler = put(w, 'handler', 12, 0, {}, 1);
    const hounds = [0, 1, 2].map((i) => put(w, 'hound', 13, i, {}, 1));
    killActor(w, handler);
    for (const h of hounds) expect(h.buffT).toBeGreaterThanOrEqual(6);
    const censer = put(w, 'censer', 12, 0, {}, 2);
    const flock = [0, 1, 2].map((i) => put(w, 'flagellant', 13, i, {}, 2));
    killActor(w, censer);
    for (const f of flock) expect(f.stunT).toBeGreaterThanOrEqual(0.7);
    const nest = put(w, 'nest', 12, 0, {}, 4);
    const swarm = [0, 1, 2].map((i) => put(w, 'gnawer', 13, i, {}, 4));
    killActor(w, nest);
    for (const g of swarm) expect(g.fleeT).toBeGreaterThanOrEqual(2.5);
    // A pack of two has no one to rally: nothing happens.
    const lone = put(w, 'handler', 12, 0, {}, 5);
    const one = put(w, 'hound', 13, 0, {}, 5);
    killActor(w, lone);
    expect(one.buffT).toBe(0);
  });
});

describe('mods that apply to every faction (docs/ROSTER.md 7.5)', () => {
  const rare = (mods: MonsterModId[]): Partial<MonsterSpec> => ({ rarity: 'rare', mods });

  it('a Warding Pulse throws the character back, and can be stepped out of', () => {
    const w = arena();
    const m = put(w, 'warrior', 2.5, 0, rare(['wardingPulse']));
    m.pulseT = 0.05;
    for (let i = 0; i < 5; i++) stepWorld(w);
    const ring = w.effects.find((e) => e.push);
    expect(ring).toBeDefined();
    expect(ring!.radius).toBe(3);
    m.alive = false;
    const x0 = w.player.x;
    run(w, 1.2);
    // It lands where it went off, a few tiles on the character's side of it, and the character is thrown clear.
    expect(Math.abs(w.player.x - x0)).toBeGreaterThan(1.5);
  });

  it('a Mirrored monster has a twin, and the survivor is made whole unless it follows within three seconds', () => {
    const w = arena();
    const m = put(w, 'warrior', 14, 0, rare(['mirrored']));
    stepWorld(w);
    expect(m.mirrorId).not.toBe(0);
    const twin = w.actors.find((a) => a.id === m.mirrorId)!;
    expect(twin.mon!.spec.mods).not.toContain('mirrored');
    twin.life = twin.def.maxLife * 0.5;
    killActor(w, m);
    expect(twin.mirrorT).toBe(3);
    run(w, 3.3);
    expect(twin.life).toBe(twin.def.maxLife);
    // Killed together, they stay dead.
    const w2 = arena();
    const a = put(w2, 'warrior', 14, 0, rare(['mirrored']));
    stepWorld(w2);
    const b = w2.actors.find((x) => x.id === a.mirrorId)!;
    killActor(w2, a);
    run(w2, 1);
    killActor(w2, b);
    run(w2, 3);
    expect(b.alive).toBe(false);
  });
});
