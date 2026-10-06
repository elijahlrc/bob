import { Character, type CharacterSheet } from '../calc/character';
import { itemBase } from '../data/bases';
import { flaskBase } from '../data/flasks';
import { gemDef } from '../data/gems';
import { getTree } from '../data/tree';
import {
  EQUIP_SLOTS,
  type AnyItem,
  type Build,
  type EquipSlot,
  type GemItem,
  type Item,
} from '../data/types';
import { resistPenaltyForMap } from '../gen/mapPlan';
import { runMap, type MapResult } from '../sim/runMap';
import { canEquip, discard, equip, equipFlask, slotsFor, withEquipped } from './inventory';
import {
  finishMap,
  newRun,
  passivePoints,
  planFor,
  takeReward,
  worldOptsFor,
  type RunState,
} from './run';
import { allocate, pathTo } from './tree';

/**
 * The headless decision bot (DESIGN.md §15.5): greedy choices by Δ(DPS × EHP).
 */

export function cfgFor(run: RunState) {
  return { areaLevel: run.map, resistPenalty: resistPenaltyForMap(run.map) };
}

export function sheetOf(run: RunState, build: Build = run.build): CharacterSheet {
  return new Character(build, cfgFor(run)).sheet();
}

/** The bot's objective: total DPS × effective HP (geometric-safe for zeros). */
export function score(s: CharacterSheet): number {
  return Math.max(0.1, s.skill.sustainedDps) * Math.max(1, s.ehp);
}

const scoreOf = (run: RunState, b: Build) => score(sheetOf(run, b));

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
    const s = sheetOf(run, buildWith(eq, g.uid));
    if (s.skill.isDefault) continue;
    if (!bestActive || s.skill.sustainedDps > bestActive.dps)
      bestActive = { gem: g, dps: s.skill.sustainedDps };
  }
  let primary: number | undefined;
  if (bestActive) {
    take(bestActive.gem.uid);
    place(host, bestActive.gem);
    primary = bestActive.gem.uid;
    // 2. Supports, greedily by DPS.
    while (equipment[host]!.sockets.includes(null)) {
      const cur = sheetOf(run, buildWith(equipment, primary)).skill.sustainedDps;
      let best: { gem: GemItem; dps: number } | null = null;
      const tried = new Set<string>();
      for (const g of pool) {
        const d = gemDef(g.gemId);
        if (d.kind !== 'support' || tried.has(g.gemId)) continue;
        if (equipment[host]!.sockets.some((x) => x?.gemId === g.gemId)) continue;
        tried.add(g.gemId);
        const eq = { ...equipment };
        const it = eq[host]!;
        const sockets = [...it.sockets];
        sockets[sockets.indexOf(null)] = g;
        eq[host] = { ...it, sockets };
        const dps = sheetOf(run, buildWith(eq, primary)).skill.sustainedDps;
        if (dps > cur * 1.01 && (!best || dps > best.dps)) best = { gem: g, dps };
      }
      if (!best) break;
      take(best.gem.uid);
      place(host, best.gem);
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

/** Equip any inventory item that improves the score (gems carried over). */
export function botEquip(run: RunState): void {
  for (let guard = 0; guard < 20; guard++) {
    const base = scoreOf(run, run.build);
    let best: { uid: number; slot: EquipSlot; s: number } | null = null;
    for (const it of run.inventory) {
      if (it.kind !== 'item') continue;
      for (const slot of slotsFor(it)) {
        if (!canEquip(run, it, slot).ok) continue;
        const s = scoreOf(run, withEquipped(run.build, it, slot));
        if (s > base * 1.005 && (!best || s > best.s)) best = { uid: it.uid, slot, s };
      }
    }
    if (!best) break;
    equip(run, best.uid, best.slot);
  }
}

function flaskRank(f: AnyItem): number {
  if (f.kind !== 'flask') return -1;
  const b = flaskBase(f.baseId);
  return b.life * 1.0 + b.mana * 0.5 + (b.kind === 'utility' ? 300 : 0) + f.affixes.length * 20;
}

/** Fill flask slots: two life, one mana (if needed), two utility, best tier first. */
export function botFlasks(run: RunState): void {
  const all = [
    ...run.build.flasks.filter(Boolean),
    ...run.inventory.filter((x) => x.kind === 'flask'),
  ] as AnyItem[];
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
  const want: AnyItem[] = [life[0], life[1], usesMana ? mana[0] : util[2], util[0], util[1]].filter(
    (x, i, arr) => x && arr.indexOf(x) === i,
  ) as AnyItem[];
  // Put everything back in the inventory, then equip the chosen ones.
  for (const f of run.build.flasks) if (f) run.inventory.push(f);
  run.build = { ...run.build, flasks: [null, null, null, null, null] };
  want.slice(0, 5).forEach((f, i) => equipFlask(run, f.uid, i));
}

/** Keep the inventory small: drop items that are not upgrades. */
export function botTidy(run: RunState, keep = 24): void {
  const items = run.inventory.filter((x) => x.kind === 'item') as Item[];
  if (items.length <= keep) return;
  const value = (it: Item) =>
    ({ normal: 0, magic: 1, rare: 2, unique: 3 })[it.rarity] * 100 +
    itemBase(it.baseId).level +
    it.ilvl * 0.1;
  items.sort((a, b) => value(a) - value(b));
  for (const it of items.slice(0, items.length - keep)) discard(run, it.uid);
  const flasks = run.inventory.filter((x) => x.kind === 'flask');
  flasks.sort((a, b) => flaskRank(a) - flaskRank(b));
  for (const f of flasks.slice(0, Math.max(0, flasks.length - 6))) discard(run, f.uid);
}

/** Take the reward offer that scores best (items equipped, gems socketed). */
export function botReward(run: RunState): void {
  if (!run.reward) return;
  const offers = run.reward;
  let best: { uid: number; s: number } | null = null;
  for (const o of offers) {
    const trial: RunState = JSON.parse(JSON.stringify(run));
    takeReward(trial, o.uid);
    if (o.kind === 'gem') botRegem(trial);
    else if (o.kind === 'item') botEquip(trial);
    else botFlasks(trial);
    const s = scoreOf(trial, trial.build) + (o.kind === 'flask' ? 1 : 0);
    if (!best || s > best.s) best = { uid: o.uid, s };
  }
  takeReward(run, best?.uid ?? null);
}

/** All camp decisions between maps. */
export function botCamp(run: RunState): void {
  botReward(run);
  botEquip(run);
  botRegem(run);
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

export type BotRunResult = {
  classId: string;
  seed: number;
  won: boolean;
  /** The last map attempted. */
  reached: number;
  maps: BotMapRecord[];
  deathMap: number | null;
};

/** Play a full run headlessly (§15.5). `maxMap` stops after that map. */
export function botRun(classId: string, seed: number, maxMap = 100): BotRunResult {
  const run = newRun(classId, seed);
  const maps: BotMapRecord[] = [];
  while (run.phase === 'camp' && run.map <= maxMap) {
    botCamp(run);
    const plan = planFor(run, run.nextThemes[0]);
    const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan));
    maps.push({
      map: run.map,
      status: res.status,
      time: res.time,
      level: res.level,
      xp: res.xpGained,
      stuck: res.stuck,
    });
    finishMap(run, res);
  }
  const last = maps[maps.length - 1];
  return {
    classId,
    seed,
    won: run.phase === 'victory',
    reached: last?.map ?? 0,
    maps,
    deathMap: run.phase === 'dead' ? (last?.map ?? null) : null,
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
    const plan = planFor(run, run.nextThemes[0]);
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
