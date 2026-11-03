/**
 * The High Moor: The axis at the mid ring: projectiles and bleeding arrows.
 * Written for the attrition rework from docs/tree/design/R-bow.md (2026-10-31).
 */
import {
  bleedChance,
  bleedDamage,
  bleedFaster,
  dex,
  projectileDamage,
  projectileSpeed,
} from '../lines';
import type { AreaSpec } from '../types';

export const flight: AreaSpec = {
  id: 'bow.flight',
  region: 'strider',
  name: 'The High Moor',
  why: 'The axis at the mid ring: projectiles and bleeding arrows.',
  at: [2696, 1315],
  clusters: [
    {
      id: 'ring',
      name: 'The mid ring, centre',
      why: "The mid ring's stretch across the axis between the two spokes.",
      at: [2610, 1131],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [dex(7)], at: [2610, 1131] },
        { id: 'b', kind: 'attribute', lines: [dex(7)], at: [2447, 1413] },
        { id: 'c', kind: 'attribute', lines: [dex(7)], at: [2284, 1696] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'wheel',
      name: 'Far Flight and Barbed Arrows',
      why: 'Projectiles or bleeding arrows, the two sides of one wheel, out from the mid ring.',
      at: [2949, 1162],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'e', kind: 'small', lines: [projectileDamage(10)], at: [2889, 1157] },
        { id: 'a', kind: 'small', lines: [projectileDamage(10)], at: [2933, 1095] },
        {
          id: 'n1',
          kind: 'notable',
          name: 'Far Flight',
          lines: [projectileDamage(20), projectileSpeed(20), dex(15)],
          at: [3007, 1102],
          why: "2 + 2 + 1 units. G3 round 1 (2026-10-22): dexterity 20 → 15, so the notable is 5 units, not 5.3 (CONSTRAINTS §8.6; the brief's ST-p2).",
        },
        {
          id: 'n2',
          kind: 'notable',
          name: 'Barbed Arrows',
          lines: [bleedChance(20), bleedDamage(24), bleedFaster(10)],
          at: [2996, 1232],
          why: '2 + 2 + 1 units.',
        },
        { id: 'b', kind: 'small', lines: [bleedChance(10)], at: [2921, 1225] },
      ],
      links: [
        ['e', 'a'],
        ['e', 'b'],
        ['a', 'n1'],
        ['n2', 'b'],
      ],
    },
    {
      id: 'closeQuarters',
      name: "Arm's Length",
      why: 'The close-range keystone, a spur out from the mid ring at the axis, far from the long shot.',
      at: [2816, 1561],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [projectileDamage(10)], at: [2777, 1545] },
        { id: 'k', kind: 'keystone', name: "Arm's Length", lines: [], at: [2855, 1577] },
      ],
      links: [['a', 'k']],
    },
  ],
  links: [
    {
      from: 'bow.flight.ring.c',
      to: 'bow.steel.spS.m',
      why: 'The mid ring meets the south spoke.',
    },
    { from: 'bow.flight.wheel.e', to: 'bow.flight.ring.a', why: 'The way in.' },
    { from: 'bow.flight.closeQuarters.a', to: 'bow.flight.ring.b', why: 'The way in.' },
  ],
};
