// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// Writes the Knife's area files for the attrition rework (docs/tree/design/R-knife.md) from a hand-made table: the roads
// node by node, and for every cluster its area, place, entrance and the road node it hangs from. Each cluster keeps its
// nodes, lines and shape from today's files (rotated so its entrance faces its road). Run once from the backed-up files.
import fs from 'fs';
const ROOT = 'E:/Proj/Auto/.claude/worktrees/flask-scarcity/';
const R = 'file:///' + ROOT + 'src/';
const { buildAll } = await import(R + 'data/passives/index.ts');
const mods: Record<string, any> = {
  home: (await import(R + 'data/passives/knife/home.ts')).home,
  edge: (await import(R + 'data/passives/knife/edge.ts')).edge,
  venom: (await import(R + 'data/passives/knife/venom.ts')).venom,
  hex: (await import(R + 'data/passives/knife/hex.ts')).hex,
  snares: (await import(R + 'data/passives/knife/snares.ts')).snares,
  roofs: (await import(R + 'data/passives/knife/roofs.ts')).roofs,
  rim: (await import(R + 'data/passives/knife/rim.ts')).seawall,
};
const built = buildAll({ allowNew: true });
const posOf = (full: string): [number, number] => {
  const n = built.registry[full];
  if (n === undefined) throw new Error('no node ' + full);
  return [built.tree.nodes[n].x, built.tree.nodes[n].y];
};
const oldCluster = (key: string) => {
  const [area, id] = key.split('.');
  const c = mods[area].clusters.find((x: any) => x.id === id);
  if (!c) throw new Error('no cluster ' + key);
  return c;
};

// ---- Geometry: polar from the tree's centre, offsets from the Knife's angle (-30); straight segments between points.
const TH = -30;
const K = (r: number, d: number): [number, number] => {
  const a = ((TH + d) * Math.PI) / 180;
  return [Math.round(r * Math.cos(a)), Math.round(r * Math.sin(a))];
};
const lerp = (p: [number, number], q: [number, number], t: number): [number, number] => [
  Math.round(p[0] + (q[0] - p[0]) * t),
  Math.round(p[1] + (q[1] - p[1]) * t),
];
const A = (r: number, d: number) => K(r, d);

// ---- The roads (all +6/+6 dexterity and intelligence; the hubs +15/+15).
type RoadNode = {
  id: string;
  at: [number, number];
  hub?: boolean;
  lines?: string;
  kind?: string;
  why?: string;
};
type Road = {
  area: string;
  id: string;
  name: string;
  why: string;
  nodes: RoadNode[];
  links: [string, string][];
};
const roads: Road[] = [];
const S0 = K(1450, 0);
const hubN = K(1690, -5),
  hubS = K(1690, 5);
const xN = K(2050, -11.7),
  xS = K(2050, 11.7);
const mN1 = K(2900, -13),
  mS1 = K(2900, 13),
  mN0 = K(2900, -30),
  mS0 = K(2900, 30);
const rN1 = K(4300, -13),
  rS1 = K(4300, 13),
  rN0 = K(4300, -30),
  rS0 = K(4300, 30);
const seamN = K(1600, -30),
  seamS = K(1600, 30);
const bendN = K(1780, -19),
  bendS = K(1780, 19);
(void bendN, bendS);
roads.push({
  area: 'home',
  id: 'sig',
  name: 'The two sides',
  why: "The start's two exits, each a strong small that suits every Shade build, as the reference's starts open (owner, 2026-10-30): damage with life toward the Spire, crit with life toward the Bow. Each opens three ways at the next step.",
  nodes: [
    {
      id: 'a',
      at: K(1530, -6),
      kind: 'small',
      lines: 'allDamage(12), life(5)',
      why: 'The north side: damage of every kind, and life. 2 units.',
    },
    {
      id: 'b',
      at: K(1530, 6),
      kind: 'small',
      lines: 'critChance(15), life(5)',
      why: 'The south side: crit, and life. 2 units.',
    },
  ],
  links: [],
});
roads.push({
  area: 'home',
  id: 'hubs',
  name: 'The hubs',
  why: 'Both attributes, a step past each side: each forks into the spoke out into the region and the road in to Keen Instinct.',
  nodes: [
    { id: 'n', at: hubN, hub: true },
    { id: 's', at: hubS, hub: true },
  ],
  links: [],
});
roads.push({
  area: 'home',
  id: 'pathN',
  name: 'The north path',
  why: 'The third way out of the north side: two more damage nodes along the bow toward the Spire seam, into Spoils on the way.',
  nodes: [
    { id: 'a', at: K(1590, -13), kind: 'small', lines: 'allDamage(10)' },
    { id: 'b', at: K(1690, -17), kind: 'small', lines: 'allDamage(10)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home',
  id: 'pathS',
  name: 'The south path',
  why: 'The third way out of the south side: two more crit nodes along the bow toward the Bow seam, into Soft Step on the way.',
  nodes: [
    { id: 'a', at: K(1590, 13), kind: 'small', lines: 'critChance(15)' },
    { id: 'b', at: K(1690, 17), kind: 'small', lines: 'critChance(15)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home',
  id: 'seams',
  name: 'The seams',
  why: "Where the Knife's roads meet its neighbours': the Spire's on the north border, the Bow's on the south. Each runs on along the border into the centre and out to the mid ring.",
  nodes: [
    { id: 'n', at: seamN },
    { id: 's', at: seamS },
  ],
  links: [],
});
roads.push({
  area: 'home',
  id: 'spN',
  name: 'The north spoke',
  why: 'The north spoke from its hub to the junction with the cross-link.',
  nodes: [
    { id: 'a', at: lerp(hubN, xN, 0.5) },
    { id: 'x', at: xN },
  ],
  links: [['a', 'x']],
});
roads.push({
  area: 'home',
  id: 'spS',
  name: 'The south spoke',
  why: 'The south spoke from its hub to the junction with the cross-link.',
  nodes: [
    { id: 'a', at: lerp(hubS, xS, 0.5) },
    { id: 'x', at: xS },
  ],
  links: [['a', 'x']],
});
roads.push({
  area: 'home',
  id: 'cross',
  name: 'The roads to Keen Instinct',
  why: 'From each hub two stat nodes in to Keen Instinct on the axis (step 5), so the home notable is reached from either side: life on the north road, resistances on the south. Defences every Shade build takes, not bare attributes (movement was here, and too much of it near the start: the owner, 2026-10-31).',
  nodes: [
    { id: 'n1', at: K(1800, -3.4), kind: 'small', lines: 'life(5)' },
    { id: 'n2', at: K(1925, -1.7), kind: 'small', lines: 'life(5)' },
    { id: 's1', at: K(1800, 3.4), kind: 'small', lines: 'resAll(4)' },
    { id: 's2', at: K(1925, 1.7), kind: 'small', lines: 'resAll(4)' },
  ],
  links: [
    ['n1', 'n2'],
    ['s1', 's2'],
  ],
});
roads.push({
  area: 'hex',
  id: 'radN',
  name: 'The north border road',
  why: 'From the Spire seam out along the border to the mid ring: the ground between the two regions beyond the starts.',
  nodes: [
    { id: 'a', at: lerp(seamN, mN0, 1 / 3) },
    { id: 'b', at: lerp(seamN, mN0, 2 / 3) },
    { id: 'm', at: mN0 },
  ],
  links: [
    ['a', 'b'],
    ['b', 'm'],
  ],
});
roads.push({
  area: 'snares',
  id: 'radS',
  name: 'The south border road',
  why: 'From the Bow seam out along the border to the mid ring.',
  nodes: [
    { id: 'a', at: lerp(seamS, mS0, 1 / 3) },
    { id: 'b', at: lerp(seamS, mS0, 2 / 3) },
    { id: 'm', at: mS0 },
  ],
  links: [
    ['a', 'b'],
    ['b', 'm'],
  ],
});
roads.push({
  area: 'venom',
  id: 'spN',
  name: 'The north spoke, outer',
  why: 'The north spoke from the cross-link junction out to the mid ring and on toward the rim.',
  nodes: [
    { id: 'a', at: lerp(xN, mN1, 1 / 3) },
    { id: 'b', at: lerp(xN, mN1, 2 / 3) },
    { id: 'm', at: mN1 },
    { id: 'c', at: lerp(mN1, rN1, 0.5) },
  ],
  links: [
    ['a', 'b'],
    ['b', 'm'],
    ['m', 'c'],
  ],
});
roads.push({
  area: 'edge',
  id: 'spS',
  name: 'The south spoke, outer',
  why: 'The south spoke from the cross-link junction out to the mid ring.',
  nodes: [
    { id: 'a', at: lerp(xS, mS1, 1 / 3) },
    { id: 'b', at: lerp(xS, mS1, 2 / 3) },
    { id: 'm', at: mS1 },
  ],
  links: [
    ['a', 'b'],
    ['b', 'm'],
  ],
});
roads.push({
  area: 'snares',
  id: 'spS',
  name: 'The south spoke, beyond the mid ring',
  why: 'The south spoke from the mid ring toward the rim.',
  nodes: [{ id: 'c', at: lerp(mS1, rS1, 0.5) }],
  links: [],
});
roads.push({
  area: 'hex',
  id: 'ring',
  name: 'The mid ring, north',
  why: "The mid ring's stretch between the north border and the north spoke.",
  nodes: [{ id: 'a', at: lerp(mN0, mN1, 0.5) }],
  links: [],
});
roads.push({
  area: 'venom',
  id: 'ring',
  name: 'The mid ring, centre north',
  why: "The mid ring's stretch from the north spoke toward the axis.",
  nodes: [
    { id: 'a', at: lerp(mN1, mS1, 0.25) },
    { id: 'b', at: lerp(mN1, mS1, 0.5) },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'edge',
  id: 'ring',
  name: 'The mid ring, centre south',
  why: "The mid ring's stretch from the axis to the south spoke.",
  nodes: [{ id: 'a', at: lerp(mN1, mS1, 0.75) }],
  links: [],
});
roads.push({
  area: 'snares',
  id: 'ring',
  name: 'The mid ring, south',
  why: "The mid ring's stretch between the south spoke and the south border.",
  nodes: [{ id: 'a', at: lerp(mS1, mS0, 0.5) }],
  links: [],
});
{
  // Thinned (the owner, 2026-10-30): 8 nodes between the vertices, from 11.
  const rim: RoadNode[] = [{ id: 'n0', at: rN0 }];
  let q = 0;
  for (const t of [1 / 3, 2 / 3]) rim.push({ id: `q${++q}`, at: lerp(rN0, rN1, t) });
  rim.push({ id: 'n1', at: rN1 });
  for (const t of [0.2, 0.4, 0.6, 0.8]) rim.push({ id: `q${++q}`, at: lerp(rN1, rS1, t) });
  rim.push({ id: 's1', at: rS1 });
  for (const t of [1 / 3, 2 / 3]) rim.push({ id: `q${++q}`, at: lerp(rS1, rS0, t) });
  rim.push({ id: 's0', at: rS0 });
  const links: [string, string][] = [];
  for (let i = 1; i < rim.length; i++) links.push([rim[i - 1].id, rim[i].id]);
  roads.push({
    area: 'rim',
    id: 'ring',
    name: 'The rim ring',
    why: 'The rim ring across the Knife, from the Spire border to the Bow border.',
    nodes: rim,
    links,
  });
}

// ---- Clusters moved from today's files: [old area.cluster, new area, new id, place, entrance node(s) and road node(s), why].
type Move = {
  from: string;
  area: string;
  id?: string;
  at: [number, number];
  entry: [string, string][];
  why: string;
  ats?: Record<string, [number, number]>;
};
const M: Move[] = [
  // Home: steps 4 to 8, general. Spoils and Soft Step sit on the paths to the seams, placed by hand along the bow.
  {
    from: 'home.spoils',
    area: 'home',
    at: A(1780, -23),
    ats: { a: A(1775, -19.5), n: A(1810, -23), b: A(1750, -26.8) },
    entry: [
      ['a', 'knife.home.pathN.b'],
      ['n', 'knife.home.seams.n'],
    ],
    why: 'Mana regeneration, mana on kill and flask recovery, on the north path to the Spire seam (step 5): the path runs through it.',
  },
  {
    from: 'home.softStep',
    area: 'home',
    at: A(1780, 23),
    ats: { a: A(1775, 19.5), n: A(1810, 23), b: A(1750, 26.8) },
    entry: [
      ['a', 'knife.home.pathS.b'],
      ['n', 'knife.home.seams.s'],
    ],
    why: 'Evasion, movement and a little dodge, on the south path to the Bow seam (step 5): the path runs through it.',
  },
  {
    from: 'home.roadB',
    area: 'home',
    id: 'quick',
    at: A(2265, 0),
    entry: [['a', 'knife.home.keen.n']],
    why: 'Attack speed: a side room off Keen Instinct, straight out along the axis.',
  },
  {
    from: 'edge.thickBlood',
    area: 'home',
    at: A(2130, -20.5),
    entry: [['a', 'knife.home.spN.x']],
    why: 'Life and chaos resistance, off the north spoke at its junction (step 5), linked across to Spoils.',
  },
  {
    from: 'edge.star',
    area: 'home',
    at: A(2130, 20.5),
    entry: [['w', 'knife.home.spS.x']],
    why: 'The resist star, off the south spoke at its junction (step 5), linked across to Soft Step.',
  },
  {
    from: 'venom.breath',
    area: 'home',
    at: A(1380, -25),
    entry: [['e2', 'knife.home.seams.n']],
    why: 'Energy shield and mana on the seam with the Spire, for the Shade and the Mystic alike: a side room toward the centre.',
  },
  {
    from: 'snares.cloak',
    area: 'home',
    at: A(1380, 25),
    entry: [['e', 'knife.home.seams.s']],
    why: 'Evasion and energy shield on the seam with the Bow, for the Shade and the Strider alike.',
  },
  // North, the caster's half.
  {
    from: 'home.quietKnife',
    area: 'venom',
    at: A(2550, -8),
    entry: [['a', 'knife.venom.spN.b']],
    why: 'The first dagger spells, step 9: a side room off the north spoke toward the axis.',
  },
  {
    from: 'venom.wheel',
    area: 'venom',
    at: A(3150, -6),
    entry: [
      ['v1', 'knife.venom.ring.a'],
      ['v4', 'knife.venom.spN.c'],
    ],
    why: 'The Rookery wheel: poison one side, energy shield the other, between the mid ring and the north spoke.',
  },
  {
    from: 'venom.secondCurse',
    area: 'venom',
    at: A(2600, -1),
    entry: [['a', 'knife.venom.ring.b']],
    why: 'A second curse, a side room in from the mid ring at the axis.',
  },
  {
    from: 'venom.shadeLeech',
    area: 'venom',
    at: A(3600, -17),
    entry: [['a', 'knife.venom.spN.c']],
    why: 'Keystone, a spur off the north spoke past the mid ring, step 11.',
  },
  {
    from: 'venom.cruelAgony',
    area: 'venom',
    at: A(3300, 0.5),
    entry: [['a', 'knife.venom.ring.b']],
    why: 'Keystone, a spur out from the mid ring along the axis, step 12.',
  },
  {
    from: 'hex.static',
    area: 'venom',
    at: A(3600, -9.5),
    entry: [['a', 'knife.venom.spN.c']],
    why: 'Lightning with crit and shock, off the north spoke past the mid ring.',
  },
  {
    from: 'hex.ward',
    area: 'hex',
    at: A(2400, -26),
    entry: [['e2', 'knife.hex.radN.a']],
    why: 'Energy shield and spell dodge, off the north border road.',
  },
  {
    from: 'hex.wheel',
    area: 'hex',
    at: A(2650, -21),
    entry: [['s', 'knife.hex.ring.a']],
    why: 'Chaos spells or mines, the two sides of the Stair: in from the mid ring between the border and the spoke.',
  },
  {
    from: 'hex.spellslip',
    area: 'hex',
    at: A(2720, -27),
    entry: [['a', 'knife.hex.radN.b']],
    why: 'Keystone, a spur off the north border road, step 12.',
  },
  {
    from: 'hex.bloodletter',
    area: 'hex',
    at: A(3150, -19.5),
    entry: [['a', 'knife.hex.ring.a']],
    why: 'Life leech and crit multiplier, out from the mid ring.',
  },
  {
    from: 'hex.wiry',
    area: 'hex',
    at: A(3370, -27),
    entry: [['l3', 'knife.hex.radN.m']],
    why: 'Life and evasion, a chain out from where the border road meets the mid ring.',
  },
  {
    from: 'hex.powder',
    area: 'hex',
    at: A(4000, -26),
    entry: [['a', 'knife.rim.ring.q1']],
    why: 'Mines and area, in from the rim ring.',
  },
  {
    from: 'roofs.wish',
    area: 'roofs',
    at: A(3550, -3),
    entry: [['u2', 'knife.venom.wheel.v4']],
    why: "Curses and chaos over time, on from the Rookery wheel's far side.",
  },
  {
    from: 'roofs.athame',
    area: 'roofs',
    at: A(3950, -5),
    entry: [['t', 'knife.rim.ring.q4']],
    why: 'The dagger wheel: spells one side, attacks the other, in from the rim ring.',
  },
  {
    from: 'roofs.salt',
    area: 'roofs',
    at: A(4000, -10.5),
    entry: [['p2', 'knife.rim.ring.q3']],
    why: 'Spells against cursed enemies, in from the rim ring.',
  },
  {
    from: 'roofs.hasty',
    area: 'roofs',
    at: A(3950, 0.5),
    entry: [['a', 'knife.rim.ring.q4']],
    why: 'Spell damage and spell dodge, in from the rim ring.',
  },
  {
    from: 'roofs.ritual',
    area: 'roofs',
    at: A(4000, -19),
    entry: [['a', 'knife.rim.ring.q2']],
    why: 'Dagger spells and energy shield, in from the rim ring.',
  },
  // South, the attacker's half.
  {
    from: 'edge.wheel',
    area: 'edge',
    at: A(2650, 8),
    entry: [['w1', 'knife.edge.spS.b']],
    why: 'Daggers or claws, the two sides of one wheel, step 9: in from the south spoke toward the axis.',
  },
  {
    from: 'snares.quietShot',
    area: 'edge',
    at: A(3150, 17),
    entry: [['a', 'knife.edge.spS.m']],
    why: "The Knife's bows, facing the Bow: out from where the south spoke meets the mid ring.",
  },
  {
    from: 'snares.smear',
    area: 'edge',
    at: A(3650, 4),
    entry: [['d', 'knife.snares.wheel.t4']],
    why: "Daggers with poison, on from the Docks wheel's far side.",
  },
  {
    from: 'snares.frost',
    area: 'edge',
    at: A(3650, 10),
    entry: [['k2', 'knife.snares.spS.c']],
    why: 'Cold attacks and crit, off the south spoke past the mid ring.',
  },
  {
    from: 'snares.wheel',
    area: 'snares',
    at: A(3350, 7),
    entry: [['t1', 'knife.edge.ring.a']],
    why: 'Traps or minions, the Docks wheel, out from the mid ring.',
  },
  {
    from: 'snares.mercy',
    area: 'snares',
    at: A(3500, 20),
    entry: [['a', 'knife.snares.ring.a']],
    why: 'Dagger and claw crit, out from the mid ring.',
  },
  {
    from: 'snares.tumble',
    area: 'snares',
    at: A(3150, 26),
    entry: [['a', 'knife.snares.ring.a']],
    why: 'Dodge, out from the mid ring near the border.',
  },
  {
    from: 'snares.herald',
    area: 'snares',
    at: A(3550, 27.5),
    entry: [['a', 'knife.snares.radS.m']],
    why: 'Reservation and evasion, out from where the border road meets the mid ring.',
  },
  {
    from: 'edge.nimble',
    area: 'snares',
    at: A(2720, 27),
    entry: [['a', 'knife.snares.radS.b']],
    why: 'Keystone, a spur off the south border road, step 12.',
  },
  {
    from: 'edge.rake',
    area: 'snares',
    at: A(3850, 20),
    entry: [['a', 'knife.snares.spS.c']],
    why: 'Claws with attack speed, off the south spoke past the mid ring; apart from Talon.',
  },
  {
    from: 'roofs.carrion',
    area: 'roofs',
    at: A(4000, 5),
    entry: [['a', 'knife.rim.ring.q5']],
    why: 'Claws with chaos, in from the rim ring.',
  },
  {
    from: 'roofs.ribs',
    area: 'roofs',
    at: A(4000, 10),
    entry: [['d2', 'knife.rim.ring.q6']],
    why: 'Dagger crit, in from the rim ring; apart from Long Knives.',
  },
  {
    from: 'rim.feint',
    area: 'roofs',
    at: A(3950, 16.5),
    entry: [['g2', 'knife.rim.ring.q7']],
    why: 'Dual wielding and dodge, in from the rim ring.',
  },
  // The rim.
  {
    from: 'roofs.whet',
    area: 'rim',
    at: A(4550, -7),
    entry: [['a', 'knife.rim.ring.q3']],
    why: 'Physical spells and duration, out from the rim ring.',
  },
  {
    from: 'rim.glint',
    area: 'rim',
    at: A(4550, 0),
    entry: [['a', 'knife.rim.ring.q4']],
    why: 'Spell crit and insight, out from the rim ring.',
  },
  {
    from: 'roofs.sleet',
    area: 'rim',
    at: A(4550, 6),
    entry: [['a', 'knife.rim.ring.q5']],
    why: 'Cold spells and projectiles, out from the rim ring.',
  },
  {
    from: 'rim.grudge',
    area: 'rim',
    at: A(4550, -19),
    entry: [
      ['a', 'knife.rim.ring.q1'],
      ['b', 'knife.rim.ring.q2'],
    ],
    why: 'Curses and reservation, out from the rim ring, a loop through two of its nodes.',
  },
  {
    from: 'snares.legs',
    area: 'rim',
    at: A(4550, 28),
    entry: [['l2', 'knife.rim.ring.q8']],
    why: 'Life and dodge, out from the rim ring.',
  },
  {
    from: 'rim.rot',
    area: 'rim',
    at: A(4550, 22),
    entry: [['a', 'knife.rim.ring.q7']],
    why: 'Poison and attack speed, out from the rim ring.',
  },
];
// Keen Instinct: its own cluster now, on the cross-link.
const keen = { area: 'home', id: 'keen', from: 'home.sig', node: 'n', at: K(2050, 0) };

// ---- Links between roads (and to the start, the centre and the clusters above).
const L: [string, string, string][] = [
  ['start.shade', 'knife.home.sig.a', 'Point one, the north side.'],
  ['start.shade', 'knife.home.sig.b', 'Point one, the south side.'],
  ['knife.home.sig.a', 'knife.home.hubs.n', 'Point two: the north hub.'],
  ['knife.home.sig.b', 'knife.home.hubs.s', 'Point two: the south hub.'],
  ['knife.home.sig.a', 'knife.home.pathN.a', 'Point two: the north path toward the Spire seam.'],
  ['knife.home.sig.b', 'knife.home.pathS.a', 'Point two: the south path toward the Bow seam.'],
  ['knife.home.hubs.n', 'knife.home.cross.n1', 'The north hub in toward Keen Instinct.'],
  ['knife.home.hubs.n', 'knife.home.spN.a', 'The north hub out along the spoke.'],
  ['knife.home.hubs.s', 'knife.home.cross.s1', 'The south hub in toward Keen Instinct.'],
  ['knife.home.hubs.s', 'knife.home.spS.a', 'The south hub out along the spoke.'],
  ['knife.home.cross.n2', 'knife.home.keen.n', 'To the home notable.'],
  ['knife.home.cross.s2', 'knife.home.keen.n', 'To the home notable.'],
  ['knife.home.seams.n', 'centre.ring.road.i0', 'Along the border into the centre.'],
  ['knife.home.seams.s', 'centre.ring.road.i1', 'Along the border into the centre.'],
  ['knife.home.seams.n', 'knife.hex.radN.a', 'Along the border out to the mid ring.'],
  ['knife.home.seams.s', 'knife.snares.radS.a', 'Along the border out to the mid ring.'],
  ['knife.home.spN.x', 'knife.venom.spN.a', 'The north spoke goes on.'],
  ['knife.home.spS.x', 'knife.edge.spS.a', 'The south spoke goes on.'],
  ['knife.edge.spS.m', 'knife.snares.spS.c', 'The south spoke past the mid ring.'],
  ['knife.venom.spN.c', 'knife.rim.ring.n1', 'The north spoke reaches the rim ring.'],
  ['knife.snares.spS.c', 'knife.rim.ring.s1', 'The south spoke reaches the rim ring.'],
  ['knife.hex.radN.m', 'knife.hex.ring.a', 'The mid ring from the north border.'],
  ['knife.hex.ring.a', 'knife.venom.spN.m', 'The mid ring meets the north spoke.'],
  ['knife.venom.spN.m', 'knife.venom.ring.a', 'The mid ring on toward the axis.'],
  ['knife.venom.ring.b', 'knife.edge.ring.a', 'The mid ring across the axis.'],
  ['knife.edge.ring.a', 'knife.edge.spS.m', 'The mid ring meets the south spoke.'],
  ['knife.edge.spS.m', 'knife.snares.ring.a', 'The mid ring on toward the south border.'],
  ['knife.snares.ring.a', 'knife.snares.radS.m', 'The mid ring meets the south border road.'],
];
for (const m of M)
  for (const [node, road] of m.entry)
    L.push([`knife.${m.area}.${m.id ?? m.from.split('.')[1]}.${node}`, road, 'The way in.']);

// ---- Placing a moved cluster: its old shape, rotated so the (first) entrance faces its road, centred on the new place.
const place = (m: Move) => {
  const c = oldCluster(m.from);
  if (m.ats) return c.nodes.map((n: any) => m.ats![n.id]);
  const oldArea = 'knife.' + m.from.split('.')[0];
  const old = c.nodes.map((n: any) => posOf(`${oldArea}.${c.id}.${n.id}`));
  const cx = old.reduce((s: number, p: number[]) => s + p[0], 0) / old.length;
  const cy = old.reduce((s: number, p: number[]) => s + p[1], 0) / old.length;
  const e = c.nodes.findIndex((n: any) => n.id === m.entry[0][0]);
  const road = roadPos(m.entry[0][1]);
  let rot = 0;
  if (c.nodes.length > 1) {
    const a0 = Math.atan2(old[e][1] - cy, old[e][0] - cx);
    const a1 = Math.atan2(road[1] - m.at[1], road[0] - m.at[0]);
    rot = a1 - a0;
  }
  return c.nodes.map((n: any, i: number) => {
    const dx = old[i][0] - cx,
      dy = old[i][1] - cy;
    return [
      Math.round(m.at[0] + dx * Math.cos(rot) - dy * Math.sin(rot)),
      Math.round(m.at[1] + dx * Math.sin(rot) + dy * Math.cos(rot)),
    ] as [number, number];
  });
};
const roadIndex = new Map<string, [number, number]>();
for (const r of roads)
  for (const n of r.nodes) roadIndex.set(`knife.${r.area}.${r.id}.${n.id}`, n.at);
roadIndex.set('knife.home.keen.n', keen.at);
const roadPos = (full: string): [number, number] => {
  const p = roadIndex.get(full) ?? movedIndex.get(full);
  if (!p) throw new Error('no road ' + full);
  return p;
};
const movedIndex = new Map<string, [number, number]>();
// Clusters hung from another moved cluster (Ill Wish from the Rookery wheel, Smeared Edge from the Docks wheel) need it placed first.
const placed = new Map<Move, [number, number][]>();
const order = [...M].sort(
  (a, b) => Number(a.entry[0][1].includes('wheel')) - Number(b.entry[0][1].includes('wheel')),
);
for (const m of order) {
  const ps = place(m);
  placed.set(m, ps);
  const c = oldCluster(m.from);
  c.nodes.forEach((n: any, i: number) =>
    movedIndex.set(`knife.${m.area}.${m.id ?? c.id}.${n.id}`, ps[i]),
  );
}

// ---- The notables redesigned (the owner's chart, 2026-10-31): lines, and a working name where the idea changed, by node.
// Smalls are re-lined only where their notable's idea changed.
const OVER: Record<string, { name?: string; lines: string }> = {
  'knife.home.keen.n': { lines: 'allDamage(20), critChance(20), dex(10), int(10)' },
  'knife.home.spoils.n': { lines: 'lifeOnKill(15), manaOnKill(10), damageOnKill(15)' },
  'knife.home.softStep.n': { lines: 'evasion(15), avoidAilments(20), dodgeAttack(3)' },
  'knife.home.thickBlood.n': { lines: "life(8), resOne('chaos', 25), lifeRegen(0.6)" },
  'knife.home.star.n': { lines: 'evasion(15), es(10), resAll(8)' },
  'knife.home.quick.b': { lines: 'attackSpeed(10), castSpeed(6), dex(10), int(10)' },
  'knife.home.breath.n': { lines: 'es(12), esLeech(0.4), mana(16)' },
  'knife.home.cloak.n': { lines: 'evasion(18), es(10), lifeRegen(0.5)' },
  'knife.venom.quietKnife.n': {
    lines: 'daggerSpellDamage(20), daggerSpellCrit(30), costReduction(8)',
  },
  'knife.hex.wheel.n1': { lines: "chaosSpell(22), chaosDot(12), resOne('chaos', 10)" },
  'knife.hex.wheel.n2': {
    lines: "mineDamage(24), critChance(30, ['mine']), critMulti(20, ['mine'])",
  },
  'knife.venom.wheel.v3': { lines: 'poisonDamage(30), poisonFaster(15), poisonDuration(15)' },
  'knife.venom.wheel.v5': { lines: 'es(10), esRechargeDelay(30), critWhileEsFull(25)' },
  'knife.hex.bloodletter.n': {
    lines: "leechLife(1, ['attack']), manaLeech(0.5), speedWhileLeeching(8)",
  },
  'knife.venom.static.n': {
    lines: "eleDamage('lightning', 16), shockChance(15), damageVsShocked(25)",
  },
  'knife.hex.ward.n': { lines: 'es(12), dodgeSpell(8), esOnHit(6)' },
  'knife.hex.wiry.n': { lines: 'life(10), evasion(15), accuracy(25)' },
  'knife.roofs.wish.n': { lines: 'curseEffect(20), chaosDot(12), curseArea(15)' },
  'knife.roofs.athame.wN': {
    lines: 'daggerSpellDamage(20), daggerSpellCrit(40), spellCritMulti(15)',
  },
  'knife.roofs.athame.eN': { lines: "daggerDamage(24), weaponSpeed('dagger', 12), meleeRange(1)" },
  'knife.roofs.salt.n': { lines: 'spellDamage(16), damageVsCursed(30)' },
  'knife.roofs.hasty.n': {
    name: 'Split Light',
    lines: 'eleDamageAll(20), elePenetration(4), avoidAilments(10)',
  },
  'knife.roofs.hasty.a': { lines: 'eleDamageAll(8)' },
  'knife.roofs.hasty.b': { lines: 'eleDamageAll(8)' },
  'knife.roofs.hasty.c': { lines: 'eleDamageAll(8)' },
  'knife.roofs.ritual.n': { lines: 'daggerSpellDamage(20), esLeech(0.3), es(8)' },
  'knife.hex.powder.n': { lines: 'mineDamage(20), aoe(20), mineSpeed(15)' },
  'knife.edge.wheel.w5': {
    lines: "daggerDamage(20), weaponCrit('dagger', 40), weaponCritMulti('dagger', 20)",
  },
  'knife.edge.wheel.w3': { lines: "clawDamage(20), leechLife(1, ['attack']), manaLeech(0.6)" },
  'knife.edge.quietShot.n': { lines: 'bowDamage(20), critMulti(20), damageVsRare(25)' },
  'knife.edge.smear.n': { lines: 'daggerDamage(20), poisonChance(20), poisonDamage(20)' },
  'knife.snares.wheel.t3': { lines: 'trapDamage(24), trapLimit(1), cooldownRecovery(10)' },
  'knife.snares.wheel.t5': {
    name: 'Powder Keg',
    lines: 'mineDamage(24), mineLimit(1), mineSpeed(10)',
  },
  'knife.snares.wheel.t6': { lines: 'mineDamage(12)' },
  'knife.snares.wheel.t8': { lines: 'mineDamage(12)' },
  'knife.snares.mercy.n': { lines: 'critMulti(25), accuracy(20), attackSpeedOnKill(15)' },
  'knife.snares.tumble.n': { lines: 'dodgeAttack(6), dodgeSpell(4), stunAvoid(30)' },
  'knife.edge.frost.n': {
    name: 'Frost Snare',
    lines: "eleDamage('cold', 20), trapDamage(24), damageVsChilled(25)",
  },
  'knife.edge.frost.k2': { lines: 'trapDamage(12)' },
  'knife.edge.frost.k1': { lines: 'trapDamage(12)' },
  'knife.edge.frost.c1': { lines: "eleDamage('cold', 10)" },
  'knife.snares.herald.n': { lines: 'auraEffect(12), reducedReservation(8), mana(16)' },
  'knife.snares.rake.n': {
    lines: "oneHandMelee(20), attackSpeed(8, ['oneHand']), bleedChance(15)",
  },
  'knife.snares.rake.a': { lines: 'oneHandMelee(10)' },
  'knife.snares.rake.b': { lines: 'oneHandMelee(10)' },
  'knife.snares.rake.c': { lines: "attackSpeed(5, ['oneHand'])" },
  'knife.roofs.carrion.n': { lines: 'clawDamage(16), chaosAttack(20), damageVsPoisoned(25)' },
  'knife.roofs.feint.n': { lines: 'dualDamage(20), maxFervour(1), fervourOnKill(10)' },
  'knife.roofs.ribs.n': { lines: "weaponCritMulti('dagger', 30), critVsFullLife(40)" },
  'knife.rim.rot.n': {
    name: 'Hair Spring',
    lines: "critChance(40, ['trap']), critMulti(25, ['trap']), trapSpeed(8)",
  },
  'knife.rim.rot.a': { lines: "critChance(15, ['trap'])" },
  'knife.rim.rot.c': { lines: "critChance(15, ['trap'])" },
  'knife.rim.whet.n': { lines: 'physSpell(24), damageVsBleeding(25)' },
  'knife.rim.glint.n': { lines: 'spellCrit(40), maxInsight(1), insightOnCrit(20)' },
  'knife.rim.sleet.n': { lines: "eleDamage('cold', 16), freezeChance(10), freezeDuration(15)" },
  'knife.rim.legs.n': { name: 'Withering Word', lines: 'chaosSpell(20), castSpeed(8), es(10)' },
  'knife.rim.legs.l2': { lines: 'chaosSpell(10)' },
  'knife.rim.legs.l1': { lines: 'chaosSpell(10)' },
};
// Long clusters cut to two or three smalls (the node budget for the twenty new notables).
const TRIM: Record<string, string[]> = {
  'knife.home.spoils': ['b'],
  'knife.home.softStep': ['b'],
  'knife.hex.wiry': ['l2', 'e2'],
  'knife.hex.ward': ['s2'],
  'knife.rim.legs': ['d2', 'd1'],
  'knife.roofs.wish': ['k2'],
  'knife.roofs.salt': ['c2'],
  'knife.edge.frost': ['c2'],
  'knife.roofs.feint': ['w2'],
  'knife.rim.rot': ['b'],
};
const keyOf = (m: Move) => `knife.${m.area}.${m.id ?? m.from.split('.')[1]}`;
/** A moved cluster after its trim: nodes kept (with positions) and links, a removed node's two neighbours joined. */
const shapeOf = (m: Move) => {
  const c = oldCluster(m.from);
  const ps = placed.get(m)!;
  const drop = new Set(TRIM[keyOf(m)] ?? []);
  let links: [string, string][] = c.links.map(([a, b]: [string, string]) => [a, b]);
  for (const x of drop) {
    const nb = links.filter((l) => l.includes(x)).map((l) => (l[0] === x ? l[1] : l[0]));
    links = links.filter((l) => !l.includes(x));
    if (nb.length === 2) links.push([nb[0], nb[1]]);
  }
  const nodes = c.nodes
    .map((n: any, i: number) => ({ n, at: ps[i] }))
    .filter((x: any) => !drop.has(x.n.id));
  return { c, nodes, links };
};

// ---- The twenty new notables (the owner's chart, 2026-10-31): 12 new clusters on a road, 8 second notables in a cluster.
type NewCluster = {
  area: string;
  id: string;
  name: string;
  lines: string;
  smalls: string[];
  entry: string;
  toward: [number, number];
  why: string;
};
const NEWC: NewCluster[] = [
  {
    area: 'home',
    id: 'flasks',
    name: "Smuggler's Flasks",
    lines: 'flaskEffect(15), flaskRecovery(15), flaskDuration(15)',
    smalls: ['flaskRecovery(10)', 'flaskRecovery(10)'],
    entry: 'knife.home.pathN.a',
    toward: A(1470, -15),
    why: 'The flask layer near home, for any build: a side room off the north path toward the centre.',
  },
  {
    area: 'home',
    id: 'pace',
    name: 'Deft Guard',
    lines: 'evasion(15), life(8), dodgeAttack(4)',
    smalls: ['life(5)', 'life(5)'],
    entry: 'knife.home.pathS.a',
    toward: A(1470, 15),
    why: 'A defensive generalist near home (it was movement speed, too much of it near the start: the owner, 2026-10-31): a side room off the south path toward the centre.',
  },
  {
    area: 'edge',
    id: 'steadyEye',
    name: 'Steady Eye',
    lines: 'accuracyFlat(150), critChance(15), dex(10)',
    smalls: ['accuracy(10)'],
    entry: 'knife.edge.spS.a',
    toward: A(2450, 18),
    why: 'The early answer to missing, off the south spoke.',
  },
  {
    area: 'snares',
    id: 'honed',
    name: 'Honed Mind',
    lines: 'physSpell(20), spellCrit(30), castSpeed(4)',
    smalls: ['physSpell(10)'],
    entry: 'knife.snares.radS.a',
    toward: A(2250, 26),
    why: "Physical spells' second home (with Whetted Will), its partner spell crit: off the south border road.",
  },
  {
    area: 'hex',
    id: 'verse',
    name: 'Vampiric Verse',
    lines: "lifeOnHit(6, ['spell']), spellDamage(15)",
    smalls: ['spellDamage(8)'],
    entry: 'knife.hex.ring.a',
    toward: A(2650, -16),
    why: "Life on hit for casters, who can't use attack leech: in from the mid ring between the Stair's wheel and the spoke.",
  },
  {
    area: 'hex',
    id: 'malice',
    name: 'Lingering Malice',
    lines: 'skillDuration(20), dotDamage(20)',
    smalls: ['dotDamage(10)'],
    entry: 'knife.hex.ring.a',
    toward: A(3250, -24),
    why: 'Damage over time from any source: out from the mid ring, north.',
  },
  {
    area: 'snares',
    id: 'venomSnare',
    name: 'Venom Snare',
    lines: 'trapDamage(20), poisonChance(20), poisonFaster(10)',
    smalls: ['trapDamage(10)'],
    entry: 'knife.snares.radS.b',
    toward: A(2950, 23),
    why: 'Poisoned traps (traps, a fourth partner): off the south border road.',
  },
  {
    area: 'snares',
    id: 'coldRead',
    name: 'Cold Read',
    lines: 'insightOnCrit(20), critChance(15), int(10)',
    smalls: ['critChance(10)'],
    entry: 'knife.snares.ring.a',
    toward: A(3300, 15),
    why: 'Insight for crit attackers too: out from the mid ring, south.',
  },
  {
    area: 'snares',
    id: 'quickBlade',
    name: 'Quick Blade',
    lines: 'oneHandMelee(18), accuracy(20), attackSpeedOnKill(10)',
    smalls: ['oneHandMelee(10)'],
    entry: 'knife.snares.spS.c',
    toward: A(3600, 15),
    why: "The one-handed blade's second home (with Raking Hand), its partner precision and pace: off the south spoke past the mid ring.",
  },
  {
    area: 'roofs',
    id: 'mercy',
    name: 'Mercy Stroke',
    lines: 'damageVsLowLife(30), cullingStrike()',
    smalls: ['damageVsLowLife(10)'],
    entry: 'knife.rim.ring.q8',
    toward: A(4000, 24),
    why: 'The finisher: in from the rim ring, south.',
  },
  {
    area: 'rim',
    id: 'stormFrost',
    name: 'Storm and Frost',
    lines: 'eleDamageAll(16), shockChance(10), chillEffect(15)',
    smalls: ['eleDamageAll(8)'],
    entry: 'knife.rim.ring.q2',
    toward: A(4600, -13),
    why: "The elemental Shade's second home (with Split Light), its partner the elemental ailments: out from the rim ring.",
  },
  {
    area: 'rim',
    id: 'shockCharge',
    name: 'Shock Charge',
    lines: 'mineDamage(20), shockChance(15), damageVsShocked(20)',
    smalls: ['mineDamage(10)'],
    entry: 'knife.rim.ring.q1',
    toward: A(4650, -25),
    why: 'Lightning mines (mines, a fourth partner), apart from Static Edge: out from the rim ring.',
  },
];
type Second = {
  cluster: string;
  attach: string;
  id: string;
  name: string;
  lines: string;
  why: string;
};
const SECOND: Second[] = [
  {
    cluster: 'knife.home.spoils',
    attach: 'n',
    id: 'n2',
    name: 'Low Tide',
    lines: 'manaRegen(20), castSpeedOnLowMana(15)',
    why: 'Rewards running dry instead of punishing it.',
  },
  {
    cluster: 'knife.home.breath',
    attach: 'n',
    id: 'n2',
    name: 'Deep Reserves',
    lines: 'mana(20), costReduction(10), manaFlat(20)',
    why: 'The big mana pool for expensive spells.',
  },
  {
    cluster: 'knife.home.cloak',
    attach: 'n',
    id: 'n2',
    name: 'Ward of Smoke',
    lines: "resOne('chaos', 15), resAll(8), life(5)",
    why: 'Resistances shared with the Strider.',
  },
  {
    cluster: 'knife.venom.quietKnife',
    attach: 'a',
    id: 'n2',
    name: 'Swift Incantation',
    lines: 'castSpeed(8), spellDamage(15), manaRegen(15)',
    why: "The caster's speed, for any spell, on the way to the dagger spells.",
  },
  {
    cluster: 'knife.venom.wheel',
    attach: 'v2',
    id: 'f',
    name: 'Bitter Chill',
    lines: "coldDot(12), chillEffect(15), eleDamage('cold', 10)",
    why: 'Cold that eats away, beside the poison side.',
  },
  {
    cluster: 'knife.snares.tumble',
    attach: 'n',
    id: 'n2',
    name: 'Twin Shadows',
    lines: 'dualCrit(20), dualSpeed(8), critMulti(12)',
    why: "Dual wielding's second home (with Feint and Cut), its partner crit.",
  },
  {
    cluster: 'knife.roofs.carrion',
    attach: 'n',
    id: 'n2',
    name: 'Rust and Ruin',
    lines: 'physAttack(16), chaosAttack(16), moveSpeed(5)',
    why: 'Physical and chaos together, for any weapon.',
  },
  {
    cluster: 'knife.edge.quietShot',
    attach: 'n',
    id: 'n2',
    name: 'Fan of Blades',
    lines: 'pierce(1), projectileDamage(20)',
    why: 'Thrown blades and arrows that go through.',
  },
];
// Every node placed so far: the new ones go where there is room, nudged off the line toward their place.
const occupied: [number, number][] = [];
for (const r of roads) for (const n of r.nodes) occupied.push(n.at);
occupied.push(keen.at);
for (const m of M) for (const x of shapeOf(m).nodes) occupied.push(x.at);
const clear = (p: [number, number], except: [number, number][]) =>
  occupied.every((o) => except.some((e) => e === o) || Math.hypot(o[0] - p[0], o[1] - p[1]) >= 100);
const NUDGES = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75, -75, 90, -90, 110, -110];
const chainFrom = (
  from: [number, number],
  heading: number,
  n: number,
  step = 88,
  except: [number, number][] = [],
) => {
  for (const d of NUDGES) {
    const a = heading + (d * Math.PI) / 180;
    const pts: [number, number][] = [];
    for (let k = 1; k <= n; k++)
      pts.push([
        Math.round(from[0] + Math.cos(a) * step * k),
        Math.round(from[1] + Math.sin(a) * step * k),
      ]);
    if (pts.every((p) => clear(p, except))) return pts;
  }
  throw new Error('no room at ' + from);
};
const newPlaced = new Map<NewCluster, [number, number][]>();
for (const c of NEWC) {
  const from = roadPos(c.entry);
  const pts = chainFrom(
    from,
    Math.atan2(c.toward[1] - from[1], c.toward[0] - from[0]),
    c.smalls.length + 1,
    88,
    [from],
  );
  newPlaced.set(c, pts);
  occupied.push(...pts);
  L.push([`knife.${c.area}.${c.id}.s1`, c.entry, 'The way in.']);
}
const secondPlaced = new Map<Second, [number, number]>();
for (const s of SECOND) {
  const m = M.find((x) => keyOf(x) === s.cluster)!;
  const sh = shapeOf(m);
  const at = sh.nodes.find((x: any) => x.n.id === s.attach)!.at;
  const cx = sh.nodes.reduce((t: number, x: any) => t + x.at[0], 0) / sh.nodes.length;
  const cy = sh.nodes.reduce((t: number, x: any) => t + x.at[1], 0) / sh.nodes.length;
  const heading = Math.hypot(at[0] - cx, at[1] - cy) < 1 ? 0 : Math.atan2(at[1] - cy, at[0] - cx);
  const [p] = chainFrom(at, heading, 1, 85, [at]);
  secondPlaced.set(s, p);
  occupied.push(p);
}

// ---- Links between neighbouring clusters (the owner, 2026-10-30): a costlier way across between two roads, for builds that
// want both clusters anyway. The pairs are chosen by hand; each joins the two clusters' nearest nodes (never a keystone).
const PAIRS: [string, string][] = [
  ['knife.home.thickBlood', 'knife.home.spoils'],
  ['knife.home.star', 'knife.home.softStep'],
  ['knife.venom.secondCurse', 'knife.edge.wheel'],
  ['knife.hex.wheel', 'knife.hex.ward'],
  ['knife.hex.bloodletter', 'knife.hex.wiry'],
  ['knife.roofs.athame', 'knife.venom.static'],
  ['knife.roofs.carrion', 'knife.roofs.ribs'],
  ['knife.edge.frost', 'knife.roofs.ribs'],
  ['knife.snares.mercy', 'knife.snares.tumble'],
  ['knife.snares.rake', 'knife.roofs.feint'],
];
const nodesOf = (key: string) => {
  const m = M.find((x) => keyOf(x) === key);
  if (!m) throw new Error('no moved cluster ' + key);
  return shapeOf(m).nodes.map((x: any) => ({ id: `${key}.${x.n.id}`, kind: x.n.kind, at: x.at }));
};
for (const [a, b] of PAIRS) {
  let best: [string, string, number] | null = null;
  for (const x of nodesOf(a))
    for (const y of nodesOf(b)) {
      if (x.kind === 'keystone' || y.kind === 'keystone') continue;
      const d = Math.hypot(x.at[0] - y.at[0], x.at[1] - y.at[1]);
      if (!best || d < best[2]) best = [x.id, y.id, d];
    }
  L.push([
    best![0],
    best![1],
    'A way across between neighbouring clusters, dearer than the roads.',
  ]);
  console.log(`pair ${best![0]} – ${best![1]}: ${Math.round(best![2])}`);
}

// ---- Writing the files.
const lineOf = (l: any) => {
  if (!l.spec) throw new Error('a line without a spec: ' + l.label);
  return `${l.spec.fn}(${l.spec.args.map((a: unknown) => JSON.stringify(a)).join(', ')})`;
};
const q = (s: string) => JSON.stringify(s);
const AREA_META: Record<string, { name: string; at: [number, number]; why: string }> = {
  home: {
    name: 'The Knife Gate',
    at: K(1900, 5),
    why: "The Shade's first points (R-knife.md): two sides off the start, two hubs that fork at once, the roads bowing out to the seams, the two spokes and the cross-link through Keen Instinct, and the home's side rooms at steps 5 to 8. No weapon.",
  },
  hex: {
    name: 'The Stair',
    at: K(2800, -25),
    why: "The north border's ground: chaos spells and mines, energy shield and spell dodge, leech, life and evasion, Spellslip, and mines at the rim.",
  },
  venom: {
    name: 'The Rookery',
    at: K(3050, -10),
    why: 'The north spoke beyond the home: dagger spells, the poison and energy shield wheel, a second curse, lightning, Shade Leech and Cruel Agony.',
  },
  edge: {
    name: 'The Alleys',
    at: K(2850, 5),
    why: 'The south spoke beyond the home: the dagger or claw wheel, the bows facing the Bow, poison daggers and cold attacks.',
  },
  snares: {
    name: 'The Docks',
    at: K(3300, 23),
    why: "The south border's ground: traps or minions, dagger and claw crit, dodge, reservation, claws with attack speed, Nimble Gambit.",
  },
  roofs: {
    name: 'The Rooftops',
    at: K(3800, 2),
    why: 'In from the rim ring: curses, the dagger wheel, spells, claws with chaos, dagger crit, dual wielding.',
  },
  rim: {
    name: 'The Seawall',
    at: K(4700, 3),
    why: 'The rim ring and what hangs outside it: physical spells, spell crit, cold spells, curses, life and dodge, poison.',
  },
};
const EXPORT: Record<string, string> = {
  home: 'home',
  edge: 'edge',
  venom: 'venom',
  hex: 'hex',
  snares: 'snares',
  roofs: 'roofs',
  rim: 'seawall',
};
for (const area of Object.keys(AREA_META)) {
  const used = new Set<string>();
  const out: string[] = [];
  const clusters: string[] = [];
  for (const r of roads.filter((x) => x.area === area)) {
    const nodes = r.nodes.map((n) => {
      const lines = n.lines ?? (n.hub ? 'dex(15), int(15)' : 'dex(6), int(6)');
      for (const f of lines.match(/[a-zA-Z]+(?=\()/g) ?? []) used.add(f);
      return `        { id: ${q(n.id)}, kind: ${q(n.kind ?? 'attribute')}, lines: [${lines}], at: [${n.at[0]}, ${n.at[1]}]${n.why ? `, why: ${q(n.why)}` : ''} },`;
    });
    clusters.push(
      `    {\n      id: ${q(r.id)},\n      name: ${q(r.name)},\n      why: ${q(r.why)},\n      at: [${r.nodes[0].at[0]}, ${r.nodes[0].at[1]}],\n      shape: { kind: 'hand' },\n      nodes: [\n${nodes.join('\n')}\n      ],\n      links: [${r.links.map(([a, b]) => `[${q(a)}, ${q(b)}]`).join(', ')}],\n    },`,
    );
  }
  const use = (lines: string) => {
    for (const f of lines.match(/[a-zA-Z]+(?=\()/g) ?? []) used.add(f);
    return lines;
  };
  if (area === 'home') {
    const o = OVER['knife.home.keen.n'];
    clusters.push(
      `    {\n      id: 'keen',\n      name: 'Keen Instinct',\n      why: 'The home generalist, passed through between the two hubs (step 5): offence every Shade uses, both attributes.',\n      at: [${keen.at[0]}, ${keen.at[1]}],\n      shape: { kind: 'hand' },\n      nodes: [\n        { id: 'n', kind: 'notable', name: 'Keen Instinct', lines: [${use(o.lines)}], at: [${keen.at[0]}, ${keen.at[1]}] },\n      ],\n      links: [],\n    },`,
    );
  }
  for (const m of M.filter((x) => x.area === area)) {
    const key = keyOf(m);
    const sh = shapeOf(m);
    let cname = sh.c.name;
    const nodes = sh.nodes.map(({ n, at }: any) => {
      const o = OVER[`${key}.${n.id}`];
      const lines = o
        ? use(o.lines)
        : n.lines.map((l: any) => (used.add(l.spec.fn), lineOf(l))).join(', ');
      const name = o?.name ?? n.name;
      if (o?.name && cname === n.name) cname = o.name;
      const keepWhy = !o && n.why && (n.kind === 'notable' || n.kind === 'keystone');
      return `        { id: ${q(n.id)}, kind: ${q(n.kind)}${name ? `, name: ${q(name)}` : ''}, lines: [${lines}], at: [${at[0]}, ${at[1]}]${keepWhy ? `, why: ${q(n.why)}` : ''} },`;
    });
    const links = [...sh.links];
    for (const s of SECOND.filter((x) => x.cluster === key)) {
      const p = secondPlaced.get(s)!;
      nodes.push(
        `        { id: ${q(s.id)}, kind: 'notable', name: ${q(s.name)}, lines: [${use(s.lines)}], at: [${p[0]}, ${p[1]}], why: ${q(s.why)} },`,
      );
      links.push([s.attach, s.id]);
    }
    clusters.push(
      `    {\n      id: ${q(m.id ?? sh.c.id)},\n      name: ${q(cname)},\n      why: ${q(m.why)},\n      at: [${Math.round(m.at[0])}, ${Math.round(m.at[1])}],\n      shape: { kind: 'hand' },\n      nodes: [\n${nodes.join('\n')}\n      ],\n      links: [${links.map(([a, b]) => `[${q(a)}, ${q(b)}]`).join(', ')}],\n    },`,
    );
  }
  for (const c of NEWC.filter((x) => x.area === area)) {
    const pts = newPlaced.get(c)!;
    const ids = [...c.smalls.map((_, i) => `s${i + 1}`), 'n'];
    const nodes = ids.map((id, i) => {
      const isN = id === 'n';
      return `        { id: ${q(id)}, kind: ${q(isN ? 'notable' : 'small')}${isN ? `, name: ${q(c.name)}` : ''}, lines: [${use(isN ? c.lines : c.smalls[i])}], at: [${pts[i][0]}, ${pts[i][1]}] },`;
    });
    const links = ids.slice(1).map((id, i) => `[${q(ids[i])}, ${q(id)}]`);
    clusters.push(
      `    {\n      id: ${q(c.id)},\n      name: ${q(c.name)},\n      why: ${q(c.why)},\n      at: [${pts[pts.length - 1][0]}, ${pts[pts.length - 1][1]}],\n      shape: { kind: 'hand' },\n      nodes: [\n${nodes.join('\n')}\n      ],\n      links: [${links.join(', ')}],\n    },`,
    );
  }
  const links = L.filter(
    ([a]) => a.startsWith(`knife.${area}.`) || (area === 'home' && a === 'start.shade'),
  ).map(([a, b, why]) => `    { from: ${q(a)}, to: ${q(b)}, why: ${q(why)} },`);
  const meta = AREA_META[area];
  out.push(
    `/**\n * ${meta.name}: ${meta.why}\n * Written for the attrition rework from docs/tree/design/R-knife.md (2026-10-30).\n */`,
  );
  out.push(`import { ${[...used].sort().join(', ')} } from '../lines';`);
  out.push(`import type { AreaSpec } from '../types';\n`);
  if (area === 'home')
    out.push(
      `export const START = {\n  classId: 'shade',\n  region: 'shade' as const,\n  id: 'start.shade',\n  at: [${S0[0]}, ${S0[1]}] as [number, number],\n};\n`,
    );
  out.push(
    `export const ${EXPORT[area]}: AreaSpec = {\n  id: 'knife.${area}',\n  region: 'shade',\n  name: ${q(meta.name)},\n  why: ${q(meta.why)},\n  at: [${meta.at[0]}, ${meta.at[1]}],\n  clusters: [\n${clusters.join('\n')}\n  ],\n  links: [\n${links.join('\n')}\n  ],\n};\n`,
  );
  fs.writeFileSync(ROOT + `src/data/passives/knife/${area}.ts`, out.join('\n'));
}
// The links from other links that were written from the far side (`from` in another area, `to` a Knife node) are fixed by hand.
console.log('written');
