import type { MonsterTypeId } from '../../data/monsters';
import { MONSTER_TYPES } from '../../data/monsters';
import type { FigureKind, Role } from './figure';

/**
 * What a living (not bone) body is made of (docs/ROSTER.md 4.1): the roles each part of a flesh body is drawn in, by
 * faction and by type, so that a corpse of the Rot, a robed zealot of the Choir and a hired guard of the Gilded are built of
 * different things on the same rig. Roles are palette entries (`FACTION_PALETTE`), so the colours follow the faction.
 */
export type Garb = {
  /** The torso and the shoulders. */
  torso: Role;
  torsoShade: Role;
  /** The legs, trouser or bare, and the feet. */
  legs: Role;
  legsShade: Role;
  foot: Role;
  /** Sleeves or bare arms, and hands. */
  arms: Role;
  hands: Role;
  /** A skirt or a long coat that hides the legs, with its hem. */
  skirt?: Role;
  /** How far above the ground the hem hangs (the default is a unit). */
  hem?: number;
  /** Plate: the torso and limbs are metal, with a collar and pauldrons. */
  plate?: boolean;
  /** Eyes that glow (the dead) rather than look (the living). */
  glowEyes?: boolean;
  /** A bare head, or one with hair, in this role (the default is skin). */
  hair?: Role;
  /** A spectre's reach of arm (the default is 9 a segment), the length of its tail (1 is the default), and its looks. */
  reach?: number;
  tail?: number;
  /** Hair that streams behind a bare head instead of a hood. */
  streaming?: boolean;
  /** A tall pointed hood. */
  point?: boolean;
};

const ROT: Garb = {
  torso: 'skin',
  torsoShade: 'clothShade',
  legs: 'skin',
  legsShade: 'clothShade',
  foot: 'skin',
  arms: 'skin',
  hands: 'skin',
  glowEyes: true,
};
const CHOIR: Garb = {
  torso: 'cloth',
  torsoShade: 'clothShade',
  legs: 'dark',
  legsShade: 'dark',
  foot: 'dark',
  arms: 'cloth',
  hands: 'skin',
  skirt: 'cloth',
};
const GILDED: Garb = {
  torso: 'cloth',
  torsoShade: 'clothShade',
  legs: 'cloth',
  legsShade: 'clothShade',
  foot: 'dark',
  arms: 'cloth',
  hands: 'skin',
};
const KENNEL: Garb = {
  torso: 'clothShade',
  torsoShade: 'dark',
  legs: 'cloth',
  legsShade: 'clothShade',
  foot: 'dark',
  arms: 'clothShade',
  hands: 'skin',
};
/** The Emberborn are ash-grey and scorched: burnt cloth, grey skin, eyes like coals. */
const EMBERBORN: Garb = {
  torso: 'cloth',
  torsoShade: 'clothShade',
  legs: 'clothShade',
  legsShade: 'clothShade',
  foot: 'dark',
  arms: 'cloth',
  hands: 'skin',
  skirt: 'cloth',
  glowEyes: true,
};
/** The Drowned are sodden and pale: wet cloth, bluish skin, hands that have been in the water too long. */
const DROWNED: Garb = {
  torso: 'cloth',
  torsoShade: 'clothShade',
  legs: 'cloth',
  legsShade: 'clothShade',
  foot: 'clothShade',
  arms: 'cloth',
  hands: 'skin',
  glowEyes: true,
};
/** The Hollow hang in the air in hoods; their hands are the pale of their bone, their eyes glow. */
const HOLLOW: Garb = {
  torso: 'cloth',
  torsoShade: 'clothShade',
  legs: 'clothShade',
  legsShade: 'clothShade',
  foot: 'clothShade',
  arms: 'cloth',
  hands: 'bone',
  glowEyes: true,
};
/** Anything else that is drawn as a living body gets this (a type added without a garb of its own). */
const PLAIN: Garb = GILDED;

const OVERRIDE: Partial<Record<MonsterTypeId, Partial<Garb>>> = {
  // A Pyre Priest is armoured in ash-grey plate with its pauldrons, bare to the knee: no robe, so it is not a Hexer in red.
  pyrepriest: {
    skirt: undefined,
    plate: true,
    torso: 'metalShade',
    torsoShade: 'metal',
    arms: 'metalShade',
  },
  // A Tidecaller is a shade of the water: it hangs in the air like the Hollow, in the Drowned's colours.
  tidecaller: { ...HOLLOW, reach: 12.5, tail: 0.6 },
  // The Hollow differ by what they trail and how they reach: a stalker is all arm, a wailer all hair and tail, a wight tall.
  gloomstalker: { reach: 11.5, tail: 0.45 },
  wailer: { reach: 8, tail: 1.5, streaming: true },
  wight: { reach: 8, tail: 1, point: true },
  // The dead of the Rot are bare and torn; the Hag wears what is left of a robe.
  hag: { torso: 'clothShade', arms: 'clothShade', skirt: 'clothShade' },
  // A flagellant is bare-chested, in a loincloth.
  flagellant: {
    torso: 'skin',
    torsoShade: 'skin',
    arms: 'skin',
    skirt: undefined,
    legs: 'cloth',
    legsShade: 'cloth',
    foot: 'clothShade',
  },
  // A guard is in plate from collar to boot.
  guard: {
    torso: 'metal',
    torsoShade: 'metalShade',
    legs: 'metalShade',
    legsShade: 'metalShade',
    foot: 'metalShade',
    arms: 'metal',
    plate: true,
  },
  // A bursar is stooped in a clerk's long coat.
  bursar: { torso: 'clothShade', arms: 'clothShade', skirt: 'clothShade', hem: 9 },
  cutpurse: {
    torso: 'clothShade',
    arms: 'clothShade',
    legs: 'clothShade',
    legsShade: 'clothShade',
  },
};

const BY_FACTION: Partial<Record<string, Garb>> = {
  rot: ROT,
  hollow: HOLLOW,
  drowned: DROWNED,
  emberborn: EMBERBORN,
  choir: CHOIR,
  gilded: GILDED,
  kennel: KENNEL,
};

/**
 * What a living body carries in its near hand when it is not the weapon of its rig: null for nothing (the kit draws what it
 * holds: a book, a censer, a scourge), or the rig of the weapon to draw. A type not listed holds its rig's own.
 */
export const HELD: Partial<Record<MonsterTypeId, FigureKind | null>> = {
  shambler: null,
  bloater: null,
  spitter: null,
  hexer: null,
  censer: null,
  flagellant: null,
  choirmaster: null,
  bursar: null,
  slinger: null,
  handler: null,
  cutpurse: 'hero_dagger',
  wrack: null,
  pyrepriest: null,
};

/** The garb of a type: its faction's, with its own changes. */
export function garbOf(type: MonsterTypeId | undefined): Garb {
  if (!type) return PLAIN;
  const base = BY_FACTION[MONSTER_TYPES[type].faction] ?? PLAIN;
  return { ...base, ...OVERRIDE[type] };
}
