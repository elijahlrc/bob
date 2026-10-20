import { describe, expect, it } from 'vitest';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { mod } from '../mods/types';
import { newRun } from '../run/run';
import { Character } from './character';

/** A level-40 Vanguard with a sword and the given gems, the first being the main skill; `extra` goes on the body as implicits. */
function build(gems: string[], extra = [] as ReturnType<typeof mod>[]): Build {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, 'sword_3', 40, 1);
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 40, gems.length);
  body.sockets = gems.map((g) => makeGem(uid, g));
  body.implicits.push(...extra);
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]?.uid;
  b.flasks = [null, null, null, null, null];
  b.allocated = [];
  return b;
}

describe('effect of your Warcries (the tree stat the grit-and-warcries area sells)', () => {
  it("scales a rally cry's buff on the sheet: 100% effect doubles what Rallying Roar adds", () => {
    const dmg = (c: Character) =>
      c.profile(c.primary).hands[0].chunks.reduce((s, k) => s + k.max, 0);
    // The sheet in its steady mode counts a buff the build can grant as up.
    const none = new Character(build(['crushingBlow']), { steady: 'clearing' });
    const roar = new Character(build(['crushingBlow', 'rallyingRoar']), { steady: 'clearing' });
    const loud = new Character(
      build(['crushingBlow', 'rallyingRoar'], [mod('warcryEffect', 'inc', 100)]),
      { steady: 'clearing' },
    );
    const gain = dmg(roar) / dmg(none) - 1;
    expect(gain).toBeGreaterThan(0.1);
    expect(dmg(loud) / dmg(none) - 1).toBeCloseTo(gain * 2, 1);
  });

  it('leaves a guard with the warcry tag alone', () => {
    const plain = new Character(build(['crushingBlow', 'deathlessCall']));
    const loud = new Character(
      build(['crushingBlow', 'deathlessCall'], [mod('warcryEffect', 'inc', 100)]),
    );
    expect(loud.db.sum('base', 'hitTaken')).toBe(plain.db.sum('base', 'hitTaken'));
    expect(loud.db.mult('hitTaken')).toBeCloseTo(plain.db.mult('hitTaken'));
  });
});
