/**
 * The Alleys (the Knife's edge, nearest the start): the wheel where the blade road, the north road and the evasion
 * road meet, claws with recovery on its north side and daggers with crit on its south (each weapon's second cluster is
 * farther out, 2026-10-20); the dodge junction with the Nimble Gambit spur; the resist star whose spokes land on the
 * dodge spur, the dagger notable, the trap junction and the Bow's dear road; and Thick Blood, the Knife's life, as a
 * bridge from the wheel's claw side to the curse junction.
 */
import {
  clawDamage,
  critChance,
  daggerDamage,
  dex,
  dodgeAttack,
  dualCrit,
  es,
  evasion,
  int,
  life,
  lifeFlat,
  lifeOnHit,
  manaOnHit,
  resAll,
  resOne,
  weaponCrit,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const edge: AreaSpec = {
  id: 'knife.edge',
  region: 'shade',
  name: 'The Alleys',
  why: 'The Knife nearest the start: the dagger and claw wheel (crit on the dagger side, recovery on the claw side), the dodge junction with Nimble Gambit, the resist star, and Thick Blood.',
  at: [1858, -1025], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'wheel',
      name: 'Fine Point',
      why: 'The wheel of eight: entered from the blade road on the west, left to the venom junction on the east; claws on the north side (where the north road arrives), daggers on the south (where the dodge junction arrives); the ends are crit, which both want.',
      at: P(1050, 0),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'w1',
          kind: 'small',
          lines: [critChance(15)],
          at: P(950, 0),
          why: 'The west entrance, from the blade road.',
        },
        {
          id: 'w2',
          kind: 'small',
          lines: [clawDamage(10)],
          at: P(979, -71),
          why: 'The claw side; the north road arrives, the life pocket leaves.',
        },
        {
          id: 'w3',
          kind: 'notable',
          name: 'Talon',
          lines: [clawDamage(20), lifeOnHit(4, ['attack']), manaOnHit(4, ['attack'])],
          at: P(1050, -100),
          why: 'Claw damage with the recovery a claw is for: 2 + 1 + 1 units.',
        },
        {
          id: 'w4',
          kind: 'small',
          lines: [critChance(15)],
          at: P(1150, 0),
          why: 'The east exit, to the venom junction.',
        },
        {
          id: 'w5',
          kind: 'notable',
          name: 'Fine Point',
          lines: [daggerDamage(20), weaponCrit('dagger', 15), dualCrit(15)],
          at: P(1050, 100),
          why: "Dagger damage and dagger crit, and crit with a dagger in each hand: 2 + 1 + 1 units. The Knife's dual-wield line (the Yard's Lists hold the rest of it). The star's fire spoke lands here.",
        },
        {
          id: 'w6',
          kind: 'small',
          lines: [daggerDamage(10)],
          at: P(979, 71),
          why: 'The dagger side; the dodge junction arrives.',
        },
        { id: 'w7', kind: 'small', lines: [clawDamage(10)], at: P(1121, -71) },
        { id: 'w8', kind: 'small', lines: [daggerDamage(10)], at: P(1121, 71) },
      ],
      links: [
        ['w1', 'w2'],
        ['w2', 'w3'],
        ['w3', 'w7'],
        ['w7', 'w4'],
        ['w4', 'w8'],
        ['w8', 'w5'],
        ['w5', 'w6'],
        ['w6', 'w1'],
      ],
    },
    {
      id: 'j1',
      name: 'Dodge junction',
      why: "Where the south road meets the wheel's dagger side: the Nimble Gambit spur leaves here, and the star's cold spoke lands here.",
      at: P(820, 420),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: P(820, 420) }],
      links: [],
    },
    {
      id: 'nimble',
      name: 'Nimble Gambit',
      why: "Two nodes of dodge, then the trade: 30% chance to dodge attacks, half the armour, less shield and block. The Knife's first keystone, eight steps out on the evasion side, for the Shade who would rather not be hit at all.",
      at: P(1100, 690),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [dodgeAttack(3)],
          at: P(1119, 719),
          why: 'The foot of the spur.',
        },
        { id: 'b', kind: 'small', lines: [dodgeAttack(3)], at: P(1160, 760) },
        { id: 'k', kind: 'keystone', name: 'Nimble Gambit', lines: [], at: P(1220, 820) },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
    {
      id: 'star',
      name: 'Snakeskin',
      why: "The resist star: all resistances and a little evasion in the notable, one single-node spoke per element, each landing somewhere else: cold west on the dodge spur, fire north on the dagger notable, lightning east on the trap junction, chaos south on the Bow's dear road. Buying resistances is also travelling between the edge, the dodge and the barb.",
      at: P(1250, 460),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n',
          kind: 'notable',
          name: 'Snakeskin',
          lines: [resAll(10), evasion(10)],
          at: P(1250, 460),
          why: '2.5 + 1 units.',
        },
        {
          id: 'w',
          kind: 'small',
          lines: [resOne('cold', 10)],
          at: P(1181, 453),
          why: 'The cold spoke, to the dodge spur.',
        },
        {
          id: 'f',
          kind: 'small',
          lines: [resOne('fire', 10)],
          at: P(1216, 399),
          why: 'The fire spoke, to Fine Point.',
        },
        {
          id: 'e',
          kind: 'small',
          lines: [resOne('lightning', 10)],
          at: P(1319, 451),
          why: 'The lightning spoke, to the trap junction.',
        },
        {
          id: 's',
          kind: 'small',
          lines: [resOne('chaos', 10)],
          at: P(1300, 510),
          why: "The chaos spoke, to the Bow's dear road.",
        },
      ],
      links: [
        ['n', 'w'],
        ['n', 'f'],
        ['n', 'e'],
        ['n', 's'],
      ],
    },
    {
      id: 'thickBlood',
      name: 'Thick Blood',
      why: "Life, then the notable with life, flat life and a little shield: the Knife's life, which an evasion-and-shield class still needs by map 20. A chain from the wheel's claw side to the curse junction, so the claw side and the curse barb are joined without the venom junction.",
      at: P(1090, -420),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [life(5)],
          at: P(979, -401),
          why: 'The entrance, from the claw side.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Thick Blood',
          lines: [life(10), lifeFlat(20), es(5)],
          at: P(979, -471),
          why: '2 + 1 + 1 units. The exit, to the curse junction.',
        },
      ],
      links: [['a', 'n']],
    },
  ],
  links: [
    {
      from: 'star.w',
      to: 'j1.a',
      why: "The star's cold spoke onto the dodge junction, so the Nimble Gambit spur is a spur and not the way to the star.",
    },
    { from: 'j1.a', to: 'wheel.w6', why: "The dodge junction to the wheel's dagger side." },
    { from: 'j1.a', to: 'nimble.a', why: 'Junction to the keystone spur.' },
    { from: 'star.f', to: 'wheel.w5', why: 'The fire spoke lands on Fine Point.' },
    {
      from: 'star.e',
      to: 'knife.snares.jT.a',
      why: 'The lightning spoke lands on the trap junction.',
    },
    {
      from: 'star.s',
      to: 'knife.snares.toBow.c',
      why: "The chaos spoke lands on the Bow's dear road: a poison bow walks in through the resistances.",
    },
    { from: 'wheel.w4', to: 'knife.venom.j2.a', why: 'Through the wheel to the venom junction.' },
    { from: 'wheel.w2', to: 'thickBlood.a', why: 'The claw side onto the life chain.' },
    {
      from: 'thickBlood.n',
      to: 'knife.hex.jH.a',
      why: 'The life chain lands on the curse junction.',
    },
  ],
};
