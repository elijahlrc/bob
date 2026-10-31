// @ts-nocheck -- a one-off tool of the attrition rework (docs/tree/design/R-state.md), run with npx tsx; absolute paths.
// The Spire's table (docs/tree/design/R-spire.md), written into src/data/passives/spire/ by region-gen-lib.ts from the
// region as it was (before/spire.json). Offsets in degrees from the Spire's angle (-90): negative is the Cathedral's side
// (west), positive the Knife's (east). Run: npx tsx scripts/passives/rework/spire-gen.ts [--dry]
import { generate, polar, lerp, type Road, type Move, type NewCluster, type Second, type Over } from './region-gen-lib.ts';

const K = polar(-90);
const S0 = K(1450, 0);
const hubW = K(1690, -5), hubE = K(1690, 5);
const xW = K(2050, -11.7), xE = K(2050, 11.7);
const mW1 = K(2900, -13), mE1 = K(2900, 13), mW0 = K(2900, -30);
const rW1 = K(4300, -13), rE1 = K(4300, 13), rW0 = K(4300, -30);
const seamW = K(1600, -30);

const roads: Road[] = [];
roads.push({
  area: 'home', id: 'sig', name: 'The two sides',
  why: "The start's two exits, each a strong small every Mystic takes: energy shield with life toward the Cathedral (both defences, so a life caster takes it too), damage with life toward the Knife. Each opens three ways at the next step.",
  nodes: [
    { id: 'a', at: K(1530, -6), kind: 'small', lines: 'esFlat(8), life(5)', why: 'The west side: energy shield and life, both defences.' },
    { id: 'b', at: K(1530, 6), kind: 'small', lines: 'allDamage(12), life(5)', why: 'The east side: damage of every kind, and life: the caster and the wand attacker both use it.' },
  ],
  links: [],
});
roads.push({
  area: 'home', id: 'hubs', name: 'The hubs',
  why: 'Intelligence a step past each side: each forks into the spoke out into the region and the road in to First Light.',
  nodes: [{ id: 'w', at: hubW, hub: true }, { id: 'e', at: hubE, hub: true }],
  links: [],
});
roads.push({
  area: 'home', id: 'pathW', name: 'The west path',
  why: 'The third way out of the west side: two defence nodes along the bow toward the Cathedral seam.',
  nodes: [
    { id: 'a', at: K(1590, -13), kind: 'small', lines: 'esFlat(6), life(3)' },
    { id: 'b', at: K(1690, -17), kind: 'small', lines: 'esFlat(6), life(3)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home', id: 'pathE', name: 'The east path',
  why: 'The third way out of the east side: two damage nodes along the bow toward the Knife seam.',
  nodes: [
    { id: 'a', at: K(1590, 13), kind: 'small', lines: 'allDamage(10)' },
    { id: 'b', at: K(1690, 17), kind: 'small', lines: 'allDamage(10)' },
  ],
  links: [['a', 'b']],
});
roads.push({
  area: 'home', id: 'seams', name: 'The west seam',
  why: "Where the Spire's roads meet the Cathedral's on the west border; it runs on along the border into the centre and out to the mid ring. (The east seam is the Knife's.)",
  nodes: [{ id: 'w', at: seamW }],
  links: [],
});
roads.push({
  area: 'home', id: 'spW', name: 'The west spoke', why: 'The west spoke from its hub to the junction with the cross roads.',
  nodes: [{ id: 'a', at: lerp(hubW, xW, 0.5) }, { id: 'x', at: xW }], links: [['a', 'x']],
});
roads.push({
  area: 'home', id: 'spE', name: 'The east spoke', why: 'The east spoke from its hub to the junction with the cross roads.',
  nodes: [{ id: 'a', at: lerp(hubE, xE, 0.5) }, { id: 'x', at: xE }], links: [['a', 'x']],
});
roads.push({
  area: 'home', id: 'cross', name: 'The roads to First Light',
  why: 'From each hub two stat nodes in to First Light on the axis (step 5): resistances on the west road, life on the east, defences every Mystic takes.',
  nodes: [
    { id: 'w1', at: K(1800, -3.4), kind: 'small', lines: 'resAll(4)' },
    { id: 'w2', at: K(1925, -1.7), kind: 'small', lines: 'resAll(4)' },
    { id: 'e1', at: K(1800, 3.4), kind: 'small', lines: 'life(5)' },
    { id: 'e2', at: K(1925, 1.7), kind: 'small', lines: 'life(5)' },
  ],
  links: [['w1', 'w2'], ['e1', 'e2']],
});
roads.push({
  area: 'well', id: 'radW', name: 'The west border road',
  why: 'From the Cathedral seam out along the border to the mid ring: the ground between the two regions beyond the starts.',
  nodes: [{ id: 'a', at: lerp(seamW, mW0, 1 / 3) }, { id: 'b', at: lerp(seamW, mW0, 2 / 3) }, { id: 'm', at: mW0 }],
  links: [['a', 'b'], ['b', 'm']],
});
roads.push({
  area: 'well', id: 'spW', name: 'The west spoke, outer',
  why: 'The west spoke from the cross-road junction out to the mid ring and on toward the rim.',
  nodes: [{ id: 'a', at: lerp(xW, mW1, 1 / 3) }, { id: 'b', at: lerp(xW, mW1, 2 / 3) }, { id: 'm', at: mW1 }, { id: 'c', at: lerp(mW1, rW1, 0.5) }],
  links: [['a', 'b'], ['b', 'm'], ['m', 'c']],
});
roads.push({
  area: 'craft', id: 'spE', name: 'The east spoke, outer',
  why: 'The east spoke from the cross-road junction out to the mid ring and on toward the rim.',
  nodes: [{ id: 'a', at: lerp(xE, mE1, 1 / 3) }, { id: 'b', at: lerp(xE, mE1, 2 / 3) }, { id: 'm', at: mE1 }, { id: 'c', at: lerp(mE1, rE1, 0.5) }],
  links: [['a', 'b'], ['b', 'm'], ['m', 'c']],
});
roads.push({
  area: 'well', id: 'ring', name: 'The mid ring, west', why: "The mid ring's stretch between the west border and the west spoke.",
  nodes: [{ id: 'a', at: lerp(mW0, mW1, 0.5) }], links: [],
});
roads.push({
  area: 'column', id: 'ring', name: 'The mid ring, centre',
  why: "The mid ring's stretch across the axis between the two spokes.",
  nodes: [{ id: 'a', at: lerp(mW1, mE1, 0.25) }, { id: 'b', at: lerp(mW1, mE1, 0.5) }, { id: 'c', at: lerp(mW1, mE1, 0.75) }],
  links: [['a', 'b'], ['b', 'c']],
});
roads.push({
  area: 'craft', id: 'ring', name: 'The mid ring, east', why: "The mid ring's stretch between the east spoke and the Knife's border road.",
  nodes: [{ id: 'a', at: lerp(mE1, K(2900, 30), 0.5) }], links: [],
});
{
  // The rim ring from the west border to the Knife's rim ring at the east border (knife.rim.ring.n0).
  const rim = [{ id: 'w0', at: rW0 }];
  let q = 0;
  for (const t of [1 / 3, 2 / 3]) rim.push({ id: `q${++q}`, at: lerp(rW0, rW1, t) });
  rim.push({ id: 'w1', at: rW1 });
  for (const t of [0.2, 0.4, 0.6, 0.8]) rim.push({ id: `q${++q}`, at: lerp(rW1, rE1, t) });
  rim.push({ id: 'e1', at: rE1 });
  for (const t of [1 / 3, 2 / 3]) rim.push({ id: `q${++q}`, at: lerp(rE1, K(4300, 30), t) });
  const links: [string, string][] = [];
  for (let i = 1; i < rim.length; i++) links.push([rim[i - 1].id, rim[i].id]);
  roads.push({ area: 'rim', id: 'ring', name: 'The rim ring', why: "The rim ring across the Spire, from the Cathedral border to the Knife's.", nodes: rim, links });
}

const links: [string, string, string][] = [
  ['start.mystic', 'spire.home.sig.a', 'Point one, the west side.'],
  ['start.mystic', 'spire.home.sig.b', 'Point one, the east side.'],
  ['spire.home.sig.a', 'spire.home.hubs.w', 'Point two: the west hub.'],
  ['spire.home.sig.b', 'spire.home.hubs.e', 'Point two: the east hub.'],
  ['spire.home.sig.a', 'spire.home.pathW.a', 'Point two: the west path toward the Cathedral seam.'],
  ['spire.home.sig.b', 'spire.home.pathE.a', 'Point two: the east path toward the Knife seam.'],
  ['spire.home.hubs.w', 'spire.home.cross.w1', 'The west hub in toward First Light.'],
  ['spire.home.hubs.w', 'spire.home.spW.a', 'The west hub out along the spoke.'],
  ['spire.home.hubs.e', 'spire.home.cross.e1', 'The east hub in toward First Light.'],
  ['spire.home.hubs.e', 'spire.home.spE.a', 'The east hub out along the spoke.'],
  ['spire.home.seams.w', 'centre.ring.road.r23', 'Along the border into the centre.'],
  ['spire.home.seams.w', 'spire.well.radW.a', 'Along the border out to the mid ring.'],
  ['spire.home.spW.x', 'spire.well.spW.a', 'The west spoke goes on.'],
  ['spire.home.spE.x', 'spire.craft.spE.a', 'The east spoke goes on.'],
  ['spire.well.spW.c', 'spire.rim.ring.w1', 'The west spoke reaches the rim ring.'],
  ['spire.craft.spE.c', 'spire.rim.ring.e1', 'The east spoke reaches the rim ring.'],
  ['spire.well.radW.m', 'spire.well.ring.a', 'The mid ring from the west border.'],
  ['spire.well.ring.a', 'spire.well.spW.m', 'The mid ring meets the west spoke.'],
  ['spire.well.spW.m', 'spire.column.ring.a', 'The mid ring on toward the axis.'],
  ['spire.column.ring.c', 'spire.craft.spE.m', 'The mid ring meets the east spoke.'],
  ['spire.craft.spE.m', 'spire.craft.ring.a', 'The mid ring on toward the Knife border.'],
  ['spire.craft.ring.a', 'knife.hex.radN.m', "The mid ring meets the Knife's border road."],
  ['spire.rim.ring.q8', 'knife.rim.ring.n0', "The rim ring meets the Knife's."],
  ['spire.home.cross.w2', 'spire.home.first.n', 'To the home notable.'],
  ['spire.home.pathW.b', 'spire.home.seams.w', 'The west path reaches the Cathedral seam.'],
  ['spire.home.pathE.b', 'knife.home.seams.n', "The east path reaches the Knife's seam."],
  ['spire.home.cross.e2', 'spire.home.first.n', 'To the home notable.'],
];

export const tables = { K, S0, roads, links, seamW, hubW, hubE, xW, xE, mW0, mW1, mE1, rW0, rW1, rE1 };

// ---- Clusters, notables and links: filled in the structure and notables passes.
const kW = K(1600, 30); // the Knife's seam (knife.home.seams.n), the east path's end
const moves: Move[] = [
  // The Gate (home, steps 5 to 8): a damage and a defence home on each half.
  { from: 'craft.focus', area: 'home', at: K(1890, -21.5), entry: [['a', 'spire.home.pathW.b']], why: 'Spell damage or chaos resistance, the two sides of one wheel: a side room off the west path, outward (step 5).' },
  { from: 'home.warmBlood', area: 'home', at: K(1870, 21.5), entry: [['a', 'spire.home.pathE.b']], why: "Life and energy shield, a side room off the east path, outward (step 5): the life caster's first notable." },
  { from: 'home.stillMind', area: 'home', at: K(2200, -17), entry: [['a', 'spire.home.spW.x']], why: 'The one mana notable near home, off the west spoke junction (step 6).' },
  { from: 'home.sharpMind', area: 'home', at: K(2200, 16.5), entry: [['a', 'spire.home.spE.x']], why: 'Spell crit, off the east spoke junction (step 6).' },
  { from: 'well.draught', area: 'home', at: K(1450, -21), entry: [['a', 'spire.home.pathW.b']], why: 'The flask layer near home, a side room off the west path toward the centre.' },
  { from: 'craft.haleScribe', area: 'home', at: K(1430, 16), entry: [['a', 'spire.home.pathE.a']], why: 'Life near home, a side room off the east path toward the centre.' },
  // The Cloister (west): defence and mana, the Cathedral seam, fire's first rungs.
  { from: 'craft.devotion', area: 'well', at: K(1380, -27), entry: [['a', 'spire.home.seams.w']], why: 'Reservation and energy shield on the seam with the Cathedral, a side room toward the centre.' },
  { from: 'frost.quickening', area: 'well', at: K(2060, -26.5), entry: [['a', 'spire.well.radW.a']], why: 'Energy shield recharge, the seam theme, off the west border road.' },
  { from: 'storm.painConduit', area: 'well', at: K(2420, -27.5), entry: [['a', 'spire.well.radW.b']], why: 'Keystone, a spur off the west border road beside reservation and recharge (step 10).' },
  { from: 'fire.familiars', area: 'well', at: K(3100, -27.5), entry: [['a', 'spire.well.radW.m']], why: "Spell minions, out from where the border road meets the mid ring: the Cathedral's minions' near end." },
  { from: 'well.deepWell', area: 'well', at: K(2690, -21), entry: [['a', 'spire.well.ring.a']], why: 'Mana or energy shield, the two sides of one wheel, in from the mid ring between the border and the spoke (step 9 or later).' },
  { from: 'well.wandwork', area: 'well', at: K(2620, -8.5), entry: [['a', 'spire.well.spW.b']], why: 'Wand spells, off the west spoke toward the axis.' },
  { from: 'well.mindBulwark', area: 'well', at: K(3050, -15.5), entry: [['a', 'spire.well.spW.m']], why: 'Keystone, a spur out from where the west spoke meets the mid ring.' },
  { from: 'well.quietPulse', area: 'well', at: K(2440, -20), entry: [['a', 'spire.well.spW.a']], why: 'Life and regeneration, off the west spoke: the second notable of a life caster.' },
  { from: 'storm.flashpoint', area: 'well', at: K(3260, -23), entry: [['b', 'spire.well.ring.a']], why: "Fire's second rung, with spell crit: out from the mid ring's west stretch." },
  { from: 'well.composure', area: 'well', at: K(3600, -7), entry: [['a', 'spire.well.spW.c']], why: 'Energy shield and casting through stuns, off the west spoke past the mid ring.' },
  { from: 'well.livingVerse', area: 'well', at: K(3620, -19.5), entry: [['a', 'spire.well.spW.c']], why: 'Spells with life, off the west spoke past the mid ring.' },
  // The Lantern (west toward the rim): fire's payoffs, wands' west home, minions with curses.
  { from: 'frost.highVeil', area: 'fire', at: K(4000, -27), entry: [['a', 'spire.rim.ring.w0']], why: 'Energy shield and resistances, in from the rim ring at the border.' },
  { from: 'well.manaTap', area: 'fire', at: K(3960, -22), entry: [['a', 'spire.rim.ring.q1']], why: 'Mana leech, in from the rim ring.' },
  { from: 'fire.brightWand', area: 'fire', at: K(4000, -16.5), entry: [['a', 'spire.rim.ring.q2']], why: 'Elemental wand attacks and wand spells, beside fire, in from the rim ring.' },
  { from: 'fire.cinder', area: 'fire', at: K(4560, -13.5), entry: [['a', 'spire.rim.ring.w1']], why: "Fire's ignite payoff, out from the rim ring where the west spoke meets it." },
  { from: 'rim.badCompany', area: 'fire', at: K(4560, -28), entry: [['a', 'spire.rim.ring.w0']], why: 'Minions with curses, out from the rim ring at the border.' },
  { from: 'well.spiritWard', area: 'fire', at: K(4560, -23.5), entry: [['a', 'spire.rim.ring.q1']], why: 'Spell block with a shield, out from the rim ring.' },
  // The Scriptorium (east): spell offence, the Knife seam's curses and chaos, lightning's first rungs.
  // Flashes of Insight is cut: insight is the Knife's (Cold Read, Glint), and a narrow pick near the start (the reviewer).
  // { from: 'craft.insight', area: 'craft', at: K(2470, 26), entry: [['a', 'knife.hex.radN.b']], why: "Insight, off the Knife's border road beside the Knife's insight across it (step 9)." },
  { from: 'craft.hexwright', area: 'craft', at: K(2470, 26), entry: [['a', 'knife.hex.radN.b']], why: "Curses, off the Knife's border road beside the Knife's." },
  { from: 'column.withering', area: 'craft', at: K(2760, 27), entry: [['a', 'knife.hex.radN.m']], why: "Chaos over time, in from where the Knife's border road meets the mid ring; a dearer link across to Hexwright." },
  { from: 'craft.sharpTongue', area: 'craft', at: K(3120, 27), entry: [['a', 'knife.hex.radN.m']], why: "Dagger spells, out from where the Knife's border road meets the mid ring, beside the Knife's." },
  { from: 'frost.siphon', area: 'craft', at: K(2560, 20), entry: [['a', 'spire.craft.spE.b']], why: 'Energy shield leech and on hit, the sustain of the offence side, off the east spoke.' },
  { from: 'home.deftWand', area: 'craft', at: K(2620, 8.5), entry: [['a', 'spire.craft.spE.b']], why: 'The first wand attacks, off the east spoke toward the axis.' },
  { from: 'frost.thunderhead', area: 'craft', at: K(2780, 18), entry: [['a', 'spire.craft.spE.b']], why: "Lightning's first rung, off the east spoke." },
  // Frugal (mana cost) is cut: it copied the Knife's Deep Reserves across the seam and piled mana near home (the reviewer).
  // { from: 'craft.frugal', area: 'craft', at: K(2400, 6), entry: [['a', 'spire.craft.spE.a']], why: 'Mana cost, off the east spoke toward the axis.' },
  { from: 'craft.manaBastion', area: 'craft', at: K(3080, 16.5), entry: [['a', 'spire.craft.spE.m']], why: 'Keystone, a spur out from where the east spoke meets the mid ring, opposite Mind Bulwark.' },
  { from: 'craft.keenVerse', area: 'craft', at: K(3230, 22), entry: [['a', 'spire.craft.ring.a']], why: 'Spell crit multiplier, out from the mid ring\'s east stretch.' },
  // The Gallery (east toward the rim): wand attacks, lightning's payoff.
  { from: 'storm.overcharge', area: 'storm', at: K(3650, 19), entry: [['a', 'spire.craft.spE.c']], why: "Lightning's second rung (shock), off the east spoke past the mid ring." },
  { from: 'craft.wandVolley', area: 'storm', at: K(3600, 7), entry: [['a', 'spire.craft.spE.c']], why: 'Wand attack speed, off the east spoke past the mid ring toward the axis.' },
  { from: 'craft.mistWalk', area: 'storm', at: K(3960, 24), entry: [['a', 'spire.rim.ring.q8']], why: "Dodge, in from the rim ring beside the Knife's." },
  { from: 'rim.needlework', area: 'storm', at: K(3960, 20.5), entry: [['a', 'spire.rim.ring.q7']], why: 'Crit with attacks, in from the rim ring.' },
  { from: 'rim.longChant', area: 'storm', at: K(3990, 15.8), entry: [['a', 'spire.rim.ring.e1']], why: 'Spells with mana regeneration, in from the rim ring at the east spoke.' },
  { from: 'rim.pinpoint', area: 'storm', at: K(4560, 14), entry: [['a', 'spire.rim.ring.e1']], why: 'Wand crit, out from the rim ring at the east spoke.' },
  // The Column (the axis at the mid ring).
  { from: 'column.star', area: 'column', at: K(2610, 0), entry: [['s', 'spire.column.ring.b']], why: 'Resistances, in from the mid ring at the axis.' },
  { from: 'fire.hoarfrost', area: 'column', at: K(3150, -1.5), entry: [['a', 'spire.column.ring.b']], why: "Cold's first rung, out from the mid ring at the axis." },
  { from: 'column.broadWeave', area: 'column', at: K(3170, -9), entry: [['a', 'spire.column.ring.a']], why: 'Spell area, out from the mid ring west of the axis.' },
  { from: 'column.dartingBolts', area: 'column', at: K(3150, 9.5), entry: [['a', 'spire.column.ring.c']], why: 'Spell projectiles, out from the mid ring east of the axis.' },
  { from: 'column.lingering', area: 'column', at: K(3430, 2.5), entry: [['a', 'spire.column.ring.c']], why: 'Elemental damage over time, out from the mid ring along the axis; a dearer link across to Hoarfrost.' },
  // The Belfry (the axis toward the rim): cold's payoffs, any element, the element keystones.
  { from: 'frost.stream', area: 'frost', at: K(3960, -8.5), entry: [['a', 'spire.rim.ring.q3']], why: 'Channelling, in from the rim ring.' },
  { from: 'frost.shatter', area: 'frost', at: K(3980, -2.8), entry: [['a', 'spire.rim.ring.q4']], why: "Cold's second rung (freeze), in from the rim ring at the axis." },
  { from: 'frost.piercing', area: 'frost', at: K(3980, 2.8), entry: [['a', 'spire.rim.ring.q5']], why: 'Penetration for any element, in from the rim ring at the axis.' },
  { from: 'frost.harshWeather', area: 'frost', at: K(3960, 8.5), entry: [['a', 'spire.rim.ring.q6']], why: 'Ailments for any element, in from the rim ring.' },
  { from: 'fire.coldLight', area: 'frost', at: K(4560, -2.8), entry: [['a', 'spire.rim.ring.q4']], why: "Cold's payoff with spell crit, out from the rim ring." },
  { from: 'frost.prismatic', area: 'frost', at: K(4660, -8.5), entry: [['a', 'spire.rim.ring.q3']], why: 'Keystone, a tip past the rim ring.' },
  { from: 'frost.feverPitch', area: 'frost', at: K(4660, 8.5), entry: [['a', 'spire.rim.ring.q6']], why: 'Keystone, a tip past the rim ring.' },
];
const over: Over = {
  // The Gate.
  'spire.home.focus.n2': { lines: "resOne('chaos', 20), recoverOn('hitTaken', 'es', 1), es(5)" },
  'spire.home.stillMind.n': { lines: "manaRegen(20), manaFlat(30), arcaneTideOn('kill', 10)" },
  'spire.home.draught.n': { lines: "flaskEffect(12), flaskRecovery(12), recoverOn('kill', 'mana', 2)" },
  'spire.home.haleScribe.n': { lines: "life(10), lifeOnHit(4, ['spell'])" },
  // The Cloister.
  'spire.well.devotion.n': { lines: 'auraReserveLife(), auraEffect(8), reducedReservation(5)' },
  'spire.well.familiars.n': { lines: 'minionDamage(20), minionLife(15), spellDamage(10)' },
  'spire.well.deepWell.n1': { lines: 'mana(16), spellDamagePerMana(2, 20)' },
  'spire.well.deepWell.n2': { lines: 'es(14), damageWhileEsFull(20)' },
  'spire.well.flashpoint.n': { lines: "eleDamage('fire', 16), spellCrit(25), igniteChance(10)" },
  // The Lantern.
  'spire.fire.brightWand.n': { lines: 'wandAttack(18), wandSpellDamage(18), eleDamageAll(10)' },
  'spire.fire.cinder.n': { lines: 'igniteChance(15), burnDamage(25), damageVsIgnited(20)' },
  'spire.fire.spiritWard.n': { name: 'Overflow', lines: 'manaRegen(20), manaAsEs(6)' },
  'spire.fire.spiritWard.a': { lines: 'manaRegen(10)' },
  'spire.fire.spiritWard.b': { lines: 'manaRegen(10)' },
  // The Scriptorium.
  'spire.craft.keenVerse.n': { lines: 'spellCritMulti(18), castSpeedOnCrit(10)' },
  // The Gallery.
  'spire.storm.overcharge.n': { lines: "eleDamage('lightning', 12), shockEffect(25), shockDuration(20)" },
  'spire.storm.mistWalk.n': { lines: 'dodgeSpell(6), dodgeAttack(3), es(6)' },
  'spire.storm.needlework.n': { lines: 'wandAttack(16), wandPhysAsLightning(15), critChance(15)' },
  'spire.storm.longChant.n': { name: 'Recital', lines: 'costReduction(8), damageVsRare(20)' },
  'spire.craft.withering.n': { lines: 'chaosDot(12), skillDuration(15)' },
  'spire.craft.sharpTongue.n': { lines: 'daggerSpellDamage(20), costReduction(6)' },
  'spire.well.livingVerse.n': { lines: 'spellDamage(15), life(8), costReduction(5)' },
  // The Column.
  'spire.column.lingering.n': { name: 'Slow Burn', lines: 'burnDamage(20), coldDot(10), skillDuration(10)' },
  // The Belfry.
  'spire.frost.piercing.n': { lines: 'spellDamage(15), elePenetration(3), costReduction(5)' },
  'spire.frost.shatter.n': { lines: "eleDamage('cold', 14), penetration('cold', 5), freezeChance(8)" },
  'spire.frost.coldLight.n': { lines: "eleDamage('cold', 16), spellCrit(30), critMultiVsFrozen(30)" },
};
const trim: Record<string, string[]> = {
  'spire.home.haleScribe': ['c', 'd'],
  'spire.craft.keenVerse': ['d'],
};
const newc: NewCluster[] = [
  { area: 'home', id: 'first', name: 'First Light', lines: 'allDamage(14), es(6), life(5), int(15)', smalls: [], ats: [K(2050, 0)], why: 'The home generalist, passed through between the two hubs (step 5).' },
  { area: 'well', id: 'kindle', name: 'Kindling', lines: "eleDamage('fire', 20), castSpeed(5), resOne('fire', 15)", smalls: ["eleDamage('fire', 10)", "eleDamage('fire', 10)"], entry: 'spire.well.spW.b', toward: K(2700, -17.5), why: "Fire's first rung, off the west spoke: the west's damage before the rim." },
  { area: 'column', id: 'meet', name: 'Fire and Frost', lines: "eleDamage('fire', 12), eleDamage('cold', 12), crossElement(20)", smalls: ['eleDamageAll(8)', 'eleDamageAll(8)'], entry: 'spire.well.spW.m', toward: K(2780, -9), why: "The two-element path, between fire's road and cold's axis." },
  { area: 'craft', id: 'drone', name: 'Drone', lines: 'channelDamage(20), damageStationary(15)', smalls: ['channelDamage(10)', 'channelDamage(10)'], entry: 'spire.craft.spE.c', toward: K(3450, 26), why: "Channelling's second home, with Steady Stream on the axis." },
  { area: 'fire', id: 'pyre', name: 'Pyre', lines: "eleDamage('fire', 20), penetration('fire', 6), esLeech(0.3)", smalls: ["eleDamage('fire', 10)", "eleDamage('fire', 10)"], entry: 'spire.rim.ring.q2', toward: K(4560, -18.5), why: "Fire's payoff, out from the rim ring." },
  { area: 'storm', id: 'arc', name: 'Arc', lines: "eleDamage('lightning', 16), penetration('lightning', 5), critVsShocked(30)", smalls: ["eleDamage('lightning', 10)", "eleDamage('lightning', 10)"], entry: 'spire.rim.ring.q7', toward: K(4560, 19.5), why: "Lightning's payoff, out from the rim ring." },
  { area: 'storm', id: 'volley', name: 'Volley', lines: 'spellProjectile(15), spellExtraProjectile(1)', smalls: ['spellProjectile(10)', 'spellProjectile(10)'], entry: 'spire.rim.ring.q8', toward: K(4560, 25), why: "Projectiles' second home, with Darting Bolts." },
  { area: 'frost', id: 'blast', name: 'Blast', lines: 'spellAreaDamage(20), spellAreaOnKill(15)', smalls: ['spellArea(8)', 'spellArea(8)'], entry: 'spire.rim.ring.q5', toward: K(4560, 2.8), why: "Area's second home, with Broad Weave." },
];
const second: Second[] = [
  { cluster: 'spire.well.quickening', attach: 'n', id: 'n2', name: 'Ward Renewed', lines: 'esRechargeOnKill(), esRecharge(15)', why: 'The shield comes back with every kill: the Spire’s sustain voice under attrition.' },
  { cluster: 'spire.well.familiars', attach: 'n', id: 'n2', name: 'Bound Host', lines: 'minionDamage(15), minionSpeed(8), skillDuration(10)', why: 'The spell-minion caster’s offence.' },
  { cluster: 'spire.well.composure', attach: 'n', id: 'n2', name: 'Iron Litany', lines: 'stunAvoid(30), spellDamageWhenHit(25), es(6)', why: 'Being hit feeds the casting.' },
  { cluster: 'spire.fire.highVeil', attach: 'n', id: 'n2', name: 'Moonward', lines: "esFlat(30), recoverOn('crit', 'es', 2)", why: 'Crits restore the shield.' },
  { cluster: 'spire.fire.cinder', attach: 'n', id: 'n2', name: 'Warm Hearth', lines: "recoverOn('killIgnited', 'life', 3), recoverOn('killIgnited', 'es', 3), eleDamage('fire', 10)", why: 'The burning dead feed the caster: fire’s own defence.' },
  { cluster: 'spire.fire.badCompany', attach: 'n', id: 'n2', name: 'Hexed Pack', lines: 'curseArea(20), minionLife(15), minionSpeed(5)', why: 'The cursing minion master’s reach.' },
  { cluster: 'spire.craft.siphon', attach: 'n', id: 'n2', name: 'Surging Tide', lines: "arcaneTideOn('crit', 25), spellCrit(25), es(6)", why: 'Crits bring on Arcane Tide.' },
  { cluster: 'spire.storm.overcharge', attach: 'n', id: 'n2', name: 'Conductor', lines: 'shockEffect(15), reducedReservation(4), esOnHit(4)', why: 'The shocker’s sustain.' },
  { cluster: 'spire.storm.wandVolley', attach: 'n', id: 'n2', name: 'Hail of Sparks', lines: 'wandAttack(16), wandChain(1)', why: 'Wand attacks spray from target to target.' },
  { cluster: 'spire.column.hoarfrost', attach: 'n', id: 'n2', name: 'Rime', lines: 'chillEffect(15), chilledLessDamage(10)', why: 'The chill as a defence: chilled enemies hit softer.' },
];
const pairs: [string, string][] = [
  ['spire.craft.siphon', 'spire.craft.hexwright'],
  ['spire.craft.keenVerse', 'spire.storm.overcharge'],
  ['spire.well.deepWell', 'spire.well.quietPulse'],
  ['spire.well.composure', 'spire.frost.stream'],
  ['spire.well.livingVerse', 'spire.fire.manaTap'],
  ['spire.storm.needlework', 'spire.storm.mistWalk'],
  ['spire.craft.withering', 'spire.craft.hexwright'],
  ['spire.column.lingering', 'spire.column.hoarfrost'],
];

if (process.argv[1]?.endsWith('spire-gen.ts'))
  generate({
    region: 'spire', regionId: 'mystic', classId: 'mystic', th: -90, start: S0,
    roadLines: 'int(7)', hubLines: 'int(20)',
    roads, moves, links, over, trim, newc, second, pairs,
    external: {
      'knife.hex.radN.a': lerp(K(1600, 30), K(2900, 30), 1 / 3),
      'knife.hex.radN.b': lerp(K(1600, 30), K(2900, 30), 2 / 3),
      'knife.hex.radN.m': K(2900, 30),
      'knife.home.seams.n': K(1600, 30),
      'knife.rim.ring.n0': K(4300, 30),
    },
    areas: {
      home: { name: 'The Spire Gate', at: K(1900, 5), why: "The Mystic's first points (R-spire.md)." },
      well: { name: 'The Cloister', at: K(2700, -22), why: 'The west: energy shield, mana and life.' },
      craft: { name: 'The Scriptorium', at: K(2700, 22), why: 'The east: spell offence.' },
      column: { name: 'The Column', at: K(3000, 0), why: 'The axis at the mid ring.' },
      fire: { name: 'The Lantern', at: K(3800, -22), why: 'The west toward the rim.' },
      storm: { name: 'The Gallery', at: K(3800, 22), why: 'The east toward the rim.' },
      frost: { name: 'The Belfry', at: K(4000, 0), why: 'The axis toward the rim.' },
      rim: { name: 'The Parapet', at: K(4600, 0), why: 'The rim ring.' },
    },
    doc: 'R-spire.md',
    dryRun: process.argv.includes('--dry'),
  });
