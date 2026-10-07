import type { DeathRecap, World } from './types';

/** Seconds of damage the recap covers. */
export const RECAP_SECONDS = 5;

/** Build the death recap for a player who has just died (EXPANSION section 9). */
export function buildRecap(w: World): DeathRecap {
  const log = w.dmgLog.filter((d) => w.t - d.t <= RECAP_SECONDS);
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
  return {
    time: w.t,
    killer: last?.name ?? 'Unknown',
    killerRarity: last?.rarity ?? 'normal',
    killerMods: last?.mods ?? [],
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
  };
}
