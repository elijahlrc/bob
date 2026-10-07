import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { THEMES, themeDef } from '../data/themes';
import { mod } from '../mods/types';
import { cfgFor, chooseTheme, scoreBuild } from './bot';
import { newRun, type RunState } from './run';
import { scoreTheme, themeThreat } from './threat';

/** A run whose main-hand weapon carries extra mods. */
function withMods(run: RunState, mods: ReturnType<typeof mod>[]): RunState {
  const main = run.build.equipment.mainHand!;
  const next: RunState = structuredClone(run);
  next.build.equipment.mainHand = { ...main, uniqueMods: [...(main.uniqueMods ?? []), ...mods] };
  return next;
}

describe('the bot plans with steady-state conditions (EXPANSION 5.10)', () => {
  const run = newRun('vanguard', 1);
  const base = scoreBuild(run, run.build);

  it('a "more damage if you have killed recently" mod raises the score', () => {
    const cond = mod('damage', 'more', 50, { condition: { id: 'killedRecently' } });
    const r = withMods(run, [cond]);
    expect(scoreBuild(r, r.build)).toBeGreaterThan(base * 1.05);
  });

  it('counts less than the same mod without the condition, because boss fights have no kills', () => {
    const cond = mod('damage', 'more', 50, { condition: { id: 'killedRecently' } });
    const plain = mod('damage', 'more', 50);
    const a = withMods(run, [cond]);
    const b = withMods(run, [plain]);
    expect(scoreBuild(a, a.build)).toBeLessThan(scoreBuild(b, b.build));
  });

  it('clearing assumes recent kills and hits; a boss fight assumes no kills', () => {
    const ch = new Character(run.build, cfgFor(run));
    // Condition bits exist for the conditions a character's mods use: register the three under test.
    for (const id of ['killedRecently', 'hitRecently', 'usedFlaskRecently'] as const)
      ch.cond.bit(id);
    const bit = (id: 'killedRecently' | 'hitRecently' | 'usedFlaskRecently') => ch.cond.peek(id);
    const clearing = ch.steadyMask('clearing');
    const boss = ch.steadyMask('boss');
    expect(clearing & bit('killedRecently')).not.toBe(0);
    expect(boss & bit('killedRecently')).toBe(0);
    for (const m of [clearing, boss]) {
      expect(m & bit('hitRecently')).not.toBe(0);
      expect(m & bit('usedFlaskRecently')).not.toBe(0);
    }
  });

  it('the sheet follows the config: no steady conditions, no bonus', () => {
    const cond = mod('damage', 'more', 50, { condition: { id: 'killedRecently' } });
    const r = withMods(run, [cond]);
    const off = new Character(r.build, { areaLevel: 1 }).sheet().skill.totalDps;
    const on = new Character(r.build, { areaLevel: 1, steady: 'clearing' }).sheet().skill.totalDps;
    expect(on).toBeGreaterThan(off * 1.3);
  });
});

describe('theme threat and the theme-aware bot', () => {
  it('damage mixes sum to 1 and lean the way the theme does', () => {
    for (const t of THEMES) {
      const th = themeThreat(t);
      expect(th.mix.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
      expect(Object.values(th.variants).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    }
    const fire = themeThreat(themeDef('ashenCrypt')).mix[3];
    const cold = themeThreat(themeDef('rimedCatacomb')).mix[2];
    const plain = themeThreat(themeDef('bonePits'));
    expect(fire).toBeGreaterThan(themeThreat(themeDef('rimedCatacomb')).mix[3]);
    expect(cold).toBeGreaterThan(themeThreat(themeDef('ashenCrypt')).mix[2]);
    expect(plain.mix[0]).toBeGreaterThan(0.6);
  });

  it('a build with high cold resistance does better against a cold theme than a fire one', () => {
    const run = withMods(newRun('vanguard', 1), [mod('resist.cold', 'base', 75)]);
    run.map = 30;
    const ch = new Character(run.build, cfgFor(run));
    const rimed = scoreTheme(ch, themeDef('rimedCatacomb'), 'clearing');
    const ashen = scoreTheme(ch, themeDef('ashenCrypt'), 'clearing');
    expect(rimed.ehp).toBeGreaterThan(ashen.ehp);
    expect(rimed.value).toBeGreaterThan(ashen.value);
    run.nextThemes = ['ashenCrypt', 'rimedCatacomb'];
    expect(chooseTheme(run, 'best')).toBe('rimedCatacomb');
    expect(chooseTheme(run, 'first')).toBe('ashenCrypt');
  });
});
