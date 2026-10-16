import { describe, expect, it } from 'vitest';
import type { Build } from '../data/types';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { gainCharge } from './charges';
import { flaskMask, killActor, playerConds } from './combat';
import { createDummyWorld, dummyDefence } from './dummy';
import { bannerStage } from './banners';
import { consecratedAt, raiseWall, WALL_HALF } from './fields';
import { reservedMana } from './reserve';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S6 (docs/SPIRIT.md): ground and lasting things the player's skills leave. */

function holding(main: string, gems: string[], cls = 'vanguard', body: string[] = []): Build {
  const run = newRun(cls, 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 50;
  const weapon = makeItem(uid, main, 50, Math.max(1, gems.length));
  weapon.sockets = gems.map((g) => makeGem(uid, g));
  b.equipment.mainHand = weapon;
  delete b.equipment.offHand;
  if (body.length) {
    const armour = makeItem(uid, 'body_ar_1', 50, body.length);
    armour.sockets = body.map((g) => makeGem(uid, g));
    b.equipment.body = armour;
  }
  b.primaryGem = weapon.sockets[0]!.uid;
  b.flasks = [null, null, null, null, null];
  return b;
}

function neighbour(w: World, x: number, y: number): Actor {
  const m = spawnMonster(
    w,
    { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
    x,
    y,
    0,
    0,
    'Neighbour',
  );
  m.def = dummyDefence({ maxLife: 1e9 });
  m.life = 1e9;
  return m;
}

describe('consecrated ground (blessedTrail)', () => {
  it('is left where the slam lands: life back for the character on it, a better chance to crit what stands on it', () => {
    const { world, dummy } = createDummyWorld(holding('mace_3', ['blessedTrail']), {
      distance: 3,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    for (let i = 0; i < 3 * 60 && world.sides[0].fields.length === 0; i++) stepWorld(world);
    expect(world.sides[0].fields.some((f) => f.kind === 'consecrated')).toBe(true);
    expect(consecratedAt(world.sides[0], dummy.x, dummy.y)).toBe(true);
    // The character regenerates on it.
    world.sides[0].opts.godMode = true;
    const f = world.sides[0].fields.find((x) => x.kind === 'consecrated')!;
    world.player.x = f.x;
    world.player.y = f.y;
    world.player.life = 1;
    world.player.stunT = 1e9;
    for (let i = 0; i < 60; i++) stepWorld(world);
    expect(world.player.life).toBeGreaterThan(world.player.def.maxLife * 0.04);
    // It ends.
    for (let i = 0; i < 5 * 60; i++) stepWorld(world);
    expect(world.sides[0].fields.some((x) => x.kind === 'consecrated')).toBe(false);
  });
});

describe('Cold Snap (suddenFrost): chilled ground', () => {
  it('leaves ground that grows and hurts, and a kill on it may give a Fervour charge', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['suddenFrost'], 'mystic'), {
      distance: 3,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    let hits = 0;
    let start = 0;
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(world);
      const f = world.sides[0].fields.find((x) => x.kind === 'chilling');
      if (f && start === 0) start = f.radius;
      for (const e of world.events) if (e.t === 'hit' && e.dst === dummy.id) hits++;
    }
    expect(start).toBeGreaterThan(0);
    // The burst and then the pulses of the ground.
    expect(hits).toBeGreaterThan(3);
    const f = world.sides[0].fields.find((x) => x.kind === 'chilling');
    if (f) expect(f.radius).toBeGreaterThan(f.r0);
  });

  it('gives a charge for a kill inside it', () => {
    let got = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { world, dummy } = createDummyWorld(holding('wand_3', ['suddenFrost'], 'mystic'), {
        distance: 3,
        maxTime: 60,
        seed,
      });
      world.sides[0].opts.freeResources = true;
      for (let i = 0; i < 3 * 60 && !world.sides[0].fields.some((x) => x.kind === 'chilling'); i++)
        stepWorld(world);
      dummy.noReward = false;
      const f = world.sides[0].fields.find((x) => x.kind === 'chilling')!;
      dummy.x = f.x;
      dummy.y = f.y;
      killActor(world, dummy);
      got += world.char.charges.fervour;
    }
    expect(got).toBeGreaterThan(0);
  });
});

describe('Earthquake (faultline): the aftershock', () => {
  it('hits again a moment later, harder', () => {
    const { world, dummy } = createDummyWorld(holding('mace_3', ['faultline']), {
      distance: 1.4,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    const hits: { t: number; amount: number }[] = [];
    for (let i = 0; i < 3 * 60; i++) {
      stepWorld(world);
      for (const e of world.events)
        if (e.t === 'hit' && e.dst === dummy.id) hits.push({ t: world.t, amount: e.amount });
    }
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits[1].t - hits[0].t).toBeGreaterThan(0.7);
    expect(hits[1].t - hits[0].t).toBeLessThan(1.6);
  });
});

describe('Tectonic Slam (magmaCrack): a charge now and then', () => {
  it('spends a Grit charge on some of its uses', () => {
    const { world } = createDummyWorld(holding('mace_3', ['magmaCrack']), {
      distance: 1.4,
      maxTime: 400,
    });
    world.sides[0].opts.freeResources = true;
    let spent = 0;
    let uses = 0;
    for (let i = 0; i < 300 * 60; i++) {
      if (world.char.charges.grit === 0) gainCharge(world, world.sides[0], 'grit');
      stepWorld(world);
      for (const e of world.events) {
        if (e.t === 'spend') spent++;
        if (e.t === 'use' && e.skill === 'magmaCrack') uses++;
      }
    }
    expect(uses).toBeGreaterThan(20);
    expect(spent).toBeGreaterThan(0);
    expect(spent).toBeLessThan(uses);
  });
});

describe('Frost Wall (glacierWall)', () => {
  it('shuts tiles for a few seconds and opens them again', () => {
    const { world } = createDummyWorld(holding('wand_3', ['glacierWall'], 'mystic'), {
      distance: 3,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    const before = Array.from(world.grid.tiles).filter((t) => t === 1).length;
    let walled = 0;
    for (let i = 0; i < 2 * 60; i++) {
      stepWorld(world);
      walled = Math.max(
        walled,
        before - Array.from(world.grid.tiles).filter((t) => t === 1).length,
      );
      if (walled > 0) world.player.stunT = 1e9; // one wall only
    }
    expect(walled).toBeGreaterThan(1);
    for (let i = 0; i < 8 * 60; i++) stepWorld(world);
    expect(Array.from(world.grid.tiles).filter((t) => t === 1).length).toBe(before);
  });
});

describe('Frost Wall: what the raising hits', () => {
  it('hurts what stands along the blocks, and not what stands beside them', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['glacierWall'], 'mystic'), {
      distance: 3,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    const c = world.char.actives.find((x) => x.skill.id === 'glacierWall')!;
    const prof = world.char.profile(c, world.char.configConds, 0);
    const p = world.player;
    p.x = 10.5;
    p.y = 15.5;
    // The wall stands across the way, east of the character: its line runs north to south through (14.5, 15.5).
    const aim = { x: 14.5, y: 15.5 };
    const raise = (dx: number, dy: number): boolean => {
      dummy.x = aim.x + dx;
      dummy.y = aim.y + dy;
      world.events.length = 0;
      world.sides[0].fields.length = 0;
      raiseWall(world, p, {
        profile: prof,
        which: 'primary',
        hand: 0,
        duration: 1,
        elapsed: 1,
        fired: true,
        echoes: 0,
        targetId: dummy.id,
        aimX: aim.x,
        aimY: aim.y,
      });
      return world.events.some((e) => e.t === 'hit' && e.dst === dummy.id);
    };
    const half = 4 * prof.radiusMult * 0.5;
    expect(raise(0, 0)).toBe(true);
    expect(raise(0, half - 0.2)).toBe(true);
    // Beside the middle of the wall, and past either end: the old circle took these, the band does not.
    expect(raise(WALL_HALF + 0.9, 0)).toBe(false);
    expect(raise(0, half + WALL_HALF + 0.5)).toBe(false);
  });
});

describe('Frost Bomb (rimeCore)', () => {
  it('exposes what is near it, then bursts when its time is up', () => {
    const { world, dummy } = createDummyWorld(holding('wand_3', ['rimeCore'], 'mystic'), {
      distance: 3,
      maxTime: 60,
    });
    world.sides[0].opts.freeResources = true;
    let exposedAt = -1;
    let burstAt = -1;
    let castAt = -1;
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(world);
      if (castAt < 0 && world.sides[0].fields.some((f) => f.kind === 'crystal')) castAt = world.t;
      if (exposedAt < 0 && dummy.fx.exposedCold) exposedAt = world.t;
      for (const e of world.events) if (e.t === 'explode' && burstAt < 0) burstAt = world.t;
    }
    expect(castAt).toBeGreaterThan(0);
    expect(exposedAt).toBeGreaterThanOrEqual(castAt);
    expect(dummy.fx.regenLess).toBeDefined();
    expect(burstAt).toBeGreaterThan(castAt);
  });
});

describe('Righteous Fire (searingMantle)', () => {
  it('burns the character through its fire resistance and never to death', () => {
    const b = holding('sword_3', ['crushingBlow'], 'vanguard', ['searingMantle']);
    const { world } = createDummyWorld(b, { distance: 9, maxTime: 60 });
    world.sides[0].opts.freeResources = false;
    world.player.stunT = 1e9;
    const max = world.player.def.maxLife;
    for (let i = 0; i < 10 * 60; i++) stepWorld(world);
    expect(world.player.life).toBeLessThan(max * 0.9);
    expect(world.player.life).toBeGreaterThanOrEqual(1);
    expect(world.player.alive).toBe(true);
  });
});

describe('Herald of Thunder (stormHerald)', () => {
  it('calls bolts down on the enemies around when a shocked enemy is killed', () => {
    const b = holding('sword_3', ['crushingBlow'], 'vanguard', ['stormHerald']);
    const { world, dummy } = createDummyWorld(b, { distance: 1.4, maxTime: 60 });
    world.sides[0].opts.freeResources = true;
    const other = neighbour(world, world.player.x + 2, world.player.y + 0.5);
    world.player.stunT = 1e9;
    dummy.ail.shock = 0.2;
    dummy.ail.shockT = 5;
    dummy.def = dummyDefence({ maxLife: 10 });
    dummy.life = 1;
    killActor(world, dummy);
    expect(world.sides[0].fields.some((f) => f.kind === 'storm')).toBe(true);
    for (let i = 0; i < 3 * 60; i++) stepWorld(world);
    expect(other.life).toBeLessThan(1e9);
  });
});

describe('banners (standardOfValour, standardOfDread)', () => {
  const carried = (gem: string) => {
    const b = holding('sword_3', ['crushingBlow'], 'vanguard', [gem]);
    const run = createDummyWorld(b, { distance: 4, maxTime: 120 });
    run.world.sides[0].opts.freeResources = true;
    for (let i = 0; i < 3 * 60 && !run.world.sides[0].banner; i++) stepWorld(run.world);
    return run;
  };

  it('is carried first: it holds mana, and its aura works on the character and the enemies near', () => {
    const { world, dummy } = carried('standardOfValour');
    expect(world.sides[0].banner).not.toBeNull();
    expect(world.sides[0].banner!.placed).toBe(false);
    expect(reservedMana(world, world.sides[0])).toBeGreaterThan(world.char.reservedMana);
    for (let i = 0; i < 30; i++) stepWorld(world);
    expect(world.sides[0].buffT.warBanner).toBeGreaterThan(0);
    expect(dummy.fx.scarred).toBeDefined();
  });

  it('gains a stage for each kill, then is put down: the stages widen it, lengthen it and give Adrenaline', () => {
    const { world } = carried('standardOfValour');
    const b = world.sides[0].banner!;
    for (let i = 0; i < 12; i++) {
      const m = neighbour(world, world.player.x + 3, world.player.y);
      m.life = 1;
      killActor(world, m);
    }
    // Two more stand about, so it is a fight.
    neighbour(world, world.player.x + 2, world.player.y + 1);
    neighbour(world, world.player.x + 2, world.player.y - 1);
    expect(b.stages).toBe(12);
    const r0 = b.r0;
    let guard = 0;
    while (!b.placed && guard++ < 10 * 60) stepWorld(world);
    expect(b.placed).toBe(true);
    expect(b.radius).toBeGreaterThan(r0);
    expect(world.sides[0].buffT.adrenaline).toBeGreaterThan(0);
    // Mana is free again, and the banner ends in time.
    expect(reservedMana(world, world.sides[0])).toBe(world.char.reservedMana);
    const left = Math.ceil((b.t + 1) * 60);
    for (let i = 0; i < left; i++) stepWorld(world);
    expect(world.sides[0].banner === null || world.sides[0].banner !== b).toBe(true);
  });

  it('its stages strengthen what it gives the character as much as what it does to enemies', () => {
    const { world } = carried('standardOfValour');
    for (let i = 0; i < 12; i++) {
      const m = neighbour(world, world.player.x + 3, world.player.y);
      m.life = 1;
      killActor(world, m);
    }
    neighbour(world, world.player.x + 2, world.player.y + 1);
    neighbour(world, world.player.x + 2, world.player.y - 1);
    const conds = playerConds(world, null);
    const carriedAcc = world.char.profile(world.primary, conds, flaskMask(world.sides[0])).hands[0]
      .accuracy;
    let guard = 0;
    while (!world.sides[0].banner!.placed && guard++ < 10 * 60) stepWorld(world);
    const placedAcc = world.char.profile(world.primary, conds, flaskMask(world.sides[0])).hands[0]
      .accuracy;
    const none = world.char.profile(world.primary, conds, 0).hands[0].accuracy;
    expect(carriedAcc).toBeCloseTo(none, 5);
    expect(placedAcc).toBeGreaterThan(carriedAcc);
  });

  it('works only where it stands once it is down', () => {
    const { world } = carried('standardOfValour');
    for (let i = 0; i < 12; i++) {
      const m = neighbour(world, world.player.x + 3, world.player.y);
      m.life = 1;
      killActor(world, m);
    }
    neighbour(world, world.player.x + 2, world.player.y + 1);
    neighbour(world, world.player.x + 2, world.player.y - 1);
    let guard = 0;
    while (!world.sides[0].banner!.placed && guard++ < 10 * 60) stepWorld(world);
    const b = world.sides[0].banner!;
    world.player.x = b.x + b.radius + 3;
    world.player.stunT = 1e9;
    const far = neighbour(world, b.x + b.radius + 6, b.y);
    const near = neighbour(world, b.x + 1, b.y);
    for (let i = 0; i < 30; i++) stepWorld(world);
    expect(near.fx.scarred).toBeDefined();
    expect(far.fx.scarred).toBeUndefined();
    expect(world.sides[0].buffT.warBanner).toBe(0);
  });

  it('the dread banner takes its stages from impales, five a second at most, and unnerves enemies', () => {
    const { world, dummy } = carried('standardOfDread');
    const b = world.sides[0].banner!;
    for (let i = 0; i < 12; i++) bannerStage(world, world.sides[0], 'impale');
    expect(b.stages).toBe(5);
    for (let i = 0; i < 30; i++) stepWorld(world);
    expect(dummy.fx.unnerved).toBeDefined();
    // Kills give nothing to this one.
    const m = neighbour(world, world.player.x + 3, world.player.y);
    m.life = 1;
    killActor(world, m);
    expect(b.stages).toBe(5);
  });
});

describe('Winter Orb (hoarfrostMote)', () => {
  const orbWorld = () => {
    const run = createDummyWorld(holding('wand_3', ['hoarfrostMote'], 'mystic'), {
      distance: 4,
      maxTime: 60,
    });
    run.world.sides[0].opts.freeResources = true;
    return run;
  };

  it('hangs over the character, builds stages while channelled and pelts the enemies near', () => {
    const { world, dummy } = orbWorld();
    let hits = 0;
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(world);
      for (const e of world.events) if (e.t === 'hit' && e.dst === dummy.id) hits++;
    }
    const orb = world.sides[0].fields.find((f) => f.kind === 'orb');
    expect(orb).toBeDefined();
    expect(orb!.stages).toBeGreaterThanOrEqual(5);
    expect(hits).toBeGreaterThan(8);
    expect(orb!.x).toBeCloseTo(world.player.x, 5);
  });

  it('keeps going after the channel ends, and its stages fade with its time', () => {
    const { world, dummy } = orbWorld();
    for (let i = 0; i < 4 * 60; i++) stepWorld(world);
    const orb = world.sides[0].fields.find((f) => f.kind === 'orb')!;
    const held = orb.stages!;
    world.player.stunT = 1e9;
    let hits = 0;
    for (let i = 0; i < 60; i++) {
      stepWorld(world);
      for (const e of world.events) if (e.t === 'hit' && e.dst === dummy.id) hits++;
    }
    expect(world.sides[0].channel).toBeNull();
    expect(hits).toBeGreaterThan(0);
    expect(orb.stages!).toBeLessThan(held);
    for (let i = 0; i < 8 * 60; i++) stepWorld(world);
    expect(world.sides[0].fields.some((f) => f.kind === 'orb')).toBe(false);
  });
});

describe('Storm Burst (brimstoneStorm)', () => {
  const stormWorld = () => {
    const run = createDummyWorld(holding('wand_3', ['brimstoneStorm'], 'mystic'), {
      distance: 4,
      maxTime: 60,
    });
    run.world.sides[0].opts.freeResources = true;
    return run;
  };

  it('makes an orb for each use, and each jumps about the target place blasting after every jump', () => {
    const { world, dummy } = stormWorld();
    let max = 0;
    let hits = 0;
    for (let i = 0; i < 3 * 60; i++) {
      stepWorld(world);
      max = Math.max(max, world.sides[0].fields.filter((f) => f.kind === 'zap').length);
      for (const e of world.events) if (e.t === 'hit' && e.dst === dummy.id) hits++;
    }
    expect(max).toBeGreaterThanOrEqual(3);
    expect(hits).toBeGreaterThan(5);
  });

  it('lets every orb left explode, wider and harder, when the channel ends', () => {
    const { world } = stormWorld();
    for (let i = 0; i < 2 * 60; i++) stepWorld(world);
    const zaps = world.sides[0].fields.filter((f) => f.kind === 'zap');
    expect(zaps.length).toBeGreaterThan(0);
    const spec = zaps[0].profile!.skill.orb!;
    world.player.stunT = 1e9;
    let widest = 0;
    stepWorld(world);
    for (const e of world.events) if (e.t === 'explode') widest = Math.max(widest, e.r);
    expect(widest).toBeGreaterThanOrEqual(spec.kind === 'zap' ? spec.releaseRadius : 99);
    expect(world.sides[0].fields.some((f) => f.kind === 'zap')).toBe(false);
  });
});
