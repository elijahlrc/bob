// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// The Cathedral's table (docs/tree/design/R-cathedral.md), written into src/data/passives/cathedral/ by region-gen-lib.ts from the region
// as it was (before/cathedral.json). Offsets in degrees from the Cathedral's angle (-150): negative is the Wall's side
// (south-west), positive the Spire's (north-east). Run: npx tsx scripts/passives/rework/cathedral-gen.ts [--dry]
import {
  generate,
  polar,
  lerp,
  type Road,
  type Move,
  type NewCluster,
  type Second,
  type Over,
} from './region-gen-lib.ts';

const K = polar(-150);
const S0 = K(1450, 0);
const hubN = K(1690, -5),
  hubS = K(1690, 5);
const xN = K(2050, -11.7),
  xS = K(2050, 11.7);
const mN1 = K(2900, -13),
  mS1 = K(2900, 13),
  mS0 = K(2900, 30);
const rN1 = K(4300, -13),
  rS1 = K(4300, 13),
  rS0 = K(4300, 30);
const seamS = K(1600, 30);

const roads: Road[] = [];
roads.push({
  area: 'home',
  id: 'sig',
  name: 'The two sides',
  why: "The start's two exits, each a strong small every Zealot takes, as the reference's str start opens: damage with life toward the Spire, mana regeneration with life toward the Wall. Each opens three ways at the next step.",
  nodes: [
    {
      id: 'a',
      at: K(1530, -6),
      kind: 'small',
      lines: 'manaRegen(15), life(5)',
      why: 'The south-west side: mana regeneration and life, the reference2019s str/int opener.',
    },
    {
      id: 'b',
      at: K(1530, 6),
      kind: 'small',
      lines: 'allDamage(12), life(5)',
      why: 'The north-east side: damage of every kind (the Zealot casts and strikes) and life.',
    },
  ],
  links: [],
});
roads.push({
  area: 'home',
  id: 'hubs',
  name: 'The hubs',
  why: 'Strength a step past each side: each forks into the spoke out into the region and the road in to Zeal.',
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
  why: "The third way out of the south-west side: life and mana regeneration along the bow toward the Wall's seam.",
  nodes: [
    { id: 'a', at: K(1590, -13), kind: 'small', lines: 'life(4)' },
    { id: 'b', at: K(1690, -17), kind: 'small', lines: 'manaRegen(10)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home',
  id: 'pathS',
  name: 'The south path',
  why: "The third way out of the north-east side: two damage nodes along the bow toward the Spire's seam.",
  nodes: [
    { id: 'a', at: K(1590, 13), kind: 'small', lines: 'allDamage(10)' },
    { id: 'b', at: K(1690, 17), kind: 'small', lines: 'allDamage(10)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home',
  id: 'spN',
  name: 'The north spoke',
  why: 'The north spoke from its hub to the junction with the cross roads.',
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
  why: 'The south spoke from its hub to the junction with the cross roads.',
  nodes: [
    { id: 'a', at: lerp(hubS, xS, 0.5) },
    { id: 'x', at: xS },
  ],
  links: [['a', 'x']],
});
roads.push({
  area: 'home',
  id: 'cross',
  name: 'The roads to Zeal',
  why: 'From each hub two stat nodes in to Zeal on the axis (step 5): life on the south road, resistances on the north, defences every Zealot takes.',
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
  area: 'rods',
  id: 'spN',
  name: 'The north spoke, outer',
  why: 'The north spoke from the cross-road junction out to the mid ring and on toward the rim.',
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
  area: 'choir',
  id: 'spS',
  name: 'The south spoke, outer',
  why: 'The south spoke from the cross-road junction out to the mid ring and on toward the rim.',
  nodes: [
    { id: 'a', at: lerp(xS, mS1, 1 / 3) },
    { id: 'b', at: lerp(xS, mS1, 2 / 3) },
    { id: 'm', at: mS1 },
    { id: 'c', at: lerp(mS1, rS1, 0.5) },
  ],
  links: [
    ['a', 'b'],
    ['b', 'm'],
    ['m', 'c'],
  ],
});
roads.push({
  area: 'rods',
  id: 'ring',
  name: 'The mid ring, north',
  why: "The mid ring's stretch between the Wall's border road and the south-west spoke.",
  nodes: [{ id: 'a', at: lerp(K(2900, -30), mN1, 0.5) }],
  links: [],
});
roads.push({
  area: 'nave',
  id: 'ring',
  name: 'The mid ring, centre',
  why: "The mid ring's stretch across the axis between the two spokes.",
  nodes: [
    { id: 'a', at: lerp(mN1, mS1, 0.25) },
    { id: 'b', at: lerp(mN1, mS1, 0.5) },
    { id: 'c', at: lerp(mN1, mS1, 0.75) },
  ],
  links: [
    ['a', 'b'],
    ['b', 'c'],
  ],
});
roads.push({
  area: 'choir',
  id: 'ring',
  name: 'The mid ring, south',
  why: "The mid ring's stretch between the north-east spoke and the Spire's border road.",
  nodes: [{ id: 'a', at: lerp(mS1, mS0, 0.5) }],
  links: [],
});
{
  // The rim ring from the Yard's at the south-east border (wall.grit.ring.s0) to the Spire's (spire.rim.ring.w0).
  const rim = [];
  let q = 0;
  for (const t of [1 / 3, 2 / 3]) rim.push({ id: `q${++q}`, at: lerp(K(4300, -30), rN1, t) });
  rim.push({ id: 'n1', at: rN1 });
  for (const t of [0.2, 0.4, 0.6, 0.8]) rim.push({ id: `q${++q}`, at: lerp(rN1, rS1, t) });
  rim.push({ id: 's1', at: rS1 });
  for (const t of [1 / 3, 2 / 3]) rim.push({ id: `q${++q}`, at: lerp(rS1, rS0, t) });
  const links: [string, string][] = [];
  for (let i = 1; i < rim.length; i++) links.push([rim[i - 1].id, rim[i].id]);
  roads.push({
    area: 'walk',
    id: 'ring',
    name: 'The rim ring',
    why: "The rim ring across the Cathedral, from the Wall's border to the Spire's.",
    nodes: rim,
    links,
  });
}

const links: [string, string, string][] = [
  ['start.zealot', 'cathedral.home.sig.a', 'Point one, the north side.'],
  ['start.zealot', 'cathedral.home.sig.b', 'Point one, the south side.'],
  ['cathedral.home.sig.a', 'cathedral.home.hubs.n', 'Point two: the north hub.'],
  ['cathedral.home.sig.b', 'cathedral.home.hubs.s', 'Point two: the south hub.'],
  [
    'cathedral.home.sig.a',
    'cathedral.home.pathN.a',
    "Point two: the north path toward the Wall's seam.",
  ],
  [
    'cathedral.home.sig.b',
    'cathedral.home.pathS.a',
    "Point two: the north-east path toward the Spire's seam.",
  ],
  ['cathedral.home.hubs.n', 'cathedral.home.cross.n1', 'The north hub in toward Zeal.'],
  ['cathedral.home.hubs.n', 'cathedral.home.spN.a', 'The north hub out along the spoke.'],
  ['cathedral.home.hubs.s', 'cathedral.home.cross.s1', 'The south hub in toward Zeal.'],
  ['cathedral.home.hubs.s', 'cathedral.home.spS.a', 'The south hub out along the spoke.'],
  ['cathedral.home.cross.n2', 'cathedral.home.zeal.n', 'To the home notable.'],
  ['cathedral.home.cross.s2', 'cathedral.home.zeal.n', 'To the home notable.'],
  ['cathedral.home.spN.x', 'cathedral.rods.spN.a', 'The north spoke goes on.'],
  ['cathedral.home.spS.x', 'cathedral.choir.spS.a', 'The south spoke goes on.'],
  ['cathedral.rods.spN.c', 'cathedral.walk.ring.n1', 'The north spoke reaches the rim ring.'],
  ['cathedral.choir.spS.c', 'cathedral.walk.ring.s1', 'The south spoke reaches the rim ring.'],
  ['cathedral.rods.ring.a', 'wall.resists.radW.m', "The mid ring meets the Wall's border road."],
  ['cathedral.rods.ring.a', 'cathedral.rods.spN.m', 'The mid ring meets the north spoke.'],
  ['cathedral.rods.spN.m', 'cathedral.nave.ring.a', 'The mid ring on toward the axis.'],
  ['cathedral.nave.ring.c', 'cathedral.choir.spS.m', 'The mid ring meets the south spoke.'],
  ['cathedral.choir.spS.m', 'cathedral.choir.ring.a', 'The mid ring on toward the south border.'],
  ['cathedral.choir.ring.a', 'spire.well.radW.m', "The mid ring meets the Spire's border road."],
  ['cathedral.walk.ring.q8', 'spire.rim.ring.w0', "The rim ring meets the Spire's."],
  ['cathedral.walk.ring.q1', 'wall.grit.ring.s0', "The rim ring meets the Wall's."],
];

export const tables = { K, roads, links };

// ---- Clusters, notables and links. Here 'pathN', 'spN', 'n' ids are the Wall's side (south-west), 'pathS', 'spS', 's'
// the Spire's (north-east).
const moves: Move[] = [
  // The Gate (home, steps 5 to 8): hybrid generalists, not what either neighbour sells at its seam.
  {
    from: 'nave.vigil',
    area: 'home',
    at: K(1760, -24),
    ats: { a: K(1785, -20.5), n: K(1730, -26.5) },
    entry: [
      ['a', 'cathedral.home.pathN.b'],
      ['n', 'wall.home.seams.s'],
    ],
    why: "Life with mana regeneration, on the south-west path to the Wall's seam (step 5): the path runs through it.",
  },
  {
    from: 'crypt.omen',
    area: 'home',
    at: K(1760, 24),
    ats: { a: K(1790, 20.5), n: K(1770, 24), b: K(1735, 27) },
    entry: [
      ['a', 'cathedral.home.pathS.b'],
      ['n', 'spire.home.seams.w'],
    ],
    why: "Damage for spells, attacks and minions alike, on the north-east path to the Spire's seam (step 5): the path runs through it.",
  },
  {
    from: 'nave.lectern',
    area: 'home',
    at: K(1420, 16),
    entry: [['a', 'cathedral.home.pathS.b']],
    why: 'Spells with duration, a side room off the north-east path toward the centre.',
  },
  {
    from: 'nave.star',
    area: 'home',
    at: K(1450, -21),
    entry: [['f', 'cathedral.home.pathN.b']],
    why: 'Armour, energy shield and regeneration (the hybrid defence of the str/int class), a side room toward the centre.',
  },
  {
    from: 'home.ardour',
    area: 'home',
    at: K(2240, 19.5),
    entry: [['a', 'cathedral.home.spS.x']],
    why: 'Elemental attacks, off the north-east spoke junction.',
  },
  {
    from: 'rim.wake',
    area: 'home',
    at: K(2240, -19.5),
    entry: [['a', 'cathedral.home.spN.x']],
    why: 'Energy shield and life, off the south-west spoke junction.',
  },
  {
    from: 'crypt.rite',
    area: 'choir',
    at: K(2230, 11),
    entry: [['a', 'cathedral.choir.spS.a']],
    why: 'Physical and elemental spells, off the north-east spoke toward the axis.',
  },
  {
    from: 'rim.buttress',
    area: 'rods',
    at: K(2280, -8.5),
    entry: [['a', 'cathedral.rods.spN.a']],
    why: 'Spell block and resistances, off the south-west spoke toward the axis.',
  },
  // Generic ground on the neighbours' border roads inward of the mid ring (their near ground).
  {
    from: 'ambulatory.tithe',
    area: 'ambulatory',
    at: K(2080, -24.5),
    entry: [['a', 'wall.resists.radW.a']],
    why: "Leech, off the Wall's border road (generic ground: the Vanguard's near ground).",
  },
  {
    from: 'ambulatory.plate',
    area: 'ambulatory',
    at: K(2490, -24),
    entry: [['a', 'wall.resists.radW.b']],
    why: "Armour and stun recovery, off the Wall's border road (generic ground).",
  },
  {
    from: 'walk.rood',
    area: 'crypt',
    at: K(2080, 24.5),
    entry: [['a', 'spire.well.radW.a']],
    why: "Energy shield and spell block, off the Spire's border road (generic ground: the Mystic's near ground).",
  },
  // The north-east spoke (the Choir): servants and auras, cold's first rung, lightning.
  {
    from: 'choir.wheel',
    area: 'choir',
    at: K(2720, 19),
    entry: [['c1', 'cathedral.choir.spS.b']],
    why: 'Auras or minions, the two sides of one wheel, off the north-east spoke.',
  },
  {
    from: 'rods.font',
    area: 'choir',
    at: K(2650, 7),
    entry: [['a', 'cathedral.choir.spS.b']],
    why: "Cold's first rung, off the north-east spoke toward the axis (cold apart from its payoff at the rim).",
  },
  {
    from: 'choir.loneVow',
    area: 'choir',
    at: K(3050, 15.5),
    entry: [['a', 'cathedral.choir.spS.m']],
    why: 'The aura keystone, a spur where the north-east spoke meets the mid ring.',
  },
  {
    from: 'home.hymn',
    area: 'choir',
    at: K(3330, 19.5),
    entry: [['a', 'cathedral.choir.spS.c']],
    why: "Lightning's first home, out from the mid ring's north-east stretch.",
  },
  {
    from: 'ambulatory.peal',
    area: 'walk',
    at: K(3600, 19.5),
    entry: [['a', 'cathedral.choir.spS.c']],
    why: "Lightning's second home, off the north-east spoke past the mid ring.",
  },
  {
    from: 'crypt.shrine',
    area: 'crypt',
    at: K(3060, 22),
    entry: [['w', 'spire.well.radW.m']],
    why: "Totems or brands, out from where the Spire's border road meets the mid ring (past the Mystic's near ground).",
  },
  {
    from: 'crypt.sigilWarden',
    area: 'crypt',
    at: K(3650, 25),
    entry: [['a', 'cathedral.choir.spS.c']],
    why: 'The brand keystone, a spur off the north-east spoke past the mid ring.',
  },
  // The north-east rim (the Lychway).
  {
    from: 'walk.plainsong',
    area: 'walk',
    at: K(3960, 14),
    entry: [['a', 'cathedral.walk.ring.s1']],
    why: 'Channelling (a line, not a section: its defence goes on it), in from the rim ring at the north-east spoke.',
  },
  {
    from: 'crypt.tomb',
    area: 'walk',
    at: K(3960, 19),
    entry: [['a', 'cathedral.walk.ring.q7']],
    why: 'Chaos spells, in from the rim ring.',
  },
  {
    from: 'rods.guard',
    area: 'walk',
    at: K(3960, 24.5),
    entry: [['a', 'cathedral.walk.ring.q8']],
    why: 'Both blocks with a shield, in from the rim ring (shields spread).',
  },
  {
    from: 'ambulatory.crozier',
    area: 'walk',
    at: K(4560, 25),
    entry: [['a', 'cathedral.walk.ring.q8']],
    why: 'Staff spells, out from the rim ring (staves spread).',
  },
  {
    from: 'walk.vespers',
    area: 'walk',
    at: K(4560, 13.5),
    entry: [['a', 'cathedral.walk.ring.s1']],
    why: 'Spells with duration, out from the rim ring.',
  },
  // The axis (the Nave and the Bell Tower).
  {
    from: 'nave.wheel',
    area: 'nave',
    at: K(2610, 0),
    entry: [['n1', 'cathedral.nave.ring.b']],
    why: 'Shields or fire, the two sides of one wheel, in from the mid ring at the axis (Iron Faith past 8 from the Vanguard).',
  },
  {
    from: 'rods.warding',
    area: 'nave',
    at: K(2700, -9),
    entry: [['a', 'cathedral.nave.ring.a']],
    why: 'Staves with spell block, off the south-west spoke toward the axis.',
  },
  {
    from: 'pyre.wheel',
    area: 'pyre',
    at: K(3960, -2.6),
    entry: [['f1', 'cathedral.walk.ring.q4']],
    why: "Cold attacks or auras, the two sides of one wheel, in from the rim ring at the axis (cold's payoff).",
  },
  {
    from: 'nave.sexton',
    area: 'pyre',
    at: K(3960, 2.6),
    entry: [['a', 'cathedral.walk.ring.q5']],
    why: 'Minions with life, in from the rim ring at the axis (minions spread).',
  },
  {
    from: 'pyre.searingAvatar',
    area: 'pyre',
    at: K(4650, -2),
    entry: [['a', 'cathedral.walk.ring.q4']],
    why: "Fire's keystone, a tip past the rim ring.",
  },
  {
    from: 'rim.procession',
    area: 'pyre',
    at: K(3960, -8),
    entry: [['a', 'cathedral.walk.ring.q3']],
    why: 'Auras, in from the rim ring (its movement line goes).',
  },
  // The south-west spoke (the Vestry): staves and sceptres.
  {
    from: 'rods.wheel',
    area: 'rods',
    at: K(2720, -19),
    entry: [['r1', 'cathedral.rods.spN.b']],
    why: 'Sceptres or staves, the two sides of one wheel, off the south-west spoke (step 9).',
  },
  {
    from: 'rods.idleHands',
    area: 'rods',
    at: K(3050, -15.5),
    entry: [['a', 'cathedral.rods.spN.m']],
    why: 'The staff keystone, a spur where the south-west spoke meets the mid ring.',
  },
  {
    from: 'crypt.wheel',
    area: 'rods',
    at: K(3280, -21.5),
    entry: [['m1', 'cathedral.rods.ring.a']],
    why: "Spells or spell block with a shield, the two sides of one wheel, out from the mid ring's south-west stretch.",
  },
  {
    from: 'ambulatory.kindled',
    area: 'ambulatory',
    at: K(3700, -14),
    entry: [['a', 'cathedral.rods.spN.c']],
    why: 'Fire attacks, off the south-west spoke past the mid ring.',
  },
  {
    from: 'ambulatory.brand',
    area: 'ambulatory',
    at: K(3450, -4.5),
    entry: [['a', 'cathedral.rods.spN.c']],
    why: 'Brand crit, off the south-west spoke past the mid ring (brands spread).',
  },
  {
    from: 'nave.verger',
    area: 'ambulatory',
    at: K(3520, -26.5),
    entry: [['a', 'wall.resists.radW.m']],
    why: "Sceptres with armour, out from where the Wall's border road meets the mid ring (past 8 from the Vanguard).",
  },
  // The south-west rim (the Churchyard).
  {
    from: 'ambulatory.hymn',
    area: 'rim',
    at: K(3960, -24),
    entry: [['a', 'cathedral.walk.ring.q1']],
    why: 'Warcries and auras, in from the rim ring.',
  },
  {
    from: 'ambulatory.ossuary',
    area: 'rim',
    at: K(3960, -19),
    entry: [['a', 'cathedral.walk.ring.q2']],
    why: 'Minions with energy shield, in from the rim ring (minions spread).',
  },
  {
    from: 'ambulatory.censer',
    area: 'rim',
    at: K(4560, -19),
    entry: [['a', 'cathedral.walk.ring.q2']],
    why: 'Burning, out from the rim ring.',
  },
  {
    from: 'rim.brazier',
    area: 'rim',
    at: K(4560, -13.5),
    entry: [['a', 'cathedral.walk.ring.n1']],
    why: 'Sceptre fire, out from the rim ring at the south-west spoke.',
  },
  {
    from: 'crypt.volatile',
    area: 'rim',
    at: K(4650, -25),
    entry: [['a', 'cathedral.walk.ring.q1']],
    why: 'The minion keystone, a tip past the rim ring.',
  },
];
const over: Over = {
  'cathedral.crypt.shrine.n': {
    lines: 'totemDamage(24), regenWithTotem(0.8), totemDuration(10)',
    why: 'The casting totem that lasts, and the Zealot mends while one stands on the consecrated ground: 2 + 1.6 + 0.7 units.',
  },
  'cathedral.rods.wheel.m5': {
    lines: 'shieldSpellBlock(4), shieldDef(15), esFlat(20)',
    why: 'Spell block behind a shield, shield defences and energy shield: 2 + 1 + 1.3 units.',
  },
  'cathedral.pyre.procession.n': {
    lines: 'buffDuration(20), skillDuration(10), int(10)',
    why: "The procession carries its blessings further: buffs and skill effects last longer, with the intelligence a priest's gear asks (its movement and aura lines went): 2.5 + 1 + 0.7 units.",
  },
  'cathedral.choir.wheel.c3': {
    lines: 'reducedReservation(6), auraEffect(12)',
    why: 'Auras held cheaper and stronger, the choir master (its mana line went: one mana notable near home): 2 + 2 units.',
  },
  'cathedral.rim.hymn.n': {
    lines: 'warcryEffect(20), auraEffect(12)',
    why: 'The war chant: warcries and auras both stronger, the holy warrior who shouts and the priest who sings: 2 + 2 units.',
  },
  'cathedral.pyre.wheel.f3': {
    lines: "eleAttackOne('cold', 24), chillEffect(15), freezeChance(8)",
    why: 'Cold strikes that chill and freeze, cold’s payoff at the rim: 2 + 1.5 + 1 units.',
  },
  'cathedral.home.vigil.n': {
    lines: 'lifeRegen(0.8), manaRegen(20), life(5)',
    why: "Life and mana regenerated, the str/int vigil, at the Wall's seam (the Wall sells armour and resistances there): 2 + 2 + 1 units.",
  },
  'cathedral.home.omen.n': {
    lines: 'allDamage(16), minionDamage(16), castSpeed(4), attackSpeed(4)',
    why: "Damage for every Zealot, spell, attack or servant, at the Spire's seam (the Spire sells spell crit and recharge there): 1.3 + 1.3 + 1 + 0.8 units.",
  },
  'cathedral.home.star.n': {
    lines: 'armour(20), es(10), lifeRegen(0.6)',
    why: 'Armour, energy shield and regeneration, the hybrid defence of the str/int class (the one armour line near the Vanguard): 1.7 + 2 + 1.5 units.',
  },
  'cathedral.home.lectern.n': {
    lines: 'spellDamage(20), skillDuration(15)',
    why: 'Spells that last: damage and duration, for brands, totems and lingering spells alike: 2.5 + 1.5 units.',
  },
  'cathedral.home.wake.n': {
    lines: 'es(12), life(10)',
    why: 'Energy shield and life together, the Zealot standing in both pools: 2.4 + 2 units.',
  },
  'cathedral.choir.rite.n': {
    lines: 'physSpell(24), eleDamageAll(16), int(10)',
    why: 'Physical spells with elemental damage, and the intelligence a caster’s gear asks: the first step toward Faith Unleashed, which turns those spells to lightning: 2 + 1.6 + 1 units.',
  },
  'cathedral.choir.font.n': {
    lines: "eleDamage('cold', 20), chillEffect(15), freezeChance(8)",
    why: "Cold's first rung, spell and attack alike, chill and freeze (its shield line went: shields have their own homes): 2 + 1.5 + 1 units.",
  },
  'cathedral.choir.hymn.n': {
    lines: "eleDamage('lightning', 20), shockEffect(15), castSpeed(4)",
    why: "Lightning's first home, the caster's: damage, a deeper shock and faster casting: 2 + 1.5 + 1 units.",
  },
  'cathedral.crypt.rood.n': {
    lines: 'spellBlock(6), es(6)',
    why: "Spell block first, a little energy shield (the Spire's Quickening sells recharge close by): 3 + 1.2 units.",
  },
  'cathedral.pyre.sexton.n': {
    lines: 'minionDamage(20), regenWithMinion(0.8), life(5)',
    why: 'The gravedigger tends the summoner: minion damage, and the Zealot regenerates while a servant stands: 1.7 + 1.6 + 1 units.',
  },
  'cathedral.ambulatory.tithe.n': {
    name: 'Alms',
    lines: "leechLife(1, ['attack']), lifeOnHit(6, ['attack'])",
    why: "Leech and life on hit with attacks, generic ground on the Wall's border road (renamed: Tithe is a relic): 2.5 + 1.5 units.",
  },
  'cathedral.ambulatory.plate.n': {
    name: "Pilgrim's Mantle",
    lines: 'avoidAilments(20), life(10)',
    why: "Ailments shrugged off and life, generic ground on the Wall's border road (the Wall sells armour, stun and grit there): 2 + 2 units.",
  },
  'cathedral.ambulatory.verger.n': {
    lines: "weaponDamage('sceptre', 24), manaOnHit(6), eleDamageAll(8)",
    why: 'The sceptre-bearing caster-warrior: sceptre damage, mana back on every hit, and elemental damage (its armour line went: one armour line near the Vanguard): 2 + 1.5 + 0.8 units.',
  },
  'cathedral.rim.ossuary.n': {
    lines: 'minionDamage(20), damageWithMinion(16), minionLife(10)',
    why: 'The bone host at the rim: the servants hit harder, and so does the Zealot while one stands: 1.7 + 1.6 + 0.8 units.',
  },
  'cathedral.walk.peal.n': {
    lines: "eleAttackOne('lightning', 24), shockChance(15), attackSpeed(4)",
    why: "Lightning's second home is the holy warrior's: lightning attacks that shock (Hymn is the caster's): 2 + 1.5 + 0.8 units.",
  },
  'cathedral.walk.plainsong.n': {
    lines: 'channelDamage(20), channelGuard(4), castSpeed(4)',
    why: 'Channelling as a line, not a section: damage, and the channeller holds against blows while it sings: 2 + 3 + 1 units.',
  },
  'cathedral.walk.vespers.n': {
    lines: 'mana(20), costReduction(6)',
    why: 'The evening office: more mana and cheaper skills (spells with duration moved to Lectern): 2.5 + 1.5 units.',
  },
  'cathedral.home.wake.n': {
    lines: 'es(10), life(8), mana(8)',
    why: 'Energy shield, life and mana: the Zealot standing in every pool: 2 + 1.6 + 1 units.',
  },
  'cathedral.rods.wheel.r3': {
    lines: "weaponDamage('sceptre', 24), weaponCrit('sceptre', 15), str(10)",
    why: 'Sceptre damage and crit, and the strength a sceptre asks: 2 + 1 + 1 units.',
  },
  'cathedral.rods.wheel.m3': {
    lines: 'spellDamage(16), eleDamageAll(10), costReduction(5)',
    why: 'Elemental spells, cheaper to cast: 2 + 1 + 1.3 units.',
  },
  'cathedral.walk.tomb.n': {
    lines: 'chaosSpell(24), skillDuration(10), spellArea(8)',
    why: 'Chaos spells that linger and spread: 2 + 1 + 1 units.',
  },
  'cathedral.pyre.wheel.f5': {
    lines: 'auraEffect(12), es(8), reducedReservation(4)',
    why: 'Aura effect, energy shield and auras that cost less to hold: 2 + 1.6 + 1.3 units.',
  },
  'cathedral.walk.crozier.n': {
    lines: 'staffSpellDamage(20), castSpeed(4), mana(10)',
    why: 'Spells cast through a staff: damage, speed and the mana to keep going: 2.5 + 1 + 1.3 units.',
  },
};
const trim: Record<string, string[]> = {
  'cathedral.home.omen': ['b'],
};
const newc: NewCluster[] = [
  {
    area: 'pyre',
    id: 'fireRule',
    name: 'Faith Aflame',
    lines: "physGainFire(8), eleDamage('fire', 12)",
    smalls: ["eleDamage('fire', 8)", "eleDamage('fire', 8)"],
    entry: 'cathedral.walk.ring.q3',
    toward: K(4560, -8),
    why: "Fire's rule: every hit, spell or attack, gains part of its physical damage as fire; the holy warrior's road to Searing Avatar: 2.7 + 1.2 units.",
  },
  {
    area: 'walk',
    id: 'lightRule',
    name: 'Faith Unleashed',
    lines: 'spellPhysToLightning(30), damageVsShocked(15)',
    smalls: ["eleDamage('lightning', 8)", "eleDamage('lightning', 8)"],
    entry: 'cathedral.walk.ring.q7',
    toward: K(4560, 19),
    why: "Lightning's rule, for the priest: physical spells turned to lightning (Shattering Rite's road), and more damage on shocked enemies: 3 + 1.5 units.",
  },
  {
    area: 'nave',
    id: 'brandCount',
    name: 'Many Sigils',
    lines: 'brandLimit(1), skillDuration(10)',
    smalls: ['brandDamage(8)', 'brandDamage(8)'],
    entry: 'cathedral.nave.ring.b',
    toward: K(3170, 0),
    why: 'One more brand out at a time: the consecrated ground grows (the deploy count brands use), and each lasts longer: 4 + 1 units.',
  },
  {
    area: 'choir',
    id: 'minionSustain',
    name: 'Shepherd’s Crook',
    lines: 'minionRegen(1), minionRes(15)',
    smalls: ['minionRes(8)', 'minionLife(8)'],
    entry: 'cathedral.choir.ring.a',
    ats: [K(2800, 23.5), K(2700, 25), K(2600, 26.5)],
    why: 'Servants that recover: they regenerate and resist the elements (Shepherd and the Spire’s Familiars sell their life): 2 + 1.9 units.',
  },
  {
    area: 'nave',
    id: 'auraPerAura',
    name: 'Chorus',
    lines: 'regenPerAura(0.4), reducedReservation(6)',
    smalls: ['auraEffect(4)', 'auraEffect(4)'],
    entry: 'cathedral.nave.ring.c',
    toward: K(3150, 8),
    why: 'Every aura held mends the Zealot (the calc’s count of auras standing), and auras cost less to hold: 2 units at two auras + 2.',
  },
  {
    area: 'home',
    id: 'zeal',
    name: 'Zeal',
    lines: 'eleDamageAll(16), globalDefences(8), str(10), int(10)',
    smalls: [],
    ats: [K(2050, 0)],
    why: 'The home generalist, passed through between the two hubs (step 5): elemental faith and defences every Zealot uses.',
  },
];
const second: Second[] = [
  {
    cluster: 'cathedral.walk.crozier',
    attach: 'n',
    id: 'judge',
    name: 'Staff of Judgement',
    lines: "weaponCrit('staff', 40), weaponCritMulti('staff', 20)",
    why: 'Staff crit with a payoff, hooked on Crozier at the rim: the staff fighter’s far home, apart from Quarterstaff and Warding Staff.',
  },
  {
    cluster: 'cathedral.nave.warding',
    attach: 'n',
    id: 'whirl',
    name: 'Whirling Ward',
    lines: 'insightOnStaffBlock(25), staffDamage(12)',
    why: "The staff's payoff: a block with a staff may give an insight charge (crit for the staff fighter): 3.1 + 1 units.",
  },
  {
    cluster: 'cathedral.nave.wheel',
    attach: 'n3',
    id: 'steadfast',
    name: 'Steadfast Faith',
    lines: "shieldBlock(4), recoverOn('block', 'life', 2)",
    why: "Block recovery, the Cathedral's sustain behind a shield: every block mends 2% of life: 2 + 2.4 units.",
  },
  {
    cluster: 'cathedral.crypt.shrine',
    attach: 'n',
    id: 'hallowed',
    name: 'Hallowed Ground',
    lines: 'damageWithTotem(25), globalDefences(12)',
    why: 'What the Zealot plants works for it: while a totem stands, it hits harder and holds firmer: 2.5 + 1.5 units.',
  },
  {
    cluster: 'cathedral.pyre.wheel',
    attach: 'f5',
    id: 'ire',
    name: 'Choir of Wrath',
    lines: 'damagePerAura(12), mana(12)',
    why: 'Every aura held sharpens the Zealot: damage for each aura standing (2.4 units at two auras), with the mana to keep casting: 2.4 + 1.5 units.',
  },
  {
    cluster: 'cathedral.rim.hymn',
    attach: 'n',
    id: 'warHymn',
    name: 'Hymn of War',
    lines: 'insightOnWarcry(36), critMulti(12)',
    why: "The war chant kindles insight: a warcry may give an insight charge (the Wall's warcries give grit), and crits strike deeper: 3 + 1 units.",
  },
  {
    cluster: 'cathedral.ambulatory.kindled',
    attach: 'n',
    id: 'ember',
    name: 'Ember Litany',
    lines: "recoverOn('killIgnited', 'life', 4), eleAttackOne('fire', 12)",
    why: 'The fire striker feeds on the burning: killing an ignited enemy mends 4% of life: 3.2 + 1 units.',
  },
];
const pairs: [string, string][] = [
  ['cathedral.choir.wheel', 'cathedral.choir.minionSustain'],
  ['cathedral.choir.font', 'cathedral.nave.wheel'],
  ['cathedral.walk.tomb', 'cathedral.walk.plainsong'],
  ['cathedral.rim.ossuary', 'cathedral.rim.hymn'],
];

if (process.argv[1]?.endsWith('cathedral-gen.ts'))
  generate({
    region: 'cathedral',
    regionId: 'zealot',
    classId: 'zealot',
    th: -150,
    start: S0,
    roadLines: 'str(6), int(6)',
    hubLines: 'str(15), int(15)',
    roads,
    moves,
    links,
    over,
    trim,
    newc,
    second,
    pairs,
    external: {
      'wall.resists.radW.a': lerp(K(1600, -30), K(2900, -30), 1 / 3),
      'wall.resists.radW.b': lerp(K(1600, -30), K(2900, -30), 2 / 3),
      'wall.resists.radW.m': K(2900, -30),
      'wall.home.seams.s': K(1600, -30),
      'wall.grit.ring.s0': K(4300, -30),
      'spire.well.radW.a': lerp(K(1600, 30), K(2900, 30), 1 / 3),
      'spire.well.radW.b': lerp(K(1600, 30), K(2900, 30), 2 / 3),
      'spire.well.radW.m': K(2900, 30),
      'spire.home.seams.w': K(1600, 30),
      'spire.rim.ring.w0': K(4300, 30),
    },
    areas: {
      home: {
        name: 'The Cathedral Gate',
        at: K(1900, 5),
        why: "The Zealot's first points (R-cathedral.md).",
      },
      choir: {
        name: 'The Choir',
        at: K(2700, 22),
        why: 'The north-east spoke: servants and auras.',
      },
      crypt: {
        name: 'The Undercroft',
        at: K(2500, 27),
        why: "The Spire's border: brands and totems.",
      },
      nave: {
        name: 'The Nave',
        at: K(2800, 0),
        why: 'The axis at the mid ring: shields and spell block.',
      },
      pyre: {
        name: 'The Bell Tower',
        at: K(4000, 0),
        why: 'The axis toward the rim: cold, auras, fire’s keystone.',
      },
      rods: {
        name: 'The Vestry',
        at: K(2700, -22),
        why: 'The south-west spoke: staves and sceptres.',
      },
      ambulatory: {
        name: 'The Ambulatory',
        at: K(2500, -27),
        why: "The Wall's border: sceptres with armour, fire attacks, leech, warcries.",
      },
      rim: {
        name: 'The Churchyard',
        at: K(4100, -20),
        why: 'South-west toward the rim: fire, auras, spell block.',
      },
      walk: {
        name: 'The Lychway',
        at: K(4100, 20),
        why: 'North-east toward the rim: lightning, minions, chaos, channelling.',
      },
    },
    doc: 'R-cathedral.md',
    dryRun: process.argv.includes('--dry'),
  });
