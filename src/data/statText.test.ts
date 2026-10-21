import { describe, expect, it } from 'vitest';
import { FAMILY_DEFS } from './affixes';
import { BUFFS } from './buffs';
import { FLASK_AFFIXES, FLASK_BASES } from './flasks';
import { ALL_GEMS } from './gems';
import { STAT_TEXT } from './statText';
import { UNIQUES } from './uniques';
import { modText } from '../mods/text';
import type { Mod } from '../mods/types';

/** Every stat that a gem, unique, affix or buff uses has text (or a generated phrase), so no raw stat id reaches a player. */
const GENERATED = /^(convert|convertSkill|gain)\.\w+\.\w+$/;

const valueAt = (v: unknown): number =>
  Array.isArray(v) ? Number(v[0]) : typeof v === 'number' ? v : 1;

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
    for (const f of FLASK_AFFIXES) for (const s of statsOf(f.mods)) used.add(s);
    for (const f of FLASK_BASES) for (const s of statsOf(f.buff)) used.add(s);
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

  it('a mod limited to damage types names them', () => {
    const lost: string[] = [];
    const scan = (mods: readonly Mod[] | undefined, src: string) => {
      for (const m of mods ?? []) {
        // A lone added-damage bound is said together with its pair ("Adds 5 to 7 ...").
        if (!m.damageTypes?.length || m.stat === 'damage.min' || m.stat === 'damage.max') continue;
        const one = { ...m, value: valueAt(m.value) || 1 } as Mod;
        if (modText(one) === modText({ ...one, damageTypes: undefined }))
          lost.push(`${src}: ${m.stat}`);
      }
    };
    for (const g of ALL_GEMS) if ('mods' in g) scan(g.mods as Mod[], g.id);
    for (const u of UNIQUES) scan(u.mods as unknown as Mod[], u.id);
    for (const a of FAMILY_DEFS) scan(a.mods as unknown as Mod[], a.id);
    for (const [k, b] of Object.entries(BUFFS)) scan(b.mods, k);
    expect(lost).toEqual([]);
  });
});
