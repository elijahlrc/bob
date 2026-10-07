/**
 * Hexes (EXPANSION 5.7): debuffs with an effect value, lasting 6 seconds and re-applied by their source. A target
 * holds at most as many of the player's hexes as the hex limit; the player holds one monster hex at a time.
 */
export type HexId = 'brittleDoom' | 'leadenLimbs' | 'feebleGrip' | 'openWounds';
export const HEX_IDS: HexId[] = ['brittleDoom', 'leadenLimbs', 'feebleGrip', 'openWounds'];

export const HEX_SECONDS = 6;
/** How many of the player's hexes a target holds at once, before items and the tree. */
export const BASE_HEX_LIMIT = 1;

export type HexDef = {
  id: HexId;
  name: string;
  /** The effect, in percent, at gem level 1 and level 20. */
  low: number;
  high: number;
  /** What the effect is, with a %. */
  text: string;
};

export const HEXES: Record<HexId, HexDef> = {
  brittleDoom: {
    id: 'brittleDoom',
    name: 'Brittle Doom',
    low: 20,
    high: 35,
    text: 'to all elemental resistances',
  },
  leadenLimbs: {
    id: 'leadenLimbs',
    name: 'Leaden Limbs',
    low: 15,
    high: 25,
    text: 'reduced action and movement speed',
  },
  feebleGrip: {
    id: 'feebleGrip',
    name: 'Feeble Grip',
    low: 15,
    high: 25,
    text: 'less damage dealt',
  },
  openWounds: {
    id: 'openWounds',
    name: 'Open Wounds',
    low: 20,
    high: 35,
    text: 'increased physical damage taken',
  },
};

/** The effect of a hex at a gem level, before curse effect: a straight line from level 1 to level 20. */
export function hexEffect(id: HexId, level: number): number {
  const h = HEXES[id];
  const t = Math.max(0, Math.min(1, (level - 1) / 19));
  return Math.round((h.low + (h.high - h.low) * t) * 10) / 10;
}

/** One line of the hex at a level, for gem cards and the inspect panel: "−20% to all elemental resistances". */
export function hexText(id: HexId, effect: number): string {
  const sign = id === 'brittleDoom' ? '−' : '';
  return `${sign}${Math.round(effect * 10) / 10}% ${HEXES[id].text}`;
}
