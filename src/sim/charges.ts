import { Character } from '../calc/character';
import {
  CHARGE_KINDS,
  CHARGE_SECONDS,
  chargeStat,
  type ChargeCounts,
  type ChargeEvent,
  type ChargeKind,
} from '../calc/charges';
import { affixPlayerMods } from '../data/mapAffixes';
import { TROPHY_MODS, TROPHY_SECONDS, trophyMods } from '../data/trophy';
import { playerCtx, refreshPlayerDefence } from './combat';
import type { Mod } from '../mods/types';
import { theftBuild, theftKey, theftMods } from './theft';
import type { World } from './types';
import type { Side } from './side';

/** The sum of the base mods of one stat in a short list (what a skill and its supports give). */
export function sumOf(mods: readonly Mod[], stat: string): number {
  let s = 0;
  for (const m of mods) if (m.stat === stat && m.kind === 'base') s += m.value;
  return s;
}

/**
 * Charges in the sim (EXPANSION 5.6). The player holds up to the character's maximum of each kind. Gaining
 * one refreshes the timer of every charge of that kind, and when the timer runs out they all expire. The
 * effects live in the calc engine: the world swaps to the character built with the current counts.
 */

const key = (c: ChargeCounts, trophy: readonly string[] = []) =>
  `${c.grit}.${c.fervour}.${c.insight}|${trophy.join(',')}`;

const trophyIds = (s: Side) => Object.keys(s.trophy).sort();

/** The character for the world's build with these charges (built once, then kept). */
export function characterWith(w: World, s: Side, counts: ChargeCounts): Character {
  const trophy = trophyIds(s);
  // What the Unmaker holds of the build is part of it too (docs/BOSSES.md 9).
  const k = key(counts, trophy) + theftKey(w);
  let ch = s.chars.get(k);
  if (!ch) {
    ch = new Character(theftBuild(w, s.build), {
      areaLevel: w.plan.areaLevel,
      resistPenalty: w.plan.resistPenalty,
      extraMods: [
        ...w.plan.affixes.flatMap((id) => affixPlayerMods(id, w.plan.areaLevel)),
        ...trophyMods(trophy),
        ...theftMods(w),
      ],
      charges: counts,
    });
    s.chars.set(k, ch);
  }
  return ch;
}

/** Make the character match the charges now held. */
function swap(w: World, s: Side, counts: ChargeCounts): void {
  const next = characterWith(w, s, counts);
  if (next === s.char) return;
  s.char = next;
  s.primary = next.primary;
  refreshPlayerDefence(w, s);
}

/** The Trophy Cord: a rare monster has died; hold its mods for a while. */
export function gainTrophy(w: World, s: Side, modIds: readonly string[]): void {
  if (!s.char.db.flag('trophyMods')) return;
  let changed = false;
  for (const id of modIds) {
    if (!TROPHY_MODS[id as keyof typeof TROPHY_MODS]) continue;
    if (!(id in s.trophy)) changed = true;
    s.trophy[id] = TROPHY_SECONDS;
  }
  if (changed) swap(w, s, { ...s.char.charges });
}

/** Gain one charge of a kind: up to the maximum, refreshing every charge of that kind. */
export function gainCharge(w: World, s: Side, kind: ChargeKind): void {
  const have = s.char.charges;
  const max = s.char.chargeMax[kind];
  s.chargeT[kind] = CHARGE_SECONDS * s.char.db.mult(`chargeDuration.${kind}`);
  if (have[kind] >= max) return;
  swap(w, s, { ...have, [kind]: have[kind] + 1 });
  w.events.push({ t: 'charge', kind, count: s.char.charges[kind] });
}

/** Spend charges of a kind on purpose; returns whether the character held that many. */
export function spendCharges(w: World, s: Side, kind: ChargeKind, n: number): boolean {
  const have = s.char.charges;
  if (have[kind] < n) return false;
  swap(w, s, { ...have, [kind]: have[kind] - n });
  if (s.char.charges[kind] === 0) s.chargeT[kind] = 0;
  w.events.push({ t: 'spend', kind, n });
  return true;
}

/** Roll the chance of gaining each kind of charge on an event (a kill, a block, a critical strike). */
export function rollCharges(
  w: World,
  s: Side,
  event: ChargeEvent,
  extra: readonly Mod[] = [],
): void {
  // The chance may be a buff's (Surge of Blood gives it only while it is up), so ask with the conditions that hold now.
  const ctx = playerCtx(w, s);
  for (const kind of CHARGE_KINDS) {
    const chance =
      s.char.db.sum('base', chargeStat(event, kind), ctx) + sumOf(extra, chargeStat(event, kind));
    if (chance > 0 && w.rngTrig.chance(Math.min(1, chance / 100))) gainCharge(w, s, kind);
  }
}

/** Run down the timers; a kind whose timer ends loses every charge. */
export function tickCharges(w: World, s: Side, dt: number): void {
  let counts: ChargeCounts | null = null;
  for (const id of Object.keys(s.trophy)) {
    s.trophy[id] -= dt;
    if (s.trophy[id] <= 0) {
      delete s.trophy[id];
      counts = counts ?? { ...s.char.charges };
    }
  }
  for (const kind of CHARGE_KINDS) {
    if (s.chargeT[kind] <= 0) continue;
    s.chargeT[kind] -= dt;
    if (s.chargeT[kind] <= 0) {
      counts = counts ?? { ...s.char.charges };
      counts[kind] = 0;
    }
  }
  if (counts) swap(w, s, counts);
}

/** Register the world's starting character, so returning to no charges does not rebuild it. */
export function seedCharacters(s: Side): void {
  s.chars.set(key(s.char.charges, trophyIds(s)), s.char);
}

/** What the Unmaker holds changed: the character as it now is (its charges kept). */
export function rebuildForTheft(w: World, s: Side): void {
  swap(w, s, { ...s.char.charges });
}

/** After the build changes (a level up): rebuild for the charges now held. */
export function rebuildCharacter(w: World, s: Side): void {
  const counts = { ...s.char.charges };
  s.chars.clear();
  s.char = characterWith(w, s, counts);
  s.primary = s.char.primary;
}
