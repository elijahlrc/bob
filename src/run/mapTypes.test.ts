import { describe, expect, it } from 'vitest';
import { buildMonster } from '../calc/monster';
import {
  CRESCENDO_LIMIT,
  CRESCENDO_STEP_BONUS,
  crescendoStep,
  MAP_TYPES,
  mapTypeDef,
  THRONG_AFFIX,
  typesFor,
} from '../data/mapTypes';
import { themeDef } from '../data/themes';
import { makeMapPlan } from '../gen/mapPlan';
import { DT } from '../data/constants';
import { applyDamage, killActor } from '../sim/combat';
import type { World } from '../sim/types';
import { createWorld, stepWorld } from '../sim/world';
import { makeOffer, rollOffers, TWO_TYPES_FROM } from './offers';
import { newRun, planFor, setMap, worldOptsFor, type RunState } from './run';
import { levelHardness, scoreTheme, survivalRatio, themeReward, threatPreview } from './threat';
import { Character } from '../calc/character';
import { cfgFor } from './bot';
import { withStarterGems } from './starterGems';

function worldOf(
  run: RunState,
  type: 'crescendo' | 'quarry' | 'throng' | 'plain',
  map = 20,
): World {
  setMap(run, map);
  const offer = makeOffer(run.seed, map, 0, 'ashenCrypt', 0, type);
  const plan = planFor(run, offer);
  return createWorld({
    plan,
    build: run.build,
    xp: 0,
    opts: { ...worldOptsFor(run, plan), godMode: true },
  });
}

describe('which types are offered (docs/MAPS.md 4.2 and 9)', () => {
  it('each type from its map, never on a mini-boss or boss map', () => {
    expect(typesFor(9)).toEqual([]);
    expect(typesFor(11).map((t) => t.id)).toEqual(['crescendo', 'quarry']);
    expect(typesFor(13).map((t) => t.id)).toEqual(['crescendo', 'quarry', 'throng']);
    expect(typesFor(27).map((t) => t.id)).toContain('holdout');
    expect(typesFor(24).map((t) => t.id)).not.toContain('holdout');
    expect(typesFor(33).map((t) => t.id)).toContain('collapse');
    expect(typesFor(37).map((t) => t.id)).not.toContain('crawl');
    expect(typesFor(43).map((t) => t.id)).toContain('crawl');
    for (const map of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) expect(typesFor(map)).toEqual([]);
    expect(MAP_TYPES.map((t) => t.id)).toEqual([
      'plain',
      'crescendo',
      'quarry',
      'throng',
      'holdout',
      'collapse',
      'crawl',
    ]);
  });

  it('a set has at most one typed offer before map 40 and two after; the anchor can be typed', () => {
    let anchorTyped = 0;
    let typedSets = 0;
    let sets = 0;
    for (let seed = 1; seed <= 300; seed++) {
      for (const map of [15, 25, 45, 75]) {
        const offers = rollOffers(seed, map);
        const typed = offers.filter((o) => o.type !== 'plain').length;
        expect(typed).toBeLessThanOrEqual(map >= TWO_TYPES_FROM ? 2 : 1);
        for (const o of offers) {
          if (o.type !== 'plain') expect(typesFor(map).map((t) => t.id)).toContain(o.type);
        }
        sets++;
        if (typed) typedSets++;
        if (offers[0].type !== 'plain') anchorTyped++;
      }
    }
    expect(anchorTyped).toBeGreaterThan(0);
    expect(typedSets / sets).toBeGreaterThan(0.3);
    expect(typedSets / sets).toBeLessThan(0.9);
  });

  it('no offer is typed before map 10 or on a gate level, and the same seed gives the same types', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const map of [1, 5, 9, 10, 20, 50, 100])
        expect(
          rollOffers(seed, map).every((o) => o.type === 'plain'),
          `${seed}/${map}`,
        ).toBe(true);
      expect(rollOffers(seed, 33)).toEqual(rollOffers(seed, 33));
    }
  });
});

describe('Crescendo (docs/MAPS.md 9.1)', () => {
  it('has no step in the grace, then one every 15 s up to 16', () => {
    expect([0, 30, 44.9].map(crescendoStep)).toEqual([0, 0, 0]);
    expect([45, 59.9, 60, 100, 200].map(crescendoStep)).toEqual([1, 1, 2, 4, 11]);
    expect([270, 330, 1000].map(crescendoStep)).toEqual([16, 16, 16]);
  });

  it('the world follows the clock, and only on a Crescendo map', () => {
    const run = newRun('vanguard', 3);
    const w = worldOf(run, 'crescendo');
    expect(w.plan.type).toBe('crescendo');
    for (let t = 0; t < 50 / DT; t++) stepWorld(w);
    expect(w.surge).toBe(1);
    const plain = worldOf(newRun('vanguard', 3), 'plain');
    for (let t = 0; t < 50 / DT; t++) stepWorld(plain);
    expect(plain.surge).toBe(0);
  });

  it('monsters deal more and take less as the steps rise, without being rebuilt', () => {
    const run = newRun('vanguard', 3);
    const w = worldOf(run, 'crescendo');
    const monster = w.actors.find((a) => !a.isPlayer && a.alive)!;
    const f = 1 + CRESCENDO_STEP_BONUS * 8;
    const takeAt = (surge: number) => {
      w.surge = surge;
      const before = monster.life;
      applyDamage(w, monster, [100, 0, 0, 0, 0]);
      const dealt = before - monster.life;
      monster.life = before;
      return dealt;
    };
    expect(takeAt(0)).toBeCloseTo(100);
    expect(takeAt(8)).toBeCloseTo(100 / f);
    const player = w.player;
    const hurtAt = (surge: number) => {
      w.surge = surge;
      const before = player.life;
      applyDamage(w, player, [10, 0, 0, 0, 0]);
      const lost = before - player.life;
      player.life = before;
      return lost;
    };
    expect(hurtAt(0)).toBeCloseTo(10);
    expect(hurtAt(8)).toBeCloseTo(10 * f);
  });

  it('pulls the character out as an abandon at the limit, and not before', () => {
    const w = worldOf(newRun('vanguard', 3), 'crescendo');
    w.t = CRESCENDO_LIMIT - 0.5;
    stepWorld(w);
    expect(w.status).toBe('running');
    w.t = CRESCENDO_LIMIT;
    stepWorld(w);
    expect(w.status).toBe('abandoned');
    // A map that is not a Crescendo is not pulled out.
    const plain = worldOf(newRun('vanguard', 3), 'plain');
    plain.t = CRESCENDO_LIMIT + 10;
    stepWorld(plain);
    expect(plain.status).toBe('running');
  });

  it('later kills drop more', () => {
    const run = newRun('vanguard', 3);
    const count = (surge: number) => {
      const w = worldOf(run, 'crescendo');
      w.surge = surge;
      const m = w.actors.find((a) => !a.isPlayer && a.mon)!;
      let n = 0;
      for (let i = 0; i < 1500; i++) n += w.opts.loot!(w, m).length;
      return n;
    };
    expect(count(16)).toBeGreaterThan(count(0) * 1.2);
  });
});

describe('Quarry (docs/MAPS.md 9.2)', () => {
  it('has three champions, one in each room after the first, few others, and no side branches', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const plan = makeMapPlan(seed, 25, 'ashenCrypt', [], 25, 'quarry');
      const champs = plan.pop.monsters.filter((m) => m.spec.rarity === 'miniboss');
      expect(champs, `seed ${seed}`).toHaveLength(3);
      expect(new Set(champs.map((c) => c.room)).size).toBe(3);
      for (const c of champs) expect(c.spec.mods.length).toBeLessThanOrEqual(3);
      expect(plan.lab.mainPath.length).toBe(4);
      expect(plan.lab.rooms.every((r) => r.kind !== 'side')).toBe(true);
      const usual = makeMapPlan(seed, 25, 'ashenCrypt', [], 25, 'plain');
      expect(plan.pop.monsters.length).toBeLessThan(usual.pop.monsters.length * 0.7);
    }
  });

  it('opens the exit only when every champion is dead, and each champion drops a rare and currency', () => {
    const run = newRun('vanguard', 4);
    const w = worldOf(run, 'quarry', 22);
    const champs = w.actors.filter((a) => a.rarity === 'miniboss');
    expect(champs).toHaveLength(3);
    // Kill everything except one champion: the exit stays shut.
    for (const a of w.actors)
      if (!a.isPlayer && a !== champs[0] && a.alive) {
        a.noReward = true;
        killActor(w, a);
      }
    stepWorld(w);
    expect(w.exitOpen).toBe(false);
    for (let i = 0; i < 20; i++) {
      const items = w.opts.loot!(w, champs[0]);
      expect(
        items.some((it) => it.kind === 'item' && (it.rarity === 'rare' || it.rarity === 'unique')),
      ).toBe(true);
      expect(items.some((it) => it.kind === 'currency')).toBe(true);
    }
    champs[0].noReward = true;
    killActor(w, champs[0]);
    stepWorld(w);
    expect(w.exitOpen).toBe(true);
  });
});

describe('Throng (docs/MAPS.md 9.2)', () => {
  it('a crowd more than twice the size, almost all normal, each weaker', () => {
    let big = 0;
    let usual = 0;
    let nonNormal = 0;
    let all = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const s = makeMapPlan(seed, 30, 'ashenCrypt', [], 30, 'throng');
      const p = makeMapPlan(seed, 30, 'ashenCrypt', [], 30, 'plain');
      big += s.pop.monsters.length;
      usual += p.pop.monsters.length;
      all += s.pop.monsters.length;
      nonNormal += s.pop.monsters.filter((m) => m.spec.rarity !== 'normal').length;
      expect(s.affixes).toEqual([]); // the player-facing list does not show the hidden affix
    }
    expect(big).toBeGreaterThan(usual * 1.8);
    expect(nonNormal / all).toBeLessThan(0.05);
    const spec = makeMapPlan(1, 30, 'ashenCrypt', [], 30, 'throng').pop.monsters[0].spec;
    expect(spec.affix).toContain(THRONG_AFFIX);
    const weak = buildMonster(spec).defence.maxLife;
    const strong = buildMonster({ ...spec, affix: [] }).defence.maxLife;
    expect(weak / strong).toBeCloseTo(0.6, 1);
  });

  it('pays quantity and experience', () => {
    const plain = makeMapPlan(1, 30, 'ashenCrypt', [], 30, 'plain');
    const throng = makeMapPlan(1, 30, 'ashenCrypt', [], 30, 'throng');
    expect(throng.xpMult).toBeCloseTo(plain.xpMult * 1.25);
    expect(mapTypeDef('throng').reward.quantity).toBe(0.4);
  });
});

describe('the threat model knows the types', () => {
  const run = withStarterGems(newRun('reaver', 1));
  run.build.level = 30;
  setMap(run, 30);
  const ch = new Character(run.build, cfgFor(run));
  const theme = themeDef('ashenCrypt');

  it('a typed map pays more and is harder in the model', () => {
    const plain = scoreTheme(ch, theme, 'clearing', [], 'plain');
    for (const type of ['crescendo', 'quarry', 'throng'] as const) {
      const s = scoreTheme(ch, theme, 'clearing', [], type);
      expect(s.pressure, type).toBeGreaterThan(plain.pressure);
      expect(themeReward(theme, [], 30, type), type).toBeGreaterThan(themeReward(theme, [], 30));
    }
  });

  it('the preview shows a Throng as quicker to kill but harder to survive', () => {
    const p = threatPreview(ch, theme, 'clearing', [], 'throng');
    const base = threatPreview(ch, theme, 'clearing', [], 'plain');
    expect(p.dps).toBeGreaterThan(base.dps);
    expect(p.ehp).toBeLessThan(base.ehp);
  });
});

describe('a higher offer is judged harder (docs/MAPS.md 5.1)', () => {
  const run = withStarterGems(newRun('reaver', 1));
  run.build.level = 40;
  setMap(run, 40);
  const at = (lvl: number) => new Character(run.build, { ...cfgFor(run), areaLevel: lvl });
  const theme = themeDef('ashenCrypt');

  it('monsters two levels up hit and last noticeably more', () => {
    expect(levelHardness(40, 40)).toBe(1);
    expect(levelHardness(42, 40)).toBeGreaterThan(1.1);
    expect(levelHardness(38, 40)).toBeLessThan(0.9);
  });

  it('the same map scores lower two levels up and higher two levels down, next to the map number', () => {
    const v = (lvl: number) => scoreTheme(at(lvl), theme, 'clearing', [], 'plain', 40).value;
    expect(v(42)).toBeLessThan(v(40));
    expect(v(38)).toBeGreaterThan(v(40));
    // The verdict counts it too: the same plain map is a worse bet two levels up.
    const ratio = (lvl: number) => survivalRatio(at(lvl), theme, 'clearing', [], 'plain', 1, 40);
    expect(ratio(42)).toBeLessThan(ratio(40));
    expect(ratio(40)).toBeCloseTo(1, 1);
  });

  it('a Crescendo map does not pull the character out while the exit is open', () => {
    const w = worldOf(newRun('vanguard', 3), 'crescendo');
    w.exitOpen = true;
    w.t = CRESCENDO_LIMIT + 5;
    stepWorld(w);
    expect(w.status).toBe('running');
  });
});
