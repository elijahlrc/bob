import { Character } from '../calc/character';
import {
  CHARGE_KINDS,
  CHARGE_SECONDS,
  chargeStat,
  type ChargeCounts,
  type ChargeEvent,
  type ChargeKind,
} from '../calc/charges';
import { mapAffixDef } from '../data/mapAffixes';
import { TROPHY_MODS, TROPHY_SECONDS, trophyMods } from '../data/trophy';
import { refreshPlayerDefence } from './combat';
import type { Mod } from '../mods/types';
import type { World } from './types';

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

const trophyIds = (w: World) => Object.keys(w.trophy).sort();

/** The character for the world's build with these charges (built once, then kept). */
export function characterWith(w: World, counts: ChargeCounts): Character {
  const trophy = trophyIds(w);
  const k = key(counts, trophy);
  let ch = w.chars.get(k);
  if (!ch) {
    ch = new Character(w.build, {
      areaLevel: w.plan.areaLevel,
      resistPenalty: w.plan.resistPenalty,
      extraMods: [
        ...w.plan.affixes.flatMap((id) => mapAffixDef(id).playerMods ?? []),
        ...trophyMods(trophy),
      ],
      charges: counts,
    });
    w.chars.set(k, ch);
  }
  return ch;
}

/** Make the character match the charges now held. */
function swap(w: World, counts: ChargeCounts): void {
  const next = characterWith(w, counts);
  if (next === w.char) return;
  w.char = next;
  w.primary = next.primary;
  refreshPlayerDefence(w);
}

/** The Trophy Cord: a rare monster has died; hold its mods for a while. */
export function gainTrophy(w: World, modIds: readonly string[]): void {
  if (!w.char.db.flag('trophyMods')) return;
  let changed = false;
  for (const id of modIds) {
    if (!TROPHY_MODS[id as keyof typeof TROPHY_MODS]) continue;
    if (!(id in w.trophy)) changed = true;
    w.trophy[id] = TROPHY_SECONDS;
  }
  if (changed) swap(w, { ...w.char.charges });
}

/** Gain one charge of a kind: up to the maximum, refreshing every charge of that kind. */
export function gainCharge(w: World, kind: ChargeKind): void {
  const have = w.char.charges;
  const max = w.char.chargeMax[kind];
  w.chargeT[kind] = CHARGE_SECONDS;
  if (have[kind] >= max) return;
  swap(w, { ...have, [kind]: have[kind] + 1 });
  w.events.push({ t: 'charge', kind, count: w.char.charges[kind] });
}

/** Roll the chance of gaining each kind of charge on an event (a kill, a block, a critical strike). */
export function rollCharges(w: World, event: ChargeEvent, extra: readonly Mod[] = []): void {
  for (const kind of CHARGE_KINDS) {
    const chance =
      w.char.db.sum('base', chargeStat(event, kind)) + sumOf(extra, chargeStat(event, kind));
    if (chance > 0 && w.rngTrig.chance(Math.min(1, chance / 100))) gainCharge(w, kind);
  }
}

/** Run down the timers; a kind whose timer ends loses every charge. */
export function tickCharges(w: World, dt: number): void {
  let counts: ChargeCounts | null = null;
  for (const id of Object.keys(w.trophy)) {
    w.trophy[id] -= dt;
    if (w.trophy[id] <= 0) {
      delete w.trophy[id];
      counts = counts ?? { ...w.char.charges };
    }
  }
  for (const kind of CHARGE_KINDS) {
    if (w.chargeT[kind] <= 0) continue;
    w.chargeT[kind] -= dt;
    if (w.chargeT[kind] <= 0) {
      counts = counts ?? { ...w.char.charges };
      counts[kind] = 0;
    }
  }
  if (counts) swap(w, counts);
}

/** Register the world's starting character, so returning to no charges does not rebuild it. */
export function seedCharacters(w: World): void {
  w.chars.set(key(w.char.charges, trophyIds(w)), w.char);
}

/** After the build changes (a level up): rebuild for the charges now held. */
export function rebuildCharacter(w: World): void {
  const counts = { ...w.char.charges };
  w.chars.clear();
  w.char = characterWith(w, counts);
  w.primary = w.char.primary;
}
