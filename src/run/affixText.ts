import { family, familyMods, type Family } from '../data/affixes';
import type { AffixRoll, Item } from '../data/types';
import { modsText } from '../mods/text';

/** "+N to maximum Life": what a family adds at its top tier, with the numbers left out. */
export function familyText(f: Family): string {
  const top = f.tiers[f.tiers.length - 1];
  return modsText(
    familyMods(
      f,
      top.ranges.map((r) => r[1]),
    ),
  )
    .join(' and ')
    .replace(/\d+(\.\d+)?/g, 'N');
}

/** "Prefix: +N to maximum Life". */
export function familyLabel(f: Family): string {
  return `${f.type === 'prefix' ? 'Prefix' : 'Suffix'}: ${familyText(f)}`;
}

export const affixLabel = (id: string): string => familyLabel(family(id));

/** The words of a family without its number or its "+N to" / "N% increased" lead: "maximum Life". */
export function affixName(familyId: string): string {
  return familyText(family(familyId))
    .replace(/^((adds|[+-]?N%?|to|increased|reduced|more|less|additional|of)\s+)+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The affixes an item carries, as a short list of names for a row ("maximum Life, Fire Resistance, Attack Speed"). */
export function affixSummary(it: Item, max = 3): string {
  const names = it.affixes.map((a: AffixRoll) => affixName(a.family));
  const shown = names.slice(0, max).join(', ');
  return names.length > max ? `${shown} +${names.length - max}` : shown;
}
