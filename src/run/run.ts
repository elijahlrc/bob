import { ACTIVE_GEMS } from '../data/gems';
import { Rng } from '../core/rng';
import { DEFAULT, LEGACY, type Difficulty } from '../data/difficulty';
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
import { affixReward, mapAffixDef } from '../data/mapAffixes';
import { CRESCENDO_LOOT_PER_STEP, mapTypeDef } from '../data/mapTypes';
import { makeMapPlan, type MapPlan } from '../gen/mapPlan';
import { offerNoise } from '../gen/population';
import { flaskMask } from '../sim/combat';
import { fullVitals, type DeathRecap, type Vitals, type WorldOpts } from '../sim/types';
import type { MapResult } from '../sim/runMap';
import { restAtCamp } from './camp';
import { noteFound, stampAll } from './found';
import { makeOffer, rollOffers, type MapOffer } from './offers';

export { rollThemes } from './offers';

export const SAVE_VERSION = 9;
export const TOTAL_MAPS = 100;

export type MapRecord = {
  map: number;
  /** The level of the map that was played (differs from `map` once offers carry level offsets). */
  areaLevel: number;
  /** 'respite' is a level passed by resting, with no map. */
  status: MapResult['status'] | 'respite';
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
  /** Uids of the items, gems and flasks picked up that the player has not looked at yet (found.ts). */
  unseen: number[];
  /** The level (`run.map`) each item was found on, by uid: what "old" means for the clean-up. */
  acquired: Record<number, number>;
  /** Uids the player has starred: never offered by the clean-up, and pinned to the top of the list. */
  favourites: number[];
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
  /** What the character carries into the next map: life, mana, energy shield and flask charges (docs/MAPS.md 8). */
  vitals: Vitals;
  /** How hard the monsters are (docs/ENEMIES.md 8): fixed for the run unless changed from the debug panel at camp. */
  difficulty: Difficulty;
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
export function newRun(classId: string, seed: number, difficulty: Difficulty = DEFAULT): RunState {
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
    autoContinue: false,
    phase: 'camp',
    history: [],
    reward: null,
    unseen: [],
    acquired: {},
    favourites: [],
    lastDrops: [],
    currency: {},
    dust: 0,
    tablets: {},
    craftSeq: 0,
    pendingCraft: null,
    vitals: fullVitals(),
    difficulty: { ...difficulty },
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
  stampAll(run, 1);
  return run;
}

/** Seed of an offered map: every offer has its own layout (docs/MAPS.md 4.1). */
export function mapSeed(run: RunState, offer: MapOffer): number {
  return new Rng(run.seed).fork(`map.${offer.id}`).nextU32();
}

/** Go to a given map number and roll its offers (a new level, and tests and demos that jump ahead). */
export function setMap(run: RunState, map: number): void {
  run.map = map;
  run.offers = rollOffers(run.seed, map, run.vitals);
}

/**
 * The plan of an offered map. A theme id stands for a map of that theme as the offer in its slot (or
 * the first slot) would roll at the current map number; tests and tools use it to try a theme.
 */
export function planFor(run: RunState, offer: MapOffer | string, segment = 0): MapPlan {
  if (typeof offer !== 'string' && offer.kind !== 'map') throw new Error('a Respite has no map');
  if (typeof offer === 'string') {
    const slot = Math.max(
      0,
      run.offers.findIndex((o) => o.themeId === offer),
    );
    offer = makeOffer(run.seed, run.map, slot, offer);
  }
  // The later maps of a Crawl have layouts of their own.
  const seed =
    segment === 0
      ? mapSeed(run, offer)
      : new Rng(mapSeed(run, offer)).fork(`crawl${segment}`).nextU32();
  return makeMapPlan(
    seed,
    run.map,
    offer.themeId,
    offer.affixes,
    offer.areaLevel,
    offer.type,
    segment,
    run.difficulty ?? LEGACY,
    offerNoise(run.seed, offer.id),
  );
}

/** What a map's affixes add to its rewards on a map of this level, as fractions. */
export function affixRewards(
  affixes: string[],
  level: number,
): { quantity: number; rarity: number; experience: number; currency: number } {
  const sum = (k: 'quantity' | 'rarity' | 'experience' | 'currency') =>
    affixes.reduce((n, id) => n + (affixReward(mapAffixDef(id), level)[k] ?? 0), 0);
  return {
    quantity: sum('quantity'),
    rarity: sum('rarity'),
    experience: sum('experience'),
    currency: sum('currency'),
  };
}

/** World hooks that generate loot with the run's uid counter. */
export function worldOptsFor(run: RunState, plan: MapPlan): WorldOpts {
  const uid = uidSource(run);
  return {
    start: run.vitals,
    loot: (w, m): AnyItem[] => {
      if (!m.mon) return [];
      // Item quantity and rarity from gear, and from any flask active right now.
      const db = w.char.dbWith(flaskMask(w));
      const affix = affixRewards(plan.affixes, plan.areaLevel);
      const { rarity, currency } = affix;
      // The map type pays too; a Crescendo kill pays more the later in the map it is made (docs/MAPS.md 9.1).
      const type = mapTypeDef(plan.type);
      const quantity =
        affix.quantity +
        (type.reward.quantity ?? 0) +
        (plan.type === 'crescendo' ? CRESCENDO_LOOT_PER_STEP * w.surge : 0);
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
      // A Quarry champion always drops a rare (sometimes a unique) and a stack of currency.
      if (plan.type === 'quarry' && m.mon.spec.rarity === 'miniboss') {
        const level = m.mon.spec.level;
        const unique = w.rngLoot.chance(0.15) ? rollUniqueOf(w.rngLoot, uid, level, faction) : null;
        items.push(
          unique ??
            rollDrop(w.rngLoot, uid, { ilvl: level, monster: 'rare', theme: plan.theme }, true),
          rollCurrencyBundle(w.rngLoot, uid, plan.map),
        );
      }
      return items.concat(
        rollCurrencyDrops(w.rngLoot, uid, {
          map: plan.map,
          monster: m.mon.spec.rarity,
          faction,
          quantity:
            db.mult('itemQuantity') *
            (1 + quantity) *
            (1 + plan.theme.itemQuantity) *
            (1 + currency),
          essenceBonus: plan.theme.extraEssence,
          currencyBonus: plan.theme.extraCurrency,
          bonusCurrency: plan.theme.bonusCurrency,
        }),
      );
    },
    chestLoot: (w) => rollChest(w.rngLoot, uid, plan.areaLevel),
  };
}

/** Take what a map's character picked up: items to the inventory, currency and tablets to the pouch. */
function collectPicked(run: RunState, res: MapResult): void {
  run.lastDrops = [];
  for (const it of res.picked) {
    if (it.kind !== 'currency') run.lastDrops.push(it.uid);
    if (it.kind === 'currency') {
      stash(run, it);
      continue;
    }
    run.inventory.push(it);
    noteFound(run, it);
  }
}

/**
 * Apply a finished map's result to the run. A cleared map pays everything; an abandoned one keeps the
 * loot and XP already taken but earns no clear rewards, and the level counts as passed (docs/MAPS.md 7.2).
 */
export function finishMap(run: RunState, res: MapResult): void {
  run.history.push({
    map: run.map,
    areaLevel: res.areaLevel,
    status: res.status,
    time: res.time,
    levelAfter: res.level,
    kills: res.kills,
    stuck: res.stuck,
  });
  run.build = { ...run.build, level: res.level };
  run.xp = res.xp;
  if (res.status !== 'cleared' && res.status !== 'abandoned') {
    run.phase = 'dead';
    if (res.recap) run.lastRecap = res.recap;
    return;
  }
  collectPicked(run, res);
  // Camp restores part of what the map cost (10 s of sitting still).
  run.vitals = restAtCamp(run.build, run.map, res.vitals);
  if (res.status === 'cleared') {
    run.refundPoints += 1;
    if (run.map % 10 === 0 && run.map <= 80) run.bonusPoints += 3;
    if (run.map >= TOTAL_MAPS) {
      run.phase = 'victory';
      return;
    }
    // A Crawl pays one pick of its own (a unique among the three); otherwise a pick after every 5th map and every
    // mini-boss (§5.3).
    if (res.type === 'crawl') run.reward = rollCrawlReward(run);
    else if (run.map % 5 === 0) run.reward = rollRewards(run);
    else if (run.map <= SKILL_REWARD_MAPS) run.reward = rollSkillRewards(run);
  }
  run.map += 1;
  run.offers = rollOffers(run.seed, run.map, run.vitals);
  run.phase = 'camp';
}

/**
 * Take the Respite offer (docs/MAPS.md 9.3): no map is played, life, mana, energy shield and flasks are full again,
 * and the level counts as passed with no XP, loot or clear rewards.
 */
export function takeRespite(run: RunState): void {
  if (run.phase !== 'camp' || run.map >= TOTAL_MAPS) return;
  run.history.push({
    map: run.map,
    areaLevel: run.map,
    status: 'respite',
    time: 0,
    levelAfter: run.build.level,
    kills: 0,
    stuck: 0,
  });
  run.vitals = fullVitals();
  run.map += 1;
  run.offers = rollOffers(run.seed, run.map, run.vitals);
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

/** The pick at the end of a Crawl: three offers, the first a unique the character could wear. */
export function rollCrawlReward(run: RunState): AnyItem[] {
  const offers = rollRewards(run);
  const rng = new Rng(run.seed).fork(`crawlreward${run.map}`);
  const unique = rollUniqueOf(rng, uidSource(run), Math.min(run.map, run.build.level));
  if (unique && !offers.some((o) => uniqueIdOf(o) !== undefined)) offers[0] = unique;
  return offers;
}

/** Take one reward offer (or none) into the inventory. */
export function takeReward(run: RunState, uid: number | null): void {
  if (!run.reward) return;
  const it = run.reward.find((x) => x.uid === uid);
  if (it) {
    if (it.kind === 'currency') stash(run, it);
    else {
      run.inventory.push(it);
      noteFound(run, it);
    }
  }
  run.reward = null;
}

/** Passive points available to spend (§5.3). */
export function passivePoints(run: RunState): number {
  return run.build.level - 1 + run.bonusPoints - run.build.allocated.length;
}
