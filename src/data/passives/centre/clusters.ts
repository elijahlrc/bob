/**
 * The generic clusters inside the ring (C-brief §2, the user's decision 2; G1-brief §3): the things every class may want
 * and no region sells well, hung off the ring's inner side. Four sit at the angles no hub uses (top, east, bottom,
 * west) and four on the diagonals between two homes (north-east, south-east, south-west, north-west; growth G3), so
 * every pair of neighbouring homes shares an arch. Each is an arch of three nodes: the ring node at its angle touches the
 * notable, and the two smalls land on the ring nodes to either side, so the arch is a small loop with the ring and never
 * a shortcut across it. Each is generic sustain or utility, never a main stat, since anything this close to two starts
 * is cheap for everyone (G1-ledger §3.1). None is stronger than a region's cluster; there are no keystones here.
 */
import {
  allAttr,
  avoidAilments,
  cooldownRecovery,
  costReduction,
  flaskEffect,
  flaskRecovery,
  life,
  lifeOnHit,
  lifeOnKill,
  manaOnKill,
  manaRegen,
  moveSpeed,
  resAll,
  resOne,
  stunAvoid,
  stunRecovery,
} from '../lines';
import type { AreaSpec } from '../types';

export const clusters: AreaSpec = {
  id: 'centre.inner',
  region: 'centre',
  name: 'The inner ring',
  why: 'Eight small arches on the inside of the ring: resistances at the top, stun protection north-east, movement east, life on hit south-east, all attributes at the bottom, chaos resistance south-west, flasks west, mana cost north-west. A build that crosses the ring for a neighbour passes one of them; a build that wants only the stat pays two or three points on the ring it was walking anyway.',
  at: [0, -240], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'shelter',
      name: 'Shelter',
      why: 'Resistances, at the top under the Mystic: the stat every build needs by map 20. Two small resistance nodes and a notable with resistances and a little life.',
      at: [0, -635],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [resAll(4)],
          at: [-61, -647],
          why: 'The west foot, on the ring toward the Zealot.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Shelter',
          lines: [resAll(8), life(5)],
          at: [0, -612],
          why: "2 + 1 units; one step inside the ring's top node.",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [resAll(4)],
          at: [61, -647],
          why: 'The east foot, on the ring toward the Shade.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'firmFooting',
      name: 'Firm Footing',
      why: 'Stun protection, north-east between the Mystic and the Shade (G1-brief §3, CE-1): neither home sells it within ten steps, and a caster or a dagger build in light armour is the one a stun stops. Two avoid-stun nodes and a notable with avoid stun and shorter stuns. Not stun threshold, which is life-side and belongs to the strength homes.',
      at: [318, -550],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [stunAvoid(20)],
          at: [271, -591],
          why: "The north foot, on the ring node of the Mystic's east link.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Firm Footing',
          lines: [stunAvoid(40), stunRecovery(15)],
          at: [306, -530],
          why: '2 + 1 units; one step inside the ring node between the Mystic and the Shade.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [stunAvoid(20)],
          at: [376, -530],
          why: "The east foot, on the ring node of the Shade's north link.",
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
      at: [635, 0],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [moveSpeed(4)],
          at: [647, -61],
          why: 'The north foot, on the ring toward the Shade.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Quick March',
          lines: [moveSpeed(8), cooldownRecovery(10)],
          at: [612, 0],
          why: '2 + 1 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [moveSpeed(4)],
          at: [647, 61],
          why: 'The south foot, on the ring toward the Strider.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'hardLiving',
      name: 'Hard Living',
      why: "Life back from fighting, south-east between the Strider and the Reaver (G1-brief §3, CE-2): both homes sell life regeneration near their starts, so this is the other kind of sustain, earned per hit and per kill. Two life-on-hit nodes and a notable with life on hit and life on kill. Life on hit is untagged here, unlike the regions' attack and melee lines, so a spell or a totem build crossing the ring gets it too: the centre stays generic.",
      at: [318, 550],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [lifeOnHit(4)],
          at: [376, 530],
          why: "The east foot, on the ring node of the Strider's south link.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Hard Living',
          lines: [lifeOnHit(8), lifeOnKill(10)],
          at: [306, 530],
          why: '2 + 1 units; one step inside the ring node between the Strider and the Reaver.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [lifeOnHit(4)],
          at: [271, 591],
          why: "The south foot, on the ring node of the Reaver's east link.",
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
      at: [0, 635],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [allAttr(4)],
          at: [61, 647],
          why: 'The east foot, on the ring toward the Strider.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Well Rounded',
          lines: [allAttr(8), life(5)],
          at: [0, 612],
          why: '2 + 1 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [allAttr(4)],
          at: [-61, 647],
          why: 'The west foot, on the ring toward the Vanguard.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'soundBody',
      name: 'Sound Body',
      why: 'Chaos resistance, south-west between the Reaver and the Vanguard (G1-brief §3, CE-3): the scarcest resistance, and the Vanguard already sells stun protection four steps from its start. Two chaos-resistance nodes and a notable with chaos resistance and a chance to avoid elemental ailments.',
      at: [-317, 550],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [resOne('chaos', 8)],
          at: [-271, 591],
          why: "The south foot, on the ring node of the Reaver's west link.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Sound Body',
          lines: [resOne('chaos', 16), avoidAilments(10)],
          at: [-306, 530],
          why: '2 + 1 units; one step inside the ring node between the Reaver and the Vanguard.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [resOne('chaos', 8)],
          at: [-376, 530],
          why: "The west foot, on the ring node of the Vanguard's east link.",
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
      at: [-635, 0],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [flaskRecovery(10)],
          at: [-647, 61],
          why: 'The south foot, on the ring toward the Vanguard.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Provisions',
          lines: [flaskEffect(8), flaskRecovery(10), manaRegen(10)],
          at: [-612, 0],
          why: '1.6 + 1 + 1 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [flaskRecovery(10)],
          at: [-647, -61],
          why: 'The north foot, on the ring toward the Zealot.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'wasteNot',
      name: 'Waste Not',
      why: "Cheaper skills, north-west between the Zealot and the Mystic (G1-brief §3, CE-4): both homes sell maximum mana and regeneration near their starts, so this sells the other side of the mana sum, cost, and mana back per kill. Not maximum mana, which is the channeller's main want. Two reduced-cost nodes and a notable with reduced cost and mana on kill.",
      at: [-317, -550],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [costReduction(4)],
          at: [-376, -530],
          why: "The west foot, on the ring node of the Zealot's north link.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Waste Not',
          lines: [costReduction(8), manaOnKill(10)],
          at: [-306, -530],
          why: '2 + 1 units; one step inside the ring node between the Zealot and the Mystic.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [costReduction(4)],
          at: [-271, -591],
          why: "The north foot, on the ring node of the Mystic's west link.",
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
      from: 'centre.ring.road.r2',
      to: 'firmFooting.n',
      why: 'The ring node between the Mystic and the Shade touches the stun notable.',
    },
    {
      from: 'centre.ring.road.r1',
      to: 'firmFooting.a',
      why: 'The north foot of the stun arch.',
    },
    {
      from: 'firmFooting.b',
      to: 'centre.ring.road.r3',
      why: 'The east foot of the stun arch.',
    },
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
      from: 'centre.ring.road.r10',
      to: 'hardLiving.n',
      why: 'The ring node between the Strider and the Reaver touches the life-on-hit notable.',
    },
    {
      from: 'centre.ring.road.r9',
      to: 'hardLiving.a',
      why: 'The east foot of the life-on-hit arch.',
    },
    {
      from: 'hardLiving.b',
      to: 'centre.ring.road.r11',
      why: 'The south foot of the life-on-hit arch.',
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
      from: 'centre.ring.road.r14',
      to: 'soundBody.n',
      why: 'The ring node between the Reaver and the Vanguard touches the chaos-resistance notable.',
    },
    {
      from: 'centre.ring.road.r13',
      to: 'soundBody.a',
      why: 'The south foot of the chaos-resistance arch.',
    },
    {
      from: 'soundBody.b',
      to: 'centre.ring.road.r15',
      why: 'The west foot of the chaos-resistance arch.',
    },
    {
      from: 'centre.ring.road.r18',
      to: 'provisions.n',
      why: "The ring's west node touches the flask notable.",
    },
    { from: 'centre.ring.road.r17', to: 'provisions.a', why: 'The south foot of the flask arch.' },
    { from: 'provisions.b', to: 'centre.ring.road.r19', why: 'The north foot of the flask arch.' },
    {
      from: 'centre.ring.road.r22',
      to: 'wasteNot.n',
      why: 'The ring node between the Zealot and the Mystic touches the mana-cost notable.',
    },
    {
      from: 'centre.ring.road.r21',
      to: 'wasteNot.a',
      why: 'The west foot of the mana-cost arch.',
    },
    {
      from: 'wasteNot.b',
      to: 'centre.ring.road.r23',
      why: 'The north foot of the mana-cost arch.',
    },
  ],
};
