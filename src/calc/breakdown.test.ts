import { describe, expect, it } from 'vitest';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { dpsBreakdown } from './breakdown';
import { Character, scenarioDps } from './character';

function character(gems: string[]) {
  const run = newRun('mystic', 1);
  const uid = () => run.nextUid++;
  run.build.level = 30;
  const body = makeItem(uid, 'body_ar_1', 30, gems.length);
  body.sockets = gems.map((g) => makeGem(uid, g));
  run.build.equipment.body = body;
  run.build.primaryGem = body.sockets[0]!.uid;
  return new Character(run.build);
}

describe('DPS breakdown', () => {
  it('adds up to the damage the sheet reports', () => {
    const ch = character(['flameBolt', 'quickCast']);
    for (const scenario of ['pack', 'boss'] as const) {
      const b = dpsBreakdown(ch, scenario);
      expect(b.rows.length).toBeGreaterThan(0);
      expect(b.rows[0].name).toBe('Flame Bolt');
      expect(b.rows[0].usesPerSec).toBeGreaterThan(0);
      const sum = [...b.rows, ...b.minions].reduce((a, r) => a + r.dps, 0);
      expect(sum).toBeCloseTo(b.total, 6);
      expect(b.total).toBeCloseTo(scenarioDps(ch.sheet(undefined, scenario)), 6);
      for (const r of b.rows) {
        const hits = r.perType.reduce((a, v) => a + v, 0);
        expect(hits + r.overTime).toBeCloseTo(r.dps, 6);
      }
    }
  });

  it('gives each summon skill its own row, by type, adding up to the minions of the sheet', () => {
    const ch = character(['flameBolt', 'packHounds', 'broodSpiders']);
    for (const scenario of ['pack', 'boss'] as const) {
      const b = dpsBreakdown(ch, scenario);
      expect(b.minions.map((m) => m.name)).toEqual(['Pack of Hounds', 'Brood of Spiders']);
      for (const m of b.minions) {
        expect(m.dps).toBeGreaterThan(0);
        expect(m.perType.reduce((a, v) => a + v, 0)).toBeCloseTo(m.dps, 6);
      }
      const minions = b.minions.reduce((a, m) => a + m.dps, 0);
      expect(minions).toBeCloseTo(ch.sheet(undefined, scenario).minionDps, 6);
    }
  });
});
