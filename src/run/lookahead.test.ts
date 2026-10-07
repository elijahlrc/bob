import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { Rng } from '../core/rng';
import { uniqueDef } from '../data/uniques';
import { makeGem, makeItem } from '../gen/items';
import { rollUnique } from '../gen/loot';
import { botEquip, scoreBuild } from './bot';
import { withEquipped } from './inventory';
import { newRun, type RunState } from './run';

/**
 * Bot lookahead for stranded gems (EXPANSION 10.1 item 3): The Walled Heart has no sockets, so
 * wearing it naively strands the main skill. The two-step plan moves the gems to the weapon first.
 */
function setup(): { run: RunState; heart: ReturnType<typeof rollUnique> } {
  const run = newRun('vanguard', 3);
  const uid = () => run.nextUid++;
  run.build.level = 60;
  run.map = 60;
  // The main skill and its support live in the body armour; the two-hander has free sockets.
  const body = makeItem(uid, 'body_ar_3', 60, 4);
  body.sockets = [makeGem(uid, 'crushingBlow'), makeGem(uid, 'bruteForce'), null, null];
  run.build.equipment.body = body;
  const maul = makeItem(uid, 'mace2_4', 60, 3);
  // Enough strength for the Heart's armour base.
  maul.uniqueMods = [{ stat: 'str', kind: 'base', value: 60 }];
  run.build.equipment.mainHand = maul;
  delete run.build.equipment.offHand;
  run.build.primaryGem = body.sockets[0]!.uid;
  const heart = rollUnique(new Rng(2), uid, uniqueDef('walledHeart'), 60);
  run.inventory.push(heart);
  return { run, heart };
}

describe('the bot moves gems before wearing a socketless unique', () => {
  it('a naive swap strands the main skill and scores worse', () => {
    const { run, heart } = setup();
    const before = scoreBuild(run, run.build);
    const naive = scoreBuild(run, withEquipped(run.build, heart, 'body'));
    // With only 3 sockets on the maul and none on the Heart, the gems move to... nowhere in a naive swap.
    expect(heart.sockets).toHaveLength(0);
    expect(naive).toBeLessThan(before);
  });

  it('botEquip wears The Walled Heart anyway, with the gems moved to the weapon', () => {
    const { run } = setup();
    const before = scoreBuild(run, run.build);
    botEquip(run);
    expect(run.build.equipment.body?.uniqueId).toBe('walledHeart');
    const gems = run.build.equipment.mainHand!.sockets.filter(Boolean).map((g) => g!.gemId);
    expect(gems).toContain('crushingBlow');
    const c = new Character(run.build, { areaLevel: 60 });
    expect(c.primary.skill.id).toBe('crushingBlow');
    expect(scoreBuild(run, run.build)).toBeGreaterThan(before);
  });

  it('does not wear it when the gems have nowhere to go', () => {
    const { run } = setup();
    // Fill the weapon so the skill and its support cannot move.
    const full = makeItem(() => run.nextUid++, 'mace2_4', 60, 0);
    full.uniqueMods = [{ stat: 'str', kind: 'base', value: 60 }];
    run.build.equipment.mainHand = full;
    botEquip(run);
    expect(run.build.equipment.body?.uniqueId).not.toBe('walledHeart');
    expect(run.build.equipment.body!.sockets.filter(Boolean)).toHaveLength(2);
  });
});
