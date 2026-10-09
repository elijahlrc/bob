import { diffSheets, sheetDps, type SheetDiff } from '../calc/character';
import { family, familyMods, type Family } from '../data/affixes';
import { BENCH_RECIPES, CURRENCIES, currencyDef } from '../data/currency';
import type { AffixRoll, Item } from '../data/types';
import { UNIQUES } from '../data/uniques';
import { modsText } from '../mods/text';
import { familyText } from './affixText';
import {
  addableFamilies,
  benchAdd,
  benchRemove,
  benchRemoveBench,
  benchSocketCost,
  benchSockets,
  drawReforge,
  locate,
  owned,
  POLISH_LIMIT,
  previewAdd,
  previewRemove,
  reforgeCost,
  salvage,
  salvageValue,
  socketCeiling,
  socketCost,
  useAuger,
  useDie,
  useEssence,
  usePearl,
  useSeal,
  useThread,
  useWhetstone,
  type CraftResult,
} from './craft';
import { sheetOf } from './bot';
import type { RunState } from './run';

/**
 * What a craft would do, before it is paid for (docs/ITEMS.md 4.3). `planCraft` answers "can I, what does it cost, and what
 * will the item look like", and `applyCraft` does it; both go through the real functions of `craft.ts`, so the plan cannot
 * promise what the craft would not do. A craft that rolls (a Pearl's tier and value, a reforge, the gambles) shows a typical
 * result and the range, never the roll it will really get: the craft's randomness comes from the run's seed and the number
 * of crafts so far, and a preview that showed it would let the player cancel until it liked the answer.
 */
export type CraftAction =
  | { kind: 'remove'; family: string; via: 'thread' | 'bench' }
  | { kind: 'polish'; family: string }
  /** `via`: 'pearl', 'bench', or the id of an essence. `replace` names the family an essence gives up when the slot is full. */
  | { kind: 'add'; family: string; via: string; replace?: string }
  | { kind: 'reforge'; pinned: string[] }
  | { kind: 'sockets'; count: number; via: 'auger' | 'bench' }
  | { kind: 'stripBench' }
  | { kind: 'die' }
  | { kind: 'seal' }
  | { kind: 'salvage' };

export type Cost = {
  /** A currency id, or 'dust'. */
  id: string;
  label: string;
  n: number;
  have: number;
};

export type CraftPlan = {
  action: CraftAction;
  /** What it does, as a sentence: "Remove +14 to Dexterity". */
  verb: string;
  ok: boolean;
  /** Why not, in words a player can act on. */
  reason?: string;
  cost: Cost[];
  /** The item afterwards: exact when `exact`, else a typical one. Null when nothing useful can be shown. */
  after: Item | null;
  exact: boolean;
  /** Rolled results: what can come out ("from +22 to maximum Life to +60 to maximum Life, tiers 2 to 5"). */
  range?: string;
  /** The gambles: every outcome with its chance. */
  odds?: string[];
  /** What the craft gives back instead of changing the item (salvage). */
  gain?: string;
};

// ---- Applying ---------------------------------------------------------------------------------------------

/** Do a craft. The only way the Workbench changes an item. */
export function applyCraft(run: RunState, uid: number, a: CraftAction): CraftResult {
  switch (a.kind) {
    case 'remove':
      return a.via === 'thread' ? useThread(run, uid, a.family) : benchRemove(run, uid, a.family);
    case 'polish':
      return useWhetstone(run, uid, a.family);
    case 'add':
      if (a.via === 'pearl') return usePearl(run, uid, a.family);
      if (a.via === 'bench') return benchAdd(run, uid, a.family);
      return useEssence(run, uid, a.via, a.family, a.replace);
    case 'reforge':
      return drawReforge(run, uid, a.pinned);
    case 'sockets':
      return a.via === 'auger' ? useAuger(run, uid, a.count) : benchSockets(run, uid, a.count);
    case 'stripBench':
      return benchRemoveBench(run, uid);
    case 'die':
      return useDie(run, uid);
    case 'seal':
      return useSeal(run, uid);
    case 'salvage':
      return salvage(run, uid);
  }
}

// ---- Rolls ------------------------------------------------------------------------------------------------

/** The tiers a family can roll on an item of this level, and the lowest and highest value of each of its mods. */
export function rollRange(
  f: Family,
  ilvl: number,
): { tiers: [number, number]; low: number[]; high: number[] } | null {
  const tiers = f.tiers.filter((t) => t.minIlvl <= ilvl);
  if (tiers.length === 0) return null;
  const low = f.mods.map((_, i) => Math.min(...tiers.map((t) => t.ranges[i][0])));
  const high = f.mods.map((_, i) => Math.max(...tiers.map((t) => t.ranges[i][1])));
  return { tiers: [tiers[0].tier, tiers[tiers.length - 1].tier], low, high };
}

/** "from +22 to maximum Life to +60 to maximum Life (tiers 2 to 5)". */
export function rangeText(f: Family, ilvl: number): string | undefined {
  const r = rollRange(f, ilvl);
  if (!r) return undefined;
  const lo = modsText(familyMods(f, r.low)).join(' and ');
  const hi = modsText(familyMods(f, r.high)).join(' and ');
  const tiers =
    r.tiers[0] === r.tiers[1] ? `tier ${r.tiers[0]}` : `tiers ${r.tiers[0]} to ${r.tiers[1]}`;
  return lo === hi ? `${lo} (${tiers})` : `from ${lo} to ${hi} (${tiers})`;
}

export type AffixInfo = {
  type: 'prefix' | 'suffix';
  tier: number;
  /** How many tiers the family has, so "tier 3 of 8" is available (higher numbers are stronger). */
  tiers: number;
  /** Where the value sits in its tier's range: 0 is the lowest roll, 1 is the maximum (what a Whetstone sets). */
  at: number;
  polished: boolean;
  bench: boolean;
};

/** What a player needs to judge one affix: its kind, its tier and where its roll sits. */
export function affixInfo(it: Item, a: AffixRoll): AffixInfo {
  const f = family(a.family);
  const t = f.tiers.find((x) => x.tier === a.tier) ?? f.tiers[f.tiers.length - 1];
  const parts = a.mods.map((m, i) => {
    const [lo, hi] = t.ranges[i] ?? [m.value, m.value];
    return hi > lo ? Math.max(0, Math.min(1, (m.value - lo) / (hi - lo))) : 1;
  });
  return {
    type: f.type,
    tier: a.tier,
    tiers: f.tiers.length,
    at: parts.length ? parts.reduce((s, x) => s + x, 0) / parts.length : 1,
    polished: (it.polished ?? []).includes(a.family),
    bench: !!a.bench,
  };
}

/** How many of its affix slots an item uses, and how many it has (a rare has three of each, a magic item one). */
export function slotRoom(it: Item): {
  prefix: { used: number; cap: number };
  suffix: { used: number; cap: number };
  sockets: { n: number; max: number };
} {
  const cap = it.uniqueId ? it.affixes.length : it.rarity === 'rare' ? 3 : 1;
  const used = (t: 'prefix' | 'suffix') =>
    it.affixes.filter((a) => family(a.family).type === t).length;
  return {
    prefix: { used: used('prefix'), cap },
    suffix: { used: used('suffix'), cap },
    sockets: { n: it.sockets.length, max: socketCeiling(it) },
  };
}

/** The ways to pay for adding one family: a Pearl, the Bench (if it has a recipe) and every essence that offers it. */
export function addRoutes(run: RunState, familyId: string): CraftAction[] {
  const out: CraftAction[] = [{ kind: 'add', family: familyId, via: 'pearl' }];
  if (BENCH_RECIPES.some((r) => r.kind === 'add' && r.family === familyId))
    out.push({ kind: 'add', family: familyId, via: 'bench' });
  for (const d of CURRENCIES)
    if (d.families?.includes(familyId) && owned(run, d.id) > 0)
      out.push({ kind: 'add', family: familyId, via: d.id });
  return out;
}

export type EssenceOption = {
  family: Family;
  /** Whether it can be added as the item is. */
  free: boolean;
  /** Affixes of the same kind it could replace when there is no free slot. */
  replace: string[];
  /** Set when the item cannot take it at all. */
  blocked?: string;
};

/** For an essence: each affix it offers, and what the item needs to give up to take it. */
export function essenceOptions(it: Item, essenceId: string): EssenceOption[] {
  const ids = currencyDef(essenceId).families ?? [];
  const room = addableFamilies(it);
  return ids.map((id) => {
    const f = family(id);
    if (room.some((x) => x.id === id)) return { family: f, free: true, replace: [] };
    const replace = it.affixes
      .filter((a) => family(a.family).type === f.type)
      .filter((a) => addableFamilies(previewRemove(it, a.family)).some((x) => x.id === id))
      .map((a) => a.family);
    return {
      family: f,
      free: false,
      replace,
      blocked: replace.length ? undefined : 'This item cannot take that affix.',
    };
  });
}

// ---- Planning ---------------------------------------------------------------------------------------------

const cost = (run: RunState, id: string, n: number): Cost =>
  id === 'dust'
    ? { id, label: 'Bone Dust', n, have: run.dust }
    : { id, label: currencyDef(id).name, n, have: owned(run, id) };

/** The run's craft inputs on a copy that has plenty of everything, to ask the real craft whether the rules allow it. */
function sandbox(run: RunState): RunState {
  const currency: Record<string, number> = { ...run.currency };
  for (const d of CURRENCIES) currency[d.id] = Math.max(99, currency[d.id] ?? 0);
  return {
    ...run,
    currency,
    dust: Math.max(1_000_000, run.dust),
    inventory: [...run.inventory],
    build: { ...run.build },
    tablets: { ...run.tablets },
    // Another stretch of the craft stream, so the dry run never shows (or uses up) the roll the real craft will get.
    craftSeq: run.craftSeq + 1_000_000_000,
  };
}

function costOf(run: RunState, it: Item, a: CraftAction): Cost[] {
  switch (a.kind) {
    case 'remove': {
      if (a.via === 'thread') return [cost(run, 'thread', 1)];
      const r = BENCH_RECIPES.find((x) => x.kind === 'remove');
      return r ? [cost(run, 'dust', r.dust)] : [];
    }
    case 'polish':
      return [cost(run, 'whetstone', 1)];
    case 'add':
      if (a.via === 'pearl') return [cost(run, 'pearl', 1)];
      if (a.via === 'bench') {
        const r = BENCH_RECIPES.find((x) => x.kind === 'add' && x.family === a.family);
        return r ? [cost(run, 'dust', r.dust)] : [];
      }
      return [cost(run, a.via, 1)];
    case 'reforge':
      return [cost(run, 'ember', reforgeCost(a.pinned.length))];
    case 'sockets': {
      if (a.via === 'auger') return [cost(run, 'auger', socketCost(it.sockets.length, a.count))];
      const d = benchSocketCost(it.sockets.length, a.count, run.map);
      return d === null ? [] : [cost(run, 'dust', d)];
    }
    case 'die':
      return [cost(run, 'die', 1)];
    case 'seal':
      return [cost(run, 'seal', 1)];
    case 'stripBench':
    case 'salvage':
      return [];
  }
}

const affixName = (id: string) => familyText(family(id));

function verbOf(it: Item, a: CraftAction): string {
  const mine = (id: string) => {
    const roll = it.affixes.find((x) => x.family === id);
    return roll ? modsText(roll.mods).join(' and ') : affixName(id);
  };
  switch (a.kind) {
    case 'remove':
      return `Remove ${mine(a.family)}`;
    case 'polish':
      return `Raise ${mine(a.family)} to the top of its tier`;
    case 'add':
      return `Add ${affixName(a.family)}${a.replace ? `, replacing ${mine(a.replace)}` : ''}`;
    case 'reforge':
      return a.pinned.length
        ? `Reroll every affix but ${a.pinned.length} pinned`
        : 'Reroll every affix';
    case 'sockets':
      return `Set the sockets to ${a.count}`;
    case 'stripBench':
      return 'Remove the bench affix';
    case 'die':
      return 'Throw the Knucklebone Die';
    case 'seal':
      return 'Seal the item for good';
    case 'salvage':
      return 'Salvage the item';
  }
}

/** The odds of the Knucklebone Die for this item, as `useDie` draws them. */
function dieOdds(it: Item): string[] {
  const uniques = UNIQUES.filter((u) => u.baseId === it.baseId).length;
  const unique = uniques ? 10 : 0;
  return [
    'A magic item: 60%',
    `A rare item: ${40 - unique}%`,
    ...(unique ? [`A unique made on this base: 10% (${uniques} possible)`] : []),
    'The item is remade either way and keeps its gems where they fit.',
  ];
}

/** The four outcomes of the Rot Seal, 25% each, as `useSeal` draws them. */
function sealOdds(it: Item): string[] {
  return [
    'A new implicit, +1 to socketed gem levels or +2 to a maximum resistance: 25%',
    it.fixedSockets
      ? 'Sockets rolled again: 25% (this item keeps its sockets, so nothing changes)'
      : 'Sockets rolled again: 25%',
    'The item is remade as a new random rare: 25%',
    'Nothing else changes: 25%',
    'Sealed items can never be changed again.',
  ];
}

/**
 * Plan a craft on an item. Never changes the run. `after` is the item as the real craft leaves it for the crafts that do
 * not roll; for those that do it is a typical result (`expectedRoll`), with `range` saying what can come out.
 */
export function planCraft(run: RunState, uid: number, a: CraftAction): CraftPlan {
  const loc = locate(run, uid);
  const base = (over: Partial<CraftPlan>): CraftPlan => ({
    action: a,
    verb: loc ? verbOf(loc.item, a) : 'Craft',
    ok: false,
    cost: [],
    after: null,
    exact: false,
    ...over,
  });
  if (!loc) return base({ reason: 'That item is no longer here.' });
  const it = loc.item;
  const costs = costOf(run, it, a);

  // Ask the real craft whether the rules allow it, with enough of everything so only the rules can say no.
  const copy = sandbox(run);
  const res = applyCraft(copy, uid, a);
  if (!res.ok)
    return base({ cost: costs, reason: res.reason.endsWith('.') ? res.reason : `${res.reason}.` });
  const short = costs.find((c) => c.have < c.n);

  const plan: CraftPlan = base({ cost: costs, ok: !short });
  if (short) plan.reason = `Needs ${short.n} ${short.label}, you have ${short.have}.`;

  // What the item looks like afterwards.
  if (a.kind === 'add') {
    // A rolled tier and value: show a typical one, never the real roll.
    const f = family(a.family);
    const from = a.replace ? previewRemove(it, a.replace) : it;
    plan.after = previewAdd(from, f);
    plan.range = rangeText(f, it.ilvl);
  } else if (a.kind === 'reforge') {
    plan.range = 'Three alternatives are drawn and you pick one, or keep the original.';
  } else if (a.kind === 'die') {
    plan.odds = dieOdds(it);
  } else if (a.kind === 'seal') {
    plan.odds = sealOdds(it);
  } else if (a.kind === 'salvage') {
    plan.gain = `${salvageValue(it)} Bone Dust`;
  } else {
    plan.after = locate(copy, uid)?.item ?? null;
    plan.exact = true;
  }
  return plan;
}

/** Why the "polish" of an affix cannot be done, before any currency is asked about (shown beside the control). */
export function polishLimit(it: Item): { used: number; max: number } {
  return { used: (it.polished ?? []).length, max: POLISH_LIMIT };
}

/** What a craft changed, in lines for the log ("Gained +34 to maximum Life (tier 4)"). */
export function describeChange(before: Item, after: Item): string[] {
  const out: string[] = [];
  const text = (a: AffixRoll) => modsText(a.mods).join(' and ');
  const was = new Map(before.affixes.map((a) => [a.family, a]));
  const now = new Map(after.affixes.map((a) => [a.family, a]));
  for (const a of after.affixes) {
    const b = was.get(a.family);
    if (!b) out.push(`Gained ${text(a)} (tier ${a.tier})`);
    else if (JSON.stringify(b.mods) !== JSON.stringify(a.mods) || b.tier !== a.tier)
      out.push(`${text(b)} became ${text(a)}`);
  }
  for (const b of before.affixes) if (!now.has(b.family)) out.push(`Lost ${text(b)}`);
  if (before.sockets.length !== after.sockets.length)
    out.push(`Sockets: ${before.sockets.length} to ${after.sockets.length}`);
  if (before.implicits.length !== after.implicits.length)
    out.push(
      `New implicit: ${modsText(after.implicits.slice(before.implicits.length)).join(' and ')}`,
    );
  if (before.rarity !== after.rarity) out.push(`Now ${after.rarity}`);
  if (after.sealed && !before.sealed) out.push('Sealed for good');
  return out.length ? out : ['Nothing changed'];
}

/** What wearing the crafted item instead of the worn one would do to the character (null for a carried item). */
export function wornDelta(
  run: RunState,
  uid: number,
  after: Item,
): { delta: SheetDiff; dpsPct: number; ehpPct: number } | null {
  const loc = locate(run, uid);
  if (!loc?.slot) return null;
  const a = sheetOf(run);
  const b = sheetOf(run, {
    ...run.build,
    equipment: { ...run.build.equipment, [loc.slot]: after },
  });
  const pct = (x: number, y: number) => (x > 0 ? ((y - x) / x) * 100 : 0);
  return {
    delta: diffSheets(a, b),
    dpsPct: pct(sheetDps(a), sheetDps(b)),
    ehpPct: pct(a.ehp, b.ehp),
  };
}
