import {
  DEX_ACCURACY,
  DEX_EVASION_INC,
  INT_ES_INC,
  INT_MANA,
  STR_LIFE,
  STR_MELEE_PHYS_INC,
} from '../data/constants';
import type { Attrs } from '../data/types';
import { mod, type Mod, type ModSource } from '../mods/types';

/** What changes how an attribute pays out: Strongarm adds strength's bonus to projectile attacks; Plated Hide and Strongarm drop dexterity's evasion. */
export type AttrFlags = { strongarm: boolean; noEvasion: boolean };

export type AttrEffect = { attr: keyof Attrs; mod: Mod };

/**
 * What the attributes give to other stats, as mods. The one place the per-point rules are applied: the character's totals
 * are built from these, and the Character tab shows them under each attribute.
 */
export function attributeEffects(attrs: Attrs, flags: AttrFlags, source?: ModSource): AttrEffect[] {
  const out: AttrEffect[] = [
    { attr: 'str', mod: mod('life', 'base', attrs.str * STR_LIFE, { source }) },
    {
      attr: 'str',
      mod: mod('damage', 'inc', attrs.str * STR_MELEE_PHYS_INC, {
        damageTypes: ['physical'],
        tags: ['melee'],
        source,
      }),
    },
    { attr: 'dex', mod: mod('accuracy', 'base', attrs.dex * DEX_ACCURACY, { source }) },
    { attr: 'int', mod: mod('mana', 'base', attrs.int * INT_MANA, { source }) },
    { attr: 'int', mod: mod('es', 'inc', attrs.int * INT_ES_INC, { source }) },
  ];
  if (flags.strongarm)
    out.push({
      attr: 'str',
      mod: mod('damage', 'inc', attrs.str * STR_MELEE_PHYS_INC, {
        damageTypes: ['physical'],
        tags: ['projectile', 'attack'],
        source,
      }),
    });
  if (!flags.noEvasion)
    out.push({ attr: 'dex', mod: mod('evasion', 'inc', attrs.dex * DEX_EVASION_INC, { source }) });
  return out;
}
