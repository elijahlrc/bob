import { describe, expect, it } from 'vitest';
import { buildMonster, sidearmSkillId, type MonsterSpec } from '../calc/monster';
import { PATTERNS, TYPE_SIDEARMS, TYPE_WINDOWS, encounterTexts } from '../data/encounters';
import type { MonsterTypeId } from '../data/monsters';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { hazardAt } from './ai';
import { inBlast } from './blasts';
import { applyDamage, hit } from './combat';
import { createDummyWorld } from './dummy';
import type { Actor, GroundEffect, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A level 40 character in an open arena, fixed to the spot, with no dummies. */
function arena(): World {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = 40;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', 40, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 30 });
  world.player.stunT = 1e9;
  world.opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

const spec = (type: MonsterTypeId, level = 30): MonsterSpec => ({
  type,
  variant: 'none',
  rarity: 'normal',
  level,
  mods: [],
});

function put(w: World, type: MonsterTypeId, dx: number, dy = 0): Actor {
  const m = spawnMonster(w, spec(type), w.player.x + dx, w.player.y + dy, 0, 0, type);
  m.state = 'chase';
  return m;
}

const steps = (w: World, n: number) => {
  for (let i = 0; i < n; i++) stepWorld(w);
};

/** The skill ids of the projectiles in flight. */
const flying = (w: World) => w.projectiles.map((p) => p.profile.skill.id);

describe('sidearms (docs/ENCOUNTERS.md 3)', () => {
  it('a sidearm is a second profile: the melee blow is unchanged', () => {
    const m = buildMonster(spec('warrior'));
    expect(m.profile(0).skill.behaviour.kind).toBe('melee');
    expect(m.profile(0).repeats).toBe(0);
    const s = m.sidearm!.profile(0);
    expect(s.skill.id).toBe(sidearmSkillId('warrior'));
    expect(s.skill.behaviour.kind).toBe('projectile');
    expect(s.skill.look).toBe('spear');
    expect(s.projSpeedMult).toBeCloseTo(0.55, 5);
  });

  it('a sidearm waits for its map: no spear on the first maps', () => {
    expect(buildMonster(spec('warrior', 3)).sidearm).toBeUndefined();
    expect(buildMonster(spec('warrior', 4)).sidearm).toBeDefined();
  });

  it('a Warrior throws its spear from range, and closes and strikes when near', () => {
    const w = arena();
    const m = put(w, 'warrior', 6);
    m.enc!.sideT = 0;
    steps(w, 2);
    expect(m.action?.profile.skill.id).toBe(sidearmSkillId('warrior'));
    steps(w, 60);
    expect(flying(w)).toContain(sidearmSkillId('warrior'));
    // Near the character it never throws.
    const near = put(w, 'warrior', 0, 1.2);
    near.enc!.sideT = 0;
    steps(w, 30);
    expect(near.action?.profile.skill.id ?? '').not.toBe(sidearmSkillId('warrior'));
  });

  it("a Shambler's retch is chaos and leaves a caustic pool, and a second one is not lobbed onto the first", () => {
    const s = buildMonster(spec('shambler')).sidearm!.profile(0);
    const chunks = s.hands[0].chunks;
    expect(chunks.every((c) => c.type === 4 || c.max === 0)).toBe(true);
    const w = arena();
    const m = put(w, 'shambler', 5);
    m.enc!.sideT = 0;
    steps(w, 120);
    const pools = w.effects.filter((e) => e.kind === 'caustic');
    expect(pools.length).toBe(1);
    const other = put(w, 'shambler', -5);
    other.enc!.sideT = 0;
    steps(w, 4);
    expect(other.action?.profile.skill.id ?? '').not.toBe(sidearmSkillId('shambler'));
  });

  it('every sidearm builds, and has a line on the inspect card', () => {
    for (const id of Object.keys(TYPE_SIDEARMS) as MonsterTypeId[]) {
      const m = buildMonster(spec(id, 80));
      expect(m.sidearm, id).toBeDefined();
      expect(m.sidearm!.profile(0).skill.castTime, id).toBeGreaterThan(0);
      expect(encounterTexts(id).length, id).toBeGreaterThan(0);
    }
  });
});

describe('patterns (docs/ENCOUNTERS.md 4)', () => {
  const blast = (o: Partial<GroundEffect>): GroundEffect => ({
    id: 1,
    x: 0,
    y: 0,
    radius: 2,
    t: 1,
    total: 1,
    kind: 'slam',
    damage: 1,
    dtype: 0,
    faction: 1,
    ...o,
  });

  it('a lane, a wedge and a donut cover what they say', () => {
    const lane = blast({ shape: 'lane', x2: 10, y2: 0, width: 1 });
    expect(inBlast(lane, 5, 0.3)).toBe(true);
    expect(inBlast(lane, 5, 1.5)).toBe(false);
    const donut = blast({ shape: 'donut', inner: 3, radius: 10 });
    expect(inBlast(donut, 1, 0)).toBe(false);
    expect(inBlast(donut, 5, 0)).toBe(true);
    // A body that reaches over the safe edge is caught.
    expect(inBlast(donut, 2.8, 0, 0.4)).toBe(true);
    const wedge = blast({ shape: 'wedge', facing: 0, half: Math.PI / 4, radius: 4 });
    expect(inBlast(wedge, 3, 0.5)).toBe(true);
    expect(inBlast(wedge, -3, 0)).toBe(false);
  });

  it("a Mage's March lays blasts one after another toward the character; a later one is not a hazard until it shows", () => {
    const w = arena();
    const m = put(w, 'mage', 7);
    m.enc!.sideT = 0;
    let laid: GroundEffect[] = [];
    for (let i = 0; i < 120 && !laid.length; i++) {
      stepWorld(w);
      laid = w.effects.filter((e) => e.label === 'March');
    }
    expect(laid.length).toBe(PATTERNS.march.steps.length);
    // In order from the Mage, each later than the one before.
    const d = laid.map((e) => Math.hypot(e.x - m.x, e.y - m.y));
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeGreaterThan(d[i - 1]);
    const last = laid[laid.length - 1];
    expect(last.delay).toBeGreaterThan(0);
    expect(hazardAt(w, last.x, last.y)).toBeNull();
    // The first one is up at once.
    expect(hazardAt(w, laid[0].x, laid[0].y)).not.toBeNull();
    // They land, and the recap names them.
    const before = w.dmgLog.length;
    steps(w, 150);
    expect(w.effects.some((e) => e.label === 'March')).toBe(false);
    expect(w.dmgLog.slice(before).some((l) => l.name === 'March')).toBe(true);
  });
});

describe('windows (docs/ENCOUNTERS.md 5)', () => {
  function braced(): { w: World; m: Actor } {
    const w = arena();
    const m = put(w, 'shieldbearer', 2);
    m.enc!.winT = 0;
    // It braces once the blow it may be in the middle of is done.
    for (let i = 0; i < 180 && m.enc!.warnT <= 0; i++) stepWorld(w);
    expect(m.enc!.warnT).toBeGreaterThan(0);
    steps(w, Math.ceil(TYPE_WINDOWS.shieldbearer!.warn * 60) + 2);
    expect(m.enc!.openT).toBeGreaterThan(0);
    return { w, m };
  }

  it('a Brace turns aside hits from the front, not from behind', () => {
    const { w, m } = braced();
    const p = w.player;
    const prof = w.char.profile(w.primary, 0);
    const life = m.life;
    for (let i = 0; i < 5; i++) hit(w, p, m, prof, 0, 1);
    expect(m.life).toBe(life);
    expect(w.events.some((e) => e.t === 'block' && e.dst === m.id)).toBe(true);
    // From behind the shield, the same blow lands.
    const back = { ...p, x: m.x + (m.x - p.x), y: m.y + (m.y - p.y) } as Actor;
    for (let i = 0; i < 5; i++) hit(w, back, m, prof, 0, 1);
    expect(m.life).toBeLessThan(life);
  });

  it('damage over time goes on through a Brace', () => {
    const { w, m } = braced();
    const life = m.life;
    applyDamage(w, m, [0, 0, 0, 10, 0]);
    expect(m.life).toBeLessThan(life);
  });

  it('a stunned Shieldbearer drops its Brace', () => {
    const { w, m } = braced();
    m.stunT = 0.5;
    steps(w, 2);
    expect(m.enc!.openT).toBe(0);
  });

  it('a braced monster holds its ground', () => {
    const { w, m } = braced();
    const x = m.x;
    const y = m.y;
    steps(w, 20);
    expect(Math.hypot(m.x - x, m.y - y)).toBeLessThan(0.3);
  });
});
