import { Character } from '../calc/character';
import { themeDef } from '../data/themes';
import { cfgFor } from './bot';
import { affixesFor, type RunState } from './run';
import { threatPreview } from './threat';

/** One of the two maps offered at camp, with its affixes and what it means for this build. */
export type MapOffer = {
  themeId: string;
  affixes: string[];
  /** Your DPS and effective HP on this map, as multiples of a plain map (the threat preview). */
  dps: number;
  ehp: number;
};

export function offersFor(run: RunState): MapOffer[] {
  const ch = new Character(run.build, cfgFor(run));
  const mode = run.map % 10 === 0 ? 'boss' : 'clearing';
  return run.nextThemes.map((themeId) => {
    const affixes = affixesFor(run, themeId);
    const p = threatPreview(ch, themeDef(themeId), mode, affixes);
    return { themeId, affixes, dps: p.dps, ehp: p.ehp };
  });
}
