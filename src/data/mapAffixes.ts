import { mod, type Mod } from '../mods/types';
import { THRONG_AFFIX } from './mapTypes';

/**
 * Map affixes (EXPANSION 7.5, docs/MAPS.md section 6): from map 5 an offered map can carry modifiers that
 * change what you face, each paying a reward in return. They show on the map buttons, so the choice of map is
 * the choice of which danger to take for which loot.
 *
 * The numbers below are full strength. A map's affixes weaken early in the run (`affixStrength`): the values
 * scale by 0.5 on levels 5 to 29 and by 0.75 on levels 30 to 59. Flags do not scale. The text carries each
 * number that scales as `{n}`, which `affixText` fills in.
 */
export type MapAffixDef = {
  id: string;
  name: string;
  /** Plain words for the map button; `{n}` is a number that scales with the map's level band. */
  text: string;
  /** Mods added to every monster on the map. */
  monsterMods?: Mod[];
  /** Mods added to the player while on the map. */
  playerMods?: Mod[];
  extraRarePacks?: number;
  /** More monsters in every pack, as a fraction (0.25 = a quarter more). */
  packSize?: number;
  /** A larger share of magic monsters among the packs, as a fraction of today's share. */
  magicBonus?: number;
  /** What the affix adds to the map's rewards, as fractions (0.15 = +15%). */
  reward: { quantity?: number; rarity?: number; experience?: number; currency?: number };
  /** Two affixes of one group never share a map (the same stat, or the same element). */
  groups?: string[];
  /** What the threat model cannot read from the mods: a rough multiplier on how hard the map is. */
  pressure?: number;
  /** Never rolled at random; only added with Wayfinder's Chalk. */
  chalkOnly?: boolean;
  /** Not a map affix proper: part of a map type. Its strength does not follow the level band. */
  fixed?: boolean;
};

export const MAP_AFFIXES: MapAffixDef[] = [
  {
    id: 'noLeech',
    name: 'Bloodless',
    text: 'Monsters cannot be leeched from',
    monsterMods: [mod('cannotBeLeechedFrom', 'flag', 1)],
    reward: { quantity: 0.15 },
  },
  {
    id: 'lessRecovery',
    name: 'Draining',
    text: 'Players have {40}% less recovery (life, energy shield, leech and flasks)',
    playerMods: [
      mod('lifeRegen', 'more', -40),
      mod('esRechargeRate', 'more', -40),
      mod('flaskRecovery', 'more', -40),
      mod('leechRecovery', 'more', -40),
    ],
    reward: { quantity: 0.2 },
    pressure: 1.1,
  },
  {
    id: 'lessMaxRes',
    name: 'Eroding',
    text: 'Players have -{20}% to maximum resistances',
    playerMods: [mod('maxResist.allEle', 'base', -20), mod('maxResist.chaos', 'base', -20)],
    reward: { quantity: 0.25 },
  },
  {
    id: 'fireproof',
    name: 'Fireproof',
    text: 'Monsters have +{40}% fire resistance',
    monsterMods: [mod('resist.fire', 'base', 40)],
    reward: { quantity: 0.15 },
    groups: ['fire', 'monsterRes'],
  },
  {
    id: 'coldproof',
    name: 'Frostproof',
    text: 'Monsters have +{40}% cold resistance',
    monsterMods: [mod('resist.cold', 'base', 40)],
    reward: { quantity: 0.15 },
    groups: ['cold', 'monsterRes'],
  },
  {
    id: 'stormproof',
    name: 'Stormproof',
    text: 'Monsters have +{40}% lightning resistance',
    monsterMods: [mod('resist.lightning', 'base', 40)],
    reward: { quantity: 0.15 },
    groups: ['lightning', 'monsterRes'],
  },
  {
    id: 'extraChaos',
    name: 'Tainted',
    text: 'Monsters gain {30}% of their damage as extra chaos damage',
    monsterMods: [mod('gain.physical.chaos', 'base', 30)],
    reward: { quantity: 0.2 },
  },
  {
    id: 'noEvade',
    name: 'Keen',
    text: "Monsters' hits cannot be evaded",
    monsterMods: [mod('alwaysHit', 'flag', 1)],
    reward: { quantity: 0.15 },
    groups: ['accuracy'],
  },
  {
    id: 'moreLife',
    name: 'Hardy',
    text: 'Monsters have {40}% more life',
    monsterMods: [mod('life', 'more', 40)],
    reward: { quantity: 0.2 },
  },
  {
    id: 'moreDamage',
    name: 'Savage',
    text: 'Monsters deal {25}% more damage',
    monsterMods: [mod('damage', 'more', 25)],
    reward: { quantity: 0.2 },
  },
  {
    id: 'extraRares',
    name: 'Crowded',
    text: '+{2} rare packs',
    extraRarePacks: 2,
    reward: { rarity: 0.3 },
    groups: ['rarePacks'],
  },
  // Wave 2 (docs/MAPS.md 6.2): every row is built from stats the game already has.
  {
    id: 'swift',
    name: 'Swift',
    text: 'Monsters have {20}% increased movement, attack and cast speed',
    monsterMods: [
      mod('moveSpeed', 'inc', 20),
      mod('attackSpeed', 'inc', 20),
      mod('castSpeed', 'inc', 20),
    ],
    reward: { quantity: 0.15 },
  },
  {
    id: 'kindled',
    name: 'Kindled',
    text: 'Monsters gain {25}% of their damage as extra fire damage',
    monsterMods: [mod('gain.physical.fire', 'base', 25)],
    reward: { quantity: 0.15 },
    groups: ['fire'],
  },
  {
    id: 'rimed',
    name: 'Rimed',
    text: 'Monsters gain {25}% of their damage as extra cold damage',
    monsterMods: [mod('gain.physical.cold', 'base', 25)],
    reward: { quantity: 0.15 },
    groups: ['cold'],
  },
  {
    id: 'charged',
    name: 'Charged',
    text: 'Monsters gain {25}% of their damage as extra lightning damage',
    monsterMods: [mod('gain.physical.lightning', 'base', 25)],
    reward: { quantity: 0.15 },
    groups: ['lightning'],
  },
  {
    id: 'unyielding',
    name: 'Unyielding',
    text: 'Monsters cannot be stunned',
    monsterMods: [mod('cannotBeStunned', 'flag', 1)],
    reward: { quantity: 0.1 },
    pressure: 1.04,
  },
  {
    id: 'mending',
    name: 'Mending',
    text: 'Monsters regenerate {2}% of their life each second',
    monsterMods: [mod('lifeRegenPct', 'base', 2)],
    reward: { quantity: 0.15 },
    pressure: 1.1,
  },
  {
    id: 'warded',
    name: 'Warded',
    text: 'Monsters have +{20}% to all elemental resistances',
    monsterMods: [mod('resist.allEle', 'base', 20)],
    reward: { quantity: 0.2 },
    groups: ['monsterRes', 'fire', 'cold', 'lightning'],
  },
  {
    id: 'keenEyed',
    name: 'Keen-eyed',
    text: 'Monsters have {40}% increased accuracy',
    monsterMods: [mod('accuracy', 'inc', 40)],
    reward: { rarity: 0.15 },
    groups: ['accuracy'],
    pressure: 1.06,
  },
  {
    id: 'sharpened',
    name: 'Sharpened',
    text: 'Monsters have +{5}% critical strike chance and +{50}% critical strike multiplier',
    monsterMods: [mod('critChance', 'base', 5), mod('critMulti', 'base', 50)],
    reward: { rarity: 0.2 },
    pressure: 1.15,
  },
  {
    id: 'piercing',
    name: 'Piercing',
    text: 'Monsters penetrate {15}% of elemental resistances',
    monsterMods: [mod('penetration', 'base', 15, { damageTypes: ['fire', 'cold', 'lightning'] })],
    reward: { currency: 0.2 },
    pressure: 1.12,
  },
  {
    id: 'afflicting',
    name: 'Afflicting',
    text: "Monsters' hits have {20}% chance to ignite, freeze or shock",
    monsterMods: [
      mod('chance.ignite', 'base', 20),
      mod('chance.freeze', 'base', 20),
      mod('chance.shock', 'base', 20),
    ],
    reward: { currency: 0.15 },
    pressure: 1.08,
  },
  {
    id: 'teeming',
    name: 'Teeming',
    text: '+{25}% monsters',
    packSize: 0.25,
    reward: { experience: 0.1 },
    pressure: 1.12,
  },
  {
    id: 'eliteLaden',
    name: 'Elite-laden',
    text: '+{40}% magic monsters and +1 rare pack',
    extraRarePacks: 1,
    magicBonus: 0.4,
    reward: { rarity: 0.25 },
    groups: ['rarePacks'],
    pressure: 1.1,
  },
  {
    id: 'sluggish',
    name: 'Sluggish',
    text: 'Players have {15}% less movement speed',
    playerMods: [mod('moveSpeed', 'more', -15)],
    reward: { experience: 0.1 },
    pressure: 1.05,
  },
  {
    id: 'sundered',
    name: 'Sundered',
    text: 'Players have {35}% less armour and evasion',
    playerMods: [mod('armour', 'more', -35), mod('evasion', 'more', -35)],
    reward: { quantity: 0.2 },
  },
  {
    id: 'stifled',
    name: 'Stifled',
    text: 'Players have {30}% less area of effect',
    playerMods: [mod('aoe', 'more', -30)],
    reward: { experience: 0.15 },
    pressure: 1.04,
  },
  {
    id: 'dry',
    name: 'Dry',
    text: 'Players gain {40}% fewer flask charges',
    playerMods: [mod('flaskCharges', 'more', -40)],
    reward: { currency: 0.15 },
    pressure: 1.05,
  },
  {
    id: THRONG_AFFIX,
    name: 'Throng',
    text: 'A throng two and a half times the usual crowd, of weaker monsters',
    monsterMods: [mod('life', 'more', -40), mod('damage', 'more', -20)],
    packSize: 1.5,
    reward: {},
    chalkOnly: true,
    fixed: true,
  },
  {
    id: 'unguarded',
    name: 'Unguarded',
    text: 'Players have -{20}% chance to block attacks and spells',
    playerMods: [mod('blockAttack', 'base', -20), mod('blockSpell', 'base', -20)],
    reward: { quantity: 0.15 },
  },
];

export function mapAffixDef(id: string): MapAffixDef {
  const a = MAP_AFFIXES.find((x) => x.id === id);
  if (!a) throw new Error(`unknown map affix ${id}`);
  return a;
}

/** How much of its full value an affix has on a map of this level: the early maps are milder. */
export function affixStrength(level: number): number {
  return level < 30 ? 0.5 : level < 60 ? 0.75 : 1;
}

/** The strength of one affix on a map of this level (a map type's hidden affixes are always full). */
export function affixStrengthOf(id: string, level: number): number {
  return mapAffixDef(id).fixed ? 1 : affixStrength(level);
}

/** A number scaled by the band's strength, rounded; a value that would round to nothing stays at 1. */
export function scaleValue(value: number, strength: number): number {
  const v = Math.round(value * strength);
  return v === 0 && value !== 0 ? Math.sign(value) : v;
}

function scaleMods(mods: Mod[] | undefined, strength: number): Mod[] {
  return (mods ?? []).map((m) =>
    m.kind === 'flag' ? m : { ...m, value: scaleValue(m.value, strength) },
  );
}

/** The mods an affix gives every monster on a map of this level. */
export function affixMonsterMods(id: string, level: number): Mod[] {
  return scaleMods(mapAffixDef(id).monsterMods, affixStrengthOf(id, level));
}

/** The mods an affix gives the player on a map of this level. */
export function affixPlayerMods(id: string, level: number): Mod[] {
  return scaleMods(mapAffixDef(id).playerMods, affixStrengthOf(id, level));
}

/** Rare packs an affix adds on a map of this level (at least one). */
export function affixRarePacks(id: string, level: number): number {
  const n = mapAffixDef(id).extraRarePacks ?? 0;
  return n === 0 ? 0 : Math.max(1, scaleValue(n, affixStrengthOf(id, level)));
}

/** The affix's text with its numbers for a map of this level. */
export function affixText(a: MapAffixDef, level: number): string {
  const s = affixStrengthOf(a.id, level);
  return a.text.replace(/\{(\d+)\}/g, (_, n: string) => String(scaleValue(Number(n), s)));
}

/** What an affix adds to a map's rewards on this level, as fractions. */
export function affixReward(a: MapAffixDef, level: number): MapAffixDef['reward'] {
  const s = affixStrengthOf(a.id, level);
  const out: MapAffixDef['reward'] = {};
  for (const k of ['quantity', 'rarity', 'experience', 'currency'] as const)
    if (a.reward[k]) out[k] = a.reward[k]! * s;
  return out;
}

/** Whether two affixes may not share a map. */
export function affixesConflict(a: string, b: string): boolean {
  if (a === b) return true;
  const ga = mapAffixDef(a).groups ?? [];
  const gb = mapAffixDef(b).groups ?? [];
  return ga.some((g) => gb.includes(g));
}

/** "+15% item quantity", "+30% item rarity", "+10% experience", "+20% currency". */
export function rewardText(a: MapAffixDef, level = 100): string {
  const r = affixReward(a, level);
  const parts: string[] = [];
  if (r.quantity) parts.push(`+${Math.round(r.quantity * 100)}% item quantity`);
  if (r.rarity) parts.push(`+${Math.round(r.rarity * 100)}% item rarity`);
  if (r.experience) parts.push(`+${Math.round(r.experience * 100)}% experience`);
  if (r.currency) parts.push(`+${Math.round(r.currency * 100)}% currency`);
  return parts.join(', ');
}
