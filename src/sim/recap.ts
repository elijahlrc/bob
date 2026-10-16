import { enemiesNear } from './utility';
import type { DeathRecap, RecapHit, World } from './types';

/** Seconds of damage the recap's lines cover. */
export const RECAP_SECONDS = 5;
/** Seconds of single hits the telemetry record keeps, and the most hits it keeps. */
export const RECAP_HIT_SECONDS = 10;
export const RECAP_HITS = 14;
/** How near a monster is to count as "near" at the moment of death, in tiles. */
export const RECAP_NEAR = 8;

/** Damage over time is logged every tick: it is a total in the recap, not a list of hits. */
const OVER_TIME = new Set(['Burning', 'Bleeding', 'Poison']);

/** Build the death recap for a player who has just died (EXPANSION section 9). */
export function buildRecap(w: World): DeathRecap {
  const log = w.sides[0].dmgLog.filter((d) => w.t - d.t <= RECAP_SECONDS);
  const byKey = new Map<string, { name: string; dtype: number; amount: number }>();
  for (const d of log) {
    const k = `${d.name}|${d.dtype}`;
    const cur = byKey.get(k) ?? { name: d.name, dtype: d.dtype, amount: 0 };
    cur.amount += d.amount;
    byKey.set(k, cur);
  }
  // The killer is the last monster to hit (an effect such as burning is not a killer).
  const last = [...log].reverse().find((d) => d.rarity !== 'effect') ?? log[log.length - 1];
  const def = w.player.def;
  const cap = (i: number) => Math.min(def.res[i], def.maxRes[i]);
  const ail = w.player.ail;
  const ailments: string[] = [];
  if (ail.ignites.length) ailments.push('ignited');
  if (ail.bleeds.length) ailments.push('bleeding');
  if (ail.poisons.length) ailments.push('poisoned');
  if (ail.shock > 0) ailments.push(`shocked (${Math.round(ail.shock * 100)}% more damage taken)`);
  if (ail.chill > 0) ailments.push('chilled');
  if (ail.freezeT > 0) ailments.push('frozen');
  // The hits of the last seconds, oldest first, and no more than the record has room for (the latest are kept).
  const hits: RecapHit[] = w.sides[0].dmgLog
    .filter((d) => w.t - d.t <= RECAP_HIT_SECONDS && !OVER_TIME.has(d.name))
    .slice(-RECAP_HITS)
    .map((d) => ({
      ago: w.t - d.t,
      name: d.name,
      via: d.via,
      rarity: d.rarity,
      dtype: d.dtype,
      amount: d.amount,
      hp: d.hp,
    }));
  const near = enemiesNear(w, w.player.x, w.player.y, RECAP_NEAR);
  return {
    time: w.t,
    killer: last?.name ?? 'Unknown',
    killerRarity: last?.rarity ?? 'normal',
    killerMods: last?.mods ?? [],
    killerType: last?.type,
    themeId: w.plan.theme.id,
    affixes: [...w.plan.affixes],
    areaLevel: w.plan.areaLevel,
    mapType: w.plan.type,
    lines: [...byKey.values()].sort((a, b) => b.amount - a.amount),
    res: { fire: cap(3), cold: cap(2), lightning: cap(1), chaos: cap(4) },
    maxRes: {
      fire: def.maxRes[3],
      cold: def.maxRes[2],
      lightning: def.maxRes[1],
      chaos: def.maxRes[4],
    },
    ailments,
    maxLife: def.maxLife,
    maxEs: def.maxEs,
    hits,
    vitals: { life: w.player.life, es: w.player.es, mana: w.player.mana },
    defence: {
      armour: def.armour,
      evasion: def.evasion,
      blockAttack: def.blockAttack,
      blockSpell: def.blockSpell,
      physReduction: def.physReduction,
      lifeRegen: def.lifeRegen,
      movement: def.moveSpeed,
    },
    flasks: w.sides[0].flasks.map((f) => ({
      kind: f.spec.kind,
      charges: f.charges,
      max: f.spec.maxCharges,
      active: f.activeT > 0,
      uses: f.uses,
    })),
    near: {
      all: near.length,
      magic: near.filter((e) => e.rarity === 'magic').length,
      rare: near.filter((e) => e.rarity === 'rare').length,
      boss: near.filter((e) => e.rarity === 'boss' || e.rarity === 'miniboss').length,
    },
  };
}
