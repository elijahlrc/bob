/**
 * The Fosse (round 4, 2026-10-20): an outer road along the Yard's south rim, from the Pits' east junction round the
 * bottom of the Yard to Barrow Ward, the Barrows' guard pocket in the Wall. The Yard's south was full to the rim, so the
 * two clusters the round-3 audit asked of it hang off a new road rather than its crowded junctions: the lightning
 * striker's (there was no lightning-attack cluster anywhere) and the curse for dexterity and strength attackers (both
 * curse clusters were on the intelligence side). It is also a second road between the Yard and the Wall.
 */
import {
  attackSpeed,
  channelDamage,
  curseEffect,
  damageVsCursed,
  dex,
  eleAttackOne,
  str,
  stunAvoid,
} from '../lines';
import type { AreaSpec } from '../types';

export const fosse: AreaSpec = {
  id: 'yard.fosse',
  region: 'reaver',
  name: 'The Fosse',
  why: "An outer road round the Yard's south rim, from the Pits to the Barrows: lightning strikes near the Strider's side, the hunter's curse at the bottom.",
  at: [180, 4175], // Where the area's name is drawn: clear of every other area's name; moved below the spine's landing in G2.
  clusters: [
    {
      id: 'road',
      name: 'The fosse road',
      why: "Seven attribute nodes from the Pits' east junction south and west under Wound Dance to Barrow Ward. Spellsword lands on the first node, the lightning pocket leaves east at the second, the channelling pocket south at the third, the spine lands on the fourth, the curse pocket leaves south at the fifth and the leg from the Pits' west junction lands on the sixth (G2); the far end joins the Barrows, so the road is a way between the Yard and the Wall with four ways in from the Yard, not a path to leaves.",
      at: [-140, 4120],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'f1', kind: 'attribute', lines: [str(6), dex(6)], at: [415, 3421] },
        {
          id: 'f2',
          kind: 'attribute',
          lines: [str(6), dex(6)],
          at: [410, 3750],
          why: 'The lightning strikes leave east.',
        },
        { id: 'f3', kind: 'attribute', lines: [str(6), dex(6)], at: [180, 3990] },
        { id: 'f4', kind: 'attribute', lines: [str(6), dex(6)], at: [-150, 4060] },
        {
          id: 'f5',
          kind: 'attribute',
          lines: [str(6), dex(6)],
          at: [-480, 4130],
          why: 'The curse pocket leaves south.',
        },
        { id: 'f6', kind: 'attribute', lines: [str(7)], at: [-785, 4005] },
        {
          id: 'f7',
          kind: 'attribute',
          lines: [str(7)],
          at: [-1090, 3880],
          why: "Strength only from here: the Wall's side.",
        },
      ],
      links: [
        ['f1', 'f2'],
        ['f2', 'f3'],
        ['f3', 'f4'],
        ['f4', 'f5'],
        ['f5', 'f6'],
        ['f6', 'f7'],
      ],
    },
    {
      id: 'storm',
      name: 'Stormstruck',
      why: "A pocket east off the fosse road: lightning with attacks twice, then lightning strikes with attack speed. The tree had no lightning-attack cluster; this one is near the Strider and the Reaver, the dexterity side where most elemental attacks are. The Cathedral's two sell fire strikes with ignite (Kindled Steel) and cold strikes with chill (Rimed Steel); the lightning notables for casters and attackers alike (Static Edge, Overcharge, Thunder Peal) sell crit and shock.",
      at: [680, 3845],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [eleAttackOne('lightning', 12)], at: [709, 3853] },
        { id: 'b', kind: 'small', lines: [eleAttackOne('lightning', 12)], at: [764, 3872] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Stormstruck',
          lines: [eleAttackOne('lightning', 24), attackSpeed(7)],
          at: [830, 3895],
          why: '2 + 1.3 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'marked',
      name: 'Marked Prey',
      why: "A pocket south off the fosse road: curse effect twice, then curse effect with damage against the cursed. The attacker's curse, for the dexterity and strength curses and a curse on hit; Hexwright, in the Spire, sells curse effect with area and duration, and the Wall's Grim Oath sells it with armour.",
      at: [-480, 4400],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [curseEffect(8)], at: [-480, 4422] },
        { id: 'b', kind: 'small', lines: [curseEffect(8)], at: [-480, 4480] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Marked Prey',
          lines: [curseEffect(12), damageVsCursed(20)],
          at: [-480, 4550],
          why: '1.5 + 2.5 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'flurry',
      name: 'Ceaseless Blades',
      why: "A pocket south off the fosse road, between the lightning strikes and the hunter's curse: damage with channelling skills twice, then channelled attacks with speed and stun avoidance, for the attacker who stands and keeps swinging. The Spire's Steady Stream sells channelling to casters, with mana. Round 4 (2026-10-20).",
      at: [180, 4260],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [channelDamage(10)], at: [180, 4272] },
        { id: 'b', kind: 'small', lines: [channelDamage(10)], at: [180, 4330] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Ceaseless Blades',
          lines: [channelDamage(20), attackSpeed(7, ['channelling']), stunAvoid(15)],
          at: [180, 4400],
          why: '2 + 1.3 + 0.8 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
  ],
  links: [
    { from: 'road.f3', to: 'flurry.a', why: 'The road onto the channelled attacks.' },
    {
      from: 'yard.blood.j2.a',
      to: 'road.f1',
      why: "The Pits' east junction onto the fosse road, between the rim road and Festering.",
    },
    {
      from: 'road.f7',
      to: 'wall.grit.barrowWard.n',
      why: "The fosse road's west end lands on Barrow Ward, which becomes a way through rather than a leaf.",
    },
    { from: 'road.f2', to: 'storm.a', why: 'The road onto the lightning strikes.' },
    { from: 'road.f5', to: 'marked.a', why: "The road onto the hunter's curse." },
  ],
};
