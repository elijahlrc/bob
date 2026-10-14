import { mod } from '../mods/types';
import type { MapAffixDef } from './mapAffixes';

/**
 * Reprieves (docs/WAYSIDE.md section 7): the items that can change the end of a run. They are provisions of a third kind
 * (data/provisions.ts): carried in the pouch with the others (three of anything at most), never armed, always ready. One fires by
 * itself when damage would kill the character, refills its flasks so that it has a chance at the next level, and is used up.
 * Every name and text here is ours.
 *
 * A Retreat pulls the character out of the map as an abandon (the level is spent, the loot so far is kept); it does nothing on
 * a tenth map (a mini-boss or boss, where Abandon is not allowed either). A Revive keeps the character in the map.
 */
export type ReprieveFamily = 'retreat' | 'revive';
export type ReprieveId = 'ferryToken' | 'lastSpark' | 'bargainCoin';

export type ReprieveDef = {
  id: ReprieveId;
  name: string;
  family: ReprieveFamily;
  /** What it does, in a line. */
  text: string;
  /** Life after it fires, as a share of the maximum. */
  life: number;
  /** A Revive: seconds the character cannot be hurt afterwards. */
  invuln?: number;
  /** A Revive: monsters nearby are thrown back and stunned. */
  pulse?: boolean;
  /** The curse that starts when it fires (data below). */
  curse?: CurseId;
  /** Base price in Bone Dust before the level factor (data/sale.ts). */
  base: number;
  /** Weight among the Reprieves a stock or a pick draws. */
  weight: number;
  /** The first map it turns up on. */
  from: number;
};

export const REPRIEVES: ReprieveDef[] = [
  {
    id: 'ferryToken',
    name: 'Ferry Token',
    family: 'retreat',
    text: 'If you would die, you are pulled out of the map instead: the level is spent, you keep what you picked up, and all your flasks are refilled. Does nothing on a boss level.',
    life: 0.25,
    base: 125,
    weight: 40,
    from: 5,
  },
  {
    id: 'lastSpark',
    name: 'Last Spark',
    family: 'revive',
    text: 'If you would die, you rise at 35% life with all your flasks refilled, cannot be hurt for 3 seconds, and the monsters around you are thrown back and stunned.',
    life: 0.35,
    invuln: 3,
    pulse: true,
    base: 225,
    weight: 30,
    from: 5,
  },
  {
    id: 'bargainCoin',
    name: 'Bargain Coin',
    family: 'revive',
    text: 'If you would die, you rise at 50% life with all your flasks refilled and cannot be hurt for 1.5 seconds. Afterwards you carry a curse for five levels.',
    life: 0.5,
    invuln: 1.5,
    curse: 'bargain',
    base: 150,
    weight: 30,
    from: 5,
  },
];

export const reprieveDef = (id: string): ReprieveDef => {
  const d = REPRIEVES.find((r) => r.id === id);
  if (!d) throw new Error(`unknown reprieve ${id}`);
  return d;
};

/** The curse lasts this many levels. */
export const CURSE_LEVELS = 5;

// ---- Curses ------------------------------------------------------------------------------------

export type CurseId = 'bargain';

export type CurseDef = {
  id: CurseId;
  name: string;
  text: string;
  affix: Omit<MapAffixDef, 'id' | 'name' | 'text' | 'fixed' | 'chalkOnly'>;
};

export const CURSES: CurseDef[] = [
  {
    id: 'bargain',
    name: "Ferryman's Bargain",
    text: '15% less maximum life',
    affix: { playerMods: [mod('life', 'more', -15)], reward: {} },
  },
];

export const curseDef = (id: string): CurseDef => {
  const d = CURSES.find((c) => c.id === id);
  if (!d) throw new Error(`unknown curse ${id}`);
  return d;
};

export const curseAffixId = (id: string): string => `curse.${id}`;

/** The hidden map affixes that carry the curses (like the provisions': never rolled). */
export const CURSE_AFFIXES: MapAffixDef[] = CURSES.map((c) => ({
  id: curseAffixId(c.id),
  name: c.name,
  text: c.text,
  chalkOnly: true,
  fixed: true,
  ...c.affix,
}));
