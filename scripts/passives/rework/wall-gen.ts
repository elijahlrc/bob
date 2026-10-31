// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// The Wall's table (docs/tree/design/R-wall.md), written into src/data/passives/wall/ by region-gen-lib.ts from the region
// as it was (before/wall.json). Offsets in degrees from the Wall's angle (150): negative is the Yard's side
// (south-east), positive the Cathedral's (north). Run: npx tsx scripts/passives/rework/wall-gen.ts [--dry]
import { generate, polar, lerp, type Road, type Move, type NewCluster, type Second, type Over } from './region-gen-lib.ts';

const K = polar(150);
const S0 = K(1450, 0);
const hubN = K(1690, -5), hubS = K(1690, 5);
const xN = K(2050, -11.7), xS = K(2050, 11.7);
const mN1 = K(2900, -13), mS1 = K(2900, 13), mS0 = K(2900, 30);
const rN1 = K(4300, -13), rS1 = K(4300, 13), rS0 = K(4300, 30);
const seamS = K(1600, 30);

const roads: Road[] = [];
roads.push({
  area: 'home', id: 'sig', name: 'The two sides',
  why: "The start's two exits, each a strong small every Vanguard takes, as the reference's str start opens: melee physical damage with life toward the Yard, armour with life toward the Cathedral. Each opens three ways at the next step.",
  nodes: [
    { id: 'a', at: K(1530, -6), kind: 'small', lines: 'meleePhys(12), life(5)', why: 'The south side: melee physical damage and life.' },
    { id: 'b', at: K(1530, 6), kind: 'small', lines: 'armour(15), life(5)', why: 'The north side: armour and life, the strength class\u2019s defence.' },
  ],
  links: [],
});
roads.push({
  area: 'home', id: 'hubs', name: 'The hubs',
  why: "Strength a step past each side: each forks into the spoke out into the region and the road in to Oathbound.",
  nodes: [{ id: 'n', at: hubN, hub: true }, { id: 's', at: hubS, hub: true }],
  links: [],
});
roads.push({
  area: 'home', id: 'pathN', name: 'The north path',
  why: "The third way out of the south side: two melee damage nodes along the bow toward the Yard's seam.",
  nodes: [
    { id: 'a', at: K(1590, -13), kind: 'small', lines: 'meleePhys(8)' },
    { id: 'b', at: K(1690, -17), kind: 'small', lines: 'meleePhys(8)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home', id: 'pathS', name: 'The south path',
  why: 'The third way out of the west side: life and physical attack damage along the bow toward the Cathedral seam.',
  nodes: [
    { id: 'a', at: K(1590, 13), kind: 'small', lines: 'life(4)' },
    { id: 'b', at: K(1690, 17), kind: 'small', lines: 'armour(10)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home', id: 'seams', name: 'The south seam',
  why: "Where the Wall's roads meet the Cathedral's on the north border; it runs on along the border into the centre and out to the mid ring. (The south-east seam is the Yard's.)",
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
  area: 'home', id: 'cross', name: "The roads to Oathbound",
  why: "From each hub two stat nodes in to Oathbound on the axis (step 5): life on the south road, resistances on the north, defences every Vanguard takes.",
  nodes: [
    { id: 'n1', at: K(1800, -3.4), kind: 'small', lines: 'life(5)' },
    { id: 'n2', at: K(1925, -1.7), kind: 'small', lines: 'life(5)' },
    { id: 's1', at: K(1800, 3.4), kind: 'small', lines: 'resAll(4)' },
    { id: 's2', at: K(1925, 1.7), kind: 'small', lines: 'resAll(4)' },
  ],
  links: [['n1', 'n2'], ['s1', 's2']],
});
roads.push({
  area: 'resists', id: 'radW', name: 'The south border road',
  why: 'From the Cathedral seam out along the border to the mid ring: the ground between the two regions beyond the starts.',
  nodes: [{ id: 'a', at: lerp(seamS, mS0, 1 / 3) }, { id: 'b', at: lerp(seamS, mS0, 2 / 3) }, { id: 'm', at: mS0 }],
  links: [['a', 'b'], ['b', 'm']],
});
roads.push({
  area: 'slams', id: 'spN', name: 'The north spoke, outer',
  why: 'The north spoke from the cross-road junction out to the mid ring and on toward the rim.',
  nodes: [{ id: 'a', at: lerp(xN, mN1, 1 / 3) }, { id: 'b', at: lerp(xN, mN1, 2 / 3) }, { id: 'm', at: mN1 }, { id: 'c', at: lerp(mN1, rN1, 0.5) }],
  links: [['a', 'b'], ['b', 'm'], ['m', 'c']],
});
roads.push({
  area: 'rampart', id: 'spS', name: 'The south spoke, outer',
  why: 'The south spoke from the cross-road junction out to the mid ring and on toward the rim.',
  nodes: [{ id: 'a', at: lerp(xS, mS1, 1 / 3) }, { id: 'b', at: lerp(xS, mS1, 2 / 3) }, { id: 'm', at: mS1 }, { id: 'c', at: lerp(mS1, rS1, 0.5) }],
  links: [['a', 'b'], ['b', 'm'], ['m', 'c']],
});
roads.push({
  area: 'slams', id: 'ring', name: 'The mid ring, north', why: "The mid ring's stretch between the Yard's border road and the south spoke.",
  nodes: [{ id: 'a', at: lerp(K(2900, -30), mN1, 0.5) }], links: [],
});
roads.push({
  area: 'maces', id: 'ring', name: 'The mid ring, centre',
  why: "The mid ring's stretch across the axis between the two spokes.",
  nodes: [{ id: 'a', at: lerp(mN1, mS1, 0.25) }, { id: 'b', at: lerp(mN1, mS1, 0.5) }, { id: 'c', at: lerp(mN1, mS1, 0.75) }],
  links: [['a', 'b'], ['b', 'c']],
});
roads.push({
  area: 'rampart', id: 'ring', name: 'The mid ring, south', why: "The mid ring's stretch between the north spoke and the north border road.",
  nodes: [{ id: 'a', at: lerp(mS1, mS0, 0.5) }], links: [],
});
{
  // The rim ring from the Yard's at the south-east border (yard.fosse.ring.s0) to the north border.
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
  roads.push({ area: 'grit', id: 'ring', name: 'The rim ring', why: "The rim ring across the Wall, from the Yard's border to the Cathedral's.", nodes: rim, links });
}

const links: [string, string, string][] = [
  ['start.vanguard', 'wall.home.sig.a', 'Point one, the north side.'],
  ['start.vanguard', 'wall.home.sig.b', 'Point one, the south side.'],
  ['wall.home.sig.a', 'wall.home.hubs.n', 'Point two: the north hub.'],
  ['wall.home.sig.b', 'wall.home.hubs.s', 'Point two: the south hub.'],
  ['wall.home.sig.a', 'wall.home.pathN.a', "Point two: the north path toward the Yard's seam."],
  ['wall.home.sig.b', 'wall.home.pathS.a', 'Point two: the south path toward the Cathedral seam.'],
  ['wall.home.pathS.b', 'wall.home.seams.s', 'The north path reaches the Cathedral seam.'],
  ['wall.home.hubs.n', 'wall.home.cross.n1', "The north hub in toward Oathbound."],
  ['wall.home.hubs.n', 'wall.home.spN.a', 'The north hub out along the spoke.'],
  ['wall.home.hubs.s', 'wall.home.cross.s1', "The south hub in toward Oathbound."],
  ['wall.home.hubs.s', 'wall.home.spS.a', 'The south hub out along the spoke.'],
  ['wall.home.cross.n2', 'wall.home.oath.n', 'To the home notable.'],
  ['wall.home.cross.s2', 'wall.home.oath.n', 'To the home notable.'],
  ['wall.home.seams.s', 'centre.ring.road.r17', 'Along the border into the centre.'],
  ['wall.home.seams.s', 'wall.resists.radW.a', 'Along the border out to the mid ring.'],
  ['wall.home.spN.x', 'wall.slams.spN.a', 'The north spoke goes on.'],
  ['wall.home.spS.x', 'wall.rampart.spS.a', 'The south spoke goes on.'],
  ['wall.slams.spN.c', 'wall.grit.ring.n1', 'The north spoke reaches the rim ring.'],
  ['wall.rampart.spS.c', 'wall.grit.ring.s1', 'The south spoke reaches the rim ring.'],
  ['wall.slams.ring.a', 'yard.shield.radW.m', "The mid ring meets the Yard's border road."],
  ['wall.slams.ring.a', 'wall.slams.spN.m', 'The mid ring meets the north spoke.'],
  ['wall.slams.spN.m', 'wall.maces.ring.a', 'The mid ring on toward the axis.'],
  ['wall.maces.ring.c', 'wall.rampart.spS.m', 'The mid ring meets the south spoke.'],
  ['wall.rampart.spS.m', 'wall.rampart.ring.a', 'The mid ring on toward the south border.'],
  ['wall.rampart.ring.a', 'wall.resists.radW.m', 'The mid ring meets the south border road.'],
  ['wall.grit.ring.q1', 'yard.fosse.ring.s0', "The rim ring meets the Yard's."],
];

export const tables = { K, roads, links };

// ---- Clusters, notables and links.
// Here 'pathN', 'spN' and the 'n' ids are the Yard's side (south-east), 'pathS', 'spS' and 's' the Cathedral's (north).
const moves: Move[] = [
  // The Gate (home, steps 5 to 8).
  { from: 'home.ringing', area: 'home', at: K(1760, -24), ats: { a: K(1790, -20.5), b: K(1770, -24), n: K(1735, -27) }, entry: [['a', 'wall.home.pathN.b'], ['n', 'yard.home.seams.s']], why: "Melee damage and stun, on the south path to the Yard's seam (step 5): the path runs through it." },
  { from: 'slams.secondWind', area: 'home', at: K(1450, -21), entry: [['a', 'wall.home.pathN.b']], why: 'Life and regeneration, a side room off the south path toward the centre.' },
  { from: 'maces.thickSkin', area: 'home', at: K(2260, -16), entry: [['a', 'wall.home.spN.x']], why: 'Armour and stun threshold, off the south spoke junction: the south half’s defence.' },
  { from: 'resists.star', area: 'home', at: K(1890, 21.5), entry: [['f', 'wall.home.pathS.b']], why: 'Resistances and life, a side room off the north path, outward: the north half’s second defence.' },
  { from: 'home.quartermaster', area: 'home', at: K(1450, 21), entry: [['a', 'wall.home.pathS.b']], why: 'The flask layer near home, a side room off the north path toward the centre.' },
  { from: 'rampart.stoneHeart', area: 'home', at: K(2240, 19.5), entry: [['a', 'wall.home.spS.x']], why: 'Melee crit, off the north spoke junction: offence on the north exit too.' },
  { from: 'rampart.steadyHands', area: 'rampart', at: K(2400, 6), entry: [['a', 'wall.rampart.spS.a']], why: 'Accuracy and speed, off the north spoke toward the axis.' },
  { from: 'grit.barrowWard', area: 'slams', at: K(2370, -9), entry: [['a', 'wall.slams.spN.a']], why: 'Regeneration and reduction, off the south spoke toward the axis.' },
  // The Battlements (the north border).
  { from: 'rampart.ironLungs', area: 'resists', at: K(2080, 24.5), entry: [['a', 'wall.resists.radW.a']], why: 'Mana from melee, off the north border road.' },
  { from: 'resists.banner', area: 'resists', at: K(2490, 24), entry: [['a', 'wall.resists.radW.b']], why: 'Auras, shared with the Cathedral, off the north border road (step 9).' },
  { from: 'grit.unbroken', area: 'resists', at: K(3110, 27.5), entry: [['a', 'wall.resists.radW.m']], why: 'Resistances or one more grit charge, the two sides of one wheel, where the north border road meets the mid ring.' },
  { from: 'resists.posts', area: 'resists', at: K(3200, 22.5), entry: [['a', 'wall.rampart.ring.a']], why: 'Totems with resistances, out from the mid ring’s north stretch, toward the Cathedral’s totems.' },
  { from: 'resists.hammer', area: 'resists', at: K(2700, 25.5), entry: [['a', 'wall.rampart.ring.a']], why: 'Elemental maces, the Cathedral seam’s theme, in from the mid ring’s north stretch.' },
  // The Rampart (the north spoke).
  { from: 'rampart.bulwark', area: 'rampart', at: K(2650, 7), entry: [['a', 'wall.rampart.spS.b']], why: 'Armour, off the north spoke toward the axis.' },
  { from: 'rampart.stagger', area: 'slams', at: K(2420, -19), entry: [['a', 'wall.slams.spN.a']], why: "Stun, off the south spoke (the near ground evened out between the exits)." },
  { from: 'rampart.unerring', area: 'rampart', at: K(3050, 15.5), entry: [['a', 'wall.rampart.spS.m']], why: 'The accuracy keystone, a spur where the north spoke meets the mid ring.' },
  // The Barbican (north toward the rim): two-handed, maces, the grit walk.
  { from: 'maces.greatweight', area: 'maces', at: K(3600, 19.5), entry: [['a', 'wall.rampart.spS.c']], why: 'Two-handed or life, the two sides of one wheel, off the north spoke past the mid ring.' },
  { from: 'maces.weight', area: 'slams', at: K(3600, -7), entry: [['a', 'wall.slams.spN.c']], why: 'Maces with stun, off the south spoke past the mid ring toward the axis (the maces split north and south).' },
  { from: 'maces.crushing', area: 'grit', at: K(4560, -13.5), entry: [['a', 'wall.grit.ring.n1']], why: 'Mace crit, out from the rim ring at the south spoke.' },
  { from: 'grit.headsman', area: 'maces', at: K(4560, 19), entry: [['a', 'wall.grit.ring.q7']], why: 'Two-handed with stun that builds grit, out from the rim ring.' },
  { from: 'resists.scarTissue', area: 'maces', at: K(3960, 24.5), entry: [['a', 'wall.grit.ring.q8']], why: 'Grit when hit, in from the rim ring: the grit walk’s far end.' },
  { from: 'maces.rooted', area: 'maces', at: K(4660, 24), entry: [['a', 'wall.grit.ring.q8']], why: 'The standing keystone, a tip past the rim ring.' },
  { from: 'maces.hotIron', area: 'grit', at: K(4560, -19), entry: [['a', 'wall.grit.ring.q2']], why: 'Fire attacks, out from the rim ring south, beside Bellows.' },
  { from: 'grit.host', area: 'maces', at: K(4560, 28.5), entry: [['a', 'wall.grit.ring.s0']], why: 'Minion life and armour: every summoner’s farthest minion notable (the owner’s ruling), at the Cathedral border.' },
  // The Bulwark (the axis): the Wall's shields.
  { from: 'maces.locked', area: 'maces', at: K(2610, 0), entry: [['a', 'wall.maces.ring.b']], why: 'Shields with armour and grit on block, in from the mid ring at the axis.' },
  { from: 'home.ram', area: 'maces', at: K(3170, 0), entry: [['a', 'wall.maces.ring.b']], why: 'Shield attacks that knock back, out from the mid ring at the axis.' },
  // The axis toward the rim: the Barrows' centre.
  { from: 'grit.ironVoice', area: 'grit', at: K(3960, 2.6), entry: [['a', 'wall.grit.ring.q5']], why: 'Warcries with armour, in from the rim ring at the axis.' },
  { from: 'grit.heavyHands', area: 'grit', at: K(3960, -8), entry: [['a', 'wall.grit.ring.q3']], why: 'Two-handed speed, in from the rim ring.' },
  { from: 'grit.rhythm', area: 'grit', at: K(3960, 8), entry: [['a', 'wall.grit.ring.q6']], why: 'Mace speed, in from the rim ring.' },
  { from: 'grit.greatblade', area: 'grit', at: K(4560, -2.6), entry: [['a', 'wall.grit.ring.q4']], why: 'Two-handed swords, out from the rim ring at the axis.' },
  { from: 'grit.reach', area: 'grit', at: K(4560, 2.6), entry: [['a', 'wall.grit.ring.q5']], why: 'Reach and area, out from the rim ring.' },
  { from: 'grit.bellows', area: 'grit', at: K(4560, -8), entry: [['a', 'wall.grit.ring.q3']], why: 'Fire with area, out from the rim ring.' },
  // The Quarry (the south spoke and the Yard border).
  { from: 'slams.thunderstep', area: 'slams', at: K(2720, -19), entry: [['a', 'wall.slams.spN.b']], why: 'Two-handed slams, off the south spoke.' },
  { from: 'slams.vampiric', area: 'slams', at: K(2060, -27.5), entry: [['a', 'yard.shield.radW.a']], why: "Leech, off the Yard's border road." },
  { from: 'slams.cairns', area: 'slams', at: K(2490, -24), entry: [['a', 'yard.shield.radW.b']], why: "Totems with area, off the Yard's border road." },
  { from: 'slams.strongarm', area: 'slams', at: K(3050, -15.5), entry: [['a', 'wall.slams.spN.m']], why: 'The strength keystone, a spur where the south spoke meets the mid ring.' },
  { from: 'slams.sledge', area: 'slams', at: K(3200, -22.5), entry: [['a', 'wall.slams.ring.a']], why: 'Maces with life, out from the mid ring’s south stretch.' },
  { from: 'slams.groundShaker', area: 'grit', at: K(3960, -15), entry: [['a', 'wall.grit.ring.q2']], why: 'Area and knockback, the slams’ area home, in from the rim ring.' },
  { from: 'grit.watch', area: 'grit', at: K(3960, -24), entry: [['a', 'wall.grit.ring.q1']], why: 'Totem speed and duration, in from the rim ring.' },
  { from: 'grit.bloodrite', area: 'grit', at: K(4650, -25), entry: [['a', 'wall.grit.ring.q1']], why: 'The farthest keystone, a tip past the rim ring.' },
];
const over: Over = {
  'wall.slams.thunderstep.n': { lines: "twoHandDamage(26), meleeArea(18)", why: 'Two-handed slams.' },
  'wall.grit.ironVoice.n': { lines: "armour(16), warcryEffect(15), gritOnWarcry(25)", why: "The warcry hook: a shout gives grit." },
  'wall.grit.greatblade.n': { lines: "swordDamage(18), twoHandDamage(18), critMulti(16)", why: "Two-handed swords." },
  'wall.grit.heavyHands.n': { lines: "attackSpeed(12, ['twoHand', 'melee']), twoHandSpeedPerGrit(3)", why: 'Grit spent as momentum: the two-hander swings faster for every charge held.' },
  'wall.resists.unbroken.n1': { lines: "maxGrit(1), gritDuration(25)", why: 'One more grit charge, and the charges last longer.' },
  'wall.maces.host.n': { lines: "minionLife(27), armour(23)" },
  'wall.grit.reach.n': { lines: "meleeRange(1), aoe(18, ['melee'])", why: "Reach and a wider swing." },
  'wall.maces.scarTissue.n': { lines: "gritOnHitTaken(24), lifeRegenPerGrit(0.4)", why: "Grit when hit, and the grit heals: the walk’s far end." },
  'wall.grit.watch.n': { lines: "totemSpeed(9), totemDuration(23)" },
  'wall.grit.rhythm.n': { lines: "weaponDamage('mace', 20), gritOnMaceHit(5)", why: "The mace rule: hammer blows build grit." },
  'wall.grit.crushing.n': { lines: "weaponCrit('mace', 17), weaponCritMulti('mace', 23), doubleDamage(6)" },
  'wall.resists.posts.n': { lines: "totemDamage(29), resAll(7)" },
  'wall.slams.sledge.n': { lines: "weaponDamage('mace', 22), lifeOnHit(8, ['melee'])", why: "Maces that heal on the hit." },
  'wall.resists.hammer.n': { lines: "maceDamage(24), eleAttack(24)" },
  'wall.slams.cairns.n': { lines: "totemDamage(34), areaDamage(14)" },
  'wall.maces.greatweight.n2': { lines: "life(15), stunRecovery(19)" },
  'wall.home.stoneHeart.n': { lines: "meleePhys(24), critChance(27, ['melee'])" },
  'wall.home.thickSkin.n': { lines: "armour(23), stunThreshold(18)" },
  'wall.rampart.steadyHands.n': { lines: "accuracy(23), attackSpeed(9)" },
  'wall.home.ringing.n': { lines: "meleeDamage(19), enemyStunThreshold(14)" },
  'wall.home.star.n': { lines: "resAll(12), life(6)" },
  'wall.home.quartermaster.n': { name: 'Camp Stores', lines: "flaskRecovery(20), flaskEffect(12)", why: "The flask layer near home (renamed: Quartermaster is a stop)." },
  'wall.home.secondWind.n': { name: 'Old Wounds', why: 'Life and regeneration near home (renamed: the Bow has a Second Wind).', lines: 'lifeRegen(1), life(8)' },
  'wall.resists.ironLungs.n': { lines: 'manaOnHit(8), costReduction(8)', why: 'Mana from melee and cheaper blows (unlike the Yard\u2019s mana on hit with leech).' },
  'wall.maces.locked.n': { lines: "armour(16), gritOnBlock(15), lifeOnBlock(20)", why: "The Wall’s shield: a block builds grit and closes a wound." },
  'wall.maces.ram.n': { lines: "shieldAttack(24), blockPerGrit(1)", why: "The shield grows with the grit: block for every charge held." },
  'wall.maces.greatweight.n1': { lines: "twoHandDamage(34), stunDuration(20)", why: "The two-handed blow that holds the enemy down (one side of the swing-or-life choice)." },
  'wall.maces.headsman.n': { lines: 'twoHandDamage(20), gritOnStun(30)', why: 'The two-hander\u2019s grit: each stun builds it (its lines copied the Yard\u2019s Momentum Swing).' },
  'wall.grit.hotIron.n': { lines: "eleAttackOne('fire', 29), igniteChance(18)", why: 'Fire attacks that ignite (its stun line went).' },
  'wall.slams.strongarm.k': { name: 'Unbowed Arm', lines: '', why: 'The strength keystone (renamed: its old name was a reference keystone\u2019s).' },
};
const trim: Record<string, string[]> = {};
const newc: NewCluster[] = [
  { area: 'rampart', id: 'stand', name: 'Standing Iron', lines: "armourWhileStationary(45), stunAvoidStationary(35)", smalls: ['armour(10)', 'armour(10)'], entry: 'wall.rampart.spS.c', toward: K(3600, 7), why: 'The armour rule: armour that grows while the Vanguard holds still.' },
  { area: 'maces', id: 'stunGrit', name: 'Broken Guard', lines: "gritOnStun(30), enemyStunThreshold(10)", smalls: ['stunDuration(8)', 'stunDuration(8)'], entry: 'wall.maces.ring.c', toward: K(2700, 9), why: 'Stunning an enemy gives grit, by the shields on the axis: the grit walk runs from here north.' },
  { area: 'maces', id: 'gritPay', name: 'Grit and Gravel', lines: "damagePerGrit(4), meleePhys(10)", smalls: ['meleePhys(8)', 'meleePhys(8)'], entry: 'wall.maces.scarTissue.n', toward: K(3800, 27), why: 'Grit’s second payoff, offensive: damage for every charge held.' },
  { area: 'slams', id: 'totems', name: 'Twin Cairns', lines: "totemLimit(1), totemDamage(10)", smalls: ['totemDamage(8)', 'totemDamage(8)'], entry: 'yard.fosse.ring.s0', toward: K(3900, -27.5), why: 'One more totem (the deploy count totems already use), in from the rim by Long Watch: a totem build walks from its damage notables to its rule.' },
  { area: 'slams', id: 'strike', name: 'Sweeping Blow', lines: "strikeTargets(1), meleePhys(10)", smalls: ['meleePhys(8)', 'meleePhys(8)'], entry: 'wall.slams.spN.b', toward: K(2650, -8), why: 'The strike rule: strikes hit one more nearby enemy, off the south spoke toward the axis.' },
  { area: 'slams', id: 'brute', name: 'Brute Force', lines: 'meleePerStr(2, 15), meleePhys(10)', smalls: ['str(10)', 'str(10)'], entry: 'wall.slams.spN.c', toward: K(3700, -24), why: 'The strength rule: melee physical damage for every 10 strength.' },
  { area: 'grit', id: 'plunder', name: 'Plunder of Iron', lines: 'gritOnKill(25), meleePhys(15)', smalls: ['armour(8)', 'armour(8)'], entry: 'wall.grit.ring.n1', toward: K(3960, -12), why: 'Kills build grit: the south\u2019s way into the grit loop.' },
  { area: 'maces', id: 'skull', name: 'Skull Crack', lines: "weaponDamage('mace', 16), damageVsStunned(25)", smalls: ["weaponDamage('mace', 8)", "weaponDamage('mace', 8)"], entry: 'wall.grit.ring.s1', toward: K(3960, 14), why: 'A second mace rule: the stunned enemy\u2019s skull cracks.' },
  { area: 'resists', id: 'spirit', name: 'Bulwark Spirit', lines: 'lifeRegenPerGrit(0.4), stunAvoid(30)', smalls: ['stunAvoid(10)', 'stunAvoid(10)'], entry: 'wall.resists.radW.m', toward: K(3150, 23), why: 'Grit-shaped sustain at the Cathedral border: every charge mends.' },
  { area: 'home', id: 'oath', name: 'Oathbound', lines: 'life(8), meleePhys(14), str(15)', smalls: [], ats: [K(2050, 0)], why: 'The home generalist, passed through between the two hubs (step 5): life and steel every Vanguard uses.' },
];
const second: Second[] = [
  { cluster: 'wall.slams.thunderstep', attach: 'n', id: 'n2', name: 'Aftershock', lines: 'meleeArea(19), enemyStunThreshold(15)', why: 'Slams that shake the enemy loose: wider, and stuns land easier (feeding grit on stun).' },
];
const pairs: [string, string][] = [
  ['wall.slams.strike', 'wall.slams.barrowWard'],
  ['wall.maces.locked', 'wall.rampart.bulwark'],
];

if (process.argv[1]?.endsWith('wall-gen.ts'))
  generate({
    region: 'wall', regionId: 'vanguard', classId: 'vanguard', th: 150, start: S0,
    roadLines: 'str(7)', hubLines: 'str(20)',
    roads, moves, links, over, trim, newc, second, pairs,
    external: {
      'yard.shield.radW.a': lerp(K(1600, -30), K(2900, -30), 1 / 3),
      'yard.shield.radW.b': lerp(K(1600, -30), K(2900, -30), 2 / 3),
      'yard.shield.radW.m': K(2900, -30),
      'yard.home.seams.s': K(1600, -30),
      'yard.fosse.ring.s0': K(4300, -30),
    },
    areas: {
      home: { name: 'The Wall Gate', at: K(1900, 5), why: "The Vanguard's first points (R-wall.md)." },
      slams: { name: 'The Quarry', at: K(2700, -22), why: 'The south spoke: slams, two-handed weapons, totems with area, the Yard seam.' },
      rampart: { name: 'The Rampart', at: K(2700, 22), why: 'The north spoke: armour, accuracy, stun.' },
      resists: { name: 'The Battlements', at: K(2500, 27), why: 'The north border: totems, resistances, auras, elemental maces, the Cathedral seam.' },
      maces: { name: 'The Bulwark', at: K(3100, 0), why: 'The axis at the mid ring and the north toward the rim: shields, maces, the two-handed choice.' },
      grit: { name: 'The Barrows', at: K(4100, 0), why: 'Toward the rim: grit, warcries, two-handed weapons, the keystones.' },
    },
    doc: 'R-wall.md',
    dryRun: process.argv.includes('--dry'),
  });
