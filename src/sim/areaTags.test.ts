import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { ACTIVE_GEMS } from '../data/gems';
import { createDummyWorld } from './dummy';
import { buildFor, classFor, weaponFor } from './gemKit';
import { stepWorld } from './world';

/** The areas the player's skills make carry their skill, and a later pulse of one that pulses says so (the renderer draws a motif lighter). */
function explodes(id: string, seconds: number) {
  const def = ACTIVE_GEMS.find((g) => g.id === id)!;
  const b = buildFor([id], weaponFor(def), classFor(def.attr));
  void new Character(b, { areaLevel: 50 });
  const { world } = createDummyWorld(b, { distance: 2.5 });
  world.opts.freeResources = true;
  world.opts.godMode = true;
  const out: { skill?: string; pulse?: boolean; r: number }[] = [];
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(world);
    for (const e of world.events)
      if (e.t === 'explode') out.push({ skill: e.skill, pulse: e.pulse, r: e.r });
  }
  return out;
}

describe('the skill on an area', () => {
  it('a burst names its skill', () => {
    const list = explodes('quakeBlow', 3);
    expect(list.length).toBeGreaterThan(0);
    for (const e of list) expect(e.skill).toBe('quakeBlow');
  });

  it('a zone that pulses: the first pulse is the blow, the later ones are pulses', () => {
    const list = explodes('emberHail', 1.2).filter((e) => e.r >= 1);
    expect(list[0].pulse).toBeFalsy();
    expect(list.slice(1).some((e) => e.pulse)).toBe(true);
  });

  it('a frost orb and a drifting orb throw their areas as pulses', () => {
    const frost = explodes('hoarfrostMote', 6).filter((e) => e.skill === 'hoarfrostMote');
    expect(frost.length).toBeGreaterThan(0);
    expect(frost.every((e) => e.pulse)).toBe(true);
    const drift = explodes('driftingStorm', 6).filter((e) => e.skill === 'driftingStorm');
    expect(drift.length).toBeGreaterThan(0);
    expect(drift.every((e) => e.pulse)).toBe(true);
  });
});
