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

/** Pose for an animation at normalised time `t` (walk/idle loop 0..1; attack and death run 0..1). */
export function poseFor(kind: FigureKind, anim: AnimName, t: number): Pose {
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
      break;
    }
    case 'attack': {
      // Anticipation (0-0.4), strike (0.4-0.6), follow-through and recovery (0.6-1).
      const wind = ease(clamp01(t / 0.4));
      const strike = ease(clamp01((t - 0.4) / 0.2));
      const rec = ease(clamp01((t - 0.6) / 0.4));
      if (isRanged(kind)) {
        p.charge = wind * (1 - strike);
        p.armA = lerp(0.2, 1.5, wind) * (1 - strike) + 1.55 * strike;
        p.armB = lerp(-0.2, -1.2, wind) * (1 - strike) + lerp(-0.1, -0.3, strike) * strike;
        p.lean = lerp(0, -1.5, wind) * (1 - strike) + 0.5 * strike;
        p.weapon = 0;
        p.legA = 0.3;
        p.legB = -0.35;
        p.armA = lerp(p.armA, 0.25, rec);
        p.armB = lerp(p.armB, -0.25, rec);
      } else if (isCaster(kind)) {
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
      break;
    }
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

/** Build the primitives of a figure in a pose (back to front). */
export function buildFigure(kind: FigureKind, pose: Pose): Prim[] {
  const B_ = BUILDS[kind];
  const b: B = { prims: [] };
  const hero = isHero(kind);
  const boneRole: Role = hero ? 'cloth' : 'bone';
  const shadeRole: Role = hero ? 'clothShade' : 'boneShade';
  const hipY = -B_.legLen * 2 + pose.bob;
  const hipX = 0;
  const shY = hipY - B_.torsoH;
  const shX = pose.lean;
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
  // Scale, rotation and scatter.
  const out: Prim[] = [];
  const s = B_.scale;
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
  b.prims.forEach((p, i) => {
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
export function monsterFigure(
  type: 'warrior' | 'brute' | 'archer' | 'mage',
  rarity: string,
): FigureKind {
  return rarity === 'boss' ? 'boss' : type;
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
