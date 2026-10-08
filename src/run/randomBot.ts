import { Rng } from '../core/rng';
import { BENCH_RECIPES, currencyDef } from '../data/currency';
import { gemDef } from '../data/gems';
import { getTree } from '../data/tree';
import { EQUIP_SLOTS, type EquipSlot, type Item } from '../data/types';
import { runMap, type MapResult } from '../sim/runMap';
import { buildSignature, killerTracker, RunTally } from './metrics';
import type { RunSummary } from './report';
import {
  discard,
  equip,
  equipFlask,
  setPrimary,
  slotsFor,
  socketGem,
  unequip,
  unequipFlask,
  unsocketGem,
} from './inventory';
import {
  finishMap,
  newRun,
  passivePoints,
  planFor,
  takeReward,
  worldOptsFor,
  type RunState,
} from './run';
import {
  addableFamilies,
  benchAdd,
  benchRemove,
  benchSockets,
  chalkAdd,
  chalkOptions,
  chalkRemove,
  completeTabletSets,
  drawReforge,
  pickReforge,
  redeemTablets,
  REFORGE_OPTIONS,
  salvage,
  socketCeiling,
  useAuger,
  useDie,
  useEssence,
  usePearl,
  useSeal,
  useThread,
  useWhetstone,
} from './craft';
import { allocate, refund } from './tree';

/**
 * The random player (balance baseline): every decision a human could make in camp is drawn
 * uniformly at random, with no strategy and no look at the numbers. Combat is automatic, so the
 * only moves are the camp ones. Illegal moves are simply skipped, like a click that does nothing.
 */

export type RandomMove =
  | 'equip'
  | 'unequip'
  | 'socket'
  | 'unsocket'
  | 'primary'
  | 'flask'
  | 'unflask'
  | 'passive'
  | 'refund'
  | 'discard'
  | 'craft'
  | 'salvage';

const MOVES: RandomMove[] = [
  'equip',
  'unequip',
  'socket',
  'unsocket',
  'primary',
  'flask',
  'unflask',
  'passive',
  'refund',
  'discard',
  'craft',
  'salvage',
];

/** Try one random move. Returns whether it changed anything. */
export function randomMove(run: RunState, rng: Rng, move: RandomMove = rng.pick(MOVES)): boolean {
  const inv = run.inventory;
  switch (move) {
    case 'equip': {
      const items = inv.filter((x): x is Item => x.kind === 'item');
      if (!items.length) return false;
      const it = rng.pick(items);
      return equip(run, it.uid, rng.pick(slotsFor(it))).ok;
    }
    case 'unequip': {
      const filled = EQUIP_SLOTS.filter((s) => run.build.equipment[s]);
      if (!filled.length) return false;
      unequip(run, rng.pick(filled));
      return true;
    }
    case 'socket': {
      const gems = inv.filter((x) => x.kind === 'gem');
      const hosts = EQUIP_SLOTS.filter((s) => run.build.equipment[s]?.sockets.length);
      if (!gems.length || !hosts.length) return false;
      const slot: EquipSlot = rng.pick(hosts);
      const n = run.build.equipment[slot]!.sockets.length;
      return socketGem(run, slot, rng.int(0, n - 1), rng.pick(gems).uid);
    }
    case 'unsocket': {
      const hosts = EQUIP_SLOTS.filter((s) => run.build.equipment[s]?.sockets.some(Boolean));
      if (!hosts.length) return false;
      const slot: EquipSlot = rng.pick(hosts);
      const filled = run.build.equipment[slot]!.sockets.flatMap((g, i) => (g ? [i] : []));
      unsocketGem(run, slot, rng.pick(filled));
      return true;
    }
    case 'primary': {
      const actives = EQUIP_SLOTS.flatMap((s) => run.build.equipment[s]?.sockets ?? []).filter(
        (g) => g && gemDef(g.gemId).kind === 'active',
      );
      if (!actives.length) return false;
      setPrimary(run, rng.pick(actives)!.uid);
      return true;
    }
    case 'flask': {
      const flasks = inv.filter((x) => x.kind === 'flask');
      if (!flasks.length) return false;
      return equipFlask(run, rng.pick(flasks).uid, rng.int(0, 4));
    }
    case 'unflask': {
      const idx = run.build.flasks.flatMap((f, i) => (f ? [i] : []));
      if (!idx.length) return false;
      unequipFlask(run, rng.pick(idx));
      return true;
    }
    case 'passive': {
      if (passivePoints(run) <= 0) return false;
      // Click any node next to what is already allocated (a random walk outward from the start).
      const tree = getTree();
      const have = new Set([tree.starts[run.classId], ...run.build.allocated]);
      const open = new Set<number>();
      for (const n of have)
        for (const m of tree.nodes[n].links)
          if (!have.has(m) && tree.nodes[m].kind !== 'start') open.add(m);
      if (!open.size) return false;
      return allocate(run, rng.pick([...open])).length > 0;
    }
    case 'refund': {
      if (run.refundPoints <= 0 || !run.build.allocated.length) return false;
      return refund(run, rng.pick(run.build.allocated));
    }
    case 'discard': {
      if (!inv.length) return false;
      discard(run, rng.pick(inv).uid);
      return true;
    }
    case 'craft':
      return randomCraft(run, rng);
    case 'salvage': {
      if (!inv.length) return false;
      return salvage(run, rng.pick(inv).uid).ok;
    }
  }
}

/** Spend currency at random: a random currency on a random item, with random choices. */
export function randomCraft(run: RunState, rng: Rng): boolean {
  if (run.pendingCraft) {
    const n = run.pendingCraft.options.length;
    return pickReforge(run, rng.chance(0.25) ? null : rng.int(0, n - 1)).ok;
  }
  const done = completeTabletSets(run);
  if (done.length && rng.chance(0.5)) return redeemTablets(run, rng.pick(done)).ok;
  const have = Object.keys(run.currency);
  const bench = run.dust >= 15 && rng.chance(0.3);
  if (!have.length && !bench) return false;
  const items: Item[] = [
    ...EQUIP_SLOTS.flatMap((s) => (run.build.equipment[s] ? [run.build.equipment[s]!] : [])),
    ...run.inventory.filter((x): x is Item => x.kind === 'item'),
  ];
  if (!items.length) return false;
  const it = rng.pick(items);
  const fam = () => rng.pick(it.affixes)?.family ?? '';
  if (bench) {
    const rec = rng.pick(BENCH_RECIPES);
    if (rec.kind === 'add') return benchAdd(run, it.uid, rec.family).ok;
    if (rec.kind === 'remove') return benchRemove(run, it.uid, fam()).ok;
    return benchSockets(run, it.uid, rec.nth).ok;
  }
  const id = rng.pick(have);
  switch (id) {
    case 'ember': {
      const pins = it.affixes.filter(() => rng.chance(0.3)).map((a) => a.family);
      if (!drawReforge(run, it.uid, pins).ok) return false;
      return pickReforge(run, rng.chance(0.25) ? null : rng.int(0, REFORGE_OPTIONS - 1)).ok;
    }
    case 'pearl': {
      const f = addableFamilies(it);
      return f.length ? usePearl(run, it.uid, rng.pick(f).id).ok : false;
    }
    case 'thread':
      return useThread(run, it.uid, fam()).ok;
    case 'whetstone':
      return useWhetstone(run, it.uid, fam()).ok;
    case 'auger':
      return useAuger(run, it.uid, rng.int(0, Math.max(0, socketCeiling(it)))).ok;
    case 'die':
      return useDie(run, it.uid).ok;
    case 'seal':
      return useSeal(run, it.uid).ok;
    case 'chalk': {
      const offer = rng.int(0, run.offers.length - 1);
      if (rng.chance(0.5)) return chalkAdd(run, offer, rng.pick(chalkOptions(run, offer))).ok;
      const cur = run.offers[offer].affixes;
      return cur.length ? chalkRemove(run, offer, rng.pick(cur)).ok : false;
    }
    default: {
      const def = currencyDef(id);
      const f = def.families ? rng.pick(def.families) : '';
      return useEssence(run, it.uid, id, f, rng.chance(0.5) ? fam() || undefined : undefined).ok;
    }
  }
}

/** One camp visit: take a random reward (or none), then make a random number of random moves. */
export function randomCamp(run: RunState, rng: Rng, maxMoves = 8): number {
  if (run.reward) takeReward(run, rng.chance(0.25) ? null : rng.pick(run.reward).uid);
  let made = 0;
  for (let i = rng.int(0, maxMoves); i > 0; i--) if (randomMove(run, rng)) made++;
  run.newLoot = [];
  return made;
}

export type RandomMapRecord = {
  map: number;
  status: MapResult['status'];
  time: number;
  level: number;
  kills: number;
  lifeFrac: number;
};

export type RandomRunResult = RunSummary & {
  seed: number;
  /** Map the run ended on (died there), or the last map cleared if the cap was reached. */
  reached: number;
  died: boolean;
  level: number;
  maps: RandomMapRecord[];
  /** Moves made in camp over the whole run. */
  moves: number;
};

/** Play one whole run with random decisions. `maxMap` stops the run after that map. */
export function randomRun(
  classId: string,
  seed: number,
  maxMap = 100,
  maxMoves = 8,
): RandomRunResult {
  const run = newRun(classId, seed);
  const rng = new Rng(seed).fork('randomPlayer');
  const maps: RandomMapRecord[] = [];
  const tally = new RunTally();
  const killer = killerTracker();
  let moves = 0;
  while (run.phase === 'camp' && run.map <= maxMap) {
    moves += randomCamp(run, rng, maxMoves);
    const plan = planFor(run, rng.pick(run.offers));
    const res = runMap(plan, run.build, run.xp, worldOptsFor(run, plan), undefined, killer.tick);
    maps.push({
      map: run.map,
      status: res.status,
      time: res.time,
      level: res.level,
      kills: res.kills,
      lifeFrac: res.lifeFrac,
    });
    if (res.status === 'cleared') tally.afterMap(run, res.picked);
    finishMap(run, res);
  }
  const lastMap = maps[maps.length - 1];
  const died = run.phase === 'dead';
  return {
    classId,
    seed,
    reached: lastMap?.map ?? 0,
    died,
    won: run.phase === 'victory',
    deathMap: died ? (lastMap?.map ?? null) : null,
    level: run.build.level,
    maps,
    killer: died ? killer.get() : null,
    mapsPlayed: maps.length,
    found: tally.found,
    gemsFound: tally.gems,
    snapshots: tally.snapshots,
    signature: buildSignature(run.build),
    moves,
  };
}
