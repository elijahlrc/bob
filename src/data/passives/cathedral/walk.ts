/**
 * The Lychway (the north walk over the Undercroft): the rim road of six attribute nodes from Kindled Steel round the back
 * of the Undercroft to Tomb Dust and on to the Mystic's north-west rim road, the casters' far loop, with what hangs off it.
 * Laid in G2 (2026-10-22) as a cluster of the Undercroft; its own place since G3 round 2 (2026-10-22), when the road and
 * Rood Screen moved here from `crypt.ts` (their ids changed from `cathedral.crypt.north.*` and `cathedral.crypt.rood.*`).
 * G3 round 3 (2026-10-22): spell damage with duration (Vespers) hangs off the fourth node, and channelling (Plainsong)
 * bridges Shattering Rite to the east end.
 */
import {
  channelDamage,
  eleDamageAll,
  es,
  int,
  skillDuration,
  spellBlock,
  spellDamage,
  str,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const lychway: AreaSpec = {
  id: 'cathedral.walk',
  region: 'zealot',
  name: 'The Lychway',
  why: "The north walk over the Undercroft: the casters' far loop between the Zealot's north rim and the Mystic's, and the clusters off it (Rood Screen, Vespers, Plainsong).",
  at: [-2700, -3650], // Where the area's name is drawn: over the walk's middle, clear of Rood Screen, Sigil Warden and every other area's name.
  clusters: [
    {
      id: 'road',
      name: 'The north walk',
      why: "G2 (2026-10-22, G1/zealot.md §3 and G1-brief.md §2.2): a rim road of six attribute nodes from Kindled Steel round the back of the Undercroft to Tomb Dust, the casters' far loop. Kindled Steel's chain runs straight out to the corner; then the walk follows the rim, outside Sigil Warden and Volatile Servants, to its east end, where Tomb Dust arrives and the far loop to the Mystic's north-west rim road leaves (the border pass). Kindled Steel and Tomb Dust become bridges. Rood Screen (G3 round 1) hangs inward between the second and third nodes (an arc since G4 fix 1), Vespers (round 3) off the fourth, and Plainsong (round 3) bridges Shattering Rite to the east end.",
      at: P(3057, 1916),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n1',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3510, 728),
          why: "The corner where Kindled Steel's line meets the rim.",
        },
        {
          id: 'n2',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3396, 1140),
          why: "Outside the Sigil Warden keystone; Rood Screen's arc lands here (G4 fix 1).",
        },
        {
          id: 'n3',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3244, 1537),
          why: 'Where Rood Screen (energy shield with spell block) leaves inward, as an arc back to the second node.',
        },
        {
          id: 'n4',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3057, 1916),
          why: 'Where Vespers (spell damage with duration, G3 round 3) hangs inward.',
        },
        {
          id: 'n5',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(2836, 2274),
          why: 'Outside the Volatile Servants keystone, toward the east end.',
        },
        {
          id: 'n6',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(2584, 2607),
          why: "The east end: Tomb Dust arrives, Plainsong bridges in from Shattering Rite (G3 round 3), and the far loop runs on in the same line to the Mystic's north-west rim road.",
        },
      ],
      links: [
        ['n1', 'n2'],
        ['n2', 'n3'],
        ['n3', 'n4'],
        ['n4', 'n5'],
        ['n5', 'n6'],
      ],
    },
    {
      id: 'rood',
      name: 'Rood Screen',
      why: "G3 round 1 (2026-10-22; ledger ZE-11): energy shield three times inward of the north walk between its second and third nodes, then the notable with energy shield and spell block. The block caster's shield without a shield (Glass Wall needs one), and the energy shield a Zealot or Mystic caster finds far out on the casters' loop, in a different direction from the Cloister's. G4 fix 1 (2026-10-22, audit N3): it was a dead end off the third node and the run `n1`–`n2` had nothing off it; now it is an arc between `n3` and `n2`, a tent bowed inward (clear of the Sigil Warden keystone below it), two smalls on `n3`'s side and one on `n2`'s, so it is a bridge and `n2` has a branch. Vespers stays the walk's far tip.",
      at: P(3170, 1281),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [es(5)],
          at: P(3205, 1401),
          why: "The entrance from the walk's third node, on the line to the notable.",
        },
        { id: 'b', kind: 'small', lines: [es(5)], at: P(3190, 1348) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Rood Screen',
          lines: [es(10), spellBlock(4)],
          at: P(3170, 1281),
          why: 'Energy shield and spell block: 2 + 2 units.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [es(5)],
          at: P(3230, 1244),
          why: "The far node, on the line to the walk's second node.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
      ],
    },
    {
      id: 'vespers',
      name: 'Vespers',
      why: "G3 round 3 (2026-10-22; ledger ZE-9): a pocket inward off the north walk's fourth node, on the bisector of the walk, into the empty ground between Rood Screen and Volatile Servants: spell damage three times, then the notable with spell damage and skill duration. The Zealot's far spell cluster, for the spells, brands and totems that last; its other spell homes face other ways with other partners (Lectern with reservation on the aisle, Homily with the elements and cast speed in the Undercroft, Crozier with a staff on the Ambulatory). A caster who comes this far gives up the Mystic's east for it. Rood Screen's energy shield is one road node back: spell damage and energy shield near each other, which the convergence rule allows only far out, as a destination (25 steps from the Zealot start). A dead-end tip: the walk has three ways in.",
      at: P(2812, 1781),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [spellDamage(8)],
          at: P(2970, 1867),
          why: 'The entrance from the walk.',
        },
        { id: 'b', kind: 'small', lines: [spellDamage(8)], at: P(2921, 1841) },
        { id: 'c', kind: 'small', lines: [spellDamage(8)], at: P(2873, 1815) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Vespers',
          lines: [spellDamage(16), skillDuration(20)],
          at: P(2812, 1781),
          why: 'Spell damage and skill duration: 2 + 2 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'n'],
      ],
    },
    {
      id: 'plainsong',
      name: 'Plainsong',
      why: "G3 round 3 (2026-10-22; ledger ZE-3): a bridge from Shattering Rite to the north walk's east end, channelling twice in the line of Shattering Rite's chain, the notable with channelling and the elements, channelling once more onto the walk. Channelling's third home and the one between the other two (Steady Stream with cheaper mana in the Mystic's far north, Ceaseless Blades with attacks in the Yard's Fosse), on the Mystic border where the far loop crosses. Channelled spells are mostly elemental. Shattering Rite stops being a dead end. The chain runs straight on from Shattering Rite and turns at the notable, so it reaches the walk's east end between the far loop and Tomb Dust at an even fan, not a few degrees off Tomb Dust's link.",
      at: P(2292, 2580),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [channelDamage(10)],
          at: P(2218, 2479),
          why: 'The entrance from Shattering Rite, in the line of its chain.',
        },
        { id: 'b', kind: 'small', lines: [channelDamage(10)], at: P(2250, 2523) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Plainsong',
          lines: [channelDamage(20), eleDamageAll(20)],
          at: P(2292, 2580),
          why: 'Channelling and elemental damage: 2 + 2 units.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [channelDamage(10)],
          at: P(2362, 2587),
          why: "The far node, onto the walk's east end.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
      ],
    },
  ],
  links: [
    {
      from: 'cathedral.ambulatory.kindled.n',
      to: 'road.n1',
      why: "Kindled Steel's chain carried straight on to the rim: the fire-strike pocket becomes a bridge onto the north walk.",
    },
    {
      from: 'cathedral.crypt.tomb.n',
      to: 'road.n6',
      why: "Tomb Dust's chain carried on to the north walk's east end: the chaos pocket becomes a bridge, and the walk's second way in.",
    },
    { from: 'road.n3', to: 'rood.a', why: "The north walk's third node onto Rood Screen." },
    {
      from: 'rood.c',
      to: 'road.n2',
      why: "Rood Screen's far small onto the walk's second node (G4 fix 1, audit N3): the pocket is an arc between the two nodes, a bridge.",
    },
    {
      from: 'road.n4',
      to: 'vespers.a',
      why: "The north walk's fourth node onto the far spell cluster (G3 round 3).",
    },
    {
      from: 'cathedral.crypt.rite.n',
      to: 'plainsong.a',
      why: 'Shattering Rite onto channelling (G3 round 3), straight on from its chain: the physical-spell pocket becomes a bridge.',
    },
    {
      from: 'plainsong.c',
      to: 'road.n6',
      why: "Channelling lands on the north walk's east end, between the far loop and Tomb Dust's link.",
    },
    {
      from: 'road.n6',
      to: 'spire.fire.rim.c',
      why: "The far loop (a dear crossing; G1-brief.md §2.2, laid in the G2 border pass): the north walk runs on in its own line (a turn of about 10°) to the corner of the Mystic's north-west rim road, so the two rim roads read as one road over the top of the map. The casters' far loop: Tomb Dust, Shattering Rite and the Zealot's far casters with Cinder, Steady Stream and the Mystic's far shield. 19 steps from the Zealot start and 23 from the Mystic's, so it is a late build's road.",
    },
  ],
};
