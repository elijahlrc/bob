import { describe, expect, it } from 'vitest';
import type { SkillDotProfile, SkillProfile } from '../calc/skill';
import { DT } from '../data/constants';
import type { Build } from '../data/types';
import { BOSS_ARENA_RADIUS } from '../gen/bossArena';
import { FLOOR } from '../gen/labyrinth';
import { newRun } from '../run/run';
import { newActor } from './actor';
import { separate } from './ai';
import { applyHit, rawHit } from './combat';
import {
  createDuelWorld,
  DUEL_ARENA_SIZE,
  DUEL_GAP,
  duelHash,
  duelPlan,
  playDuel,
  runDuel,
  type DuelOpts,
} from './duel';
import { buildFor } from './gemKit';
import type { Ledger } from './ledger';
import type { Side } from './side';
import type { World } from './types';
import { spawnMonster, stepWorld } from './world';

/**
 * The rules of F4, before docs/DUEL-BALANCE.md: no reprieves, no life curve, a 90 s cap. Two level 1 starters with no gems take
 * minutes to go through four lives each, so the tests of how a fight works (not of the balance) play by these.
 */
const F4: DuelOpts = { reprieves: 0, lifeCurve: false, maxTime: 90 };

/**
 * Duels (docs/DUEL.md 8.2): asymmetric by design. Every kit is given to one side only and the effect is looked for on the right
 * side, so that a read of the wrong side cannot pass by being symmetric.
 */

const vanguard = (seed = 1): Build => newRun('vanguard', seed).build;

const run = (w: World, seconds: number): void => {
  for (let i = 0; i < Math.round(seconds / DT); i++) stepWorld(w);
};

/** Everything a ledger side has entered, added up. */
const total = (rows: Ledger['dealt']): number =>
  Object.values(rows)
    .flatMap((m) => [...m.values()])
    .reduce((n, r) => n + r.dmg.reduce((x, y) => x + y, 0), 0);

/** What one named row of a ledger side has entered. */
const rowTotal = (rows: Ledger['dealt'], name: string): number =>
  Object.values(rows)
    .flatMap((m) => [...m.values()])
    .filter((r) => r.name === name)
    .reduce((n, r) => n + r.dmg.reduce((x, y) => x + y, 0), 0);

const lifeFlaskUses = (s: Side): number =>
  s.flasks.filter((f) => f.spec.kind === 'life').reduce((n, f) => n + f.uses, 0);

describe('the arena of a duel', () => {
  const floorAt = (plan: ReturnType<typeof duelPlan>, x: number, y: number): boolean =>
    plan.lab.tiles[Math.floor(y) * plan.lab.w + Math.floor(x)] === FLOOR;

  it('is the boss arena: every tile of the circle is floor, and nothing outside it', () => {
    const plan = duelPlan(1, 10);
    const { w, h, tiles } = plan.lab;
    expect([w, h]).toEqual([DUEL_ARENA_SIZE, DUEL_ARENA_SIZE]);
    const mid = BOSS_ARENA_RADIUS + 1;
    const r = BOSS_ARENA_RADIUS;
    let floor = 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const inside = (x - mid) ** 2 + (y - mid) ** 2 <= r * r + r;
        expect(tiles[y * w + x] === FLOOR, `tile ${x},${y}`).toBe(inside);
        if (inside) floor++;
      }
    expect(floor).toBeGreaterThan(Math.PI * r * r * 0.95);
    // No monsters, no chests; the level is the character's.
    expect(plan.pop.monsters).toHaveLength(0);
    expect(plan.pop.chests).toHaveLength(0);
    expect(plan.areaLevel).toBe(10);
    expect(plan.resistPenalty).toBe(0);
  });

  it('stands both characters on floor, DUEL_GAP apart, about the middle of the room, with the exit shut', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    expect(floorAt(w.plan, sa.player.x, sa.player.y)).toBe(true);
    expect(floorAt(w.plan, sb.player.x, sb.player.y)).toBe(true);
    expect(sb.player.x - sa.player.x).toBeCloseTo(DUEL_GAP, 9);
    const mid = w.plan.lab.rooms[0];
    expect((sa.player.x + sb.player.x) / 2).toBe(mid.cx + 0.5);
    expect(sa.player.y).toBe(mid.cy + 0.5);
    // The exit is on the floor, and never opens (a duel ends by its own rules).
    expect(floorAt(w.plan, w.plan.lab.exit.x, w.plan.lab.exit.y)).toBe(true);
    expect(w.opts.noExit).toBe(true);
    run(w, 5);
    expect(w.exitOpen).toBe(false);
  });

  it('is in a biome and a theme that follow the seed, from every biome there is', () => {
    const biomes = new Set<string>();
    const themes = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const a = duelPlan(seed, 5);
      const b = duelPlan(seed, 30);
      expect([b.biome.id, b.theme.id]).toEqual([a.biome.id, a.theme.id]);
      biomes.add(a.biome.id);
      themes.add(a.theme.id);
    }
    expect(biomes.size).toBeGreaterThanOrEqual(6);
    expect(themes.size).toBeGreaterThanOrEqual(6);
    // The biome does not depend on the level the duel is at (a duel is on no map number).
    expect(duelPlan(7, 1).biome.id).toBe(duelPlan(7, 90).biome.id);
  });
});

describe('a duel of two starters', () => {
  it('ends with one dead (a draw by the cap would mean they never met)', () => {
    const r = runDuel(vanguard(1), vanguard(2), 1, F4);
    expect(r.how).toBe('death');
    expect(r.winner === 0 || r.winner === 1).toBe(true);
    expect(r.time).toBeGreaterThan(1);
    expect(r.time).toBeLessThan(F4.maxTime!);
    const [won, lost] = r.winner === 0 ? [r.sides[0], r.sides[1]] : [r.sides[1], r.sides[0]];
    expect(won.lifeLeft).toBeGreaterThan(0);
    expect(won.recap).toBeUndefined();
    expect(lost.lifeLeft).toBe(0);
    expect(lost.recap).toBeDefined();
    // What each dealt, the other took.
    expect(total(won.ledger.dealt)).toBeGreaterThan(0);
    expect(total(won.ledger.dealt)).toBeCloseTo(total(lost.ledger.taken), 6);
    expect(total(lost.ledger.dealt)).toBeCloseTo(total(won.ledger.taken), 6);
  });

  it('is a pure function of the builds and the seed', () => {
    const a = playDuel(vanguard(1), vanguard(2), 1);
    const b = playDuel(vanguard(1), vanguard(2), 1);
    expect(b.result).toEqual(a.result);
    expect(b.hash).toBe(a.hash);
    expect(duelHash(vanguard(1), vanguard(2), 1)).toBe(a.hash);
    // The seed is the fight's dice.
    expect(duelHash(vanguard(1), vanguard(2), 2)).not.toBe(a.hash);
  });

  it('stands the characters 10 tiles apart on the middle row, mirrored, facing each other, each at its own level', () => {
    const b = vanguard(2);
    b.level = 5;
    const w = createDuelWorld(vanguard(1), b, 1);
    const [sa, sb] = w.sides;
    expect(w.sides).toHaveLength(2);
    expect([sa.id, sb.id]).toEqual([0, 1]);
    expect([sa.team, sb.team]).toEqual([0, 2]);
    expect([sa.player.team, sb.player.team]).toEqual([0, 2]);
    expect([sa.player.side, sb.player.side]).toEqual([sa, sb]);
    expect(w.actors.filter((a) => a.isPlayer)).toEqual([sa.player, sb.player]);
    expect(DUEL_GAP).toBe(10);
    expect(sb.player.x - sa.player.x).toBeCloseTo(DUEL_GAP, 9);
    expect(sb.player.y).toBe(sa.player.y);
    // Mirror images about the arena's middle: the same distance from the walls on both sides.
    expect(sa.player.x + sb.player.x).toBe(DUEL_ARENA_SIZE);
    expect(sa.player.y).toBe(DUEL_ARENA_SIZE / 2);
    expect(sa.player.facing).toBeCloseTo(0, 9);
    expect(sb.player.facing).toBeCloseTo(Math.PI, 9);
    // Each character is built at its own level, with no map to take its resistances: the world is not a map's.
    expect(sa.areaLevel).toBe(1);
    expect(sb.areaLevel).toBe(5);
    expect(sb.char.config.areaLevel).toBe(5);
    expect(w.plan.resistPenalty).toBe(0);
    expect(w.plan.affixes).toEqual([]);
    // Full vitals, no free resources, and nothing left of the map to end the fight.
    for (const s of w.sides) {
      expect(s.player.life).toBeGreaterThan(0);
      expect(s.player.life).toBe(Math.max(1, s.player.def.maxLife - s.char.reservedLife));
      expect(s.opts.freeResources).toBeUndefined();
      expect(s.opts.godMode).toBeUndefined();
    }
    run(w, 3);
    expect(w.exitOpen).toBe(false);
    expect(w.status).toBe('running');
  });

  it('a different level on each side is a different character (the fight reads each its own)', () => {
    const strong = vanguard(1);
    strong.level = 30;
    const r = runDuel(strong, vanguard(2), 1, F4);
    expect(r.winner).toBe(0);
    expect(r.sides[0].lifeLeft).toBeGreaterThan(0.9);
  });
});

describe('what is one side’s stays its side’s', () => {
  it('only B has a Slag Carapace: A’s hits go into it, and A has none', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    sb.buffT.moltenGuard = 1e9;
    sb.shell = {
      left: 1e9,
      taken: 0,
      absorb: 0.5,
      reflect: 0,
      radius: 3,
      buff: 'moltenGuard',
      profile: sb.char.profile(sb.primary, 0),
    };
    for (let i = 0; i < 60 * 20 && sb.shell!.taken === 0; i++) stepWorld(w);
    expect(sb.shell!.taken).toBeGreaterThan(0);
    expect(sa.shell).toBeNull();
    // Let B hit A as well: that goes into nothing, and B's shell still holds only what A dealt.
    run(w, 3);
    expect(sa.shell).toBeNull();
    expect(sa.stats.damageTaken).toBeGreaterThan(0);
    // Half of each of A's hits went into the shell, and the other half is what B took.
    // (The shell keeps what it took as it was before the duel's scale, which its burst is given when it lands.)
    expect(sb.shell!.taken * sb.damageScale).toBeCloseTo(sb.stats.damageTaken, 6);
    expect(sb.stats.damageTaken).toBeCloseTo(total(sa.ledger.dealt), 6);
  });

  it('B’s life flask fires when B is hurt, and A’s does not fire for B’s damage', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    // B takes the blows and does nothing; A stays whole.
    sb.player.stunT = 1e6;
    for (let i = 0; i < 60 * 20 && lifeFlaskUses(sb) === 0 && sb.player.alive; i++) stepWorld(w);
    expect(lifeFlaskUses(sb)).toBeGreaterThan(0);
    expect(sb.player.life).toBeLessThan(sb.player.def.maxLife);
    expect(sa.player.life).toBe(sa.player.def.maxLife);
    expect(lifeFlaskUses(sa)).toBe(0);
  });

  it('and the other way: A’s flask fires for A’s damage, and B’s does not', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    sa.player.stunT = 1e6;
    for (let i = 0; i < 60 * 20 && lifeFlaskUses(sa) === 0 && sa.player.alive; i++) stepWorld(w);
    expect(lifeFlaskUses(sa)).toBeGreaterThan(0);
    expect(lifeFlaskUses(sb)).toBe(0);
  });
});

describe('A’s ignite on B', () => {
  /** A mystic whose fire bolt ignites every time it hits, and a vanguard with `fireRes` fire resistance that cannot die or act. */
  function burn(fireRes: number, seconds = 6) {
    const a = buildFor(['flameBolt'], 'wand_3', 'mystic');
    a.equipment.body!.uniqueMods = [{ stat: 'chance.ignite', kind: 'base', value: 100 }];
    const b = vanguard(2);
    if (fireRes)
      b.equipment.body!.uniqueMods = [
        ...(b.equipment.body!.uniqueMods ?? []),
        { stat: 'resist.fire', kind: 'base', value: fireRes },
      ];
    const w = createDuelWorld(a, b, 1);
    const [sa, sb] = w.sides;
    sa.opts.freeResources = true;
    sb.opts.godMode = true;
    sb.player.stunT = 1e6;
    let ignitedBy: Side | undefined;
    let ignited = false;
    for (let i = 0; i < Math.round(seconds / DT); i++) {
      stepWorld(w);
      if (!ignited && sb.player.ail.ignites.length > 0) {
        ignited = true;
        ignitedBy = sb.player.ail.ignites[0].by;
      }
    }
    return { w, sa, sb, ignited, ignitedBy, burning: rowTotal(sa.ledger.dealt, 'Burning') };
  }

  it('sets the ignite on B’s actor, and B burns', () => {
    const { sa, sb, ignited, ignitedBy, burning } = burn(0);
    expect(ignited).toBe(true);
    expect(ignitedBy).toBe(sa);
    expect(burning).toBeGreaterThan(0);
    expect(rowTotal(sb.ledger.taken, 'Burning')).toBeCloseTo(burning, 6);
  });

  it('burns B for less when B resists fire', () => {
    const open = burn(0);
    const warded = burn(75);
    expect(warded.ignited).toBe(true);
    expect(warded.burning).toBeGreaterThan(0);
    expect(warded.burning).toBeLessThan(open.burning * 0.5);
  });

  it('is credited to A: the burning is in A’s ledger.dealt and damageDealt, and in none of B’s', () => {
    const { sa, sb, burning } = burn(0);
    // A's side: it dealt the burning, and took nothing (B did nothing).
    expect(burning).toBeGreaterThan(0);
    expect(sa.stats.damageDealt).toBeGreaterThanOrEqual(burning);
    expect(total(sa.ledger.dealt)).toBeCloseTo(sa.stats.damageDealt, 6);
    expect(total(sa.ledger.taken)).toBe(0);
    // B's side: it took it, and dealt nothing, the burning included.
    expect(rowTotal(sb.ledger.taken, 'Burning')).toBeGreaterThan(0);
    expect(total(sb.ledger.dealt)).toBe(0);
    expect(rowTotal(sb.ledger.dealt, 'Burning')).toBe(0);
    expect(sb.stats.damageDealt).toBe(0);
  });
});

describe('what a hit does to a character, as it does to a monster', () => {
  /** A skill's debuff of chaos damage over time that mends its caster by `regen` percent a second. */
  const debuff = (regen: number) =>
    ({
      spec: { type: 'chaos', dps: [1, 1], seconds: 4, stack: 'refresh', regen },
      type: 4,
      dps: 20,
      seconds: 4,
    }) as unknown as SkillDotProfile;

  /** A hit by A on B that lands with every ailment and the effects a skill can carry, and one more to see them apply. */
  function strike(setup?: (w: World, sa: Side, sb: Side) => void, tweak?: Partial<SkillProfile>) {
    // (At the scale of 1: what a hit does is not what the duel's damage scale is about.)
    const w = createDuelWorld(vanguard(1), vanguard(2), 1, { damageScale: 1 });
    const [sa, sb] = w.sides;
    sb.player.life = 1e6;
    sa.char.hexes.push({ id: 'brittleDoom', level: 10, effect: 1 });
    setup?.(w, sa, sb);
    const p: SkillProfile = {
      ...sa.char.profile(sa.primary, 0),
      knockback: 2,
      statuses: [{ id: 'hinder', chance: 1, seconds: 3, v: 30, x: 0 }],
      decay: { dps: 8, seconds: 3 },
      impale: { chance: 1, share: 0.5, hits: 3, max: 5 },
      skillDot: debuff(10),
      ...tweak,
    };
    const x0 = sb.player.x;
    applyHit(w, sa.player, sb.player, p, {
      outcome: 'hit',
      crit: false,
      dmg: [10, 0, 0, 0, 0],
      rawPhys: 10,
      total: 10,
      H: [10, 0, 0, 0, 0],
      ailments: { ignite: 5, bleed: 5, poison: 5, shock: 0.2, chill: 0.3, freeze: 1 },
      stun: 0,
    });
    return { w, sa, sb, pushed: sb.player.x - x0 };
  }

  it('puts the ailments, statuses, hexes, impales and debuffs on B, each as A’s', () => {
    const { sa, sb, pushed } = strike();
    const b = sb.player;
    expect(b.ail.ignites).toHaveLength(1);
    expect(b.ail.ignites[0].by).toBe(sa);
    expect(b.ail.bleeds[0].by).toBe(sa);
    expect(b.ail.poisons[0].by).toBe(sa);
    expect(b.ail.shock).toBeCloseTo(0.2, 9);
    expect(b.ail.chill).toBeCloseTo(0.3, 9);
    expect(b.ail.freezeT).toBeGreaterThan(0);
    expect(b.fx.hinder).toBeDefined();
    expect(b.hexes.map((h) => h.id)).toEqual(['brittleDoom']);
    expect(b.impales).toHaveLength(1);
    // A skill's debuff and Decay are damage over time A's skill inflicted.
    expect(b.sdots.map((d) => d.src)).toContain('@decay');
    expect(b.sdots.length).toBe(2);
    for (const d of b.sdots) expect(d.by).toBe(sa);
    // The blow throws B back, away from A.
    expect(pushed).toBeCloseTo(2, 6);
    // None of it is A's: A carries nothing.
    expect(sa.player.ail.ignites).toHaveLength(0);
    expect(sa.player.sdots).toHaveLength(0);
    expect(sa.player.hexes).toHaveLength(0);
  });

  it('a hit that leaves B at a tenth of its life or less finishes it (culling)', () => {
    const { sb } = strike(
      (_w, _sa, b) => {
        b.player.life = b.player.def.maxLife * 0.09 + 10;
      },
      { culling: true },
    );
    expect(sb.player.alive).toBe(false);
  });

  it('what B has done to A is B’s: A’s hit does not hurt A', () => {
    const { sa, sb } = strike();
    expect(sa.player.life).toBe(sa.player.def.maxLife);
    expect(sb.stats.damageTaken).toBeGreaterThan(0);
    expect(sa.stats.damageTaken).toBe(0);
  });

  it('a damage over time that mends its caster mends A, not B', () => {
    const mended = (regen: number) => {
      const { w, sa, sb } = strike(
        (_w, a) => {
          a.player.life = 1;
          for (const f of a.flasks) f.charges = 0;
        },
        { skillDot: debuff(regen) },
      );
      sa.player.life = 1;
      sb.player.stunT = 1e6;
      sa.player.stunT = 1e6;
      for (let i = 0; i < 30; i++) stepWorld(w);
      return sa.player.life;
    };
    expect(mended(50)).toBeGreaterThan(mended(0) + 1);
  });
});

describe('credit for what has no attacker named', () => {
  it('a hit that names A’s side is A’s even on a monster standing nearest to B', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    const m = spawnMonster(
      w,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      sb.player.x + 1.5,
      sb.player.y,
      0,
      0,
      'Warrior',
    );
    rawHit(w, m, 1e9, 0, sa, 'Test');
    expect(m.alive).toBe(false);
    expect(rowTotal(sa.ledger.dealt, 'Test')).toBeGreaterThan(0);
    expect(total(sb.ledger.dealt)).toBe(0);
    expect(sa.stats.damageDealt).toBeGreaterThan(0);
    expect(sb.stats.damageDealt).toBe(0);
    // The kill is A's too.
    expect(sa.stats.kills).toBe(1);
    expect(sb.stats.kills).toBe(0);
  });

  it('a monster that dies of A’s damage over time is A’s kill, whoever it stands nearest', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    const m = spawnMonster(
      w,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      sb.player.x + 1.5,
      sb.player.y,
      0,
      0,
      'Warrior',
    );
    m.sdots.push({
      src: 'burn',
      dps: 1e6,
      raw: 1,
      type: 3,
      t: 2,
      layer: false,
      n: 1,
      spreadR: 0,
      carry: false,
      regen: 0,
      by: sa,
    });
    stepWorld(w);
    expect(m.alive).toBe(false);
    expect(sa.stats.kills).toBe(1);
    expect(sb.stats.kills).toBe(0);
    expect(sa.stats.damageDealt).toBeGreaterThan(0);
    expect(sb.stats.damageDealt).toBe(0);
  });

  it('what no side owns on a monster is the nearest side’s, as it has always been', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    const m = spawnMonster(
      w,
      { type: 'warrior', variant: 'none', rarity: 'normal', level: 1, mods: [] },
      sb.player.x + 1.5,
      sb.player.y,
      0,
      0,
      'Warrior',
    );
    rawHit(w, m, 10, 0, null, 'Ground');
    expect(rowTotal(sb.ledger.dealt, 'Ground')).toBeGreaterThan(0);
    expect(total(sa.ledger.dealt)).toBe(0);
  });
});

describe('bodies', () => {
  it('two characters on one spot are pushed apart, to the width of the two', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    const x0 = sa.player.x;
    sb.player.x = x0 + 0.1;
    sb.player.y = sa.player.y;
    // Both stunned, so that nothing but the separation moves them.
    sa.player.stunT = 1e6;
    sb.player.stunT = 1e6;
    stepWorld(w);
    const d = Math.hypot(sb.player.x - sa.player.x, sb.player.y - sa.player.y);
    expect(d).toBeCloseTo(sa.player.r + sb.player.r, 6);
    // Each gave way half.
    expect(sa.player.x).toBeLessThan(x0);
    expect(sb.player.x).toBeGreaterThan(x0 + 0.1);
  });

  it('two characters exactly on one spot are still told apart', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    sb.player.x = sa.player.x;
    sb.player.y = sa.player.y;
    sa.player.stunT = 1e6;
    sb.player.stunT = 1e6;
    stepWorld(w);
    expect(Math.hypot(sb.player.x - sa.player.x, sb.player.y - sa.player.y)).toBeCloseTo(0.8, 6);
  });

  it('a character is pushed off by the other side’s minion, and not by its own', () => {
    const w = createDuelWorld(vanguard(1), vanguard(2), 1);
    const [sa, sb] = w.sides;
    sa.player.stunT = 1e6;
    sb.player.stunT = 1e6;
    const minion = (s: Side, x: number, y: number) => {
      const m = newActor(w.nextId++, false, x, y, 0.4);
      m.side = s;
      m.team = s.team;
      m.def = s.player.def;
      return m;
    };
    // B's minion stands on A.
    const foe = minion(sb, sa.player.x + 0.2, sa.player.y);
    sb.minions.push(foe as never);
    const a0 = { x: sa.player.x, y: sa.player.y };
    separate(w);
    expect(Math.hypot(foe.x - sa.player.x, foe.y - sa.player.y)).toBeGreaterThanOrEqual(0.8 - 1e-6);
    expect(Math.hypot(sa.player.x - a0.x, sa.player.y - a0.y)).toBeGreaterThan(0.1);
    // A's own minion on A is not pushed against A by this (the minion yields, as ever).
    const mine = minion(sa, sa.player.x + 0.2, sa.player.y);
    sa.minions.push(mine as never);
    const a1 = { x: sa.player.x, y: sa.player.y };
    separate(w);
    expect(sa.player.x).toBeCloseTo(a1.x, 9);
    expect(sa.player.y).toBeCloseTo(a1.y, 9);
  });
});

describe('the events of a duel say whose they are', () => {
  /** Fight a duel to its end and keep every event of every tick. */
  const events = (a: Build, b: Build, seed: number, prep?: (w: World) => void) => {
    const w = createDuelWorld(a, b, seed, F4);
    prep?.(w);
    const all: World['events'] = [];
    while (w.t < 60 && w.sides.every((s) => s.player.alive)) {
      stepWorld(w);
      all.push(...w.events);
    }
    return { w, all };
  };

  it('a flask drunk is the drinker’s: `src` is the character whose flask it is, and `idx` its flask', () => {
    const { w, all } = events(vanguard(1), vanguard(2), 1);
    const drunk = all.filter((e) => e.t === 'flaskUsed');
    expect(drunk.length).toBeGreaterThan(0);
    for (const s of w.sides) {
      const mine = drunk.filter((e) => e.src === s.player.id);
      const uses = s.flasks.reduce((n, f) => n + f.uses, 0);
      expect(mine.length, `side ${s.id}`).toBe(uses);
      for (const e of mine) expect(s.flasks[e.idx]).toBeDefined();
    }
    // Nothing is drunk for an actor that is not a character.
    const ids = new Set(w.sides.map((s) => s.player.id));
    for (const e of drunk) expect(ids.has(e.src)).toBe(true);
  });

  it('a fall is the faller’s: `src` of playerDied is the character that died', () => {
    // One side starts on its last point of life: two new characters with the reference game's weapons outlast each other's flasks.
    const { w, all } = events(vanguard(1), vanguard(2), 1, (w) => {
      w.sides[1].player.life = 1;
    });
    const dead = w.sides.filter((s) => !s.player.alive);
    expect(dead.length).toBeGreaterThan(0);
    const fell = all.filter((e) => e.t === 'playerDied');
    expect(fell.map((e) => e.src).sort()).toEqual(dead.map((s) => s.player.id).sort());
  });
});
