/**
 * The Knife's home: the Shade's first points, on the pattern the other homes follow (PHILOSOPHY.md §3): the start
 * touches two stat nodes, the hubs sit one step out, every small is one stat at the reference's size, and nothing
 * within three steps names a dagger or a claw.
 *
 * North side (toward the Spire): energy shield. South side (toward the Bow): critical strikes. The signature (crit,
 * evasion, shield, both attributes) is the loop's tip, and the blade road leaves from it straight out: attack speed
 * three times to the daggers-and-claws wheel. Off the north hub, a mana pocket; off the south hub, an evasion pocket;
 * each is also a way onto its road. The hubs carry both attributes (a dagger asks for both); the north and south roads
 * leaving them are dexterity-and-intelligence highways (2026-10-20).
 */
import {
  attackSpeed,
  castSpeed,
  critChance,
  daggerDamage,
  dex,
  dodgeAttack,
  es,
  evasion,
  flaskRecovery,
  int,
  manaOnKill,
  manaRegen,
  moveSpeed,
  spellDamage,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const START = {
  classId: 'shade',
  region: 'shade' as const,
  id: 'start.shade',
  at: [866, -500] as [number, number],
};

export const home: AreaSpec = {
  id: 'knife.home',
  region: 'shade',
  name: 'The Knife Gate',
  why: 'Two stat nodes off the start (shield north, crit south), the signature between them, two hubs one step out with a pocket each, and three roads: the blade straight out, the north highway along the north flank, the south highway along the south flank.',
  at: [1270, -747], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'sig',
      name: 'Keen Instinct',
      why: 'The loop the start opens onto: energy shield on the north side, crit on the south, the signature at the tip. Point one is a side; point two is the signature, a hub, or a road.',
      at: P(200, 0),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [evasion(12)],
          at: P(120, -150),
          why: "The north side: defence. Evasion here; the Spire's start opens on energy shield.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Keen Instinct',
          lines: [critChance(20), evasion(12), es(5), dex(10), int(10)],
          at: P(240, 0),
          why: 'The signature: the Shade is the crit class with two defences and two attributes. 4.3 units. The blade road leaves from here.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [critChance(20)],
          at: P(120, 150),
          why: 'The south side: offence.',
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
      why: 'Both attributes, one step past each side node: the north hub joins the ring toward the Mystic and starts the north road; the south hub joins the ring toward the Strider and starts the south road.',
      at: P(250, 0),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'n', kind: 'attribute', lines: [dex(15), int(15)], at: P(250, -300) },
        { id: 's', kind: 'attribute', lines: [dex(15), int(15)], at: P(250, 300) },
      ],
      links: [],
    },
    {
      id: 'spoils',
      name: 'Spoils',
      why: "The north hub's pocket, a tight orbit: two mana regeneration nodes and a notable with regeneration, mana on kill and flask recovery. What a Shade picks up from the bodies; the first mana a Shade can buy, three points after the hub.",
      at: P(330, -545),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [manaRegen(10)],
          at: P(220, -440),
          why: 'The entrance, facing the hub.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Spoils',
          lines: [manaRegen(15), manaOnKill(10), flaskRecovery(10)],
          at: P(340, -560),
          why: '1.5 + 1 + 1 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [manaRegen(10)],
          at: P(440, -630),
          why: 'The far node, onto the north road.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'softStep',
      name: 'Soft Step',
      why: "The south hub's pocket, a tight orbit pointing at the Bow: two evasion nodes and a notable with evasion, movement and a little dodge. The Shade's first defence that is not a pool.",
      at: P(330, 545),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [evasion(12)],
          at: P(220, 440),
          why: 'The entrance, facing the hub.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Soft Step',
          lines: [evasion(20), moveSpeed(4), dodgeAttack(3)],
          at: P(340, 560),
          why: '1.7 + 1 + 1 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [evasion(12)],
          at: P(440, 630),
          why: "The far node: the Bow's near crossing lands here, and the south road is one step on.",
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'roadB',
      name: 'The blade road',
      why: 'Attack speed three times: the road straight out from the signature to the daggers-and-claws wheel, which a two-dagger Shade and a claw Shade walk alike.',
      at: P(580, 0),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [attackSpeed(5)], at: P(420, 0) },
        { id: 'b', kind: 'small', lines: [attackSpeed(5)], at: P(580, 0) },
        { id: 'c', kind: 'small', lines: [attackSpeed(5)], at: P(740, 0) },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'roadN',
      name: 'The north road',
      why: "Dexterity and intelligence twice: the highway from the north hub to the edge wheel's claw side.",
      at: P(560, -300),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: P(440, -330) },
        { id: 'b', kind: 'attribute', lines: [dex(6), int(6)], at: P(690, -270) },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'roadS',
      name: 'The south road',
      why: 'Dexterity and intelligence twice: the highway from the south hub to the dodge junction.',
      at: P(515, 405),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: P(430, 330) },
        {
          id: 'b',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: P(600, 480),
          why: 'Where the evasion pocket arrives.',
        },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'toRingN',
      name: 'To the ring',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
      at: [732, -707],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: [732, -707] }],
      links: [],
    },
    {
      id: 'toRingS',
      name: 'To the ring',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
      at: [979, -279],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: [979, -279] }],
      links: [],
    },
    {
      id: 'quietKnife',
      name: 'Quiet Knife',
      why: "A dead-end pocket north off the north highway's second node, into the empty ground toward the Spire: spell damage twice, then the dagger caster's notable. Daggers have two homes with different partners: crit at the Alleys (Fine Point) and spells here, and the Shade picks one.",
      at: [1240, -1430],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [spellDamage(8)], at: [1290, -1270] },
        { id: 'b', kind: 'small', lines: [spellDamage(8)], at: [1240, -1430] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Quiet Knife',
          lines: [daggerDamage(16), spellDamage(16), castSpeed(4)],
          at: [1190, -1590],
          why: "The dagger in the caster's hand: 1.6 + 2 + 1 units.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'toHedge',
      name: 'To Hedge Magic',
      why: "One attribute node from the Knife Gate's ring road to the Strider's Hedge Magic: a near bridge between the two homes for the spell Strider and the dagger caster.",
      at: [1065, -64],
      shape: { kind: 'hand' },
      nodes: [{ id: 'r1', kind: 'attribute', lines: [dex(6), int(6)], at: [1065, -64] }],
      links: [],
    },
  ],
  links: [
    {
      from: 'knife.home.toRingS.a',
      to: 'knife.home.toHedge.r1',
      why: "One attribute node from the Knife Gate's ring road to the Strider's Hedge Magic: a near bridge between the two homes for the spell Strider and the dagger caster.",
    },
    { from: 'knife.home.toHedge.r1', to: 'bow.bows.hedgeMagic.a', why: 'The far end of the road.' },
    {
      from: 'roadN.b',
      to: 'quietKnife.a',
      why: "The north highway onto the dagger caster's pocket.",
    },
    { from: 'start.shade', to: 'sig.a', why: 'Point one, the north side.' },
    { from: 'start.shade', to: 'sig.b', why: 'Point one, the south side.' },
    { from: 'sig.a', to: 'hubs.n', why: 'The north side to the north hub.' },
    { from: 'sig.b', to: 'hubs.s', why: 'The south side to the south hub.' },
    { from: 'hubs.n', to: 'spoils.a', why: "The north hub's pocket." },
    { from: 'hubs.s', to: 'softStep.a', why: "The south hub's pocket." },
    {
      from: 'knife.home.hubs.n',
      to: 'knife.home.toRingN.a',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
    },
    { from: 'knife.home.toRingN.a', to: 'centre.ring.road.r3', why: 'The far end of the road.' },
    {
      from: 'knife.home.hubs.s',
      to: 'knife.home.toRingS.a',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
    },
    { from: 'knife.home.toRingS.a', to: 'centre.ring.road.r5', why: 'The far end of the road.' },
    { from: 'hubs.n', to: 'roadN.a', why: 'The north road.' },
    { from: 'hubs.s', to: 'roadS.a', why: 'The south road.' },
    { from: 'sig.n', to: 'roadB.a', why: 'The blade road.' },
    {
      from: 'spoils.b',
      to: 'roadN.a',
      why: 'The mana pocket is also a way onto the north road: a pocket as a bridge.',
    },
    {
      from: 'softStep.b',
      to: 'roadS.b',
      why: 'The evasion pocket is also a way onto the south road, at its second node.',
    },
    { from: 'roadB.c', to: 'knife.edge.wheel.w1', why: 'The blade road reaches the wheel.' },
    {
      from: 'roadN.b',
      to: 'knife.edge.wheel.w2',
      why: "The north road reaches the wheel's claw side.",
    },
    { from: 'roadS.b', to: 'knife.edge.j1.a', why: 'The south road reaches the dodge junction.' },
    {
      from: 'bow.bows.toKnife.a',
      to: 'softStep.b',
      why: "The near crossing from the Bow (brief §4: daggers and claws ↔ bows): the Bow's stub lands on the evasion pocket's far node, one step from the south road and two from the dodge junction. For the dagger Strider and the evasion Shade who wants a bow.",
    },
  ],
};
