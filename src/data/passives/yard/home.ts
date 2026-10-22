/**
 * The Yard's home: the Reaver's first points, after the Strider's rework (docs/tree/design/D-strider-walks.md) and the
 * user's edit of it (2026-10-19): the start touches two stat nodes, not attributes; the hubs sit one step out; every
 * small is one stat at the reference's size; nothing within three steps names a shield or a second sword.
 *
 * West side: melee physical damage, toward the blades. East side: attack speed, toward the second hand and the speed
 * cluster. The signature (speed, melee damage, life, both attributes) is the loop's tip, and the shield road leaves from
 * it straight down to the hub (it is life, since the user\'s review: block belongs to the shield area). Off the west hub, a life pocket pointing at the Wall; off the east hub, a block pocket
 * pointing at the Bow, both tight orbits. The hubs carry both attributes: a hybrid's sword asks for both.
 * The west and second-hand roads leaving the hubs are strength-and-dexterity highways (2026-10-20).
 */
import {
  attackSpeed,
  dex,
  evasion,
  flaskDuration,
  flaskRecovery,
  life,
  lifeRegen,
  manaLeech,
  manaOnHit,
  meleePhys,
  shieldBlock,
  str,
} from '../lines';
import type { AreaSpec } from '../types';

export const START = {
  classId: 'reaver',
  region: 'reaver' as const,
  id: 'start.reaver',
  at: [0, 1000] as [number, number],
};

export const home: AreaSpec = {
  id: 'yard.home',
  region: 'reaver',
  name: 'The Yard Gate',
  why: 'Two stat nodes off the start (melee damage west, attack speed east), the signature between them, two hubs one step out with a pocket each, and three roads: the blades highway west, the second-hand highway east, the middle road (life) straight down; and the mana pocket between the middle road and the second-hand road.',
  at: [-80, 1347], // Where the area's name is drawn: clear of every other area's name; 9 up in G2, off Buckler's frame.
  clusters: [
    {
      id: 'sig',
      name: 'Quickened Steel',
      why: 'The loop the start opens onto: melee physical damage on the west side, attack speed on the east, the signature at the tip. Point one is a side; point two is the signature, a hub, or a road.',
      at: [0, 1180],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [meleePhys(10)],
          at: [-70, 1242],
          why: 'The west side: damage.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Quickened Steel',
          lines: [attackSpeed(7), meleePhys(10), life(6), str(10), dex(10)],
          at: [0, 1240],
          why: 'The signature: the Reaver is the fast melee class. Speed, melee damage, life and both attributes: 4.9 units. The shield road leaves from here.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [attackSpeed(8)],
          at: [70, 1242],
          why: 'The east side: speed.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'hubs',
      name: 'The hubs',
      why: 'Both attributes, one step past each side node: the west hub joins the ring toward the Vanguard and starts the west road; the east hub joins the ring toward the Strider and starts the second-hand road.',
      at: [0, 1250],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'w', kind: 'attribute', lines: [str(15), dex(15)], at: [-300, 1250] },
        { id: 'e', kind: 'attribute', lines: [str(15), dex(15)], at: [300, 1250] },
      ],
      links: [],
    },
    {
      id: 'life',
      name: 'Stout Heart',
      why: "The west hub's pocket, a tight orbit pointing at the Wall: two life nodes and a life-and-regeneration notable with a little strength. The first life a Reaver can buy, three points after the hub.",
      at: [-470, 1150],
      shape: { kind: 'ring', r: 75, a0: 30 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [life(5)],
          why: 'The entrance, facing the hub.',
          at: [-411, 1221],
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Stout Heart',
          lines: [life(10), lifeRegen(0.6), str(10)],
          why: '2 + 1.5 + 0.7 units.',
        },
        { id: 'b', kind: 'small', lines: [life(5)], at: [-467, 1206] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'block',
      name: 'Buckler',
      why: "The east hub's pocket, a tight orbit pointing at the Bow: two block nodes and a block-and-shield-defences notable. Optional: the dual-wield Reaver walks past it.",
      at: [450, 1380],
      shape: { kind: 'ring', r: 75, a0: -139 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [shieldBlock(3)],
          why: 'The entrance, facing the hub.',
          at: [365, 1347],
        },
        { id: 'b', kind: 'small', lines: [shieldBlock(3)], at: [397, 1396] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Buckler',
          lines: [shieldBlock(5), evasion(13), life(5)],
          why: 'The light shield: 2.5 + 1.3 + 1 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'fightingBreath',
      name: 'Fighting Breath',
      why: "Mana on hit with attacks twice, then the notable with mana on hit, mana leech and life: the Yard's only mana notable, for a Reaver with three gems who runs dry by map five. A tight orbit between the middle road's third node and the second-hand road's second node: a bridge, so the two roads are a loop before the hub.",
      at: [170, 1640],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [manaOnHit(4, ['attack'])],
          at: [209, 1641],
          why: 'The entrance, from the middle road.',
        },
        { id: 'b', kind: 'small', lines: [manaOnHit(4, ['attack'])], at: [246, 1686] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Fighting Breath',
          lines: [manaOnHit(8, ['attack']), manaLeech(0.4), life(5)],
          at: [290, 1740],
          why: '2 + 1 + 1 units. The exit, to the second-hand road.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'fieldDressing',
      name: 'Field Dressing',
      why: "Flask recovery twice, then the notable with recovery, duration and life: the Yard sold no flask lines, and the early game is life flasks. A pocket west of Stout Heart, its smalls on the way to the Wall, passed through to Fencer's Eye: the life pocket and the crit pocket are joined along the Wall border.",
      at: [-700, 1290],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [flaskRecovery(10)],
          why: 'The entrance, facing Stout Heart.',
          at: [-676, 1251],
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Field Dressing',
          lines: [flaskRecovery(15), flaskDuration(10), life(5)],
          why: "1.5 + 1 + 1 units. The exit, to Fencer's Eye.",
          at: [-693, 1340],
        },
        {
          id: 'b',
          kind: 'small',
          lines: [flaskRecovery(10)],
          why: "The west side, where the Wall's Bracing is one step away.",
          at: [-731, 1275],
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'roadW',
      name: 'The west road',
      why: 'Strength and dexterity twice: the highway from the west hub to the sword diamond.',
      at: [-450, 1500],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [str(6), dex(6)], at: [-400, 1420] },
        { id: 'b', kind: 'attribute', lines: [str(6), dex(6)], at: [-510, 1580] },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'roadE',
      name: 'The second-hand road',
      why: 'Strength and dexterity twice: the highway from the east hub to the Twin Fangs wheel.',
      at: [340, 1530],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [str(6), dex(6)], at: [300, 1450] },
        { id: 'b', kind: 'attribute', lines: [str(6), dex(6)], at: [380, 1620] },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'roadS',
      name: 'The middle road',
      why: 'Life three times: the road straight down from the signature to the hub, where the crossroad and the spine meet it (G2). It was block, and a two-sword Reaver paid three block nodes for the generic way down; life is what every Reaver wants on the way.',
      at: [-50, 1560],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [life(5)], at: [-7, 1310] },
        { id: 'b', kind: 'small', lines: [life(5)], at: [-13, 1367] },
        { id: 'c', kind: 'small', lines: [life(5)], at: [-19, 1425] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'toRingW',
      name: 'To the ring',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
      at: [-247, 987],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(6), dex(6)], at: [-247, 987] }],
      links: [],
    },
    {
      id: 'toRingE',
      name: 'To the ring',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
      at: [247, 987],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(6), dex(6)], at: [247, 987] }],
      links: [],
    },
  ],
  links: [
    { from: 'start.reaver', to: 'sig.a', why: 'Point one, the west side.' },
    { from: 'start.reaver', to: 'sig.b', why: 'Point one, the east side.' },
    { from: 'sig.a', to: 'hubs.w', why: 'The west side to the west hub.' },
    { from: 'sig.b', to: 'hubs.e', why: 'The east side to the east hub.' },
    { from: 'hubs.w', to: 'life.a', why: "The west hub's pocket." },
    { from: 'hubs.e', to: 'block.a', why: "The east hub's pocket." },
    {
      from: 'yard.home.hubs.w',
      to: 'yard.home.toRingW.a',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
    },
    { from: 'yard.home.toRingW.a', to: 'centre.ring.road.r13', why: 'The far end of the road.' },
    {
      from: 'yard.home.hubs.e',
      to: 'yard.home.toRingE.a',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
    },
    { from: 'yard.home.toRingE.a', to: 'centre.ring.road.r11', why: 'The far end of the road.' },
    { from: 'hubs.w', to: 'roadW.a', why: 'The west road.' },
    { from: 'hubs.e', to: 'roadE.a', why: 'The second-hand road.' },
    { from: 'sig.n', to: 'roadS.a', why: 'The middle road.' },
    { from: 'roadW.b', to: 'yard.blades.keenEdge.a', why: 'The west road reaches the swords.' },
    {
      from: 'roadE.b',
      to: 'yard.dual.twinFangs.a',
      why: 'The second-hand road reaches the dual-wield wheel.',
    },
    { from: 'roadS.c', to: 'yard.shield.hub.a', why: 'The middle road lands on the hub.' },
    {
      from: 'life.n',
      to: 'roadW.a',
      why: 'The life pocket is also a way onto the west road: a pocket as a bridge, as the user drew them.',
    },
    {
      from: 'block.n',
      to: 'roadE.a',
      why: 'The block pocket is also a way onto the second-hand road.',
    },
    {
      from: 'roadS.c',
      to: 'fightingBreath.a',
      why: "The middle road's third node onto the mana pocket (G2, 2026-10-22; it was the second): the first node is left free for the attack-speed cluster that will bridge the middle road and the second-hand road (RE-5), whose link would otherwise cross this one.",
    },
    { from: 'life.n', to: 'fieldDressing.a', why: 'Stout Heart onto the flask pocket.' },
    {
      from: 'fieldDressing.b',
      to: 'wall.slams.bracing.b',
      why: "A near crossing to the Wall: the Yard's flask pocket and the Wall's block pocket (Bracing since round 3) sit a step apart on the border, so a Reaver buys block and a Vanguard buys flasks without walking round the ring.",
    },
    {
      from: 'fightingBreath.n',
      to: 'roadE.b',
      why: 'The mana pocket lands on the second-hand road: the middle and east roads are a loop above the wheel.',
    },
  ],
};
