import type { MonsterTypeId, Stance } from './monsters';
import type { ShapeSpec, ZoneKindId } from './shapes';

/**
 * Encounters (docs/ENCOUNTERS.md): what a monster does besides walk up and hit. Three kinds of data, by type, in the manner of
 * `data/abilities.ts`, so that `MONSTER_TYPES` stays the table of stats:
 *
 * - a **sidearm** (section 3): a second attack, used while the character is out of melee reach (a thrown spear, a lob of bile)
 *   or on a clock (a pattern of blasts);
 * - a **pattern** (section 4): a script of shaped, telegraphed blasts that a sidearm casts;
 * - a **window** (section 5): a telegraphed spell in which the monster cannot be hurt, or punishes being hit.
 *
 * The text of each is what the inspect card and the camp card say.
 */

/** How a thrown thing looks in flight (the renderer picks a sprite by it). */
export type ProjectileLook = 'spear' | 'boulder' | 'gobbet' | 'shade' | 'chain' | 'clot' | 'spore';

/** What a hit does to the character besides damage. */
export type HitEffect = 'hobble' | 'blind' | 'poison';

export const HIT_EFFECT_TEXT: Record<HitEffect, string> = {
  hobble: 'slows you',
  blind: 'blinds you',
  poison: 'poisons you',
};

// ---- Patterns ------------------------------------------------------------------------------------------------------

/** The shape of a blast on the ground: a circle, a strip, a wedge, or a ring that is safe inside. */
export type BlastShape = 'circle' | 'lane' | 'wedge' | 'donut';

export type PatternStep = {
  /** Seconds after the cast before its warning starts. */
  at: number;
  shape: BlastShape;
  /** Where it is placed from: the monster, or the place it aimed at when it cast. */
  from: 'self' | 'aim';
  /** Offset from `from`, in tiles, and its angle in degrees from the line of aim (so a pattern turns with the aim). */
  dist?: number;
  angle?: number;
  /** Circle and wedge: the radius. Donut: the outer radius (`inner` is the safe one). */
  radius?: number;
  inner?: number;
  /** Lane: its length (from the placed point, along `angle`) and width. Wedge: its full angle in degrees. */
  length?: number;
  width?: number;
  arc?: number;
  /** Seconds of warning before it lands (default 0.8). */
  warn?: number;
  /** Share of the type's hit (default 1). */
  mult?: number;
  /** Ground it leaves when it lands. */
  zone?: ZoneKindId;
  zoneSeconds?: number;
  /** Tiles it drags the character toward the caster when it catches it (a hook). */
  pull?: number;
};

export type PatternId =
  'march' | 'mortar' | 'cross' | 'tollWaves' | 'closingRing' | 'keening' | 'twinHooks' | 'volley';

export type PatternSpec = {
  id: PatternId;
  name: string;
  text: string;
  steps: PatternStep[];
  /** Leave one of the steps out at random (a gap to stand in), from this index on. */
  gapFrom?: number;
};

const ring = (n: number, dist: number, radius: number, at: number, mult: number) =>
  Array.from({ length: n }, (_, i): PatternStep => ({
    at,
    shape: 'circle',
    from: 'aim',
    dist,
    angle: (360 * i) / n,
    radius,
    mult,
  }));

export const PATTERNS: Record<PatternId, PatternSpec> = {
  march: {
    id: 'march',
    name: 'March',
    text: 'Blasts land one after another along the line toward you: step sideways, not back.',
    steps: [1.5, 3, 4.5, 6, 7.5].map((dist, i) => ({
      at: i * 0.22,
      shape: 'circle',
      from: 'self',
      dist,
      radius: 1.1,
      warn: 0.7,
      mult: 0.6,
    })),
  },
  mortar: {
    id: 'mortar',
    name: 'Mortar',
    text: 'Blasts fall all round you at once, with one gap: find it.',
    steps: [
      {
        at: 0,
        shape: 'circle',
        from: 'aim',
        radius: 1.2,
        mult: 0.5,
        zone: 'caustic',
        zoneSeconds: 2,
      },
      ...ring(6, 1.9, 1.1, 0, 0.5),
    ],
    gapFrom: 1,
  },
  cross: {
    id: 'cross',
    name: 'Cross',
    text: 'Four lanes in a cross from it, then the same turned: stand between the arms.',
    steps: [0, 90, 180, 270, 45, 135, 225, 315].map((angle, i) => ({
      at: i < 4 ? 0 : 0.9,
      shape: 'lane',
      from: 'self',
      angle,
      length: 9,
      width: 1.1,
      warn: 0.8,
      mult: 0.7,
    })),
  },
  tollWaves: {
    id: 'tollWaves',
    name: 'Toll waves',
    text: 'Three rings roll out from it, one after another: stand where the last one passed.',
    steps: [
      { at: 0, shape: 'circle', from: 'self', radius: 2.2, warn: 0.7, mult: 0.6 },
      { at: 0.6, shape: 'donut', from: 'self', inner: 2.2, radius: 4.2, warn: 0.7, mult: 0.6 },
      { at: 1.2, shape: 'donut', from: 'self', inner: 4.2, radius: 6.2, warn: 0.7, mult: 0.6 },
    ],
  },
  closingRing: {
    id: 'closingRing',
    name: 'Closing ring',
    text: 'A ring of fire round you, then the ground inside it: stay in, then step over the ashes.',
    steps: [
      {
        at: 0,
        shape: 'donut',
        from: 'aim',
        inner: 2.2,
        radius: 3.4,
        warn: 0.9,
        mult: 0.6,
      },
      { at: 1.0, shape: 'circle', from: 'aim', radius: 2.2, warn: 0.9, mult: 0.8 },
    ],
  },
  keening: {
    id: 'keening',
    name: 'Keening',
    text: 'A wail that strikes everything farther than 3 tiles from it: only close to it is safe.',
    steps: [{ at: 0, shape: 'donut', from: 'self', inner: 3, radius: 10, warn: 1.1, mult: 0.8 }],
  },
  twinHooks: {
    id: 'twinHooks',
    name: 'Twin hooks',
    text: 'Two hooked lanes either side of you; a hook that catches you drags you in.',
    steps: [-14, 14].map((angle) => ({
      at: 0,
      shape: 'lane',
      from: 'self',
      angle,
      length: 9,
      width: 1,
      warn: 0.8,
      mult: 0.6,
      pull: 2.5,
    })),
  },
  volley: {
    id: 'volley',
    name: 'Loosing call',
    text: 'On a call, the archers loose together down lanes shown on the ground.',
    steps: [{ at: 0, shape: 'lane', from: 'self', length: 10, width: 0.8, warn: 0.8, mult: 0.8 }],
  },
};

// ---- Sidearms ------------------------------------------------------------------------------------------------------

/**
 * A second attack (docs/ENCOUNTERS.md 3). It is used when the character is between `from` and `to` tiles away and in sight,
 * every `every` seconds (the first after a random part of it). A shape is one of `data/shapes.ts`; a pattern is cast as a
 * script of blasts; a ring is a burst of slow projectiles in every direction but one.
 */
export type SidearmSpec = {
  name: string;
  shape?: ShapeSpec;
  pattern?: PatternId;
  /** A ring of slow projectiles: how many, leaving out one gap. */
  ring?: number;
  every: number;
  from: number;
  to: number;
  /** The wind-up, seconds (default the type's attack time). */
  time?: number;
  /** The damage type, when it is not the type's own. */
  convert?: 'lightning' | 'cold' | 'fire' | 'chaos';
  effect?: HitEffect;
  /** Not used on maps below this level. */
  minLevel?: number;
  look?: ProjectileLook;
  /** The pose (default `throw` for a shape, `cast` for a pattern or a ring). */
  stance?: Stance;
};

export const TYPE_SIDEARMS: Partial<Record<MonsterTypeId, SidearmSpec>> = {
  warrior: {
    name: 'Bone spear',
    shape: { id: 'orb', speed: 0.55, mult: 0.9 },
    every: 8,
    from: 4,
    to: 9,
    time: 1.1,
    minLevel: 4,
    look: 'spear',
  },
  shambler: {
    name: 'Bile retch',
    shape: { id: 'lob', radius: 1.3, zone: 'caustic', seconds: 3, dps: 0.2, mult: 0.4, lock: 0.3 },
    every: 9,
    from: 3,
    to: 8,
    time: 1.2,
    convert: 'chaos',
  },
  mage: {
    name: 'March',
    pattern: 'march',
    every: 7,
    from: 2,
    to: 9,
    time: 1.2,
  },
  brute: {
    name: 'Stamp',
    shape: { id: 'slam', radius: 2, mult: 1.3, lock: 0.35 },
    every: 10,
    from: 3,
    to: 6,
    time: 1.4,
    minLevel: 10,
    stance: 'strike',
  },
  gorger: {
    name: 'Gobbet',
    shape: { id: 'orb', speed: 0.6, mult: 0.7 },
    every: 8,
    from: 3,
    to: 8,
    time: 1.1,
    convert: 'chaos',
    effect: 'poison',
    look: 'gobbet',
  },
  gloomstalker: {
    name: 'Shade',
    shape: { id: 'orb', speed: 0.5, mult: 0.5 },
    every: 10,
    from: 4,
    to: 10,
    time: 1,
    convert: 'cold',
    effect: 'blind',
    look: 'shade',
    stance: 'cast',
  },
  censer: {
    name: 'Coals',
    shape: { id: 'lob', radius: 1.4, zone: 'burning', seconds: 3, dps: 0.25, mult: 0.4, lock: 0.3 },
    every: 8,
    from: 3,
    to: 7,
    time: 1.2,
    convert: 'fire',
  },
  flagellant: {
    name: 'Lash',
    shape: { id: 'lance', length: 5, width: 0.8, mult: 0.8, lock: 0.5 },
    every: 5,
    from: 2.2,
    to: 5,
    time: 0.9,
    stance: 'lash',
  },
  golem: {
    name: 'Boulder',
    shape: { id: 'orb', speed: 0.45, mult: 1.2 },
    every: 9,
    from: 3,
    to: 10,
    time: 1.5,
    look: 'boulder',
  },
  cutpurse: {
    name: 'Burrs',
    shape: {
      id: 'lob',
      radius: 1.5,
      zone: 'chilling',
      zoneName: 'scatter of burrs that slows',
      seconds: 4,
      dps: 0.1,
      mult: 0.3,
      lock: 0.3,
    },
    every: 8,
    from: 3,
    to: 8,
    time: 0.9,
  },
  guard: {
    name: 'Weighted chain',
    shape: { id: 'orb', speed: 0.6, mult: 0.6 },
    every: 9,
    from: 3,
    to: 7,
    time: 1.2,
    effect: 'hobble',
    look: 'chain',
  },
  wrack: {
    name: 'Brine clot',
    shape: { id: 'orb', speed: 0.6, mult: 0.7 },
    every: 8,
    from: 3,
    to: 7,
    time: 1.1,
    convert: 'cold',
    effect: 'hobble',
    look: 'clot',
  },
  slagbrute: {
    name: 'Slag',
    shape: { id: 'lob', radius: 1.6, zone: 'burning', seconds: 4, dps: 0.2, mult: 0.5, lock: 0.3 },
    every: 9,
    from: 3,
    to: 8,
    time: 1.3,
    convert: 'fire',
  },
  handler: {
    name: 'Net',
    shape: {
      id: 'lob',
      radius: 1.4,
      zone: 'chilling',
      zoneName: 'net that slows',
      seconds: 3,
      dps: 0,
      mult: 0.2,
      lock: 0.3,
    },
    every: 9,
    from: 3,
    to: 8,
    time: 0.9,
  },
  // Patterns, on the ranged and support types: a second, bigger thing to read beside their bolt.
  spitter: { name: 'Mortar', pattern: 'mortar', every: 10, from: 3, to: 9, time: 1.4 },
  arbalest: { name: 'Cross', pattern: 'cross', every: 12, from: 0, to: 10, time: 1.5 },
  bell: { name: 'Toll waves', pattern: 'tollWaves', every: 9, from: 0, to: 6, time: 1.2 },
  pyrepriest: {
    name: 'Closing ring',
    pattern: 'closingRing',
    every: 10,
    from: 3,
    to: 9,
    time: 1.4,
  },
  wailer: { name: 'Keening', pattern: 'keening', every: 10, from: 0, to: 9, time: 1.2 },
  tidecaller: {
    name: 'Twin hooks',
    pattern: 'twinHooks',
    every: 11,
    from: 3,
    to: 9,
    time: 1.4,
  },
  nest: {
    name: 'Spore burst',
    shape: { id: 'orb', speed: 0.4, mult: 6 },
    ring: 9,
    every: 7,
    from: 0,
    to: 9,
    time: 1,
    convert: 'chaos',
    look: 'spore',
  },
};

// ---- Windows -------------------------------------------------------------------------------------------------------

export type WindowId = 'brace' | 'counter' | 'sanctuary';

export type WindowSpec = {
  id: WindowId;
  name: string;
  /** Seconds between windows (the first after a random part of it), how long one lasts, and the tell before it. */
  every: number;
  seconds: number;
  warn: number;
  /** It opens only when the character is this near. */
  near: number;
  text: string;
};

export const TYPE_WINDOWS: Partial<Record<MonsterTypeId, WindowSpec>> = {
  shieldbearer: {
    id: 'brace',
    name: 'Brace',
    every: 9,
    seconds: 2,
    warn: 0.35,
    near: 4,
    text: 'Plants its shield: for 2 s nothing that hits it from the front gets through. Hit it from the side, or let damage over time do the work.',
  },
  guard: {
    id: 'counter',
    name: 'Counter-stance',
    every: 9,
    seconds: 1.5,
    warn: 0.35,
    near: 3,
    text: 'Raises its blade: for 1.5 s every melee blow on it is answered by a heavy one. Strike from range, or wait.',
  },
  choirmaster: {
    id: 'sanctuary',
    name: 'Sanctuary',
    every: 12,
    seconds: 3,
    warn: 0.4,
    near: 9,
    text: 'Sings for 3 s: allies within 4 tiles take no hits while it does. A stun silences it, and it is not protected itself.',
  },
};

/** The half-angle of the front a Brace covers, radians (120° in all). */
export const BRACE_HALF = Math.PI / 3;
/** The reach of a Sanctuary, tiles. */
export const SANCTUARY_RANGE = 4;
/** A Counter-stance's answer: this share of the Guard's hit, and the least time between two answers. */
export const COUNTER_MULT = 1.5;
export const COUNTER_GAP = 0.35;

// ---- Modes ---------------------------------------------------------------------------------------------------------

/**
 * A mode (docs/ENCOUNTERS.md 5 and 6): what a monster does when it is hurt in a certain way, or a guard it carries. Each is
 * run by `sim/encounters.ts`; the numbers are here.
 */
export type ModeId =
  | 'aegis'
  | 'fade'
  | 'petrify'
  | 'coreVent'
  | 'quench'
  | 'gorged'
  | 'lastRites'
  | 'grieving'
  | 'riled'
  | 'molten'
  | 'brokenGuard';

export type ModeSpec = {
  id: ModeId;
  name: string;
  text: string;
  /** A share of its life: the threshold it acts at, or what it must take (in a burst, or of one damage type). */
  at?: number;
  share?: number;
  seconds?: number;
  cooldown?: number;
  /** More damage taken (a share) while it lasts; or less, when negative. */
  taken?: number;
  /** Slower by this share. */
  slow?: number;
  heal?: number;
  range?: number;
  hits?: number;
  max?: number;
  step?: number;
};

export const TYPE_MODES: Partial<Record<MonsterTypeId, ModeSpec[]>> = {
  sentinel: [
    {
      id: 'aegis',
      name: 'Aegis',
      max: 4,
      seconds: 5,
      text: 'Four plates turn aside the next four hits, however hard; they grow back when it has not been struck for 5 s. Many quick hits break it; one big one is wasted on it.',
    },
    {
      id: 'brokenGuard',
      name: 'Broken guard',
      seconds: 3,
      taken: 0.5,
      text: 'A stun breaks its guard: its plates fall and it takes 50% more damage for 3 s.',
    },
  ],
  shieldbearer: [
    {
      id: 'brokenGuard',
      name: 'Broken guard',
      seconds: 3,
      taken: 0.5,
      text: 'A stun breaks its guard: it drops its Brace and takes 50% more damage for 3 s.',
    },
  ],
  gloomstalker: [
    {
      id: 'fade',
      name: 'Fade',
      share: 0.25,
      seconds: 1.5,
      cooldown: 8,
      text: 'Hurt for a quarter of its life at once, it fades out of reach for 1.5 s and comes back behind you. Steady damage does better than one big blow.',
    },
  ],
  heap: [
    {
      id: 'petrify',
      name: 'Petrify',
      at: 0.4,
      seconds: 3,
      heal: 0.15,
      text: 'At 40% life it fuses to stone for 3 s: nothing hurts it, it mends 15%, then it bursts in a ring. Kill it past the mark in one go, or step out of the ring.',
    },
  ],
  golem: [
    {
      id: 'coreVent',
      name: 'Core vent',
      share: 0.3,
      seconds: 4,
      taken: 0.5,
      cooldown: 14,
      text: 'Hurt for 30% of its life at once, its core opens for 4 s: it takes 50% more damage, and casts a Cross of lanes twice.',
    },
  ],
  slagbrute: [
    {
      id: 'quench',
      name: 'Quench',
      share: 0.2,
      slow: 0.5,
      taken: 0.3,
      text: 'A fifth of its life lost to cold quenches it for good: half as fast, no burning trail, and 30% more physical damage taken.',
    },
  ],
  gorger: [
    {
      id: 'gorged',
      name: 'Gorged',
      seconds: 10,
      slow: 0.3,
      taken: -0.2,
      text: 'After it eats a body it swells for 10 s: slower, harder to hurt, and it bursts in a caustic cloud if it dies swollen.',
    },
  ],
  hag: [
    {
      id: 'lastRites',
      name: 'Last rites',
      at: 0.3,
      seconds: 3,
      range: 8,
      text: 'At 30% life it chants for 3 s, and every body within 8 tiles bursts when it ends. A stun or its death stops it.',
    },
  ],
  wailer: [
    {
      id: 'grieving',
      name: 'Grieving',
      range: 6,
      text: 'When an ally dies within 6 tiles it keens at once.',
    },
  ],
  boar: [
    {
      id: 'riled',
      name: 'Riled',
      hits: 6,
      cooldown: 8,
      text: 'Hit six times in quick succession, it charges at once.',
    },
  ],
  cinderling: [
    {
      id: 'molten',
      name: 'Molten',
      max: 5,
      step: 0.12,
      text: 'Fire does not hurt it: each fiery hit makes it bigger and 12% harder-hitting, five times at most.',
    },
  ],
};

/** The Bone Beetle's curl (a passive ability, docs/ENCOUNTERS.md 5): how long, and how much less physical damage. */
export const CURL_SECONDS = 2;
export const CURL_LESS = 0.9;

/** A type's mode of this id, if it has it. */
export function modeOf(type: MonsterTypeId, id: ModeId): ModeSpec | undefined {
  return TYPE_MODES[type]?.find((m) => m.id === id);
}

/** The Adaptive mod (docs/ENCOUNTERS.md 6): the share of its life from one element it takes before it resists it, by how much, and for how long. */
export const ADAPT_SHARE = 0.25;
export const ADAPT_RESIST = 50;
export const ADAPT_SECONDS = 6;

/** Whether a type has anything of this file (its actor carries the state for it). */
export function hasEncounter(type: MonsterTypeId): boolean {
  return !!TYPE_SIDEARMS[type] || !!TYPE_WINDOWS[type] || !!TYPE_MODES[type];
}

/** The lines the inspect card says about a type's sidearm, window and modes. */
export function encounterTexts(type: MonsterTypeId): string[] {
  const out: string[] = [];
  const s = TYPE_SIDEARMS[type];
  if (s) {
    const p = s.pattern ? PATTERNS[s.pattern] : null;
    const what = p ? p.text : sidearmText(s);
    out.push(`${s.name}: ${what}${s.effect ? ` It ${HIT_EFFECT_TEXT[s.effect]}.` : ''}`);
  }
  const w = TYPE_WINDOWS[type];
  if (w) out.push(`${w.name}: ${w.text}`);
  for (const m of TYPE_MODES[type] ?? []) out.push(`${m.name}: ${m.text}`);
  return out;
}

function sidearmText(s: SidearmSpec): string {
  const range = `from ${s.from} to ${s.to} tiles`;
  if (s.ring) return `Every ${s.every} s, a ring of ${s.ring} slow shots with one gap.`;
  switch (s.shape?.id) {
    case 'orb':
      return `Throws something slow you can see coming, ${range} away.`;
    case 'lob':
      return `Lobs ground that lingers onto your feet, ${range} away.`;
    case 'slam':
      return `Slams a ring where you stand, ${range} away.`;
    case 'lance':
      return `Strikes down a line shown on the ground, ${range} away.`;
    case 'salvo':
      return `Looses a quick pair of shots, ${range} away.`;
    default:
      return `An attack ${range} away.`;
  }
}
