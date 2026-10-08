import { Character, sheetDps, type CharacterSheet } from '../calc/character';
import { itemBase } from '../data/bases';
import { flaskBase } from '../data/flasks';
import { gemDef, type ActiveGemDef, type SupportGemDef } from '../data/gems';
import { resolveActive } from '../calc/gems';
import type { SkillType } from '../data/skillTypes';
import { themeDef } from '../data/themes';
import { getTree } from '../data/tree';
import {
  EQUIP_SLOTS,
  type InventoryItem,
  type Build,
  type EquipSlot,
  type GemItem,
  type Item,
} from '../data/types';
import { resistPenaltyForMap } from '../gen/mapPlan';
import { runMap, type MapResult } from '../sim/runMap';
import { canEquip, equip, equipFlask, slotsFor, unsocketGem, withEquipped } from './inventory';
import type { MapOffer } from './offers';
import {
  finishMap,
  newRun,
  passivePoints,
  planFor,
  takeReward,
  worldOptsFor,
  type RunState,
} from './run';
import { Rng } from '../core/rng';
import { botChalk, botCraft } from './botCraft';
import { salvage } from './craft';
import { buildSignature, killerTracker, RunTally } from './metrics';
import { randomCraft } from './randomBot';
import type { RunSummary } from './report';
import { scoreTheme } from './threat';
import { allocate, pathTo } from './tree';

/**
 * The headless decision bot (DESIGN.md §15.5): greedy choices by Δ(DPS × EHP).
 */

/** The bot plans with the steady-state conditions of a fight (EXPANSION 5.10), not with all of them off. */
export function cfgFor(run: RunState) {
  return {
    areaLevel: run.map,
    resistPenalty: resistPenaltyForMap(run.map),
    steady: 'clearing' as const,
  };
}

/** The character sheet under the clearing conditions. */
export function sheetOf(run: RunState, build: Build = run.build): CharacterSheet {
  return new Character(build, cfgFor(run)).sheet();
}

const skillCache = new Map<string, { dps: number; isDefault: boolean }>();

/** The primary skill's sustained damage of a build, and whether it fell back to the default attack (remembered like scores). */
function skillOf(run: RunState, build: Build): { dps: number; isDefault: boolean } {
  const key = buildKey(run, build);
  let r = skillCache.get(key);
  if (!r) {
    const s = sheetOf(run, build).skill;
    if (skillCache.size > 20000) skillCache.clear();
    skillCache.set(key, (r = { dps: s.sustainedDps, isDefault: s.isDefault }));
  }
  return r;
}

/** The bot's objective: total DPS × effective HP (geometric-safe for zeros). */
export function score(s: CharacterSheet): number {
  return Math.max(0.1, sheetDps(s)) * Math.max(1, s.ehp);
}

/** How much a build's clearing score counts against its boss score. */
const CLEARING_WEIGHT = 0.7;

/** The score of a build: its clearing and boss scores, as a weighted geometric mean. */
export function scoreBuild(run: RunState, build: Build): number {
  // The bot asks about the same builds again and again (every pass over a bag re-tries the items it has already
  // tried), so remember the scores by everything they depend on.
  const key = buildKey(run, build);
  const hit = scoreCache.get(key);
  if (hit !== undefined) return hit;
  const ch = new Character(build, cfgFor(run));
  const clearing = score(ch.sheet());
  const boss = score(ch.sheet(ch.steadyMask('boss')));
  const v = clearing ** CLEARING_WEIGHT * boss ** (1 - CLEARING_WEIGHT);
  if (scoreCache.size > 20000) scoreCache.clear();
  scoreCache.set(key, v);
  return v;
}

const scoreCache = new Map<string, number>();
/** What an item or flask is, as text (items are never edited in place, so this is worked out once per object). */
const objectKeys = new WeakMap<object, string>();
const keyOf = (x: object | null | undefined): string => {
  if (!x) return '';
  let k = objectKeys.get(x);
  if (k === undefined) objectKeys.set(x, (k = JSON.stringify(x)));
  return k;
};

/** Everything a build's score depends on: the character, its gear, its tree, and the map (for the area level). */
function buildKey(run: RunState, b: Build): string {
  const parts = [run.map, b.classId, b.level, b.primaryGem ?? '', b.allocated.join(',')];
  for (const slot of EQUIP_SLOTS) parts.push(keyOf(b.equipment[slot]));
  for (const f of b.flasks) parts.push(keyOf(f));
  return parts.join('|');
}

const scoreOf = scoreBuild;

/** Which of the offered maps the bot takes. */
export type ThemeRule = 'first' | 'best';

/** The offered map the build is best placed to beat (the first one when the rule is 'first'). */
export function chooseOffer(run: RunState, rule: ThemeRule = 'best'): MapOffer {
  const [first, ...rest] = run.offers;
  if (rule === 'first') return first;
  const ch = new Character(run.build, cfgFor(run));
  const boss = run.map % 10 === 0 ? 'boss' : 'clearing';
  const valueOf = (o: MapOffer) => scoreTheme(ch, themeDef(o.themeId), boss, o.affixes).value;
  let best = first;
  let bestValue = valueOf(first);
  // A later offer must beat the best so far by 0.1%, so ties keep the earlier one.
  for (const o of rest) {
    const v = valueOf(o);
    if (v > bestValue * 1.001) {
      best = o;
      bestValue = v;
    }
  }
  return best;
}

// ---- Passives -----------------------------------------------------------------------------

/** Spend all passive points greedily by score gain per point over nearby targets. */
export function botAllocate(run: RunState, maxDepth = 6): void {
  const tree = getTree();
  for (let guard = 0; guard < 200 && passivePoints(run) > 0; guard++) {
    const pts = passivePoints(run);
    const base = scoreOf(run, run.build);
    // Candidate targets: every unallocated node within `maxDepth` of the allocated set.
    const have = new Set([tree.starts[run.classId], ...run.build.allocated]);
    const depth = new Map<number, number>();
    let frontier = [...have];
    for (let d = 1; d <= Math.min(maxDepth, pts); d++) {
      const next: number[] = [];
      for (const n of frontier)
        for (const m of tree.nodes[n].links) {
          if (have.has(m) || depth.has(m) || tree.nodes[m].kind === 'start') continue;
          depth.set(m, d);
          next.push(m);
        }
      frontier = next;
    }
    let best: { target: number; value: number } | null = null;
    for (const [id, d] of depth) {
      const kind = tree.nodes[id].kind;
      // Only evaluate path ends worth walking to (travel nodes count when adjacent).
      if (d > 1 && kind === 'travel') continue;
      const path = pathTo(run.build.allocated, run.classId, id);
      if (!path || path.length > pts) continue;
      const s = scoreOf(run, { ...run.build, allocated: [...run.build.allocated, ...path] });
      const value = (s - base) / base / path.length;
      if (!best || value > best.value) best = { target: id, value };
    }
    if (!best) break;
    // Even a zero-value node is taken so points are not wasted (attributes help gems and gear).
    if (allocate(run, best.target).length === 0) break;
  }
}

// ---- Gems ---------------------------------------------------------------------------------

type GemRef = { gem: GemItem; slot: EquipSlot | null; socket: number };

function allGems(run: RunState): GemRef[] {
  const out: GemRef[] = [];
  for (const slot of EQUIP_SLOTS)
    run.build.equipment[slot]?.sockets.forEach((g, socket) => {
      if (g) out.push({ gem: g, slot, socket });
    });
  for (const it of run.inventory)
    if (it.kind === 'gem') out.push({ gem: it, slot: null, socket: -1 });
  return out;
}

/** Re-socket all gems: best active + greedy supports in the biggest item, auras elsewhere. */
export function botRegem(run: RunState): void {
  const gems = allGems(run);
  if (gems.length === 0) return;
  // Strip every socket; rebuild the layout from scratch.
  const equipment: Partial<Record<EquipSlot, Item>> = {};
  for (const slot of EQUIP_SLOTS) {
    const it = run.build.equipment[slot];
    if (it) equipment[slot] = { ...it, sockets: it.sockets.map(() => null) };
  }
  const host = EQUIP_SLOTS.filter((s) => equipment[s]).sort(
    (a, b) => equipment[b]!.sockets.length - equipment[a]!.sockets.length,
  )[0];
  if (!host || equipment[host]!.sockets.length === 0) return;
  const pool = [...gems.map((g) => g.gem)];
  const take = (uid: number) =>
    pool.splice(
      pool.findIndex((g) => g.uid === uid),
      1,
    )[0];
  const place = (slot: EquipSlot, gem: GemItem) => {
    const it = equipment[slot]!;
    const i = it.sockets.indexOf(null);
    const sockets = [...it.sockets];
    sockets[i] = gem;
    equipment[slot] = { ...it, sockets };
  };
  const buildWith = (eq: Partial<Record<EquipSlot, Item>>, primary?: number): Build => ({
    ...run.build,
    equipment: { ...eq },
    primaryGem: primary,
  });
  // 1. Active: the one with the best DPS on its own.
  let bestActive: { gem: GemItem; dps: number } | null = null;
  const seen = new Set<string>();
  for (const g of pool) {
    const d = gemDef(g.gemId);
    if (d.kind !== 'active' || seen.has(g.gemId)) continue;
    seen.add(g.gemId);
    const eq = { ...equipment };
    const it = eq[host]!;
    eq[host] = { ...it, sockets: [g, ...it.sockets.slice(1)] };
    const s = skillOf(run, buildWith(eq, g.uid));
    if (s.isDefault) continue;
    if (!bestActive || s.dps > bestActive.dps) bestActive = { gem: g, dps: s.dps };
  }
  let primary: number | undefined;
  if (bestActive) {
    take(bestActive.gem.uid);
    place(host, bestActive.gem);
    primary = bestActive.gem.uid;
    // 2. Supports, greedily by DPS. A support whose rules can never hold for the skill (even with the types the
    // other supports add) is not worth building a character for.
    const types = new Set<SkillType>(
      resolveActive(gemDef(bestActive.gem.gemId) as ActiveGemDef, 1).types,
    );
    for (const g of pool) {
      const d = gemDef(g.gemId);
      if (d.kind === 'support') for (const t of d.adds ?? []) types.add(t);
    }
    const possible = (d: SupportGemDef) =>
      (d.supports.length === 0 || d.supports.some((t) => types.has(t))) &&
      (d.needs ?? []).every((t) => types.has(t));
    while (equipment[host]!.sockets.includes(null)) {
      const cur = skillOf(run, buildWith(equipment, primary)).dps;
      let best: { gem: GemItem; dps: number } | null = null;
      const tried = new Set<string>();
      for (const g of pool) {
        const d = gemDef(g.gemId);
        if (d.kind !== 'support' || tried.has(g.gemId) || !possible(d)) continue;
        if (equipment[host]!.sockets.some((x) => x?.gemId === g.gemId)) continue;
        tried.add(g.gemId);
        const eq = { ...equipment };
        const it = eq[host]!;
        const sockets = [...it.sockets];
        sockets[sockets.indexOf(null)] = g;
        eq[host] = { ...it, sockets };
        const dps = skillOf(run, buildWith(eq, primary)).dps;
        if (dps > cur * 1.01 && (!best || dps > best.dps)) best = { gem: g, dps };
      }
      if (!best) break;
      take(best.gem.uid);
      place(host, best.gem);
    }
  }
  // 2b. Secondary casts (EXPANSION 5.5a): another active in a free socket, kept if the combined score rises.
  if (bestActive) {
    const second = new Set<string>([gemDef(bestActive.gem.gemId).id]);
    for (const g of [...pool]) {
      if (gemDef(g.gemId).kind !== 'active' || second.has(g.gemId)) continue;
      const slot = EQUIP_SLOTS.find((x) => equipment[x]?.sockets.includes(null));
      if (!slot) break;
      const before = scoreOf(run, buildWith(equipment, primary));
      const eq = { ...equipment };
      const it = eq[slot]!;
      const sockets = [...it.sockets];
      sockets[sockets.indexOf(null)] = g;
      eq[slot] = { ...it, sockets };
      if (scoreOf(run, buildWith(eq, primary)) > before * 1.01) {
        take(g.uid);
        place(slot, g);
        second.add(g.gemId);
      }
    }
  }
  // 3. Auras in any remaining socket, kept only if they improve the score.
  const auras = pool.filter((g) => gemDef(g.gemId).kind === 'aura');
  const usedAura = new Set<string>();
  for (const a of auras) {
    if (usedAura.has(a.gemId)) continue;
    const slot = EQUIP_SLOTS.find((s) => equipment[s]?.sockets.includes(null));
    if (!slot) break;
    const before = scoreOf(run, buildWith(equipment, primary));
    const eq = { ...equipment };
    const it = eq[slot]!;
    const sockets = [...it.sockets];
    sockets[sockets.indexOf(null)] = a;
    eq[slot] = { ...it, sockets };
    if (scoreOf(run, buildWith(eq, primary)) > before * 1.01) {
      take(a.uid);
      place(slot, a);
      usedAura.add(a.gemId);
    }
  }
  const next = buildWith(equipment, primary);
  if (scoreOf(run, next) + 1e-9 >= scoreOf(run, run.build) * 0.999) {
    run.build = next;
    run.inventory = [...run.inventory.filter((x) => x.kind !== 'gem'), ...pool];
  }
}

// ---- Items --------------------------------------------------------------------------------

/** Whether the item in `slot` holds more gems than a replacement with `sockets` sockets could take. */
function wouldStrand(run: RunState, slot: EquipSlot, sockets: number): boolean {
  const old = run.build.equipment[slot];
  return !!old && old.sockets.filter(Boolean).length > sockets;
}

/** Take every gem out of the item in `slot`, into the inventory, so a new layout can place them. */
function stripGems(run: RunState, slot: EquipSlot): void {
  const it = run.build.equipment[slot];
  if (!it) return;
  for (let i = 0; i < it.sockets.length; i++) unsocketGem(run, slot, i);
}

/** A two-step plan: move the gem group to the best other host, then wear the item. */
function equipAndRegem(run: RunState, uid: number, slot: EquipSlot): void {
  stripGems(run, slot);
  equip(run, uid, slot);
  botRegem(run);
}

/**
 * Equip any inventory item that improves the score (gems carried over). An item that would strand
 * gems (fewer sockets than the one it replaces) is also tried as the two-step plan of moving the
 * gem group elsewhere first (EXPANSION 10.1 item 3), which is how a socketless unique gets worn.
 */
export function botEquip(run: RunState): void {
  // How each (item, slot) fared the first time through the bag: after something is worn, only the ones that were close
  // to an improvement are tried again. A bag full of items that were clearly worse stays clearly worse, and trying every
  // one of them after every swap is what made a large unique pool slow the bot down (COVERAGE 5.2, bot scaling).
  const first = new Map<string, number>();
  for (let guard = 0; guard < 20; guard++) {
    const base = scoreOf(run, run.build);
    let best: { uid: number; slot: EquipSlot; s: number; viaRegem: boolean } | null = null;
    for (const it of run.inventory) {
      if (it.kind !== 'item') continue;
      for (const slot of slotsFor(it)) {
        const fk = `${it.uid}:${slot}`;
        const prior = first.get(fk);
        if (guard > 0 && prior !== undefined && prior < 0.9) continue;
        if (!canEquip(run, it, slot).ok) {
          first.set(fk, 0);
          continue;
        }
        let s = scoreOf(run, withEquipped(run.build, it, slot));
        if (guard === 0) first.set(fk, s / base);
        let viaRegem = false;
        // Only for uniques that a plain swap rejects: the plan costs a trial run, and uniques are the
        // items that break the socket plan on purpose.
        if (
          it.rarity === 'unique' &&
          s <= base * 1.005 &&
          wouldStrand(run, slot, it.sockets.length)
        ) {
          const trial: RunState = JSON.parse(JSON.stringify(run));
          equipAndRegem(trial, it.uid, slot);
          const s2 = scoreOf(trial, trial.build);
          if (s2 > s) {
            s = s2;
            viaRegem = true;
          }
        }
        if (s > base * 1.005 && (!best || s > best.s)) best = { uid: it.uid, slot, s, viaRegem };
      }
    }
    if (!best) break;
    if (best.viaRegem) equipAndRegem(run, best.uid, best.slot);
    else equip(run, best.uid, best.slot);
  }
}

function flaskRank(f: InventoryItem): number {
  if (f.kind !== 'flask') return -1;
  const b = flaskBase(f.baseId);
  return b.life * 1.0 + b.mana * 0.5 + (b.kind === 'utility' ? 300 : 0) + f.affixes.length * 20;
}

/** Fill flask slots: two life, one mana (if needed), two utility, best tier first. */
export function botFlasks(run: RunState): void {
  const all = [
    ...run.build.flasks.filter(Boolean),
    ...run.inventory.filter((x) => x.kind === 'flask'),
  ] as InventoryItem[];
  const usable = all.filter(
    (f) => f.kind === 'flask' && flaskBase(f.baseId).level <= run.build.level,
  );
  const byKind = (k: string) =>
    usable
      .filter((f) => f.kind === 'flask' && flaskBase(f.baseId).kind === k)
      .sort((a, b) => flaskRank(b) - flaskRank(a));
  const life = [...byKind('life'), ...byKind('hybrid')];
  const mana = byKind('mana');
  const util = byKind('utility');
  const usesMana = sheetOf(run).skill.cost > 0;
  const want: InventoryItem[] = [
    life[0],
    life[1],
    usesMana ? mana[0] : util[2],
    util[0],
    util[1],
  ].filter((x, i, arr) => x && arr.indexOf(x) === i) as InventoryItem[];
  // Put everything back in the inventory, then equip the chosen ones.
  for (const f of run.build.flasks) if (f) run.inventory.push(f);
  run.build = { ...run.build, flasks: [null, null, null, null, null] };
  want.slice(0, 5).forEach((f, i) => equipFlask(run, f.uid, i));
}

/** Keep the inventory small: salvage items that are not upgrades (into Bone Dust). */
/** How many copies of one gem the bot keeps in the bag (one is placed, one may be spare). */
const SPARE_GEMS = 2;

export function botTidy(run: RunState, keep = 12): void {
  const items = run.inventory.filter((x) => x.kind === 'item') as Item[];
  const value = (it: Item) =>
    ({ normal: 0, magic: 1, rare: 2, unique: 3 })[it.rarity] * 100 +
    itemBase(it.baseId).level +
    it.ilvl * 0.1;
  items.sort((a, b) => value(a) - value(b));
  for (const it of items.slice(0, Math.max(0, items.length - keep))) salvage(run, it.uid);
  const flasks = run.inventory.filter((x) => x.kind === 'flask');
  flasks.sort((a, b) => flaskRank(a) - flaskRank(b));
  for (const f of flasks.slice(0, Math.max(0, flasks.length - 6))) salvage(run, f.uid);
  // Gems drop often now: a skill or support is only ever used once or twice, so extra copies are salvaged.
  const seen = new Map<string, number>();
  for (const g of run.inventory)
    if (g.kind === 'gem') {
      const n = (seen.get(g.gemId) ?? 0) + 1;
      seen.set(g.gemId, n);
      if (n > SPARE_GEMS) salvage(run, g.uid);
    }
}

/** Take the reward offer that scores best (items equipped, gems socketed). */
/** How the bot spends currency: by the sheet ('greedy'), at random, or not at all. */
export type CraftPolicy = 'greedy' | 'random' | 'none';

export function botReward(run: RunState, crafting = true): void {
  if (!run.reward) return;
  const offers = run.reward;
  let best: { uid: number; s: number } | null = null;
  for (const o of offers) {
    const trial: RunState = JSON.parse(JSON.stringify(run));
    takeReward(trial, o.uid);
    if (o.kind === 'gem') botRegem(trial);
    else if (o.kind === 'item') botEquip(trial);
    else if (o.kind === 'flask') botFlasks(trial);
    // A bundle of currency is worth a little to a bot that crafts, and nothing to one that does not.
    const s =
      o.kind === 'currency'
        ? crafting
          ? scoreOf(trial, trial.build) * 1.004
          : 0
        : scoreOf(trial, trial.build) + (o.kind === 'flask' ? 1 : 0);
    if (!best || s > best.s) best = { uid: o.uid, s };
  }
  takeReward(run, best?.uid ?? null);
}

/** All camp decisions between maps. */
export function botCamp(run: RunState, policy: CraftPolicy = 'greedy'): void {
  botReward(run, policy !== 'none');
  botEquip(run);
  botRegem(run);
  if (policy === 'greedy') {
    // Re-equip and re-socket only if crafting changed something.
    if (botCraft(run) > 0) {
      botEquip(run);
      botRegem(run);
    }
  } else if (policy === 'random') {
    const rng = new Rng(run.seed).fork(`botCraft${run.map}`);
    for (let i = 0; i < 8; i++) randomCraft(run, rng);
    botEquip(run);
    botRegem(run);
  }
  botFlasks(run);
  botAllocate(run);
  botTidy(run);
  run.newLoot = [];
}

export type BotMapRecord = {
  map: number;
  status: MapResult['status'];
  time: number;
  level: number;
  xp: number;
  stuck: number;
};

export type BotRunResult = RunSummary & {
  seed: number;
  /** The last map attempted. */
  reached: number;
  maps: BotMapRecord[];
};

export type BotRunOpts = {
  /** 'best' (default) takes the theme the build is better placed to beat; 'first' always takes the first. */
  themes?: ThemeRule;
  /** How the bot spends currency (default 'greedy'). */
  crafting?: CraftPolicy;
};

/** Play a full run headlessly (§15.5). `maxMap` stops after that map. */
export function botRun(
  classId: string,
  seed: number,
  maxMap = 100,
  opts: BotRunOpts = {},
): BotRunResult {
  const run = newRun(classId, seed);
  const maps: BotMapRecord[] = [];
  const tally = new RunTally();
  const killer = killerTracker();
  while (run.phase === 'camp' && run.map <= maxMap) {
    const crafting = opts.crafting ?? 'greedy';
    botCamp(run, crafting);
    if (crafting === 'greedy') botChalk(run);
    const plan = planFor(run, chooseOffer(run, opts.themes));
    const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan), undefined, killer.tick);
    maps.push({
      map: run.map,
      status: res.status,
      time: res.time,
      level: res.level,
      xp: res.xpGained,
      stuck: res.stuck,
    });
    if (res.status === 'cleared') tally.afterMap(run, res.picked);
    finishMap(run, res);
  }
  const last = maps[maps.length - 1];
  const died = run.phase === 'dead';
  return {
    classId,
    seed,
    won: run.phase === 'victory',
    reached: last?.map ?? 0,
    maps,
    deathMap: died ? (last?.map ?? null) : null,
    killer: died ? killer.get() : null,
    mapsPlayed: maps.length,
    found: tally.found,
    gemsFound: tally.gems,
    snapshots: tally.snapshots,
    signature: buildSignature(run.build),
  };
}

export const _test = { allGems };

export type ProbeRecord = {
  map: number;
  level: number;
  dps: number;
  ehp: number;
  life: number;
  es: number;
  time: number;
  tookPerSec: number;
};

/** Balance probe: the bot plays with an immortal character and records its power curve. */
export function botProbe(classId: string, seed: number, maxMap = 100): ProbeRecord[] {
  const run = newRun(classId, seed);
  const out: ProbeRecord[] = [];
  while (run.phase === 'camp' && run.map <= maxMap) {
    botCamp(run);
    const s = sheetOf(run);
    const plan = planFor(run, run.offers[0]);
    const opts = { ...worldOptsFor(run, plan), godMode: true };
    let took = 0;
    const res = runMap(plan, run.build, run.xp, opts, undefined, (w) => {
      for (const e of w.events) if (e.t === 'hit' && e.dst === 1) took += e.amount;
    });
    out.push({
      map: run.map,
      level: run.build.level,
      dps: s.skill.totalDps,
      ehp: s.ehp,
      life: s.life,
      es: s.es,
      time: res.time,
      tookPerSec: took / res.time,
    });
    finishMap(run, res.status === 'cleared' ? res : { ...res, status: 'cleared' });
  }
  return out;
}
