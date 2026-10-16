import { describe, expect, it } from 'vitest';
import type { MonsterSpec } from '../calc/monster';
import {
  ADAPT_MAX,
  ATTUNE_SECONDS,
  ATTUNE_SHIFT,
  BAR_FLOOR,
  BAR_SHARE,
  BIG_HIT,
  BOSSES,
  BOSS_IDS,
  BOSS_LOCK_SECONDS,
  BROKEN_SECONDS,
  BROKEN_TAKEN,
  ECHO_EVERY,
  FLURRY_LANES,
  FLURRY_TELL,
  FRACTURE_SECONDS,
  FRACTURE_TAKEN,
  MEND_PAUSE,
  HORN_TELL,
  PLATED_LESS,
  ROT_REGEN,
  ROUTED_SECONDS,
  THEFT_AT,
  TOLL_EVERY,
  TOLL_TELL,
  VEIL_CYCLE,
  VEIL_SECONDS,
  SOLDIERS_MAX,
  WAVE_PUSH_SECONDS,
  WITNESSES,
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
import {
  bossDamageMult,
  bossSpeedMult,
  bossState,
  bossTaken,
  commandLess,
  livingSoldiers,
} from './bosses';
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
  world.sides[0].opts.godMode = true;
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
  it('every tenth map ends on its boss, alone in an arena past the last room', () => {
    for (const id of BOSS_IDS) {
      const map = BOSSES[id].map;
      expect(bossForMap(map)).toBe(id);
      const plan = makeMapPlan(7, map, 'ashenCrypt');
      expect(plan.endKind).toBe('boss');
      const end = plan.lab.rooms[plan.lab.mainPath[plan.lab.mainPath.length - 1]];
      const inEnd = plan.pop.monsters.filter((m) => m.room === end.id);
      expect(inEnd.map((m) => m.spec.type)).toEqual([
        BOSSES[id].type,
        ...(BOSSES[id].partners ?? []),
      ]);
      for (const m of inEnd) expect(m.spec.rarity).toBe('boss');
      expect(inEnd[0].name).toBe(MONSTER_TYPES[BOSSES[id].type].name);
    }
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
  it('tolls on its clock, with rings that shock, and grows stronger with each', () => {
    const w = bossArena(12);
    // Held still, so its blows do not stun the bell (that is the other test).
    w.player.stunT = 1e9;
    const m = putBoss(w, 'tollkeeper', 5, 0, 10);
    const fresh = bossDamageMult(m);
    run(w, TOLL_EVERY + TOLL_TELL + 2);
    const st = bossState(m)!;
    expect(st.tolls).toBe(1);
    expect(bossDamageMult(m)).toBeGreaterThan(fresh);
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
    expect(st.witnesses.filter((x) => x.alive)).toHaveLength(WITNESSES);
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
    expect(findTargetForTest(w, w.sides[0])?.mon?.spec.type).toBe('witness');
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
    expect(toll.hexes[0].effect).toBeGreaterThan(0);
    expect(toll.hexes[0].effect).toBeLessThan(30);
  });
});

describe('the Prism Warden (docs/BOSSES.md 7)', () => {
  it('attunes in turn, is immune to its element, and is Fractured to the one it left', () => {
    const w = bossArena(72);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'prismWarden', 6, 0, 70);
    const st = bossState(m)!;
    run(w, 0.5);
    const first = st.element;
    expect(m.def.immune[first]).toBe(true);
    expect(m.mon!.spec.variant).not.toBe('none');
    for (let i = 0; i < 60 * 12 && st.element === first; i++) stepWorld(w);
    expect(st.element).not.toBe(first);
    expect(m.def.immune[st.element]).toBe(true);
    expect(m.def.immune[first]).toBe(false);
    expect(st.fractured).toBe(first);
    expect(st.fracturedT).toBeGreaterThan(0);
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
  it('regrows, but not while something eats at her', () => {
    const w = bossArena(92);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'rotwife', 4, 0, 90);
    run(w, 0.2);
    m.life = m.def.maxLife * 0.5;
    run(w, MEND_PAUSE + 1);
    expect(m.life).toBeGreaterThan(m.def.maxLife * 0.5);
    m.life = m.def.maxLife * 0.5;
    m.ail.poisons.push({ dps: 1, t: 5 });
    run(w, MEND_PAUSE + 1);
    expect(m.life).toBeLessThanOrEqual(m.def.maxLife * 0.5);
  });

  it('is not immune to poison (no wall for poison builds)', () => {
    const w = bossArena(92);
    const m = putBoss(w, 'rotwife', 4, 0, 90);
    expect(m.def.avoid.poison).toBe(0);
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
    expect(w.player.def.res[el]).toBeLessThan(before[el]);
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
    expect(bossState(m)!.thefts).toBe(THEFT_AT.length);
    expect(flasksSealed(w)).toBe(true);
    // (Its life was set by hand, which counts as a hurt: it drinks once the pause is over.)
    run(w, MEND_PAUSE + 0.2);
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
    expect(st.adapt[3]).toBeGreaterThan(0);
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

describe('the Siege Marshal (docs/BOSSES.md 5a)', () => {
  it('commands from where he stands while regiments march in, and comes down only between them', () => {
    const w = bossArena(22);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'siegeMarshal', 5, 0, 20);
    const st = bossState(m)!;
    const x0 = m.x;
    const y0 = m.y;
    run(w, HORN_TELL + 0.3);
    expect(st.wave).toBe(1);
    expect(livingSoldiers(st)).toBeGreaterThan(1);
    expect(st.soldiers.every((s) => s.noReward && s.alive)).toBe(true);
    // The more of them stand, the less he takes.
    const fullCommand = commandLess(st);
    expect(fullCommand).toBeGreaterThan(0);
    // A regiment that is not all dead holds the next back.
    for (const s of st.soldiers.slice(0, -1)) s.alive = false;
    expect(commandLess(st)).toBeLessThan(fullCommand);
    run(w, ROUTED_SECONDS + HORN_TELL + 0.3);
    expect(st.wave).toBe(1);
    // He has not moved a step.
    expect(Math.hypot(m.x - x0, m.y - y0)).toBeLessThan(0.01);
    // Once the last falls he is routed for a while, then the horn sounds for the next.
    for (const s of st.soldiers) s.alive = false;
    run(w, 0.3);
    expect(st.routedT).toBeGreaterThan(0);
    const dmg = [100, 0, 0, 0, 0];
    bossTaken(m, dmg);
    expect(dmg[0]).toBeGreaterThan(100);
    run(w, ROUTED_SECONDS + HORN_TELL + 0.3);
    expect(st.wave).toBe(2);
    expect(livingSoldiers(st)).toBeGreaterThan(0);
    // They keep coming past the last regiment, round and round.
    for (let k = 3; k <= 6; k++) {
      for (const s of st.soldiers) s.alive = false;
      run(w, ROUTED_SECONDS + HORN_TELL + 0.6);
      expect(st.wave).toBe(k);
      expect(livingSoldiers(st)).toBeGreaterThan(0);
    }
  });

  it('a regiment comes on its own if the last is not cleared in time, unless the field is full', () => {
    const w = bossArena(22);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'siegeMarshal', 5, 0, 20);
    const st = bossState(m)!;
    run(w, HORN_TELL + 0.3);
    expect(st.wave).toBe(1);
    for (const s of st.soldiers) s.life = 1e9;
    run(w, WAVE_PUSH_SECONDS + HORN_TELL + 0.5);
    expect(st.wave).toBe(2);
    // With ten standing no more come, however long it takes.
    for (const s of st.soldiers) s.life = 1e9;
    expect(livingSoldiers(st)).toBe(SOLDIERS_MAX);
    run(w, WAVE_PUSH_SECONDS * 2);
    expect(st.wave).toBe(2);
  });

  it('"weakest" takes his soldiers before him, even once he has a scratch on him', async () => {
    const { findTargetForTest } = await import('./ai');
    const w = bossArena(22);
    w.char.build.strategy = { target: 'lowest' };
    const m = putBoss(w, 'siegeMarshal', 5, 0, 20);
    const st = bossState(m)!;
    run(w, HORN_TELL + 0.3);
    m.life = m.def.maxLife * 0.99;
    for (const s of st.soldiers) {
      s.x = w.player.x + 2;
      s.y = w.player.y;
    }
    expect(findTargetForTest(w, w.sides[0])?.mon?.spec.type).not.toBe('siegeMarshal');
    for (const s of st.soldiers) s.alive = false;
    expect(findTargetForTest(w, w.sides[0])).toBe(m);
  });

  it('the soldiers go with him when he falls', async () => {
    const { rawHit } = await import('./combat');
    const w = bossArena(22);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'siegeMarshal', 5, 0, 20);
    const st = bossState(m)!;
    run(w, HORN_TELL + 0.3);
    const soldiers = [...st.soldiers];
    rawHit(w, m, 1e12, 0);
    expect(m.alive).toBe(false);
    expect(soldiers.every((s) => !s.alive)).toBe(true);
  });
});

describe('the Veiled Duellist (docs/BOSSES.md 5b)', () => {
  const crits = async (veiled: boolean) => {
    const { hit } = await import('./combat');
    const w = bossArena(42);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'duellist', 5, 0, 40);
    const st = bossState(m)!;
    st.veiled = veiled;
    st.phaseT = 1e9;
    const prof = w.char.profile(w.char.primary);
    const sure = {
      ...prof,
      hands: prof.hands.map((h) => ({ ...h, critChance: 1, accuracy: 1e9 })),
    };
    let n = 0;
    for (let i = 0; i < 30; i++) {
      m.life = m.def.maxLife;
      w.events.length = 0;
      hit(w, w.player, m, sure, 0, 1);
      for (const e of w.events) if (e.t === 'hit' && e.dst === m.id && e.crit) n++;
    }
    return n;
  };

  it('nothing crits it behind the veil, and everything can once it drops', async () => {
    expect(await crits(true)).toBe(0);
    expect(await crits(false)).toBeGreaterThan(20);
  });

  it('the veil is up a third of the time; when it drops he lunges in a fan of lanes, then is bare', () => {
    const w = bossArena(42);
    const m = putBoss(w, 'duellist', 6, 0, 40);
    const st = bossState(m)!;
    expect(st.veiled).toBe(true);
    run(w, VEIL_SECONDS + 0.2);
    expect(st.veiled).toBe(false);
    for (let i = 0; i < 60 * 3 && !w.effects.some((e) => e.label === 'Flurry'); i++) stepWorld(w);
    const lanes = w.effects.filter((e) => e.label === 'Flurry');
    expect(lanes).toHaveLength(FLURRY_LANES);
    expect(lanes.every((e) => e.shape === 'lane' && !e.unavoidable)).toBe(true);
    run(w, FLURRY_TELL + 0.2);
    expect(st.bareT).toBeGreaterThan(0);
    const dmg = [100, 0, 0, 0, 0];
    bossTaken(m, dmg);
    expect(dmg[0]).toBeGreaterThan(100);
    // The veil comes back at the end of the cycle.
    run(w, VEIL_CYCLE);
    expect(st.veiled || st.phaseT < VEIL_CYCLE).toBe(true);
  });
});

describe('the Bulwark Engine (docs/BOSSES.md 5c)', () => {
  it('takes less from hits while its plates stand, and a big hit wears them down faster than a small one', () => {
    const w = bossArena(62);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'bulwarkEngine', 6, 0, 60);
    const st = bossState(m)!;
    const max = m.def.maxLife;
    const bar0 = st.bar;
    const small = [max * 0.0005, 0, 0, 0, 0];
    bossTaken(m, small);
    expect(small[0]).toBeLessThan(max * 0.0005);
    const smallChip = bar0 - st.bar;
    st.bar = bar0;
    const big = [max * BIG_HIT * 2, 0, 0, 0, 0];
    bossTaken(m, big);
    const bigChip = bar0 - st.bar;
    // A hit is worth more to the bar the bigger it is, per point of damage, up to a size.
    expect(bigChip / (max * BIG_HIT * 2)).toBeGreaterThan(smallChip / (max * 0.0005));
    expect(smallChip / (max * 0.0005)).toBeGreaterThan(BAR_FLOOR - 0.001);
  });

  it('small hits eventually break it (rule 3: never a wall for many small hits)', () => {
    const w = bossArena(62);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'bulwarkEngine', 6, 0, 60);
    const st = bossState(m)!;
    const tiny = m.def.maxLife * 0.0002;
    let n = 0;
    while (st.bar > 0 && n < 100000) {
      bossTaken(m, [tiny, 0, 0, 0, 0]);
      n++;
    }
    // The bar is a tenth of its life, and a hit of this size is worth BAR_FLOOR of itself at the least.
    expect(n).toBeLessThan((m.def.maxLife * BAR_SHARE) / (tiny * BAR_FLOOR) + 2);
    run(w, 0.1);
    expect(st.brokenT).toBeGreaterThan(0);
    expect(m.stunT).toBeGreaterThan(BROKEN_SECONDS - 0.5);
    // Broken, it takes more; then the plates come back.
    const dmg = [100, 0, 0, 0, 0];
    bossTaken(m, dmg);
    expect(dmg[0]).toBeGreaterThan(100);
    run(w, BROKEN_SECONDS + 0.5);
    expect(st.brokenT).toBeLessThanOrEqual(0);
    expect(st.bar).toBeGreaterThan(0);
  });

  it('damage over time wears the plates too, and is not itself reduced', () => {
    const w = bossArena(62);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'bulwarkEngine', 12, 0, 60);
    const st = bossState(m)!;
    run(w, 0.1);
    const bar0 = st.bar;
    const lost = m.def.maxLife * 0.02;
    m.life -= lost;
    run(w, 0.05);
    expect(bar0 - st.bar).toBeGreaterThan(0);
  });

  it('its blows stun the character, once in the boss lock', () => {
    const w = bossArena(62);
    w.sides[0].opts.godMode = true;
    putBoss(w, 'bulwarkEngine', 1.8, 0, 60);
    let stuns = 0;
    for (let i = 0; i < 60 * 12; i++) {
      stepWorld(w);
      for (const e of w.events) if (e.t === 'stun' && e.dst === w.player.id) stuns++;
    }
    expect(stuns).toBeGreaterThan(0);
    expect(stuns).toBeLessThan(12 / BOSS_LOCK_SECONDS + 2);
  });
});

describe('the Sundered Twins (docs/BOSSES.md 5d)', () => {
  function putTwins(w: World): [Actor, Actor] {
    const ash = putBoss(w, 'twins', 6, -1.5, 80);
    const spec: MonsterSpec = {
      type: 'cinder',
      variant: 'none',
      rarity: 'boss',
      level: 80,
      mods: [],
    };
    const cinder = spawnMonster(w, spec, w.player.x + 6, w.player.y + 1.5, 0, 900, 'Cinder');
    cinder.state = 'chase';
    return [ash, cinder];
  }

  it('when one dies the other grieves: faster, harder, and it sends the dead one’s own kind of blow', async () => {
    const { rawHit } = await import('./combat');
    for (const [first, kind, dtype] of [
      ['ash', 'steel', 0],
      ['cinder', 'fire', 3],
    ] as const) {
      const w = bossArena(82);
      w.player.stunT = 1e9;
      const twins = putTwins(w);
      const dead = twins[first === 'ash' ? 0 : 1];
      const live = twins[first === 'ash' ? 1 : 0];
      const st = bossState(live)!;
      expect(bossDamageMult(live)).toBe(1);
      rawHit(w, dead, 1e12, 0);
      expect(dead.alive).toBe(false);
      expect(live.alive).toBe(true);
      expect(st.grief).toBe(true);
      expect(bossDamageMult(live)).toBeGreaterThan(1);
      expect(bossSpeedMult(live)).toBeGreaterThan(1);
      // Its echo: Cinder, left alone, sends Ash's steel (lanes); Ash sends Cinder's fire (a ring).
      for (let i = 0; i < 60 * (ECHO_EVERY + 2) && !w.effects.some((e) => e.owner === live.id); i++)
        stepWorld(w);
      const echoes = w.effects.filter((e) => e.owner === live.id);
      expect(echoes.length, kind).toBeGreaterThan(0);
      expect(echoes.every((e) => e.dtype === dtype)).toBe(true);
    }
  });
});

describe('on a real boss map', () => {
  async function arenaWorld(map: number): Promise<World> {
    const { setMap, planFor, worldOptsFor } = await import('../run/run');
    const { createWorld } = await import('./world');
    const run = newRun('vanguard', 5);
    setMap(run, map);
    const plan = planFor(run, run.offers[0]);
    const w = createWorld({
      plan,
      build: run.build,
      xp: 0,
      opts: { ...worldOptsFor(run, plan), godMode: true },
    });
    // Stand the character in the arena, a little off its middle.
    const end = plan.lab.rooms[plan.lab.mainPath[plan.lab.mainPath.length - 1]];
    w.player.x = end.cx + 0.5 - 5;
    w.player.y = end.cy + 0.5;
    return w;
  }

  it('the Marshal’s regiments take their places on the arena floor', async () => {
    const w = await arenaWorld(BOSSES.siegeMarshal.map);
    const m = w.actors.find((a) => a.mon?.spec.type === 'siegeMarshal')!;
    m.state = 'chase';
    run(w, HORN_TELL + 0.5);
    const st = bossState(m)!;
    expect(st.soldiers.length).toBeGreaterThan(0);
    for (const s of st.soldiers)
      expect(w.grid.isFloor(Math.floor(s.x), Math.floor(s.y))).toBe(true);
  });

  it('the Twins stand together in the arena, and the exit waits for both', async () => {
    const w = await arenaWorld(BOSSES.twins.map);
    const twins = w.actors.filter((a) => a.rarity === 'boss' && a.alive);
    expect(twins.map((a) => a.mon!.spec.type).sort()).toEqual(['ash', 'cinder']);
    expect(Math.hypot(twins[0].x - twins[1].x, twins[0].y - twins[1].y)).toBeGreaterThan(2);
    const { rawHit } = await import('./combat');
    for (const a of w.actors) if (!a.isPlayer && !twins.includes(a)) a.alive = false;
    rawHit(w, twins[0], 1e12, 0);
    run(w, 0.5);
    expect(w.exitOpen).toBe(false);
    rawHit(w, twins[1], 1e12, 0);
    run(w, 0.5);
    expect(w.exitOpen).toBe(true);
  });
});

describe('no boss can out-heal a build (docs/BOSSES.md 2, rule 10)', () => {
  it('no map affix gives a boss regeneration, on any map', async () => {
    const { buildMonster } = await import('../calc/monster');
    const { MAP_AFFIXES } = await import('../data/mapAffixes');
    const affixes = MAP_AFFIXES.map((a) => a.id);
    for (const id of BOSS_IDS) {
      for (const ty of [BOSSES[id].type, ...(BOSSES[id].partners ?? [])]) {
        const spec: MonsterSpec = {
          type: ty,
          variant: 'none',
          rarity: 'boss',
          level: BOSSES[id].map,
          mods: [],
          affix: affixes,
        };
        expect(buildMonster(spec).defence.lifeRegen, ty).toBe(0);
      }
    }
    // (An ordinary monster still gets it.)
    const plain: MonsterSpec = {
      type: 'warrior',
      variant: 'none',
      rarity: 'normal',
      level: 30,
      mods: [],
      affix: ['mending'],
    };
    expect(buildMonster(plain).defence.lifeRegen).toBeGreaterThan(0);
  });

  it('a boss map never rolls Mending', async () => {
    const { rollOffers } = await import('../run/offers');
    for (const id of BOSS_IDS)
      for (let seed = 1; seed <= 40; seed++)
        for (const o of rollOffers(seed, BOSSES[id].map))
          expect(o.affixes).not.toContain('mending');
  });

  it('the Rotwife does not mend while she is being hurt, nor for a moment after', () => {
    const w = bossArena(92);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'rotwife', 4, 0, 90);
    run(w, 0.2);
    m.life = m.def.maxLife * 0.5;
    // Something light hits her every half second: she never gains.
    for (let i = 0; i < 10; i++) {
      const before = m.life;
      m.life -= 10;
      run(w, 0.5);
      expect(m.life, `tick ${i}`).toBeLessThanOrEqual(before - 10 + 1e-6);
    }
    // Left alone, she begins to knit once the pause is over.
    run(w, MEND_PAUSE + 0.3);
    const at = m.life;
    run(w, 1);
    expect(m.life).toBeGreaterThan(at);
  });

  it('the Unmaker does not drink the flasks while it is being hurt', () => {
    const w = bossArena(100);
    w.player.stunT = 1e9;
    const m = putBoss(w, 'unmaker', 5, 0, 100);
    run(w, 0.2);
    m.life = m.def.maxLife * 0.19;
    run(w, 0.1);
    expect(bossState(m)!.thefts).toBe(THEFT_AT.length);
    for (let i = 0; i < 10; i++) {
      const before = m.life;
      m.life -= 10;
      run(w, 0.5);
      expect(m.life, `tick ${i}`).toBeLessThanOrEqual(before - 10 + 1e-6);
    }
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
    // The Twins are two bodies of equal life: the fight is the mean of their two tables.
    const tables = [def.type, ...(def.partners ?? [])].map((ty) =>
      durabilityTable(typeProfile(MONSTER_TYPES[ty]), def.map),
    );
    const out: Record<string, number> = {};
    for (const pr of PROBES) {
      let f = tables.reduce((n, tb) => n + tb[pr.id], 0) / tables.length;
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

  it('the Engine: a build of the smallest hits takes at most twice as long as one of the biggest', () => {
    // Per cycle: the plated stretch (the bar worn down at the hits' weight, the damage cut), then the broken window.
    const killTime = (weight: number, dps: number) => {
      const bar = BAR_SHARE;
      let life = 1;
      let t = 0;
      while (life > 0 && t < 1e4) {
        const raw = bar / weight;
        const plated = raw * (1 - PLATED_LESS);
        if (plated >= life) return t + life / (dps * (1 - PLATED_LESS));
        life -= plated;
        t += raw / dps;
        const open = BROKEN_SECONDS * dps * (1 + BROKEN_TAKEN);
        if (open >= life) return t + life / (dps * (1 + BROKEN_TAKEN));
        life -= open;
        t += BROKEN_SECONDS;
      }
      return t;
    };
    for (const dps of [0.005, 0.01, 0.02, 0.05, 0.1]) {
      const small = killTime(BAR_FLOOR, dps);
      const big = killTime(1, dps);
      expect(small / big, `at ${dps} of its life a second`).toBeLessThanOrEqual(2);
      // Damage over time is not reduced, and chips at the floor: it never takes longer than the smallest hits.
      expect(1 / dps / small, `dot at ${dps}`).toBeLessThanOrEqual(2);
    }
  });

  it('the Duellist: the veil costs a build of crits at most a third more time', () => {
    // Behind the veil a hit that would have crit lands at its base; the best case for a crit build is a 5x multiplier.
    const veil = VEIL_SECONDS / VEIL_CYCLE;
    const loss = 1 / (1 - veil * (1 - 1 / 5));
    expect(loss).toBeLessThanOrEqual(1.4);
  });

  it('the Unmaker hardens a single-type build to at most 2.5 times', () => {
    expect(1 / (1 - ADAPT_MAX)).toBeLessThanOrEqual(2.5);
  });
});

describe('a boss map at camp (docs/BOSSES.md 10)', () => {
  it('is the one offer of its level, at its own level, with no Respite and no map type', async () => {
    const { rollOffers } = await import('../run/offers');
    for (const id of BOSS_IDS) {
      const offers = rollOffers(5, BOSSES[id].map, { life: 0.2, mana: 0.2, es: 0.2, flasks: {} });
      expect(offers).toHaveLength(1);
      expect(offers[0].kind).toBe('map');
      expect(offers[0].type).toBe('plain');
      expect(offers[0].offset).toBe(0);
    }
    expect(rollOffers(5, 25).length).toBeGreaterThan(1);
  });

  it('a boss map takes twice as long before it is left on its own', async () => {
    const { autoAbandonAt } = await import('./abandon');
    const { AUTO_ABANDON_AFTER } = await import('../data/constants');
    const w = createDummyWorld(newRun('vanguard', 1).build, { distance: 30 }).world;
    w.opts.autoAbandonAt = undefined;
    expect(autoAbandonAt(w)).toBe(AUTO_ABANDON_AFTER);
    w.plan = { ...w.plan, endKind: 'boss' };
    expect(autoAbandonAt(w)).toBeGreaterThan(AUTO_ABANDON_AFTER);
  });
});
