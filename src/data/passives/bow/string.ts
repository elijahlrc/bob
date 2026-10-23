/**
 * The Meadow: the string, two dexterity road nodes from the signature toward the projectiles hub, and the pockets every
 * Strider wants whatever the weapon hanging off its second node: Quick Hands (attack speed, a bridge on to Weathered's
 * resist star), Hard Target (evasion with life, a bridge on to the projectiles hub), Weathered's fire spoke, Long
 * Breath's and Clear Head's doors. Fleet Foot (movement with evasion) bridges Wanderer to the hub beside Hard Target, and
 * Arrow Weave hangs one step off the hub. G4 fix 1 (2026-10-22) removed True Aim, the second attack-speed notable two
 * steps from Quick Hands, and parted Fleet Foot from Hard Target (the trade-offs audit, F1); the user's editor nodes that
 * lived in this file are re-homed in their notables' clusters.
 */
import { attackSpeed, castSpeed, dex, evasion, life, moveSpeed, stunAvoid } from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const string: AreaSpec = {
  id: 'bow.string',
  region: 'strider',
  name: 'The Meadow',
  why: 'The generic road across the region, with the pockets a Strider of any weapon wants hanging off it.',
  at: [1900, 1540], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'road',
      name: 'The string',
      why: 'Five dexterity nodes in a straight line from the signature to the projectiles hub. Each is a junction: a pocket, a short cut or the keystone hangs off every one of them.',
      at: P(484, 21),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 's1',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(394, 15),
          why: 'The accuracy pocket leaves here, north.',
        },
        {
          id: 's2',
          kind: 'attribute',
          lines: [dex(7)],
          at: P(574, 26),
          why: 'The evasion-and-life chain leaves here, south.',
        },
      ],
      links: [['s1', 's2']],
    },
    {
      id: 'hardTarget',
      name: 'Hard Target',
      why: "Evasion with life, a bridge from the string's second node to the projectiles hub: two life smalls on the string side, the notable, then its evasion small, which joins Fleet Foot's evasion small on the way to the hub. Walked from the string it costs life to reach the evasion; walked from the hub, the other way round. G4 fix 1 (2026-10-22): the direct link to Fleet Foot was cut (two evasion notables a step apart, the trade-offs audit F1). G4 fix 2 (2026-10-23, the looks audit L1): the evasion small sits beside Hard Target, and the hub is reached through Fleet Foot's small (three steps from Hard Target, two from Fleet Foot).",
      at: P(1285, -9),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [evasion(10)],
          at: P(1367, -31),
          why: "Hard Target's evasion small, beside it on the line toward Fleet Foot's evasion small, which it joins. G4 fix 2 (2026-10-23, the looks audit L1): it sat beside Fleet Foot, 355 units from its own notable, and read as Fleet Foot's; the link to the projectiles hub now leaves from Fleet Foot's small.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Hard Target',
          lines: [evasion(17), life(10), stunAvoid(10)],
          at: P(1297, -21),
          why: '1.7 + 2 + 0.5 units.',
        },
        { id: 'c', kind: 'small', lines: [life(5)], at: P(1227, -17) },
        { id: 'd', kind: 'small', lines: [life(5)], at: P(1169, -13) },
      ],
      links: [
        ['n', 'c'],
        ['c', 'd'],
        ['n', 'a'],
      ],
    },
    {
      id: 'speed',
      name: 'Quick Hands and Fleet Foot',
      why: "Two notables of the Meadow, apart since G4 fix 1 (2026-10-22). Quick Hands, the attacker's speed, is a bridge from the string's second node to Weathered's chaos spoke, an attack speed small on each side. Fleet Foot, the kiter's movement and evasion, is a bridge from Wanderer (two movement smalls) to the projectiles hub (an evasion small, which also joins Hard Target's: since G4 fix 2 the hub's link leaves from it). True Aim, the second attack-speed notable two steps from Quick Hands, was removed (the trade-offs audit, F1).",
      at: P(1317, 108),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [attackSpeed(5)],
          at: P(1071, 256),
          why: "Quick Hands' small on the string side; 8% → 5% attack speed, one unit (G4 fix 1, D4).",
        },
        {
          id: 'qh',
          kind: 'notable',
          name: 'Quick Hands',
          lines: [attackSpeed(10), castSpeed(5)],
          at: P(1134, 284),
          why: "2 + 1.3 units: quick with the bow and the spell. Round 4 (approved 2026-10-20): it sold accuracy, attack speed and dexterity, True Aim's lines. G4 fix 1: turned about the string's second node so the junction's fan is even (the looks audit, L1).",
        },
        {
          id: 'm',
          kind: 'small',
          lines: [attackSpeed(5)],
          at: P(1074, 321),
          why: "Quick Hands' small toward Weathered's chaos spoke (G4 fix 1, 2026-10-22): 5% movement → 5% attack speed, Quick Hands' own stat, now that True Aim is gone (the discipline audit, F5).",
        },
        {
          id: 'ff',
          kind: 'notable',
          name: 'Fleet Foot',
          lines: [moveSpeed(8), evasion(16)],
          at: P(1565, -118),
          why: "2 + 1.6 units: the kiter's notable. G4 fix 1 (2026-10-22): its 5% attack speed went (13% → 16% evasion), so Quick Hands sells the attacker's speed and Fleet Foot the kiter's feet, and the two are a choice (the trade-offs audit, F1).",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [evasion(10)],
          at: P(1608, -63),
          why: "Fleet Foot's evasion small, toward the projectiles hub; 8% → 10%, one unit (G4 fix 1, D4). A junction since G4 fix 2: the hub and Hard Target's evasion small both leave from it.",
        },
        {
          id: 'f1',
          kind: 'small',
          lines: [moveSpeed(4)],
          at: P(1512, -164),
          why: "Fleet Foot's movement small beside it (the user's editor node n431; G3 round 1 made it movement; re-homed in G4 fix 1).",
        },
        {
          id: 'f2',
          kind: 'small',
          lines: [moveSpeed(4)],
          at: P(1470, -200),
          why: "Fleet Foot's second movement small, the door from Wanderer (the editor's n430; re-homed in G4 fix 1).",
        },
      ],
      links: [
        ['a', 'qh'],
        ['qh', 'm'],
        ['ff', 'b'],
        ['ff', 'f1'],
        ['f1', 'f2'],
      ],
    },
    {
      id: 'arrowWeave',
      name: 'Arrow Weave',
      why: "One evasion node off the string's fifth junction, then the keystone (evade projectiles better, melee worse): ten steps from the start, where the reference puts its evasion keystones. A kiting Strider's first keystone, chosen before the arc.",
      at: P(2110, 127),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [evasion(10)], at: P(2127, 138) },
        { id: 'k', kind: 'keystone', name: 'Arrow Weave', lines: [], at: P(2205, 171) },
      ],
      links: [['a', 'k']],
    },
  ],
  links: [
    {
      from: 'road.s2',
      to: 'speed.a',
      why: "The string's second node onto Quick Hands (the user's editor link).",
    },
    {
      from: 'road.s2',
      to: 'hardTarget.d',
      why: "The string's second node onto Hard Target's life side (the user's editor link).",
    },
    {
      from: 'road.s2',
      to: 'bow.steel.weathered.f2',
      why: "The string's second node onto Weathered's fire spoke (the user's editor link).",
    },
    {
      from: 'hardTarget.a',
      to: 'speed.b',
      why: "Hard Target's evasion small joins Fleet Foot's (the user's editor link): the link between the two clusters, so Hard Target is a bridge from the string to the hub, without a notable-to-notable link.",
    },
    {
      from: 'speed.b',
      to: 'bow.flight.hub.p',
      why: "Fleet Foot's evasion small reaches the projectiles hub, the way on for Hard Target too (G4 fix 2, the looks audit L1: re-aimed from Hard Target's small when that moved beside its notable; the user's editor link before).",
    },
    {
      from: 'speed.m',
      to: 'bow.steel.weathered.c2',
      why: "Quick Hands' far small onto Weathered's chaos spoke: Quick Hands is a bridge between the string and the resist star (the user's editor link; it went through True Aim's small until G4 fix 1).",
    },
    {
      from: 'speed.f2',
      to: 'bow.flight.wanderer.n',
      why: "Fleet Foot's movement chain reaches Wanderer (the user's editor link): Wanderer, Fleet Foot and the hub in a row.",
    },
    {
      from: 'arrowWeave.a',
      to: 'bow.flight.hub.p',
      why: "The keystone, one node off the projectiles hub (the user's editor link).",
    },
  ],
};
