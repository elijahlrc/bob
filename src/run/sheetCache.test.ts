import { describe, expect, it } from 'vitest';
import { makeGem } from '../gen/items';
import { clearSheetCache, sheetOf } from './bot';
import { newRun } from './run';
import { setStrategyOption } from './strategy';
import { withStarterGems } from './starterGems';

/** The sheets the Skills and Items tabs ask for again and again are remembered by build (docs/PERFORMANCE.md). */
describe('sheetOf remembers sheets by build', () => {
  const setup = () => {
    clearSheetCache();
    const run = withStarterGems(newRun('reaver', 1));
    run.build.level = 20;
    return run;
  };

  it('gives the sheet it worked out before for the same build, whatever object it is', () => {
    const run = setup();
    const a = sheetOf(run);
    expect(sheetOf(run)).toBe(a);
    // A copy of the build (the Skills tab makes one for each place a gem could go) is the same build.
    expect(sheetOf(run, { ...run.build, equipment: { ...run.build.equipment } })).toBe(a);
  });

  it('works a new one out when a gem, the strategy or the level is different', () => {
    const run = setup();
    const a = sheetOf(run);
    const body = run.build.equipment.body!;
    const sockets = [...body.sockets];
    sockets[sockets.length - 1] = makeGem(() => run.nextUid++, 'kindle');
    const other = sheetOf(run, {
      ...run.build,
      equipment: { ...run.build.equipment, body: { ...body, sockets } },
    });
    expect(other).not.toBe(a);
    setStrategyOption(run, { spacing: 'kite' });
    expect(sheetOf(run)).not.toBe(a);
    expect(sheetOf(run, { ...run.build, level: 21 })).not.toBe(a);
  });

  it('keeps the sheets of runs with another difficulty apart', () => {
    const run = setup();
    const a = sheetOf(run);
    const harder = {
      ...run,
      difficulty: { ...run.difficulty, scaling: run.difficulty.scaling + 1 },
    };
    expect(sheetOf(harder)).not.toBe(a);
  });

  it('forgets what it was asked to', () => {
    const run = setup();
    const a = sheetOf(run);
    clearSheetCache();
    const b = sheetOf(run);
    expect(b).not.toBe(a);
    expect(b).toEqual(a);
  });
});
