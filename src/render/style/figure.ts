import {
  MONSTER_TYPES,
  bodyStyleOf,
  type BodyStyle,
  type MonsterTypeId,
  type Stance,
} from '../../data/monsters';
import { HELD, garbOf } from './bodies';
import { kitAdjust, kitBack, kitFront, type Anchors } from './kits';
/**
 * Style-independent character rig. A figure is a list of primitives in a local design space
 * (origin at the feet, +x right, -y up, ~48 units tall for a person). Each visual style rasterises the
 * same primitives with its own technique (pixels, flat cel shapes, jittered ink) so all three share
 * one set of poses and animations.
 */

export type Role =
  | 'bone'
  | 'boneShade'
  | 'dark'
  | 'cloth'
  | 'clothShade'
  | 'accent'
  | 'metal'
  | 'metalShade'
  | 'wood'
  | 'skin'
  | 'glow'
  | 'eye';

export type Prim =
  | { k: 'circ'; x: number; y: number; r: number; role: Role }
  | { k: 'cap'; x1: number; y1: number; x2: number; y2: number; r: number; role: Role }
  | { k: 'box'; x: number; y: number; w: number; h: number; rot: number; role: Role }
  | { k: 'tri'; pts: [number, number, number, number, number, number]; role: Role };

export type FigureKind =
  | 'warrior'
  | 'brute'
  | 'archer'
  | 'mage'
  | 'boss'
  // Creature rigs of the Swarm and the Reliquary (EXPANSION 7.3): not built on the skeleton.
  | 'gnawer'
  | 'bat'
  | 'beetle'
  | 'nest'
  | 'sentinel'
  | 'arbalest'
  | 'golem'
  | 'pylon'
  // The Kennel: beasts on four legs.
  | 'hound'
  | 'boar'
  | 'cat'
  // The Rot and the Hollow: a swollen corpse, a toad and a drifting flame.
  | 'bloat'
  | 'toad'
  | 'orb'
  // Additions to the factions that exist (docs/ROSTER.md 7.1).
  | 'crawler'
  | 'heap'
  | 'bell'
  | 'spider'
  | 'chest'
  | 'hero_mace'
  | 'hero_sword'
  | 'hero_bow'
  | 'hero_wand'
  | 'hero_dagger';

export type AnimName = 'idle' | 'walk' | 'attack' | 'stun' | 'death';

export type Pose = {
  bob: number;
  lean: number;
  legA: number;
  legB: number;
  armA: number;
  armB: number;
  weapon: number;
  head: number;
  /** Whole-figure rotation around the feet (death). */
  rot: number;
  /** 0..1: bones drift apart (death collapse). */
  scatter: number;
  /** How far the bow is drawn / the staff glows, 0..1. */
  charge: number;
  /** 0..1: the figure shrinks away (a spectre unravelling). */
  fade: number;
};

export const FIGURE_HEIGHT = 48;

const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export function isRanged(kind: FigureKind): boolean {
  return kind === 'archer' || kind === 'hero_bow';
}
export function isCaster(kind: FigureKind): boolean {
  return kind === 'mage' || kind === 'hero_wand';
}

/** The pose family a body implies: a bow for the archer rigs, a cast for the mage rigs, a strike for the rest. */
export function stanceOfKind(kind: FigureKind): Stance {
  return isRanged(kind) ? 'bow' : isCaster(kind) ? 'cast' : 'strike';
}

/** The pose family of a monster type on a body: its own, or the one the body implies. */
export function stanceFor(type: MonsterTypeId | undefined, kind: FigureKind): Stance {
  return (type && MONSTER_TYPES[type].stance) || stanceOfKind(kind);
}

/** What a body is made of: heroes and the creature rigs have no style of their own (bone is the default of the pose). */
export function styleFor(type: MonsterTypeId | undefined, kind: FigureKind): BodyStyle {
  return isHero(kind) || CREATURES.has(kind) ? 'bone' : bodyStyleOf(type);
}

/** The pose of a monster type in an animation: its body, its stance and its style together. */
export function poseForType(id: MonsterTypeId, anim: AnimName, t: number): Pose {
  const body = MONSTER_TYPES[id].body;
  return poseFor(body, anim, t, stanceFor(id, body), styleFor(id, body));
}

/** Pose for an animation at normalised time `t` (walk/idle loop 0..1; attack and death run 0..1). */
export function poseFor(
  kind: FigureKind,
  anim: AnimName,
  t: number,
  stance: Stance = stanceOfKind(kind),
  style: BodyStyle = 'bone',
): Pose {
  const p: Pose = {
    bob: 0,
    lean: 0,
    legA: 0,
    legB: 0,
    armA: 0.25,
    armB: -0.25,
    weapon: 0.2,
    head: 0,
    rot: 0,
    scatter: 0,
    charge: 0,
    fade: 0,
  };
  const TAU = Math.PI * 2;
  switch (anim) {
    case 'idle': {
      p.bob = Math.sin(t * TAU) * 0.8;
      p.armA = 0.2 + Math.sin(t * TAU) * 0.08;
      p.armB = -0.2 - Math.sin(t * TAU) * 0.08;
      p.head = Math.sin(t * TAU + 1) * 0.05;
      p.legA = 0.08;
      p.legB = -0.08;
      if (style === 'spectre') {
        // Hangs in the air: a slow bob, the arms drifting, the tail swaying (legA is the sway of a body with no legs).
        p.bob = Math.sin(t * TAU) * 1.6;
        p.armA = 0.4 + Math.sin(t * TAU) * 0.15;
        p.armB = -0.4 - Math.sin(t * TAU) * 0.15;
        p.legA = Math.sin(t * TAU) * 0.35;
        p.legB = 0;
      }
      break;
    }
    case 'walk': {
      const s = Math.sin(t * TAU);
      p.legA = s * 0.75;
      p.legB = -s * 0.75;
      p.bob = -Math.abs(Math.cos(t * TAU)) * 2;
      p.armA = -s * 0.55;
      p.armB = s * 0.55;
      p.lean = 1;
      p.weapon = 0.3 + s * 0.15;
      p.head = Math.sin(t * TAU * 2) * 0.04;
      if (style === 'flesh') {
        // A living body: a shorter bounce, arms that hang and swing less, a head that rolls with the step.
        p.bob = -Math.abs(Math.cos(t * TAU)) * 1.5;
        p.armA = -s * 0.4;
        p.armB = s * 0.4;
        p.lean = 1.4;
        p.head = Math.sin(t * TAU * 2) * 0.07;
      } else if (style === 'spectre') {
        // Glides: no steps, a float that rises and sinks once a cycle, the tail streaming behind.
        p.legA = s * 0.6;
        p.legB = 0;
        p.bob = Math.sin(t * TAU) * 1.8;
        p.armA = -0.5 + s * 0.2;
        p.armB = 0.5 - s * 0.2;
        p.lean = 2.2;
        p.head = 0;
      }
      break;
    }
    case 'attack': {
      // Anticipation (0-0.4), strike (0.4-0.6), follow-through and recovery (0.6-1).
      const wind = ease(clamp01(t / 0.4));
      const strike = ease(clamp01((t - 0.4) / 0.2));
      const rec = ease(clamp01((t - 0.6) / 0.4));
      if (stance === 'bow') {
        p.charge = wind * (1 - strike);
        p.armA = lerp(0.2, 1.5, wind) * (1 - strike) + 1.55 * strike;
        p.armB = lerp(-0.2, -1.2, wind) * (1 - strike) + lerp(-0.1, -0.3, strike) * strike;
        p.lean = lerp(0, -1.5, wind) * (1 - strike) + 0.5 * strike;
        p.weapon = 0;
        p.legA = 0.3;
        p.legB = -0.35;
        p.armA = lerp(p.armA, 0.25, rec);
        p.armB = lerp(p.armB, -0.25, rec);
      } else if (stance === 'throw') {
        // Overhand: the arm goes back and up, then over, with the weight thrown forward.
        p.armA = lerp(0.2, -2.7, wind) * (1 - strike) + 1.7 * strike;
        p.armB = lerp(-0.2, 0.7, wind) * (1 - strike) - 0.4 * strike;
        p.weapon = 0.2;
        p.lean = lerp(0, -2.5, wind) * (1 - strike) + 4 * strike;
        p.legA = 0.3 * strike;
        p.legB = -0.2 * strike;
        p.bob = -wind * 1.2 * (1 - strike);
        p.armA = lerp(p.armA, 0.25, rec);
        p.lean = lerp(p.lean, 0, rec);
        p.charge = wind * (1 - strike);
      } else if (stance === 'cast') {
        p.charge = wind * (1 - rec * 0.5);
        p.armA = lerp(0.2, -1.9, wind) * (1 - strike) + 1.35 * strike;
        p.armB = lerp(-0.2, -1.1, wind) * (1 - strike) - 0.4 * strike;
        p.weapon = lerp(0.2, -0.6, wind) * (1 - strike) + 0.5 * strike;
        p.lean = lerp(0, -2, wind) * (1 - strike) + 2.5 * strike;
        p.bob = -wind * 1.5 * (1 - strike);
        p.armA = lerp(p.armA, 0.25, rec);
        p.weapon = lerp(p.weapon, 0.2, rec);
        p.legA = 0.15;
        p.legB = -0.2;
      } else {
        const stab = kind === 'hero_dagger';
        p.armA = lerp(0.2, stab ? 0.2 : -2.3, wind) * (1 - strike) + (stab ? 1.5 : 1.0) * strike;
        p.weapon = lerp(0.2, stab ? 0.4 : -1.9, wind) * (1 - strike) + (stab ? 1.4 : 1.4) * strike;
        p.lean = lerp(0, stab ? -2 : -3, wind) * (1 - strike) + (stab ? 6 : 5) * strike;
        p.armB = lerp(-0.2, 0.6, wind) * (1 - strike) - 0.5 * strike;
        p.armA = lerp(p.armA, 0.25, rec);
        p.weapon = lerp(p.weapon, 0.2, rec);
        p.lean = lerp(p.lean, 0, rec);
        p.legA = 0.5 * strike;
        p.legB = -0.3 * strike;
        p.bob = strike * -1;
      }
      break;
    }
    case 'stun': {
      const w = Math.sin(t * TAU * 3);
      p.head = w * 0.35;
      p.lean = w * 2;
      p.armA = 0.6 + w * 0.2;
      p.armB = -0.6 - w * 0.2;
      p.bob = 1;
      p.legA = 0.15;
      p.legB = -0.15;
      break;
    }
    case 'death': {
      const e = ease(clamp01(t / 0.7));
      p.rot = -e * 1.5;
      p.bob = e * 4;
      p.scatter = ease(clamp01((t - 0.3) / 0.7));
      p.armA = 0.6 * e;
      p.armB = -0.8 * e;
      p.legA = 0.4 * e;
      p.legB = -0.2 * e;
      p.head = e * 0.6;
      p.lean = -e * 3;
      if (style === 'flesh') p.scatter = 0;
      else if (style === 'spectre') {
        // Unravels: the pieces drift apart and shrink, and nothing is left on the floor.
        p.rot = -e * 0.5;
        p.bob = e * 2;
        p.fade = ease(clamp01((t - 0.15) / 0.85));
        p.scatter = p.fade;
      }
      break;
    }
  }
  return rigPose(kind, anim, t, p);
}

/**
 * The gaits and deaths of the rigs that are not a person (docs/ROSTER.md 4.4): a bloat waddles and deflates, a toad hops and
 * flattens, an orb drifts on a curve and pops. They read the same pose numbers as the other creatures; only the values
 * differ, so a rig's gait is one place to change.
 */
function rigPose(kind: FigureKind, anim: AnimName, t: number, p: Pose): Pose {
  const TAU = Math.PI * 2;
  const s = Math.sin(t * TAU);
  switch (kind) {
    case 'bloat':
      if (anim === 'idle') {
        p.bob = s * 0.6;
        p.legA = 0.05;
        p.legB = -0.05;
        p.lean = 0;
      } else if (anim === 'walk') {
        p.legA = s * 0.45;
        p.legB = -s * 0.45;
        p.bob = -Math.abs(Math.cos(t * TAU)) * 1;
        p.lean = s * 1.6;
      } else if (anim === 'death') {
        p.scatter = 0;
        p.rot = 0;
        p.lean = 0;
        p.fade = ease(clamp01(t / 0.6)) * 0.6;
        p.bob = 0;
      }
      break;
    case 'toad':
      if (anim === 'idle') {
        p.bob = 0;
        p.charge = 0.2 + 0.2 * s;
        p.legA = 0;
        p.legB = 0;
      } else if (anim === 'walk') {
        // Hops: up on the push, the legs stretched in the air, then a low crouch.
        const hop = Math.abs(s);
        p.bob = -hop * 5.5;
        p.legA = hop * 0.9;
        p.legB = hop * 0.9;
        p.lean = 1;
      } else if (anim === 'death') {
        p.scatter = 0;
        p.fade = 0;
        p.rot = -ease(clamp01(t / 0.7)) * 0.5;
        p.bob = ease(clamp01(t / 0.7)) * 3;
        p.lean = 0;
      }
      break;
    case 'orb':
      if (anim === 'idle') {
        p.bob = s * 2;
        p.legA = s * 0.4;
        p.legB = 0;
      } else if (anim === 'walk') {
        p.bob = s * 2.5;
        p.legA = s * 0.7;
        p.legB = 0;
        p.lean = 2;
      } else if (anim === 'death') {
        // Pops: it shrinks to a spark and is gone.
        p.scatter = 0;
        p.rot = 0;
        p.fade = ease(clamp01(t / 0.6));
        p.bob = 0;
      }
      break;
    case 'bell':
      if (anim === 'idle' || anim === 'walk') p.legA = s * 0.5;
      else if (anim === 'attack') {
        // It tolls: a violent swing and a ring of light that grows and fades.
        p.legA = Math.sin(t * TAU * 4) * 0.9;
        p.charge = Math.sin(clamp01(t) * Math.PI);
      } else if (anim === 'death') {
        p.scatter = 0;
        p.rot = 0;
        p.bob = ease(clamp01(t / 0.6)) * 18;
        p.fade = ease(clamp01(t / 0.9)) * 0.4;
      }
      break;
    case 'chest':
      if (anim === 'walk') {
        // Hops along on its legs.
        const hop = Math.abs(s);
        p.bob = -hop * 3;
        p.legA = s * 0.9;
        p.legB = -s * 0.9;
      } else if (anim === 'death') {
        // The lid falls open, and it lies there.
        p.scatter = 0;
        p.armA = -1.4;
        p.rot = 0;
        p.bob = 0;
      }
      break;
    case 'crawler':
      if (anim === 'walk') {
        p.legA = s;
        p.legB = -s;
        p.bob = -Math.abs(Math.cos(t * TAU)) * 0.8;
      }
      break;
    default:
      break;
  }
  return p;
}

// ---- Building primitives -----------------------------------------------------------------------

type B = { prims: Prim[] };
const circ = (b: B, x: number, y: number, r: number, role: Role) =>
  b.prims.push({ k: 'circ', x, y, r, role });
const cap = (b: B, x1: number, y1: number, x2: number, y2: number, r: number, role: Role) =>
  b.prims.push({ k: 'cap', x1, y1, x2, y2, r, role });
const box = (b: B, x: number, y: number, w: number, h: number, rot: number, role: Role) =>
  b.prims.push({ k: 'box', x, y, w, h, rot, role });

const tri = (b: B, pts: [number, number, number, number, number, number], role: Role) =>
  b.prims.push({ k: 'tri', pts, role });

/** Two-segment limb from (x, y): angle a for the upper part, b for the lower. Returns the end point. */
function limb(
  b: B,
  x: number,
  y: number,
  a: number,
  bAngle: number,
  l1: number,
  l2: number,
  r: number,
  role: Role,
  shade: Role,
) {
  const kx = x + Math.sin(a) * l1;
  const ky = y + Math.cos(a) * l1;
  const ex = kx + Math.sin(bAngle) * l2;
  const ey = ky + Math.cos(bAngle) * l2;
  cap(b, x, y, kx, ky, r, role);
  cap(b, kx, ky, ex, ey, r * 0.9, shade);
  return { x: ex, y: ey };
}

type Build = {
  scale: number;
  legLen: number;
  torsoH: number;
  shoulder: number;
  skull: number;
  ribW: number;
};

const BUILDS: Record<FigureKind, Build> = {
  warrior: { scale: 1, legLen: 9, torsoH: 14, shoulder: 7, skull: 6.5, ribW: 6 },
  brute: { scale: 1.35, legLen: 8, torsoH: 15, shoulder: 9, skull: 7, ribW: 8 },
  archer: { scale: 0.95, legLen: 9, torsoH: 13, shoulder: 6, skull: 6.2, ribW: 5 },
  mage: { scale: 0.95, legLen: 8, torsoH: 14, shoulder: 6, skull: 6.5, ribW: 5.5 },
  boss: { scale: 2, legLen: 9, torsoH: 15, shoulder: 8, skull: 7, ribW: 7 },
  gnawer: { scale: 0.7, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  bat: { scale: 0.7, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  beetle: { scale: 0.9, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  nest: { scale: 1.3, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  sentinel: { scale: 1.5, legLen: 9, torsoH: 14, shoulder: 9, skull: 6, ribW: 8 },
  arbalest: { scale: 1.1, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  golem: { scale: 1.4, legLen: 8, torsoH: 14, shoulder: 10, skull: 6, ribW: 8 },
  pylon: { scale: 1.2, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  hound: { scale: 1.2, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  boar: { scale: 1.25, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  cat: { scale: 1.25, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  bloat: { scale: 1.05, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  toad: { scale: 1.1, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  orb: { scale: 0.9, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  crawler: { scale: 1, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  heap: { scale: 1.35, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  bell: { scale: 1.1, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  spider: { scale: 1, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  chest: { scale: 1, legLen: 4, torsoH: 6, shoulder: 3, skull: 3, ribW: 3 },
  hero_mace: { scale: 1.05, legLen: 9, torsoH: 14, shoulder: 8, skull: 5.5, ribW: 7 },
  hero_sword: { scale: 1, legLen: 9, torsoH: 14, shoulder: 7, skull: 5.5, ribW: 6.5 },
  hero_bow: { scale: 1, legLen: 9.5, torsoH: 13, shoulder: 6, skull: 5.5, ribW: 5.5 },
  hero_wand: { scale: 1, legLen: 9, torsoH: 14, shoulder: 6, skull: 5.5, ribW: 6 },
  hero_dagger: { scale: 0.98, legLen: 9.5, torsoH: 13, shoulder: 6, skull: 5.5, ribW: 5.5 },
};

export function isHero(kind: FigureKind): boolean {
  return kind.startsWith('hero_');
}

function weapon(
  b: B,
  kind: FigureKind,
  hx: number,
  hy: number,
  ang: number,
  charge: number,
  bx: number,
  by: number,
) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const along = (len: number) => ({ x: hx + dx * len, y: hy + dy * len });
  switch (kind) {
    case 'warrior':
    case 'hero_sword': {
      const tip = along(17);
      cap(b, hx - dx * 2, hy - dy * 2, hx + dx * 3, hy + dy * 3, 1.3, 'wood');
      cap(
        b,
        hx + dx * 2.5 - dy * 3,
        hy + dy * 2.5 + dx * 3,
        hx + dx * 2.5 + dy * 3,
        hy + dy * 2.5 - dx * 3,
        1,
        'metalShade',
      );
      cap(b, hx + dx * 3, hy + dy * 3, tip.x, tip.y, 1.5, 'metal');
      break;
    }
    case 'hero_dagger': {
      const tip = along(9);
      cap(b, hx - dx * 1.5, hy - dy * 1.5, hx + dx * 2, hy + dy * 2, 1.2, 'wood');
      cap(b, hx + dx * 2, hy + dy * 2, tip.x, tip.y, 1.3, 'metal');
      break;
    }
    case 'brute': {
      const e = along(16);
      cap(b, hx - dx * 2, hy - dy * 2, e.x, e.y, 1.8, 'wood');
      circ(b, e.x + dx * 2, e.y + dy * 2, 4.5, 'metalShade');
      circ(b, e.x + dx * 2, e.y + dy * 2, 3, 'metal');
      break;
    }
    case 'boss': {
      const e = along(24);
      cap(b, hx - dx * 3, hy - dy * 3, e.x, e.y, 2.2, 'metalShade');
      cap(b, e.x, e.y, along(32).x, along(32).y, 3.2, 'metal');
      break;
    }
    case 'hero_mace': {
      const e = along(15);
      cap(b, hx - dx * 3, hy - dy * 3, e.x, e.y, 1.6, 'wood');
      box(b, e.x + dx * 3, e.y + dy * 3, 8, 8, ang, 'metalShade');
      box(b, e.x + dx * 3, e.y + dy * 3, 6, 6, ang, 'metal');
      break;
    }
    case 'mage':
    case 'hero_wand': {
      const staff = kind === 'mage';
      const e = along(staff ? 20 : 11);
      cap(b, hx - dx * 4, hy - dy * 4, e.x, e.y, staff ? 1.3 : 1, 'wood');
      circ(b, e.x + dx * 2, e.y + dy * 2, 2.8 + charge * 2.5, 'glow');
      break;
    }
    case 'archer':
    case 'hero_bow': {
      // The bow: a limb arc held at (hx, hy), string drawn back by `charge`.
      const top = { x: hx + 2, y: hy - 12 };
      const bot = { x: hx + 2, y: hy + 12 };
      cap(b, top.x, top.y, hx + 6, hy, 1.4, 'wood');
      cap(b, hx + 6, hy, bot.x, bot.y, 1.4, 'wood');
      const pull = bx + (hx - bx) * 0 - charge * 8;
      cap(b, top.x, top.y, pull, hy, 0.4, 'dark');
      cap(b, pull, hy, bot.x, bot.y, 0.4, 'dark');
      if (charge > 0.1) cap(b, pull, hy, hx + 10, hy, 0.6, 'wood');
      void by;
      break;
    }
  }
}

/** The kinds drawn by `buildCreature` rather than on the skeleton. */
const CREATURES = new Set<FigureKind>([
  'gnawer',
  'bat',
  'beetle',
  'nest',
  'sentinel',
  'arbalest',
  'golem',
  'pylon',
  'hound',
  'boar',
  'cat',
  'bloat',
  'toad',
  'orb',
  'crawler',
  'heap',
  'bell',
  'spider',
  'chest',
]);

/**
 * The Swarm and the Reliquary: bodies built from circles, capsules and boxes in the same design space as the
 * skeleton (feet at the origin, up is -y). The pose supplies the same numbers: `legA` and `legB` are the two gait
 * phases (wing beats for the bat), `bob` lifts the body, `armA` raises limbs, `charge` loads the crossbow.
 */
function buildCreature(kind: FigureKind, pose: Pose, type?: MonsterTypeId): Prim[] {
  const b: B = { prims: [] };
  const lift = pose.bob;
  switch (kind) {
    case 'gnawer': {
      // A low, long rodent: four scrabbling legs, a tail, a pointed head.
      for (const [x, ph] of [
        [-4, pose.legB],
        [4, pose.legA],
      ] as const) {
        cap(b, x - 1, -4 + lift, x + ph * 3 - 1, 0, 1, 'boneShade');
        cap(b, x + 1.5, -4 + lift, x + 1.5 - ph * 3, 0, 1, 'boneShade');
      }
      cap(b, -9, -6 + lift, -4, -4 + lift, 0.7, 'dark');
      circ(b, -1, -6 + lift, 4.6, 'boneShade');
      circ(b, 0, -7 + lift, 3.6, 'bone');
      circ(b, 6, -7 + lift + pose.head * 2, 3, 'bone');
      b.prims.push({
        k: 'tri',
        pts: [8, -9 + lift, 12, -7 + lift, 8, -5.5 + lift],
        role: 'boneShade',
      });
      circ(b, 7, -8.3 + lift, 0.8, 'eye');
      circ(b, 4.6, -10.3 + lift, 1.4, 'bone');
      break;
    }
    case 'hound': {
      // A lean dog: four long legs, a deep chest, a pointed muzzle and a collar.
      for (const [x, ph] of [
        [-6, pose.legB],
        [-2, pose.legA],
        [4, pose.legB],
        [8, pose.legA],
      ] as const)
        cap(b, x, -6 + lift, x + ph * 4, 0, 1.1, 'boneShade');
      cap(b, -7, -9 + lift, 5, -9 + lift, 3.6, 'bone');
      circ(b, -6, -10 + lift, 4.4, 'bone');
      circ(b, 4, -10 + lift, 4.4, 'boneShade');
      cap(b, 5, -11 + lift, 9, -13 + lift, 2.2, 'bone');
      circ(b, 11, -13 + lift + pose.head * 2, 3.2, 'bone');
      box(b, 14.5, -12.4 + lift, 4, 2.4, 0, 'boneShade');
      b.prims.push({
        k: 'tri',
        pts: [9.5, -15.6 + lift, 10.5, -19 + lift, 12, -15.8 + lift],
        role: 'boneShade',
      });
      circ(b, 12.4, -14 + lift, 0.8, 'eye');
      cap(b, 6, -11 + lift, 8.5, -12.5 + lift, 1, 'accent');
      cap(b, -10, -10 + lift, -14, -13 + lift - pose.legA * 2, 1, 'boneShade');
      break;
    }
    case 'boar': {
      // A heavy hog: a hump of shoulders, short thick legs, tusks and a ridge of bristles.
      for (const [x, ph] of [
        [-7, pose.legB],
        [-3, pose.legA],
        [4, pose.legB],
        [8, pose.legA],
      ] as const)
        cap(b, x, -6 + lift, x + ph * 2.5, 0, 1.8, 'boneShade');
      circ(b, 0, -11 + lift, 8.5, 'bone');
      circ(b, -4, -13 + lift, 7, 'boneShade');
      for (let i = 0; i < 4; i++)
        b.prims.push({
          k: 'tri',
          pts: [-8 + i * 3.5, -18 + lift, -6.5 + i * 3.5, -23 + lift, -5 + i * 3.5, -18 + lift],
          role: 'dark',
        });
      circ(b, 9, -9 + lift + pose.head * 2, 5, 'bone');
      box(b, 14, -7.5 + lift, 5, 4, 0, 'boneShade');
      b.prims.push({
        k: 'tri',
        pts: [12, -6 + lift, 17.5, -10 + lift, 13.5, -7.5 + lift],
        role: 'metal',
      });
      b.prims.push({
        k: 'tri',
        pts: [7, -13.5 + lift, 8.5, -17 + lift, 10, -13 + lift],
        role: 'boneShade',
      });
      circ(b, 10.5, -10.5 + lift, 0.9, 'eye');
      break;
    }
    case 'cat': {
      // A sleek, low cat: a long body, a long tail, tufted ears and stripes.
      for (const [x, ph] of [
        [-6, pose.legB],
        [-2, pose.legA],
        [4, pose.legB],
        [7, pose.legA],
      ] as const)
        cap(b, x, -6 + lift, x + ph * 3.5, 0, 1, 'boneShade');
      cap(b, -7, -9 + lift, 6, -9 + lift, 3.2, 'bone');
      for (const x of [-4, -1, 2]) box(b, x, -11.4 + lift, 1.2, 3, 0.2, 'boneShade');
      circ(b, 10, -11 + lift + pose.head * 2, 3.2, 'bone');
      box(b, 13, -10 + lift, 2.5, 2, 0, 'boneShade');
      b.prims.push({
        k: 'tri',
        pts: [8, -13.4 + lift, 8.6, -17 + lift, 10.4, -13.8 + lift],
        role: 'boneShade',
      });
      b.prims.push({
        k: 'tri',
        pts: [10.6, -13.8 + lift, 12.4, -17 + lift, 12.8, -13 + lift],
        role: 'boneShade',
      });
      circ(b, 11.4, -11.6 + lift, 0.8, 'eye');
      cap(b, -9, -9 + lift, -14, -13 + lift, 1, 'bone');
      cap(b, -14, -13 + lift, -16, -19 + lift - pose.legA * 2, 1, 'boneShade');
      break;
    }
    case 'bloat': {
      // A huge round body on stub legs: a small sunken head, a stretched belly, pustules, arms that hang. It sways as it
      // waddles (`lean`), and the pose's `fade` deflates it when it dies.
      const sw = pose.lean * 0.6;
      for (const [x, ph] of [
        [-5, pose.legB],
        [5, pose.legA],
      ] as const)
        cap(b, x + sw, -9 + lift, x + ph * 2.5 + sw * 0.4, 0, 2.6, 'clothShade');
      circ(b, sw - 1, -16 + lift, 11.5, 'clothShade');
      circ(b, sw, -17 + lift, 10, 'skin');
      circ(b, sw + 2, -14 + lift, 7, 'cloth');
      if (type !== 'gorger')
        for (const [x, y] of [
          [-4, -20],
          [3, -18],
          [6, -12],
          [-2, -10],
          [-7, -14],
          [1, -24],
        ] as const)
          circ(b, sw + x, y + lift, 1.6, 'accent');
      else {
        // A gorger is all belly and mouth: a wide maw across the belly, teeth, and a bib of what it has eaten.
        box(b, sw + 2, -14 + lift, 11, 4.4, 0, 'dark');
        for (let i = 0; i < 5; i++) {
          const x = sw - 2.5 + i * 2.6;
          b.prims.push({
            k: 'tri',
            pts: [x - 1.2, -16.2 + lift, x, -13 + lift, x + 1.2, -16.2 + lift],
            role: 'bone',
          });
          b.prims.push({
            k: 'tri',
            pts: [x - 1.2, -11.8 + lift, x, -15 + lift, x + 1.2, -11.8 + lift],
            role: 'bone',
          });
        }
        circ(b, sw + 5, -7 + lift, 2.2, 'accent');
      }
      cap(b, sw + 9, -22 + lift, sw + 12 + pose.armA * 2, -12 + lift, 2.1, 'skin');
      cap(b, sw - 9, -22 + lift, sw - 11 + pose.armB * 2, -13 + lift, 2, 'clothShade');
      circ(b, sw + 5, -28 + lift, 4.4, 'skin');
      circ(b, sw + 6.8, -28.6 + lift, 0.9, 'eye');
      circ(b, sw + 4, -28.8 + lift, 0.9, 'eye');
      box(b, sw + 6, -26 + lift, 3, 0.9, 0, 'dark');
      break;
    }
    case 'toad': {
      // A low, wide amphibian: folded hind legs, a hump, bulging eyes and a throat sac that swells as it winds up to spit.
      // It hops (`bob`), rears its head when the arm goes back (`armA`) and lunges with `lean`.
      const ph = pose.legA;
      const rear = Math.max(0, -pose.armA) * 1.4;
      const hx = 8 + pose.lean * 0.5;
      const hy = -10 + lift - rear;
      cap(b, -4, -6 + lift, -9, -3 + lift * 0.5, 2.3, 'clothShade');
      cap(b, -9, -3 + lift * 0.5, -5 - ph * 4, 0, 1.7, 'clothShade');
      cap(b, 4, -5 + lift, 6 + ph * 3, 0, 1.6, 'clothShade');
      circ(b, -1, -9 + lift, 8, 'clothShade');
      circ(b, 0, -9.5 + lift, 7, 'skin');
      circ(b, -4, -13 + lift, 5.2, 'skin');
      for (const [x, y] of [
        [-5, -15],
        [-1, -13],
        [2, -6],
      ] as const)
        circ(b, x, y + lift, 1, 'clothShade');
      circ(b, hx, hy, 5.2, 'skin');
      box(b, hx + 3, hy + 2.2, 7, 2.4, 0, 'dark');
      circ(b, hx + 1, hy - 4.6, 1.8, 'skin');
      circ(b, hx + 1, hy - 4.8, 1, 'eye');
      circ(b, hx + 5, hy - 3.6, 1.6, 'skin');
      circ(b, hx + 5, hy - 3.8, 0.9, 'eye');
      circ(b, hx + 1, hy + 4.5, 1.5 + pose.charge * 4.5, 'accent');
      break;
    }
    case 'orb': {
      // A flame of a thing: no limbs, a core in a halo, three tails that stream behind (`legA` is their sway).
      const y = -20 + lift;
      const sway = pose.legA * 5;
      if (type === 'watcher') {
        // A floating eye: a pale ball with a coloured iris and a pupil that looks at what it sees, trailing tendrils.
        for (const d of [-1, 0, 1])
          cap(b, d * 3, y + 6, d * 5 - sway * 0.5, y + 16 + Math.abs(d) * 3, 0.9, 'clothShade');
        circ(b, 0, y, 8.6, 'clothShade');
        circ(b, 0, y, 7.6, 'bone');
        circ(b, 1.8, y, 4.4, 'eye');
        circ(b, 2.6 + pose.head * 2, y, 2.1, 'dark');
        circ(b, 3.4, y - 1.2, 0.8, 'glow');
        break;
      }
      tri(b, [-3, y + 2, 3, y + 2, -11 - sway, y + 13], 'clothShade');
      tri(b, [-2, y + 3, 2, y + 3, -5 - sway * 0.7, y + 17], 'cloth');
      tri(b, [0, y + 3, 4, y + 3, 3 - sway * 0.4, y + 11], 'clothShade');
      circ(b, 0, y, 7.8, 'clothShade');
      circ(b, 0, y, 6.4, 'cloth');
      circ(b, 0, y, 4.6, 'glow');
      circ(b, 1.4, y - 0.6, 0.9, 'dark');
      circ(b, 3.4, y - 0.6, 0.9, 'dark');
      break;
    }
    case 'crawler': {
      // The top half of a skeleton that has learned to walk on its hands: a skull, a few ribs, a spine that trails, arms that reach.
      const a = pose.legA;
      const c = pose.legB;
      cap(b, -2, -7 + lift, 5 + c * 6, 0, 1.3, 'boneShade');
      cap(b, -10, -7 + lift, -15, -3 + lift + a, 1, 'boneShade');
      cap(b, -9, -6.5 + lift, 4, -7.5 + lift, 3, 'boneShade');
      for (let i = 0; i < 3; i++) box(b, -5 + i * 3.2, -9.2 + lift, 1.5, 5.4, 0.15, 'bone');
      cap(b, 1, -7 + lift, 7 + a * 6, 0, 1.4, 'bone');
      circ(b, 7 + a * 6, 0.2, 1.3, 'bone');
      circ(b, 5 + c * 6, 0.2, 1.2, 'boneShade');
      circ(b, 9, -8 + lift + pose.head * 2, 4.2, 'bone');
      box(b, 11.5, -5.8 + lift, 4.6, 2, 0, 'boneShade');
      circ(b, 10.4, -9 + lift, 1.4, 'dark');
      circ(b, 10.8, -9.2 + lift, 0.7, 'eye');
      break;
    }
    case 'heap': {
      // A mound of fused bone: skulls in it, limbs out of it, a pair of stumps to walk on.
      const ph = pose.legA;
      cap(b, -5, -5 + lift, -5 + ph * 2, 0, 3.2, 'boneShade');
      cap(b, 6, -5 + lift, 6 - ph * 2, 0, 3.2, 'bone');
      circ(b, 0, -13 + lift, 13, 'boneShade');
      circ(b, -3, -15 + lift, 10.5, 'bone');
      circ(b, 4, -11 + lift, 8, 'boneShade');
      for (const [x, y, r] of [
        [-7, -18, 3.4],
        [5, -20, 3],
        [-9, -10, 3],
        [8, -8, 3.2],
        [0, -25, 3.2],
      ] as const) {
        circ(b, x, y + lift, r, 'bone');
        circ(b, x - 1, y + lift - 0.3, r * 0.32, 'dark');
        circ(b, x + 1.2, y + lift - 0.3, r * 0.32, 'dark');
      }
      const raise = pose.armA * 6;
      cap(b, 10, -16 + lift, 17, -9 - raise + lift, 2.8, 'bone');
      circ(b, 18, -8 - raise + lift, 3.6, 'boneShade');
      cap(b, -11, -14 + lift, -16, -6 + lift, 2.4, 'boneShade');
      circ(b, 3.5, -22 + lift, 1.4, 'eye');
      circ(b, -3.5, -22.5 + lift, 1.2, 'eye');
      break;
    }
    case 'bell': {
      // A bell hung in the air: a chain, a swinging body, a clapper; a ring of light spreads from the lip as it tolls.
      const y = -22 + lift;
      const sw = pose.legA * 6;
      if (pose.charge > 0.05) circ(b, sw, y + 7.4, 7 + pose.charge * 9, 'glow');
      cap(b, 0, y - 14, sw * 0.15, y - 7, 0.8, 'metalShade');
      circ(b, 0, y - 14, 1.6, 'metalShade');
      b.prims.push({
        k: 'tri',
        pts: [-9 + sw, y + 7, 9 + sw, y + 7, sw * 0.4, y - 8],
        role: 'metalShade',
      });
      b.prims.push({
        k: 'tri',
        pts: [-6 + sw, y + 7, 7 + sw, y + 7, sw * 0.4 + 1, y - 7],
        role: 'metal',
      });
      box(b, sw, y + 7.4, 19, 2.6, 0, 'metalShade');
      circ(b, sw * 0.4, y - 7, 2.6, 'metal');
      cap(b, sw * 0.3, y + 1, -sw * 0.9, y + 9, 0.6, 'dark');
      circ(b, -sw * 0.9, y + 10, 2.2, 'accent');
      break;
    }
    case 'spider': {
      // Eight legs in two banks, a swollen abdomen, a small head with four eyes and fangs.
      const ph = pose.legA;
      const leg = (x0: number, i: number, role: Role) => {
        const dir = i - 1.5;
        const kx = x0 + dir * 3;
        const fx = x0 + dir * 5.5 + (i % 2 ? ph : -ph) * 3;
        cap(b, x0, -9 + lift, kx, -15 + lift, 0.9, role);
        cap(b, kx, -15 + lift, fx, 0, 0.8, role);
      };
      for (let i = 0; i < 4; i++) leg(-2 + i * 1.8, i, 'boneShade');
      circ(b, -8, -11 + lift, 7, 'clothShade');
      circ(b, -9, -12 + lift, 5, 'cloth');
      circ(b, -9, -12 + lift, 1.6, 'accent');
      for (let i = 0; i < 4; i++) leg(0.5 + i * 1.8, i, 'bone');
      circ(b, 2, -10 + lift, 4.4, 'cloth');
      const rear = Math.max(0, -pose.armA) * 0.8;
      circ(b, 6.5, -9.5 + lift - rear, 3, 'clothShade');
      for (const [x, y] of [
        [8, -11],
        [9, -9.8],
        [7.2, -12.2],
        [9.6, -11.6],
      ] as const)
        circ(b, x, y + lift - rear, 0.8, 'eye');
      cap(b, 8.5, -8.3 + lift - rear, 9.5, -6 + lift - rear, 0.6, 'bone');
      break;
    }
    case 'chest': {
      // A treasure chest on short legs: iron bands, a lock, and a lid that rises on a mouth of teeth when it strikes.
      const ph = pose.legA;
      const open = Math.max(0, -pose.armA) * 1.5 + pose.charge * 5;
      cap(b, -6, -5 + lift, -6 + ph * 3, 0, 1.6, 'wood');
      cap(b, 6, -5 + lift, 6 - ph * 3, 0, 1.6, 'metalShade');
      box(b, 0, -9 + lift, 18, 10, 0, 'wood');
      box(b, 0, -9 + lift, 18, 1.8, 0, 'metalShade');
      box(b, -6, -9 + lift, 1.8, 10, 0, 'metalShade');
      box(b, 6, -9 + lift, 1.8, 10, 0, 'metalShade');
      box(b, 0, -14.5 + lift, 18, 1.2 + open, 0, 'dark');
      for (let i = 0; i < 5; i++) {
        const x = -7 + i * 3.5;
        b.prims.push({
          k: 'tri',
          pts: [x - 1.4, -14 + lift, x, -11.4 + lift, x + 1.4, -14 + lift],
          role: 'bone',
        });
        b.prims.push({
          k: 'tri',
          pts: [x - 1.4, -15.2 - open + lift, x, -12.4 - open + lift, x + 1.4, -15.2 - open + lift],
          role: 'bone',
        });
      }
      box(b, 0, -17.5 - open + lift, 18, 5, 0, 'wood');
      box(b, 0, -16 - open + lift, 18, 1.6, 0, 'metalShade');
      circ(b, 0, -11 + lift, 2, 'accent');
      if (open > 0.8) circ(b, 0, -14.4 + lift - open * 0.4, 1.3, 'eye');
      break;
    }
    case 'bat': {
      // Hovers above the ground; wings beat with the gait phase.
      const y = -18 + lift;
      const flap = pose.legA * 9;
      circ(b, 0, y, 3.6, 'boneShade');
      circ(b, 3.2, y - 1, 2.6, 'bone');
      b.prims.push({ k: 'tri', pts: [3, y - 3, 4.4, y - 6.5, 5.6, y - 3], role: 'bone' });
      circ(b, 4.2, y - 1.2, 0.8, 'eye');
      for (const side of [-1, 1]) {
        const tipX = side * 12;
        const tipY = y - 3 - flap * side * 0 - Math.abs(flap) * (side > 0 ? 1 : 0.8) + 2;
        b.prims.push({
          k: 'tri',
          pts: [side * 1.5, y - 1, tipX, tipY, side * 8, y + 3],
          role: 'cloth',
        });
        cap(b, side * 1.5, y - 1, tipX, tipY, 0.8, 'dark');
      }
      cap(b, -2, y + 3, -3, y + 7, 0.6, 'dark');
      cap(b, 1, y + 3, 2, y + 7, 0.6, 'dark');
      break;
    }
    case 'beetle': {
      // A domed shell over six small legs, with a blunt head.
      for (const i of [-1, 0, 1]) {
        const ph = i % 2 ? pose.legA : pose.legB;
        cap(b, i * 4, -4 + lift, i * 5 + ph * 2.5, 0, 0.9, 'dark');
      }
      circ(b, 0, -7 + lift, 8.5, 'metalShade');
      circ(b, -1, -8 + lift, 7, 'metal');
      cap(b, 0, -14 + lift, 0, -2 + lift, 0.5, 'dark');
      circ(b, 8, -5 + lift, 3.2, 'boneShade');
      circ(b, 9.2, -5.6 + lift, 0.8, 'eye');
      cap(b, 10, -8 + lift, 13, -11 + lift, 0.7, 'dark');
      break;
    }
    case 'nest': {
      // A mound of packed bone with dark mouths and pale eggs.
      circ(b, 0, -6 + lift, 11, 'boneShade');
      circ(b, -4, -9 + lift, 7, 'cloth');
      circ(b, 5, -8 + lift, 6, 'clothShade');
      for (const [x, y, r] of [
        [-5, -4, 2.4],
        [4, -3, 2],
        [0, -9, 2.2],
      ] as const)
        circ(b, x, y + lift, r, 'dark');
      for (const [x, y] of [
        [-8, -2],
        [8, -1],
        [-2, -13],
      ] as const)
        circ(b, x, y + lift, 1.6, 'bone');
      circ(b, 0, -9 + lift, 0.9, 'eye');
      break;
    }
    case 'sentinel': {
      // A bone-and-iron guardian: slab torso, helm with a slit, heavy raised fists.
      const hip = -16;
      box(b, -3, hip + 8 + pose.legB * 4, 5, 18, 0, 'metalShade');
      box(b, 4, hip + 8 + pose.legA * 4, 5, 18, 0, 'metal');
      box(b, 0, hip - 8 + lift, 18, 18, 0, 'metalShade');
      box(b, 0, hip - 9 + lift, 15, 15, 0, 'metal');
      box(b, 0, hip - 10 + lift, 5, 5, 0, 'accent');
      box(b, 1, hip - 22 + lift, 10, 9, 0, 'metalShade');
      box(b, 3, hip - 22 + lift, 6, 2, 0, 'eye');
      const raise = pose.armA * 8;
      cap(b, 9, hip - 14 + lift, 15, hip - 6 - raise + lift, 3, 'metal');
      circ(b, 15, hip - 5 - raise + lift, 4.5, 'metalShade');
      cap(b, -9, hip - 14 + lift, -14, hip - 5 + lift, 3, 'metalShade');
      circ(b, -14, hip - 4 + lift, 4, 'metalShade');
      break;
    }
    case 'arbalest': {
      // A crossbow on a stand: it never moves, so the pose only loads the string.
      box(b, 0, -5, 12, 10, 0, 'metalShade');
      box(b, 0, -14 + lift, 4, 8, 0, 'metal');
      box(b, 5, -20, 16, 2.4, 0, 'wood');
      const pull = -pose.charge * 6;
      cap(b, 11, -20, 7 + pull, -26, 1, 'wood');
      cap(b, 11, -20, 7 + pull, -14, 1, 'wood');
      cap(b, 7 + pull, -26, 7 + pull, -14, 0.4, 'dark');
      if (pose.charge > 0.1) cap(b, 7 + pull, -20, 17, -20, 0.8, 'metal');
      circ(b, -3, -9, 1.5, 'eye');
      break;
    }
    case 'golem': {
      // A hunched figure of stacked stone with a burning core.
      box(b, -4, -5 + pose.legB * 3, 7, 10, 0, 'boneShade');
      box(b, 5, -5 + pose.legA * 3, 7, 10, 0, 'bone');
      circ(b, 0, -17 + lift, 10, 'metalShade');
      circ(b, -1, -18 + lift, 8, 'boneShade');
      circ(b, 0, -17 + lift, 3.4 + pose.charge, 'glow');
      circ(b, 3, -29 + lift, 4.6, 'bone');
      circ(b, 5, -29.5 + lift, 1, 'eye');
      const swing = pose.armA * 6;
      circ(b, 11, -14 + lift, 4.4, 'boneShade');
      cap(b, 8, -22 + lift, 13, -8 - swing + lift, 3.4, 'bone');
      circ(b, 14, -7 - swing + lift, 5, 'boneShade');
      cap(b, -8, -22 + lift, -13, -9 + lift, 3, 'boneShade');
      circ(b, -13, -8 + lift, 4.4, 'boneShade');
      break;
    }
    case 'pylon': {
      // A pillar capped by a hovering crystal.
      box(b, 0, -3, 12, 6, 0, 'metalShade');
      box(b, 0, -14, 7, 18, 0, 'metal');
      box(b, 0, -14, 3, 18, 0, 'metalShade');
      const bob = Math.sin(pose.bob * 2) * 1.2;
      b.prims.push({ k: 'tri', pts: [-4, -27 + bob, 0, -36 + bob, 4, -27 + bob], role: 'glow' });
      b.prims.push({ k: 'tri', pts: [-4, -27 + bob, 0, -20 + bob, 4, -27 + bob], role: 'accent' });
      break;
    }
    default:
      break;
  }
  return b.prims;
}

/**
 * Build the primitives of a figure in a pose (back to front). A monster type adds its kit to the humanoid body
 * (docs/ENEMIES.md 6.1); `t` is the time through a looping animation, for things that swing.
 */
export function buildFigure(kind: FigureKind, pose: Pose, type?: MonsterTypeId, t = 0): Prim[] {
  if (CREATURES.has(kind))
    return finish(
      buildCreature(kind, pose, type),
      BUILDS[kind].scale * (type ? (kitAdjust(type).scale ?? 1) : 1),
      pose,
    );
  const style = styleFor(type, kind);
  if (style !== 'bone') return buildLiving(kind, pose, type, t, style);
  const B_ = BUILDS[kind];
  const b: B = { prims: [] };
  const hero = isHero(kind);
  const boneRole: Role = hero ? 'cloth' : 'bone';
  const shadeRole: Role = hero ? 'clothShade' : 'boneShade';
  const hipY = -B_.legLen * 2 + pose.bob;
  const hipX = 0;
  const adj = type && !hero ? kitAdjust(type) : {};
  const shY = hipY - B_.torsoH + (adj.hunch ?? 0);
  const shX = pose.lean + (adj.hunch ?? 0) * 0.5;
  // Far arm and far leg first (behind the torso).
  const farLegAng = pose.legB;
  const nearLegAng = pose.legA;
  const footB = limb(
    b,
    hipX - 2,
    hipY,
    farLegAng,
    farLegAng * 0.4 - 0.1,
    B_.legLen,
    B_.legLen,
    1.7,
    hero ? 'clothShade' : 'boneShade',
    hero ? 'dark' : 'boneShade',
  );
  circ(b, footB.x + 1.5, footB.y, 1.8, hero ? 'dark' : 'boneShade');
  const farHand = limb(
    b,
    shX - B_.shoulder * 0.55,
    shY + 2,
    pose.armB,
    pose.armB + 0.5,
    7,
    7,
    1.5,
    hero ? 'clothShade' : 'boneShade',
    hero ? 'skin' : 'boneShade',
  );
  void farHand;
  // Pelvis and spine.
  box(b, hipX, hipY + 1, B_.ribW * 1.5, 4, 0, shadeRole);
  cap(b, hipX, hipY, shX, shY, 1.8, shadeRole);
  // Torso: ribcage (undead) or armoured chest (hero).
  if (hero) {
    box(
      b,
      (hipX + shX) / 2,
      (hipY + shY) / 2 - 1,
      B_.ribW * 2.1,
      B_.torsoH + 2,
      (shX - hipX) * 0.04,
      'cloth',
    );
    box(b, (hipX + shX) / 2, (hipY + shY) / 2 + 3, B_.ribW * 2.1, 3, 0, 'accent');
    box(b, shX, shY + 1, B_.ribW * 2.6, 3.5, 0, 'metal');
  } else {
    for (let i = 0; i < 3; i++) {
      const y = shY + 3 + i * 3.4;
      const x = shX + (hipX - shX) * ((y - shY) / (hipY - shY));
      box(b, x, y, B_.ribW * 2 - i * 1.2, 2, 0, i % 2 ? 'bone' : 'boneShade');
    }
    box(b, shX, shY + 1, B_.ribW * 2.3, 2.5, 0, 'bone');
  }
  // Near leg.
  const footA = limb(
    b,
    hipX + 2,
    hipY,
    nearLegAng,
    nearLegAng * 0.4 - 0.1,
    B_.legLen,
    B_.legLen,
    1.9,
    boneRole,
    hero ? 'dark' : shadeRole,
  );
  circ(b, footA.x + 1.8, footA.y, 2.1, hero ? 'dark' : boneRole);
  // Head.
  const hx = shX + pose.head * 6 + 1;
  const hy = shY - B_.skull - 1.5 + (pose.bob > 0 ? 0 : 0);
  if (hero) {
    circ(b, hx, hy, B_.skull, 'skin');
    circ(b, hx, hy - 1.5, B_.skull * 1.02, 'metalShade');
    box(b, hx + 1, hy + 0.5, B_.skull * 1.3, 2.4, 0, 'dark');
    circ(b, hx + 3, hy + 0.3, 0.8, 'eye');
    box(b, hx - B_.skull * 0.9, hy + 2, 3, 8, pose.lean * 0.05, 'accent');
  } else {
    circ(b, hx, hy, B_.skull, 'bone');
    box(b, hx + 1, hy + B_.skull * 0.75, B_.skull * 1.1, 3, 0, 'boneShade');
    circ(b, hx - 1.8, hy - 0.5, 1.9, 'dark');
    circ(b, hx + 3.2, hy - 0.5, 1.9, 'dark');
    circ(b, hx - 1.8, hy - 0.5, 0.8, 'eye');
    circ(b, hx + 3.2, hy - 0.5, 0.8, 'eye');
    if (kind === 'boss') {
      box(b, hx, hy - B_.skull * 0.9, B_.skull * 2, 3, 0, 'accent');
      for (let i = -1; i <= 1; i++)
        b.prims.push({
          k: 'tri',
          pts: [
            hx + i * 4 - 2,
            hy - B_.skull * 0.9,
            hx + i * 4,
            hy - B_.skull * 0.9 - 6,
            hx + i * 4 + 2,
            hy - B_.skull * 0.9,
          ],
          role: 'accent',
        });
    }
  }
  // Near arm and weapon.
  const hand = limb(
    b,
    shX + B_.shoulder * 0.55,
    shY + 2,
    pose.armA,
    pose.armA + 0.4,
    7,
    7,
    1.6,
    boneRole,
    hero ? 'skin' : shadeRole,
  );
  const wAng = pose.armA + pose.weapon - Math.PI / 2 + 0.3;
  weapon(b, kind, hand.x, hand.y, isRanged(kind) ? 0 : wAng, pose.charge, shX - B_.shoulder, shY);
  // Shield for the sword hero (off hand).
  if (kind === 'hero_sword') {
    circ(b, shX - 4, shY + 8, 6, 'metalShade');
    circ(b, shX - 4, shY + 8, 4.2, 'metal');
    circ(b, shX - 4, shY + 8, 1.4, 'accent');
  }
  if (type && !hero) {
    const a: Anchors = {
      hx,
      hy,
      skull: B_.skull,
      shX,
      shY,
      hipX,
      hipY,
      hand,
      wAng,
      legLen: B_.legLen,
      swing: pose.legA,
      t,
    };
    b.prims.unshift(...kitBack(type, a));
    b.prims.push(...kitFront(type, a));
  }
  return finish(b.prims, B_.scale * (adj.scale ?? 1), pose);
}

/**
 * A body that is not a skeleton (docs/ROSTER.md 4.1): a person of flesh in a garment, or a spectre with no legs. It stands
 * on the same posed skeleton of limbs as the bone body (so every pose, gait and attack works), but is built of other
 * things: a solid torso in the garb of its faction, a head with a face or a hood, no ribs, no skull.
 */
function buildLiving(
  kind: FigureKind,
  pose: Pose,
  type: MonsterTypeId | undefined,
  t: number,
  style: BodyStyle,
): Prim[] {
  const B_ = BUILDS[kind];
  const b: B = { prims: [] };
  const adj = kitAdjust(type);
  const g = garbOf(type);
  const spectre = style === 'spectre';
  const hipY = (spectre ? -B_.legLen * 1.5 : -B_.legLen * 2) + pose.bob;
  const hipX = 0;
  const shY = hipY - B_.torsoH + (adj.hunch ?? 0);
  const shX = pose.lean + (adj.hunch ?? 0) * 0.5;
  const reach = spectre ? (g.reach ?? 9) : 7;
  const armR = spectre ? 1.1 : 1.5;
  const sway = pose.legA * 4;
  const tail = g.tail ?? 1;
  // Behind the body: the far leg, or a spectre's trailing cloak, and the far arm.
  if (spectre) {
    tri(b, [shX - 5, shY + 2, shX + 5, shY + 2, hipX - 13 * tail - sway, -1], 'clothShade');
  } else {
    const footB = limb(
      b,
      hipX - 2,
      hipY,
      pose.legB,
      pose.legB * 0.4 - 0.1,
      B_.legLen,
      B_.legLen,
      1.8,
      g.legsShade,
      g.legsShade,
    );
    circ(b, footB.x + 1.5, footB.y, 1.9, g.foot);
  }
  limb(
    b,
    shX - B_.shoulder * 0.55,
    shY + 2,
    pose.armB,
    pose.armB + 0.5,
    reach,
    reach,
    armR,
    g.arms,
    g.hands,
  );
  // The body.
  if (spectre) {
    // A robe that narrows to a point under the hip.
    tri(
      b,
      [
        shX - B_.ribW * 1.15,
        shY + 1,
        shX + B_.ribW * 1.15,
        shY + 1,
        hipX - 2 - sway * 0.6,
        hipY + B_.legLen * (1.2 - (tail < 1 ? 0.5 : 0)),
      ],
      g.torso,
    );
    tri(
      b,
      [
        shX - B_.ribW * 0.5,
        shY + 3,
        shX + B_.ribW * 0.9,
        shY + 3,
        hipX - 1 - sway * 0.6,
        hipY + B_.legLen * 0.9,
      ],
      g.torsoShade,
    );
    box(b, shX, shY + 1.5, B_.ribW * 2.4, 3.5, 0, g.torsoShade);
  } else {
    // A torso that narrows from the shoulders to the waist, two triangles between them.
    const wS = B_.ribW * 0.95;
    const wH = B_.ribW * 0.8;
    cap(b, shX, shY, hipX, hipY, 2.2, g.torsoShade);
    tri(b, [shX - wS, shY + 1, shX + wS, shY + 1, hipX + wH, hipY], g.torso);
    tri(b, [shX - wS, shY + 1, hipX + wH, hipY, hipX - wH, hipY], g.torso);
    box(b, hipX, hipY + 1, wH * 2.1, 3, 0, 'dark');
    box(b, shX, shY + 1, wS * 2.2, 3.5, 0, g.torsoShade);
    if (g.plate) {
      circ(b, shX - B_.shoulder * 0.9, shY + 2, 3.6, 'metal');
      circ(b, shX + B_.shoulder * 0.9, shY + 2, 3.6, 'metal');
      box(b, (hipX + shX) / 2, (hipY + shY) / 2 + 2, B_.ribW * 1.4, 2, 0, 'accent');
    }
    // The near leg, then a skirt or coat that hides the legs.
    const footA = limb(
      b,
      hipX + 2,
      hipY,
      pose.legA,
      pose.legA * 0.4 - 0.1,
      B_.legLen,
      B_.legLen,
      1.9,
      g.legs,
      g.legsShade,
    );
    circ(b, footA.x + 1.8, footA.y, 2.1, g.foot);
    if (g.skirt) {
      const sw = pose.legA * 2.5;
      const w0 = B_.ribW;
      const w1 = B_.ribW * 1.9;
      const hem = -(g.hem ?? 1);
      tri(b, [hipX - w0, hipY - 1, hipX + w0, hipY - 1, hipX - w1 + sw, hem], g.skirt);
      tri(b, [hipX + w0, hipY - 1, hipX + w1 + sw, hem, hipX - w1 + sw, hem], g.skirt);
      box(b, hipX + sw, hem - 0.6, w1 * 2, 1.6, 0, g.torsoShade);
    }
  }
  // The head.
  const hx = shX + pose.head * 6 + 1;
  const hy = shY - B_.skull - 1.5;
  if (spectre) {
    tri(
      b,
      [
        hx - B_.skull * 0.8,
        hy - B_.skull * 0.5,
        hx - B_.skull * 2.1 - sway * 0.3,
        hy + B_.skull * 1.3,
        hx - B_.skull * 0.1,
        hy + B_.skull * 0.9,
      ],
      'clothShade',
    );
    if (g.streaming) {
      // Bare-headed, with hair that streams out behind.
      for (const d of [-1, 0, 1])
        tri(
          b,
          [
            hx - B_.skull * 0.4,
            hy - B_.skull * 0.8 + d * 2,
            hx - B_.skull * 3.2 - sway * 0.5,
            hy + d * 5 + 3,
            hx - B_.skull * 0.2,
            hy + B_.skull * 0.8 + d * 2,
          ],
          'clothShade',
        );
      circ(b, hx, hy, B_.skull, 'bone');
      circ(b, hx + 1.2, hy + 0.3, B_.skull * 0.55, 'dark');
    } else {
      circ(b, hx, hy, B_.skull * 1.12, 'clothShade');
      if (g.point)
        tri(
          b,
          [
            hx - B_.skull * 0.9,
            hy - B_.skull * 0.3,
            hx - B_.skull * 0.3,
            hy - B_.skull * 2.6,
            hx + B_.skull * 0.9,
            hy - B_.skull * 0.4,
          ],
          'clothShade',
        );
      circ(b, hx + 1.2, hy + 0.3, B_.skull * 0.78, 'dark');
    }
    circ(b, hx + 0.2, hy - 0.2, 1.1, 'eye');
    circ(b, hx + 3.2, hy - 0.2, 1.1, 'eye');
  } else {
    cap(b, shX, shY + 1, hx, hy + B_.skull * 0.8, 2.3, 'skin');
    circ(b, hx, hy, B_.skull, 'skin');
    circ(b, hx + B_.skull * 0.95, hy + 1, 1.3, 'skin');
    const eye: Role = g.glowEyes ? 'eye' : 'dark';
    circ(b, hx + 1.4, hy - 0.5, g.glowEyes ? 1.1 : 0.9, eye);
    circ(b, hx + 3.8, hy - 0.5, g.glowEyes ? 1.1 : 0.9, eye);
    box(b, hx + 2.4, hy + B_.skull * 0.55, 2.8, 0.9, 0, 'dark');
    if (g.hair) box(b, hx - 0.5, hy - B_.skull * 0.7, B_.skull * 1.9, 2.6, 0, g.hair);
  }
  // The near arm and what it holds.
  const hand = limb(
    b,
    shX + B_.shoulder * 0.55,
    shY + 2,
    pose.armA,
    pose.armA + 0.4,
    reach,
    reach,
    armR * 1.07,
    g.arms,
    g.hands,
  );
  const wAng = pose.armA + pose.weapon - Math.PI / 2 + 0.3;
  const held = type && type in HELD ? HELD[type] : kind;
  if (!spectre && held)
    weapon(b, held, hand.x, hand.y, isRanged(held) ? 0 : wAng, pose.charge, shX - B_.shoulder, shY);
  if (type) {
    const a: Anchors = {
      hx,
      hy,
      skull: B_.skull,
      shX,
      shY,
      hipX,
      hipY,
      hand,
      wAng,
      legLen: B_.legLen,
      swing: pose.legA,
      t,
    };
    b.prims.unshift(...kitBack(type, a));
    b.prims.push(...kitFront(type, a));
  }
  return finish(b.prims, B_.scale * (adj.scale ?? 1), pose);
}

/** Apply scale, rotation and scatter to a built figure. */
function finish(prims: Prim[], s: number, pose: Pose): Prim[] {
  const out: Prim[] = [];
  s *= 1 - 0.85 * pose.fade;
  const rc = Math.cos(pose.rot);
  const rs = Math.sin(pose.rot);
  const tx = (x: number, y: number, i: number): [number, number] => {
    // Scatter: bones drift apart deterministically per primitive.
    const sx = Math.sin(i * 12.9898) * 6 * pose.scatter;
    const sy = Math.abs(Math.cos(i * 78.233)) * 3 * pose.scatter;
    const X = (x + sx) * s;
    const Y = (y + sy * 0.3) * s;
    return [X * rc - Y * rs, X * rs + Y * rc];
  };
  prims.forEach((p, i) => {
    switch (p.k) {
      case 'circ': {
        const [x, y] = tx(p.x, p.y, i);
        out.push({ ...p, x, y, r: p.r * s });
        break;
      }
      case 'cap': {
        const [x1, y1] = tx(p.x1, p.y1, i);
        const [x2, y2] = tx(p.x2, p.y2, i);
        out.push({ ...p, x1, y1, x2, y2, r: p.r * s });
        break;
      }
      case 'box': {
        const [x, y] = tx(p.x, p.y, i);
        out.push({ ...p, x, y, w: p.w * s, h: p.h * s, rot: p.rot + pose.rot });
        break;
      }
      case 'tri': {
        const q = p.pts;
        const [a, c] = tx(q[0], q[1], i);
        const [d, e] = tx(q[2], q[3], i);
        const [f, g] = tx(q[4], q[5], i);
        out.push({ k: 'tri', pts: [a, c, d, e, f, g], role: p.role });
        break;
      }
    }
  });
  return out;
}

/** Frame counts a style can ask for; `t` for a frame is `index / count`. */
export type FrameCounts = Record<AnimName, number>;

/** Figure kind used for a monster type; heroes by weapon class. */
export function monsterFigure(type: MonsterTypeId, rarity: string): FigureKind {
  return rarity === 'boss' ? 'boss' : MONSTER_TYPES[type].body;
}

export function heroFigure(mainHandClass: string | undefined): FigureKind {
  switch (mainHandClass) {
    case 'mace2':
    case 'mace':
    case 'axe':
    case 'axe2':
      return 'hero_mace';
    case 'bow':
      return 'hero_bow';
    case 'wand':
    case 'sceptre':
    case 'staff':
      return 'hero_wand';
    case 'dagger':
    case 'claw':
      return 'hero_dagger';
    default:
      return 'hero_sword';
  }
}
