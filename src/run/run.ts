import { Rng } from '../core/rng';
import { classDef } from '../data/classes';
import { THEMES } from '../data/themes';
import type { AnyItem, Build, Item } from '../data/types';
import { makeFlask, makeGem, makeItem } from '../gen/items';
import { rollChest, rollDrop, rollFlask, rollGem, rollMonsterDrops } from '../gen/loot';
import { makeMapPlan, type MapPlan } from '../gen/mapPlan';
import type { WorldOpts } from '../sim/types';
import type { MapResult } from '../sim/runMap';

export const SAVE_VERSION = 1;
export const TOTAL_MAPS = 100;

export type MapRecord = {
  map: number;
  status: MapResult['status'];
  time: number;
  levelAfter: number;
  kills: number;
  stuck: number;
};

export type RunState = {
  version: number;
  seed: number;
  classId: string;
  /** The next map to play (1-based). */
  map: number;
  build: Build;
  xp: number;
  inventory: AnyItem[];
  nextUid: number;
  bonusPoints: number;
  refundPoints: number;
  /** Two theme ids offered for the next map. */
  nextThemes: [string, string];
  autoContinue: boolean;
  phase: 'camp' | 'dead' | 'victory';
  history: MapRecord[];
  /** Pending reward offers (1 of 3), if earned. */
  reward: AnyItem[] | null;
  /** Items picked up since the last camp visit that are new uniques or rares. */
  newLoot: number[];
};

const BODY_FOR_CLASS: Record<string, string> = {
  vanguard: 'body_ar_1',
  strider: 'body_ev_1',
  mystic: 'body_es_1',
  reaver: 'body_arev_1',
  zealot: 'body_ares_1',
  shade: 'body_eves_1',
};

export function uidSource(run: RunState): () => number {
  return () => run.nextUid++;
}

export function rollThemes(seed: number, map: number): [string, string] {
  const r = new Rng(seed).fork(`themes${map}`);
  const ids = r.shuffle(THEMES.map((t) => t.id));
  return [ids[0], ids[1]];
}

/** A fresh run for a class (§5.2 starting kit). */
export function newRun(classId: string, seed: number): RunState {
  const cls = classDef(classId);
  const run: RunState = {
    version: SAVE_VERSION,
    seed,
    classId,
    map: 1,
    build: {
      classId,
      level: 1,
      allocated: [],
      equipment: {},
      flasks: [null, null, null, null, null],
    },
    xp: 0,
    inventory: [],
    nextUid: 1,
    bonusPoints: 0,
    refundPoints: 0,
    nextThemes: rollThemes(seed, 1),
    autoContinue: true,
    phase: 'camp',
    history: [],
    reward: null,
    newLoot: [],
  };
  const uid = uidSource(run);
  const main = makeItem(uid, cls.startWeapons[0], 1, 1);
  run.build.equipment.mainHand = main;
  if (cls.startWeapons[1]) run.build.equipment.offHand = makeItem(uid, cls.startWeapons[1], 1, 1);
  else if (cls.startOffHand)
    run.build.equipment.offHand = makeItem(
      uid,
      cls.startOffHand,
      1,
      cls.startOffHand.startsWith('quiver') ? 0 : 1,
    );
  const body: Item = makeItem(uid, BODY_FOR_CLASS[classId], 1, 2);
  body.sockets = [makeGem(uid, cls.startSkill), makeGem(uid, cls.startSupport)];
  run.build.equipment.body = body;
  run.build.primaryGem = body.sockets[0]!.uid;
  run.build.flasks = [
    makeFlask(uid, 'flask_life_1', 1),
    makeFlask(uid, 'flask_mana_1', 1),
    null,
    null,
    null,
  ];
  return run;
}

/** Seed for a given map of a run. */
export function mapSeed(run: RunState, map: number): number {
  return new Rng(run.seed).fork(`map${map}`).nextU32();
}

export function planFor(run: RunState, themeId: string): MapPlan {
  return makeMapPlan(mapSeed(run, run.map), run.map, themeId);
}

/** World hooks that generate loot with the run's uid counter. */
export function worldOptsFor(run: RunState, plan: MapPlan): WorldOpts {
  const uid = uidSource(run);
  return {
    loot: (w, m) =>
      m.mon
        ? rollMonsterDrops(w.rngLoot, uid, {
            ilvl: m.mon.spec.level,
            monster: m.mon.spec.rarity,
            theme: plan.theme,
          })
        : [],
    chestLoot: (w) => rollChest(w.rngLoot, uid, plan.areaLevel),
  };
}

/** Apply a finished map's result to the run. */
export function finishMap(run: RunState, res: MapResult): void {
  run.history.push({
    map: run.map,
    status: res.status,
    time: res.time,
    levelAfter: res.level,
    kills: res.kills,
    stuck: res.stuck,
  });
  run.build = { ...run.build, level: res.level };
  run.xp = res.xp;
  if (res.status !== 'cleared') {
    run.phase = 'dead';
    return;
  }
  run.inventory.push(...res.picked);
  for (const it of res.picked)
    if (it.kind === 'item' && (it.rarity === 'rare' || it.rarity === 'unique'))
      run.newLoot.push(it.uid);
  run.refundPoints += 1;
  if (run.map % 10 === 0 && run.map <= 80) run.bonusPoints += 3;
  if (run.map >= TOTAL_MAPS) {
    run.phase = 'victory';
    return;
  }
  // Reward pick (1 of 3) after every 5th map and after every mini-boss (§5.3).
  if (run.map % 5 === 0) run.reward = rollRewards(run);
  run.map += 1;
  run.nextThemes = rollThemes(run.seed, run.map);
  run.phase = 'camp';
}

/** Three reward offers drawn from the item, gem and flask pools. */
export function rollRewards(run: RunState): AnyItem[] {
  const rng = new Rng(run.seed).fork(`reward${run.map}`);
  const uid = uidSource(run);
  const ilvl = run.map;
  const out: AnyItem[] = [];
  for (let i = 0; i < 3; i++) {
    const pool = rng.weighted(['item', 'gem', 'flask'] as const, [50, 30, 20]);
    if (pool === 'gem') out.push(rollGem(rng, uid));
    else if (pool === 'flask') out.push(rollFlask(rng, uid, ilvl, 1));
    else out.push(rollDrop(rng, uid, { ilvl, monster: 'rare' }, rng.chance(0.7)));
  }
  return out;
}

/** Take one reward offer (or none) into the inventory. */
export function takeReward(run: RunState, uid: number | null): void {
  if (!run.reward) return;
  const it = run.reward.find((x) => x.uid === uid);
  if (it) run.inventory.push(it);
  run.reward = null;
}

/** Passive points available to spend (§5.3). */
export function passivePoints(run: RunState): number {
  return run.build.level - 1 + run.bonusPoints - run.build.allocated.length;
}
