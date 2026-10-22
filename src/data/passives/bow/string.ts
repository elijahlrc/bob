/**
 * The string: the straight dexterity road from the signature east to the projectiles hub, the generic way across the
 * region. Five road nodes in a line; off them, the pockets every Strider wants whatever the weapon: accuracy (also the
 * short cut north onto the bows road, drawn as a straight run), evasion and life (also the short cut south onto the
 * physical road, a straight run the other way), attack speed and movement speed (a tight loop under the road between
 * its third and fourth nodes), and Arrow Weave one step off the fifth node. The two short cuts are what make the region
 * a lattice: bows, string and physical end are three roads out of the home and they are joined twice before the arc,
 * so a build can go out one way and come back another.
 */
import {
  accuracy,
  attackSpeed,
  castSpeed,
  dex,
  evasion,
  life,
  manaRegen,
  moveSpeed,
  resOne,
  shieldDef,
  stunAvoid,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const string: AreaSpec = {
  id: 'bow.string',
  region: 'strider',
  name: 'The Meadow',
  why: 'The generic road across the region, with the pockets a Strider of any weapon wants hanging off it.',
  at: [1900, 1540], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'road',
      name: 'The string',
      why: 'Five dexterity nodes in a straight line from the signature to the projectiles hub. Each is a junction: a pocket, a short cut or the keystone hangs off every one of them.',
      at: P(484, 21),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 's1',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(394, 15),
          why: 'The accuracy pocket leaves here, north.',
        },
        {
          id: 's2',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(574, 26),
          why: 'The evasion-and-life chain leaves here, south.',
        },
      ],
      links: [['s1', 's2']],
    },
    {
      id: 'aim',
      name: 'True Aim',
      why: "Accuracy and attack speed, a straight pass-through run between the string's first node and the bows road: the short cut north costs the notable, and the notable is one every attacker wants (the reference's accuracy pocket sits the same distance from its start).",
      at: P(1607, 135),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [attackSpeed(5)], at: P(1587, 141) },
        {
          id: 'n',
          kind: 'notable',
          name: 'True Aim',
          lines: [accuracy(15), attackSpeed(5), dex(20)],
          at: P(1529, 180),
          why: '1.5 + 1.7 + 1.3 units.',
        },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'hardTarget',
      name: 'Hard Target',
      why: "The evasion-and-life chain, a straight run from the string's second node down to the physical road: evasion on the string side, life on the physical side, the notable in the middle. Walked from the string it costs evasion to reach the life; walked from the physical road, the other way round. The short cut south costs the notable.",
      at: P(1285, -9),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [evasion(12)], at: P(1600, -11) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Hard Target',
          lines: [evasion(20), life(10), stunAvoid(10)],
          at: P(1297, -21),
          why: '1.7 + 2 + 0.5 units.',
        },
        { id: 'c', kind: 'small', lines: [life(5)], at: P(1227, -17) },
        { id: 'd', kind: 'small', lines: [life(5)], at: P(1169, -13) },
      ],
      links: [
        ['n', 'c'],
        ['c', 'd'],
      ],
    },
    {
      id: 'speed',
      name: 'Quick Hands and Fleet Foot',
      why: 'A tight loop under the string between its third and fourth nodes: attack speed on the west side up to Quick Hands, movement speed on the east side up to Fleet Foot, a mixed node at the bottom between the two notables. One side is three points for one notable; both notables cost the loop.',
      at: P(1317, 108),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [attackSpeed(5)], at: P(1100, 175) },
        {
          id: 'qh',
          kind: 'notable',
          name: 'Quick Hands',
          lines: [attackSpeed(6), castSpeed(5)],
          at: P(1167, 193),
          why: "2 + 1.3 units: quick with the bow and the spell. Round 4 (approved 2026-10-20): it sold accuracy, attack speed and dexterity, True Aim's lines, two steps from it.",
        },
        {
          id: 'm',
          kind: 'small',
          lines: [moveSpeed(5)],
          at: P(1348, 187),
          why: 'The node between the notables: a little of both.',
        },
        {
          id: 'ff',
          kind: 'notable',
          name: 'Fleet Foot',
          lines: [moveSpeed(8), evasion(16), attackSpeed(3)],
          at: P(1472, -18),
          why: '2 + 1.3 + 1 units.',
        },
        { id: 'b', kind: 'small', lines: [evasion(10)], at: P(1542, -16) },
      ],
      links: [
        ['a', 'qh'],
        ['qh', 'm'],
        ['ff', 'b'],
      ],
    },
    {
      id: 'arrowWeave',
      name: 'Arrow Weave',
      why: "One evasion node off the string's fifth junction, then the keystone (evade projectiles better, melee worse): ten steps from the start, where the reference puts its evasion keystones. A kiting Strider's first keystone, chosen before the arc.",
      at: P(2110, 127),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [evasion(12)], at: P(2127, 138) },
        { id: 'k', kind: 'keystone', name: 'Arrow Weave', lines: [], at: P(2205, 171) },
      ],
      links: [['a', 'k']],
    },
    {
      id: 'added',
      name: 'Added in the editor',
      why: 'Nodes added by the user in the tree editor (2026-10-19); names and reasons provisional.',
      at: P(954, 209),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n402',
          kind: 'small',
          lines: [manaRegen(12)],
          at: P(459, 226),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n417',
          kind: 'small',
          lines: [resOne('fire', 10)],
          at: P(829, 366),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n418',
          kind: 'small',
          lines: [resOne('fire', 10)],
          at: P(794, 319),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n419',
          kind: 'small',
          lines: [resOne('chaos', 10)],
          at: P(936, 395),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n420',
          kind: 'small',
          lines: [resOne('chaos', 10)],
          at: P(990, 373),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n431',
          kind: 'small',
          lines: [shieldDef(10)],
          at: P(1454, -86),
          why: 'Added in the editor (2026-10-19).',
        },
      ],
      links: [
        ['n417', 'n418'],
        ['n419', 'n420'],
      ],
    },
  ],
  links: [
    { from: 'road.s2', to: 'speed.a', why: 'Added in the editor (2026-10-19).' },
    { from: 'road.s2', to: 'hardTarget.d', why: 'Added in the editor (2026-10-19).' },
    { from: 'road.s2', to: 'added.n402', why: 'Added in the editor (2026-10-19).' },
    { from: 'road.s2', to: 'added.n418', why: 'Added in the editor (2026-10-19).' },
    { from: 'aim.a', to: 'bow.flight.hub.p', why: 'Added in the editor (2026-10-19).' },
    { from: 'aim.n', to: 'speed.m', why: 'Added in the editor (2026-10-19).' },
    { from: 'hardTarget.a', to: 'speed.b', why: 'Added in the editor (2026-10-19).' },
    { from: 'hardTarget.a', to: 'bow.flight.hub.p', why: 'Added in the editor (2026-10-19).' },
    { from: 'hardTarget.n', to: 'speed.ff', why: 'Added in the editor (2026-10-19).' },
    { from: 'speed.m', to: 'added.n420', why: 'Added in the editor (2026-10-19).' },
    { from: 'speed.ff', to: 'added.n431', why: 'Added in the editor (2026-10-19).' },
    { from: 'arrowWeave.a', to: 'bow.flight.hub.p', why: 'Added in the editor (2026-10-19).' },
  ],
};
