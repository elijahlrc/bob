import { themeDef } from '../data/themes';
import { offerCharacter } from './bot';
import type { MapOffer } from './offers';
import type { RunState } from './run';
import { threatPreview } from './threat';

/** An offered map with what it means for this build. */
export type OfferPreview = MapOffer & {
  /** Your DPS and effective HP on this map, as multiples of a plain map (the threat preview). */
  dps: number;
  ehp: number;
};

export function offersFor(run: RunState): OfferPreview[] {
  const mode = run.map % 10 === 0 ? 'boss' : 'clearing';
  return run.offers.map((offer) => {
    const p = threatPreview(
      offerCharacter(run, offer),
      themeDef(offer.themeId),
      mode,
      offer.affixes,
    );
    return { ...offer, dps: p.dps, ehp: p.ehp };
  });
}
