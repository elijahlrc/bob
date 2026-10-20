/**
 * The Cathedral's home: the Zealot's first points, on the pattern the other homes follow (PHILOSOPHY.md §3): the start
 * touches two stat nodes, the hubs sit one step out, every small is one stat at the reference's size, and nothing
 * within three steps names a sceptre, a minion or an aura.
 *
 * West side (toward the Wall): armour. East side (toward the Spire): elemental damage, which serves the striker and
 * the caster alike. The signature (elemental damage, global defences, life, both attributes) is the loop's tip, and the
 * middle road leaves from it straight out: life three times to the block wheel. The west and east roads leaving the hubs
 * are strength-and-intelligence highways (2026-10-20). The west hub's pocket is the Wall's Warlord's Banner, one step away across the border (the aura
 * class's reservation, bought from the neighbour who wrote it first); the east hub has a mana pocket of its own; a
 * flask pocket hangs off the west road. The hubs carry both attributes and join the ring one node to either side.
 */
import {
  armour,
  eleDamageAll,
  es,
  flaskDuration,
  flaskEffect,
  globalDefences,
  int,
  life,
  lifeRegen,
  mana,
  manaRegen,
  str,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const START = {
  classId: 'zealot',
  region: 'zealot' as const,
  id: 'start.zealot',
  at: [-866, -500] as [number, number],
};

export const home: AreaSpec = {
  id: 'cathedral.home',
  region: 'zealot',
  name: 'The Narthex',
  why: "Two stat nodes off the start (armour west, elemental damage east), the signature between them, two hubs one step out, and three roads: a highway to the west, life straight out, a highway to the east. The west hub's pocket is the Wall's Banner; the east hub's is mana.",
  at: [-1202, -858], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'sig',
      name: 'Zeal',
      why: 'The loop the start opens onto: armour on the west side, elemental damage on the east, the signature at the tip. Point one is a side; point two is the signature, a hub, or a road.',
      at: P(200, 0),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [armour(12)],
          at: P(120, -150),
          why: 'The west side: defence.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Zeal',
          lines: [eleDamageAll(10), globalDefences(8), life(5), str(10), int(10)],
          at: P(240, 0),
          why: "The signature: elemental damage for either future, global defences (armour and shield at once: the Zealot's hybrid defence in one line), life and both attributes. 4.3 units. The middle road leaves from here.",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [eleDamageAll(10)],
          at: P(120, 150),
          why: 'The east side: offence.',
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
      why: "Both attributes, one step past each side node: the west hub joins the ring toward the Vanguard, starts the west road and touches the Wall's Banner; the east hub joins the ring toward the Mystic and starts the east road.",
      at: P(250, 0),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'w', kind: 'attribute', lines: [str(15), int(15)], at: P(250, -280) },
        { id: 'e', kind: 'attribute', lines: [str(15), int(15)], at: P(250, 280) },
      ],
      links: [],
    },
    {
      id: 'hymn',
      name: 'Hymn',
      why: "The east hub's pocket, a tight orbit pointing at the Spire: two mana nodes and a notable with mana, regeneration and a little shield. Auras reserve it and minions cost it; three points after the hub the Zealot has more of it.",
      at: P(330, 545),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [mana(8)],
          at: P(220, 440),
          why: 'The entrance, facing the hub.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Hymn',
          lines: [mana(16), manaRegen(10), es(5)],
          at: P(340, 560),
          why: '2 + 1 + 1 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [mana(8)],
          at: P(440, 630),
          why: 'The far node, onto the east road.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'alms',
      name: 'Alms',
      why: "Flask effect, then the notable with flask effect, duration and a little regeneration: the Cathedral's flasks, off the west road's first node and back onto its second, on the Wall side where the Banner already is. The west hub's pocket, one step removed.",
      at: P(580, -510),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [flaskEffect(5)],
          at: P(520, -480),
          why: 'The entrance, from the west road.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Alms',
          lines: [flaskEffect(10), flaskDuration(10), lifeRegen(0.4)],
          at: P(640, -540),
          why: '2 + 1 + 1 units. The exit, back onto the west road.',
        },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'roadM',
      name: 'The middle road',
      why: 'Life three times: the road straight out from the signature to the block wheel, which every Zealot walks whichever future it picks.',
      at: P(580, 0),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [life(5)], at: P(420, 0) },
        { id: 'b', kind: 'small', lines: [life(5)], at: P(580, 0) },
        { id: 'c', kind: 'small', lines: [life(5)], at: P(740, 0) },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'roadW',
      name: 'The west road',
      why: "Strength and intelligence twice: the highway from the west hub to the nave wheel's block side, with Alms off its foot.",
      at: P(565, -300),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [str(6), int(6)], at: P(440, -330) },
        { id: 'b', kind: 'attribute', lines: [str(6), int(6)], at: P(690, -270) },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'roadE',
      name: 'The east road',
      why: 'Strength and intelligence twice: the highway from the east hub to the transept junction.',
      at: P(565, 300),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [str(6), int(6)], at: P(440, 330) },
        { id: 'b', kind: 'attribute', lines: [str(6), int(6)], at: P(690, 270) },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'jT',
      name: 'The transept',
      why: "Where the east road meets the nave wheel's fire side and the choir begins.",
      at: P(880, 330),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(6), int(6)], at: P(880, 330) }],
      links: [],
    },
    {
      id: 'toRingW',
      name: 'To the ring',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
      at: [-973, -288],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(6), int(6)], at: [-973, -288] }],
      links: [],
    },
    {
      id: 'toRingE',
      name: 'To the ring',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
      at: [-736, -698],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(6), int(6)], at: [-736, -698] }],
      links: [],
    },
  ],
  links: [
    { from: 'start.zealot', to: 'sig.a', why: 'Point one, the west side.' },
    { from: 'start.zealot', to: 'sig.b', why: 'Point one, the east side.' },
    { from: 'sig.a', to: 'hubs.w', why: 'The west side to the west hub.' },
    { from: 'sig.b', to: 'hubs.e', why: 'The east side to the east hub.' },
    { from: 'hubs.e', to: 'hymn.a', why: "The east hub's pocket." },
    {
      from: 'hubs.w',
      to: 'wall.resists.banner.n',
      why: "The west hub's pocket is the Wall's Warlord's Banner, one step across the border: the aura class buys its first reservation from the neighbour, and the Vanguard's standards are a Zealot's road in. One of the two near crossings of the pair (brief §4).",
    },
    {
      from: 'cathedral.home.hubs.w',
      to: 'cathedral.home.toRingW.a',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
    },
    {
      from: 'cathedral.home.toRingW.a',
      to: 'centre.ring.road.r19',
      why: 'The far end of the road.',
    },
    {
      from: 'cathedral.home.hubs.e',
      to: 'cathedral.home.toRingE.a',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
    },
    {
      from: 'cathedral.home.toRingE.a',
      to: 'centre.ring.road.r21',
      why: 'The far end of the road.',
    },
    { from: 'hubs.w', to: 'roadW.a', why: 'The west road.' },
    { from: 'hubs.e', to: 'roadE.a', why: 'The east road.' },
    { from: 'sig.n', to: 'roadM.a', why: 'The middle road.' },
    {
      from: 'hymn.b',
      to: 'roadE.a',
      why: 'The mana pocket is also a way onto the east road: a pocket as a bridge.',
    },
    { from: 'roadW.a', to: 'alms.a', why: "The west road's first node onto the flask pocket." },
    { from: 'alms.n', to: 'roadW.b', why: 'The flask pocket back onto the west road: a loop.' },
    {
      from: 'roadM.c',
      to: 'cathedral.nave.wheel.n1',
      why: 'The middle road reaches the block wheel.',
    },
    {
      from: 'roadW.b',
      to: 'cathedral.nave.wheel.n2',
      why: "The west road reaches the wheel's block side.",
    },
    { from: 'roadE.b', to: 'jT.a', why: 'The east road reaches the transept.' },
    {
      from: 'jT.a',
      to: 'cathedral.nave.wheel.n6',
      why: "The transept to the wheel's fire side: the home is a loop through the wheel.",
    },
    { from: 'jT.a', to: 'cathedral.choir.wheel.c1', why: 'The transept to the aura wheel.' },
  ],
};
