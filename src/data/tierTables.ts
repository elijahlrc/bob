import type { FamilyDef, ModTemplate } from './affixes';

/** Each row is the item level a tier unlocks at, then the [low, high] range of each of the family's mods in order. */
export type TierTable = [number, ...[number, number][]][];

/** A family whose tiers are written out: its item levels and the first and last values of each mod come from the table. */
export const tabled = (
  table: TierTable,
  mods: Omit<ModTemplate, 'first' | 'last'>[],
): Pick<FamilyDef, 'ilvls' | 'mods' | 'table'> => {
  const first = table[0].slice(1) as [number, number][];
  const last = table[table.length - 1].slice(1) as [number, number][];
  return {
    ilvls: table.map((r) => r[0]),
    table,
    mods: mods.map((m, i) => ({ ...m, first: first[i], last: last[i] })),
  };
};
