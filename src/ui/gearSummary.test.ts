import { describe, expect, it } from 'vitest';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { gearSummary } from './Gear';

describe('the folded gear line on a phone', () => {
  it('counts what is worn, the gems in it and the sockets still free', () => {
    const run = newRun('mystic', 1);
    const uid = () => run.nextUid++;
    const worn = Object.keys(run.build.equipment).length;
    const body = makeItem(uid, 'body_ar_1', 1, 4);
    body.sockets = [makeGem(uid, 'flameBolt'), makeGem(uid, 'echoingCast'), null, null];
    run.build.equipment.body = body;
    for (const slot of Object.keys(run.build.equipment) as (keyof typeof run.build.equipment)[])
      if (slot !== 'body')
        run.build.equipment[slot] = { ...run.build.equipment[slot]!, sockets: [] };
    const line = gearSummary(run);
    expect(line).toContain(`${Math.max(worn, 1)} of 10 worn`);
    expect(line).toContain('2 gems');
    expect(line).toContain('2 free sockets');
  });

  it('says nothing about gems or sockets when there are none', () => {
    const run = newRun('mystic', 1);
    for (const slot of Object.keys(run.build.equipment) as (keyof typeof run.build.equipment)[])
      run.build.equipment[slot] = { ...run.build.equipment[slot]!, sockets: [] };
    expect(gearSummary(run)).toMatch(/^Gear · \d+ of 10 worn$/);
  });

  it('singular for one gem and one free socket', () => {
    const run = newRun('mystic', 1);
    const uid = () => run.nextUid++;
    for (const slot of Object.keys(run.build.equipment) as (keyof typeof run.build.equipment)[])
      run.build.equipment[slot] = { ...run.build.equipment[slot]!, sockets: [] };
    const body = makeItem(uid, 'body_ar_1', 1, 2);
    body.sockets = [makeGem(uid, 'flameBolt'), null];
    run.build.equipment.body = body;
    expect(gearSummary(run)).toMatch(/1 gem · 1 free socket$/);
  });
});
