import { themeDef } from '../data/themes';
import { offerCharacter } from './bot';
import type { MapOffer } from './offers';
import { offerRewards, type OfferRewards } from './rewards';
import { affixesWithArmed } from './provisions';
import type { RunState } from './run';
import { themeInfo, weakestAxis, type ThemeInfo } from './themeInfo';

/** An offered map with what its card says about it. */
export type OfferPreview = MapOffer & {
  /** What the monsters are: factions, damage mix, types and tags (docs/ENEMIES.md 5.1); absent for a Respite. */
  info?: ThemeInfo;
  /** The resistance this map leans on hardest, in words, when one stands out. */
  weak?: string;
  /** What the map pays and how many monsters it holds, for comparing the offers (a map offer only). */
  rewards?: OfferRewards;
};

export function offersFor(run: RunState): OfferPreview[] {
  return run.offers.map((offer) => {
    // A Respite or a stop has no monsters: nothing to preview.
    if (offer.kind !== 'map') return { ...offer };
    // What is armed for the next map counts in everything the card says about it (docs/WAYSIDE.md 9.1).
    const affixes = affixesWithArmed(run, offer);
    const info = themeInfo(themeDef(offer.themeId), affixes, offer.type, offer.areaLevel);
    const weak = weakestAxis(offerCharacter(run, offer), info.mix) ?? undefined;
    const rewards = offerRewards(run, { ...offer, affixes });
    return { ...offer, info, weak, rewards };
  });
}
