import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { levelValue } from '../calc/gems';
import { fadeShare } from '../calc/skill';
import { gemDef, type ActiveGemDef } from '../data/gems';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { createDummyWorld } from './dummy';
import { statusTaken } from './statuses';
import type { World } from './types';
import { stepWorld } from './world';

/** Gems that had lost what tells them apart (reference/docs/AUDIT-GEM-IDENTITY.md, local), and got it back. */

function holding(main: string, gems: string[], level = 50): Build {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = level;
  const weapon = makeItem(uid, main, level, gems.length);
  weapon.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

function steps(world: World, seconds: number, each?: (w: World) => void): void {
  for (let i = 0; i < seconds * 60; i++) {
    stepWorld(world);
    each?.(world);
  }
}

describe('the colossi', () => {
  it('stand one at a time: a second colossus waits while the first stands', () => {
    const { world } = createDummyWorld(
      holding('sword_3', ['crushingBlow', 'stoneColossus', 'emberColossus']),
      { distance: 1.2 },
    );
    world.sides[0].opts.freeResources = true;
    let most = 0;
    steps(world, 8, (w) => {
      const golems = w.sides[0].minions.filter(
        (m) => m.alive && (m.kind === 'stoneGolem' || m.kind === 'flameGolem'),
      ).length;
      most = Math.max(most, golems);
    });
    expect(most).toBe(1);
  });

  it('give their owner bonus only while they stand, and the sheet counts only the first', () => {
    const c = new Character(holding('sword_3', ['crushingBlow', 'stoneColossus', 'emberColossus']));
    const mask = c.steadyMask('boss');
    expect(c.db.sum('base', 'lifeRegen', { tags: 0, ancestry: 0, conds: 0 })).toBe(0);
    expect(c.db.sum('base', 'lifeRegen', { tags: 0, ancestry: 0, conds: mask })).toBeGreaterThan(0);
    expect(c.db.inc('damage', { tags: 0, ancestry: 0, conds: mask })).toBe(0);
  });
});

describe('Mending Totem and the guards', () => {
  it('is not a guard: it does not make Iron Hide wait', () => {
    const { world } = createDummyWorld(
      holding('sword_3', ['crushingBlow', 'mendingTotem', 'ironHide']),
      { distance: 1.2 },
    );
    const s = world.sides[0];
    s.opts.freeResources = true;
    s.opts.godMode = true;
    const buffs = new Set<string>();
    // Life is held low (the totem would mend it), so that both want to go up.
    steps(world, 3, (w) => {
      s.player.life = s.player.def.maxLife * 0.4;
      for (const e of w.events) if (e.t === 'buff') buffs.add(e.id);
    });
    expect(buffs.has('regenTotem')).toBe(true);
    expect(buffs.has('steelHide')).toBe(true);
  });
});

describe('Iron Hide', () => {
  it('takes most of a hit into a pool that grows with the gem level', () => {
    const { world } = createDummyWorld(holding('sword_3', ['crushingBlow', 'ironHide']), {
      distance: 1.2,
    });
    const s = world.sides[0];
    s.opts.freeResources = true;
    s.opts.godMode = true;
    s.player.life = s.player.def.maxLife * 0.4;
    let pool = 0;
    steps(world, 2, (w) => {
      if (w.sides[0].shell) pool = Math.max(pool, w.sides[0].shell.left);
    });
    const u = (gemDef('ironHide') as ActiveGemDef).utility;
    if (u?.kind !== 'buff' || !u.shell?.capFlat) throw new Error('Iron Hide has no flat pool');
    const level = s.char.utilities.find((c) => c.skill.id === 'ironHide')!.skill.level;
    expect(pool).toBeCloseTo(levelValue(u.shell.capFlat, level, true), 0);
  });
});

describe('Deep Chill', () => {
  it('makes an enemy the skill chills take more cold damage, as much as it is slowed', () => {
    const { world, dummy } = createDummyWorld(holding('wand_1', ['chillingShard', 'deepChill']), {
      distance: 3,
      defence: { ailmentThreshold: 50 },
    });
    world.sides[0].opts.freeResources = true;
    let seen = 0;
    steps(world, 4, () => {
      if (dummy.fx.rimed) seen = Math.max(seen, statusTaken(dummy).vulnType[2]);
    });
    expect(seen).toBeGreaterThan(0);
    expect(seen).toBeLessThanOrEqual(0.3 + 1e-9);
  });

  it('gives nothing without the support', () => {
    const { world, dummy } = createDummyWorld(holding('wand_1', ['chillingShard']), {
      distance: 3,
      defence: { ailmentThreshold: 50 },
    });
    world.sides[0].opts.freeResources = true;
    let chilled = false;
    steps(world, 4, () => {
      chilled ||= dummy.ail.chill > 0;
      expect(dummy.fx.rimed).toBeUndefined();
    });
    expect(chilled).toBe(true);
  });
});

describe('Crackle Ring', () => {
  it('is channelled and pulses only in front of the caster', () => {
    const def = gemDef('crackleRing') as ActiveGemDef;
    expect(def.tags).toContain('channelling');
    expect(def.channel).toBeDefined();
    expect(def.behaviour.kind === 'burst' && def.behaviour.arc).toBe(180);
  });
});

describe('Chilling Shard', () => {
  it('freezes less the farther it has flown, and not at the end of its range', () => {
    const c = new Character(holding('wand_1', ['chillingShard']));
    const p = c.profile(c.primary);
    const b = p.skill.behaviour;
    if (b.kind !== 'projectile' || !b.range) throw new Error('not a projectile');
    expect(fadeShare(p, 0)).toBe(1);
    expect(fadeShare(p, b.range / 2)).toBeCloseTo(0.5);
    expect(fadeShare(p, b.range)).toBe(0);
    // A projectile without falloff keeps its chance.
    const lance = new Character(holding('wand_1', ['frostLance']));
    expect(fadeShare(lance.profile(lance.primary), 8)).toBe(1);
  });
});
