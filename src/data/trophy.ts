import { mod, type Mod } from '../mods/types';
import type { MonsterModId } from './monsters';

/**
 * The Trophy Cord (EXPANSION 6.4): killing a rare monster gives you its monster mods for 20 seconds, in versions
 * made for the player. Mods with no player version (Raiser, Volatile, and the ones that only make sense on a monster)
 * are not gained.
 */
export const TROPHY_SECONDS = 20;

export const TROPHY_MODS: Partial<Record<MonsterModId, Mod[]>> = {
  hasted: [mod('moveSpeed', 'inc', 15), mod('attackSpeed', 'inc', 15), mod('castSpeed', 'inc', 15)],
  armoured: [mod('armour', 'inc', 100)],
  elusive: [mod('evasion', 'inc', 100)],
  prismatic: [mod('resist.allEle', 'base', 20)],
  fireBound: [mod('gain.physical.fire', 'base', 25)],
  frostBound: [mod('gain.physical.cold', 'base', 25)],
  stormBound: [mod('gain.physical.lightning', 'base', 25)],
  vampiric: [mod('leech.life', 'base', 2, { tags: ['attack'] })],
  regenerating: [mod('lifeRegenPct', 'base', 1)],
  fortified: [mod('life', 'inc', 25)],
  frenzied: [mod('damage', 'more', 25, { condition: { id: 'onLowLife' } })],
  unshakable: [mod('cannotBeStunned', 'flag', 1)],
  bloodless: [mod('damage', 'inc', 10)],
  unyielding: [mod('immuneAilments', 'flag', 1)],
  deflecting: [mod('evadeBonus.projectile', 'base', 30)],
  spellwarded: [mod('blockSpell', 'base', 25)],
  bulwarked: [mod('physReduction', 'base', 20)],
  keenEyed: [mod('alwaysHit', 'flag', 1)],
  sundering: [mod('armourIgnore', 'base', 30)],
  rotTouched: [mod('gain.physical.chaos', 'base', 20)],
};

/** The mods the player holds for a set of trophies. */
export function trophyMods(ids: readonly string[]): Mod[] {
  return ids.flatMap((id) =>
    (TROPHY_MODS[id as MonsterModId] ?? []).map((m) => ({
      ...m,
      source: { kind: 'item' as const, id: `trophy.${id}` },
    })),
  );
}
