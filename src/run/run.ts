import { ACTIVE_GEMS } from '../data/gems';
import { Rng } from '../core/rng';
import { classDef } from '../data/classes';
import { factionOfSpec } from '../data/monsters';
import { TABLET_PREFIX } from '../data/currency';
import type { AnyItem, Build, CurrencyItem, InventoryItem, Item } from '../data/types';
import { rollCurrencyBundle, rollCurrencyDrops } from '../gen/currencyDrops';
import { makeFlask, makeItem } from '../gen/items';
import {
  rollChest,
  rollDrop,
  rollFlask,
  rollGem,
  rollMonsterDrops,
  rollUniqueOf,
  uniqueIdOf,
} from '../gen/loot';
import { mapAffixDef } from '../data/mapAffixes';
import { makeMapPlan, type MapPlan } from '../gen/mapPlan';
import { flaskMask } from '../sim/combat';
import type { DeathRecap, WorldOpts } from '../sim/types';
import type { MapResult } from '../sim/runMap';
import { makeOffer, rollOffers, type MapOffer } from './offers';

export { rollThemes } from './offers';

export const SAVE_VERSION = 5;
export const TOTAL_MAPS = 100;

export type MapRecord = {
  map: number;
  /** The level of the map that was played (differs from `map` once offers carry level offsets). */
  areaLevel: number;
  status: MapResult['status'];
  time: number;
  levelAfter: number;
  kills: number;
  stuck: number;
};

/** A reforge whose three alternatives have been drawn and shown, and not yet picked (EXPANSION 8.1). */
export type PendingCraft = { itemUid: number; pinned: string[]; options: Item[] };

export type RunState = {
  version: number;
  seed: number;
  classId: string;
  /** The next map to play (1-based). */
  map: number;
  build: Build;
  xp: number;
  inventory: InventoryItem[];
  nextUid: number;
  bonusPoints: number;
  refundPoints: number;
  /** The maps offered for the next level, rolled when the previous level ended (docs/MAPS.md 4.1). */
  offers: MapOffer[];
  autoContinue: boolean;
  phase: 'camp' | 'dead' | 'victory';
  history: MapRecord[];
  /** Pending reward offers (1 of 3), if earned. */
  reward: AnyItem[] | null;
  /** Items picked up since the last camp visit that are new uniques or rares. */
  newLoot: number[];
  /** Uids of the items, gems and flasks the last cleared map dropped (the Items "Last map" filter). */
  lastDrops: number[];
  /** Why the run ended, if the player died. */
  lastRecap?: DeathRecap;
  /** Crafting currency by id (EXPANSION section 8). Nothing carries over between runs. */
  currency: Record<string, number>;
  /** Bone Dust from salvage. */
  dust: number;
  /** Tablets collected, by unique id. */
  tablets: Record<string, number>;
  /** Rises with every craft that draws; craft rolls come from the run seed and this number. */
  craftSeq: number;
  pendingCraft: PendingCraft | null;
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
    offers: rollOffers(seed, 1),
    autoContinue: true,
    phase: 'camp',
    history: [],
    reward: null,
    newLoot: [],
    lastDrops: [],
    currency: {},
    dust: 0,
    tablets: {},
    craftSeq: 0,
    pendingCraft: null,
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
  run.build.equipment.body = body;
  run.build.flasks = [
    makeFlask(uid, 'flask_life_1', 1),
    makeFlask(uid, 'flask_mana_1', 1),
    null,
    null,
    null,
  ];
  return run;
}

/** Seed of an offered map: every offer has its own layout (docs/MAPS.md 4.1). */
export function mapSeed(run: RunState, offer: MapOffer): number {
  return new Rng(run.seed).fork(`map.${offer.id}`).nextU32();
}

/** Go to a given map number and roll its offers (a new level, and tests and demos that jump ahead). */
export function setMap(run: RunState, map: number): void {
  run.map = map;
  run.offers = rollOffers(run.seed, map);
}

/**
 * The plan of an offered map. A theme id stands for a map of that theme as the offer in its slot (or
 * the first slot) would roll at the current map number; tests and tools use it to try a theme.
 */
export function planFor(run: RunState, offer: MapOffer | string): MapPlan {
  if (typeof offer === 'string') {
    const slot = Math.max(
      0,
      run.offers.findIndex((o) => o.themeId === offer),
    );
    offer = makeOffer(run.seed, run.map, slot, offer);
  }
  return makeMapPlan(mapSeed(run, offer), run.map, offer.themeId, offer.affixes);
}

/** What a map's affixes add to its loot, as fractions. */
export function affixRewards(affixes: string[]): { quantity: number; rarity: number } {
  const defs = affixes.map(mapAffixDef);
  return {
    quantity: defs.reduce((n, a) => n + (a.reward.quantity ?? 0), 0),
    rarity: defs.reduce((n, a) => n + (a.reward.rarity ?? 0), 0),
  };
}

/** World hooks that generate loot with the run's uid counter. */
export function worldOptsFor(run: RunState, plan: MapPlan): WorldOpts {
  const uid = uidSource(run);
  return {
    loot: (w, m): AnyItem[] => {
      if (!m.mon) return [];
      // Item quantity and rarity from gear, and from any flask active right now.
      const db = w.char.dbWith(flaskMask(w));
      const { quantity, rarity } = affixRewards(plan.affixes);
      const faction = factionOfSpec(m.mon.spec);
      const items: AnyItem[] = rollMonsterDrops(w.rngLoot, uid, {
        ilvl: m.mon.spec.level,
        monster: m.mon.spec.rarity,
        theme: plan.theme,
        faction,
        classId: run.build.classId,
        playerQuantity: db.mult('itemQuantity') * (1 + quantity),
        playerRarity: db.mult('itemRarity') * (1 + rarity),
      });
      return items.concat(
        rollCurrencyDrops(w.rngLoot, uid, {
          map: plan.map,
          monster: m.mon.spec.rarity,
          faction,
          quantity: db.mult('itemQuantity') * (1 + quantity) * (1 + plan.theme.itemQuantity),
          essenceBonus: plan.theme.extraEssence,
          currencyBonus: plan.theme.extraCurrency,
          bonusCurrency: plan.theme.bonusCurrency,
        }),
      );
    },
    chestLoot: (w) => rollChest(w.rngLoot, uid, plan.areaLevel),
  };
}

/** Apply a finished map's result to the run. */
export function finishMap(run: RunState, res: MapResult): void {
  run.history.push({
    map: run.map,
    areaLevel: run.map,
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
    if (res.recap) run.lastRecap = res.recap;
    return;
  }
  run.lastDrops = [];
  for (const it of res.picked) {
    if (it.kind !== 'currency') run.lastDrops.push(it.uid);
    if (it.kind === 'currency') {
      stash(run, it);
      continue;
    }
    run.inventory.push(it);
    if (it.kind === 'item' && (it.rarity === 'rare' || it.rarity === 'unique'))
      run.newLoot.push(it.uid);
  }
  run.refundPoints += 1;
  if (run.map % 10 === 0 && run.map <= 80) run.bonusPoints += 3;
  if (run.map >= TOTAL_MAPS) {
    run.phase = 'victory';
    return;
  }
  // Reward pick (1 of 3) after every 5th map and after every mini-boss (§5.3).
  if (run.map % 5 === 0) run.reward = rollRewards(run);
  else if (run.map <= SKILL_REWARD_MAPS) run.reward = rollSkillRewards(run);
  run.map += 1;
  run.offers = rollOffers(run.seed, run.map);
  run.phase = 'camp';
}

/** Put picked-up currency or tablets in the pouch. */
export function stash(run: RunState, it: CurrencyItem): void {
  if (it.id.startsWith(TABLET_PREFIX)) {
    const id = it.id.slice(TABLET_PREFIX.length);
    run.tablets[id] = (run.tablets[id] ?? 0) + it.count;
  } else run.currency[it.id] = (run.currency[it.id] ?? 0) + it.count;
}

/** The early maps that end with a pick of three skill gems (the others follow the every-fifth-map pick). */
export const SKILL_REWARD_MAPS = 4;

/** Three different skill gems the run does not hold yet (as many as are left, if fewer). */
export function rollSkillRewards(run: RunState): AnyItem[] {
  const rng = new Rng(run.seed).fork(`skillreward${run.map}`);
  const held = new Set<string>();
  for (const it of run.inventory) if (it.kind === 'gem') held.add(it.gemId);
  for (const it of Object.values(run.build.equipment))
    for (const g of it?.sockets ?? []) if (g) held.add(g.gemId);
  const pool = ACTIVE_GEMS.filter((g) => !held.has(g.id));
  rng.shuffle(pool);
  const uid = uidSource(run);
  return pool.slice(0, 3).map((g): AnyItem => ({ kind: 'gem', uid: uid(), gemId: g.id }));
}

/** Three reward offers drawn from the item, gem and flask pools. */
export function rollRewards(run: RunState): AnyItem[] {
  const rng = new Rng(run.seed).fork(`reward${run.map}`);
  const uid = uidSource(run);
  const ilvl = run.map;
  const out: AnyItem[] = [];
  // After maps 25, 50 and 75 the three offers are uniques the character can wear at its level.
  if (run.map % 25 === 0 && run.map < TOTAL_MAPS) {
    const seen = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const u = rollUniqueOf(rng, uid, Math.min(ilvl, run.build.level), undefined, seen);
      if (!u) break;
      out.push(u);
      seen.add(uniqueIdOf(u) ?? '');
    }
    while (out.length < 3) out.push(rollDrop(rng, uid, { ilvl, monster: 'rare' }, true));
    return out;
  }
  for (let i = 0; i < 3; i++) {
    const pool = rng.weighted(['item', 'gem', 'flask', 'currency'] as const, [45, 25, 15, 15]);
    if (pool === 'currency') out.push(rollCurrencyBundle(rng, uid, run.map));
    else if (pool === 'gem') out.push(rollGem(rng, uid, { classId: run.build.classId, ilvl }));
    else if (pool === 'flask') out.push(rollFlask(rng, uid, ilvl, 1));
    else out.push(rollDrop(rng, uid, { ilvl, monster: 'rare' }, rng.chance(0.7)));
  }
  return out;
}

/** Take one reward offer (or none) into the inventory. */
export function takeReward(run: RunState, uid: number | null): void {
  if (!run.reward) return;
  const it = run.reward.find((x) => x.uid === uid);
  if (it) {
    if (it.kind === 'currency') stash(run, it);
    else run.inventory.push(it);
  }
  run.reward = null;
}

/** Passive points available to spend (§5.3). */
export function passivePoints(run: RunState): number {
  return run.build.level - 1 + run.bonusPoints - run.build.allocated.length;
}
