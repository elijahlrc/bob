/**
 * The generic clusters inside the ring (C-brief §2, the user's decision 2): the things every class may want and no
 * region sells well, hung off the ring's inner side at the four class angles no hub uses (top, east, bottom, west).
 * Each is an arch of three nodes: the ring node at its angle touches the notable, and the two smalls land on the ring
 * nodes to either side, so the arch is a small loop with the ring and never a shortcut across it. None is stronger
 * than a region's cluster; there are no keystones here.
 */
import {
  allAttr,
  cooldownRecovery,
  flaskEffect,
  flaskRecovery,
  life,
  manaRegen,
  moveSpeed,
  resAll,
} from '../lines';
import type { AreaSpec } from '../types';

export const clusters: AreaSpec = {
  id: 'centre.inner',
  region: 'centre',
  name: 'The inner ring',
  why: 'Four small arches on the inside of the ring: resistances at the top, movement east, all attributes at the bottom, flasks west. A build that crosses the ring for a neighbour passes one of them; a build that wants only the stat pays two or three points on the ring it was walking anyway.',
  at: [0, -240], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'shelter',
      name: 'Shelter',
      why: 'Resistances, at the top under the Mystic: the stat every build needs by map 20. Two small resistance nodes and a notable with resistances and a little life.',
      at: [0, -560],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [resAll(4)],
          at: [-80, -600],
          why: 'The west foot, on the ring toward the Zealot.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Shelter',
          lines: [resAll(8), life(5)],
          at: [0, -480],
          why: "2 + 1 units; one step inside the ring's top node.",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [resAll(4)],
          at: [80, -600],
          why: 'The east foot, on the ring toward the Shade.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'quickMarch',
      name: 'Quick March',
      why: 'Movement, on the east under the Shade and the Strider: pace between packs for anyone. Two movement nodes and a notable with movement and cooldown recovery.',
      at: [560, 0],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [moveSpeed(4)],
          at: [600, -80],
          why: 'The north foot, on the ring toward the Shade.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Quick March',
          lines: [moveSpeed(8), cooldownRecovery(10)],
          at: [480, 0],
          why: '2 + 1 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [moveSpeed(4)],
          at: [600, 80],
          why: 'The south foot, on the ring toward the Strider.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'wellRounded',
      name: 'Well Rounded',
      why: 'All attributes, at the bottom under the Reaver: the cheap partial answer to a gear requirement for anyone (brief §7). Two all-attribute nodes and a notable with all attributes and a little life.',
      at: [0, 560],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [allAttr(4)],
          at: [80, 600],
          why: 'The east foot, on the ring toward the Strider.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Well Rounded',
          lines: [allAttr(8), life(5)],
          at: [0, 480],
          why: '2 + 1 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [allAttr(4)],
          at: [-80, 600],
          why: 'The west foot, on the ring toward the Vanguard.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'provisions',
      name: 'Provisions',
      why: 'Flasks and mana, on the west under the Vanguard and the Zealot: the early game is flasks, and every class casts something. Two flask recovery nodes and a notable with flask effect, recovery and mana regeneration.',
      at: [-560, 0],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [flaskRecovery(10)],
          at: [-600, 80],
          why: 'The south foot, on the ring toward the Vanguard.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Provisions',
          lines: [flaskEffect(8), flaskRecovery(10), manaRegen(10)],
          at: [-480, 0],
          why: '1.6 + 1 + 1 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [flaskRecovery(10)],
          at: [-600, -80],
          why: 'The north foot, on the ring toward the Zealot.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
  ],
  links: [
    {
      from: 'centre.ring.road.r0',
      to: 'shelter.n',
      why: "The ring's top node touches the resistances notable.",
    },
    {
      from: 'centre.ring.road.r23',
      to: 'shelter.a',
      why: 'The west foot of the resistances arch.',
    },
    { from: 'shelter.b', to: 'centre.ring.road.r1', why: 'The east foot of the resistances arch.' },
    {
      from: 'centre.ring.road.r6',
      to: 'quickMarch.n',
      why: "The ring's east node touches the movement notable.",
    },
    {
      from: 'centre.ring.road.r5',
      to: 'quickMarch.a',
      why: 'The north foot of the movement arch.',
    },
    {
      from: 'quickMarch.b',
      to: 'centre.ring.road.r7',
      why: 'The south foot of the movement arch.',
    },
    {
      from: 'centre.ring.road.r12',
      to: 'wellRounded.n',
      why: "The ring's bottom node touches the attributes notable.",
    },
    {
      from: 'centre.ring.road.r11',
      to: 'wellRounded.a',
      why: 'The east foot of the attributes arch.',
    },
    {
      from: 'wellRounded.b',
      to: 'centre.ring.road.r13',
      why: 'The west foot of the attributes arch.',
    },
    {
      from: 'centre.ring.road.r18',
      to: 'provisions.n',
      why: "The ring's west node touches the flask notable.",
    },
    { from: 'centre.ring.road.r17', to: 'provisions.a', why: 'The south foot of the flask arch.' },
    { from: 'provisions.b', to: 'centre.ring.road.r19', why: 'The north foot of the flask arch.' },
  ],
};
