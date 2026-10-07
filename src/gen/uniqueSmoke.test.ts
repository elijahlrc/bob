import { describe, expect, it } from 'vitest';
import { computeCharacter } from '../calc/character';
import { itemBase } from '../data/bases';
import { UNIQUES } from '../data/uniques';
import { Rng } from '../core/rng';
import { newRun } from '../run/run';
import { slotsFor } from '../run/inventory';
import { modsText } from '../mods/text';
import { rollUnique } from './loot';

/**
 * A smoke test generated for every unique (COVERAGE 7.3): it rolls, equips and computes a sheet, and every one of its
 * mods reads as text. New uniques are covered the moment they exist.
 */
describe('every unique', () => {
  for (const u of UNIQUES) {
    it(`${u.id}: rolls, equips, computes a sheet and reads as text`, () => {
      const run = newRun('vanguard', 1);
      let id = 90000;
      const item = rollUnique(new Rng(7), () => id++, u, Math.max(u.level, 1));
      expect(itemBase(item.baseId)).toBeTruthy();
      const slot = slotsFor(item)[0];
      expect(slot).toBeTruthy();
      run.build.level = Math.max(u.level, 30);
      if (itemBase(item.baseId).hands === 2) delete run.build.equipment.offHand;
      run.build.equipment[slot] = item;
      const sheet = computeCharacter(run.build);
      for (const v of [sheet.life, sheet.mana, sheet.es, sheet.ehp, sheet.skill.totalDps])
        expect(Number.isFinite(v)).toBe(true);
      const text = modsText(item.uniqueMods ?? []);
      for (const line of text) expect(line).not.toMatch(/^[a-z]+\.[a-z.]+$/i);
    });
  }
});
