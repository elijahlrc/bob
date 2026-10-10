import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { makeGem, makeItem } from '../gen/items';
import { newRun, type RunState } from './run';
import { moveSkill, resetStrategy, setStrategyOption, setTactic } from './strategy';

function run3(): RunState {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const body = makeItem(uid, 'body_ar_1', 30, 1);
  body.sockets = ['crushingBlow', 'flameBolt', 'suddenFrost'].map((g) => makeGem(uid, g));
  run.build = { ...run.build, level: 30, equipment: { ...run.build.equipment, body } };
  run.build.primaryGem = body.sockets[0]!.uid;
  return run;
}

const uids = (run: RunState) => run.build.equipment.body!.sockets.map((g) => g!.uid);

describe('strategy edits (the Strategy tab)', () => {
  it('a setting put back to its default leaves no trace', () => {
    const run = run3();
    const [, bolt] = uids(run);
    const before = run.build;
    setTactic(run, bolt, { role: 'off' });
    expect(run.build).not.toBe(before);
    expect(run.build.strategy).toEqual({ skills: { [String(bolt)]: { role: 'off' } } });
    setTactic(run, bolt, { role: undefined });
    expect(run.build.strategy).toBeUndefined();
    setStrategyOption(run, { spacing: 'kite' });
    expect(run.build.strategy).toEqual({ spacing: 'kite' });
    resetStrategy(run);
    expect(run.build.strategy).toBeUndefined();
  });

  it('moving a skill swaps it with its neighbour and the character follows the order', () => {
    const run = run3();
    const before = new Character(run.build, {}).rotation.map((e) => e.choice.gemUid!);
    expect(before).toHaveLength(2);
    moveSkill(run, before, before[1], -1);
    const after = new Character(run.build, {}).rotation.map((e) => e.choice.gemUid!);
    expect(after).toEqual([before[1], before[0]]);
    // At the top already: nothing moves.
    moveSkill(run, after, after[0], -1);
    expect(new Character(run.build, {}).rotation.map((e) => e.choice.gemUid!)).toEqual(after);
  });
});
