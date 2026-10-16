import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import { TYPE_SIDEARMS, encounterTexts } from '../data/encounters';
import type { MonsterModId, MonsterTypeId, Variant } from '../data/monsters';
import { STEPS, STEP_INTERVAL } from '../data/steps';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { killActor } from './combat';
import { createDummyWorld } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A level 40 character in an open arena, held on the spot, with no dummies. */
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
  world.sides[0].opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

function put(
  w: World,
  type: MonsterTypeId,
  dx: number,
  o: Partial<MonsterSpec> & { variant?: Variant } = {},
): Actor {
  const spec: MonsterSpec = { type, variant: 'none', rarity: 'normal', level: 30, mods: [], ...o };
  const m = spawnMonster(w, spec, w.player.x + dx, w.player.y, 0, 0, type);
  m.state = 'chase';
  return m;
}

/** Keep it where it was put: left to walk, it is at arm's length before its first step. */
const hold = (m: Actor): Actor => {
  m.stationary = true;
  return m;
};

const blinking = (w: World, variant: Variant, type: MonsterTypeId = 'warrior'): Actor =>
  hold(put(w, type, 8, { rarity: 'magic', variant, mods: ['blinking' as MonsterModId] }));

const dist = (a: Actor, b: Actor) => Math.hypot(a.x - b.x, a.y - b.y);
const marks = (w: World, name: string) => w.effects.filter((e) => e.label === name);

/** Step the world until `done`, at most `seconds` of it. */
function until(w: World, seconds: number, done: () => boolean): boolean {
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(w);
    if (done()) return true;
  }
  return false;
}

describe('the Blinking affix', () => {
  it('marks the spot where the character stands, holds still, then lands on it', () => {
    const w = arena();
    const m = blinking(w, 'fire');
    const home = { x: m.x, y: m.y };
    expect(until(w, STEP_INTERVAL + 1, () => marks(w, 'Cinder Step').length > 0)).toBe(true);
    const mark = marks(w, 'Cinder Step')[0];
    expect(mark.x).toBeCloseTo(w.player.x, 5);
    expect(mark.y).toBeCloseTo(w.player.y, 5);
    expect(mark.leaves?.kind).toBe('burning');
    // It has not moved while the warning lasts.
    for (let i = 0; i < 20; i++) stepWorld(w);
    expect(m.x).toBeCloseTo(home.x, 1);
    // And after it, it is beside the character.
    expect(until(w, 2, () => dist(m, w.player) < 1.6)).toBe(true);
    // The burst that came with it hurt: the recap names the spell.
    expect(until(w, 1, () => w.sides[0].dmgLog.some((d) => d.name === 'Cinder Step'))).toBe(true);
  });

  it('the spell is the monster’s element: Quick Step, Cinder Step, Rime Step, Bolt Step', () => {
    for (const [variant, name] of [
      ['none', 'Quick Step'],
      ['fire', 'Cinder Step'],
      ['cold', 'Rime Step'],
      ['lightning', 'Bolt Step'],
    ] as const) {
      const w = arena();
      blinking(w, variant);
      expect(
        until(w, STEP_INTERVAL + 1, () => marks(w, name).length > 0),
        name,
      ).toBe(true);
    }
  });

  it('a Bolt Step bursts where the monster stood as well', () => {
    const w = arena();
    const m = blinking(w, 'lightning');
    const from = { x: m.x, y: m.y };
    expect(until(w, STEP_INTERVAL + 1, () => marks(w, 'Bolt Step').length > 0)).toBe(true);
    const ms = marks(w, 'Bolt Step');
    expect(ms.length).toBe(2);
    expect(ms.some((e) => Math.hypot(e.x - from.x, e.y - from.y) < 0.01)).toBe(true);
    expect(ms.some((e) => Math.hypot(e.x - w.player.x, e.y - w.player.y) < 0.01)).toBe(true);
  });

  it('a stun while it gathers breaks the step and wipes the marks off the ground', () => {
    const w = arena();
    const m = blinking(w, 'cold');
    const x0 = m.x;
    expect(until(w, STEP_INTERVAL + 1, () => marks(w, 'Rime Step').length > 0)).toBe(true);
    m.stunT = 2;
    stepWorld(w);
    expect(marks(w, 'Rime Step').length).toBe(0);
    expect(m.x).toBeCloseTo(x0, 1);
  });

  it('a monster that dies while it gathers leaves no mark behind', () => {
    const w = arena();
    const m = blinking(w, 'fire');
    expect(until(w, STEP_INTERVAL + 1, () => marks(w, 'Cinder Step').length > 0)).toBe(true);
    killActor(w, m);
    stepWorld(w);
    expect(marks(w, 'Cinder Step').length).toBe(0);
  });

  it('does not step from too close, and waits its time again after a step', () => {
    const w = arena();
    const m = put(w, 'warrior', 2, { rarity: 'magic', mods: ['blinking' as MonsterModId] });
    for (let i = 0; i < 60 * 12; i++) {
      stepWorld(w);
      expect(marks(w, 'Quick Step').length).toBe(0);
    }
    expect(m.alive).toBe(true);
  });

  it('a type that keeps its own timers (a Hexer) still steps', () => {
    const w = arena();
    blinking(w, 'cold', 'hexer');
    expect(until(w, STEP_INTERVAL + 2, () => marks(w, 'Rime Step').length > 0)).toBe(true);
  });
});

describe('teleports as a sidearm', () => {
  const types = (Object.keys(TYPE_SIDEARMS) as MonsterTypeId[]).filter(
    (id) => TYPE_SIDEARMS[id]!.step,
  );

  it('each type that has one says what it does', () => {
    for (const id of types) {
      const s = TYPE_SIDEARMS[id]!;
      expect(s.name, id).toBe(STEPS[s.step!].name);
      expect(encounterTexts(id).join(' '), id).toContain(STEPS[s.step!].name);
    }
  });

  it('a Wisp that is ready marks the spot and flickers onto the character', () => {
    const w = arena();
    const m = put(w, 'wisp', 9);
    m.enc!.sideT = 0;
    expect(until(w, 2, () => marks(w, 'Bolt Step').length > 0)).toBe(true);
    expect(until(w, 2, () => dist(m, w.player) < 1.6)).toBe(true);
    // Then it waits its time again.
    expect(m.enc!.sideT).toBeGreaterThan(0);
  });

  it('it is not used from inside its range', () => {
    const w = arena();
    const near = put(w, 'wisp', 2);
    near.enc!.sideT = 0;
    for (let i = 0; i < 120; i++) stepWorld(w);
    expect(marks(w, 'Bolt Step').length).toBe(0);
  });
});
