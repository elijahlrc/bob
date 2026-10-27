import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { statTotals } from '../calc/statTotals';
import { mod } from '../mods/types';
import { newRun } from '../run/run';
import { withStarterGems } from '../run/starterGems';
import { cfgFor } from '../run/bot';
import { armourTip, ehpTip, evasionTip, resistTip, totalTip } from './sheetMath';

/** The Character tab's tips work their numbers out as the calc does (src/ui/sheetMath.ts). */

const pc = (v: number) => `${Math.round(v * 100)}%`;

function character() {
  const run = withStarterGems(newRun('vanguard', 1));
  run.build = { ...run.build, level: 30 };
  run.map = 30;
  const ch = new Character(run.build, cfgFor(run));
  return { ch, s: ch.sheet() };
}

describe('the Character tab tips', () => {
  it('a modifier line shows its increases, its more multipliers and the product the row shows', () => {
    const t = {
      section: 'damage' as const,
      mod: mod('damage', 'inc', 0, { damageTypes: ['fire'] }),
      mult: 1.45 * 1.2,
      inc: 45,
      more: 1.2,
    };
    expect(totalTip(t)).toContain('(1 + 45%) × 1.20 = ×1.74');
  });

  it('armour, evasion and effective HP come to the numbers the tab shows', () => {
    const { ch, s } = character();
    const mit = ch.mitigation();
    if (ch.defence().physReduction === 0)
      expect(armourTip(ch, s)).toContain(`= ${pc(mit.physReduction)}`);
    expect(evasionTip(ch, s)).toContain(`you evade ${pc(mit.evade)}`);
    expect(ehpTip(s)).toContain(`= ${Math.round(s.ehp).toLocaleString()}.`);
  });

  it('a resistance over its maximum says the excess counts for nothing', () => {
    expect(resistTip('Fire', 90, 75, '')).toContain('(1 − 75%) = ×0.25');
    expect(resistTip('Fire', 90, 75, '')).toContain('15% over the maximum');
    expect(resistTip('Cold', -30, 75, '')).toContain('(1 + 30%) = ×1.30');
  });

  it('every modifier line of a character gets a tip that ends in its multiplier', () => {
    const { ch } = character();
    for (const t of statTotals(ch.db, ch.configConds, ch.statValue))
      expect(totalTip(t).endsWith(`×${t.mult.toFixed(2)}`)).toBe(true);
  });
});
