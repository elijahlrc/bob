import { describe, expect, it } from 'vitest';
import { FAMILY_DEFS } from './affixes';
import { BUFFS } from './buffs';
import { ALL_GEMS } from './gems';
import { STAT_TEXT } from './statText';
import { UNIQUES } from './uniques';

/** Every stat that a gem, unique, affix or buff uses has text (or a generated phrase), so no raw stat id reaches a player. */
const GENERATED = /^(convert|convertSkill|gain)\.\w+\.\w+$/;

function statsOf(mods: { stat: string }[]): string[] {
  return mods.map((m) => m.stat);
}

describe('stat text', () => {
  it('covers every stat in the data', () => {
    const used = new Set<string>();
    for (const g of ALL_GEMS) if ('mods' in g) for (const s of statsOf(g.mods)) used.add(s);
    for (const u of UNIQUES) for (const s of statsOf(u.mods)) used.add(s);
    for (const a of FAMILY_DEFS) for (const s of statsOf(a.mods)) used.add(s);
    for (const b of Object.values(BUFFS)) for (const s of statsOf(b.mods)) used.add(s);
    const missing = [...used].filter(
      (s) =>
        !STAT_TEXT[s] &&
        !GENERATED.test(s) &&
        s !== 'damage' &&
        s !== 'damage.min' &&
        s !== 'damage.max',
    );
    expect(missing).toEqual([]);
  });
});
