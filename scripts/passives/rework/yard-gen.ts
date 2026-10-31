// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// The Yard's table (docs/tree/design/R-yard.md), written into src/data/passives/yard/ by region-gen-lib.ts from the region
// as it was (before/yard.json). Offsets in degrees from the Yard's angle (90): negative is the Bow's side (east),
// positive the Wall's (west). Run: npx tsx scripts/passives/rework/yard-gen.ts [--dry]
import { generate, polar, lerp, type Road, type Move, type NewCluster, type Second, type Over } from './region-gen-lib.ts';

const K = polar(90);
const S0 = K(1450, 0);
const hubN = K(1690, -5), hubS = K(1690, 5);
const xN = K(2050, -11.7), xS = K(2050, 11.7);
const mN1 = K(2900, -13), mS1 = K(2900, 13), mS0 = K(2900, 30);
const rN1 = K(4300, -13), rS1 = K(4300, 13), rS0 = K(4300, 30);
const seamS = K(1600, 30);

const roads: Road[] = [];
roads.push({
  area: 'home', id: 'sig', name: 'The two sides',
  why: "The start's two exits, each a strong small every Reaver takes, as the reference's str/dex start opens: physical attack damage with life toward the Bow, armour with life toward the Wall. Each opens three ways at the next step.",
  nodes: [
    { id: 'a', at: K(1530, -6), kind: 'small', lines: 'physAttack(12), life(5)', why: 'The east side: physical attack damage and life.' },
    { id: 'b', at: K(1530, 6), kind: 'small', lines: 'globalDefences(10), life(5)', why: 'The west side: defences of every kind (armour, evasion, energy shield) and life: every Reaver takes it.' },
  ],
  links: [],
});
roads.push({
  area: 'home', id: 'hubs', name: 'The hubs',
  why: "Both attributes a step past each side: each forks into the spoke out into the region and the road in to Quickened Steel.",
  nodes: [{ id: 'n', at: hubN, hub: true }, { id: 's', at: hubS, hub: true }],
  links: [],
});
roads.push({
  area: 'home', id: 'pathN', name: 'The north path',
  why: "The third way out of the east side: two attack speed nodes along the bow toward the Bow's seam.",
  nodes: [
    { id: 'a', at: K(1590, -13), kind: 'small', lines: 'attackSpeed(4)' },
    { id: 'b', at: K(1690, -17), kind: 'small', lines: 'attackSpeed(4)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home', id: 'pathS', name: 'The south path',
  why: 'The third way out of the west side: life and physical attack damage along the bow toward the Wall seam.',
  nodes: [
    { id: 'a', at: K(1590, 13), kind: 'small', lines: 'life(4)' },
    { id: 'b', at: K(1690, 17), kind: 'small', lines: 'physAttack(8)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home', id: 'seams', name: 'The south seam',
  why: "Where the Yard's roads meet the Wall's on the west border; it runs on along the border into the centre and out to the mid ring. (The east seam is the Bow's.)",
  nodes: [{ id: 's', at: seamS }],
  links: [],
});
roads.push({
  area: 'home', id: 'spN', name: 'The north spoke', why: 'The north spoke from its hub to the junction with the cross roads.',
  nodes: [{ id: 'a', at: lerp(hubN, xN, 0.5) }, { id: 'x', at: xN }], links: [['a', 'x']],
});
roads.push({
  area: 'home', id: 'spS', name: 'The south spoke', why: 'The south spoke from its hub to the junction with the cross roads.',
  nodes: [{ id: 'a', at: lerp(hubS, xS, 0.5) }, { id: 'x', at: xS }], links: [['a', 'x']],
});
roads.push({
  area: 'home', id: 'cross', name: "The roads to Quickened Steel",
  why: "From each hub two stat nodes in to Quickened Steel on the axis (step 5): life on the east road, resistances on the west, defences every Reaver takes.",
  nodes: [
    { id: 'n1', at: K(1800, -3.4), kind: 'small', lines: 'life(5)' },
    { id: 'n2', at: K(1925, -1.7), kind: 'small', lines: 'life(5)' },
    { id: 's1', at: K(1800, 3.4), kind: 'small', lines: 'resAll(4)' },
    { id: 's2', at: K(1925, 1.7), kind: 'small', lines: 'resAll(4)' },
  ],
  links: [['n1', 'n2'], ['s1', 's2']],
});
roads.push({
  area: 'shield', id: 'radW', name: 'The south border road',
  why: 'From the Wall seam out along the border to the mid ring: the ground between the two regions beyond the starts.',
  nodes: [{ id: 'a', at: lerp(seamS, mS0, 1 / 3) }, { id: 'b', at: lerp(seamS, mS0, 2 / 3) }, { id: 'm', at: mS0 }],
  links: [['a', 'b'], ['b', 'm']],
});
roads.push({
  area: 'dual', id: 'spN', name: 'The north spoke, outer',
  why: 'The north spoke from the cross-road junction out to the mid ring and on toward the rim.',
  nodes: [{ id: 'a', at: lerp(xN, mN1, 1 / 3) }, { id: 'b', at: lerp(xN, mN1, 2 / 3) }, { id: 'm', at: mN1 }, { id: 'c', at: lerp(mN1, rN1, 0.5) }],
  links: [['a', 'b'], ['b', 'm'], ['m', 'c']],
});
roads.push({
  area: 'blades', id: 'spS', name: 'The south spoke, outer',
  why: 'The south spoke from the cross-road junction out to the mid ring and on toward the rim.',
  nodes: [{ id: 'a', at: lerp(xS, mS1, 1 / 3) }, { id: 'b', at: lerp(xS, mS1, 2 / 3) }, { id: 'm', at: mS1 }, { id: 'c', at: lerp(mS1, rS1, 0.5) }],
  links: [['a', 'b'], ['b', 'm'], ['m', 'c']],
});
roads.push({
  area: 'dual', id: 'ring', name: 'The mid ring, north', why: "The mid ring's stretch between the Bow's border road and the east spoke.",
  nodes: [{ id: 'a', at: lerp(K(2900, -30), mN1, 0.5) }], links: [],
});
roads.push({
  area: 'blood', id: 'ring', name: 'The mid ring, centre',
  why: "The mid ring's stretch across the axis between the two spokes.",
  nodes: [{ id: 'a', at: lerp(mN1, mS1, 0.25) }, { id: 'b', at: lerp(mN1, mS1, 0.5) }, { id: 'c', at: lerp(mN1, mS1, 0.75) }],
  links: [['a', 'b'], ['b', 'c']],
});
roads.push({
  area: 'blades', id: 'ring', name: 'The mid ring, south', why: "The mid ring's stretch between the west spoke and the west border road.",
  nodes: [{ id: 'a', at: lerp(mS1, mS0, 0.5) }], links: [],
});
{
  // The rim ring from the Bow's at the east border (bow.rim.ring.s0) to the west border.
  const rim = [];
  let q = 0;
  for (const t of [1 / 3, 2 / 3]) rim.push({ id: `q${++q}`, at: lerp(K(4300, -30), rN1, t) });
  rim.push({ id: 'n1', at: rN1 });
  for (const t of [0.2, 0.4, 0.6, 0.8]) rim.push({ id: `q${++q}`, at: lerp(rN1, rS1, t) });
  rim.push({ id: 's1', at: rS1 });
  for (const t of [1 / 3, 2 / 3]) rim.push({ id: `q${++q}`, at: lerp(rS1, rS0, t) });
  rim.push({ id: 's0', at: rS0 });
  const links: [string, string][] = [];
  for (let i = 1; i < rim.length; i++) links.push([rim[i - 1].id, rim[i].id]);
  roads.push({ area: 'fosse', id: 'ring', name: 'The rim ring', why: "The rim ring across the Yard, from the Bow's border to the Wall's.", nodes: rim, links });
}

const links: [string, string, string][] = [
  ['start.reaver', 'yard.home.sig.a', 'Point one, the north side.'],
  ['start.reaver', 'yard.home.sig.b', 'Point one, the south side.'],
  ['yard.home.sig.a', 'yard.home.hubs.n', 'Point two: the north hub.'],
  ['yard.home.sig.b', 'yard.home.hubs.s', 'Point two: the south hub.'],
  ['yard.home.sig.a', 'yard.home.pathN.a', "Point two: the north path toward the Bow's seam."],
  ['yard.home.sig.b', 'yard.home.pathS.a', 'Point two: the south path toward the Wall seam.'],
  ['yard.home.pathS.b', 'yard.home.seams.s', 'The west path reaches the Wall seam.'],
  ['yard.home.hubs.n', 'yard.home.cross.n1', "The north hub in toward Quickened Steel."],
  ['yard.home.hubs.n', 'yard.home.spN.a', 'The north hub out along the spoke.'],
  ['yard.home.hubs.s', 'yard.home.cross.s1', "The south hub in toward Quickened Steel."],
  ['yard.home.hubs.s', 'yard.home.spS.a', 'The south hub out along the spoke.'],
  ['yard.home.cross.n2', 'yard.home.quick.n', 'To the home notable.'],
  ['yard.home.cross.s2', 'yard.home.quick.n', 'To the home notable.'],
  ['yard.home.seams.s', 'centre.ring.road.r13', 'Along the border into the centre.'],
  ['yard.home.seams.s', 'yard.shield.radW.a', 'Along the border out to the mid ring.'],
  ['yard.home.spN.x', 'yard.dual.spN.a', 'The north spoke goes on.'],
  ['yard.home.spS.x', 'yard.blades.spS.a', 'The south spoke goes on.'],
  ['yard.dual.spN.c', 'yard.fosse.ring.n1', 'The north spoke reaches the rim ring.'],
  ['yard.blades.spS.c', 'yard.fosse.ring.s1', 'The south spoke reaches the rim ring.'],
  ['yard.dual.ring.a', 'bow.steel.radS.m', "The mid ring meets the Bow's border road."],
  ['yard.dual.ring.a', 'yard.dual.spN.m', 'The mid ring meets the north spoke.'],
  ['yard.dual.spN.m', 'yard.blood.ring.a', 'The mid ring on toward the axis.'],
  ['yard.blood.ring.c', 'yard.blades.spS.m', 'The mid ring meets the south spoke.'],
  ['yard.blades.spS.m', 'yard.blades.ring.a', 'The mid ring on toward the south border.'],
  ['yard.blades.ring.a', 'yard.shield.radW.m', 'The mid ring meets the south border road.'],
  ['yard.fosse.ring.q1', 'bow.rim.ring.s0', "The rim ring meets the Bow's."],
  ['yard.home.seams.s', 'wall.slams.toYard.a', 'Temporary: the old Wall road toward the Yard, until the Wall pass.'],
  ['yard.shield.shieldwall.a', 'yard.shield.shieldwall.d', 'The spur to the keystone (the old file left it cut off).'],
];

export const tables = { K, roads, links };

// ---- Clusters, notables and links.
const moves: Move[] = [
  // The Gate (home, steps 5 to 7): a damage and a defence home on each half.
  { from: 'blades.killingPace', area: 'home', at: K(1760, -24), ats: { a: K(1790, -20.5), n: K(1735, -26.5) }, entry: [['a', 'yard.home.pathN.b'], ['n', 'bow.home.seams.s']], why: "Speed and life from kills, on the east path to the Bow's seam (step 5): the path runs through it, so the neighbouring starts sit further apart." },
  { from: 'home.fieldDressing', area: 'home', at: K(1450, -21), entry: [['a', 'yard.home.pathN.b']], why: 'The flask layer near home, a side room off the east path toward the centre.' },
  { from: 'home.fightingBreath', area: 'home', at: K(2160, -5.5), entry: [['a', 'yard.home.spN.x']], why: 'The one mana notable near home, off the east spoke junction.' },
  { from: 'home.life', area: 'home', at: K(1890, 21.5), entry: [['a', 'yard.home.pathS.b']], why: 'Life and regeneration, a side room off the west path, outward: the west half’s defence.' },
  { from: 'blades.guarded', area: 'home', at: K(1450, 21), entry: [['c', 'yard.home.pathS.b']], why: 'Armour and evasion, a side room off the west path toward the centre.' },
  { from: 'blood.cleanBreak', area: 'home', at: K(2240, 19.5), entry: [['a', 'yard.home.spS.x']], why: 'Physical attack damage and crit, off the west spoke junction: the west half’s damage.' },
  // The Lists (east): dual wielding, evasion, impale, fervour, the Bow seam.
  { from: 'dual.footwork', area: 'dual', at: K(2080, -24.5), entry: [['a', 'bow.steel.radS.a']], why: "Accuracy and reach for the duellist, off the Bow's border road." },
  { from: 'dual.twinFangs', area: 'dual', at: K(2490, -24), entry: [['a', 'bow.steel.radS.b']], why: "Dual wielding or evasion, the two sides of one wheel, off the Bow's border road (step 9)." },
  { from: 'dual.sidestep', area: 'dual', at: K(2400, -6), entry: [['a', 'yard.dual.spN.a']], why: 'Dodge, off the east spoke toward the axis.' },
  { from: 'dual.crossedBlades', area: 'dual', at: K(3960, -23), entry: [['a', 'yard.fosse.ring.q1']], why: 'Dual-wield crit, in from the mid ring2019s east stretch (step 10).' },
  { from: 'dual.darting', area: 'dual', id: 'impale', at: K(2650, -7), entry: [['a', 'yard.dual.spN.b']], why: 'Impale’s first home: the swordsman who skewers, off the east spoke toward the axis.' },
  { from: 'dual.hotBlood', area: 'dual', at: K(3200, -22.5), entry: [['a', 'yard.dual.ring.a']], why: 'Fervour’s third home (a charge more), out from the mid ring’s east stretch.' },
  { from: 'blood.woundDance', area: 'dual', at: K(3050, -15.5), entry: [['a', 'yard.dual.spN.m']], why: 'The bleed keystone, a spur out from where the east spoke meets the mid ring.' },
  { from: 'blood.openVeins', area: 'dual', at: K(3600, -19.5), entry: [['a', 'yard.dual.spN.c']], why: 'Bleed, off the east spoke past the mid ring.' },
  // The Pits (the axis at the mid ring).
  { from: 'blood.swing', area: 'blood', at: K(3170, 0), entry: [['a', 'yard.blood.ring.b']], why: 'The paired blades or the two-handed swing, the two sides of one wheel: a choice, out from the mid ring at the axis.' },
  { from: 'shield.star', area: 'blood', at: K(2610, 0), entry: [['s', 'yard.blood.ring.b']], why: 'Resistances, in from the mid ring at the axis.' },
  { from: 'blood.redHarvest', area: 'blood', at: K(3170, -8.5), entry: [['a', 'yard.blood.ring.a']], why: 'Leech, out from the mid ring west of the Bow border (moved off it).' },
  // The axis toward the rim.
  { from: 'shield.fencer', area: 'fosse', at: K(3960, -2.6), entry: [['a', 'yard.fosse.ring.q4']], why: 'Crit with swords and axes, in from the rim ring at the axis.' },
  { from: 'blades.elementalEdge', area: 'fosse', at: K(3960, 2.6), entry: [['a', 'yard.fosse.ring.q5']], why: 'Elemental blades, in from the rim ring at the axis (a melee hook in the notables pass).' },
  { from: 'shield.standard', area: 'fosse', at: K(3960, -8), entry: [['a', 'yard.fosse.ring.q3']], why: 'Auras and speed, in from the rim ring.' },
  { from: 'shield.shieldBash', area: 'fosse', at: K(3960, 8), entry: [['a', 'yard.fosse.ring.q6']], why: 'Shield attacks, in from the rim ring (the shields spread).' },
  { from: 'fosse.bloodied', area: 'fosse', at: K(4560, -19), entry: [['a', 'yard.fosse.ring.q2']], why: 'Sword leech, out from the rim ring.' },
  // The Practice Ground (west spoke) and the Muster (west border).
  { from: 'blades.mail', area: 'blades', at: K(2400, 19), entry: [['a', 'yard.blades.spS.a']], why: 'Armour and regeneration, off the west spoke.' },
  { from: 'blades.keenEdge', area: 'blades', at: K(2720, 19), entry: [['a', 'yard.blades.spS.b']], why: 'Swords, west, off the west spoke toward the axis (step 9).' },
  { from: 'blades.lightBlades', area: 'blades', at: K(3230, 20), entry: [['a', 'yard.blades.ring.a']], why: 'One-handed, west (the Bow’s Light Hand is east), out from the mid ring’s west stretch.' },
  { from: 'blood.crimsonPact', area: 'blades', at: K(3050, 15.5), entry: [['a', 'yard.blades.spS.m']], why: 'The leech keystone, a spur out from where the west spoke meets the mid ring.' },
  { from: 'blades.board', area: 'blades', at: K(3600, 18), entry: [['a', 'yard.blades.spS.c']], why: 'Swords with a shield, off the west spoke past the mid ring.' },
  { from: 'blood.lasting', area: 'blades', at: K(3600, 7), entry: [['a', 'yard.blades.spS.c']], why: 'Bleed duration, off the west spoke past the mid ring, by the bleed payoff and the axes.' },
  { from: 'home.block', area: 'shield', at: K(2490, 24), entry: [['a', 'yard.shield.radW.b']], why: 'Shields, the Wall seam’s theme, off the west border road (step 9).' },
  { from: 'shield.steelRim', area: 'shield', at: K(3160, 26), entry: [['a', 'yard.shield.radW.m']], why: 'Shield defence or stun, the two sides of one wheel, out from where the west border road meets the mid ring.' },
  { from: 'shield.shieldwall', area: 'shield', at: K(2720, 24.5), ats: { a: K(2810, 23.2), b: K(0, 0), c: K(0, 0), d: K(2730, 24.3), k: K(2650, 25.4) }, entry: [['a', 'yard.blades.ring.a']], why: 'The shield keystone, a spur in from the mid ring’s west stretch.' },
  { from: 'blades.executioner', area: 'fosse', at: K(4560, 13.5), entry: [['a', 'yard.fosse.ring.s1']], why: 'Against the bleeding, culling: out from the rim ring at the west spoke.' },
  { from: 'blades.hewing', area: 'fosse', at: K(4560, 25), entry: [['a', 'yard.fosse.ring.q8']], why: 'Axes with bleed, out from the rim ring toward the Wall’s axes.' },
  { from: 'home.drill', area: 'fosse', at: K(3960, 24.5), entry: [['a', 'yard.fosse.ring.q8']], why: 'Warcries, in from the rim ring toward the Wall’s.' },
];
const over: Over = {
  // The Gate.
  'yard.home.cleanBreak.n': { lines: 'physAttack(24), critMulti(20)', why: 'The west half\u2019s damage near home: physical attacks that crit hard.' },
  'yard.home.guarded.n': { lines: 'armour(24), evasion(24)', why: 'Both defences of the duellist, toward the centre.' },
  'yard.shield.block.n': { lines: 'shieldBlock(5), attackSpeed(8)', why: 'The light shield of the quick duellist, at the Wall seam.' },
  'yard.blades.mail.n': { lines: 'armour(24), meleePhys(20)', why: 'Armour that hits back: guard and strike alike.' },
  'yard.fosse.standard.n': { lines: 'reducedReservation(8), attackSpeed(6)', why: 'An aura carried into the fight, and the speed to use it.' },
  'yard.fosse.drill.n': { lines: 'warcryEffect(25), attackSpeed(8)', why: 'Warcries that drive the attack, beside the Wall\u2019s warcries.' },
  'yard.home.killingPace.n': { lines: 'attackSpeedOnKill(15), meleePhys(16)', why: 'Kills quicken the blade (its movement line went; sustain lives in the Yard\u2019s leech homes).' },
  'yard.home.fieldDressing.n': { lines: 'flaskRecovery(20), flaskDuration(20)', why: 'The flask layer near home (its movement line went).' },
  // The Lists.
  'yard.dual.hotBlood.n': { lines: 'maxFervour(1), fervourOnBlock(20)', why: 'Fervour from the parry (a block), not from kills as the Bow\u2019s is: one charge more.' },
  'yard.dual.twinFangs.n2': { name: 'Weaving', lines: "evasion(12), elusiveOn('evade', 25), dualDamage(10)", why: 'The dual wielder who slips away: an evaded attack may make the Reaver Elusive.' },
  'yard.dual.sidestep.n': { lines: 'dodgeAttack(6), meleePhys(20)', why: 'The duellist who slips a blow and strikes: dodge with melee damage (its life on hit, at the Bow border, went).' },
  'yard.dual.impale.n': { name: 'Spitting Blade', lines: 'swordDamage(16), impaleChance(20)', why: 'Impale\u2019s first home: the swordsman who skewers (it was a copy of the Bow\u2019s Fleet Blade).' },
  // The Pits.
  'yard.blood.swing.n2': { lines: 'dualDamage(20), leechLife(0.6), bleedChance(10)', why: 'The paired blades: blood both ways, leech and bleed, against the two-handed swing.' },
  // Toward the rim.
  'yard.fosse.elementalEdge.n': { lines: 'eleAttack(16), meleeGainFire(10)', why: 'Burning blades: melee hits gain fire, which the Bow\u2019s arrows cannot.' },
  'yard.fosse.shieldBash.n': { lines: 'shieldAttack(20), shieldSpeed(8), stunDuration(20)', why: 'The shield that stuns (its life on block repeated the Bow\u2019s Braced Guard).' },
  // The Practice Ground.
  'yard.blades.keenEdge.n': { lines: 'swordDamage(24), damageAfterBlock(16)', why: 'The parrying swordsman: a block opens the guard.' },
  'yard.blades.board.n': { lines: 'swordDamage(20), shieldBlock(4), blockRecovery(20)', why: 'Sword and shield: block, and be ready to block again.' },
  'yard.fosse.fencer.n': { lines: 'critMulti(25), critVsBleeding(40)', why: 'The fencer\u2019s crit finds the bleeding: it feeds on Hundred Cuts.' },
  'yard.blades.lightBlades.n': { lines: 'oneHandMelee(24), impaleChance(12)', why: 'One-handed blades that skewer: impale\u2019s second carrier, unlike the Bow\u2019s Light Hand.' },
  'yard.home.guarded.a': { lines: 'evasion(10)' },
  'yard.home.guarded.c': { lines: 'evasion(10)' },
  'yard.dual.woundDance.k': { name: 'Hundred Cuts', lines: '' },
  'yard.blades.crimsonPact.k': { name: 'Blood Bargain', lines: '' },
};
const trim: Record<string, string[]> = {
  'yard.shield.shieldwall': ['b', 'c'],
};
const newc: NewCluster[] = [
  { area: 'dual', id: 'parry', name: 'Off-Hand Parry', lines: "dualBlock(5), quickenedOnDualBlock(40)", smalls: ['dualBlock(2)', 'dualBlock(2)'], entry: 'yard.dual.spN.b', toward: K(2720, -19), why: 'The dual-wield rule: a block while dual wielding quickens the next blows.' },
  { area: 'fosse', id: 'impalePay', name: 'Run Through', lines: "impaleEffect(25), impaleChance(10)", smalls: ['physAttack(8)', 'physAttack(8)'], entry: 'yard.fosse.ring.q1', toward: K(4560, -25), why: 'Impale’s payoff, out from the rim ring.' },
  { area: 'fosse', id: 'thirst', name: 'Red Thirst', lines: "damageWhileLeeching(30), leechLife(0.5)", smalls: ['leechLife(0.2)', 'leechLife(0.2)'], entry: 'yard.fosse.ring.n1', toward: K(3960, -13.5), why: 'Damage while leeching, by Bloodied Edge, far from Red Harvest.' },
  { area: 'blades', id: 'armour', name: 'Iron Skin', lines: "armour(20), armourVsEle(10)", smalls: ['armour(10)', 'armour(10)'], entry: 'yard.blades.spS.c', toward: K(3750, 24), why: 'An armour rule, off the west spoke past the mid ring.' },
  { area: 'blood', id: 'riposte', name: 'Answering Steel', lines: "damageAfterBlock(30), costReduction(8)", smalls: ['meleePhys(8)', 'meleePhys(8)'], entry: 'yard.blood.ring.c', toward: K(2650, 7), why: 'Damage after a block, for shield and dual-wield blockers alike: on the axis, in reach of both.' },
  { area: 'shield', id: 'blockMana', name: 'Steady Guard', lines: "manaOnBlock(15), shieldBlock(4)", smalls: ['manaOnBlock(4)', 'manaOnBlock(4)'], entry: 'yard.shield.radW.b', toward: K(2620, 28.5), why: 'Mana on block, by the shields (past step 8).' },
  { area: 'fosse', id: 'fortify', name: 'Hold the Line', lines: "fortifyOnStun(50), damageWhileFortified(20)", smalls: ['armour(8)', 'armour(8)'], entry: 'yard.fosse.ring.q7', toward: K(3960, 19), why: 'Fortified is earned by stunning (two-handers and shields stun), then paid off: a state the duellist works for.' },
  { area: 'fosse', id: 'stunPay', name: 'Crushing Swing', lines: "twoHandDamage(16), damageVsStunned(25)", smalls: ['twoHandDamage(8)', 'twoHandDamage(8)'], entry: 'yard.fosse.ring.q7', toward: K(4560, 19), why: 'The two-handed stun payoff, out from the rim ring.' },
  { area: 'shield', id: 'mending', name: 'Bulwark Mending', lines: 'lifeOnBlock(35), costReduction(8)', smalls: ['lifeOnBlock(8)', 'lifeOnBlock(8)'], entry: 'yard.shield.radW.m', toward: K(3100, 22), why: 'Shield sustain: the block heals, and each blow costs less to answer.' },
  { area: 'home', id: 'quick', name: 'Honed Steel', lines: 'attackSpeed(8), meleePhys(12), str(10), dex(10)', smalls: [], ats: [K(2050, 0)], why: 'The home generalist, passed through between the two hubs (step 5): speed and steel every Reaver uses.' },
];
const second: Second[] = [
  { cluster: 'yard.dual.openVeins', attach: 'n', id: 'n2', name: 'Bloodied Pursuit', lines: 'damageVsBleeding(20), bleedFaster(15)', why: 'The east bleed\u2019s payoff beside Hundred Cuts: bleeds that tick faster, and more damage against the bleeding.' },
  { cluster: 'yard.dual.hotBlood', attach: 'n', id: 'n2', name: "Duellist's Fervour", lines: 'dualDamagePerFervour(4), fervourDuration(25)', why: 'Fervour paid off in the duellist\u2019s terms: damage for every charge held while dual wielding.' },
  { cluster: 'yard.fosse.fencer', attach: 'n', id: 'n2', name: 'Measured Cut', lines: 'critVsStunned(50), stunDuration(25)', why: 'The stunned enemy is an open target.' },
  { cluster: 'yard.blood.swing', attach: 'n1', id: 'n3', name: 'Momentum Swing', lines: 'twoHandDamage(20), enemyStunThreshold(20)', why: 'The two-handed swing that sets up the stun Crushing Swing pays off.' },
  { cluster: 'yard.blood.redHarvest', attach: 'n', id: 'n2', name: 'Crimson Reaping', lines: 'leechLife(0.8), leechRate(20)', why: 'Leech that flows faster: the Yard\u2019s sustain is blood drawn, not kills counted.' },
  { cluster: 'yard.fosse.drill', attach: 'n', id: 'n2', name: 'Rally', lines: 'warcryDuration(40), cooldownRecovery(15)', why: 'Warcries that last and return sooner.' },
  { cluster: 'yard.fosse.standard', attach: 'n', id: 'n2', name: 'Banner Guard', lines: 'auraEffect(18), manaRegen(20)', why: 'The standard bearer\u2019s auras.' },
  { cluster: 'yard.fosse.hewing', attach: 'n', id: 'n2', name: 'Wide Arc', lines: 'meleeAreaOnKill(30), axeDamage(16)', why: 'Each kill widens the axe\u2019s swing.' },
];
const pairs: [string, string][] = [
  ['yard.dual.parry', 'yard.dual.twinFangs'],
  ['yard.dual.hotBlood', 'yard.dual.openVeins'],
  ['yard.fosse.fortify', 'yard.fosse.drill'],
];

if (process.argv[1]?.endsWith('yard-gen.ts'))
  generate({
    region: 'yard', regionId: 'reaver', classId: 'reaver', th: 90, start: S0,
    roadLines: 'str(6), dex(6)', hubLines: 'str(15), dex(15)',
    roads, moves, links, over, trim, newc, second, pairs,
    external: {
      'bow.steel.radS.a': lerp(K(1600, -30), K(2900, -30), 1 / 3),
      'bow.steel.radS.b': lerp(K(1600, -30), K(2900, -30), 2 / 3),
      'bow.steel.radS.m': K(2900, -30),
      'bow.home.seams.s': K(1600, -30),
      'bow.rim.ring.s0': K(4300, -30),
    },
    areas: {
      home: { name: 'The Yard Gate', at: K(1900, 5), why: "The Reaver's first points (R-yard.md)." },
      dual: { name: 'The Lists', at: K(2700, -22), why: 'The east spoke: dual wielding, evasion, speed, the Bow seam.' },
      blades: { name: 'The Practice Ground', at: K(2700, 22), why: 'The west spoke: swords, axes, one-handed, armour.' },
      shield: { name: 'The Muster', at: K(2500, 27), why: 'The west border: shields, block and stun, the Wall seam.' },
      blood: { name: 'The Pits', at: K(3100, 0), why: 'The axis at the mid ring: bleed, leech, the paired blades or the two-handed swing.' },
      fosse: { name: 'The Fosse', at: K(4100, 0), why: 'Toward the rim: lightning blades, impale, the payoffs.' },
    },
    doc: 'R-yard.md',
    dryRun: process.argv.includes('--dry'),
  });
