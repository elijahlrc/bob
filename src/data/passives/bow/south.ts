/**
 * The Water Meadows (G3 round 2, 2026-10-22): the band between the Ford and the Fosse, outside the old edge and along the
 * south half of the outer road. Field Kit and Fouled Tips (round 1, moved here from the Ford's file) bridge the Ford's
 * far pockets (Sentry Post, Pitch Arrows) out to the road; the elemental bow hangs outward from the road's m56a.
 */
import { bowDamage, eleAttack, evasion, flaskEffect, poisonChance, poisonDamage } from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const waterMeadows: AreaSpec = {
  id: 'bow.south',
  region: 'strider',
  name: 'The Water Meadows',
  why: "The band between the Ford and the Fosse, along the outer road's south half: evasion with flasks, the poison bow and the elemental bow, each a different direction for a bow build that has spent the inside.",
  at: [2400, 3120], // Where the area's name is drawn (G3 round 2): over the outer road between Field Kit and Bright Shafts, clear of every notable and of the Thicket's and the Ford's names.
  clusters: [
    {
      id: 'brightShafts',
      name: 'Bright Shafts',
      why: "ST-2 (G1/strider.md §1, G3 round 2, 2026-10-22): elemental damage with attacks and bow damage, the elemental bow's own notable, whose elemental attacks were flat (Elemental Fletching, by home, pairs them with penetration; Pitch Arrows is fire alone, with area). On the road's south-middle rather than its end, so it sits about ten steps from Pitch Arrows and Kill Shot and the elemental bow still chooses between the general cluster and its element's (the brief). Three elemental attack smalls, so the elemental archer collects its want here and the crit archer, who wants the bow damage alone, finds only the notable worth it. A pocket straight out from m56a, square to the road: one of the far tips left as dead ends (the brief: ST-2, ST-4 and the ST-6 wheel).",
      at: P(3000, 1000),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 's1',
          kind: 'small',
          lines: [eleAttack(10)],
          at: P(2827, 954),
          why: 'The entrance, facing the road.',
        },
        { id: 's2', kind: 'small', lines: [eleAttack(10)], at: P(2880, 968) },
        { id: 's3', kind: 'small', lines: [eleAttack(10)], at: P(2933, 982) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Bright Shafts',
          lines: [eleAttack(24), bowDamage(16)],
          at: P(3000, 1000),
          why: '2.4 + 1.6 units.',
        },
      ],
      links: [
        ['s1', 's2'],
        ['s2', 's3'],
        ['s3', 'n'],
      ],
    },
    {
      id: 'fieldKit',
      name: 'Field Kit',
      why: "ST-7 (G1/strider.md §1, G3 round 1, 2026-10-22): evasion with flask effect, a bridge from Sentry Post out to the outer road's j6. Evasion smalls on the Sentry Post side (the ledger's evasion section, which had no room inside), flask smalls on the road side: walked from the Ford it costs evasion to reach the flasks, walked from the road the other way round. Evasion and flasks belong together for the archer who lives by not being hit; Plated Hide, which turns evasion into armour, is a loose pull nine steps away. The road leg leaves j6 square to the road and the notable turns the chain toward Sentry Post. In the Water Meadows' file since round 2 (it was in the Ford's, which had the nearest label): ids bow.steel.fieldKit.* became bow.south.fieldKit.*.",
      at: P(2087, 1377),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [evasion(10)],
          at: P(1919, 1441),
          why: "The Ford side's door, from Sentry Post.",
        },
        { id: 'b', kind: 'small', lines: [evasion(10)], at: P(1970, 1421) },
        { id: 'c', kind: 'small', lines: [evasion(10)], at: P(2022, 1402) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Field Kit',
          lines: [evasion(20), flaskEffect(10)],
          at: P(2087, 1377),
          why: '2 + 2 units.',
        },
        { id: 'f1', kind: 'small', lines: [flaskEffect(5)], at: P(2151, 1406) },
        {
          id: 'f2',
          kind: 'small',
          lines: [flaskEffect(5)],
          at: P(2201, 1428),
          why: "The road side's door, toward j6.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'n'],
        ['n', 'f1'],
        ['f1', 'f2'],
      ],
    },
    {
      id: 'fouledTips',
      name: 'Fouled Tips',
      why: "ST-10 (G1/strider.md §1, G3 round 1, 2026-10-22): poison with bow damage, on the straight line from Pitch Arrows to the outer road, so Pitch Arrows becomes a bridge. The poison bow had one plan and one poison notable of its own (Venom Fletching, chaos with poison, at the far north); this is its second direction, with the bow as partner. Festering (poison with bleed, the Reaver's) is about eleven steps away by the Pits. One poison small on Pitch Arrows' side, two on the road's. In the Water Meadows' file since round 2 (ids bow.steel.fouledTips.* became bow.south.fouledTips.*). It lands on m78, not the brief's j7: from m78 the line to Pitch Arrows is square to the road and runs straight on through Pitch Arrows' own chain, where from j7 it would leave the road 58 degrees off.",
      at: P(1737, 2180),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'p',
          kind: 'small',
          lines: [poisonDamage(12)],
          at: P(1675, 2147),
          why: "Pitch Arrows' side.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Fouled Tips',
          lines: [poisonChance(15), poisonDamage(20), bowDamage(12)],
          at: P(1737, 2180),
          why: '1.5 + 1.7 + 1.2 units.',
        },
        { id: 'q1', kind: 'small', lines: [poisonDamage(12)], at: P(1798, 2213) },
        {
          id: 'q2',
          kind: 'small',
          lines: [poisonDamage(12)],
          at: P(1847, 2239),
          why: "The road side's door, toward m78.",
        },
      ],
      links: [
        ['p', 'n'],
        ['n', 'q1'],
        ['q1', 'q2'],
      ],
    },
  ],
  links: [
    {
      from: 'brightShafts.s1',
      to: 'bow.rim.road.m56a',
      why: 'The elemental bow hangs straight out from the road.',
    },
    {
      from: 'bow.steel.sentryPost.n',
      to: 'fieldKit.a',
      why: "Sentry Post opens on Field Kit's evasion: the totem pocket stops being only a loop round Plated Hide and reaches the outer road.",
    },
    {
      from: 'fieldKit.f2',
      to: 'bow.rim.road.j6',
      why: "Field Kit's flask side reaches the outer road at j6.",
    },
    {
      from: 'bow.steel.pitch.n',
      to: 'fouledTips.p',
      why: 'Pitch Arrows runs straight on into Fouled Tips: no longer a dead end.',
    },
    {
      from: 'fouledTips.q2',
      to: 'bow.rim.road.m78',
      why: 'Fouled Tips reaches the outer road at m78.',
    },
  ],
};
