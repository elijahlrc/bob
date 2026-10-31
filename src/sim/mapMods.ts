import { bossRelicMods } from '../calc/relics';
import { affixPlayerMods } from '../data/mapAffixes';
import type { Build } from '../data/types';
import type { MapPlan } from '../gen/mapPlan';
import type { Mod } from '../mods/types';

/**
 * What a map puts on the character: its affixes' player mods (provisions, curses and a blessing among them), and on a boss level
 * what a relic gives there (Bulwark Before the Throne, relic 15).
 */
export function mapPlayerMods(plan: MapPlan, build: Build, areaLevel: number): Mod[] {
  return [
    ...plan.affixes.flatMap((id) => affixPlayerMods(id, areaLevel)),
    ...(plan.endKind === 'boss' ? bossRelicMods(build) : []),
  ];
}
