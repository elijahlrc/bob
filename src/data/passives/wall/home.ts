/**
 * The Wall's home: the Vanguard's first points, after the Strider's rework and the user's edit of it (2026-10-19): the
 * start touches two stat nodes, the hubs sit one step out, every small is one stat at the reference's size, and nothing
 * within three steps names a mace or a slam.
 *
 * North side: armour, toward the rampart and the Zealot. South side: melee physical damage, toward the slams and the
 * Reaver. The signature (life, melee damage, strength) is the loop's tip, and the tower road (life) leaves from it west;
 * the rampart and slam roads leaving the hubs are strength highways (2026-10-20). Off the
 * north hub, a melee damage pocket (stun threshold until G3 round 2) and, farther north, the reservation chain that
 * points at the Zealot; off the south
 * hub, a flask pocket. The hubs carry strength and join the ring one node to either side. G3 round 3 (2026-10-22):
 * Shield Ram (shield attacks, stun duration), a diamond pocket off the rampart road.
 */
import {
  armour,
  enemyStunThreshold,
  flaskEffect,
  flaskRecovery,
  life,
  meleeDamage,
  meleePhys,
  shieldAttack,
  str,
  stunDuration,
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
      id: 'ringing',
      name: 'Ringing Blows',
      why: "The north hub's pocket, a straight chain: melee damage twice and a notable with melee damage and the blow that rocks them (lower enemy stun threshold): the Vanguard's first offence on the north side, for any melee weapon, named for none, two to four points out. It was Unshakable (stun threshold, stun recovery) until G3 round 2 (2026-10-22): within six steps of the start every notable but Oathbound and the Banner was defence or utility, and the north side ran stun threshold, resistances, mana and armour before any offence (CONSTRAINTS §4.8). Stun threshold is still sold by Ox Hide (with armour, the far west), and as lines on Bracing and Unhurried (Stone Heart sold it with life until G4 fix 1, 2026-10-22, and became Weak Spot, melee crit). Its chain leaves the north hub about 36° from the rampart road and from the Banner's link, an even fan (G4 fix 1: it left 21° from the Banner's, a sliver).",
      at: [-1220, 143],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [meleeDamage(8)],
          why: 'The entrance, facing the hub.',
          at: [-1109, 200],
        },
        { id: 'b', kind: 'small', lines: [meleeDamage(8)], at: [-1158, 175] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Ringing Blows',
          lines: [meleeDamage(16), enemyStunThreshold(12)],
          at: [-1220, 143],
          why: '2 + 1.5 units: harder blows, and stuns that come sooner. The stun clusters farther out sell it with a weapon (Weight of Iron, the mace; Headsman, the two-hander) or with duration (Stagger, Hot Iron).',
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
      why: "The south hub's pocket, a straight chain: two flask recovery nodes and a notable with flask effect and recovery. The early game is life flasks; this is the cheap way to make them matter, for any class that crosses here. Swung west into the hub's empty side in G4 fix 1 (2026-10-22): it hung south between the hub and the slam road, and the pocket, the road and the rung between them were a ladder of slivers (near-misses of 25° to 28° at the hub, the notable and Thunderstep). Now the rung to the slam road runs nearly level and the link to Thunderstep straight down.",
      at: [-1300, 880],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [flaskRecovery(10)],
          why: 'The entrance, facing the hub.',
          at: [-1186, 829],
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Quartermaster',
          lines: [flaskEffect(8), flaskRecovery(15), life(5)],
          at: [-1300, 880],
          why: '1.6 + 1.5 + 1 units.',
        },
        { id: 'b', kind: 'small', lines: [flaskRecovery(10)], at: [-1236, 851] },
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
        { id: 'a', kind: 'small', lines: [life(5)], at: [-1300, 628] },
        { id: 'b', kind: 'small', lines: [life(5)], at: [-1481, 756] },
        { id: 'c', kind: 'small', lines: [life(5)], at: [-1662, 884] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'ram',
      name: 'Shield Ram',
      why: "Attack damage with a shield three times round the notable with shield attack damage and stun duration: the shield used as a weapon, a diamond pocket off the rampart road's second node, in the room between the rampart road and the tower road (G3 round 3, 2026-10-22; the ledger's VA-8). An optional porch for the shield Vanguard, five or six points out: Bracing (block with a shield) leaves the start south-east, this leaves it north-west, so the shield's offence and its block are two directions. Its twin is the Yard's Shield Bash (shield attacks with shield speed and life on block), far east in the Muster. A pocket, not the bridge the brief drew: as a bridge to the tower road its three smalls let a build on the tower road join the rampart highway without the north hub, a stat connector standing in for the highway beside the start (CONSTRAINTS §7.1), and the allocator found one mace-and-shield plan far ahead of every other at 120 points. A shield is not a weapon, so nothing within three steps of the start names one (§6.3). Ringing Blows, round the north hub, lowers the enemy's stun threshold for any melee weapon; this lengthens the stun for a shield: a build that wants both stuns may take both (§8.3).",
      at: [-1506, 498],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [shieldAttack(10)],
          at: [-1511, 443],
          why: 'The north corner, the entrance from the rampart road.',
        },
        { id: 'b', kind: 'small', lines: [shieldAttack(10)], at: [-1451, 493] },
        { id: 'c', kind: 'small', lines: [shieldAttack(10)], at: [-1501, 553] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Shield Ram',
          lines: [shieldAttack(20), stunDuration(25)],
          at: [-1561, 503],
          why: '2 + 1.7 units: 3.7. The rim of the shield brought down: harder blows with it, and the stun they leave lasts longer. The west corner, a step from the entrance either way round.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'n'],
        ['n', 'a'],
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
    { from: 'hubs.n', to: 'ringing.a', why: "The north hub's pocket." },
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
      from: 'roadR.b',
      to: 'ram.a',
      why: "The rampart road's second node south onto Shield Ram's entrance: the shield pocket.",
    },
    {
      from: 'ringing.n',
      to: 'roadR.a',
      why: 'The melee pocket is also a way onto the rampart road: a pocket as a bridge.',
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
      from: 'ringing.n',
      to: 'wall.resists.banner.a',
      why: 'The melee pocket to the Banner chain: a loop with the north hub.',
    },
  ],
};
