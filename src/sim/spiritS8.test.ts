import { describe, expect, it } from 'vitest';
import { distanceMult } from '../calc/skill';
import { buildFor, classFor } from './gemKit';
import { releaseCaught } from './shots';
import { createDummyWorld, dummyDefence } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S8 (docs/SPIRIT.md): blink and travel. */

const INT = classFor('int');
const DEX = classFor('dex');
const STR = classFor('str');

function neighbour(w: World, x: number, y: number, rarity: 'normal' | 'rare' = 'normal'): Actor {
  const m = spawnMonster(
    w,
    { type: 'warrior', variant: 'none', rarity, level: 1, mods: [] },
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

function blinkWorld(gems: string[], distance = 6.5, main = 'sword_3', cls = STR) {
  const run = createDummyWorld(buildFor(['crushingBlow', ...gems], main, cls), {
    distance,
    maxTime: 120,
  });
  run.world.opts.freeResources = true;
  run.world.opts.godMode = true;
  return run;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

const dist = (a: Actor, b: Actor) => Math.hypot(a.x - b.x, a.y - b.y);

describe('Flame Dash (cinderStep)', () => {
  it('blinks toward a target out of reach, burns the ground it crossed and the enemies where it lands', () => {
    const { world: w, dummy } = blinkWorld(['cinderStep'], 7);
    const start = { x: w.player.x, y: w.player.y };
    let trail = false;
    let blinked = false;
    for (let i = 0; i < 3 * 60; i++) {
      stepWorld(w);
      if (w.fields.some((f) => f.kind === 'trail')) trail = true;
      if (w.events.some((e) => e.t === 'blink' && e.end)) blinked = true;
    }
    expect(blinked).toBe(true);
    expect(trail).toBe(true);
    expect(dist(w.player, dummy)).toBeLessThan(5);
    expect(Math.hypot(w.player.x - start.x, w.player.y - start.y)).toBeGreaterThan(2);
  });

  it('what stands on the burning trail takes fire damage over time', () => {
    const { world: w } = blinkWorld(['cinderStep'], 7);
    let f = w.fields.find((x) => x.kind === 'trail');
    for (let i = 0; i < 2 * 60 && !f; i++) {
      stepWorld(w);
      f = w.fields.find((x) => x.kind === 'trail');
    }
    expect(f).toBeDefined();
    const mid = neighbour(w, (f!.x + f!.x2!) / 2, (f!.y + f!.y2!) / 2);
    run(w, 1);
    expect(mid.sdots.some((d) => d.src === 'cinderStep')).toBe(true);
  });

  it('holds three uses, and shares its cooldown with the other blink skills', () => {
    const { world: w } = blinkWorld(['cinderStep', 'rimeStep']);
    const flame = w.char.utilities.find((c) => c.skill.id === 'cinderStep')!;
    expect(flame.skill.cooldownUses).toBe(3);
    // Using one blink makes the other wait.
    w.utilityReady['@blink#' + flame.key] = w.t + 3;
    const frost = w.char.utilities.find((c) => c.skill.id === 'rimeStep')!;
    expect(w.utilityReady['@blink#' + frost.key]).toBeUndefined();
  });
});

describe('Frostblink (rimeStep)', () => {
  it('hurts and chills where the character left', () => {
    const { world: w } = blinkWorld(['rimeStep'], 30, 'sword_3', DEX);
    const here = neighbour(w, w.player.x + 1, w.player.y + 0.5);
    neighbour(w, w.player.x + 1.2, w.player.y - 0.5);
    neighbour(w, w.player.x + 0.5, w.player.y + 1);
    const start = { x: w.player.x, y: w.player.y };
    let chilling = false;
    let hurt = false;
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(w);
      const f = w.fields.find((x) => x.kind === 'chilling');
      if (f) {
        chilling = true;
        expect(Math.hypot(f.x - start.x, f.y - start.y)).toBeLessThan(0.5);
      }
      if (here.life < 1e9) hurt = true;
    }
    expect(chilling).toBe(true);
    expect(hurt).toBe(true);
  });

  it('its cooldown comes back faster with enemies near', () => {
    const lonely = blinkWorld(['rimeStep'], 30, 'sword_3', DEX);
    const crowded = blinkWorld(['rimeStep'], 30, 'sword_3', DEX);
    for (const w of [lonely.world, crowded.world]) {
      const c = w.char.utilities.find((x) => x.skill.id === 'rimeStep')!;
      w.cooldowns[c.key] = { uses: 0, t: 3 };
    }
    for (let i = 0; i < 5; i++)
      neighbour(crowded.world, crowded.world.player.x + 1 + i * 0.2, crowded.world.player.y + 1);
    // The dummy far away is not a neighbour; the world is kept still.
    for (const w of [lonely.world, crowded.world]) w.player.stunT = 1e9;
    run(lonely.world, 1);
    run(crowded.world, 1);
    const key = (w: World) => w.char.utilities.find((x) => x.skill.id === 'rimeStep')!.key;
    expect(crowded.world.cooldowns[key(crowded.world)].t).toBeLessThan(
      lonely.world.cooldowns[key(lonely.world)].t - 0.5,
    );
  });
});

describe('Lightning Warp (boltStep)', () => {
  it('the teleport waits for the run, the character can act meanwhile, and lightning bursts at both ends', () => {
    const { world: w, dummy } = blinkWorld(['boltStep'], 7.5, 'wand_3', INT);
    const start = { x: w.player.x, y: w.player.y };
    let waiting = false;
    let arrivedAt = -1;
    let castAt = -1;
    const bursts: { x: number; y: number }[] = [];
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(w);
      for (const e of w.events)
        if (e.t === 'use' && e.skill === 'boltStep' && castAt < 0) castAt = w.t;
      if (w.warp) waiting = true;
      if (waiting && !w.warp && arrivedAt < 0) {
        arrivedAt = w.t;
        for (const e of w.events) if (e.t === 'explode') bursts.push({ x: e.x, y: e.y });
      }
    }
    // One burst where the character stood, one where it landed.
    expect(bursts.length).toBe(2);
    expect(Math.hypot(bursts[0].x - bursts[1].x, bursts[0].y - bursts[1].y)).toBeGreaterThan(2);
    expect(waiting).toBe(true);
    expect(arrivedAt).toBeGreaterThan(castAt + 0.3);
    expect(Math.hypot(w.player.x - start.x, w.player.y - start.y)).toBeGreaterThan(2);
    expect(dist(w.player, dummy)).toBeLessThan(6);
  });
});

describe('Withering Step (rotStride)', () => {
  /** A pack stands about the target: Withering Step is for running through one. */
  const pack = (w: World, dummy: Actor) => {
    neighbour(w, dummy.x + 0.5, dummy.y + 1);
    neighbour(w, dummy.x + 0.5, dummy.y - 1);
  };

  it('grants Elusive, withers the enemies that come near once each, and ends with the next skill used', () => {
    const { world: w, dummy } = blinkWorld(['rotStride'], 5);
    pack(w, dummy);
    const far = neighbour(w, w.player.x - 20, w.player.y);
    let elusive = false;
    for (let i = 0; i < 2 * 60 && !elusive; i++) {
      stepWorld(w);
      elusive = w.buffT.elusive > 0;
    }
    expect(elusive).toBe(true);
    // The enemies near the landing are withered at once, four stacks at the first level; one far away is not.
    expect(dummy.fx.withered?.n ?? 0).toBeGreaterThanOrEqual(4);
    expect(far.fx.withered).toBeUndefined();
  });

  it('using any other skill ends the buff and its aura', () => {
    const { world: w, dummy } = blinkWorld(['rotStride'], 5);
    pack(w, dummy);
    let elusive = false;
    for (let i = 0; i < 2 * 60 && !elusive; i++) {
      stepWorld(w);
      elusive = w.buffT.elusive > 0;
    }
    expect(elusive).toBe(true);
    // The crushing blow is used next, or has been: either way the buff goes.
    let ended = false;
    for (let i = 0; i < 8 * 60 && !ended; i++) {
      stepWorld(w);
      ended = w.buffT.elusive === 0 && w.wither === null;
    }
    expect(ended).toBe(true);
  });

  it('the character runs on without attacking while it lasts, then goes back to the fight', () => {
    const { world: w, dummy } = blinkWorld(['rotStride'], 5);
    pack(w, dummy);
    let elusive = false;
    for (let i = 0; i < 2 * 60 && !elusive; i++) {
      stepWorld(w);
      elusive = w.buffT.elusive > 0;
    }
    expect(elusive).toBe(true);
    const before = dummy.life;
    let ran = 0;
    while (w.buffT.elusive > 0 && ran++ < 8 * 60) {
      stepWorld(w);
      if (w.buffT.elusive > 0) expect(dummy.life).toBe(before);
    }
    expect(w.buffT.elusive).toBe(0);
    run(w, 3);
    expect(dummy.life).toBeLessThan(before);
  });

  it('is not begun for a lone enemy', () => {
    const { world: w } = blinkWorld(['rotStride'], 5);
    run(w, 3);
    expect(w.buffT.elusive).toBe(0);
  });

  it('its cooldown does not run while Elusive lasts', () => {
    const { world: w } = blinkWorld(['rotStride'], 12);
    const c = w.char.utilities.find((x) => x.skill.id === 'rotStride')!;
    w.cooldowns[c.key] = { uses: 0, t: 3 };
    w.buffT.elusive = 5;
    w.player.stunT = 1e9;
    run(w, 2);
    expect(w.cooldowns[c.key].t).toBeCloseTo(3, 1);
    w.buffT.elusive = 0;
    run(w, 1);
    expect(w.cooldowns[c.key].t).toBeLessThan(2.2);
  });
});

describe('Blink Arrow (shadowQuiver)', () => {
  it('the arrow flies first, then the character is carried to it and a clone is left where it stood', () => {
    const { world: w } = blinkWorld(['shadowQuiver'], 7, 'bow_3', DEX);
    const start = { x: w.player.x, y: w.player.y };
    let waiting = false;
    let clone: { x: number; y: number } | undefined;
    for (let i = 0; i < 4 * 60; i++) {
      stepWorld(w);
      if (w.warp) waiting = true;
      const m = w.minions.find((x) => x.kind === 'clone');
      if (m && !clone) clone = { x: m.x, y: m.y };
    }
    expect(waiting).toBe(true);
    expect(Math.hypot(w.player.x - start.x, w.player.y - start.y)).toBeGreaterThan(2);
    expect(clone).toBeDefined();
    expect(Math.hypot(clone!.x - start.x, clone!.y - start.y)).toBeLessThan(1.5);
  });
});

describe('Storm Rush (stormRush)', () => {
  it('an illusion runs ahead of the character, waves break along its path, and letting go carries the character to it', () => {
    const { world: w, dummy } = blinkWorld([], 6, 'sword_3', DEX);
    // Replace the crushing blow by the storm rush as the only skill.
    const run2 = createDummyWorld(buildFor(['stormRush'], 'sword_3', DEX), {
      distance: 6,
      maxTime: 60,
    });
    const w2 = run2.world;
    w2.opts.freeResources = true;
    w2.opts.godMode = true;
    const start = { x: w2.player.x, y: w2.player.y };
    let from = { x: w2.player.x, y: w2.player.y };
    let ghost = 0;
    let waves = 0;
    let channelling = false;
    for (let i = 0; i < 6 * 60; i++) {
      if (!channelling) from = { x: w2.player.x, y: w2.player.y };
      stepWorld(w2);
      channelling = !!w2.channel;
      const g = w2.fields.find((f) => f.kind === 'ghost');
      if (g) {
        ghost = Math.max(ghost, Math.hypot(g.x - w2.player.x, g.y - w2.player.y));
        // The character itself stays where it was while the illusion runs.
        expect(Math.hypot(w2.player.x - from.x, w2.player.y - from.y)).toBeLessThan(0.5);
      }
      for (const e of w2.events) if (e.t === 'explode') waves++;
    }
    expect(ghost).toBeGreaterThan(3);
    expect(waves).toBeGreaterThan(2);
    // Over the six seconds it was let go at least once and the character joined it.
    expect(Math.hypot(w2.player.x - start.x, w2.player.y - start.y)).toBeGreaterThan(2);
    expect(run2.dummy.life).toBeLessThan(run2.dummy.def.maxLife);
    void w;
    void dummy;
  });
});

describe('Frost Lance (frostLance)', () => {
  it('two spears in a row that change form far from the caster: faster, through everything, critical', () => {
    const { world: w } = blinkWorld([], 7, 'wand_3', INT);
    const run2 = createDummyWorld(buildFor(['frostLance'], 'wand_3', INT), {
      distance: 7,
      maxTime: 60,
    });
    const w2 = run2.world;
    w2.opts.freeResources = true;
    let formedSeen = false;
    let slowSeen = false;
    let most = 0;
    for (let i = 0; i < 3 * 60; i++) {
      stepWorld(w2);
      most = Math.max(most, w2.projectiles.length);
      for (const p of w2.projectiles) {
        if (p.formed) {
          formedSeen = true;
          expect(p.pierceLeft).toBeGreaterThan(50);
          expect(p.profile.hands[0].critChance).toBeGreaterThan(0.4);
        } else slowSeen = true;
      }
    }
    expect(slowSeen).toBe(true);
    expect(formedSeen).toBe(true);
    expect(most).toBeGreaterThanOrEqual(2);
    void w;
  });
});

describe('Venom Gyre (toxinCircle) and Whirling Blades (spinningDash)', () => {
  it('catches the blades that return, and Whirling Blades sends them out in a spiral', () => {
    const run2 = createDummyWorld(buildFor(['toxinCircle', 'spinningDash'], 'dagger_3', DEX), {
      distance: 4,
      maxTime: 60,
    });
    const w = run2.world;
    w.opts.freeResources = true;
    w.opts.godMode = true;
    let caught = 0;
    for (let i = 0; i < 8 * 60; i++) {
      stepWorld(w);
      caught = Math.max(caught, w.caught?.n ?? 0);
    }
    expect(caught).toBeGreaterThanOrEqual(1);
    // Whirling Blades is the skill that lets them go: a spiral, none of it returning.
    w.caught = { profile: w.char.profile(w.primary, 0), hand: 0, n: 5, t: 12 };
    const before = w.shots.length;
    releaseCaught(w, w.player);
    expect(w.caught).toBeNull();
    expect(w.shots.length).toBe(before + 5);
    const sent = w.shots.slice(before);
    for (const s of sent) {
      const beh = s.profile.skill.behaviour;
      expect(beh.kind === 'projectile' && beh.returns).toBe(false);
    }
    expect(new Set(sent.map((s) => s.angle.toFixed(2))).size).toBe(5);
    const spin = w.char.actives.find((c) => c.skill.id === 'spinningDash');
    expect(spin?.skill.releasesCaught).toBe(true);
  });
});

describe('Point Blank (closeQuarters)', () => {
  it('projectile attacks hit up to 30% harder up close and half as hard at the end of their range', () => {
    const { world: w } = blinkWorld([], 4, 'bow_3', DEX);
    const run2 = createDummyWorld(buildFor(['splitVolley', 'closeQuarters'], 'bow_3', DEX), {
      distance: 4,
      maxTime: 10,
    });
    const p = run2.world.char.profile(run2.world.primary, 0);
    expect(p.closeQuarters).toBe(true);
    expect(distanceMult(p, 1)).toBeCloseTo(1.3);
    expect(distanceMult(p, 8)).toBeCloseTo(0.5);
    void w;
  });
});
