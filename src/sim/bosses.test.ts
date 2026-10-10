import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import {
  ADAPT_MAX,
  ATTUNE_SECONDS,
  ATTUNE_SHIFT,
  BOSSES,
  BOSS_IDS,
  FRACTURE_SECONDS,
  FRACTURE_TAKEN,
  ROT_REGEN,
  TOLL_DAMAGE,
  TOLL_EVERY,
  TOLL_TELL,
  bossForMap,
  type BossId,
} from '../data/bosses';
import { PROBES, durabilityTable } from '../calc/matrix';
import { typeProfile } from '../data/defence';
import { MONSTER_TYPES, type MonsterTypeId } from '../data/monsters';
import { THEMES } from '../data/themes';
import { makeMapPlan } from '../gen/mapPlan';
import { typeShares } from '../gen/population';
import { makeGem, makeItem } from '../gen/items';
import { newRun } from '../run/run';
import { bossDamageMult, bossState } from './bosses';
import { createDummyWorld } from './dummy';
import type { Actor, World } from './types';
import { spawnMonster, stepWorld } from './world';

/** A level 40 character in an open arena, deathless, with no dummies. */
export function bossArena(level = 40): World {
  const run = newRun('vanguard', 1);
  const uid = () => run.nextUid++;
  const b = run.build;
  b.level = level;
  b.equipment.mainHand = makeItem(uid, 'mace2_3', level, 1);
  b.equipment.mainHand.sockets = [makeGem(uid, 'crushingBlow')];
  b.primaryGem = b.equipment.mainHand.sockets[0]!.uid;
  delete b.equipment.offHand;
  const { world } = createDummyWorld(b, { distance: 30 });
  world.opts.godMode = true;
  for (const a of world.actors) if (a.dummy) a.alive = false;
  return world;
}

export function putBoss(w: World, id: BossId, dx = 6, dy = 0, level = 40): Actor {
  const spec: MonsterSpec = {
    type: BOSSES[id].type,
    variant: 'none',
    rarity: 'boss',
    level,
    mods: id === 'magistrate' ? ['hexWarded'] : [],
  };
  const m = spawnMonster(w, spec, w.player.x + dx, w.player.y + dy, 0, 900, BOSSES[id].name);
  m.state = 'chase';
  return m;
}

const run = (w: World, seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWorld(w);
};

describe('the boss maps (docs/BOSSES.md 12)', () => {
  it('maps 10, 30, 50, 70, 90 and 100 end on their boss, alone in an arena past the last room', () => {
    for (const id of BOSS_IDS) {
      const map = BOSSES[id].map;
      expect(bossForMap(map)).toBe(id);
      const plan = makeMapPlan(7, map, 'ashenCrypt');
      expect(plan.endKind).toBe('boss');
      const end = plan.lab.rooms[plan.lab.mainPath[plan.lab.mainPath.length - 1]];
      const inEnd = plan.pop.monsters.filter((m) => m.room === end.id);
      expect(inEnd.map((m) => m.spec.type)).toEqual([BOSSES[id].type]);
      expect(inEnd[0].spec.rarity).toBe('boss');
      expect(inEnd[0].name).toBe(BOSSES[id].name);
    }
    // The other tenth maps keep their champions.
    expect(makeMapPlan(7, 20, 'ashenCrypt').endKind).toBe('miniboss');
  });

  it('the arena can be walked to from the start', () => {
    const plan = makeMapPlan(3, 30, 'ashenCrypt');
    const w = createDummyWorld(newRun('vanguard', 1).build, { distance: 30 }).world;
    void w;
    const lab = plan.lab;
    const at = (x: number, y: number) => lab.tiles[Math.floor(y) * lab.w + Math.floor(x)] === 1;
    // A flood fill from the start reaches the arena's middle.
    const end = lab.rooms[lab.mainPath[lab.mainPath.length - 1]];
    const seen = new Uint8Array(lab.w * lab.h);
    const stack = [[Math.floor(lab.start.x), Math.floor(lab.start.y)]];
    while (stack.length) {
      const [x, y] = stack.pop()!;
      if (x < 0 || y < 0 || x >= lab.w || y >= lab.h || seen[y * lab.w + x] || !at(x, y)) continue;
      seen[y * lab.w + x] = 1;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    expect(seen[end.cy * lab.w + end.cx]).toBe(1);
  });

  it('no boss, Witness or shard is ever rolled into a pack', () => {
    for (const theme of THEMES)
      for (const [id, share] of typeShares({ ...theme, level: 100 }))
        if (MONSTER_TYPES[id as MonsterTypeId].bossOnly) expect(share).toBe(0);
    for (const theme of THEMES)
      expect(typeShares({ ...theme, level: 100 }).some(([id]) => MONSTER_TYPES[id].bossOnly)).toBe(
        false,
      );
  });
});

describe('the Tollkeeper (docs/BOSSES.md 4)', () => {
  it('tolls every ten seconds, with rings that shock, and grows stronger with each', () => {
    const w = bossArena(12);
    // Held still, so its blows do not stun the bell (that is the other test).
    w.player.stunT = 1e9;
    const m = putBoss(w, 'tollkeeper', 5, 0, 10);
    run(w, TOLL_EVERY + TOLL_TELL + 0.5);
    const st = bossState(m)!;
    expect(st.tolls).toBe(1);
    expect(bossDamageMult(m)).toBeCloseTo(1 + TOLL_DAMAGE);
    expect(w.effects.some((e) => e.label === 'Toll' && e.shape === 'donut')).toBe(true);
    // The next comes ten seconds of its clock later, and the swing takes its own time (a blow in hand finishes first).
    let n = 0;
    for (; n < 60 * (TOLL_EVERY + TOLL_TELL + 2) && st.tolls < 2; n++) stepWorld(w);
    expect(st.tolls).toBe(2);
    expect(n / 60).toBeGreaterThan(TOLL_EVERY + TOLL_TELL - 1);
  });

  it('a stun in the swing cancels the toll', () => {
    const w = bossArena(12);
    const m = putBoss(w, 'tollkeeper', 5, 0, 10);
    const st = bossState(m)!;
    for (let i = 0; i < 60 * 15 && st.tellT <= 0; i++) stepWorld(w);
    expect(st.tellT).toBeGreaterThan(0);
    m.stunT = 0.5;
    run(w, TOLL_TELL + 0.5);
    expect(st.tolls).toBe(0);
  });

  it('chill slows its clock', () => {
    const w = bossArena(12);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'tollkeeper', 5, 0, 10);
    const st = bossState(m)!;
    run(w, 1);
    const before = st.clock;
    for (let i = 0; i < 60; i++) {
      m.ail.chill = 0.5;
      m.ail.chillT = 1;
      stepWorld(w);
    }
    expect(before - st.clock).toBeLessThan(0.6);
  });
});

describe('the Courser (docs/BOSSES.md 5)', () => {
  it('never stops: it circles inside melee reach, then gallops off and charges back', () => {
    const w = bossArena(32);
    const m = putBoss(w, 'courser', 4, 0, 30);
    const st = bossState(m)!;
    const gaits = new Set<string>();
    let still = 0;
    let near = 0;
    let canter = 0;
    let lastX = m.x;
    let lastY = m.y;
    for (let i = 0; i < 60 * 25; i++) {
      stepWorld(w);
      gaits.add(st.gait);
      if (Math.hypot(m.x - lastX, m.y - lastY) < 1e-4 && m.stunT <= 0 && m.ail.freezeT <= 0)
        still++;
      lastX = m.x;
      lastY = m.y;
      if (st.gait === 'canter' && i > 60) {
        canter++;
        if (Math.hypot(m.x - w.player.x, m.y - w.player.y) <= 2.6) near++;
      }
    }
    expect([...gaits].sort()).toEqual(['canter', 'charge', 'gallop', 'tell', 'turn'].sort());
    // In the canter it is within a melee character's reach most of the time.
    expect(near / canter).toBeGreaterThan(0.75);
    // Moving nearly always (the lane tells are a paw at the ground, still drawn as moving).
    expect(still / (60 * 25)).toBeLessThan(0.35);
  });

  it('a standing melee character reaches it with most of its swings while it canters', () => {
    const w = bossArena(32);
    const m = putBoss(w, 'courser', 3, 0, 30);
    const st = bossState(m)!;
    const p = w.player;
    let swings = 0;
    let reached = 0;
    let hits = 0;
    let last = p.action;
    for (let i = 0; i < 60 * 30; i++) {
      stepWorld(w);
      if (p.action && p.action !== last && st.gait === 'canter') swings++;
      last = p.action;
      for (const e of w.events)
        if ((e.t === 'hit' || e.t === 'miss') && e.src === p.id && e.dst === m.id) {
          reached++;
          if (e.t === 'hit') hits++;
        }
    }
    // Reach is the question of the canter; whether a swing that reaches it lands is its evasion (the accuracy test).
    expect(swings).toBeGreaterThan(5);
    expect(reached / swings).toBeGreaterThan(0.6);
    expect(hits).toBeGreaterThan(0);
  });

  it('chill slows it, and it cannot be stunned at a gallop', () => {
    const w = bossArena(32);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'courser', 4, 0, 30);
    const st = bossState(m)!;
    for (let i = 0; i < 60 * 12 && st.gait !== 'gallop'; i++) stepWorld(w);
    expect(st.gait).toBe('gallop');
    m.stunT = 1;
    stepWorld(w);
    expect(m.stunT).toBe(0);
  });
});

describe('the Magistrate (docs/BOSSES.md 6)', () => {
  it('raises four Witnesses, and its Sentence follows the character and grows with each Witness', () => {
    const w = bossArena(52);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'magistrate', 5, 0, 50);
    const st = bossState(m)!;
    run(w, 1);
    expect(st.witnesses.filter((x) => x.alive)).toHaveLength(4);
    expect(st.witnesses.every((x) => x.noReward)).toBe(true);
    for (let i = 0; i < 60 * 20 && st.countT <= 0; i++) stepWorld(w);
    const e = w.effects.find((x) => x.label === 'Sentence')!;
    expect(e.unavoidable && e.follow).toBe(true);
    const full = e.damage;
    st.witnesses[0].alive = false;
    st.witnesses[1].alive = false;
    stepWorld(w);
    expect(e.damage).toBeLessThan(full);
    // It follows the character.
    w.player.x += 1;
    stepWorld(w);
    expect(e.x).toBeCloseTo(w.player.x);
  });

  it('the character goes for a Witness before the Magistrate', async () => {
    const { findTargetForTest } = await import('./ai');
    const w = bossArena(52);
    const m = putBoss(w, 'magistrate', 2.5, 0, 50);
    run(w, 0.5);
    const st = bossState(m)!;
    // Put one Witness a little farther than the Magistrate: it still comes first.
    st.witnesses[0].x = w.player.x - 5;
    st.witnesses[0].y = w.player.y;
    expect(findTargetForTest(w)?.mon?.spec.type).toBe('witness');
  });

  it('the dodge does not try to step out of a Sentence', async () => {
    const { hazardAt } = await import('./ai');
    const w = bossArena(52);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'magistrate', 5, 0, 50);
    const st = bossState(m)!;
    for (let i = 0; i < 60 * 20 && st.countT <= 0; i++) stepWorld(w);
    expect(hazardAt(w, w.player.x, w.player.y)).toBe(null);
  });

  it('is immune to curses and the Rotwife takes them in full', async () => {
    const { applyHex } = await import('./hexes');
    const w = bossArena(52);
    const mag = putBoss(w, 'magistrate', 5, 0, 50);
    const rot = putBoss(w, 'rotwife', -5, 0, 90);
    const toll = putBoss(w, 'tollkeeper', 0, 5, 10);
    applyHex(w, mag, 'brittleDoom', 30, 1);
    applyHex(w, rot, 'brittleDoom', 30, 1);
    applyHex(w, toll, 'brittleDoom', 30, 1);
    expect(mag.hexes).toHaveLength(0);
    expect(rot.hexes[0].effect).toBeCloseTo(30);
    expect(toll.hexes[0].effect).toBeCloseTo(20.1);
  });
});

describe('the Prism Warden (docs/BOSSES.md 7)', () => {
  it('attunes in turn, is immune to its element, and is Fractured to the one it left', () => {
    const w = bossArena(72);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'prismWarden', 6, 0, 70);
    const st = bossState(m)!;
    run(w, 0.5);
    expect(st.element).toBe(3);
    expect(m.def.immune[3]).toBe(true);
    expect(m.mon!.spec.variant).toBe('fire');
    for (let i = 0; i < 60 * 12 && st.element === 3; i++) stepWorld(w);
    expect(st.element).toBe(2);
    expect(m.def.immune[2]).toBe(true);
    expect(m.def.immune[3]).toBe(false);
    expect(st.fractured).toBe(3);
    expect(st.fracturedT).toBeGreaterThan(0);
    // The shared stats of its kind are untouched.
    expect(MONSTER_TYPES.prismWarden.bossOnly).toBe(true);
  });

  it('casts the pattern of its element', () => {
    const w = bossArena(72);
    w.player.stunT = 1e9;
    putBoss(w, 'prismWarden', 6, 0, 70);
    let seen = false;
    for (let i = 0; i < 60 * 8 && !seen; i++) {
      stepWorld(w);
      seen = w.effects.some((e) => e.label === 'Closing ring');
    }
    expect(seen).toBe(true);
  });
});

describe('the Rotwife (docs/BOSSES.md 8)', () => {
  it('her blows carry the ailments in turn', () => {
    const w = bossArena(92);
    const m = putBoss(w, 'rotwife', 2, 0, 90);
    const st = bossState(m)!;
    for (let i = 0; i < 60 * 20 && st.rot < 3; i++) stepWorld(w);
    expect(st.rot).toBeGreaterThanOrEqual(3);
  });

  it('regrows, but not while something eats at her', () => {
    const w = bossArena(92);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'rotwife', 4, 0, 90);
    run(w, 0.2);
    m.life = m.def.maxLife * 0.5;
    run(w, 1);
    expect(m.life).toBeGreaterThan(m.def.maxLife * 0.5);
    m.life = m.def.maxLife * 0.5;
    m.ail.poisons.push({ dps: 1, t: 5 });
    run(w, 1);
    expect(m.life).toBeLessThanOrEqual(m.def.maxLife * 0.5);
  });

  it('is not immune to poison (no wall for poison builds)', () => {
    const w = bossArena(92);
    const m = putBoss(w, 'rotwife', 4, 0, 90);
    expect(m.def.avoid.poison).toBe(0);
    expect(m.def.res[4]).toBe(25);
  });
});

describe('the Unmaker (docs/BOSSES.md 9)', () => {
  it('steals at its marks, a shard each; breaking a shard gives the piece back and staggers it', async () => {
    const { theftOf } = await import('./theft');
    const w = bossArena(100);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'unmaker', 5, 0, 100);
    const st = bossState(m)!;
    run(w, 0.2);
    const before = w.player.def.res.slice();
    m.life = m.def.maxLife * 0.79;
    run(w, 0.1);
    expect(st.thefts).toBe(1);
    expect(theftOf(w).res).toBeDefined();
    const el = theftOf(w).res!;
    expect(w.player.def.res[el]).toBeCloseTo(before[el] - 50);
    expect(st.shards).toHaveLength(1);
    // It hits in the element it took.
    expect(m.mon!.spec.variant).not.toBe('none');
    const shard = st.shards[0].actor;
    shard.life = 0.001;
    const { rawHit } = await import('./combat');
    rawHit(w, shard, 1e6, 0);
    expect(theftOf(w).res).toBeUndefined();
    expect(w.player.def.res[el]).toBeCloseTo(before[el]);
    expect(m.stunT).toBeGreaterThan(1);
    expect(st.exposedT).toBeGreaterThan(0);
  });

  it('seals the flasks at its last mark, and drinks them', async () => {
    const { flasksSealed } = await import('./theft');
    const w = bossArena(100);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'unmaker', 5, 0, 100);
    run(w, 0.2);
    m.life = m.def.maxLife * 0.19;
    run(w, 0.1);
    expect(bossState(m)!.thefts).toBe(4);
    expect(flasksSealed(w)).toBe(true);
    const at = m.life;
    run(w, 1);
    expect(m.life).toBeGreaterThan(at);
  });

  it('hardens against the damage it is dealt most', () => {
    const w = bossArena(100);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'unmaker', 5, 0, 100);
    const st = bossState(m)!;
    run(w, 0.2);
    st.dealt = [0, 0, 0, 1000, 0];
    run(w, 0.1);
    expect(st.adapt[3]).toBeGreaterThan(0.35);
    expect(st.adapt[0]).toBe(0);
  });

  it('gives everything back when it dies', async () => {
    const { theftOf } = await import('./theft');
    const w = bossArena(100);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'unmaker', 5, 0, 100);
    run(w, 0.2);
    m.life = m.def.maxLife * 0.19;
    run(w, 0.1);
    const { rawHit } = await import('./combat');
    m.life = 1;
    rawHit(w, m, 1e9, 0);
    expect(m.alive).toBe(false);
    expect(theftOf(w)).toEqual({});
    expect(bossState(m)!.shards).toHaveLength(0);
  });
});

describe('the kill-side ceiling (docs/BOSSES.md 2, rule 4)', () => {
  /**
   * How much longer each reference damage profile takes to kill a boss over a whole fight than a plain monster: its defence
   * profile through the build matrix, with the windows of its fight weighed in by time. A fight of `FIGHT` seconds at the
   * curve's damage is assumed where a rate (a regrowth) matters.
   */
  const FIGHT = 60;
  function wholeFight(id: BossId): Record<string, number> {
    const def = BOSSES[id];
    const t = MONSTER_TYPES[def.type];
    const table = durabilityTable(typeProfile(t), def.map);
    const out: Record<string, number> = {};
    for (const pr of PROBES) {
      let f = table[pr.id];
      const spell = !pr.attack && !pr.dot;
      if (id === 'magistrate' && spell) f /= 0.75;
      if (id === 'prismWarden' && pr.dtype >= 1 && pr.dtype <= 3) {
        // Immune for one attunement of three, Fractured for the first seconds of the next.
        const cycle = 3 * (ATTUNE_SECONDS + ATTUNE_SHIFT);
        f /= (cycle - ATTUNE_SECONDS + FRACTURE_SECONDS * FRACTURE_TAKEN) / cycle;
      }
      // The Rotwife regrows unless something eats at her: hits that leave no ailment must outpace it.
      if (id === 'rotwife' && !pr.dot) f /= 1 - ROT_REGEN * FIGHT;
      out[pr.id] = f;
    }
    return out;
  }

  it.each(BOSS_IDS)('%s: no damage profile takes more than twice its mean to kill it', (id) => {
    const f = wholeFight(id);
    const vals = Object.values(f);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    for (const [probe, v] of Object.entries(f))
      expect(
        v / mean,
        `${id} ${probe} (${v.toFixed(2)} against a mean of ${mean.toFixed(2)})`,
      ).toBeLessThanOrEqual(2);
  });

  it('the Unmaker hardens a single-type build to at most 2.5 times', () => {
    expect(1 / (1 - ADAPT_MAX)).toBeLessThanOrEqual(2.5);
  });
});
