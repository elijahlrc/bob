/**
 * The Wall's home: the Vanguard's first points, after the Strider's rework and the user's edit of it (2026-10-19): the
 * start touches two stat nodes, the hubs sit one step out, every small is one stat at the reference's size, and nothing
 * within three steps names a mace or a slam.
 *
 * North side: armour, toward the rampart and the Zealot. South side: melee physical damage, toward the slams and the
 * Reaver. The signature (life, melee damage, strength) is the loop's tip, and the tower road (life) leaves from it west;
 * the rampart and slam roads leaving the hubs are strength highways (2026-10-20). Off the
 * north hub, a stun-threshold pocket and, farther north, the reservation chain that points at the Zealot; off the south
 * hub, a flask pocket. The hubs carry strength and join the ring one node to either side.
 */
import {
  armour,
  flaskEffect,
  flaskRecovery,
  life,
  meleePhys,
  str,
  stunRecovery,
  stunThreshold,
} from '../lines';
import type { AreaSpec } from '../types';

export const START = {
  classId: 'vanguard',
  region: 'vanguard' as const,
  id: 'start.vanguard',
  at: [-866, 500] as [number, number],
};

export const home: AreaSpec = {
  id: 'wall.home',
  region: 'vanguard',
  name: 'The Gate',
  why: 'Two stat nodes off the start (armour north, melee damage south), the signature between them, two hubs one step out with a pocket each, and three roads: the rampart highway north-west, the tower road (life) west, the slam highway south.',
  at: [-1171, 640], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'sig',
      name: 'Oathbound',
      why: 'The loop the start opens onto: armour on the north side, melee physical damage on the south, the signature at the tip. Point one is a side; point two is the signature, a hub, or a road.',
      at: [-1040, 500],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [armour(12)],
          at: [-990, 390],
          why: 'The north side: defence.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Oathbound',
          lines: [life(8), meleePhys(10), str(20)],
          at: [-1120, 500],
          why: "The signature: life, the weapon's damage and strength. 3.9 units, at step two or three. The tower road leaves from here.",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [meleePhys(10)],
          at: [-990, 610],
          why: 'The south side: offence.',
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
      why: 'Strength, one step past each side node: the north hub joins the ring toward the Zealot and starts the rampart road; the south hub joins the ring toward the Reaver and starts the slam road.',
      at: [-1010, 500],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'n', kind: 'attribute', lines: [str(20)], at: [-1010, 250] },
        { id: 's', kind: 'attribute', lines: [str(20)], at: [-1010, 750] },
      ],
      links: [],
    },
    {
      id: 'unshakable',
      name: 'Unshakable',
      why: "The north hub's pocket, a tight orbit: two stun threshold nodes and a notable with threshold and stun recovery. The Vanguard who stands in the hit, three points after the hub.",
      at: [-1180, 160],
      shape: { kind: 'ring', r: 75, a0: 28 },
      nodes: [
        { id: 'a', kind: 'small', lines: [stunThreshold(8)], why: 'The entrance, facing the hub.' },
        { id: 'b', kind: 'small', lines: [stunThreshold(8)] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Unshakable',
          lines: [stunThreshold(16), stunRecovery(20)],
          why: '2 + 1.3 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'quartermaster',
      name: 'Quartermaster',
      why: "The south hub's pocket, a tight orbit: two flask recovery nodes and a notable with flask effect and recovery. The early game is life flasks; this is the cheap way to make them matter, for any class that crosses here.",
      at: [-1230, 920],
      shape: { kind: 'ring', r: 75, a0: -38 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [flaskRecovery(10)],
          why: 'The entrance, facing the hub.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Quartermaster',
          lines: [flaskEffect(8), flaskRecovery(15), life(5)],
          why: '1.6 + 1.5 + 1 units.',
        },
        { id: 'b', kind: 'small', lines: [flaskRecovery(10)] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'roadR',
      name: 'The rampart road',
      why: "Strength twice: the highway from the north hub to the rampart's wheel.",
      at: [-1410, 330],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [str(7)], at: [-1310, 300] },
        { id: 'b', kind: 'attribute', lines: [str(7)], at: [-1520, 360] },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'roadM',
      name: 'The tower road',
      why: 'Life three times: the road west from the signature toward the maces (it was melee physical damage until 2026-10-20, which committed the first points).',
      at: [-1490, 790],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [life(5)], at: [-1300, 640] },
        { id: 'b', kind: 'small', lines: [life(5)], at: [-1500, 800] },
        { id: 'c', kind: 'small', lines: [life(5)], at: [-1680, 930] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'roadS',
      name: 'The slam road',
      why: 'Strength twice: the highway from the south hub to Thunderstep.',
      at: [-1090, 1000],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [str(7)], at: [-1050, 920] },
        { id: 'b', kind: 'attribute', lines: [str(7)], at: [-1120, 1080] },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'toRingS',
      name: 'To the ring',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
      at: [-770, 640],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(7)], at: [-770, 640] }],
      links: [],
    },
  ],
  links: [
    { from: 'start.vanguard', to: 'sig.a', why: 'Point one, the north side.' },
    { from: 'start.vanguard', to: 'sig.b', why: 'Point one, the south side.' },
    { from: 'sig.a', to: 'hubs.n', why: 'The north side to the north hub.' },
    { from: 'sig.b', to: 'hubs.s', why: 'The south side to the south hub.' },
    { from: 'hubs.n', to: 'unshakable.a', why: "The north hub's pocket." },
    { from: 'hubs.s', to: 'quartermaster.a', why: "The south hub's pocket." },
    {
      from: 'hubs.n',
      to: 'centre.ring.road.r17',
      why: 'The north hub joins the ring one node toward the Zealot, clear of the start.',
    },
    {
      from: 'wall.home.hubs.s',
      to: 'wall.home.toRingS.a',
      why: 'One attribute node between the hub and the centre ring: the highway home, and a step further to the first other attribute.',
    },
    { from: 'wall.home.toRingS.a', to: 'centre.ring.road.r15', why: 'The far end of the road.' },
    { from: 'hubs.n', to: 'roadR.a', why: 'The rampart road.' },
    { from: 'sig.n', to: 'roadM.a', why: 'The tower road.' },
    { from: 'hubs.s', to: 'roadS.a', why: 'The slam road.' },
    {
      from: 'hubs.n',
      to: 'wall.resists.banner.a',
      why: 'The reservation chain north, toward the Zealot.',
    },
    {
      from: 'wall.rampart.bulwark.a',
      to: 'wall.rampart.toHome.a',
      why: 'Strength once between the rampart highway and the Bulwark wheel.',
    },
    { from: 'wall.rampart.toHome.a', to: 'wall.home.roadR.b', why: 'The far end of the road.' },
    {
      from: 'wall.maces.weight.a',
      to: 'wall.maces.toHome.a',
      why: 'Strength twice between the tower road and Weight of Iron.',
    },
    { from: 'wall.maces.toHome.b', to: 'wall.home.roadM.c', why: 'The far end of the road.' },
    { from: 'roadS.b', to: 'wall.slams.thunderstep.a', why: 'The slam road reaches the slams.' },
    {
      from: 'unshakable.n',
      to: 'roadR.a',
      why: 'The stun pocket is also a way onto the rampart road: a pocket as a bridge.',
    },
    {
      from: 'quartermaster.n',
      to: 'roadS.a',
      why: 'The flask pocket is also a way onto the slam road.',
    },
    {
      from: 'quartermaster.n',
      to: 'wall.slams.thunderstep.a',
      why: 'And straight on to the slams: the pocket is a loop with the slam road.',
    },
    {
      from: 'unshakable.n',
      to: 'wall.resists.banner.a',
      why: 'The stun pocket to the Banner chain: a loop with the north hub.',
    },
  ],
};
