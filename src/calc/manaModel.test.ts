import { describe, expect, it } from 'vitest';
import { uniqueDef } from '../data/uniques';
import { manaFactor } from '../run/bot';
import { buildFor } from '../sim/gemKit';
import { Character, type CharacterSheet } from './character';

/** Mana in the sheet and the bot (docs/MANA.md). */
describe('utility skills on the sheet', () => {
  const dps = (gems: string[]) =>
    new Character(buildFor(gems, 'wand_3', 'mystic'), { areaLevel: 50 }).sheet().skill.totalDps;

  it('a blink, a guard or a buff taken beside the primary skill leaves nearly all its damage', () => {
    const alone = dps(['frostLance']);
    for (const util of ['rimeStep', 'cinderStep', 'rotStride', 'deathlessCall', 'bloodSurgeCall'])
      expect(dps(['frostLance', util])).toBeGreaterThan(alone * 0.85);
  });

  it('a standing channel (Wither) still takes the time it takes', () => {
    // It is recast every third of a second, each time for the time it takes to cast; the main skill gets the rest. The sim agrees
    // (docs/SHEET-AUDIT.md): about 70% of the damage with an enemy in its reach.
    const alone = dps(['frostLance']);
    const withIt = dps(['frostLance', 'rotTouch']);
    expect(withIt).toBeLessThan(alone * 0.85);
    expect(withIt).toBeGreaterThan(alone * 0.55);
  });
});

describe('Lone Prism', () => {
  it('gives its mana only for hits by attacks', () => {
    const m = uniqueDef('lonePrism').mods.find((x) => x.stat === 'manaOnHit')!;
    expect(m.tags).toEqual(['attack']);
  });
});

describe('the bot weighs mana outside the sheet', () => {
  const sheet = (cost: number, sustain: number, mana = 100, isDefault = false) =>
    ({ skill: { cost, usesPerSec: 2, sustain, isDefault }, mana }) as CharacterSheet;

  it('counts a skill the character can pay for at full damage', () => {
    expect(manaFactor(sheet(10, 1))).toBe(1);
    expect(manaFactor(sheet(0, 0))).toBe(1);
    expect(manaFactor(sheet(50, 0, 100, true))).toBe(1);
  });

  it('counts less a skill it cannot pay for, never below the default attack, and more with a bigger pool', () => {
    const poor = manaFactor(sheet(50, 0.1, 100));
    expect(poor).toBeLessThan(0.5);
    expect(manaFactor(sheet(50, 0, 0))).toBeCloseTo(0.2);
    expect(manaFactor(sheet(50, 0.1, 1000))).toBeGreaterThan(poor);
  });
});
