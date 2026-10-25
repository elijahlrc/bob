import type { Actor, CueKind, World } from './types';

/**
 * Tells for the renderer (docs/VFX-AUDIT.md): events only. Nothing here reads or writes sim state, rolls a number or changes a
 * timing, so a monster's threat is the same with or without them.
 */

/** A monster's support, ward or immunity did something at the monster, reaching `r` tiles. */
export function cue(
  w: World,
  kind: CueKind,
  a: Pick<Actor, 'id' | 'x' | 'y'>,
  r = 0,
  n?: number,
): void {
  w.events.push(
    n === undefined
      ? { t: 'cue', kind, id: a.id, x: a.x, y: a.y, r }
      : { t: 'cue', kind, id: a.id, x: a.x, y: a.y, r, n },
  );
}

/** A monster got its life back (a channel, a meal, a rite): green motes rise on it. */
export function healed(w: World, a: Pick<Actor, 'id'>, src?: Pick<Actor, 'id'>): void {
  w.events.push(src ? { t: 'heal', id: a.id, src: src.id } : { t: 'heal', id: a.id });
}
