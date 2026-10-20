/**
 * How the passive tree is coloured and sized on screen (docs/TREE.md, "Look"). Pure functions, no DOM: a node's colour
 * follows what it gives, so a player can read a region of the tree at a glance without opening a tooltip.
 */
import type { Mod } from '../mods/types';
import type { TreeNode, TreeNodeKind } from '../data/tree';
import { isRingRoad } from '../data/tree/builder';

export type Tone =
  | 'life'
  | 'defence'
  | 'evasion'
  | 'es'
  | 'damage'
  | 'attack'
  | 'spell'
  | 'crit'
  | 'mana'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'chaos'
  | 'physical'
  | 'minion'
  | 'curse'
  | 'utility'
  | 'str'
  | 'dex'
  | 'int'
  | 'all';

export const TONE_COLOR: Record<Tone, string> = {
  life: '#e0604f',
  defence: '#a9b6c8',
  evasion: '#6fc46a',
  es: '#a8c8ff',
  damage: '#ece4d4',
  attack: '#e29a3c',
  spell: '#9b7bff',
  crit: '#f0d060',
  mana: '#4d8ef5',
  fire: '#f0703a',
  cold: '#5ccff0',
  lightning: '#f4ee58',
  chaos: '#c45ad6',
  physical: '#cdb08a',
  minion: '#44c8a8',
  curse: '#e6789e',
  utility: '#9aa2ac',
  str: '#d8654a',
  dex: '#6cc070',
  int: '#6a8cf0',
  all: '#d8d0b8',
};

/** A small emblem for each tone, drawn in a box of 22 units around the origin (our own shapes, no art), for notables and keystones. */
export const TONE_GLYPH: Record<Tone, string> = {
  life: 'M-3,-9H3V-3H9V3H3V9H-3V3H-9V-3H-3Z',
  defence: 'M0,-10L9,-6V1C9,6 4,9 0,11C-4,9 -9,6 -9,1V-6Z',
  evasion: 'M-9,7L0,-9L9,7L0,2Z',
  es: 'M0,-10.5A10.5,10.5 0 1 1 0,10.5A10.5,10.5 0 1 1 0,-10.5ZM0,-5.5A5.5,5.5 0 1 0 0,5.5A5.5,5.5 0 1 0 0,-5.5Z',
  damage:
    'M0,-11L2.5,-5.5L7.8,-7.8L5.5,-2.5L11,0L5.5,2.5L7.8,7.8L2.5,5.5L0,11L-2.5,5.5L-7.8,7.8L-5.5,2.5L-11,0L-5.5,-2.5L-7.8,-7.8L-2.5,-5.5Z',
  attack: 'M0,-11L3,-6V3H8V6H3V11H-3V6H-8V3H-3V-6Z',
  spell: 'M0,-11L2.6,-3.6H10.5L4.1,1.3L6.5,9L0,4.3L-6.5,9L-4.1,1.3L-10.5,-3.6H-2.6Z',
  crit: 'M0,-11L2.5,-2.5L11,0L2.5,2.5L0,11L-2.5,2.5L-11,0L-2.5,-2.5Z',
  mana: 'M0,-11C5,-4 8,0 8,4A8,8 0 0 1 -8,4C-8,0 -5,-4 0,-11Z',
  fire: 'M0,-11C3,-6 8,-3 8,3A8,8 0 0 1 -8,3C-8,-1 -5,-3 -3,-6C-2,-3 0,-4 0,-11Z',
  cold: 'M0,-11L2,-3L9,-6L5,0L9,6L2,3L0,11L-2,3L-9,6L-5,0L-9,-6L-2,-3Z',
  lightning: 'M3,-11L-6,1H-1L-3,11L7,-2H1Z',
  chaos: 'M-8,-8H-4L0,-3L4,-8H8L3,0L8,8H4L0,3L-4,8H-8L-3,0Z',
  physical: 'M0,-10L9,-5V5L0,10L-9,5V-5Z',
  minion: 'M-9,6L-9,-6L-4,0L0,-8L4,0L9,-6L9,6Z',
  curse: 'M5,-10A10,10 0 1 0 5,10A7,7 0 1 1 5,-10Z',
  utility: 'M-3,-10H3V-4L9,8A2,2 0 0 1 7,10H-7A2,2 0 0 1 -9,8L-3,-4Z',
  str: 'M0,-10L10,0L0,10L-10,0Z',
  dex: 'M0,-10L10,0L0,10L-10,0Z',
  int: 'M0,-10L10,0L0,10L-10,0Z',
  all: 'M0,-10L10,0L0,10L-10,0Z',
};

/** What each colour stands for, for the legend of the tree view (in the order it is listed). */
export const TONE_LABEL: [Tone, string][] = [
  ['life', 'Life and recovery'],
  ['defence', 'Armour, block, resistances'],
  ['evasion', 'Evasion and movement'],
  ['es', 'Energy shield'],
  ['mana', 'Mana and reservation'],
  ['damage', 'Damage of every kind'],
  ['attack', 'Attacks, weapons, accuracy'],
  ['spell', 'Spells and cast speed'],
  ['crit', 'Critical strikes, penetration'],
  ['fire', 'Fire'],
  ['cold', 'Cold'],
  ['lightning', 'Lightning'],
  ['chaos', 'Chaos, poison, damage over time'],
  ['physical', 'Physical and bleeding'],
  ['minion', 'Minions and deployables'],
  ['curse', 'Curses and auras'],
  ['utility', 'Flasks, charges, other'],
  ['str', 'Strength'],
  ['dex', 'Dexterity'],
  ['int', 'Intelligence'],
];

/** What one line of a node is about. */
function toneOfMod(m: Mod): Tone | null {
  const s = m.stat;
  if (s === 'str' || s === 'dex' || s === 'int') return s;
  if (s === 'allAttr') return 'all';
  if (s === 'damage') {
    const t = m.damageTypes?.[0];
    if (t === 'fire' || t === 'cold' || t === 'lightning' || t === 'chaos' || t === 'physical')
      return t;
    const tags: readonly string[] = m.tags ?? [];
    if (tags.includes('spell')) return 'spell';
    if (['minion', 'totem', 'trap', 'mine', 'brand'].some((x) => tags.includes(x))) return 'minion';
    for (const e of ['fire', 'cold', 'lightning'] as const) if (tags.includes(e)) return e;
    if (tags.includes('poison') || tags.includes('chaos')) return 'chaos';
    if (tags.includes('bleed')) return 'physical';
    if (tags.includes('dot')) return 'chaos';
    // Damage of no kind at all is for every build; anything else here (attacks, a weapon, melee, projectiles) is an attack's.
    return tags.length ? 'attack' : 'damage';
  }
  if (s === 'dotMulti') {
    const t = m.damageTypes?.[0];
    if (t === 'fire' || t === 'cold' || t === 'lightning' || t === 'physical') return t;
    return m.tags?.includes('bleed') ? 'physical' : 'chaos';
  }
  if (/^(life|leech\.life|lifeRegen|lifeOn|recover)/.test(s)) return 'life';
  if (/^(armour|block|physReduction|stun|enemyStun|shieldDef|resist|maxResist|damageTaken)/.test(s))
    return 'defence';
  if (/^(evasion|evade|dodge|moveSpeed)/.test(s)) return 'evasion';
  if (/^(critChance|critMulti|penetration|neverCrit)/.test(s)) return 'crit';
  if (/^(es|shieldEs|esRecharge|leechToES|regenToES)/.test(s)) return 'es';
  if (/^castSpeed/.test(s)) return 'spell';
  if (/^(mana|reducedReservation|cost|leech\.mana)/.test(s)) return 'mana';
  if (/^(minion|deploy|totem|trap|mine)/.test(s)) return 'minion';
  if (/^(curse|aura|hexLimit)/.test(s)) return 'curse';
  if (/^(flask|charge|maxCharges|buffOn)/.test(s)) return 'utility';
  if (/ignite|\.fire/.test(s)) return 'fire';
  if (/chill|freeze|\.cold/.test(s)) return 'cold';
  if (/shock|\.lightning/.test(s)) return 'lightning';
  if (/poison|chaos/.test(s)) return 'chaos';
  if (/bleed|impale|physical/.test(s)) return 'physical';
  if (/^(attackSpeed|accuracy|projectile|aoe|ailment)/.test(s)) return 'attack';
  return null;
}

/** The tone of a node: its first line that is not a plain attribute, else the attribute. */
export function toneOf(n: Pick<TreeNode, 'mods' | 'kind'>): Tone {
  let attr: Tone | null = null;
  for (const m of n.mods) {
    const t = toneOfMod(m);
    if (!t) continue;
    if (t === 'str' || t === 'dex' || t === 'int' || t === 'all') {
      attr ??= t;
      continue;
    }
    return t;
  }
  return attr ?? 'utility';
}

/** Radius of a node in tree units (also the reach of a tap). */
export const NODE_RADIUS: Record<TreeNodeKind, number> = {
  start: 34,
  keystone: 38,
  notable: 24,
  small: 10,
  travel: 8,
  hub: 10,
};

/** The smallest radius, in screen pixels, a node of each kind is drawn with however far the view is zoomed out. */
export const MIN_SCREEN_R: Record<TreeNodeKind, number> = {
  start: 12,
  keystone: 11.5,
  notable: 7.5,
  small: 3,
  travel: 2.6,
  hub: 3,
};

/** The zoom at which the minimum sizes apply in full; the whole tree in view uses a third of them. */
const FLOOR_FULL_K = 0.22;

/** The factor a kind's shape is enlarged by at zoom `k`, so that it keeps at least its minimum size on screen. */
export function shapeScale(kind: TreeNodeKind, k: number): number {
  const floor = MIN_SCREEN_R[kind] * Math.min(1, Math.max(0.35, k / FLOOR_FULL_K));
  return Math.max(1, floor / (NODE_RADIUS[kind] * k));
}

/** The zoom from which notable names are shown, and the zoom from which keystone names are. */
export const LABEL_K_NOTABLE = 0.4;
export const LABEL_K_KEYSTONE = 0.14;

/**
 * Area names (the hand-written tree's areas): set in tree units behind the nodes, like place names on a map, so they
 * shrink with the tree when it is zoomed out. `size` is the font size; `glyph` the width of an average letter as a share
 * of it, which the placement checks use (scripts/passives).
 */
export const AREA_LABEL = { size: 150, glyph: 0.58 } as const;
/** The width an area name takes, in tree units (an estimate: the checks pad it). */
export const areaLabelWidth = (name: string) => name.length * AREA_LABEL.size * AREA_LABEL.glyph;
/** The colour of an area's name, by the hand-written tree's region. */
export const AREA_COLOUR: Record<string, string> = {
  mystic: '#6a8cf0',
  shade: '#c45ad6',
  strider: '#6cc070',
  reaver: '#d8c07a',
  vanguard: '#d8654a',
  zealot: '#e6b060',
  centre: '#8a90a0',
};
/** The zoom up to which area names show in full, and the zoom by which they have faded out (before notable names show). */
export const AREA_K_FULL = LABEL_K_KEYSTONE;
export const AREA_K_GONE = 0.32;

/**
 * How strongly area names show at zoom `k`: in full when zoomed out, fading as the view closes in, gone before the
 * notables' names appear, so the names of places hand over to the names of nodes.
 */
export function areaLabelAlpha(k: number): number {
  if (k <= AREA_K_FULL) return 1;
  if (k >= AREA_K_GONE) return 0;
  const t = (k - AREA_K_FULL) / (AREA_K_GONE - AREA_K_FULL);
  return 1 - t * t * (3 - 2 * t);
}

/** The corner points of a regular octagon (a keystone's frame), as an SVG `points` value. */
export function octagon(r: number, turn = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = turn + (Math.PI * 2 * i) / 8 + Math.PI / 8;
    pts.push(`${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

/**
 * The SVG path of the line between two nodes: an arc about the centre of the loop they share, an arc about the middle of
 * the tree for a stretch of ring, otherwise a straight line. (Where the arc goes round is set by which way the angle runs.)
 */
export function edgePath(
  a: { x: number; y: number; orbit?: [number, number] },
  b: { x: number; y: number; orbit?: [number, number] },
): string {
  const move = `M${a.x} ${a.y}`;
  if (a.orbit && b.orbit && a.orbit[0] === b.orbit[0] && a.orbit[1] === b.orbit[1]) {
    const [cx, cy] = a.orbit;
    const r = (Math.hypot(a.x - cx, a.y - cy) + Math.hypot(b.x - cx, b.y - cy)) / 2;
    const cross = (a.x - cx) * (b.y - cy) - (a.y - cy) * (b.x - cx);
    return `${move}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${cross > 0 ? 1 : 0} ${b.x} ${b.y}`;
  }
  if (isRingRoad(a, b)) {
    const r = (Math.hypot(a.x, a.y) + Math.hypot(b.x, b.y)) / 2;
    const cross = a.x * b.y - a.y * b.x;
    return `${move}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${cross > 0 ? 1 : 0} ${b.x} ${b.y}`;
  }
  return `${move}L${b.x} ${b.y}`;
}
