// The centre's table (docs/tree/design/R-centre.md), written into src/data/passives/centre/ring.ts (the roads) and
// clusters.ts (the eight generic notables). Positions are absolute: (radius, degrees), Mystic at -90. Run with
// `npx tsx scripts/passives/rework/centre-gen.ts`, then retarget nothing: the seams link to `centre.ring.road.i<k>`.
import fs from 'fs';

const D = 'E:/Proj/Auto/.claude/worktrees/flask-scarcity/src/data/passives/centre/';
type P2 = [number, number];
const P = (r: number, deg: number): P2 => [
  Math.round(r * Math.cos((deg * Math.PI) / 180)),
  Math.round(r * Math.sin((deg * Math.PI) / 180)),
];
const q = (s: string) => JSON.stringify(s);

// The six borders, clockwise from the Mystic and Shade's; each pair's attributes (the union of both classes', two at most).
const BORDERS: {
  deg: number;
  pair: string;
  attrs: ('str' | 'dex' | 'int')[];
  seam: string;
  bend?: number;
}[] = [
  {
    deg: -60,
    pair: 'the Mystic and the Shade',
    attrs: ['int', 'dex'],
    seam: 'knife.home.seams.n',
    bend: -4,
  },
  {
    deg: 0,
    pair: 'the Shade and the Strider',
    attrs: ['dex', 'int'],
    seam: 'knife.home.seams.s',
    bend: 5,
  },
  {
    deg: 60,
    pair: 'the Strider and the Reaver',
    attrs: ['dex', 'str'],
    seam: 'bow.home.seams.s',
    bend: 3,
  },
  {
    deg: 120,
    pair: 'the Reaver and the Vanguard',
    attrs: ['str', 'dex'],
    seam: 'yard.home.seams.s',
  },
  {
    deg: 180,
    pair: 'the Vanguard and the Zealot',
    attrs: ['str', 'int'],
    seam: 'wall.home.seams.s',
  },
  {
    deg: 240,
    pair: 'the Zealot and the Mystic',
    attrs: ['int', 'str'],
    seam: 'spire.home.seams.w',
    bend: -6,
  },
];
// The class between border k and border k+1 (its start sits there), with its attributes.
const CLASSES: { name: string; attrs: ('str' | 'dex' | 'int')[] }[] = [
  { name: 'the Shade', attrs: ['dex', 'int'] },
  { name: 'the Strider', attrs: ['dex'] },
  { name: 'the Reaver', attrs: ['str', 'dex'] },
  { name: 'the Vanguard', attrs: ['str'] },
  { name: 'the Zealot', attrs: ['str', 'int'] },
  { name: 'the Mystic', attrs: ['int'] },
];
const attrLines = (a: ('str' | 'dex' | 'int')[]) =>
  a.length === 1 ? `${a[0]}(7)` : a.map((x) => `${x}(6)`).join(', ');

const R_IN = 1250; // the inner road's node between the seam and the junction
const R_J = 950; // the junctions (the hexagon's corners)
const R_SPOKE = 475; // the spoke's node between a junction and the middle
const SPOKES = [1, 3, 5]; // borders 0, 120 and 240

// ---- The roads (ring.ts).
const nodes: string[] = [];
const links: [string, string][] = [];
const ext: { from: string; to: string; why: string }[] = [];
BORDERS.forEach((b, k) => {
  nodes.push(
    `        { id: 'i${k}', kind: 'attribute', lines: [${attrLines(b.attrs)}], at: [${P(R_IN, b.deg + (b.bend ?? 0))}], why: ${q(`The inner road along the border of ${b.pair}, between their seam and the junction.`)} },`,
  );
  nodes.push(
    `        { id: 'j${k}', kind: 'attribute', lines: [${attrLines(b.attrs)}], at: [${P(R_J, b.deg)}], why: ${q(`The junction of ${b.pair}: their generic notable hangs here.`)} },`,
  );
  const c = CLASSES[k];
  const mid = P(R_J * Math.cos(Math.PI / 6), b.deg + 30);
  nodes.push(
    `        { id: 'h${k}', kind: 'attribute', lines: [${attrLines(c.attrs)}], at: [${mid}], why: ${q(`The inner ring under ${c.name}'s start, between two junctions.`)} },`,
  );
  links.push([`i${k}`, `j${k}`], [`j${k}`, `h${k}`], [`h${k}`, `j${(k + 1) % 6}`]);
  ext.push({
    from: b.seam,
    to: `road.i${k}`,
    why: `The seam of ${b.pair}, inward along their border to the centre.`,
  });
});
for (const k of SPOKES) {
  nodes.push(
    `        { id: 's${k}', kind: 'attribute', lines: [allAttr(4)], at: [${P(R_SPOKE, BORDERS[k].deg)}], why: ${q('An inner spoke to the middle, from every other junction: every start reaches the middle through the junction on one of its borders.')} },`,
  );
  links.push([`j${k}`, `s${k}`], [`s${k}`, 'm']);
}
nodes.push(
  `        { id: 'm', kind: 'attribute', lines: [allAttr(5)], at: [0, 0], why: ${q('The middle: the two notables every class shares hang from it.')} },`,
);

const ring = `/**
 * The centre's roads (docs/tree/design/R-centre.md, written by scripts/passives/rework/centre-gen.ts): six inner roads,
 * one along each border from the pair's seam to a junction at radius ${R_J}, an inner ring (a hexagon) joining the
 * junctions, and three spokes from every other junction to the middle. Attribute nodes carry the attributes of the
 * classes either side. The generic notables are in \`clusters.ts\`.
 */
import { allAttr, dex, int, str } from '../lines';
import type { AreaSpec } from '../types';

export const ring: AreaSpec = {
  id: 'centre.ring',
  region: 'centre',
  name: 'The crossroads',
  why:
    'Generic ground between all six starts, about as far from each: a pair of neighbours walks in from its seam to its ' +
    'junction, and every class reaches the middle through the junction on one of its borders.',
  at: [0, -620],
  clusters: [
    {
      id: 'road',
      name: 'The inner roads',
      why: 'One cluster so that the centre is one place; its nodes are the centre\\'s only roads.',
      at: [0, 0],
      shape: { kind: 'hand' },
      nodes: [
${nodes.join('\n')}
      ],
      links: [${links.map(([a, b]) => `['${a}', '${b}']`).join(', ')}],
    },
  ],
  links: [
    // The seams link here from their own regions (a link is written once): ${ext.map((e) => e.from).join(', ')}.
  ],
};
`;

// ---- The eight notables (clusters.ts): one at each junction, two at the middle.
type G = { id: string; name: string; lines: string; small: string; why: string; smallWhy: string };
const AT_JUNCTION: G[] = [
  // Each one is what neither home sells within four steps of that seam (R-centre.md §5 lists them).
  {
    id: 'firmFooting',
    name: 'Firm Footing',
    lines: 'stunAvoid(50), stunRecovery(30)',
    small: 'stunAvoid(15)',
    why: 'Stun protection, which neither home sells by this seam (Hale Scribe, Spoils, Hoarded Breath and Low Tide sell life, mana and energy shield): priced as a home generalist (it sits 10 to 15 steps from every start).',
    smallWhy: 'Stun avoidance on the way in.',
  },
  {
    id: 'hardLiving',
    name: 'Hard Living',
    lines: 'lifeOnHit(10), lifeOnKill(20)',
    small: 'lifeOnKill(8)',
    why: 'Life on hit and on kill, which neither home sells by this seam (Clear Head, Soft Step, Grey Cloak and Ward of Smoke sell mana, evasion and resistances): priced as a home generalist (it sits 10 to 15 steps from every start).',
    smallWhy: 'Life on kill on the way in.',
  },
  {
    id: 'wasteNot',
    name: 'Waste Not',
    lines: 'costReduction(10), manaOnKill(15)',
    small: 'costReduction(3)',
    why: 'Cheaper skills and mana on kill, which neither home sells by this seam (Quick Sip, Killing Pace, Wanderer and Thirsty Quiver sell flasks, speed, attributes and leech): priced as a home generalist (it sits 10 to 15 steps from every start).',
    smallWhy: 'Cheaper skills on the way in.',
  },
  {
    id: 'soundBody',
    name: 'Sound Body',
    lines: "resOne('chaos', 25), avoidAilments(20)",
    small: "resOne('chaos', 8)",
    why: 'Chaos resistance and ailments shrugged off, which neither home sells by this seam (Ringing Blows, Guarded and Vampiric Strikes sell melee damage, armour, evasion and leech): priced as a home generalist (it sits 10 to 15 steps from every start).',
    smallWhy: 'Chaos resistance on the way in.',
  },
  {
    id: 'quickMarch',
    name: 'Quick March',
    lines: 'moveSpeed(10), cooldownRecovery(15)',
    small: 'moveSpeed(3)',
    why: 'Movement and cooldowns, which neither home sells by this seam (Camp Stores, Vigil, Alms and Iron Lungs sell flasks, regeneration, leech and mana): priced as a home generalist (it sits 10 to 15 steps from every start).',
    smallWhy: 'Movement on the way in.',
  },
  {
    id: 'shelter',
    name: 'Shelter',
    lines: 'resAll(12), life(8)',
    small: 'resAll(4)',
    why: 'Resistances, which neither home sells by this seam (Draught, Bright Omen, Kept Vows and Quickening sell flasks, damage, auras and recharge): priced as a home generalist (it sits 10 to 15 steps from every start).',
    smallWhy: 'Resistances on the way in.',
  },
];
const AT_MIDDLE: (G & { deg: number })[] = [
  {
    id: 'wellRounded',
    name: 'Well Rounded',
    lines: 'allAttr(12), life(8)',
    small: 'allAttr(3)',
    why: 'Attributes every build needs for its gear, at the middle: as far from every start: priced as a home generalist (it sits 10 to 15 steps from every start).',
    smallWhy: 'Attributes on the way in.',
    deg: 180,
  },
  {
    id: 'provisions',
    name: 'Provisions',
    lines: 'flaskEffect(12), flaskRecovery(15), manaRegen(10)',
    small: 'flaskRecovery(8)',
    why: 'Flasks, the attrition lever, at the middle: as far from every start: priced as a home generalist; provisional until the flask stats (CONSTRAINTS §16.2).',
    smallWhy: 'Flask recovery on the way in.',
    deg: 60,
  },
];
const clusters: string[] = [];
const clinks: { from: string; to: string; why: string }[] = [];
AT_JUNCTION.forEach((g, k) => {
  const b = BORDERS[k];
  const a = P(720, b.deg + 8);
  const n = P(590, b.deg + 14);
  clusters.push(`    {
      id: '${g.id}',
      name: ${q(g.name)},
      why: ${q(`At the junction of ${b.pair}, a side room toward the middle.`)},
      at: [${n}],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [${g.small}], at: [${a}], why: ${q(g.smallWhy)} },
        { id: 'n', kind: 'notable', name: ${q(g.name)}, lines: [${g.lines}], at: [${n}], why: ${q(g.why)} },
      ],
      links: [['a', 'n']],
    },`);
  clinks.push({
    from: `centre.ring.road.j${k}`,
    to: `${g.id}.a`,
    why: `The junction of ${b.pair} opens onto its notable.`,
  });
});
for (const g of AT_MIDDLE) {
  const a = P(150, g.deg);
  const n = P(280, g.deg);
  clusters.push(`    {
      id: '${g.id}',
      name: ${q(g.name)},
      why: 'At the middle, shared by every class.',
      at: [${n}],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [${g.small}], at: [${a}], why: ${q(g.smallWhy)} },
        { id: 'n', kind: 'notable', name: ${q(g.name)}, lines: [${g.lines}], at: [${n}], why: ${q(g.why)} },
      ],
      links: [['a', 'n']],
    },`);
  clinks.push({
    from: 'centre.ring.road.m',
    to: `${g.id}.a`,
    why: 'The middle opens onto its notable.',
  });
}
const cl = `/**
 * The centre's generic notables (docs/tree/design/R-centre.md, written by scripts/passives/rework/centre-gen.ts): one at
 * each junction for the pair of classes either side, two at the middle for every class. Generic sustain and utility
 * only (the owner's decision 7 of 2026-10-19), no keystones. They sit 10 to 15 steps from every start, so each is priced as
 * a home generalist (about 4 units): a build walks this far only for a notable worth the points.
 */
import {
  allAttr,
  avoidAilments,
  cooldownRecovery,
  costReduction,
  flaskEffect,
  flaskRecovery,
  life,
  lifeOnHit,
  lifeOnKill,
  manaOnKill,
  manaRegen,
  moveSpeed,
  resAll,
  resOne,
  stunAvoid,
  stunRecovery,
} from '../lines';
import type { AreaSpec } from '../types';

export const clusters: AreaSpec = {
  id: 'centre.inner',
  region: 'centre',
  name: 'The common ground',
  why: 'Eight generic notables: one at each junction for the pair of classes either side, two at the middle for every class.',
  at: [0, 620],
  clusters: [
${clusters.join('\n')}
  ],
  links: [
${clinks.map((e) => `    { from: '${e.from}', to: '${e.to}', why: ${q(e.why)} },`).join('\n')}
  ],
};
`;
fs.writeFileSync(D + 'ring.ts', ring);
fs.writeFileSync(D + 'clusters.ts', cl);
console.log('written ring.ts, clusters.ts');
