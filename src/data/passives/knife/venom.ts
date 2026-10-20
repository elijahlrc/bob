/**
 * The Rookery (the Knife's blade, past the edge): the venom junction, the wheel (poison with crit on the north
 * side, shield and evasion on the south, attribute nodes at the ends), the north junction with the Shade Leech spur and the Second
 * Curse chain bridging to the curse junction, and the point: the far junction with Cruel Agony straight out and Hollow
 * Vessel north, where the bow chain from the trap barb also arrives. Re-lined on 2026-10-20 (PHILOSOPHY §2a).
 */
import {
  critChance,
  critMulti,
  curseEffect,
  dex,
  es,
  evasion,
  hexLimit,
  int,
  leechLife,
  poisonChance,
  poisonDamage,
  stunAvoid,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const venom: AreaSpec = {
  id: 'knife.venom',
  region: 'shade',
  name: 'The Rookery',
  why: "The Knife's blade past the edge: crit poison (Barbed Point) or a shield on one wheel, Shade Leech, Second Curse, and the point with Cruel Agony and Hollow Vessel.",
  at: [2502, -1760], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'j2',
      name: 'Venom junction',
      why: 'Where the blade leaves the edge: the wheel ahead, the trap barb south-east, the curse barb north-west.',
      at: P(1420, 0),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: P(1420, 0) }],
      links: [],
    },
    {
      id: 'wheel',
      name: 'Barbed Point',
      why: "The wheel of eight past the edge: entered from the venom junction, left to the point, attribute nodes at both ends so neither side pays for the other. On the north side poison with crit (Barbed Point; the other poison notables are Festering, with bleeding, in the Yard's Pits, and Venom Fletching, with chaos attacks, in the Strider); on the south side energy shield and evasion with stun avoidance, for the Shade who wants to live.",
      at: P(1750, 0),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'v1',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: P(1529, 0),
          why: 'The west entrance: a road node both sides use.',
        },
        {
          id: 'v2',
          kind: 'small',
          lines: [poisonDamage(12)],
          at: P(1640, -191),
          why: 'The poison side; the north junction leaves here.',
        },
        {
          id: 'v3',
          kind: 'notable',
          name: 'Barbed Point',
          lines: [poisonDamage(24), poisonChance(10), critChance(20)],
          at: P(1861, -191),
          why: 'Poison that rides on crits: 2 + 1 + 1 units.',
        },
        {
          id: 'v4',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: P(1971, 0),
          why: 'The east exit, to the point.',
        },
        {
          id: 'v5',
          kind: 'notable',
          name: 'Shroud',
          lines: [es(10), evasion(14), stunAvoid(20)],
          at: P(1861, 191),
          why: "Both of the Shade's defences and a guard against stuns: 2 + 1.2 + 1 units.",
        },
        { id: 'v6', kind: 'small', lines: [es(5)], at: P(1640, 191), why: 'The shield side.' },
        { id: 'v7', kind: 'small', lines: [poisonDamage(12)], at: P(1958, -120) },
        { id: 'v8', kind: 'small', lines: [es(5)], at: P(1958, 120) },
      ],
      links: [
        ['v1', 'v2'],
        ['v2', 'v3'],
        ['v3', 'v7'],
        ['v7', 'v4'],
        ['v4', 'v8'],
        ['v8', 'v5'],
        ['v5', 'v6'],
        ['v6', 'v1'],
      ],
    },
    {
      id: 'jN',
      name: 'North junction',
      why: "Off the wheel's chaos side: the Shade Leech spur north, the Veil pocket west to the curse junction.",
      at: P(1760, -400),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: P(1760, -400) }],
      links: [],
    },
    {
      id: 'shadeLeech',
      name: 'Shade Leech',
      why: 'Two nodes of attack leech, then the trade: life leech fills energy shield instead, and the shield recharges half as fast. The leech-shield Shade; the approach says what the keystone asks.',
      at: P(1850, -800),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [leechLife(0.4, ['attack'])], at: P(1800, -600) },
        { id: 'b', kind: 'small', lines: [leechLife(0.4, ['attack'])], at: P(1850, -800) },
        { id: 'k', kind: 'keystone', name: 'Shade Leech', lines: [], at: P(1900, -1000) },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
    {
      id: 'secondCurse',
      name: 'Second Curse',
      why: "Curse effect, then the notable with one more curse at a time: a chain from the north junction to the curse junction, eleven steps from the Spire's Hexwright (it sat on the barb's wheel a step from Hexwright until 2026-10-20, which made the two one stop; Hexwright moved up the Scriptorium's east road in round 3).",
      at: P(1535, -465),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [curseEffect(8)],
          at: P(1600, -500),
          why: 'The entrance, from the north junction.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Second Curse',
          lines: [hexLimit(1)],
          at: P(1560, -720),
          why: 'One more curse at a time: 5 units by the table. The tip of the chain.',
        },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'j5',
      name: 'The point',
      why: "The blade's far junction: Cruel Agony straight out, Hollow Vessel north, the bow chain from the trap barb arriving from the south, so the point is a loop with the barb.",
      at: P(2100, 0),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: P(2100, 0) }],
      links: [],
    },
    {
      id: 'cruelAgony',
      name: 'Cruel Agony',
      why: 'Two nodes of crit multiplier, then the trade: ailments from critical strikes use the crit multiplier, and crits deal 30% less hit damage. The tip of the blade and the farthest keystone of the region: the crit-poison build in one node.',
      at: P(2460, 0),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [critMulti(12)], at: P(2280, 0) },
        { id: 'b', kind: 'small', lines: [critMulti(12)], at: P(2460, 0) },
        { id: 'k', kind: 'keystone', name: 'Cruel Agony', lines: [], at: P(2640, 0) },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
    {
      id: 'hollowVessel',
      name: 'Hollow Vessel',
      why: 'Two nodes of energy shield, then the trade: maximum life is one, immune to chaos. North of the point, on the shield side of the blade, for the Shade who lives on shield alone.',
      at: P(2250, -450),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [es(5)], at: P(2160, -250) },
        { id: 'b', kind: 'small', lines: [es(5)], at: P(2250, -450) },
        { id: 'k', kind: 'keystone', name: 'Hollow Vessel', lines: [], at: P(2340, -650) },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
  ],
  links: [
    { from: 'j2.a', to: 'wheel.v1', why: 'The venom junction to the wheel.' },
    {
      from: 'j2.a',
      to: 'knife.snares.jT.a',
      why: 'The venom junction to the trap junction: the trap barb leaves the blade here.',
    },
    {
      from: 'j2.a',
      to: 'knife.hex.jH.a',
      why: 'The venom junction to the curse junction: the curse barb leaves the blade here.',
    },
    { from: 'wheel.v2', to: 'jN.a', why: 'The dagger side up to the north junction.' },
    { from: 'jN.a', to: 'shadeLeech.a', why: 'Junction to the keystone spur.' },
    { from: 'jN.a', to: 'secondCurse.a', why: 'Junction onto the Second Curse chain.' },
    { from: 'wheel.v4', to: 'j5.a', why: 'Through the wheel to the point.' },
    { from: 'j5.a', to: 'cruelAgony.a', why: 'The point to the Cruel Agony spur.' },
    { from: 'j5.a', to: 'hollowVessel.a', why: 'The point to the Hollow Vessel spur.' },
  ],
};
