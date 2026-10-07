import { mod, type Mod } from '../mods/types';

/**
 * Map affixes (EXPANSION 7.5): from map 20 an offered map can carry modifiers that change what you
 * face, each paying a reward in return. They show on the map buttons, so the choice of map is the
 * choice of which danger to take for which loot.
 */
export type MapAffixDef = {
  id: string;
  name: string;
  /** Plain words for the map button. */
  text: string;
  /** Mods added to every monster on the map. */
  monsterMods?: Mod[];
  /** Mods added to the player while on the map. */
  playerMods?: Mod[];
  extraRarePacks?: number;
  /** What the affix adds to the map's loot, as fractions (0.15 = +15%). */
  reward: { quantity?: number; rarity?: number };
  /** Never rolled at random; only added with Wayfinder's Chalk. */
  chalkOnly?: boolean;
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
    text: 'Players have 40% less recovery (life, energy shield, leech and flasks)',
    playerMods: [
      mod('lifeRegen', 'more', -40),
      mod('esRechargeRate', 'more', -40),
      mod('flaskRecovery', 'more', -40),
      mod('leechRecovery', 'more', -40),
    ],
    reward: { quantity: 0.2 },
  },
  {
    id: 'lessMaxRes',
    name: 'Eroding',
    text: 'Players have -20% to maximum resistances',
    playerMods: [mod('maxResist.allEle', 'base', -20), mod('maxResist.chaos', 'base', -20)],
    reward: { quantity: 0.25 },
  },
  {
    id: 'fireproof',
    name: 'Fireproof',
    text: 'Monsters have +40% fire resistance',
    monsterMods: [mod('resist.fire', 'base', 40)],
    reward: { quantity: 0.15 },
  },
  {
    id: 'coldproof',
    name: 'Frostproof',
    text: 'Monsters have +40% cold resistance',
    monsterMods: [mod('resist.cold', 'base', 40)],
    reward: { quantity: 0.15 },
  },
  {
    id: 'stormproof',
    name: 'Stormproof',
    text: 'Monsters have +40% lightning resistance',
    monsterMods: [mod('resist.lightning', 'base', 40)],
    reward: { quantity: 0.15 },
  },
  {
    id: 'extraChaos',
    name: 'Tainted',
    text: 'Monsters gain 30% of their damage as extra chaos damage',
    monsterMods: [mod('gain.physical.chaos', 'base', 30)],
    reward: { quantity: 0.2 },
  },
  {
    id: 'noEvade',
    name: 'Keen',
    text: "Monsters' hits cannot be evaded",
    monsterMods: [mod('alwaysHit', 'flag', 1)],
    reward: { quantity: 0.15 },
  },
  {
    id: 'moreLife',
    name: 'Hardy',
    text: 'Monsters have 40% more life',
    monsterMods: [mod('life', 'more', 40)],
    reward: { quantity: 0.2 },
  },
  {
    id: 'moreDamage',
    name: 'Savage',
    text: 'Monsters deal 25% more damage',
    monsterMods: [mod('damage', 'more', 25)],
    reward: { quantity: 0.2 },
  },
  {
    id: 'extraRares',
    name: 'Crowded',
    text: '+2 rare packs',
    extraRarePacks: 2,
    reward: { rarity: 0.3 },
  },
];

export function mapAffixDef(id: string): MapAffixDef {
  const a = MAP_AFFIXES.find((x) => x.id === id);
  if (!a) throw new Error(`unknown map affix ${id}`);
  return a;
}

/** "+15% item quantity", "+30% item rarity". */
export function rewardText(a: MapAffixDef): string {
  const parts: string[] = [];
  if (a.reward.quantity) parts.push(`+${Math.round(a.reward.quantity * 100)}% item quantity`);
  if (a.reward.rarity) parts.push(`+${Math.round(a.reward.rarity * 100)}% item rarity`);
  return parts.join(', ');
}
