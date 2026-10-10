import type { Build, Item } from '../data/types';
import { THEFT_RES } from '../data/bosses';
import { mod, type Mod } from '../mods/types';
import type { World } from './types';

/**
 * What the Unmaker holds of the character (docs/BOSSES.md 9): a resistance cut, its best defence halved, the main skill's two
 * strongest supports, its flasks. The character is rebuilt with these, as it is with charges and trophies
 * (`characterWith`), and rebuilt again when a shard is broken.
 */
export type Theft = {
  /** The element whose resistance was cut (1 lightning, 2 cold, 3 fire). */
  res?: 1 | 2 | 3;
  defence?: 'armour' | 'evasion' | 'es' | 'block';
  /** The uids of the support gems taken. */
  supports?: number[];
  flasks?: boolean;
};

const thefts = new WeakMap<World, Theft>();

export function theftOf(w: World): Theft {
  return thefts.get(w) ?? {};
}

export function setTheft(w: World, t: Theft): void {
  thefts.set(w, t);
}

const RES_STAT = ['', 'resist.lightning', 'resist.cold', 'resist.fire'];
const DEFENCE_STAT = {
  armour: 'armour',
  evasion: 'evasion',
  es: 'es',
  block: 'blockAttack',
} as const;

/** What tells one held set of pieces from another (the character cache is keyed by it). */
export function theftKey(w: World): string {
  const t = thefts.get(w);
  if (!t) return '';
  return `${t.res ?? ''}.${t.defence ?? ''}.${(t.supports ?? []).join('-')}`;
}

/** The mods of what is held: a resistance cut by 50, a defence halved. */
export function theftMods(w: World): Mod[] {
  const t = thefts.get(w);
  if (!t) return [];
  const out: Mod[] = [];
  if (t.res) out.push(mod(RES_STAT[t.res], 'base', -THEFT_RES));
  if (t.defence) out.push(mod(DEFENCE_STAT[t.defence], 'more', -50));
  return out;
}

/** The build without the support gems that are held. */
export function theftBuild(w: World, b: Build): Build {
  const gone = thefts.get(w)?.supports;
  if (!gone?.length) return b;
  const equipment: Build['equipment'] = {};
  for (const [slot, it] of Object.entries(b.equipment) as [keyof Build['equipment'], Item][])
    equipment[slot] = it.sockets.some((g) => g && gone.includes(g.uid))
      ? { ...it, sockets: it.sockets.map((g) => (g && gone.includes(g.uid) ? null : g)) }
      : it;
  return { ...b, equipment };
}

/** Whether the character's flasks are held (none can be drunk). */
export const flasksSealed = (w: World): boolean => !!thefts.get(w)?.flasks;
