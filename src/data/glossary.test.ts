import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { statTotals } from '../calc/statTotals';
import { CLASSES } from './classes';
import { GLOSSARY, glossFor } from './glossary';
import { newRun } from '../run/run';
import { withStarterGems } from '../run/starterGems';

/** Every line of the Character tab says what it is (docs/NEWPLAYER.md N13). */
describe('the glossary', () => {
  for (const cls of CLASSES)
    it(`${cls.id}: every row of the Character tab has a line`, () => {
      const run = withStarterGems(newRun(cls.id, 1));
      run.build.level = 30;
      const ch = new Character(run.build);
      for (const t of statTotals(ch.db, ch.configConds, ch.statValue))
        expect(glossFor(t.mod.stat), t.mod.stat).toBeTruthy();
    });

  it('each line is one short sentence or two', () => {
    for (const [term, text] of Object.entries(GLOSSARY)) {
      expect(text.length, term).toBeLessThanOrEqual(130);
      expect(text.endsWith('.'), term).toBe(true);
    }
  });
});
