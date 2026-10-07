import { mod, type Mod } from '../mods/types';

/**
 * Charges (EXPANSION 5.6): timed stacks the character gains from events. Each kind has one effect per
 * charge. A character holds at most 3 of each (more with items and the tree), and a charge lasts 10 s.
 */
export type ChargeKind = 'grit' | 'fervour' | 'insight';
export const CHARGE_KINDS: ChargeKind[] = ['grit', 'fervour', 'insight'];
export type ChargeCounts = Record<ChargeKind, number>;

export const BASE_MAX_CHARGES = 3;
export const CHARGE_SECONDS = 10;

export const CHARGE_NAMES: Record<ChargeKind, string> = {
  grit: 'Grit',
  fervour: 'Fervour',
  insight: 'Insight',
};

/** What one charge does, as text. */
export const CHARGE_TEXT: Record<ChargeKind, string> = {
  grit: '+4% physical damage reduction and +4% to all elemental resistances',
  fervour: '4% increased attack, cast and movement speed and 4% more damage',
  insight: '40% increased critical strike chance',
};

export const noCharges = (): ChargeCounts => ({ grit: 0, fervour: 0, insight: 0 });

/** The stat ids of the ways to gain a charge: a chance, in percent, on the event. */
export const CHARGE_EVENTS = [
  'kill',
  'block',
  'crit',
  'hit',
  'meleeHit',
  'stun',
  'cast',
  'hitTaken',
] as const;
export type ChargeEvent = (typeof CHARGE_EVENTS)[number];
export const chargeStat = (event: ChargeEvent, kind: ChargeKind): string =>
  `chargeOn.${event}.${kind}`;

/** The most charges of a kind the mods allow. */
export function maxChargesOf(mods: readonly Mod[], kind: ChargeKind): number {
  let n = BASE_MAX_CHARGES;
  for (const m of mods) if (m.stat === `maxCharges.${kind}` && m.kind === 'base') n += m.value;
  return Math.max(0, n);
}

/** Whether the mods give any way to gain a charge of this kind. */
export function hasChargeSource(mods: readonly Mod[], kind: ChargeKind): boolean {
  return mods.some(
    (m) => m.stat.startsWith('chargeOn.') && m.stat.endsWith(`.${kind}`) && m.value > 0,
  );
}

/** The mods that `n` charges of a kind add. */
export function chargeMods(kind: ChargeKind, n: number): Mod[] {
  if (n <= 0) return [];
  const source = { kind: 'base' as const, id: `charge.${kind}` };
  const out: Mod[] = [];
  switch (kind) {
    case 'grit':
      out.push(mod('physReduction', 'base', 4 * n), mod('resist.allEle', 'base', 4 * n));
      break;
    case 'fervour':
      // 3.9: attack and cast speed, and more damage; no movement speed.
      out.push(mod('attackSpeed', 'inc', 4 * n), mod('castSpeed', 'inc', 4 * n));
      // 4% more damage per charge: each charge is its own multiplier.
      for (let i = 0; i < n; i++) out.push(mod('damage', 'more', 4));
      break;
    case 'insight':
      out.push(mod('critChance', 'inc', 40 * n));
      break;
  }
  return out.map((m) => ({ ...m, source }));
}
