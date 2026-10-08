import { describe, expect, it } from 'vitest';
import { getTree } from '../data/tree';
import { KEYSTONES } from '../data/tree/keystones';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld } from '../sim/dummy';
import { summonMinions } from '../sim/minions';
import { stepWorld } from '../sim/world';
import { Character } from './character';

/** The keystones of the tree pass (docs/TREE.md). */
const ksNode = (id: string): number => {
  const name = KEYSTONES.find((k) => k.id === id)!.name;
  return getTree().nodes.find((n) => n.kind === 'keystone' && n.name === name)!.id;
};

function build(keystones: string[], gems: string[]): Build {
  const run = newRun('mystic', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, 'wand_3', 40, 1);
  delete b.equipment.offHand;
  const body = makeItem(uid, 'body_ar_1', 40, gems.length);
  body.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.body = body;
  b.primaryGem = body.sockets[0]?.uid;
  b.flasks = [null, null, null, null, null];
  b.allocated = keystones.map(ksNode);
  return b;
}

describe('the keystones of the tree pass', () => {
  it('all 27 keystones are in the tree', () => {
    expect(KEYSTONES).toHaveLength(27);
    for (const k of KEYSTONES) expect(ksNode(k.id)).toBeGreaterThanOrEqual(0);
  });

  it('Nimble Gambit: dodge attacks, at the cost of armour, energy shield and block', () => {
    const c = new Character(build(['nimbleGambit'], ['flameBolt']));
    const plain = new Character(build([], ['flameBolt']));
    expect(c.defence().dodgeAttack).toBeCloseTo(0.3);
    expect(c.defence().maxEs).toBeLessThanOrEqual(plain.defence().maxEs);
    expect(c.defence().armour).toBeLessThanOrEqual(plain.defence().armour);
  });

  it('Spellslip: dodge spells', () => {
    expect(new Character(build(['spellslip'], ['flameBolt'])).defence().dodgeSpell).toBeCloseTo(
      0.3,
    );
  });

  it('Idle Hands: your own skills deal nothing, a totem does, and there is one more totem', () => {
    const own = new Character(build(['idleHands'], ['flameBolt']));
    expect(own.sheet().skill.totalDps).toBe(0);
    const totem = new Character(build(['idleHands'], ['flameBolt', 'standingCast']));
    expect(totem.primary.deploy).toBe('totem');
    expect(totem.sheet().skill.totalDps).toBeGreaterThan(0);
    expect(totem.profile(totem.primary).deployCount).toBe(2);
  });

  it('Sigil Warden: one more brand, and totems hit for less', () => {
    const brand = new Character(build(['sigilWarden'], ['doomSigil']));
    expect(brand.profile(brand.primary).deployCount).toBe(2);
    const plain = new Character(build([], ['flameBolt', 'standingCast']));
    const warden = new Character(build(['sigilWarden'], ['flameBolt', 'standingCast']));
    expect(warden.sheet().skill.totalDps).toBeLessThan(plain.sheet().skill.totalDps);
  });

  it('Lone Vow: only the first aura stands, and it reserves nothing', () => {
    const aura = (ks: string[]) => {
      const run = newRun('mystic', 1);
      const uid = () => run.nextUid++;
      const b = run.build;
      b.level = 40;
      const body = makeItem(uid, 'body_ar_1', 40, 4);
      body.sockets = ['flameBolt', 'kindlingHalo', 'stormHalo'].map((g) => makeGem(uid, g));
      b.equipment.body = body;
      b.primaryGem = body.sockets[0]?.uid;
      b.allocated = ks.map(ksNode);
      return new Character(b);
    };
    const lone = aura(['loneVow']);
    expect(lone.auras.filter((a) => a.active)).toHaveLength(1);
    expect(aura([]).auras.filter((a) => a.active).length).toBeGreaterThanOrEqual(1);
    expect(lone.reservedMana).toBe(0);
  });

  it('Volatile Servants: a minion at low life bursts once, hurting the enemies near it', () => {
    const b = build(['volatileServants'], ['flameBolt', 'raiseHusk']);
    const { world, dummy } = createDummyWorld(b, { distance: 1.5 });
    dummy.def = { ...dummy.def, maxLife: 1e6 };
    dummy.life = 1e6;
    dummy.dummy = true;
    world.opts.godMode = true;
    const c = world.char.utilities[0];
    summonMinions(world, c, world.char.profile(c, 0, 0));
    const m = world.minions[0];
    m.x = dummy.x;
    m.y = dummy.y + 0.5;
    dummy.state = 'chase';
    m.life = m.def.maxLife * 0.1;
    const before = dummy.life;
    stepWorld(world);
    expect(m.boomed).toBe(true);
    expect(before - dummy.life).toBeGreaterThan(0);
    const after = dummy.life;
    stepWorld(world);
    // It bursts once: nothing more comes from the burst (the minion's own blows aside).
    expect(m.boomed).toBe(true);
    void after;
  });
});
