/**
 * The Choir (off the transept, toward the Spire): the wheel (auras on its north side, minions on its south since
 * 2026-10-20, mana at the ends), the near crossing to the Spire's flasks, the choir junction, Lone Vow and Living Ward.
 */
import {
  auraEffect,
  int,
  lifeRegen,
  mana,
  minionDamage,
  minionLife,
  minionSpeed,
  reducedReservation,
  str,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const choir: AreaSpec = {
  id: 'cathedral.choir',
  region: 'zealot',
  name: 'The Choir',
  why: 'Off the transept toward the Spire: auras or minions on one wheel, Lone Vow and Living Ward.',
  at: [-1592, -1670], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'wheel',
      name: 'Choirmaster',
      why: 'The wheel of eight off the transept: auras on the north side (Choirmaster), minions on the south (Shepherd, minions that last), mana at the ends. The other aura is at the tower; the other minion cluster is across the Spire border (Familiars).',
      at: P(1150, 600),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'c1',
          kind: 'small',
          lines: [mana(8)],
          at: P(1050, 600),
          why: 'The west entrance, from the transept.',
        },
        {
          id: 'c2',
          kind: 'small',
          lines: [reducedReservation(3)],
          at: P(1079, 529),
          why: 'The reservation side; the Vigil chain arrives.',
        },
        {
          id: 'c3',
          kind: 'notable',
          name: 'Choirmaster',
          lines: [reducedReservation(5), auraEffect(10), mana(8)],
          at: P(1150, 500),
          why: "Less reserved, more effect, more mana: 1.7 + 1.7 + 1 units. The star's chaos spoke lands here.",
        },
        {
          id: 'c4',
          kind: 'small',
          lines: [mana(8)],
          at: P(1250, 600),
          why: 'The east exit, to the choir junction.',
        },
        {
          id: 'c5',
          kind: 'notable',
          name: 'Shepherd',
          lines: [minionLife(24), minionDamage(12), minionSpeed(5)],
          at: P(1150, 700),
          why: "Minions that last: 2 + 1 + 1 units. The near crossing to the Spire's flasks leaves here.",
        },
        {
          id: 'c6',
          kind: 'small',
          lines: [minionLife(12)],
          at: P(1079, 671),
          why: 'The minion side.',
        },
        { id: 'c7', kind: 'small', lines: [reducedReservation(3)], at: P(1221, 529) },
        { id: 'c8', kind: 'small', lines: [minionLife(12)], at: P(1221, 671) },
      ],
      links: [
        ['c1', 'c2'],
        ['c2', 'c3'],
        ['c3', 'c7'],
        ['c7', 'c4'],
        ['c4', 'c8'],
        ['c8', 'c5'],
        ['c5', 'c6'],
        ['c6', 'c1'],
      ],
    },
    {
      id: 'jC',
      name: 'Choir junction',
      why: 'East of the wheel: the minions ahead, the Lone Vow spur out along the tower, the Living Ward spur toward the Spire.',
      at: P(1480, 850),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(6), int(6)], at: P(1480, 850) }],
      links: [],
    },
    {
      id: 'loneVow',
      name: 'Lone Vow',
      why: 'Two nodes of aura effect, then the trade: only the first aura is active, and it reserves nothing. The one-aura build with every point of mana free; the approach says what the keystone asks.',
      at: P(1760, 600),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [auraEffect(6)], at: P(1789, 591) },
        { id: 'b', kind: 'small', lines: [auraEffect(6)], at: P(1834, 554) },
        { id: 'k', kind: 'keystone', name: 'Lone Vow', lines: [], at: P(1900, 500) },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
    {
      id: 'livingWard',
      name: 'Living Ward',
      why: 'Two nodes of life regeneration, then the trade: regeneration fills energy shield instead, and life is one. On the Spire side of the tower, a few steps from Mind Bulwark across the border: the two shield keystones face each other.',
      at: P(1430, 1270),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [lifeRegen(0.4)], at: P(1426, 1338) },
        { id: 'b', kind: 'small', lines: [lifeRegen(0.4)], at: P(1419, 1396) },
        { id: 'k', kind: 'keystone', name: 'Living Ward', lines: [], at: P(1410, 1480) },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
    {
      id: 'toSpire',
      name: 'A road node',
      why: "A road node on the near crossing from Shepherd to the Spire's Draught: two notables were joined directly across the border.",
      at: P(1104, 898),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(6), int(6)], at: P(1104, 898) }],
      links: [],
    },
  ],
  links: [
    { from: 'wheel.c4', to: 'jC.a', why: 'Through the wheel to the choir junction.' },
    {
      from: 'cathedral.choir.wheel.c5',
      to: 'cathedral.choir.toSpire.a',
      why: "A road node on the near crossing from Shepherd to the Spire's Draught: two notables were joined directly across the border.",
    },
    { from: 'jC.a', to: 'loneVow.a', why: 'Junction to the Lone Vow spur.' },
    { from: 'jC.a', to: 'livingWard.a', why: 'Junction to the Living Ward spur.' },
    {
      from: 'jC.a',
      to: 'cathedral.crypt.wheel.m1',
      why: "The choir junction to the minion wheel: the tower's spine.",
    },
  ],
};
