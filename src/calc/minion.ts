import { easeDamage, easeLife } from '../data/constants';
import { MINIONS, type MinionId } from '../data/minions';
import { ModDB } from '../mods/modDb';
import { mod, type Mod } from '../mods/types';
import type { Defence } from './combat';
import { defenceFromDb } from './defence';
import { monsterArmour, monsterHit, monsterLife } from './formulas';
import { MONSTER_CONDS } from './monster';

/** Life regenerated each second, as a share of a minion's life. */
export const MINION_REGEN_PCT = 1;
/** Movement the defence block reports; the sim moves minions by their own speed. */
const MINION_MOVE = 1;

export type MinionBody = {
  def: Defence;
  life: number;
};

const cache = new Map<string, MinionBody>();

/**
 * What a minion of a kind is made of at a level: monsters' life and armour at that level, scaled by the kind's
 * share, the life multiplier of the summoning skill and the damage-taken multiplier. Memoised: a summon asks again
 * every time one falls.
 */
export function minionBody(
  kind: MinionId,
  level: number,
  lifeMult: number,
  takenMult: number,
): MinionBody {
  const key = `${kind}|${level}|${lifeMult.toFixed(3)}|${takenMult.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const m = MINIONS[kind];
  const life = Math.max(
    1,
    Math.round(monsterLife(level) * easeLife(level) * m.life * Math.max(0.05, lifeMult)),
  );
  const mods: Mod[] = [
    mod('life', 'base', life),
    mod('armour', 'base', monsterArmour(level)),
    mod('moveSpeed', 'base', MINION_MOVE),
    mod('resist.allEle', 'base', m.res),
    mod('lifeRegenPct', 'base', MINION_REGEN_PCT),
  ];
  const db = new ModDB(
    mods.map((x) => ({ ...x, source: { kind: 'monster', id: `minion_${kind}` } })),
    MONSTER_CONDS,
  );
  const base = defenceFromDb(
    db,
    { tags: 0, ancestry: 0, conds: 0 },
    { isPlayer: false, resistPenalty: 0 },
  );
  const def: Defence = { ...base, damageTakenMult: base.damageTakenMult * takenMult };
  const body = { def, life: def.maxLife };
  cache.set(key, body);
  return body;
}

/**
 * Hits from a monster of the map's level that put a minion at the half-way point of standing. Enemies go for the player
 * first, so minions are hit less than they could be: probe runs on real maps keep three in four skeletons and nearly
 * every zombie or golem standing, which this reproduces (hits to fall: about 15, 40 and 90).
 */
export const MINION_FRAGILITY = 4;

/** The share of the time (0 to 1) minions of a kind stand and fight at a level, from their life against the hits of the map. */
export function minionUptime(
  kind: MinionId,
  level: number,
  lifeMult: number,
  takenMult: number,
): number {
  const body = minionBody(kind, level, lifeMult, takenMult);
  const hits =
    body.life / Math.max(1e-6, monsterHit(level) * easeDamage(level) * body.def.damageTakenMult);
  return hits / (hits + MINION_FRAGILITY);
}
