import type { MonsterTypeId } from '../../data/monsters';
import type { Prim, Role } from './figure';

/**
 * Kits (docs/ENEMIES.md 6.1): what a monster type adds to the humanoid body it is drawn on (a hood, a lantern, a
 * swollen belly) so that no two types share a silhouette. Primitives are in the same design space as the rig (feet at the
 * origin, up is -y); a kit draws in two layers, `back` before the torso and `front` after the head and the weapon.
 */
export type Anchors = {
  /** Head centre and skull radius. */
  hx: number;
  hy: number;
  skull: number;
  /** Shoulder line and hip. */
  shX: number;
  shY: number;
  hipX: number;
  hipY: number;
  /** The near hand and the angle the weapon points along. */
  hand: { x: number; y: number };
  wAng: number;
  legLen: number;
  /** The gait phase of the legs and the arm swing, for things that swing (a censer, a scourge). */
  swing: number;
  t: number;
};

type Out = Prim[];
const circ = (o: Out, x: number, y: number, r: number, role: Role) =>
  o.push({ k: 'circ', x, y, r, role });
const cap = (o: Out, x1: number, y1: number, x2: number, y2: number, r: number, role: Role) =>
  o.push({ k: 'cap', x1, y1, x2, y2, r, role });
const box = (o: Out, x: number, y: number, w: number, h: number, rot: number, role: Role) =>
  o.push({ k: 'box', x, y, w, h, rot, role });
const tri = (o: Out, pts: [number, number, number, number, number, number], role: Role) =>
  o.push({ k: 'tri', pts, role });

/** How a type changes the body before anything is drawn. */
export type KitAdjust = {
  /** Multiplies the body's scale (a wisp is a small flame of a thing). */
  scale?: number;
  /** Lowers the head and shoulders (a hunch). */
  hunch?: number;
};

const ADJUST: Partial<Record<MonsterTypeId, KitAdjust>> = {
  shambler: { hunch: 5 },
  gloomstalker: { scale: 1.05 },
  hag: { hunch: 4.5 },
  flagellant: { scale: 0.95 },
  censer: { scale: 1.05 },
  cutpurse: { scale: 0.85, hunch: 2 },
  bursar: { scale: 0.95, hunch: 3 },
  hexer: { scale: 1.05 },
  slinger: { scale: 0.9, hunch: 2 },
  handler: { scale: 1.06 },
  guard: { scale: 1.05 },
  gorger: { scale: 1.18 },
  choirmaster: { scale: 1.12 },
};

export function kitAdjust(type: MonsterTypeId | undefined): KitAdjust {
  return (type && ADJUST[type]) || {};
}

/** What is drawn behind the body. */
export function kitBack(type: MonsterTypeId | undefined, a: Anchors): Prim[] {
  const o: Out = [];
  switch (type) {
    case 'archer':
      // A quiver on the back with a few feathers.
      box(o, a.shX - 6, a.shY + 6, 4, 13, 0.3, 'wood');
      for (let i = 0; i < 3; i++)
        cap(o, a.shX - 7 + i * 1.4, a.shY - 1, a.shX - 6 + i * 1.4, a.shY - 4, 0.7, 'accent');
      break;
    case 'shambler':
      // Rags hanging off the shoulders.
      tri(o, [a.shX - 6, a.shY, a.shX + 5, a.shY, a.shX - 2, a.hipY + 8], 'clothShade');
      break;
    case 'hag':
      tri(
        o,
        [a.shX - 7, a.shY, a.shX + 6, a.shY, a.shX - 1, a.hipY + a.legLen * 1.4],
        'clothShade',
      );
      break;
    case 'censer':
    case 'choirmaster':
    case 'hexer':
      // A long robe to the ground.
      tri(
        o,
        [a.shX - 7, a.shY + 1, a.shX + 7, a.shY + 1, a.hipX, a.hipY + a.legLen * 1.9],
        'clothShade',
      );
      break;
    case 'cutpurse':
      // A short cloak.
      tri(o, [a.shX - 6, a.shY, a.shX + 4, a.shY, a.hipX - 6, a.hipY + 6], 'clothShade');
      break;
    case 'guard':
      // A gilded tabard.
      box(o, a.shX - 1, (a.shY + a.hipY) / 2, 9, a.hipY - a.shY, 0, 'accent');
      break;
    case 'bursar':
      tri(
        o,
        [a.shX - 7, a.shY + 1, a.shX + 7, a.shY + 1, a.hipX, a.hipY + a.legLen * 1.9],
        'cloth',
      );
      break;
    case 'handler':
      // A heavy coat.
      box(o, a.shX - 1, (a.shY + a.hipY) / 2 + 2, 11, a.hipY - a.shY + 4, 0, 'clothShade');
      break;
    case 'brute':
      break;
  }
  return o;
}

/** What is drawn on top: heads, hands and things worn in front. */
export function kitFront(type: MonsterTypeId | undefined, a: Anchors): Prim[] {
  const o: Out = [];
  const { hx, hy, skull: r } = a;
  switch (type) {
    case 'brute':
      // A horned helm.
      box(o, hx, hy - r * 0.55, r * 2.1, 3.2, 0, 'metalShade');
      tri(
        o,
        [hx - r * 0.9, hy - r * 0.55, hx - r * 1.4, hy - r * 1.9, hx - r * 0.4, hy - r * 0.55],
        'bone',
      );
      tri(
        o,
        [hx + r * 0.4, hy - r * 0.55, hx + r * 1.4, hy - r * 1.9, hx + r * 0.9, hy - r * 0.55],
        'bone',
      );
      break;
    case 'mage':
      // A small pointed cowl.
      tri(
        o,
        [hx - r, hy - r * 0.2, hx + r * 0.2, hy - r * 2.2, hx + r * 1.1, hy - r * 0.2],
        'clothShade',
      );
      break;
    case 'shieldbearer':
      // A tower shield and a visored helm.
      box(o, a.shX + 5, a.shY + 9, 11, 19, 0, 'metalShade');
      box(o, a.shX + 5, a.shY + 9, 8.5, 16, 0, 'metal');
      box(o, a.shX + 5, a.shY + 9, 2, 14, 0, 'accent');
      box(o, hx, hy - r * 0.45, r * 2.1, r * 0.9, 0, 'metalShade');
      break;
    case 'shambler':
      // Bloated, dripping.
      circ(o, a.hipX + 1, a.hipY - 4, 5, 'clothShade');
      circ(o, a.hipX + 3, a.hipY, 1.4, 'accent');
      circ(o, hx + 2, hy + r + 1, 1, 'accent');
      break;
    case 'hag':
      // A hood and a hooked nose.
      tri(o, [hx - r * 1.2, hy + r, hx, hy - r * 1.8, hx + r * 1.2, hy + r], 'clothShade');
      tri(
        o,
        [hx + r * 0.7, hy, hx + r * 1.9, hy + r * 0.5, hx + r * 0.6, hy + r * 0.6],
        'boneShade',
      );
      break;
    case 'gloomstalker':
      // Long clawed hands (the spectre body gives it the hood and the face).
      for (const d of [-1.4, 0, 1.4])
        cap(o, a.hand.x, a.hand.y, a.hand.x + 5 + d, a.hand.y + 7 + d * 1.5, 0.7, 'bone');
      break;
    case 'wailer':
      // An open, wailing mouth.
      box(o, hx + 1.5, hy + r * 0.75, 3, 5, 0, 'glow');
      break;
    case 'cutpurse':
      // A hood pulled low, a knife in the other hand and a fat purse at the belt.
      tri(
        o,
        [hx - r * 1.2, hy + r * 0.8, hx - 1, hy - r * 1.7, hx + r * 1.2, hy + r * 0.8],
        'clothShade',
      );
      circ(o, hx + 2.4, hy + 0.4, 1.1, 'eye');
      circ(o, a.hipX + 4, a.hipY + 1, 3, 'accent');
      cap(o, a.hipX + 4, a.hipY - 2, a.hipX + 4, a.hipY - 3.5, 0.6, 'dark');
      break;
    case 'guard':
      // A gilded helm with a crest, and a coin on the chest.
      box(o, hx, hy - r * 0.55, r * 2.2, 3.6, 0, 'metalShade');
      box(o, hx, hy - r * 1.1, 2.4, r * 1.6, 0, 'accent');
      circ(o, a.shX, a.shY + 8, 2.6, 'accent');
      break;
    case 'bursar':
      // Round spectacles, a flat cap and a ledger.
      circ(o, hx + 0.2, hy - 0.4, 2.6, 'metal');
      circ(o, hx + 0.2, hy - 0.4, 1.6, 'dark');
      box(o, hx, hy - r * 0.95, r * 2.2, 2.6, 0, 'clothShade');
      box(o, a.hand.x + 2, a.hand.y, 6.5, 8, 0.2, 'accent');
      box(o, a.hand.x + 2, a.hand.y, 5, 6.5, 0.2, 'bone');
      break;
    case 'handler':
      // A wide hat, and a coiled lead over the shoulder.
      box(o, hx, hy - r * 0.8, r * 3, 1.8, 0, 'wood');
      box(o, hx, hy - r * 1.3, r * 1.6, r * 1.2, 0, 'wood');
      circ(o, a.shX + 5, a.shY + 4, 3.4, 'accent');
      circ(o, a.shX + 5, a.shY + 4, 2, 'dark');
      break;
    case 'slinger':
      // A flat cap, a sling and a pouch of stones.
      box(o, hx, hy - r * 0.9, r * 2.4, 2.4, 0, 'clothShade');
      cap(o, a.hand.x, a.hand.y, a.hand.x - 4, a.hand.y + 7, 0.4, 'wood');
      circ(o, a.hand.x - 4, a.hand.y + 8, 1.8, 'accent');
      circ(o, a.hipX - 4, a.hipY, 2.6, 'accent');
      break;
    case 'wight':
      // A hanging lantern.
      cap(o, a.hand.x, a.hand.y, a.hand.x, a.hand.y + 6, 0.5, 'metalShade');
      box(o, a.hand.x, a.hand.y + 8.5, 5, 6, 0, 'metalShade');
      circ(o, a.hand.x, a.hand.y + 8.5, 2.6, 'glow');
      break;
    case 'hexer':
      // A tall hood and a book of curses.
      tri(
        o,
        [hx - r * 1.1, hy + r * 0.8, hx - 1, hy - r * 2.7, hx + r * 1.1, hy + r * 0.8],
        'cloth',
      );
      box(o, a.hand.x + 2, a.hand.y, 6, 8, 0.3, 'accent');
      box(o, a.hand.x + 2, a.hand.y, 4.6, 6.6, 0.3, 'bone');
      break;
    case 'censer': {
      // A censer on a chain, swinging, with its smoke.
      const sw = Math.sin(a.t * Math.PI * 2) * 3 + a.swing * 3;
      cap(o, a.hand.x, a.hand.y, a.hand.x + sw, a.hand.y + 9, 0.5, 'metalShade');
      circ(o, a.hand.x + sw, a.hand.y + 11, 3.2, 'metal');
      circ(o, a.hand.x + sw, a.hand.y + 11, 1.6, 'accent');
      circ(o, a.hand.x + sw * 1.4, a.hand.y + 4, 1.6, 'glow');
      break;
    }
    case 'flagellant':
      // A bare, scarred chest and a scourge of three lashes.
      box(o, a.shX, a.shY + 6, 11, 8, 0, 'skin');
      cap(o, a.shX - 3, a.shY + 5, a.shX + 2, a.shY + 9, 0.6, 'accent');
      for (let i = -1; i <= 1; i++)
        cap(
          o,
          a.hand.x,
          a.hand.y,
          a.hand.x + 8 + i * 2,
          a.hand.y + 5 + i * 3 + a.swing * 2,
          0.6,
          'accent',
        );
      break;
    case 'choirmaster':
      // A tall mitre and a raised, ringed hand.
      tri(o, [hx - r * 0.9, hy - r * 0.5, hx, hy - r * 3, hx + r * 0.9, hy - r * 0.5], 'accent');
      box(o, hx, hy - r * 0.6, r * 2.1, 2.2, 0, 'bone');
      circ(o, a.hand.x, a.hand.y, 2.2, 'accent');
      break;
  }
  return o;
}
