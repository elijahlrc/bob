import { lifeCap, playerCtx } from './combat';
import type { Side } from './side';
import type { World } from './types';

/** The belt slot the tree's emergency-flask line speaks to: the last, which drinks at 15% (docs/ATTRITION.md). */
const EMERGENCY_SLOT = 4;
/** Below this share of life a life flask is drunk in an emergency (the tree's low-life flask line). */
const EMERGENCY_LIFE = 0.3;

/**
 * What a life flask drunk now recovers is multiplied by, from the tree's two emergency-flask lines
 * (docs/tree/design/F-flasks.md): more for the flask in the last belt slot, more for a flask drunk below 30% life.
 */
export function drinkLifeMult(w: World, side: Side, uid: number): number {
  const db = side.char.db;
  const ctx = playerCtx(w, side);
  let inc = 0;
  if (side.build.flasks[EMERGENCY_SLOT]?.uid === uid) inc += db.sum('inc', 'flaskLastSlotRecovery', ctx);
  const p = side.player;
  if (p.life < EMERGENCY_LIFE * lifeCap(p)) inc += db.sum('inc', 'flaskLowLifeRecovery', ctx);
  return 1 + inc / 100;
}
