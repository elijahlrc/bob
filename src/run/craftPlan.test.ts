import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { family } from '../data/affixes';
import { itemBase } from '../data/bases';
import { CURRENCIES } from '../data/currency';
import type { Item } from '../data/types';
import { rollItemOf } from '../gen/loot';
import { locate, reforgeCost, useDie, usePearl } from './craft';
import {
  addRoutes,
  affixInfo,
  applyCraft,
  essenceOptions,
  planCraft,
  rollRange,
  slotRoom,
  wornDelta,
  type CraftAction,
} from './craftPlan';
import { newRun, setMap, type RunState } from './run';

let n = 70000;
const uid = () => n++;

function setup(over: { rarity?: 'normal' | 'magic' | 'rare'; base?: string; seed?: number } = {}) {
  const run = newRun('vanguard', over.seed ?? 11);
  setMap(run, 60);
  run.build.level = 60;
  const item = rollItemOf(
    new Rng(over.seed ?? 5),
    uid,
    itemBase(over.base ?? 'body_ar_3'),
    70,
    over.rarity ?? 'rare',
  );
  run.inventory.push(item);
  for (const id of ['ember', 'pearl', 'thread', 'whetstone', 'auger', 'die', 'seal', 'chalk'])
    run.currency[id] = 50;
  run.dust = 1000;
  return { run, item };
}
const get = (run: RunState, it: Item) => locate(run, it.uid)!.item;
const snap = (run: RunState) =>
  JSON.stringify({
    c: run.currency,
    d: run.dust,
    s: run.craftSeq,
    i: run.inventory,
    b: run.build,
    p: run.pendingCraft,
  });
const copyOf = (run: RunState): RunState => ({
  ...run,
  currency: { ...run.currency },
  inventory: [...run.inventory],
  build: { ...run.build },
});

describe('a plan promises what the craft does', () => {
  it('shows exactly the item the real craft makes, for every craft that does not roll', () => {
    const { run, item } = setup();
    const a0 = item.affixes[0].family;
    const actions: CraftAction[] = [
      { kind: 'remove', family: a0, via: 'thread' },
      { kind: 'remove', family: a0, via: 'bench' },
      { kind: 'polish', family: a0 },
      { kind: 'sockets', count: 3, via: 'auger' },
      { kind: 'sockets', count: 5, via: 'bench' },
      { kind: 'add', family: 'fireRes', via: 'bench' },
    ];
    let checked = 0;
    for (const a of actions) {
      const plan = planCraft(run, item.uid, a);
      if (!plan.ok) continue;
      expect(plan.exact).toBe(true);
      const copy = copyOf(run);
      expect(applyCraft(copy, item.uid, a).ok).toBe(true);
      expect(plan.after).toEqual(get(copy, item));
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(3);
  });

  it('changes nothing and leaves the craft stream where it was', () => {
    const { run, item } = setup();
    const before = snap(run);
    const actions: CraftAction[] = [
      { kind: 'add', family: 'life', via: 'pearl' },
      { kind: 'reforge', pinned: [] },
      { kind: 'die' },
      { kind: 'seal' },
      { kind: 'salvage' },
    ];
    for (const a of actions) planCraft(run, item.uid, a);
    expect(snap(run)).toBe(before);
  });

  it('costs what the craft costs, and refuses when it is short', () => {
    const { run, item } = setup();
    const a0 = item.affixes[0].family;
    expect(planCraft(run, item.uid, { kind: 'remove', family: a0, via: 'thread' }).cost).toEqual([
      expect.objectContaining({ id: 'thread', n: 1, have: 50 }),
    ]);
    expect(planCraft(run, item.uid, { kind: 'reforge', pinned: [a0] }).cost[0]).toMatchObject({
      id: 'ember',
      n: reforgeCost(1),
    });
    run.currency.thread = 0;
    const p = planCraft(run, item.uid, { kind: 'remove', family: a0, via: 'thread' });
    expect(p.ok).toBe(false);
    expect(p.reason).toBeTruthy();
  });

  it('gives the rule before the shortage, and the reason a real craft would give', () => {
    const { run, item } = setup();
    run.currency.thread = 0;
    run.inventory[run.inventory.length - 1] = { ...item, sealed: true };
    const p = planCraft(run, item.uid, {
      kind: 'remove',
      family: item.affixes[0].family,
      via: 'thread',
    });
    expect(p.ok).toBe(false);
    expect(p.reason).toMatch(/sealed/i);
    expect(planCraft(run, item.uid, { kind: 'reforge', pinned: [] }).reason).toMatch(/sealed/i);
  });

  it('refuses what the rules refuse: a third polish, a reforge of a magic item, the Die on a rare', () => {
    const { run, item } = setup();
    const [a, b, c] = item.affixes.map((x) => x.family);
    for (const f of [a, b]) applyCraft(run, item.uid, { kind: 'polish', family: f });
    const p = planCraft(run, item.uid, { kind: 'polish', family: c });
    expect(p.ok).toBe(false);
    expect(planCraft(run, item.uid, { kind: 'die' }).ok).toBe(false);
    const magic = setup({ rarity: 'magic' });
    expect(planCraft(magic.run, magic.item.uid, { kind: 'reforge', pinned: [] }).ok).toBe(false);
  });
});

describe('a rolled craft shows a typical result and the range, never the roll', () => {
  it('lists the tiers and values an item level allows, and the real roll falls inside', () => {
    const r = rollRange(family('lifeBody'), 70)!;
    let rolled = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const { run, item } = setup({ seed });
      const prefixes = item.affixes.filter((x) => family(x.family).type === 'prefix').length;
      if (item.affixes.some((x) => x.family === 'lifeBody') || prefixes >= 3) continue;
      expect(usePearl(run, item.uid, 'lifeBody').ok).toBe(true);
      const roll = get(run, item).affixes.find((x) => x.family === 'lifeBody')!;
      expect(roll.tier).toBeGreaterThanOrEqual(r.tiers[0]);
      expect(roll.tier).toBeLessThanOrEqual(r.tiers[1]);
      expect(roll.mods[0].value).toBeGreaterThanOrEqual(r.low[0]);
      expect(roll.mods[0].value).toBeLessThanOrEqual(r.high[0]);
      rolled++;
    }
    expect(rolled).toBeGreaterThan(0);
  });

  it('shows the typical item with the new affix, the range in words, and does not use up the roll', () => {
    const { run, item } = setup({ rarity: 'magic' });
    const a = addRoutes(run, 'lifeBody')[0];
    const p = planCraft(run, item.uid, a);
    expect(p.ok).toBe(true);
    expect(p.exact).toBe(false);
    expect(p.after!.affixes.some((x) => x.family === 'lifeBody')).toBe(true);
    expect(p.range).toMatch(/tier/);
    const seq = run.craftSeq;
    planCraft(run, item.uid, a);
    expect(run.craftSeq).toBe(seq);
  });

  it('states the odds of the Die as the Die draws them', () => {
    const base = itemBase('body_ar_1');
    let magic = 0;
    let rare = 0;
    let unique = 0;
    const N = 400;
    let plan = '';
    for (let seed = 1; seed <= N; seed++) {
      const { run, item } = setup({ seed, rarity: 'normal', base: base.id });
      if (seed === 1) plan = planCraft(run, item.uid, { kind: 'die' }).odds!.join('|');
      useDie(run, item.uid);
      const it = get(run, item);
      if (it.rarity === 'magic') magic++;
      else if (it.rarity === 'rare') rare++;
      else unique++;
    }
    // The odds the plan states, read back from its text (a unique line only when the base has uniques).
    const stated = (re: RegExp) => Number(plan.match(re)?.[1] ?? 0) / 100;
    expect(stated(/magic item: (\d+)%/)).toBeGreaterThan(0);
    expect(Math.abs(magic / N - stated(/magic item: (\d+)%/))).toBeLessThan(0.08);
    expect(Math.abs(rare / N - stated(/rare item: (\d+)%/))).toBeLessThan(0.08);
    expect(Math.abs(unique / N - stated(/unique[^|]*?: (\d+)%/))).toBeLessThan(0.06);
  });
});

describe('what an item shows about its affixes', () => {
  it('puts a roll between 0 and 1 in its tier, and a polished one at the top', () => {
    const { run, item } = setup();
    for (const a of item.affixes) {
      const i = affixInfo(item, a);
      expect(i.at).toBeGreaterThanOrEqual(0);
      expect(i.at).toBeLessThanOrEqual(1);
      expect(i.tier).toBeLessThanOrEqual(i.tiers);
    }
    const f = item.affixes[0].family;
    applyCraft(run, item.uid, { kind: 'polish', family: f });
    const now = get(run, item);
    const i = affixInfo(
      now,
      now.affixes.find((x) => x.family === f)!,
    );
    expect(i.at).toBe(1);
    expect(i.polished).toBe(true);
  });

  it('counts the affix slots of an item', () => {
    const { item } = setup();
    const r = slotRoom(item);
    expect(r.prefix.used + r.suffix.used).toBe(item.affixes.length);
    expect(r.prefix.cap).toBe(3);
  });

  it('says whether an essence needs a slot given up, and which', () => {
    const { run, item } = setup();
    const ess = CURRENCIES.find((d) => d.families && d.families.length > 1)!;
    const opts = essenceOptions(item, ess.id);
    expect(opts).toHaveLength(ess.families!.length);
    for (const o of opts) {
      if (o.free) expect(o.replace).toEqual([]);
      else if (!o.blocked) {
        expect(o.replace.length).toBeGreaterThan(0);
        const holding = { ...run, currency: { ...run.currency, [ess.id]: 1 } };
        const p = planCraft(holding, item.uid, {
          kind: 'add',
          family: o.family.id,
          via: ess.id,
          replace: o.replace[0],
        });
        expect(p.ok).toBe(true);
      }
    }
  });
});

describe('describing what a craft changed', () => {
  it('gives a worn item the change to the character, and nothing for a carried one', () => {
    const { run, item } = setup();
    expect(wornDelta(run, item.uid, item)).toBeNull();
    run.inventory = run.inventory.filter((x) => x.uid !== item.uid);
    run.build = { ...run.build, equipment: { ...run.build.equipment, body: item } };
    const same = wornDelta(run, item.uid, item)!;
    expect(same.dpsPct).toBe(0);
    expect(same.ehpPct).toBe(0);
    const stripped = { ...item, affixes: [] };
    const worse = wornDelta(run, item.uid, stripped)!;
    expect(worse.delta).toBeDefined();
  });
});
