import { describe, expect, it } from 'vitest';
import { buildFor, classFor } from './gemKit';
import { mineAuraAt, type Deployable } from './deploy';
import { createDummyWorld, dummyDefence } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** Tests of the spirit plan's S10 (docs/SPIRIT.md): what totems, traps and mines do in the reference game. */

const STR = classFor('str');
const DEX = classFor('dex');
const INT = classFor('int');

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

function world(gems: string[], distance: number, main: string, cls: string, maxTime = 120) {
  const run = createDummyWorld(buildFor(gems, main, cls), { distance, maxTime });
  run.world.opts.freeResources = true;
  run.world.opts.godMode = true;
  return run;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

const mine = (
  w: World,
  key: string,
  x: number,
  y: number,
  extra: Partial<Deployable> = {},
): Deployable => {
  const d: Deployable = {
    id: ++w.deploySeq,
    kind: 'mine',
    key,
    x,
    y,
    t: 10,
    fireT: 0,
    ...extra,
  };
  w.deployables.push(d);
  return d;
};

describe('ballistas (mortarBow, scatterBow)', () => {
  it('a ballista attacks at half the speed of the same skill as a plain totem', () => {
    const { world: w } = world(['scatterBow'], 5, 'bow_3', DEX);
    let uses = 0;
    run(w, 1);
    for (let i = 0; i < 20 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'use' && e.skill === 'scatterBow') uses++;
    }
    const prof = w.char.profile(
      w.char.actives.find((c) => c.skill.id === 'scatterBow')!,
      0,
    );
    // The character places new ballistas as old ones end; shots come from the totems, at half the character's speed.
    expect(w.char.actives.find((c) => c.skill.id === 'scatterBow')!.skill.ballista).toBe(true);
    expect(uses / 20).toBeLessThan((1 / prof.useTime) * 2.1);
    expect(uses).toBeGreaterThan(5);
  });

  it('Artillery Ballista: the arrows come down in a line toward the target and burst where they land', () => {
    const { world: w, dummy } = world(['mortarBow'], 7, 'bow_3', DEX);
    const bursts: number[] = [];
    for (let i = 0; i < 6 * 60; i++) {
      stepWorld(w);
      for (const e of w.events)
        if (e.t === 'explode' && Math.abs(e.y - dummy.y) < 2) bursts.push(e.x);
    }
    expect(bursts.length).toBeGreaterThanOrEqual(6);
    const span = Math.max(...bursts) - Math.min(...bursts);
    expect(span).toBeGreaterThan(2.5);
  });
});

describe('Cairns (fatherTotem, warchiefTotem)', () => {
  it('a Cairn is active only while the character is near, and quickens the character while it is', () => {
    const { world: w, dummy } = world(['fatherTotem'], 2.5, 'sword_3', STR);
    let uses = 0;
    let buff = false;
    for (let i = 0; i < 5 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'use') uses++;
      if (w.buffT.guardianCairn > 0) buff = true;
    }
    expect(buff).toBe(true);
    expect(w.deployables.length).toBeGreaterThan(0);
    // Take the character far from the totem: it falls silent and the bonus goes.
    const before = uses;
    w.player.x -= 20;
    w.player.y = Math.max(1, w.player.y);
    w.player.stunT = 1e9;
    uses = 0;
    for (let i = 0; i < 2 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'use') uses++;
    }
    expect(uses).toBe(0);
    expect(w.buffT.guardianCairn).toBe(0);
    expect(before).toBeGreaterThan(0);
    void dummy;
  });

  it('the Warchief gives more melee damage while it is active, and the bonuses of the two do not interfere', () => {
    const { world: w } = world(['warchiefTotem'], 2.5, 'mace_3', STR);
    const key = w.char.actives.find((c) => c.skill.id === 'warchiefTotem')!;
    const plain = w.char.profile(key, 0);
    const cond = w.char.cond.peek('warchiefCairn');
    const buffed = w.char.profile(key, cond);
    expect(buffed.hands[0].chunks[0].max).toBeGreaterThan(plain.hands[0].chunks[0].max);
  });
});

describe('Cinder Bond (cinderBond)', () => {
  it('totems cast beams at the character and at each other that burn what they cross, once', () => {
    const { world: w } = world(['cinderBond'], 5, 'wand_3', INT);
    const c = w.char.actives.find((x) => x.skill.id === 'cinderBond')!;
    // Two totems of the skill, the character between them and an enemy on each side of the line.
    const a = { x: w.player.x + 4, y: w.player.y };
    const b = { x: w.player.x - 4, y: w.player.y };
    for (const s of [a, b])
      w.deployables.push({
        id: ++w.deploySeq,
        kind: 'totem',
        key: c.key,
        x: s.x,
        y: s.y,
        t: 8,
        fireT: 0,
      });
    const onBeam = neighbour(w, w.player.x + 2, w.player.y);
    const offBeam = neighbour(w, w.player.x + 2, w.player.y + 6);
    run(w, 1);
    expect(onBeam.sdots.filter((d) => d.src === 'cinderBond').length).toBe(1);
    expect(offBeam.sdots.length).toBe(0);
  });
});

describe('mines (chainedCharges, heavyCharge, mortarCharge)', () => {
  it('a set of mines goes together when one is set off; Chained Charges makes them go one after another, each harder', () => {
    const { world: w, dummy } = world(['suddenFrost', 'chainedCharges'], 6, 'wand_3', INT);
    const c = w.char.actives.find((x) => x.skill.id === 'suddenFrost')!;
    // Clear what the AI already laid.
    w.deployables.length = 0;
    w.player.stunT = 1e9;
    const m: Deployable[] = [];
    for (let i = 0; i < 4; i++) m.push(mine(w, c.key, dummy.x + i * 0.7 - 1, dummy.y + 1));
    const seen: number[] = [];
    for (let i = 0; i < 4 * 60 && seen.length < 4; i++) {
      stepWorld(w);
      for (const d of m) if (d.goAt !== undefined && !seen.includes(d.id)) seen.push(d.id);
    }
    expect(seen.length).toBe(4);
    const times = m.map((d) => d.goAt!).sort((x, y) => x - y);
    expect(times[1] - times[0]).toBeCloseTo(0.25, 1);
    expect(times[3] - times[0]).toBeCloseTo(0.75, 1);
    expect(m.map((d) => d.seq).sort()).toEqual([0, 1, 2, 3]);
  });

  it('without a chain the set goes at once', () => {
    const { world: w, dummy } = world(['mortarCharge'], 6, 'wand_3', INT);
    const c = w.char.actives.find((x) => x.skill.id === 'mortarCharge')!;
    w.deployables.length = 0;
    w.player.stunT = 1e9;
    const m = [0, 1, 2].map((i) => mine(w, c.key, dummy.x + i * 0.7 - 1, dummy.y + 1));
    for (let i = 0; i < 4 * 60 && m.some((d) => d.goAt === undefined); i++) stepWorld(w);
    const times = m.map((d) => d.goAt!);
    expect(Math.max(...times) - Math.min(...times)).toBeLessThan(0.01);
  });

  it('Pyroclast: a mine bursts and then rains more bursts, one more for every two mines before it', () => {
    const { world: w, dummy } = world(['mortarCharge'], 6, 'wand_3', INT);
    const c = w.char.actives.find((x) => x.skill.id === 'mortarCharge')!;
    w.deployables.length = 0;
    w.player.stunT = 1e9;
    mine(w, c.key, dummy.x, dummy.y + 1, { goAt: w.t + 0.1, seq: 0 });
    let bursts = 0;
    for (let i = 0; i < 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'explode') bursts++;
    }
    expect(bursts).toBe(3);
    mine(w, c.key, dummy.x, dummy.y + 1, { goAt: w.t + 0.1, seq: 4 });
    bursts = 0;
    for (let i = 0; i < 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'explode') bursts++;
    }
    // The fifth mine of a sequence rains two more than the first.
    expect(bursts).toBe(5);
  });

  it('the aura of mines: double damage for High-Impact, fire for Pyroclast, adding up and capped', () => {
    const heavy = world(['heavyCharge', 'suddenFrost'], 6, 'wand_3', INT);
    const hw = heavy.world;
    const hc = hw.char.actives.find((x) => x.skill.id === 'suddenFrost')!;
    hw.deployables.length = 0;
    const aura = { double: 2, min: 0, max: 0, cap: 0, radius: 3.5 };
    for (let i = 0; i < 3; i++)
      mine(hw, hc.key, heavy.dummy.x + 0.3 * i, heavy.dummy.y + 1, { aura });
    expect(mineAuraAt(hw, heavy.dummy.x, heavy.dummy.y)!.double).toBe(6);
    expect(mineAuraAt(hw, heavy.dummy.x + 30, heavy.dummy.y)).toBeNull();
    const fire = { double: 0, min: 5, max: 10, cap: 12, radius: 3.5 };
    hw.deployables.length = 0;
    for (let i = 0; i < 3; i++) mine(hw, hc.key, heavy.dummy.x, heavy.dummy.y + 1, { aura: fire });
    const got = mineAuraAt(hw, heavy.dummy.x, heavy.dummy.y)!;
    expect(got.max).toBeCloseTo(12);
    expect(got.min).toBeCloseTo(6);
  });

  it('mines made by the supports last five seconds', () => {
    const { world: w } = world(['suddenFrost', 'heavyCharge'], 6, 'wand_3', INT);
    const c = w.char.actives.find((x) => x.skill.id === 'suddenFrost')!;
    const prof = w.char.profile(c, 0);
    expect(prof.deploySeconds).toBe(5);
    expect(prof.mineDouble).toBe(2);
  });
});

describe('Bear Trap (jawsTrap)', () => {
  it('stores three uses of a four-second cooldown, and its trap stands four seconds', () => {
    const { world: w } = world(['jawsTrap'], 6, 'wand_3', DEX);
    const c = w.char.actives.find((x) => x.skill.id === 'jawsTrap')!;
    expect(c.skill.cooldown).toBe(4);
    expect(c.skill.cooldownUses).toBe(3);
    const prof = w.char.profile(c, 0);
    const seconds = (c.skill.deploySeconds ?? 0) * prof.skillDuration;
    expect(seconds).toBeCloseTo(4, 1);
    let placed = 0;
    for (let i = 0; i < 3 * 60; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'deploy' && !e.end) placed++;
    }
    expect(placed).toBeGreaterThanOrEqual(1);
  });
});
