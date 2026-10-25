import { ELEMENT_COLOR } from '../../calc/skillLook';
import { WIGHT_SHELL } from '../../data/abilities';
import type { ModShape } from '../../data/monsterMarks';
import { shieldedByPylon } from '../../sim/factions';
import type { Actor, World } from '../../sim/types';

/**
 * The states a monster is in, as small pips above its affix pips (docs/VFX-AUDIT.md): buffed by an ally, spurred, in a fervour,
 * under a ward, one of a mirrored pair, curled up, shielded by a pylon, immune to an element. An affix is what a monster is; a
 * state is what is happening to it now, so these come and go. Read from the sim every frame, drawn by `MonsterMarks`.
 */

export type StatePip = { id: string; color: number; shape: ModShape };

/** An ally's aura, whistle or rally: speed and damage. */
export const BUFF_COLOR = 0xffb84a;
/** A Zealous spur and a Flagellant's fervour: damage. */
export const ZEAL_COLOR = 0xff5040;
export const FERVOUR_COLOR = 0xc01830;
/** An energy shield from a ward. */
export const WARD_COLOR = 0x9ad4ff;
/** One of a Mirrored pair. */
export const TWIN_COLOR = 0xa8ecff;
/** A curled beetle. */
export const CURL_COLOR = 0xc8a070;
/** Kept from harm by a pylon. */
export const PYLON_COLOR = 0xe8dca0;

const NONE: StatePip[] = [];

/** The element a Reliquarian is immune to now (1 lightning, 2 cold, 3 fire), or 0. */
export function immuneElement(a: Actor): number {
  if (!a.modIds.includes('reliquarian')) return 0;
  for (let i = 1; i < 4; i++) if (a.def.immune[i]) return i;
  return 0;
}

/** The pips of the states a living monster is in now (a shared empty list when it is in none). */
export function statePips(w: World, a: Actor): StatePip[] {
  if (a.isPlayer || !a.alive) return NONE;
  let out: StatePip[] | null = null;
  const add = (id: string, color: number, shape: ModShape): void => {
    (out ??= []).push({ id, color, shape });
  };
  const c = a.choir;
  if (c.buffT > 0) add('buff', BUFF_COLOR, 'triUp');
  if (c.zealT > 0) add('zeal', ZEAL_COLOR, 'triUp');
  if (c.fervour > 0) add('fervour', FERVOUR_COLOR, 'diamond');
  if (a.es > 0 && a.shellBy > 0) add('ward', WARD_COLOR, 'ring');
  if (a.mirror.id !== 0) add('twin', TWIN_COLOR, 'diamond');
  if (a.curlT > 0) add('curl', CURL_COLOR, 'square');
  if (w.hasPylons && shieldedByPylon(w, a)) add('pylon', PYLON_COLOR, 'square');
  const el = immuneElement(a);
  if (el > 0) add('immune', ELEMENT_COLOR[el], 'circle');
  return out ?? NONE;
}

/** The most energy shield a monster shows on its strip: its own, or the share a ward gives. */
export function shownMaxEs(a: Actor): number {
  return Math.max(a.def.maxEs, a.shellBy > 0 ? a.def.maxLife * WIGHT_SHELL : 0);
}
