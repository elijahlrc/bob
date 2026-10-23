/**
 * Speed and bleed: the south-east of the arc, between the projectiles hub and the physical end, the mirror of the road
 * from the bows. Three junctions turn the arc down from the projectiles hub to the bleed hub and on to the physical
 * row; off the hub, the bleed wheel, with Split Volley on its north arm and Deep Cuts on its south (round 4: the
 * north arm was Barbed Arrows, which went to the landmark wheel); off the first junction, the attack-speed pocket. This is where the bleed Strider (the gouging bow
 * skill, the physical bows) and the thrown-steel Strider spend their middle points, and the road that lets a bow
 * Strider reach the physical end without going home.
 */
import {
  bleedChance,
  bleedDamage,
  bleedFaster,
  bowDamage,
  critChance,
  critMulti,
  damageVsLowLife,
  dex,
  extraProjectile,
  flaskDuration,
  flaskEffect,
  moveSpeed,
  physAttack,
  pierce,
  projectileDamage,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const quiver: AreaSpec = {
  id: 'bow.quiver',
  region: 'strider',
  name: 'The Thicket',
  why: 'Attack speed and bleeding on attacks, on the road between the projectiles and the physical end.',
  at: [2130, 1800], // Where the area's name is drawn: clear of every other area's name (label pass, round 4); G3 round 2 nudged it off Arrow Weave.
  clusters: [
    {
      id: 'road',
      name: 'The bleed road',
      why: 'Three junctions from the projectiles hub round to the physical row, the hub between the second and third.',
      at: P(1747, 262),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'jq3',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(1747, 262),
          why: 'Off the projectiles hub; the attack-speed pocket leaves here, east.',
        },
      ],
      links: [],
    },
    {
      id: 'hub',
      name: 'The bleed hub',
      why: 'The corner of the road, where the wheel hangs.',
      at: P(1543, 645),
      shape: { kind: 'hand' },
      nodes: [{ id: 'q', kind: 'attribute', lines: [dex(7)], at: P(1543, 645) }],
      links: [],
    },
    {
      id: 'wheel',
      name: 'Split Volley and Deep Cuts',
      why: "Off the hub: the north arm is projectile damage up to Split Volley, the extra projectile, near Ricochet's chain and far from Skewer's pierce, so the three projectile lines are three places; the south arm is bleed damage up to Deep Cuts. Round 4 (2026-10-20): the north arm was Barbed Arrows, which traded places with Split Volley; bleed chance now leads to Barbed Arrows on the landmark wheel, bleed damage to Deep Cuts here.",
      at: P(1768, 272),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'e',
          kind: 'small',
          lines: [bleedChance(5), bleedDamage(6)],
          at: P(1605, 713),
          why: 'The entrance, facing the hub: a little of both sides.',
        },
        { id: 'a1', kind: 'small', lines: [projectileDamage(10)], at: P(2059, -568) },
        { id: 'a2', kind: 'small', lines: [projectileDamage(10)], at: P(2111, -591) },
        {
          id: 'n1',
          kind: 'notable',
          name: 'Split Volley',
          lines: [extraProjectile(1)],
          at: P(2175, -621),
          why: 'An extra projectile: 4 units by the table, and the line a thrown or bow build reshapes itself around.',
        },
        {
          id: 'n2',
          kind: 'notable',
          name: 'Deep Cuts',
          lines: [bleedDamage(30), physAttack(12), bleedFaster(10)],
          at: P(1656, 861),
          why: '2.5 + 1.2 + 1 units.',
        },
        { id: 'c2', kind: 'small', lines: [bleedDamage(12)], at: P(1598, 834) },
        { id: 'c1', kind: 'small', lines: [bleedDamage(12)], at: P(1576, 772) },
      ],
      links: [
        ['e', 'c1'],
        ['a1', 'a2'],
        ['a2', 'n1'],
        ['n2', 'c2'],
        ['c2', 'c1'],
      ],
    },
    {
      id: 'rapid',
      name: 'Rapid Fire',
      why: "Bow damage twice, then the notable with bow damage, projectile damage and movement speed: the bow that shoots on the move, a tight orbit off the first junction. The bow wheel sells speed and crit; the Yard's bow sells physical damage, the Knife's crit multiplier. (Until 2026-10-20 its notable carried a stray sword line.)",
      at: P(1929, 399),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [bowDamage(10)],
          at: P(1920, 395),
          why: 'The entrance, facing the junction.',
        },
        { id: 'b', kind: 'small', lines: [bowDamage(10)], at: P(1965, 430) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Rapid Fire',
          lines: [bowDamage(16), projectileDamage(10), moveSpeed(4)],
          at: P(2021, 473),
          why: '1.6 + 1 + 1 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'skewer',
      name: 'Skewer',
      why: 'Projectile damage twice, then the notable with an extra pierce and projectile damage: pierce is the projectile line no small sells and the one a thrown or bow build reshapes itself around. Passed through to the flask pocket, so the rim is a road; since G2 (2026-10-22) both its doors are road nodes of the middle and south spokes. Split Volley was beside it until round 4.',
      at: P(2400, 190),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [projectileDamage(10)],
          at: P(2337, 208),
          why: 'The entrance, from the middle spoke and the landmark wheel.',
        },
        { id: 'b', kind: 'small', lines: [projectileDamage(10)], at: P(2365, 259) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Skewer',
          lines: [pierce(1), projectileDamage(10)],
          at: P(2400, 320),
          why: '3 + 1 units. The exit, to the south spoke and the flask pocket.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'quickSip',
      name: 'Quick Sip',
      why: "Flask effect twice, then the notable with flask effect, flask duration and movement speed: the Strider sold no flask lines. A tight orbit on the south-east rim between Skewer, Rapid Fire and Killing Eye: three doors, the rim's crossroads.",
      at: P(2250, 560),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [flaskEffect(5)],
          at: P(2265, 550),
          why: 'The entrance, from the south spoke and Skewer.',
        },
        { id: 'b', kind: 'small', lines: [flaskEffect(5)], at: P(2235, 600) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Quick Sip',
          lines: [flaskEffect(10), flaskDuration(10), moveSpeed(4)],
          at: P(2200, 660),
          why: '2 + 1 + 1 units. The exit, to Killing Eye.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'added',
      name: 'Added in the editor',
      why: 'Nodes added by the user in the tree editor (2026-10-19); names and reasons provisional.',
      at: P(1781, 687),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n439',
          kind: 'small',
          lines: [critChance(15)],
          at: P(1725, 720),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n440',
          kind: 'notable',
          name: 'Killing Eye',
          lines: [critMulti(24), damageVsLowLife(16)],
          at: P(1747, 781),
          why: "2 + 2 units. Added in the editor (2026-10-19) as a second Vital Aim; round 4 (approved 2026-10-20) gave it the finishing blow instead of crit chance, so it is not Vital Aim's pairing.",
        },
        {
          id: 'n441',
          kind: 'small',
          lines: [critChance(15)],
          at: P(1666, 692),
          why: 'Added in the editor (2026-10-19).',
        },
      ],
      links: [
        ['n439', 'n440'],
        ['n439', 'n441'],
      ],
    },
  ],
  links: [
    { from: 'road.jq3', to: 'rapid.a', why: 'The attack-speed pocket.' },
    {
      from: 'quickSip.n',
      to: 'added.n440',
      why: "The flask pocket lands on Killing Eye: the rim road from the landmark wheel reaches the bleed wheel's side.",
    },
    { from: 'road.jq3', to: 'hub.q', why: 'Added in the editor (2026-10-19).' },
    { from: 'hub.q', to: 'wheel.e', why: 'The wheel hangs off the hub.' },
    { from: 'hub.q', to: 'bow.steel.road.jt3', why: 'Added in the editor (2026-10-19).' },
    { from: 'wheel.e', to: 'added.n441', why: 'Added in the editor (2026-10-19).' },
    { from: 'wheel.a1', to: 'bow.steel.wheel.e', why: 'Added in the editor (2026-10-19).' },
  ],
};
