import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { levelValue } from '../calc/gems';
import { fadeShare } from '../calc/skill';
import { gemDef, type ActiveGemDef } from '../data/gems';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { playerConds } from './combat';
import { createDummyWorld } from './dummy';
import { mod } from '../mods/types';
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

  it('hold their owner bonus in the sim while the colossus stands, and lose it when it falls', () => {
    const { world } = createDummyWorld(holding('sword_3', ['crushingBlow', 'stoneColossus']), {
      distance: 1.2,
    });
    const s = world.sides[0];
    s.opts.freeResources = true;
    steps(world, 3);
    const bit = s.char.cond.peek('golemStone');
    const golem = s.minions.find((m) => m.alive && m.kind === 'stoneGolem');
    expect(golem).toBeDefined();
    expect(playerConds(world, s, null) & bit).toBe(bit);
    golem!.alive = false;
    expect(playerConds(world, s, null) & bit).toBe(0);
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

describe('Glacier Dart and Chilling Shard', () => {
  it('fly at very different speeds, and are drawn as different shapes', () => {
    const dart = new Character(holding('wand_1', ['glacierDart'])).profile(
      new Character(holding('wand_1', ['glacierDart'])).primary,
    );
    const shard = new Character(holding('wand_1', ['chillingShard'])).profile(
      new Character(holding('wand_1', ['chillingShard'])).primary,
    );
    expect(dart.projSpeedMult).toBeLessThan(0.45);
    expect(shard.projSpeedMult).toBeGreaterThanOrEqual(1);
    const shape = (p: typeof dart) =>
      p.skill.behaviour.kind === 'projectile' ? p.skill.behaviour.shape : undefined;
    expect(shape(dart)).toBe('crystal');
    expect(shape(shard)).toBe('sliver');
  });
});

describe('Steadfast Bellow', () => {
  const grit = (crowd: number) => {
    const b = holding('mace_3', ['crushingBlow', 'steadfastBellow'], 70);
    // Attributes enough for the gem's twentieth level.
    const body = makeItem(() => 9000, 'body_ar_1', 70, 0, 'unique');
    body.uniqueMods = [mod('allAttr', 'base', 300)];
    b.equipment.body = body;
    const { world, dummy } = createDummyWorld(b, {
      distance: 1.2,
      rarity: 'boss',
      bystanders: crowd,
    });
    const s = world.sides[0];
    s.opts.freeResources = true;
    s.opts.godMode = true;
    // The crowd close about the character, inside the cry.
    let i = 0;
    for (const e of world.actors)
      if (e !== dummy && e !== s.player && !e.isPlayer) {
        e.x = s.player.x + 1 + (i % 4) * 0.4;
        e.y = s.player.y - 1.5 + Math.floor(i / 4) * 0.8;
        i++;
      }
    let got = -1;
    steps(world, 4, (w) => {
      if (got < 0 && w.events.some((e) => e.t === 'buff' && e.id === 'enduringCry'))
        got = s.char.charges.grit;
    });
    return got;
  };

  it('gives at least one Grit charge, and more for a crowd', () => {
    expect(grit(0)).toBeGreaterThanOrEqual(1);
    expect(grit(12)).toBeGreaterThan(grit(0));
  });
});

describe('Call Furies', () => {
  it('adds one spirit a cast, each with its own time, and keeps a swarm when cast again and again', () => {
    const { world } = createDummyWorld(holding('wand_1', ['callFuries'], 70), { distance: 3 });
    world.sides[0].opts.freeResources = true;
    let most = 0;
    let jump = 0;
    let before = 0;
    steps(world, 8, (w) => {
      const n = w.sides[0].minions.filter((m) => m.alive && m.kind === 'spirit').length;
      jump = Math.max(jump, n - before);
      before = n;
      most = Math.max(most, n);
    });
    expect(jump).toBe(1);
    expect(most).toBeGreaterThan(4);
    expect(most).toBeLessThanOrEqual(20);
  });
});

describe('Primal Strike and Quickening Shot', () => {
  const shoots = (main: string, gem: string) => {
    const c = new Character(holding(main, [gem]));
    return c.primary.skill.behaviour.kind;
  };

  it('shoot with a bow or a wand and strike with anything else', () => {
    for (const gem of ['primalStrike', 'quickeningShot']) {
      expect(shoots('bow_1', gem)).toBe('projectile');
      expect(shoots('wand_1', gem)).toBe('projectile');
      expect(shoots('sword_3', gem)).toBe('melee');
    }
  });

  it('a shot of Primal Strike bursts about what it hits, as the strike does', () => {
    const { world } = createDummyWorld(holding('bow_1', ['primalStrike']), { distance: 4 });
    world.sides[0].opts.freeResources = true;
    let bursts = 0;
    steps(world, 4, (w) => {
      for (const e of w.events) if (e.t === 'explode' && e.skill === 'primalStrike') bursts++;
    });
    expect(bursts).toBeGreaterThan(0);
  });
});
