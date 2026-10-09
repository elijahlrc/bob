import { affixReward, mapAffixDef } from '../data/mapAffixes';
import { CRAWL_SEGMENTS, mapTypeDef } from '../data/mapTypes';
import { themeDef } from '../data/themes';
import type { MapOffer } from './offers';
import { planFor, type RunState } from './run';

/**
 * What an offered map pays and who is on it, in the same terms for every offer so that the cards can be set side by side.
 * The reward figures are fractions over a plain map of the same level (0.2 = +20%) and leave out the character's own gear,
 * which is the same on every offer; the counts are those of the map's actual monsters.
 */
export type OfferRewards = {
  /** Item quantity: the theme's, the affixes' and the type's together. */
  quantity: number;
  /** Item rarity (the theme's extra rare weight and the affixes', together). */
  rarity: number;
  experience: number;
  /** The monsters on the map, by rarity (a Crawl: all three maps). */
  monsters: { total: number; magic: number; rare: number; boss: number };
  /** Loot that is not a percentage: extra drops, chests and what the map type pays. */
  bonus: string[];
};

const cache = new Map<string, OfferRewards>();

function bonusOf(offer: MapOffer): string[] {
  const theme = themeDef(offer.themeId);
  const type = mapTypeDef(offer.type);
  const out: string[] = [];
  // A theme has one bonus; its text says which (the percentages are in the figures above).
  if (theme.extraChests || theme.extraEssence || theme.extraCurrency || theme.bonusCurrency)
    out.push(theme.bonusText);
  const currency = offer.affixes.reduce(
    (n, id) => n + (affixReward(mapAffixDef(id), offer.areaLevel).currency ?? 0),
    0,
  );
  if (currency) out.push(`+${Math.round(currency * 100)}% currency`);
  if (type.loot) out.push(type.loot);
  return out;
}

/** The rewards and monsters of an offered map (a Respite has none). The result is kept for the offer. */
export function offerRewards(run: RunState, offer: MapOffer): OfferRewards | undefined {
  if (offer.kind !== 'map') return undefined;
  const key = [
    run.seed,
    offer.id,
    offer.type,
    offer.themeId,
    offer.areaLevel,
    offer.affixes.join(','),
    JSON.stringify(run.difficulty),
  ].join('|');
  const hit = cache.get(key);
  if (hit) return hit;

  const theme = themeDef(offer.themeId);
  const type = mapTypeDef(offer.type);
  let affixQuantity = 0;
  let affixRarity = 0;
  let affixXp = 0;
  for (const id of offer.affixes) {
    const r = affixReward(mapAffixDef(id), offer.areaLevel);
    affixQuantity += r.quantity ?? 0;
    affixRarity += r.rarity ?? 0;
    affixXp += r.experience ?? 0;
  }
  const monsters = { total: 0, magic: 0, rare: 0, boss: 0 };
  const segments = offer.type === 'crawl' ? CRAWL_SEGMENTS : 1;
  for (let s = 0; s < segments; s++) {
    const pop = planFor(run, offer, s).pop;
    for (const m of [...pop.monsters, ...(pop.waves ?? []).flatMap((w) => w.monsters)]) {
      monsters.total++;
      const r = m.spec.rarity;
      if (r === 'magic') monsters.magic++;
      else if (r === 'rare') monsters.rare++;
      else if (r === 'miniboss' || r === 'boss') monsters.boss++;
    }
  }
  const out: OfferRewards = {
    quantity: (1 + theme.itemQuantity) * (1 + affixQuantity + (type.reward.quantity ?? 0)) - 1,
    rarity: theme.rareWeightMult * (1 + affixRarity + (type.reward.rarity ?? 0)) - 1,
    experience: theme.xpMult * (1 + affixXp + (type.reward.experience ?? 0)) - 1,
    monsters,
    bonus: bonusOf(offer),
  };
  if (cache.size > 96) cache.clear();
  cache.set(key, out);
  return out;
}
