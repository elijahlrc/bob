import { describe, expect, it } from 'vitest';
import { CURRENCY_DROPS } from '../data/constants';
import { buildMonster } from '../calc/monster';
import {
  CRESCENDO_GRACE,
  CRESCENDO_LIMIT,
  CRESCENDO_STEP_SECONDS,
  crescendoStep,
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
  it('a set has at most one typed offer before map 40 and two after; the anchor can be typed', () => {
    let anchorTyped = 0;
    for (let seed = 1; seed <= 300; seed++) {
      for (const map of [15, 25, 45, 75]) {
        const offers = rollOffers(seed, map);
        const typed = offers.filter((o) => o.type !== 'plain').length;
        expect(typed).toBeLessThanOrEqual(map >= TWO_TYPES_FROM ? 2 : 1);
        for (const o of offers) {
          if (o.type !== 'plain') expect(typesFor(map).map((t) => t.id)).toContain(o.type);
        }
        if (offers[0].type !== 'plain') anchorTyped++;
      }
    }
    expect(anchorTyped).toBeGreaterThan(0);
  });

  it('no offer is typed on a gate level, and the same seed gives the same types', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const map of [10, 20, 50, 100])
        expect(
          rollOffers(seed, map).every((o) => o.type === 'plain'),
          `${seed}/${map}`,
        ).toBe(true);
      expect(rollOffers(seed, 33)).toEqual(rollOffers(seed, 33));
    }
  });
});

describe('Crescendo (docs/MAPS.md 9.1)', () => {
  it('the world follows the clock, and only on a Crescendo map', () => {
    const run = newRun('vanguard', 3);
    const w = worldOf(run, 'crescendo');
    expect(w.plan.type).toBe('crescendo');
    const secs = CRESCENDO_GRACE + CRESCENDO_STEP_SECONDS + 5;
    for (let t = 0; t < secs / DT; t++) stepWorld(w);
    expect(w.surge).toBeGreaterThan(0);
    expect(w.surge).toBe(crescendoStep(w.t));
    const plain = worldOf(newRun('vanguard', 3), 'plain');
    for (let t = 0; t < secs / DT; t++) stepWorld(plain);
    expect(plain.surge).toBe(0);
  });

  it('monsters deal more and take less as the steps rise, without being rebuilt', () => {
    const run = newRun('vanguard', 3);
    const w = worldOf(run, 'crescendo');
    const monster = w.actors.find((a) => !a.isPlayer && a.alive)!;
    const takeAt = (surge: number) => {
      w.surge = surge;
      const before = monster.life;
      applyDamage(w, monster, [100, 0, 0, 0, 0]);
      const dealt = before - monster.life;
      monster.life = before;
      return dealt;
    };
    expect(takeAt(8)).toBeLessThan(takeAt(0));
    const player = w.player;
    const hurtAt = (surge: number) => {
      w.surge = surge;
      const before = player.life;
      applyDamage(w, player, [10, 0, 0, 0, 0]);
      const lost = before - player.life;
      player.life = before;
      return lost;
    };
    expect(hurtAt(8)).toBeGreaterThan(hurtAt(0));
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
  it('opens the exit only when every champion is dead, and each champion drops a rare and currency', () => {
    const run = newRun('vanguard', 4);
    const w = worldOf(run, 'quarry', 22);
    const champs = w.actors.filter((a) => a.rarity === 'miniboss');
    expect(champs.length).toBeGreaterThan(0);
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
      // (Currency drops only while CURRENCY_DROPS is on.)
      expect(items.some((it) => it.kind === 'currency')).toBe(CURRENCY_DROPS);
    }
    champs[0].noReward = true;
    killActor(w, champs[0]);
    stepWorld(w);
    expect(w.exitOpen).toBe(true);
  });
});

describe('Throng (docs/MAPS.md 9.2)', () => {
  it('a bigger crowd, each weaker', () => {
    let big = 0;
    let usual = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const s = makeMapPlan(seed, 30, 'ashenCrypt', [], 30, 'throng');
      const p = makeMapPlan(seed, 30, 'ashenCrypt', [], 30, 'plain');
      big += s.pop.monsters.length;
      usual += p.pop.monsters.length;
      expect(s.affixes).toEqual([]); // the player-facing list does not show the hidden affix
    }
    expect(big).toBeGreaterThan(usual);
    const spec = makeMapPlan(1, 30, 'ashenCrypt', [], 30, 'throng').pop.monsters[0].spec;
    expect(spec.affix).toContain(THRONG_AFFIX);
    const weak = buildMonster(spec).defence.maxLife;
    const strong = buildMonster({ ...spec, affix: [] }).defence.maxLife;
    expect(weak).toBeLessThan(strong);
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
    expect(levelHardness(42, 40)).toBeGreaterThan(1);
    expect(levelHardness(38, 40)).toBeLessThan(1);
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
