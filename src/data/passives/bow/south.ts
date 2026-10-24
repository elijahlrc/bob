/**
 * The Water Meadows (G3 round 2, 2026-10-22): the band between the Ford and the Fosse, outside the old edge and along the
 * south half of the outer road. Field Kit and Fouled Tips (round 1, moved here from the Ford's file) bridge the Ford's
 * far pockets (Sentry Post, Pitch Arrows) out to the road; the finishing archer's Killing Eye hangs as an arc between
 * m56a and m56b (G4 fix 1; Bright Shafts was there), and lightning attacks with shock between m67 and j7 (round 3, an arc since
 * G4 fix 1).
 */
import {
  bowDamage,
  critMulti,
  damageVsLowLife,
  eleAttackOne,
  evasion,
  flaskEffect,
  poisonChance,
  poisonDamage,
  shockChance,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const waterMeadows: AreaSpec = {
  id: 'bow.south',
  region: 'strider',
  name: 'The Water Meadows',
  why: "The band between the Ford and the Fosse, along the outer road's south half: evasion with flasks, the poison bow, the finishing crit and lightning attacks with shock, each a different direction for a bow build that has spent the inside.",
  at: [2400, 3120], // Where the area's name is drawn (G3 round 2): over the outer road between Field Kit and Bright Shafts, clear of every notable and of the Thicket's and the Ford's names.
  clusters: [
    {
      id: 'killingEye',
      name: 'Killing Eye',
      why: "Crit multiplier with damage against enemies on low life, the finishing archer's notable, hung as an arc between the outer road's m56a and m56b (G4 fix 1, 2026-10-22, the user's answer U3: it traded places with Bright Shafts, which went to the bleed wheel 12 steps out, and the bare m56b got a branch). The crit archer's far direction south, against Kill Shot's bow crit north; crit multiplier is also sold by Vital Aim (with crit chance, by home) and the Shade's Mercy Stroke (with poison since G4 fix 1). Two sections, one small each: crit multiplier on m56a's side, the finishing blow on m56b's. Walked from either end it costs the other line.",
      at: P(2581, 1060),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [critMulti(12)],
          at: P(2546, 999),
          why: "m56a's side: crit multiplier, the notable's lead.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Killing Eye',
          lines: [critMulti(24), damageVsLowLife(16)],
          at: P(2581, 1060),
          why: '2 + 2 units. Added in the editor (2026-10-19) as a second Vital Aim; round 4 (approved 2026-10-20) gave it the finishing blow instead of crit chance. The apex of the arc, square to the road.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [damageVsLowLife(8)],
          at: P(2518, 1090),
          why: "m56b's side: the finishing blow, the notable's second line.",
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
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
    {
      id: 'liveWire',
      name: 'Live Wire',
      why: "ST-4 (G1/strider.md §1, G3 round 3, 2026-10-22): lightning damage with attacks and chance to shock, lightning attacks' second home. Stormstruck (the Reaver's Fosse) pairs them with attack speed; this one with shock. A lightning archer reaches both, each with its own partner. G4 fix 1 (2026-10-22, the network audit N1 and N3): an arc between the outer road's m67 and j7, so it is a bridge and the bare j7 has a branch; one small on m67's side, two on j7's, so the notable stays six steps from Stormstruck (j7, m78, j8). Three lightning attack smalls, one section.",
      at: P(2265, 1948),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 's1',
          kind: 'small',
          lines: [eleAttackOne('lightning', 12)],
          at: P(2234, 1886),
          why: "m67's side.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Live Wire',
          lines: [eleAttackOne('lightning', 24), shockChance(20)],
          at: P(2265, 1948),
          why: '2 + 2 units. The apex of the arc, square to the road.',
        },
        { id: 's2', kind: 'small', lines: [eleAttackOne('lightning', 12)], at: P(2199, 1973) },
        {
          id: 's3',
          kind: 'small',
          lines: [eleAttackOne('lightning', 12)],
          at: P(2148, 1992),
          why: "j7's side, the second small: the rest of the distance is on the link.",
        },
      ],
      links: [
        ['s1', 'n'],
        ['n', 's2'],
        ['s2', 's3'],
      ],
    },
  ],
  links: [
    {
      from: 'killingEye.a',
      to: 'bow.rim.road.m56a',
      why: "Killing Eye's crit side reaches the road at m56a.",
    },
    {
      from: 'killingEye.b',
      to: 'bow.rim.road.m56b',
      why: "Killing Eye's finishing side reaches the road at m56b: the arc is a bridge.",
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
    {
      from: 'liveWire.s1',
      to: 'bow.rim.road.m67',
      why: "Live Wire's m67 side (G3 round 3; an arc since G4 fix 1).",
    },
    {
      from: 'liveWire.s3',
      to: 'bow.rim.road.j7',
      why: "Live Wire's j7 side: the arc is a bridge and j7 a junction (G4 fix 1).",
    },
  ],
};
