import { mapTier, type MapTier } from '../data/difficulty';
import { offerNoise } from '../gen/population';
import { themeDef } from '../data/themes';
import { offerCharacter } from './bot';
import type { MapOffer } from './offers';
import type { RunState } from './run';
import { survivalRatio, threatPreview } from './threat';
import { themeInfo, weakestAxis, type ThemeInfo } from './themeInfo';

/** An offered map with what it means for this build. */
/** How the offer looks for this build next to a plain map at its level: a rough guide, never a promise. */
export type Verdict = 'comfortable' | 'close' | 'dangerous';

/** At or above this share of a plain map's survivability a map is comfortable; at or above the second, close. */
export const VERDICT_COMFORTABLE = 0.85;
export const VERDICT_CLOSE = 0.55;

export function verdictOf(ratio: number): Verdict {
  return ratio >= VERDICT_COMFORTABLE
    ? 'comfortable'
    : ratio >= VERDICT_CLOSE
      ? 'close'
      : 'dangerous';
}

export type OfferPreview = MapOffer & {
  /** Survivability next to a plain map, with the life you arrive with (a map offer only). */
  ratio?: number;
  verdict?: Verdict;
  /** Your DPS and effective HP on this map, as multiples of a plain map (the threat preview). */
  dps: number;
  ehp: number;
  /** How hard this map's own draw of the variance makes it; absent when the run has no variance (docs/ENEMIES.md 8.1). */
  tier?: MapTier;
  /** What the monsters are: factions, damage mix, types and tags (docs/ENEMIES.md 5.1); absent for a Respite. */
  info?: ThemeInfo;
  /** The resistance this map leans on hardest, in words, when one stands out. */
  weak?: string;
};

export function offersFor(run: RunState): OfferPreview[] {
  const mode = run.map % 10 === 0 ? 'boss' : 'clearing';
  return run.offers.map((offer) => {
    // A Respite has no monsters: nothing to preview.
    if (offer.kind === 'respite') return { ...offer, dps: 1, ehp: 1 };
    const p = threatPreview(
      offerCharacter(run, offer),
      themeDef(offer.themeId),
      mode,
      offer.affixes,
      offer.type,
    );
    const ratio = survivalRatio(
      offerCharacter(run, offer),
      themeDef(offer.themeId),
      mode,
      offer.affixes,
      offer.type,
      run.vitals.life,
      run.map,
    );
    const info = themeInfo(themeDef(offer.themeId), offer.affixes, offer.type, offer.areaLevel);
    const weak = weakestAxis(offerCharacter(run, offer), info.mix) ?? undefined;
    const tier = mapTier(run.difficulty, offerNoise(run.seed, offer.id)) ?? undefined;
    return { ...offer, dps: p.dps, ehp: p.ehp, ratio, verdict: verdictOf(ratio), tier, info, weak };
  });
}
