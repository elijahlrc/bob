import { Character, sheetDps } from '../calc/character';
import type { Build } from '../data/types';
import { sheetOf } from './bot';
import type { RunState } from './run';

/**
 * The primary skill when the player has not starred one (docs/NEWPLAYER.md N4): the socketed skill that gives the most damage as
 * the main one, picked again whenever the gems change, so a new gem in an earlier slot never takes over from a stronger one.
 * A star the player set is kept as it is.
 */
export function settlePrimary(run: RunState, build: Build = run.build): Build {
  if (build.primaryGem !== undefined && !build.primaryAuto) return build;
  const ch = new Character(build);
  const uids = ch.actives
    .filter((a) => a.usable && !a.triggered && !a.skill.utility && a.gemUid !== null)
    .map((a) => a.gemUid as number);
  if (uids.length === 0) {
    if (build.primaryGem === undefined && !build.primaryAuto) return build;
    const { primaryGem: _p, primaryAuto: _a, ...rest } = build;
    return rest;
  }
  let best = uids[0];
  if (uids.length > 1) {
    let top = -Infinity;
    for (const uid of uids) {
      const dps = sheetDps(sheetOf(run, { ...build, primaryGem: uid, primaryAuto: true }));
      // A tie keeps the skill that was primary.
      if (dps > top + 1e-9 || (Math.abs(dps - top) <= 1e-9 && uid === build.primaryGem)) {
        top = dps;
        best = uid;
      }
    }
  }
  return build.primaryGem === best && build.primaryAuto
    ? build
    : { ...build, primaryGem: best, primaryAuto: true };
}
