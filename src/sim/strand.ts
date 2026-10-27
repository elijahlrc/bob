import { killActor } from './combat';
import type { World } from './types';

/** Seconds a monster may stand where the character cannot reach it before it is put down. */
export const STRAND_GRACE = 1.5;

/** Seconds the character may stand in a wall or off the map (a pull, a push, a blink that went wrong) before it is set down on floor. */
export const PLAYER_STRAND_GRACE = 0.5;

/**
 * The last resort for a monster that is out of reach (in a wall, or outside the map): a monster the character cannot get
 * at would keep the exit shut for ever. However it got there (a spawn, a push, a teleport), it is brought to the nearest
 * spot the character can reach and falls there, so that what it drops can be picked up. A flier or phaser may be over a
 * wall, but not off the map.
 */
export function tickStranded(w: World, dt: number): void {
  // A character that ends up in rock or outside the map is put on the nearest floor it can walk from, rather than left there
  // until the stuck timer carries it on.
  for (const s of w.sides) {
    const p = s.player;
    if (!p.alive) continue;
    if (w.grid.reachable(p.x, p.y)) {
      p.strandT = 0;
      continue;
    }
    p.strandT += dt;
    if (p.strandT < PLAYER_STRAND_GRACE) continue;
    const at = w.grid.nearestReachable(p.x, p.y);
    if (at) {
      p.x = at.x;
      p.y = at.y;
    }
    p.strandT = 0;
  }
  for (const a of w.actors) {
    if (a.isPlayer || !a.alive || a.team === 0) continue;
    const hovers = a.flies || a.phases;
    const out = a.x < 0 || a.y < 0 || a.x >= w.grid.w || a.y >= w.grid.h;
    if (hovers ? !out : w.grid.reachable(a.x, a.y)) {
      a.strandT = 0;
      continue;
    }
    a.strandT += dt;
    if (a.strandT < STRAND_GRACE) continue;
    const at = w.grid.nearestReachable(a.x, a.y);
    if (at) {
      a.x = at.x;
      a.y = at.y;
    }
    killActor(w, a);
  }
}
