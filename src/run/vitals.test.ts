import { describe, expect, it } from 'vitest';
import { Character } from '../calc/character';
import { LEGACY } from '../data/difficulty';
import { mod } from '../mods/types';
import { lifeCap } from '../sim/combat';
import { runMap } from '../sim/runMap';
import { fullVitals } from '../sim/types';
import { vitalsOf } from '../sim/vitals';
import { createWorld } from '../sim/world';
import { makeItem } from '../gen/items';
import type { MapResult } from '../sim/runMap';
import { restAtCamp } from './camp';
import { cfgFor } from './bot';
import { finishMap, newRun, planFor, setMap, uidSource, worldOptsFor, type RunState } from './run';
import { loadRun, MemoryStore, saveRun } from './save';

/** A copy of the run whose main hand carries extra mods. */
function withMods(run: RunState, mods: ReturnType<typeof mod>[]): RunState {
  const next = structuredClone(run);
  const main = next.build.equipment.mainHand!;
  next.build.equipment.mainHand = { ...main, uniqueMods: [...(main.uniqueMods ?? []), ...mods] };
  return next;
}

describe('carry-over: the start of a map (docs/MAPS.md section 8.1)', () => {
  it('a new run starts full, and so does a world with no start state', () => {
    const run = newRun('vanguard', 1);
    expect(run.vitals).toEqual(fullVitals());
    const w = createWorld({ plan: planFor(run, run.offers[0]), build: run.build, xp: 0 });
    expect(w.player.life).toBeCloseTo(lifeCap(w, w.player));
    expect(w.flasks.every((f) => f.charges === f.spec.maxCharges)).toBe(true);
    expect(vitalsOf(w)).toEqual({
      life: 1,
      mana: 1,
      es: 1,
      flasks: Object.fromEntries(w.flasks.map((f) => [f.spec.uid, 1])),
    });
  });

  it('the player starts with the fractions it is given, and a flask not listed is full', () => {
    const run = newRun('vanguard', 1);
    const plan = planFor(run, run.offers[0]);
    const [first, second] = run.build.flasks.filter((f) => f !== null);
    const start = { life: 0.5, mana: 0.25, es: 0.5, flasks: { [first!.uid]: 0.4 } };
    const w = createWorld({ plan, build: run.build, xp: 0, opts: { start } });
    expect(w.player.life).toBeCloseTo(lifeCap(w, w.player) * 0.5);
    expect(w.player.mana).toBeCloseTo((w.player.def.maxMana - w.char.reservedMana) * 0.25);
    const a = w.flasks.find((f) => f.spec.uid === first!.uid)!;
    const b = w.flasks.find((f) => f.spec.uid === second!.uid)!;
    expect(a.charges).toBeCloseTo(a.spec.maxCharges * 0.4);
    expect(b.charges).toBe(b.spec.maxCharges);
  });

  it('a map hands back what is left, and the next one starts from it', () => {
    const run = newRun('vanguard', 2, LEGACY);
    const plan = planFor(run, run.offers[0]);
    const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan));
    expect(res.status).toBe('cleared');
    const v = res.vitals;
    for (const f of [v.life, v.mana, v.es, ...Object.values(v.flasks)]) {
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
    expect(v.life).toBeLessThan(1); // a whole map cost some life
    expect(Object.keys(v.flasks).map(Number).sort()).toEqual(
      run.build.flasks
        .filter((f) => f !== null)
        .map((f) => f!.uid)
        .sort(),
    );
    const next = createWorld({
      plan: planFor(run, run.offers[1]),
      build: run.build,
      xp: 0,
      opts: { start: v },
    });
    expect(vitalsOf(next).life).toBeCloseTo(v.life, 5);
  });
});

describe('camp rest (docs/MAPS.md section 8.2)', () => {
  const hurt = { life: 0.2, mana: 0.2, es: 0, flasks: { 7: 0.3 } };

  it('restores life by ten seconds of regeneration, capped at full', () => {
    const run = withMods(newRun('vanguard', 1), [mod('lifeRegen', 'base', 5)]);
    const def = new Character(run.build, cfgFor(run)).defence();
    expect(def.lifeRegen).toBeGreaterThan(4);
    const after = restAtCamp(run.build, run.map, hurt, 10);
    const cap = def.maxLife;
    expect(after.life).toBeCloseTo(0.2 + (def.lifeRegen * 10) / cap, 5);
    expect(restAtCamp(run.build, run.map, hurt, 1000).life).toBe(1);
  });

  it('a build with no regeneration gets no life back, but its mana still recovers', () => {
    const run = newRun('vanguard', 1);
    const def = new Character(run.build, cfgFor(run)).defence();
    expect(def.lifeRegen).toBe(0);
    const after = restAtCamp(run.build, run.map, hurt, 10);
    expect(after.life).toBeCloseTo(0.2, 5);
    expect(after.mana).toBeGreaterThan(0.2);
  });

  it('more regeneration recovers more', () => {
    const base = newRun('vanguard', 1);
    const strong = withMods(base, [mod('lifeRegen', 'base', 10)]);
    const weak = withMods(base, [mod('lifeRegen', 'base', 2)]);
    const s = restAtCamp(strong.build, 1, hurt).life;
    const w = restAtCamp(weak.build, 1, hurt).life;
    expect(s).toBeGreaterThan(w);
  });

  it('energy shield recharges only after its delay, and flask charges come back unchanged', () => {
    const run = newRun('mystic', 1);
    const def = new Character(run.build, cfgFor(run)).defence();
    expect(def.maxEs).toBeGreaterThan(0);
    const within = restAtCamp(run.build, run.map, hurt, def.esDelay);
    expect(within.es).toBe(0);
    const after = restAtCamp(run.build, run.map, hurt, def.esDelay + 1);
    expect(after.es).toBeCloseTo(def.esRecharge / def.maxEs, 5);
    expect(after.flasks).toEqual({ 7: 0.3 });
  });
});

describe('carry-over in the run', () => {
  it('finishing a map stores what is left plus the camp rest, not full', () => {
    const run = newRun('vanguard', 2, LEGACY);
    const plan = planFor(run, run.offers[0]);
    const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan));
    const left = res.vitals;
    finishMap(run, res);
    expect(run.phase).toBe('camp');
    expect(run.vitals.life).toBeGreaterThanOrEqual(left.life);
    expect(run.vitals.life).toBeLessThan(1);
    expect(run.vitals.flasks).toEqual(left.flasks);
  });

  it('the next map starts from the stored vitals', () => {
    const run = newRun('vanguard', 3);
    run.vitals = { life: 0.4, mana: 0.5, es: 1, flasks: {} };
    const plan = planFor(run, run.offers[0]);
    const w = createWorld({ plan, build: run.build, xp: 0, opts: worldOptsFor(run, plan) });
    expect(w.player.life / lifeCap(w, w.player)).toBeCloseTo(0.4);
  });

  it('survives a save and a load', () => {
    const run = newRun('vanguard', 4);
    run.vitals = { life: 0.35, mana: 0.6, es: 1, flasks: { 3: 0.5 } };
    const store = new MemoryStore();
    saveRun(store, run);
    const loaded = loadRun(store);
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') expect(loaded.run.vitals).toEqual(run.vitals);
  });
});

describe('abandoned maps in the run (docs/MAPS.md 7.2)', () => {
  const result = (
    status: 'cleared' | 'abandoned' | 'timeout',
    picked: MapResult['picked'],
  ): MapResult => ({
    status,
    areaLevel: 5,
    time: 40,
    ticks: 2400,
    level: 12,
    xp: 33,
    xpGained: 33,
    kills: 7,
    stuck: 0,
    picked,
    eventHash: 0,
    lifeFrac: 0.4,
    vitals: { life: 0.3, mana: 0.5, es: 1, flasks: {} },
  });

  it('keeps the loot and XP, advances the counter, and pays no clear rewards', () => {
    const run = newRun('vanguard', 8);
    setMap(run, 5);
    const item = makeItem(uidSource(run), 'sword_1', 5, 1);
    const refunds = run.refundPoints;
    const bonus = run.bonusPoints;
    finishMap(run, result('abandoned', [item]));
    expect(run.phase).toBe('camp');
    expect(run.map).toBe(6);
    expect(run.offers.every((o) => o.areaLevel === 6)).toBe(true);
    expect(run.inventory.some((it) => it.uid === item.uid)).toBe(true);
    expect(run.build.level).toBe(12);
    expect(run.xp).toBe(33);
    expect(run.refundPoints).toBe(refunds);
    expect(run.bonusPoints).toBe(bonus);
    expect(run.reward).toBeNull(); // map 5 would have paid a pick
    expect(run.history.at(-1)).toMatchObject({ map: 5, status: 'abandoned' });
    expect(run.vitals.life).toBeGreaterThanOrEqual(0.3);
  });

  it('the same map cleared would have paid the pick and the refund point', () => {
    const run = newRun('vanguard', 8);
    setMap(run, 5);
    finishMap(run, result('cleared', []));
    expect(run.reward).not.toBeNull();
    expect(run.refundPoints).toBe(1);
  });

  it('a timeout is still the end of the run', () => {
    const run = newRun('vanguard', 8);
    setMap(run, 5);
    finishMap(run, result('timeout', []));
    expect(run.phase).toBe('dead');
    expect(run.map).toBe(5);
  });
});
