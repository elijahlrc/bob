/**
 * The Stair (the Knife's north barb, hooking up toward the Spire): the curse junction off the venom junction (where
 * the life chain and the Second Curse chain also arrive), a shield small, the wheel (chaos spells on one notable since
 * round 3, mines on the other), the climb to the Spellslip junction, and the dear road of two attribute nodes from there to the
 * Spire's east arm. The near crossing from the Spire's Devotion chain lands on the wheel's north node. The id `knife.hex`
 * predates the change and is kept.
 */
import {
  areaDamage,
  castSpeed,
  chaosSpell,
  critChance,
  critMulti,
  damageVsShocked,
  dex,
  dodgeSpell,
  dotDamage,
  eleDamage,
  es,
  int,
  leechLife,
  mineDamage,
  mineSpeed,
  shockChance,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const hex: AreaSpec = {
  id: 'knife.hex',
  region: 'shade',
  name: 'The Stair',
  why: "The Knife's north barb, climbing toward the Spire: chaos spells or mines on one wheel, the climb to Spellslip, and the dear road to the Spire.",
  at: [1610, -2580], // Where the area's name is drawn: clear of every other area's name (label pass, round 4; nudged west in G2 for Static Edge).
  clusters: [
    {
      id: 'jH',
      name: 'The Stair foot',
      why: "Where the barb leaves the blade: the barb road north, the life chain arriving from the edge, the Second Curse chain arriving from the venom's north junction. Four doors, so the Knife's north flank is a mesh, not a strand.",
      at: P(1390, -260),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: P(1390, -260) }],
      links: [],
    },
    {
      id: 'road',
      name: 'The barb road',
      why: 'Energy shield once, between the junction and the wheel: the one road node of the barb.',
      at: P(1350, -540),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'small', lines: [es(5)], at: P(1350, -540) }],
      links: [],
    },
    {
      id: 'wheel',
      name: 'Rotting Word',
      why: "The wheel of four on the Stair: attribute nodes at the south entrance and the north exit, so the Stair is a road and the wheel a fork on it. Chaos spells on the west (Rotting Word, round 3: the tree had no chaos-spell notable; here chaos comes with damage over time and cast speed, the Undercroft's Tomb Dust sells it with energy shield and area, and the Spire's Withering sells the damage-over-time multiplier). It carries no curse line, and Hexwright traded places with Devotion in round 3, so the curse notables are seven (Hexwright) and five (Second Curse) steps away: a chaos hexer had found Rotting Word, Hexwright and Second Curse by point 17, mines on the east (Sapper). The Spire's Hexwright lands on the north node, where the climb to Spellslip leaves. Festering (poison) was the west side until round 3, when it went to the Yard: the poison claw found all its notables round the Rookery.",
      at: [1509, -2026],
      shape: { kind: 'ring', r: 100, a0: 90 },
      nodes: [
        {
          id: 's',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          why: 'The south entrance, from the road.',
        },
        {
          id: 'n1',
          kind: 'notable',
          name: 'Rotting Word',
          lines: [chaosSpell(20), dotDamage(10), castSpeed(4)],
          why: "1.7 + 1 + 1 units: most chaos spells damage over time. No duration line, though every chaos spell has duration: Lingering, in the Spire's Column, already sells duration with damage over time (round 3 audit).",
        },
        {
          id: 'n',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          why: "The north node: the near crossing from the Spire's Devotion chain lands here, and the climb to Spellslip leaves.",
        },
        {
          id: 'n2',
          kind: 'notable',
          name: 'Sapper',
          lines: [mineDamage(24), mineSpeed(4), damageVsShocked(8)],
          why: '2 + 1 + 1 units: lightning mines are the usual kind.',
        },
      ],
      links: [
        ['s', 'n1'],
        ['n1', 'n'],
        ['n', 'n2'],
        ['n2', 's'],
      ],
    },
    {
      id: 'climb',
      name: 'The climb',
      why: 'A road node between the wheel and the Spellslip junction.',
      at: [1560, -2450],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: [1560, -2450] }],
      links: [],
    },
    {
      id: 'j4',
      name: 'Spellslip junction',
      why: "The top of the barb: the Spellslip spur north-east, the dear road to the Spire's lightning arm north-west.",
      at: [1600, -2720],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: [1600, -2720] }],
      links: [],
    },
    {
      id: 'spellslip',
      name: 'Spellslip',
      why: 'Two nodes of spell dodge, then the trade: 30% chance to dodge spells, 30% less energy shield. The tip of the curse barb, on the Spire border, where a Mystic coming down from the lightning arm meets it as well.',
      at: [1760, -3080],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [dodgeSpell(3)], at: P(2093, -1826) },
        { id: 'b', kind: 'small', lines: [dodgeSpell(3)], at: P(2139, -1861) },
        { id: 'k', kind: 'keystone', name: 'Spellslip', lines: [], at: [1820, -3260] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
    {
      id: 'toSpire',
      name: 'To the Spire',
      why: "The dear crossing to the Spire's lightning arm (brief §4): two attribute nodes from the Spellslip junction to the Gallery stair, for the lightning Shade and the lightning trapper, and for the low-life Mystic who wants Spellslip.",
      at: [1440, -3150],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [dex(6), int(6)], at: [1480, -3000] },
        { id: 'b', kind: 'attribute', lines: [dex(6), int(6)], at: [1400, -3300] },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'static',
      name: 'Static Edge',
      why: 'A pocket east off the Spellslip junction, into the ground beside the Stair: lightning twice, then lightning with crit; since round 3 the second small carries the Rooftops road on, and the notable is a leaf. The Spire sells lightning with cast speed (Thunderhead) and with shock (Overcharge); here it comes with crit, for the crit-spell Shade and the lightning trapper the dear road to the Spire was built for.',
      at: [1950, -2600],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [eleDamage('lightning', 10)], at: [1975, -2661] },
        { id: 'b', kind: 'small', lines: [eleDamage('lightning', 10)], at: [2033, -2652] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Static Edge',
          lines: [eleDamage('lightning', 16), critChance(15), shockChance(10)],
          at: [2090, -2585],
          why: "1.6 + 1 + 1 units. G2 (2026-10-22): moved below the static road (G1/shade.md §3.6), clear of the line north-east from the second small, where the energy shield cluster at the Stair's top (SH-1) will join it.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'powder',
      name: 'Black Powder',
      why: 'A pocket at the top of the Stair, on the Spire border: mine damage twice, then mines with area damage. The second mine cluster, eight steps from Sapper.',
      at: [1640, -3540],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [mineDamage(12)], at: P(2231, -2257) },
        { id: 'b', kind: 'small', lines: [mineDamage(12)], at: P(2289, -2272) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Black Powder',
          lines: [mineDamage(20), areaDamage(16)],
          at: [1761, -3661],
          why: '1.7 + 1.6 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'bloodletter',
      name: 'Bloodletter',
      why: 'A pocket off the climb, toward Shade Leech: life leech with attacks twice, then leech with crit multiplier. The Knife had no recovery notable.',
      at: [1800, -2210],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [leechLife(0.4, ['attack'])], at: P(1675, -973) },
        { id: 'b', kind: 'small', lines: [leechLife(0.4, ['attack'])], at: P(1690, -916) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Bloodletter',
          lines: [leechLife(0.8, ['attack']), critMulti(12)],
          at: [1921, -2089],
          why: '2 + 1 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
  ],
  links: [
    {
      from: 'toSpire.b',
      to: 'spire.storm.roadS.a',
      why: 'The dear road from the Stair lands on the Gallery stair, not on the Pain Conduit spur (build audit 2026-10-20: the keystone spur was a road).',
    },
    {
      from: 'wheel.s',
      to: 'wheel.n',
      why: 'The Stair runs straight through its wheel: chaos spells and mines are a step off the road on either side, not a toll on it (build audit 2026-10-20).',
    },
    {
      from: 'jH.a',
      to: 'knife.venom.secondCurse.a',
      why: 'The Stair foot onto the small of the curse chain, so Second Curse hangs as a leaf and is not a road to Shade Leech.',
    },
    { from: 'climb.a', to: 'bloodletter.a', why: 'The road onto Bloodletter.' },
    { from: 'toSpire.b', to: 'powder.a', why: 'The road onto Black Powder.' },
    { from: 'j4.a', to: 'static.a', why: 'The Spellslip junction onto the lightning pocket.' },
    { from: 'jH.a', to: 'road.a', why: 'The junction to the barb road.' },
    { from: 'road.a', to: 'wheel.s', why: 'The barb road to the wheel.' },
    { from: 'wheel.n', to: 'climb.a', why: "The wheel's north node onto the climb." },
    { from: 'climb.a', to: 'j4.a', why: 'The climb to the Spellslip junction.' },
    { from: 'j4.a', to: 'spellslip.a', why: 'Junction to the keystone spur.' },
    { from: 'j4.a', to: 'toSpire.a', why: 'Junction onto the dear road.' },
  ],
};
