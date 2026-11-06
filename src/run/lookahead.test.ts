import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { Rng } from '../core/rng';
import { uniqueDef } from '../data/uniques';
import { makeGem, makeItem } from '../gen/items';
import { rollUnique } from '../gen/loot';
import { botEquip, scoreBuild } from './bot';
import { withEquipped } from './inventory';
import { newRun, type RunState, setMap } from './run';

/**
 * Stranded gems (the owner, 2026-11-05): The Walled Heart has no sockets. A swap is weighed with every gem still worn, and
 * the bot re-sockets what did not fit after it (here, into the weapon).
 */
function setup(): { run: RunState; heart: ReturnType<typeof rollUnique> } {
  const run = newRun('vanguard', 3);
  const uid = () => run.nextUid++;
  run.build.level = 60;
  setMap(run, 60);
  // The main skill and its support live in the body armour; the two-hander has free sockets.
  const body = makeItem(uid, 'body_ar_3', 60, 4);
  body.sockets = [makeGem(uid, 'crushingBlow'), makeGem(uid, 'bruteForce'), null, null];
  run.build.equipment.body = body;
  const maul = makeItem(uid, 'mace2_4', 60, 3);
  // Enough strength for the Heart's armour base (a level-59 plate asks for 160).
  maul.uniqueMods = [{ stat: 'str', kind: 'base', value: 150 }];
  run.build.equipment.mainHand = maul;
  delete run.build.equipment.offHand;
  run.build.primaryGem = body.sockets[0]!.uid;
  const heart = rollUnique(new Rng(2), uid, uniqueDef('walledHeart'), 60);
  run.inventory.push(heart);
  return { run, heart };
}

describe('the bot moves gems before wearing a socketless unique', () => {
  it('a swap is weighed with the gems that do not fit still worn', () => {
    const { run, heart } = setup();
    expect(heart.sockets).toHaveLength(0);
    const kept = withEquipped(run.build, heart, 'body').equipment.body!;
    expect(kept.sockets.filter(Boolean).map((g) => g!.gemId)).toEqual([
      'crushingBlow',
      'bruteForce',
    ]);
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
