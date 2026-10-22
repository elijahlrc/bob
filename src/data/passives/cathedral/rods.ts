/**
 * The Vestry (past the nave, toward the Wall): the sceptre and staff wheel (one weapon a side), the junction, the dear
 * road from the Wall's Scar Tissue to the tower, and Idle Hands off the dear road's middle node.
 */
import {
  areaDamage,
  blockAttack,
  eleDamageAll,
  int,
  staffDamage,
  str,
  totemDamage,
  weaponCrit,
  weaponDamage,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const rods: AreaSpec = {
  id: 'cathedral.rods',
  region: 'zealot',
  name: 'The Vestry',
  why: 'Past the nave toward the Wall: the sceptre and staff wheel, the dear road from the Wall, and Idle Hands.',
  at: [-2517, -835], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'wheel',
      name: 'Gilded Rod',
      why: "The wheel of eight: entered from the nave junction on the west, left to the rods junction on the east. Sceptres on the north side, staves on the south (where the star's lightning spoke arrives), elemental damage with attacks at the ends, which both want.",
      at: P(1700, -150),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'r1',
          kind: 'small',
          lines: [eleDamageAll(10)],
          at: P(1600, -150),
          why: 'The west entrance.',
        },
        {
          id: 'r2',
          kind: 'small',
          lines: [weaponDamage('sceptre', 10)],
          at: P(1629, -221),
          why: 'The sceptre side.',
        },
        {
          id: 'r3',
          kind: 'notable',
          name: 'Gilded Rod',
          lines: [weaponDamage('sceptre', 20), weaponCrit('sceptre', 15), eleDamageAll(10)],
          at: P(1700, -250),
          why: 'Sceptre damage, sceptre crit, and elemental damage for the spells a sceptre also casts: 2 + 1 + 1 units.',
        },
        {
          id: 'r4',
          kind: 'small',
          lines: [eleDamageAll(10)],
          at: P(1800, -150),
          why: 'The east exit, to the rods junction.',
        },
        {
          id: 'r5',
          kind: 'notable',
          name: 'Quarterstaff',
          lines: [staffDamage(24), blockAttack(3), areaDamage(10)],
          at: P(1700, -50),
          why: 'Staff damage, the block a staff gives, and area for the sweeps: 2 + 1.5 + 1 units.',
        },
        {
          id: 'r6',
          kind: 'small',
          lines: [staffDamage(12)],
          at: P(1629, -79),
          why: "The staff side; the star's lightning spoke arrives.",
        },
        { id: 'r7', kind: 'small', lines: [weaponDamage('sceptre', 10)], at: P(1771, -221) },
        { id: 'r8', kind: 'small', lines: [staffDamage(12)], at: P(1771, -79) },
      ],
      links: [
        ['r1', 'r2'],
        ['r2', 'r3'],
        ['r3', 'r7'],
        ['r7', 'r4'],
        ['r4', 'r8'],
        ['r8', 'r5'],
        ['r5', 'r6'],
        ['r6', 'r1'],
      ],
    },
    {
      id: 'jR',
      name: 'Rods junction',
      why: 'East of the wheel: the bell tower ahead.',
      at: P(1990, -150),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(6), int(6)], at: P(1990, -150) }],
      links: [],
    },
    {
      id: 'toWall',
      name: 'To the Wall',
      why: "The dear crossing from the Wall's battlements to the bell tower: three attribute nodes from the Wall's Scar Tissue to the fire wheel's entrance, deliberately long, for the fire two-hander and the Vanguard who casts fire. Idle Hands hangs off the middle node, on the crossing.",
      at: P(1760, -850),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(1441, -932),
          why: "Where the Wall's Scar Tissue lands.",
        },
        {
          id: 'b',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(1760, -900),
          why: 'The Idle Hands spur leaves here.',
        },
        {
          id: 'c',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(1990, -820),
          why: "Onto the tower's wheel.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'idleHands',
      name: 'Idle Hands',
      why: 'Two nodes of totem damage, then the trade: your own skills deal no damage, but totems, traps, mines, brands and minions still do, and one more totem. On the Wall crossing (brief §6), for the totem Vanguard and the summoner Zealot alike.',
      at: P(1690, -1260),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [totemDamage(12)], at: P(1708, -1328) },
        { id: 'b', kind: 'small', lines: [totemDamage(12)], at: P(1701, -1386) },
        { id: 'k', kind: 'keystone', name: 'Idle Hands', lines: [], at: P(1690, -1470) },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
  ],
  links: [
    { from: 'wheel.r4', to: 'jR.a', why: 'Through the wheel to the rods junction.' },
    {
      from: 'jR.a',
      to: 'cathedral.pyre.wheel.f1',
      why: "The vestry junction to the tower's wheel.",
    },
    {
      from: 'wall.resists.scarTissue.n',
      to: 'toWall.a',
      why: "The Wall's Scar Tissue (grit) onto the dear road.",
    },
    {
      from: 'toWall.c',
      to: 'cathedral.pyre.wheel.f1',
      why: "The dear road lands on the tower wheel's entrance.",
    },
    {
      from: 'toWall.b',
      to: 'idleHands.a',
      why: "The dear road's middle node to the keystone spur.",
    },
  ],
};
