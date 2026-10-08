import type { ThreatTag } from './monsterInfo';

/**
 * Attack shapes (docs/ROSTER.md section 5): how a monster type attacks, apart from how hard. A type with no shape strikes (a
 * melee hit, or one projectile, as before). The shapes are the player's own behaviours (a melee arc, a burst, a beam, a
 * projectile) set up for a monster by `monsterSkill`, and each draws a warning on the ground while it winds up, which the
 * character's auto-dodge reads (`sim/telegraph.ts`).
 */
export type ShapeId = 'strike' | 'swing' | 'slam' | 'lob' | 'salvo' | 'lance' | 'nova' | 'orb';

export type ZoneKindId = 'caustic' | 'burning' | 'chilling' | 'shocking';

export type ShapeSpec = {
  id: ShapeId;
  /** The share of the type's hit that each blow, arrow or burst deals (default 1). */
  mult?: number;
  /** Swing: the angle of the wedge, in degrees. */
  arc?: number;
  /** Swing: how far the wedge reaches. Slam, lob and nova: the radius of the circle. */
  radius?: number;
  /** Salvo: shots in all, fired one after another (two at most: an action repeats once). */
  count?: number;
  /** Lance: tiles it drags the character toward it, when the lane catches her. */
  pull?: number;
  /** Lance: the length and the width of the lane. */
  length?: number;
  width?: number;
  /** Lob: the zone it leaves, for how long, and its damage a second as a share of the type's hit. */
  zone?: ZoneKindId;
  /** What its zone is called on the cards, where it is not the kind's own (a web is a chilling pool that slows). */
  zoneName?: string;
  seconds?: number;
  dps?: number;
  /** Orb: the speed of the projectile as a share of an ordinary one. */
  speed?: number;
  /** Swing, slam, lob and lance: the share of the wind-up after which the aim is fixed and cannot be followed. */
  lock?: number;
};

const ZONE_NAMES: Record<ZoneKindId, string> = {
  caustic: 'caustic cloud',
  burning: 'patch of burning ground',
  chilling: 'chilling pool',
  shocking: 'shocking pool',
};

export type ShapeInfo = {
  name: string;
  /** The threat tag it counts towards (what the camp card says a map asks). */
  tag?: ThreatTag;
  /** One sentence for the cards. */
  text: (s: ShapeSpec) => string;
};

export const SHAPE_INFO: Record<ShapeId, ShapeInfo> = {
  strike: { name: 'Strike', text: () => 'A plain blow.' },
  swing: {
    name: 'Swing',
    tag: 'ground',
    text: (s) =>
      `A wide ${s.arc ?? 120}° swing in front of it, shown on the ground first: step out of the wedge.`,
  },
  slam: {
    name: 'Slam',
    tag: 'ground',
    text: (s) =>
      `Slams the ground where you stand, a ${s.radius ?? 2}-tile circle shown first: step out of it.`,
  },
  lob: {
    name: 'Lob',
    tag: 'ground',
    text: (s) =>
      `Lobs a ${s.zoneName ?? ZONE_NAMES[s.zone ?? 'caustic']} onto your feet, a ${s.radius ?? 1.6}-tile circle that lasts ${s.seconds ?? 4} s.`,
  },
  salvo: {
    name: 'Salvo',
    tag: 'salvos',
    text: (s) => `Looses ${s.count ?? 2} shots in quick succession.`,
  },
  lance: {
    name: 'Lance',
    tag: 'lanes',
    text: (s) =>
      s.pull
        ? `Marks a line on the ground, then strikes what is on it and drags it ${s.pull} tiles toward itself: step out of the lane.`
        : 'Marks a line on the ground, then strikes everything on it: step out of the lane.',
  },
  nova: {
    name: 'Nova',
    tag: 'ground',
    text: (s) =>
      `A ring ${s.radius ?? 2.5} tiles wide around it, shown first: stay out of reach or step away.`,
  },
  orb: {
    name: 'Orb',
    text: () => 'Casts a large, slow projectile that you can see coming.',
  },
};

/** The sentence a card says about a type's shape (none for a plain strike). */
export function shapeText(s: ShapeSpec | undefined): string | null {
  if (!s || s.id === 'strike') return null;
  return `${SHAPE_INFO[s.id].name}: ${SHAPE_INFO[s.id].text(s)}`;
}
