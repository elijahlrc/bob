// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// The Bow's table (docs/tree/design/R-bow.md), written into src/data/passives/bow/ by region-gen-lib.ts from the region
// as it was (before/bow.json). Offsets in degrees from the Bow's angle (30): negative is the Knife's side (north),
// positive the Yard's (south). Run: npx tsx scripts/passives/rework/bow-gen.ts [--dry]
import { generate, polar, lerp, type Road, type Move, type NewCluster, type Second, type Over } from './region-gen-lib.ts';

const K = polar(30);
const S0 = K(1450, 0);
const hubN = K(1690, -5), hubS = K(1690, 5);
const xN = K(2050, -11.7), xS = K(2050, 11.7);
const mN1 = K(2900, -13), mS1 = K(2900, 13), mS0 = K(2900, 30);
const rN1 = K(4300, -13), rS1 = K(4300, 13), rS0 = K(4300, 30);
const seamS = K(1600, 30);

const roads: Road[] = [];
roads.push({
  area: 'home', id: 'sig', name: 'The two sides',
  why: "The start's two exits, each a strong small every Strider takes, as the reference's dex start opens: attack damage with life toward the Knife, evasion with life toward the Yard. Each opens three ways at the next step.",
  nodes: [
    { id: 'a', at: K(1530, -6), kind: 'small', lines: 'attackDamage(12), life(5)', why: 'The north side: attack damage and life.' },
    { id: 'b', at: K(1530, 6), kind: 'small', lines: 'evasion(15), life(5)', why: 'The south side: evasion and life.' },
  ],
  links: [],
});
roads.push({
  area: 'home', id: 'hubs', name: 'The hubs',
  why: "Dexterity a step past each side: each forks into the spoke out into the region and the road in to Hawk's Eye.",
  nodes: [{ id: 'n', at: hubN, hub: true }, { id: 's', at: hubS, hub: true }],
  links: [],
});
roads.push({
  area: 'home', id: 'pathN', name: 'The north path',
  why: "The third way out of the north side: two attack damage nodes along the bow toward the Knife's seam.",
  nodes: [
    { id: 'a', at: K(1590, -13), kind: 'small', lines: 'attackDamage(10)' },
    { id: 'b', at: K(1690, -17), kind: 'small', lines: 'attackDamage(10)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home', id: 'pathS', name: 'The south path',
  why: 'The third way out of the south side: two evasion nodes along the bow toward the Yard seam.',
  nodes: [
    { id: 'a', at: K(1590, 13), kind: 'small', lines: 'evasion(12)' },
    { id: 'b', at: K(1690, 17), kind: 'small', lines: 'evasion(12)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home', id: 'seams', name: 'The south seam',
  why: "Where the Bow's roads meet the Yard's on the south border; it runs on along the border into the centre and out to the mid ring. (The north seam is the Knife's.)",
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
  area: 'home', id: 'cross', name: "The roads to Hawk's Eye",
  why: "From each hub two stat nodes in to Hawk's Eye on the axis (step 5): life on the north road, resistances on the south, defences every Strider takes.",
  nodes: [
    { id: 'n1', at: K(1800, -3.4), kind: 'small', lines: 'life(5)' },
    { id: 'n2', at: K(1925, -1.7), kind: 'small', lines: 'life(5)' },
    { id: 's1', at: K(1800, 3.4), kind: 'small', lines: 'resAll(4)' },
    { id: 's2', at: K(1925, 1.7), kind: 'small', lines: 'resAll(4)' },
  ],
  links: [['n1', 'n2'], ['s1', 's2']],
});
roads.push({
  area: 'steel', id: 'radS', name: 'The south border road',
  why: 'From the Yard seam out along the border to the mid ring: the ground between the two regions beyond the starts.',
  nodes: [{ id: 'a', at: lerp(seamS, mS0, 1 / 3) }, { id: 'b', at: lerp(seamS, mS0, 2 / 3) }, { id: 'm', at: mS0 }],
  links: [['a', 'b'], ['b', 'm']],
});
roads.push({
  area: 'bows', id: 'spN', name: 'The north spoke, outer',
  why: 'The north spoke from the cross-road junction out to the mid ring and on toward the rim.',
  nodes: [{ id: 'a', at: lerp(xN, mN1, 1 / 3) }, { id: 'b', at: lerp(xN, mN1, 2 / 3) }, { id: 'm', at: mN1 }, { id: 'c', at: lerp(mN1, rN1, 0.5) }],
  links: [['a', 'b'], ['b', 'm'], ['m', 'c']],
});
roads.push({
  area: 'steel', id: 'spS', name: 'The south spoke, outer',
  why: 'The south spoke from the cross-road junction out to the mid ring and on toward the rim.',
  nodes: [{ id: 'a', at: lerp(xS, mS1, 1 / 3) }, { id: 'b', at: lerp(xS, mS1, 2 / 3) }, { id: 'm', at: mS1 }, { id: 'c', at: lerp(mS1, rS1, 0.5) }],
  links: [['a', 'b'], ['b', 'm'], ['m', 'c']],
});
roads.push({
  area: 'bows', id: 'ring', name: 'The mid ring, north', why: "The mid ring's stretch between the Knife's border road and the north spoke.",
  nodes: [{ id: 'a', at: lerp(K(2900, -30), mN1, 0.5) }], links: [],
});
roads.push({
  area: 'flight', id: 'ring', name: 'The mid ring, centre',
  why: "The mid ring's stretch across the axis between the two spokes.",
  nodes: [{ id: 'a', at: lerp(mN1, mS1, 0.25) }, { id: 'b', at: lerp(mN1, mS1, 0.5) }, { id: 'c', at: lerp(mN1, mS1, 0.75) }],
  links: [['a', 'b'], ['b', 'c']],
});
roads.push({
  area: 'steel', id: 'ring', name: 'The mid ring, south', why: "The mid ring's stretch between the south spoke and the south border road.",
  nodes: [{ id: 'a', at: lerp(mS1, mS0, 0.5) }], links: [],
});
{
  // The rim ring from the Knife's at the north border (knife.rim.ring.s0) to the south border.
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
  roads.push({ area: 'rim', id: 'ring', name: 'The rim ring', why: "The rim ring across the Bow, from the Knife's border to the Yard's.", nodes: rim, links });
}

const links: [string, string, string][] = [
  ['start.strider', 'bow.home.sig.a', 'Point one, the north side.'],
  ['start.strider', 'bow.home.sig.b', 'Point one, the south side.'],
  ['bow.home.sig.a', 'bow.home.hubs.n', 'Point two: the north hub.'],
  ['bow.home.sig.b', 'bow.home.hubs.s', 'Point two: the south hub.'],
  ['bow.home.sig.a', 'bow.home.pathN.a', "Point two: the north path toward the Knife's seam."],
  ['bow.home.sig.b', 'bow.home.pathS.a', 'Point two: the south path toward the Yard seam.'],
  ['bow.home.hubs.n', 'bow.home.cross.n1', "The north hub in toward Hawk's Eye."],
  ['bow.home.hubs.n', 'bow.home.spN.a', 'The north hub out along the spoke.'],
  ['bow.home.hubs.s', 'bow.home.cross.s1', "The south hub in toward Hawk's Eye."],
  ['bow.home.hubs.s', 'bow.home.spS.a', 'The south hub out along the spoke.'],
  ['bow.home.cross.n2', 'bow.home.hawk.n', 'To the home notable.'],
  ['bow.home.cross.s2', 'bow.home.hawk.n', 'To the home notable.'],
  ['bow.home.seams.s', 'centre.ring.road.i2', 'Along the border into the centre.'],
  ['bow.home.seams.s', 'bow.steel.radS.a', 'Along the border out to the mid ring.'],
  ['bow.home.spN.x', 'bow.bows.spN.a', 'The north spoke goes on.'],
  ['bow.home.spS.x', 'bow.steel.spS.a', 'The south spoke goes on.'],
  ['bow.bows.spN.c', 'bow.rim.ring.n1', 'The north spoke reaches the rim ring.'],
  ['bow.steel.spS.c', 'bow.rim.ring.s1', 'The south spoke reaches the rim ring.'],
  ['bow.bows.ring.a', 'knife.snares.radS.m', "The mid ring meets the Knife's border road."],
  ['bow.bows.ring.a', 'bow.bows.spN.m', 'The mid ring meets the north spoke.'],
  ['bow.bows.spN.m', 'bow.flight.ring.a', 'The mid ring on toward the axis.'],
  ['bow.flight.ring.c', 'bow.steel.spS.m', 'The mid ring meets the south spoke.'],
  ['bow.steel.spS.m', 'bow.steel.ring.a', 'The mid ring on toward the south border.'],
  ['bow.steel.ring.a', 'bow.steel.radS.m', 'The mid ring meets the south border road.'],
  ['bow.rim.ring.q1', 'knife.rim.ring.s0', "The rim ring meets the Knife's."],
  ['bow.quiver.wheel.e', 'bow.quiver.wheel.a1', "The wheel's other side (the old file joined it from outside)."],
];

export const tables = { K, roads, links };

// ---- Clusters, notables and links: filled in the structure and notables passes.
const moves: Move[] = [
  // The Gate (home, steps 5 to 7): a damage and a defence home on each half.
  { from: 'home.crit', area: 'home', at: K(1890, -21.5), entry: [['a', 'bow.home.pathN.b']], why: 'Crit, a side room off the north path, outward: the north half’s damage near home (step 5).' },
  { from: 'home.clearHead', area: 'home', at: K(1710, -24), ats: { a: K(1735, -21.5), n: K(1680, -26.5), b: K(0, 0) }, entry: [['a', 'bow.home.pathN.b'], ['n', 'knife.home.seams.s']], why: "Mana and reservation, run through on the north path to the Knife's seam (the centre pass: every start about six steps from its seams)." },
  { from: 'home.life', area: 'home', at: K(2240, -19.5), entry: [['a', 'bow.home.spN.x']], why: 'Life and regeneration, off the north spoke junction: the north half’s defence.' },
  { from: 'steel.wayfarer', area: 'home', at: K(1890, 21.5), entry: [['a', 'bow.home.pathS.b']], why: 'Evasion and resistances, a side room off the south path, outward: the south half’s defence.' },
  { from: 'quiver.quickSip', area: 'home', at: K(1710, 24), ats: { b: K(1735, 21.5), n: K(1680, 26.5), a: K(0, 0) }, entry: [['b', 'bow.home.pathS.b'], ['n', 'bow.home.seams.s']], why: 'The flask layer near home, run through on the south path to the Yard seam (the centre pass: every start about six steps from its seams).' },
  { from: 'string.speed', area: 'home', id: 'speed', at: K(2240, 19.5), ats: { a: K(2140, 15.5), qh: K(2230, 18.5), m: K(2320, 21.5), ff: K(0, 0), b: K(0, 0), f1: K(0, 0), f2: K(0, 0) }, entry: [['a', 'bow.home.spS.x']], why: 'Attack speed, off the south spoke junction: the south half’s damage.' },
  { from: 'string.hardTarget', area: 'home', at: K(2320, 0), entry: [['a', 'bow.home.hawk.n']], why: "Evasion, life and stun, a side room on out from Hawk's Eye along the axis." },
  // The Hedgerows (north spoke): bows, cold arrows, the Knife seam's trap home.
  { from: 'bows.tripwire', area: 'bows', at: K(2480, -26), entry: [['a', 'knife.snares.radS.b']], why: "Traps that chill, for the kiting bow user, off the Knife's border road beside the Knife's traps." },
  { from: 'bows.wheel', area: 'bows', id: 'longbow', at: K(3200, -22.5), entry: [['e', 'bow.bows.ring.a']], why: 'The first bows, out from the mid ring between the Knife border and the north spoke (step 10).' },
  { from: 'bows.steadyDraw', area: 'bows', at: K(3050, -15.5), entry: [['a', 'bow.bows.spN.m']], why: 'Keystone, a spur out from where the north spoke meets the mid ring (step 10; it was 7).' },
  { from: 'flight.ricochet', area: 'bows', at: K(3600, -19.5), entry: [['a', 'bow.bows.spN.c']], why: 'Chain, off the north spoke past the mid ring.' },
  { from: 'bows.elements', area: 'bows', at: K(3600, -7), entry: [['a', 'bow.bows.spN.c']], why: 'Elemental attacks in general, off the north spoke past the mid ring toward the axis.' },
  // The Far Pasture (north toward the rim).
  { from: 'rim.killShot', area: 'rim', at: K(4560, -13.5), entry: [['c', 'bow.rim.ring.n1']], why: 'Bow crit, out from the rim ring at the north spoke.' },
  { from: 'rim.haresPace', area: 'rim', at: K(3960, -23), entry: [['e', 'bow.rim.ring.q1']], why: 'Evasion and attack speed, in from the rim ring.' },
  // The High Moor and the Thicket (the axis at the mid ring), the Meadow (the axis).
  { from: 'flight.wheel', area: 'flight', at: K(3170, -8.5), entry: [['e', 'bow.flight.ring.a']], why: 'Projectiles or bleeding arrows, the two sides of one wheel, out from the mid ring.' },
  { from: 'flight.closeQuarters', area: 'flight', at: K(3220, -1), entry: [['a', 'bow.flight.ring.b']], why: 'The close-range keystone, a spur out from the mid ring at the axis, far from the long shot.' },
  { from: 'quiver.wheel', area: 'quiver', at: K(3150, 9.5), ats: { e: K(2990, 7.5), c1: K(3080, 9.8), c2: K(3170, 11.8), n2: K(3260, 13), a1: K(3080, 5.2), a2: K(3170, 4.2), n1: K(3260, 3.8) }, entry: [['e', 'bow.flight.ring.c']], why: 'More projectiles or deeper bleeding, out from the mid ring east of the axis.' },
  { from: 'quiver.rapid', area: 'string', at: K(2620, 0), entry: [['a', 'bow.flight.ring.b']], why: 'Bow speed, in from the mid ring at the axis.' },
  { from: 'string.arrowWeave', area: 'string', at: K(3950, -2.6), entry: [['a', 'bow.rim.ring.q4']], why: 'The evasion keystone, a spur in from the rim ring at the axis.' },
  { from: 'rim.tallGrass', area: 'string', at: K(3960, -8), entry: [['e1', 'bow.rim.ring.q3']], why: 'Evasion and regeneration, in from the rim ring.' },
  { from: 'rim.hotPursuit', area: 'quiver', at: K(3960, 3), entry: [['a2', 'bow.rim.ring.q5']], why: 'Fervour on kill, in from the rim ring, beside the Knife’s fervour.' },
  { from: 'rim.tellingShot', area: 'quiver', at: K(4560, -2.6), entry: [['s2', 'bow.rim.ring.q4']], why: 'Bows with double damage, out from the rim ring at the axis.' },
  // The Ford (south spoke): close and physical, the Yard seam.
  { from: 'flight.wanderer', area: 'steel', at: K(1380, 27), entry: [['a', 'bow.home.seams.s']], why: 'Attributes and life on the seam with the Yard, a side room toward the centre.' },
  { from: 'steel.thirstyQuiver', area: 'steel', at: K(2080, 24.5), entry: [['a', 'bow.steel.radS.a']], why: 'Leech, the attacker’s sustain, off the south border road.' },
  { from: 'flight.lightHand', area: 'steel', at: K(2480, 25.5), entry: [['b', 'bow.steel.radS.b']], why: 'One-handed weapons, the Yard seam’s theme, off the south border road.' },
  { from: 'flight.roundShield', area: 'steel', at: K(3100, 27.5), entry: [['a', 'bow.steel.radS.m']], why: 'Shield attacks, shared with the Yard, out from where the border road meets the mid ring.' },
  { from: 'rim.hardyStock', area: 'steel', at: K(2640, 27.5), entry: [['a', 'bow.steel.ring.a']], why: 'Life and resistances, in from the mid ring’s south stretch.' },
  { from: 'steel.wheel', area: 'steel', id: 'deepPull', at: K(2720, 18), ats: { e: K(2690, 15.2), c1: K(2770, 17.2), c2: K(2760, 20.3), n2: K(2680, 21.2) }, entry: [['e', 'bow.steel.spS.b']], why: 'Physical attacks, off the south spoke.' },
  { from: 'steel.platedHide', area: 'steel', at: K(3050, 15.5), entry: [['a', 'bow.steel.spS.m']], why: 'Keystone, a spur out from where the south spoke meets the mid ring.' },
  { from: 'steel.pitch', area: 'steel', at: K(3220, 22), entry: [['a', 'bow.steel.ring.a']], why: "Fire attacks' first home, out from the mid ring's south stretch." },
  // The Water Meadows (south toward the rim).
  { from: 'quiver.brightShafts', area: 'south', at: K(3600, 19.5), entry: [['a', 'bow.steel.spS.c']], why: 'Elemental arrows, off the south spoke past the mid ring.' },
  { from: 'south.fieldKit', area: 'south', at: K(4560, 13.5), entry: [['a', 'bow.rim.ring.s1']], why: 'Evasion and flasks, out from the rim ring at the south spoke.' },
  { from: 'south.liveWire', area: 'south', at: K(3960, 19), entry: [['s1', 'bow.rim.ring.q7']], why: 'Lightning attacks, beside the Yard’s, in from the rim ring.' },
  { from: 'south.fouledTips', area: 'south', at: K(4560, 25), entry: [['p', 'bow.rim.ring.q8']], why: 'Poisoned bows, out from the rim ring.' },
  { from: 'south.killingEye', area: 'south', at: K(4000, 27.5), entry: [['a', 'bow.rim.ring.s0']], why: 'Crit and executing, in from the rim ring at the border.' },
];
const over: Over = {
  // The Gate.
  'bow.home.crit.n': { lines: "critChance(20), critMulti(20), recoverOn('crit', 'life', 1)", why: 'Crits close wounds: the attrition voice in the archer’s terms.' },
  'bow.home.life.n': { lines: "life(10), lifeRegen(0.6), recoverOn('kill', 'life', 2)", why: 'Life that comes back with each kill (Old Scars folded in).' },
  'bow.home.wayfarer.n': { lines: 'evasion(20), evasionWhileMoving(30)', why: 'Evasion that pays the kiter: more of it while moving.' },
  'bow.home.quickSip.n': { lines: 'flaskCharges(24), flaskRecovery(10)', why: 'The flask layer near home, the Bow\u2019s way: flasks refill faster (the Yard\u2019s Field Dressing by the same seam sells recovery and duration).' },
  'bow.home.speed.qh': { lines: 'attackSpeed(12), accuracy(25)', why: 'Speed and the accuracy to land it.' },
  // The Hedgerows and the Far Pasture.
  'bow.bows.tripwire.n': { lines: 'trapGainCold(12), chillEffect(15), freezeChance(8)', why: 'Traps that chill and freeze, for the kiting bow user (the Knife\u2019s Venom Snare on the same road sells trap damage and poison).' },
  'bow.rim.killShot.n': { lines: "weaponCrit('bow', 30), weaponCritMulti('bow', 20), elusiveOn('crit', 15)", why: 'A bow crit makes the archer Elusive: the shot and the slip away.' },
  // The axis.
  'bow.string.rapid.n': { lines: 'bowDamage(20), bowSpeed(12)', why: 'Bow speed (its movement line went).' },
  'bow.quiver.tellingShot.n': { lines: 'bowDamage(16), doubleDamage(6), damageStationary(20)', why: 'The archer who stands and shoots, against Wayfarer’s kiter.' },
  // The Ford and the Water Meadows.
  'bow.steel.hardyStock.n': { lines: 'life(8), physReduction(3)', why: 'Life and a little physical reduction for an evasion build at the Yard seam.' },
  'bow.steel.roundShield.n': { lines: 'shieldAttack(20), shieldBlock(4)', why: 'Shield attacks, shared with the Yard.' },
  'bow.steel.wanderer.n': { lines: 'moveSpeed(8), life(8), str(10)', why: 'The wanderer on the Yard\u2019s seam: movement, life and the strength the Yard\u2019s gear asks (the centre\u2019s Well Rounded sells all attributes).' },
  'bow.steel.lightHand.n': { lines: 'oneHandMelee(24), attackSpeed(8)', why: 'One-handed weapons, the Yard seam’s theme.' },
  'bow.steel.pitch.n': { lines: "eleAttackOne('fire', 24), areaDamage(20)", why: 'Fire arrows that burst: fire attacks’ first home.' },
  'bow.string.tallGrass.n': { lines: "evasion(20), recoverOn('evade', 'life', 2)", why: 'Evasion’s rule: each attack evaded closes a wound.' },
  'bow.quiver.hotPursuit.n': { lines: 'fervourOnKill(25), attackSpeedPerFervour(3)', why: 'Fervour from kills, and speed for every charge held.' },
  'bow.home.clearHead.n': { lines: 'mana(16), reducedReservation(6)', why: 'The one mana notable near home: a pool and room for an aura.' },
  'bow.south.fieldKit.n': { lines: 'evasion(20), flaskRecovery(20)', why: 'Evasion with the flask layer.' },
};
const trim: Record<string, string[]> = {
  'bow.home.quickSip': ['a'],
  'bow.home.clearHead': ['b'],
  'bow.home.crit': ['c', 'd'],
  'bow.home.wayfarer': ['c', 'd'],
  'bow.home.speed': ['ff', 'b', 'f1', 'f2'],
  'bow.bows.longbow': ['n2', 'c2', 'c1'],
  'bow.rim.killShot': ['k2', 'k3'],
  'bow.string.tallGrass': ['r1', 'r2'],
  'bow.steel.hardyStock': ['c', 'e'],
  'bow.quiver.hotPursuit': ['a1'],
  'bow.quiver.tellingShot': ['s1'],
  'bow.south.fieldKit': ['f1', 'f2'],
  'bow.south.liveWire': ['s3'],
  'bow.south.fouledTips': ['q2'],
};
const newc: NewCluster[] = [
  { area: 'bows', id: 'frost', name: 'Frost Fletching', lines: "eleAttackOne('cold', 24), chillEffect(20)", smalls: ["eleAttackOne('cold', 10)", "eleAttackOne('cold', 10)"], entry: 'bow.bows.spN.b', toward: K(2700, -19), why: "Cold arrows' first rung, off the north spoke: chilled enemies close in slower." },
  { area: 'string', id: 'aim', name: 'Sure Aim', lines: "attackDamagePerAccuracy(3, 10), accuracy(25)", smalls: ['accuracy(10)', 'accuracy(10)'], entry: 'bow.bows.spN.b', toward: K(2620, -7), why: 'Accuracy as a theme, on the axis.' },
  { area: 'string', id: 'crystal', name: 'Wind Rider', lines: 'attackSpeedWhileMoving(16), evasion(15)', smalls: ['attackSpeed(4)', 'attackSpeed(4)'], entry: 'bow.bows.ring.a', toward: K(2700, -27), why: 'The kiter shoots faster on the move: against Steadfast Aim’s archer who stands.' },
  { area: 'string', id: 'rush', name: "Hunter's Rush", lines: "quickenedOn('kill', 40), attackSpeed(8)", smalls: ['attackSpeed(4)', 'attackSpeed(4)'], entry: 'bow.steel.spS.a', toward: K(2400, 6), why: 'A speed buff from killing, off the south spoke toward the axis.' },
  { area: 'rim', id: 'winter', name: 'Rime Shafts', lines: "eleAttackOne('cold', 16), attackPhysToCold(25), chillEffect(15)", smalls: ["eleAttackOne('cold', 10)", "eleAttackOne('cold', 10)"], entry: 'bow.rim.ring.q2', toward: K(4560, -19), why: "Cold arrows' payoff, out from the rim ring." },
  { area: 'rim', id: 'longShot', name: 'Far Reach', lines: "farShot(30), projectileDamage(10)", smalls: ['projectileDamage(10)', 'projectileDamage(10)'], entry: 'bow.rim.ring.q1', toward: K(4560, -25), why: 'Projectiles hit harder the farther they fly: the counterpart of Close Quarters, out from the rim ring.' },
  { area: 'string', id: 'elusive', name: 'Steadfast Aim', lines: 'critWhileStationary(40), accuracy(20)', smalls: ['accuracy(10)', 'accuracy(10)'], entry: 'bow.rim.ring.q6', toward: K(3960, 8.5), why: 'The archer who holds ground crits more: against Wind Rider’s kiter.' },
  { area: 'quiver', id: 'forces', name: 'Storm-Feathered', lines: "eleAttack(16), elePenetration(4)", smalls: ['eleAttack(10)', 'eleAttack(10)'], entry: 'bow.rim.ring.q5', toward: K(4560, 2.6), why: 'Elemental attacks’ payoff, out from the rim ring at the axis.' },
  { area: 'steel', id: 'fleet', name: 'Fleet Blade', lines: "swordDamage(20), weaponSpeed('sword', 5), evasion(10)", smalls: ['swordDamage(10)', 'swordDamage(10)'], entry: 'bow.steel.radS.m', toward: K(3150, 23), why: 'Swords beside the Yard’s, out from where the south border road meets the mid ring.' },
  { area: 'south', id: 'sap', name: 'Spare Stock', lines: 'flaskCharges(20), flaskChargesUsed(8)', smalls: ['flaskCharges(10)', 'flaskCharges(10)'], entry: 'bow.steel.spS.c', toward: K(3600, 7), why: 'More drinks: kills refill the flasks a little, and each drink costs less (attrition’s lever).' },
  { area: 'south', id: 'kindling', name: 'Pitch and Flame', lines: "eleAttackOne('fire', 16), igniteChance(15), damageVsIgnited(15)", smalls: ["eleAttackOne('fire', 10)", "eleAttackOne('fire', 10)"], entry: 'bow.rim.ring.q7', toward: K(4560, 19), why: "Fire attacks' second home, out from the rim ring." },
  { area: 'south', id: 'charges', name: "Hunter's Satchel", lines: 'flaskCharges(25), flaskEffect(10)', smalls: ['flaskCharges(10)', 'flaskCharges(10)'], entry: 'bow.flight.ring.c', toward: K(2680, 6), why: 'Flask charges from kills in the middle ground (steps 9 to 11): the hunter who drinks often.' },
  { area: 'south', id: 'herbs', name: 'Field Poultice', lines: 'life(10), flaskChargesUsed(12)', smalls: ['flaskRecovery(8)', 'flaskRecovery(8)'], entry: 'bow.rim.ring.s0', toward: K(4560, 29), why: 'Life flasks, out from the rim ring at the border.' },
  { area: 'string', id: 'leap', name: "Skirmisher's Leap", lines: "quickenedOn('blink', 50), cooldownRecovery(10)", smalls: ['cooldownRecovery(5)', 'cooldownRecovery(5)'], entry: 'bow.bows.spN.m', toward: K(3300, -11), why: 'For a build with a blink skill: each blink, the kiting one included, may start a burst of speed.' },
  { area: 'south', id: 'breath', name: "Archer's Breath", lines: "recoverOn('crit', 'mana', 2), costReduction(8)", smalls: ['costReduction(3)', 'costReduction(3)'], entry: 'bow.steel.spS.m', toward: K(3300, 11), why: 'Mana for attackers from crits, unlike the Yard’s mana on hit with leech.' },
  { area: 'quiver', id: 'pursuit', name: "Pursuit's End", lines: 'damageWhileQuickened(25), critMultiWhileElusive(30)', smalls: ['allDamage(8)', 'allDamage(8)'], entry: 'bow.flight.ring.b', toward: K(3500, 4), why: 'The payoff of the two buffs the region hands out: Quickened (kills, blinks) and Elusive (bow crits).' },
  { area: 'steel', id: 'momentum', name: 'Lingering Momentum', lines: 'buffDuration(25), cooldownRecovery(10)', smalls: ['buffDuration(10)', 'buffDuration(10)'], entry: 'bow.steel.ring.a', toward: K(3350, 26), why: 'Quickened and Elusive last longer, and blinks come back sooner.' },
  { area: 'home', id: 'hawk', name: "Hawk's Eye", lines: "attackDamage(14), accuracy(15), life(5), dex(15)", smalls: [], ats: [K(2050, 0)], why: 'The home generalist, passed through between the two hubs (step 5).' },
];
const second: Second[] = [
  { cluster: 'bow.quiver.hotPursuit', attach: 'n', id: 'n2', name: "Hunter's Fervour", lines: "fervourOnCrit(20), critMulti(15)", why: 'Fervour from crits as well as kills, so a crit build feeds Hot Pursuit’s speed.' },
  { cluster: 'bow.bows.tripwire', attach: 'n', id: 'n2', name: 'Kiting Snares', lines: 'trapSpeed(12), evasionWhileMoving(20)', why: 'Traps laid on the run: the trapper who kites.' },
  { cluster: 'bow.south.fieldKit', attach: 'n', id: 'n2', name: 'Supply Line', lines: "flaskEffect(12), recoverOn('kill', 'life', 2)", why: 'The field kit restocks between fights: a kill closes a wound.' },
  { cluster: 'bow.steel.roundShield', attach: 'n', id: 'n2', name: 'Braced Guard', lines: 'shieldBlock(6), lifeOnBlock(20)', why: 'A block that heals.' },
  { cluster: 'bow.south.killingEye', attach: 'n', id: 'n2', name: 'Grim Tally', lines: "recoverOn('kill', 'mana', 3), costReduction(8)", why: 'Kills pay for the next shot.' },
  { cluster: 'bow.steel.hardyStock', attach: 'n', id: 'n2', name: 'Second Wind', lines: 'lifeRegenWhenHit(1.5), stunAvoid(30)', why: 'Hits taken are answered with regeneration (it was a separate home near the start, repeating Hard Target and Long Breath).' },
];
const pairs: [string, string][] = [
  ['bow.bows.tripwire', 'bow.bows.frost'],
  ['bow.bows.longbow', 'bow.bows.ricochet'],
  ['bow.string.rapid', 'bow.string.rush'],
  ['bow.steel.lightHand', 'bow.steel.deepPull'],
  ['bow.steel.pitch', 'bow.south.brightShafts'],
  ['bow.quiver.hotPursuit', 'bow.string.elusive'],
];

if (process.argv[1]?.endsWith('bow-gen.ts'))
  generate({
    region: 'bow', regionId: 'strider', classId: 'strider', th: 30, start: S0,
    roadLines: 'dex(7)', hubLines: 'dex(20)',
    roads, moves, links, over, trim, newc, second, pairs,
    external: {
      'knife.snares.radS.a': lerp(K(1600, -30), K(2900, -30), 1 / 3),
      'knife.snares.radS.b': lerp(K(1600, -30), K(2900, -30), 2 / 3),
      'knife.snares.radS.m': K(2900, -30),
      'knife.home.seams.s': K(1600, -30),
      'knife.rim.ring.s0': K(4300, -30),
    },
    areas: {
      home: { name: 'The Bow Gate', at: K(1900, 5), why: "The Strider's first points (R-bow.md)." },
      bows: { name: 'The Hedgerows', at: K(2700, -22), why: 'The north spoke: bows, accuracy, elemental attacks, the Knife seam.' },
      steel: { name: 'The Ford', at: K(2700, 22), why: 'The south spoke: close and physical, the Yard seam.' },
      flight: { name: 'The High Moor', at: K(3000, -4), why: 'The axis at the mid ring: projectiles and bleeding arrows.' },
      quiver: { name: 'The Thicket', at: K(3200, 5), why: 'The axis at and beyond the mid ring: more projectiles, fervour.' },
      string: { name: 'The Meadow', at: K(2500, 0), why: 'The axis: evasion and speed.' },
      rim: { name: 'The Far Pasture', at: K(4000, -20), why: 'North toward the rim: bow crit, traps, the long shot.' },
      south: { name: 'The Water Meadows', at: K(4000, 20), why: 'South toward the rim: fire and lightning arrows, poisoned bows, flasks.' },
    },
    doc: 'R-bow.md',
    dryRun: process.argv.includes('--dry'),
  });
