import type { DamageType, ModKind, SkillTag } from '../mods/types';

/**
 * Unique items (DESIGN.md §11.7). Every name, flavour line and number is ours. `level` is the
 * required level (at least the base's level) and gates drops by item level.
 */
export type UniqueMod = {
  stat: string;
  kind: ModKind;
  min: number;
  max: number;
  damageTypes?: DamageType[];
  tags?: SkillTag[];
  local?: boolean;
  condition?: { id: 'targetStunned' | 'onLowLife' | 'onFullLife' | 'killedRecently' };
};

export type UniqueDef = {
  id: string;
  name: string;
  baseId: string;
  level: number;
  /** Fixed socket count override (default: rolled). */
  sockets?: number;
  mods: UniqueMod[];
  flavour: string;
};

const m = (
  stat: string,
  kind: ModKind,
  min: number,
  max = min,
  extra: Partial<UniqueMod> = {},
): UniqueMod => ({ stat, kind, min, max, ...extra });
const L = { local: true };
const ELE: DamageType[] = ['fire', 'cold', 'lightning'];

export const UNIQUES: UniqueDef[] = [
  // The twelve required examples.
  {
    id: 'hollowCrown',
    name: 'The Hollow Crown',
    baseId: 'helmet_es_2',
    level: 24,
    mods: [
      m('es', 'base', 40, 60, L),
      m('reducedReservation', 'base', 15),
      m('int', 'base', 15, 25),
    ],
    flavour: 'A crown with nothing beneath it rules nothing at all.',
  },
  {
    id: 'gravemarrow',
    name: 'Gravemarrow Chest',
    baseId: 'body_es_3',
    level: 44,
    mods: [
      m('es', 'base', 120, 160, L),
      m('es', 'inc', 60, 90, L),
      m('resist.chaos', 'base', 35),
      m('life', 'inc', -20),
    ],
    flavour: 'Ribs make a fine cage for a heart that no longer beats.',
  },
  {
    id: 'coldheart',
    name: 'Coldheart',
    baseId: 'dagger_2',
    level: 18,
    mods: [
      m('alwaysFreezeOnCrit', 'flag', 1),
      m('damage.min', 'base', 8, 12, { damageTypes: ['cold'], local: true }),
      m('damage.max', 'base', 20, 28, { damageTypes: ['cold'], local: true }),
      m('critChance', 'inc', 30, 40, L),
    ],
    flavour: 'It does not cut so much as stop the blood where it stands.',
  },
  {
    id: 'rattleBow',
    name: 'Rattle-bow',
    baseId: 'bow_2',
    level: 22,
    mods: [
      m('projectiles', 'base', 1),
      m('attackSpeed', 'inc', 100, 100, L),
      m('damage', 'more', -40),
    ],
    flavour: 'Strung with sinew, loosed with a clatter.',
  },
  {
    id: 'emberWrap',
    name: 'Ember-wrap',
    baseId: 'gloves_arev_2',
    level: 26,
    mods: [
      m('convert.physical.fire', 'base', 10),
      m('chance.ignite', 'base', 15),
      m('damage', 'inc', 15, 25, { damageTypes: ['fire'] }),
    ],
    flavour: 'The bandages never quite stop smoking.',
  },
  {
    id: 'ironroot',
    name: 'Ironroot Treads',
    baseId: 'boots_ar_2',
    level: 30,
    mods: [
      m('moveSpeed', 'inc', 25),
      m('armour', 'base', 80, 120, L),
      m('cannotBeChilled', 'flag', 1),
    ],
    flavour: 'Where the roots go, the frost cannot follow.',
  },
  {
    id: 'bloodknot',
    name: 'Bloodknot',
    baseId: 'ring_mana',
    level: 20,
    mods: [
      m('leech.life', 'base', 1, 1, { tags: ['attack'] }),
      m('resist.allEle', 'base', -10),
      m('life', 'base', 20, 30),
    ],
    flavour: 'Tie it tight enough and it ties back.',
  },
  {
    id: 'stormcall',
    name: 'Stormcall',
    baseId: 'sceptre_3',
    level: 36,
    mods: [
      m('convert.physical.lightning', 'base', 50),
      m('chance.shock', 'base', 20),
      m('damage', 'inc', 20, 30, { damageTypes: ['lightning'] }),
    ],
    flavour: 'Raise it in a crypt and the dead hear thunder.',
  },
  {
    id: 'wanderersSash',
    name: "Wanderer's Sash",
    baseId: 'belt_life',
    level: 16,
    mods: [
      m('flaskCharges', 'inc', 20, 30),
      m('flaskEffect', 'inc', 30),
      m('life', 'base', 25, 40),
    ],
    flavour: 'Every pocket rattles with something half-drunk.',
  },
  {
    id: 'thornshield',
    name: 'Thornshield',
    baseId: 'shield_ar_2',
    level: 28,
    mods: [
      m('blockAttack', 'base', 6, 6, L),
      m('lifeOnBlockPct', 'base', 2),
      m('armour', 'inc', 60, 80, L),
    ],
    flavour: 'Those who strike it bleed for the privilege.',
  },
  {
    id: 'gravehammer',
    name: 'Gravehammer',
    baseId: 'mace2_3',
    level: 38,
    mods: [
      m('enemyStunThreshold', 'base', 40),
      m('stunDuration', 'inc', 50),
      m('damage', 'more', 20, 20, { condition: { id: 'targetStunned' } }),
      m('damage', 'inc', 120, 150, { damageTypes: ['physical'], local: true }),
    ],
    flavour: 'It was made to close coffins. It still does.',
  },
  {
    id: 'stillstone',
    name: 'Stillstone',
    baseId: 'belt_armour',
    level: 32,
    mods: [
      m('cannotBeStunned', 'flag', 1),
      m('attackSpeed', 'inc', -15),
      m('armour', 'base', 150, 250),
    ],
    flavour: 'Be the boulder. Boulders do not flinch.',
  },
  // Further uniques: at least one per starting weapon class, levels spread 1–80.
  {
    id: 'oakenGrudge',
    name: 'Oaken Grudge',
    baseId: 'mace2_1',
    level: 4,
    mods: [
      m('damage', 'inc', 50, 70, { damageTypes: ['physical'], local: true }),
      m('stunDamage', 'inc', 30),
      m('life', 'base', 15, 25),
    ],
    flavour: 'Carved from the gallows tree, it remembers every neck.',
  },
  {
    id: 'firstSplinter',
    name: 'First Splinter',
    baseId: 'bow_1',
    level: 3,
    mods: [
      m('damage', 'inc', 40, 60, { damageTypes: ['physical'], local: true }),
      m('moveSpeed', 'inc', 6),
      m('dex', 'base', 10, 15),
    ],
    flavour: 'The first arrow ever loosed is still looking for its mark.',
  },
  {
    id: 'cinderReed',
    name: 'Cinder Reed',
    baseId: 'wand_1',
    level: 2,
    mods: [
      m('damage', 'inc', 20, 30, { damageTypes: ['fire'] }),
      m('chance.ignite', 'base', 10),
      m('castSpeed', 'inc', 6, 10),
    ],
    flavour: 'Snap it and it bleeds embers.',
  },
  {
    id: 'duellistsDue',
    name: 'Last Word',
    baseId: 'sword_2',
    level: 20,
    mods: [
      m('attackSpeed', 'inc', 12, 16, L),
      m('critMulti', 'base', 20, 30),
      m('accuracy', 'base', 150, 200, L),
    ],
    flavour: 'Every argument ends here.',
  },
  {
    id: 'sunspokeRelic',
    name: 'Votary of Dawn',
    baseId: 'sceptre_1',
    level: 6,
    mods: [
      m('damage', 'inc', 15, 25, { damageTypes: ELE }),
      m('auraEffect', 'inc', 10),
      m('str', 'base', 10, 15),
    ],
    flavour: 'A faint warmth lingers in the grip, even in the deepest crypt.',
  },
  {
    id: 'viperTongue',
    name: 'Viper Tongue',
    baseId: 'dagger_1',
    level: 5,
    mods: [
      m('chance.poison', 'base', 25),
      m('damage', 'inc', 30, 40, { tags: ['poison'] }),
      m('attackSpeed', 'inc', 8, 10, L),
    ],
    flavour: 'It speaks once. That is enough.',
  },
  {
    id: 'lanternOfTheLost',
    name: 'Lantern of the Lost',
    baseId: 'amulet_int',
    level: 12,
    mods: [m('mana', 'inc', 15, 20), m('es', 'base', 20, 30), m('moveSpeed', 'inc', 5)],
    flavour: 'Follow the light, it said. It did not say where.',
  },
  {
    id: 'marrowLoop',
    name: 'Marrow Loop',
    baseId: 'ring_fire',
    level: 10,
    mods: [
      m('life', 'base', 30, 40),
      m('lifeRegenPct', 'base', 1),
      m('resist.fire', 'base', 10, 15),
    ],
    flavour: 'Worn on a finger bone, it keeps the finger.',
  },
  {
    id: 'quietStep',
    name: 'Quiet Step',
    baseId: 'boots_ev_3',
    level: 48,
    mods: [
      m('moveSpeed', 'inc', 20),
      m('evasion', 'inc', 80, 110, L),
      m('evadeBonus.projectile', 'base', 10),
    ],
    flavour: 'The dead sleep lightly. Walk softer.',
  },
  {
    id: 'pyreMantle',
    name: 'Pyre Mantle',
    baseId: 'body_ares_3',
    level: 52,
    mods: [
      m('resist.fire', 'base', 40, 50),
      m('maxResist.fire', 'base', 4),
      m('damage', 'inc', 30, 40, { tags: ['ignite'] }),
      m('armour', 'inc', 70, 90, L),
    ],
    flavour: 'It has burned before. It will burn again.',
  },
  {
    id: 'colossusKnuckles',
    name: 'Colossus Knuckles',
    baseId: 'gloves_ar_3',
    level: 46,
    mods: [
      m('str', 'base', 30, 40),
      m('damage', 'inc', 20, 25, { damageTypes: ['physical'], tags: ['melee'] }),
      m('attackSpeed', 'inc', -5),
    ],
    flavour: 'Some gloves protect the hands. These protect the knuckles from nothing.',
  },
  {
    id: 'sigilOfTheArchive',
    name: 'Sigil of the Archive',
    baseId: 'helmet_es_3',
    level: 50,
    mods: [
      m('damage', 'inc', 25, 35, { tags: ['spell'] }),
      m('castSpeed', 'inc', 8, 12),
      m('es', 'inc', 60, 80, L),
    ],
    flavour: 'Every spell ever cast is written somewhere. This is somewhere.',
  },
  {
    id: 'woundWeaver',
    name: 'Wound Weaver',
    baseId: 'axe_3',
    level: 40,
    mods: [
      m('chance.bleed', 'base', 30),
      m('damage', 'inc', 40, 50, { tags: ['bleed'] }),
      m('damage', 'inc', 100, 130, { damageTypes: ['physical'], local: true }),
    ],
    flavour: 'It does not kill quickly. It is not meant to.',
  },
  {
    id: 'skylineHorn',
    name: 'Horn of the Skyline',
    baseId: 'bow_4',
    level: 58,
    mods: [
      m('critChance', 'inc', 60, 80, L),
      m('critMulti', 'base', 30, 40),
      m('projectileSpeed', 'inc', 30),
    ],
    flavour: 'Its arrows reach the horizon and keep going.',
  },
  {
    id: 'deathlessVigil',
    name: 'Deathless Vigil',
    baseId: 'body_ar_4',
    level: 66,
    mods: [
      m('life', 'base', 90, 110),
      m('stunThreshold', 'inc', 50),
      m('physReduction', 'base', 5),
      m('armour', 'inc', 100, 130, L),
    ],
    flavour: 'It stood guard over the crypt long after its wearer stopped.',
  },
  {
    id: 'stormglassCirclet',
    name: 'Stormglass Circlet',
    baseId: 'helmet_eves_4',
    level: 70,
    mods: [
      m('damage', 'inc', 30, 40, { damageTypes: ['lightning'] }),
      m('penetration', 'base', 8, 10, { damageTypes: ['lightning'] }),
      m('es', 'inc', 80, 100, L),
    ],
    flavour: 'Lightning trapped in glass, and very angry about it.',
  },
  {
    id: 'kingsTithe',
    name: "The Pauper King's Tithe",
    baseId: 'amulet_all',
    level: 74,
    mods: [
      m('allAttr', 'base', 20, 30),
      m('reducedReservation', 'base', 8),
      m('damage', 'inc', 20, 25),
      m('life', 'inc', 6, 8),
    ],
    flavour: 'He ruled the crypt by taking a little from everyone.',
  },
  {
    id: 'lastBreath',
    name: 'Last Breath',
    baseId: 'staff_5',
    level: 80,
    mods: [
      m('damage', 'inc', 60, 80, { tags: ['spell'] }),
      m('castSpeed', 'inc', 15, 20),
      m('damage', 'more', 30, 30, { tags: ['spell'], condition: { id: 'onLowLife' } }),
      m('blockAttack', 'base', 6),
    ],
    flavour: 'Spend it well.',
  },
];

export function uniqueDef(id: string): UniqueDef {
  const u = UNIQUES.find((x) => x.id === id);
  if (!u) throw new Error(`unknown unique ${id}`);
  return u;
}
