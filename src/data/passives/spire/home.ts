/**
 * The Spire's home: the Mystic's first points, after the Strider's rework and the user's edit of it (2026-10-19): the
 * start touches two stat nodes, the hubs sit one step out, every small is one stat at the reference's size, and nothing
 * within three steps names an element.
 *
 * West side: energy shield, toward the well. East side: crit, toward the craft. The signature (spell damage, mana,
 * intelligence, a little shield) is the loop's tip. Off the west hub, a mana pocket; off the east hub, a spell crit
 * pocket. The hubs carry intelligence; from each, an intelligence highway climbs to the well and the craft, and the Warm
 * Blood bridge (life) joins the two highways across the gate.
 */
import {
  critChance,
  es,
  int,
  life,
  mana,
  manaFlat,
  manaRegen,
  projectileSpeed,
  spellCrit,
  spellCritMulti,
  spellDamage,
  wandAttack,
  weaponAccuracy,
} from '../lines';
import type { AreaSpec } from '../types';

export const START = {
  classId: 'mystic',
  region: 'mystic' as const,
  id: 'start.mystic',
  at: [0, -1000] as [number, number],
};

export const home: AreaSpec = {
  id: 'spire.home',
  region: 'mystic',
  name: 'The Spire gate',
  why: 'Two stat nodes off the start (shield west, crit east), the signature between them, two hubs one step out with a pocket each, and two intelligence highways: the well up the left, the craft up the right, bridged by Warm Blood.',
  at: [-40, -890], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'sig',
      name: 'First Light',
      why: 'The loop the start opens onto: energy shield on the west side, spell damage on the east, the signature at the tip. Point one is a side; point two is the signature, a hub, or a road.',
      at: [0, -1180],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [es(5)],
          at: [-70, -1242],
          why: 'The west side: defence.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'First Light',
          lines: [spellDamage(10), mana(10), int(20), es(4)],
          at: [0, -1240],
          why: 'The signature: spell damage, mana, intelligence and a little shield. 4.6 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [critChance(15)],
          at: [70, -1242],
          why: 'The east side: offence, for any hit, spell or wand.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'hubs',
      name: 'The hubs',
      why: 'Intelligence, one step past each side node: the west hub joins the ring toward the Zealot and starts the well road; the east hub joins the ring toward the Shade and starts the craft road.',
      at: [0, -1250],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'w', kind: 'attribute', lines: [int(20)], at: [-300, -1250] },
        { id: 'e', kind: 'attribute', lines: [int(20)], at: [300, -1250] },
      ],
      links: [],
    },
    {
      id: 'stillMind',
      name: 'Still Mind',
      why: "The west hub's pocket, a tight orbit: two mana regeneration nodes and a notable with regeneration and flat mana, on a half circle west of the hub and the road's first node. A caster's first worry is running dry; three points after the hub it stops being one.",
      at: [-425, -1275],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [manaRegen(10)],
          why: 'The entrance, facing the hub.',
          at: [-368, -1237],
        },
        { id: 'b', kind: 'small', lines: [manaRegen(10)], at: [-425, -1275] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Still Mind',
          lines: [manaRegen(20), manaFlat(30)],
          at: [-438, -1343],
          why: '2 + 1.5 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'sharpMind',
      name: 'Sharp Mind',
      why: "The east hub's pocket, a tight orbit: two spell crit nodes and a notable with spell crit and spell crit multiplier, on a half circle east of the hub and the road's first node. The crit caster's first three points after the hub, and the way the insight charges start paying.",
      at: [425, -1275],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [spellCrit(15)],
          why: 'The entrance, facing the hub.',
          at: [368, -1237],
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Sharp Mind',
          lines: [spellCrit(30), spellCritMulti(15)],
          at: [438, -1343],
          why: '2 + 1.25 units.',
        },
        { id: 'b', kind: 'small', lines: [spellCrit(15)], at: [425, -1275] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'roadW',
      name: 'The west road',
      why: "Intelligence three times: the highway up the left from the west hub to the well's wheel, with Still Mind off its foot and the gate pocket off its middle.",
      at: [-380, -1600],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [int(7)], at: [-400, -1400] },
        { id: 'b', kind: 'attribute', lines: [int(7)], at: [-400, -1600] },
        { id: 'c', kind: 'attribute', lines: [int(7)], at: [-400, -1780] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'roadE',
      name: 'The east road',
      why: "Intelligence three times: the highway up the right from the east hub to the craft's wheel, with Sharp Mind off its foot and the gate pocket off its middle.",
      at: [380, -1600],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [int(7)], at: [400, -1400] },
        { id: 'b', kind: 'attribute', lines: [int(7)], at: [400, -1600] },
        { id: 'c', kind: 'attribute', lines: [int(7)], at: [400, -1780] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'toRingW',
      name: 'To the ring',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
      at: [-247, -987],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [-247, -987] }],
      links: [],
    },
    {
      id: 'toRingE',
      name: 'To the ring',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
      at: [247, -987],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [247, -987] }],
      links: [],
    },
    {
      id: 'warmBlood',
      name: 'Warm Blood',
      why: "A bridge across the gate between the two highways, at their middle nodes: life twice and the notable, the Spire's second life cluster (Quiet Pulse is far up the well). It fills the band outside the home and makes the two roads a loop.",
      at: [0, -1700],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [life(5)], at: [-68, -1683] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Warm Blood',
          lines: [life(12), es(6)],
          at: [0, -1700],
          why: 'Life and a little shield: 2.4 + 1.2 units.',
        },
        { id: 'b', kind: 'small', lines: [life(5)], at: [68, -1683] },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'deftWand',
      name: 'Deft Wand',
      why: "A pocket east off the west road's first node, into the ground between the signature and Warm Blood: wand attacks twice, then wand attacks with accuracy and projectile speed. The second wand-attack cluster, six steps from the start, so the Mystic who starts with a wand attack has one near home; Wand Volley, thirteen out on the east side, sells wand attacks with speed and crit. Round 3 (2026-10-20); it also breaks the home's mirror.",
      at: [-42, -1400],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [wandAttack(12)], at: [0, -1400] },
        { id: 'b', kind: 'small', lines: [wandAttack(12)], at: [58, -1400] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Deft Wand',
          lines: [wandAttack(20), weaponAccuracy('wand', 15), projectileSpeed(10)],
          at: [128, -1400],
          why: '1.7 + 1.5 + 1 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
  ],
  links: [
    { from: 'roadW.a', to: 'deftWand.a', why: 'The west road onto the wand pocket.' },
    { from: 'roadW.b', to: 'warmBlood.a', why: 'The west highway onto the gate bridge.' },
    { from: 'warmBlood.b', to: 'roadE.b', why: 'The gate bridge onto the east highway.' },
    { from: 'start.mystic', to: 'sig.a', why: 'Point one, the west side.' },
    { from: 'start.mystic', to: 'sig.b', why: 'Point one, the east side.' },
    { from: 'sig.a', to: 'hubs.w', why: 'The west side to the west hub.' },
    { from: 'sig.b', to: 'hubs.e', why: 'The east side to the east hub.' },
    { from: 'hubs.w', to: 'stillMind.a', why: "The west hub's pocket." },
    { from: 'hubs.e', to: 'sharpMind.a', why: "The east hub's pocket." },
    {
      from: 'spire.home.hubs.w',
      to: 'spire.home.toRingW.a',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
    },
    { from: 'spire.home.toRingW.a', to: 'centre.ring.road.r23', why: 'The far end of the road.' },
    {
      from: 'spire.home.hubs.e',
      to: 'spire.home.toRingE.a',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
    },
    { from: 'spire.home.toRingE.a', to: 'centre.ring.road.r1', why: 'The far end of the road.' },
    { from: 'hubs.w', to: 'roadW.a', why: 'The well road.' },
    { from: 'hubs.e', to: 'roadE.a', why: 'The craft road.' },
    { from: 'roadW.c', to: 'spire.well.deepWell.a', why: 'The well road reaches the wheel.' },
    { from: 'roadE.c', to: 'spire.craft.focus.a', why: 'The craft road reaches the wheel.' },
    {
      from: 'stillMind.n',
      to: 'roadW.a',
      why: 'The mana pocket is also a way onto the well road: a pocket as a bridge.',
    },
    {
      from: 'sharpMind.n',
      to: 'roadE.a',
      why: 'The crit pocket is also a way onto the craft road.',
    },
  ],
};
