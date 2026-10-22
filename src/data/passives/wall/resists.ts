/**
 * The Battlements (the Wall's north, on the Cathedral border): the resist star, a notable with four single-node spokes
 * that land in four different places (the rampart's junction, the rampart road, Scar Tissue, the Cathedral crossing
 * junction); Scar Tissue (grit when hit; it swapped with Tempered on 2026-10-20) at the end of a short chain beside the
 * dear crossing from the fire tower; the crossing junction; the Warlord's Banner chain (reservation, aura effect, mana)
 * from the north hub toward the Zealot; and, since G2 (2026-10-22), Hallowed Hammer off the rampart's junction.
 */
import {
  armour,
  eleAttack,
  gritOnHitTaken,
  life,
  lifeRegenPerGrit,
  maceDamage,
  manaFlat,
  reducedReservation,
  resAll,
  resOne,
  str,
} from '../lines';
import type { AreaSpec } from '../types';

export const resists: AreaSpec = {
  id: 'wall.resists',
  region: 'vanguard',
  name: 'The Battlements',
  why: "The Wall's north, on the Cathedral border: the resist star as the connector, the Warlord's Banner chain toward the Zealot, Scar Tissue at the tip where the Cathedral's fire two-hander arrives, and Hallowed Hammer on the west, where maces meet the Cathedral's sceptres.",
  at: [-2000, -140], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'star',
      name: 'Elemental Ward',
      why: "The resist star: all resistances in the notable, one single-node spoke per element, each landing somewhere else. Fire south-west to the rampart's junction, chaos south-east to the rampart road, cold west to Scar Tissue, lightning north to the crossing junction.",
      at: [-2000, -40],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n',
          kind: 'notable',
          name: 'Elemental Ward',
          lines: [resAll(10), life(5)],
          at: [-2000, -40],
          why: '2.5 units of resistance and 1 of life.',
        },
        {
          id: 'f',
          kind: 'small',
          lines: [resOne('fire', 10)],
          at: [-2049, 9],
          why: "The fire spoke, to the rampart's junction.",
        },
        {
          id: 'c',
          kind: 'small',
          lines: [resOne('chaos', 10)],
          at: [-1950, 9],
          why: 'The chaos spoke, to the rampart road.',
        },
        {
          id: 'w',
          kind: 'small',
          lines: [resOne('cold', 10)],
          at: [-2061, -75],
          why: 'The cold spoke, to Scar Tissue.',
        },
        {
          id: 'l',
          kind: 'small',
          lines: [resOne('lightning', 10)],
          at: [-2000, -110],
          why: 'The lightning spoke, to the crossing junction.',
        },
      ],
      links: [
        ['n', 'f'],
        ['n', 'c'],
        ['n', 'w'],
        ['n', 'l'],
      ],
    },
    {
      id: 'j',
      name: 'Junction',
      why: "The crossing junction: the near crossing to the Cathedral's block and shields (north), Scar Tissue west, the star south, the Banner chain east.",
      at: [-2000, -330],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(7)], at: [-2000, -330] }],
      links: [],
    },
    {
      id: 'scarTissue',
      name: 'Scar Tissue',
      why: "Grit when hit, then the notable with grit when hit and regeneration per charge: the build that is hit a lot and shrugs, at the end of a short chain beside the dear crossing from the Cathedral's fire tower. The grit wheel is far south (Unbroken); a grit build takes this one with the armour and the resistances, or that one with the warcries.",
      at: [-2290, -207],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [gritOnHitTaken(10)], at: [-2260, -190] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Scar Tissue',
          lines: [gritOnHitTaken(20), lifeRegenPerGrit(0.2)],
          at: [-2320, -225],
          why: '2 + 1.5 units.',
        },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'hammer',
      name: 'Hallowed Hammer',
      why: "Mace damage twice, then maces with elemental damage, and one more mace small facing the Cathedral: a pocket bridge north off the rampart's junction toward the Zealot's sceptre road, so maces and sceptres meet (G2, 2026-10-22; it was a dead end off the road to Battle Hymn, at the far west). The third mace cluster, with Weight of Iron (stun) and Crushing Blow (crit).",
      at: [-2540, -20],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [maceDamage(12)],
          at: [-2527, 104],
          why: "The entrance, from the rampart's junction.",
        },
        { id: 'b', kind: 'small', lines: [maceDamage(12)], at: [-2533, 50] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Hallowed Hammer',
          lines: [maceDamage(20), eleAttack(20)],
          at: [-2540, -20],
          why: '1.4 + 2 units.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [maceDamage(12)],
          at: [-2547, -90],
          why: "The far small, facing the Cathedral's sceptre road.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
      ],
    },
    {
      id: 'banner',
      name: "Warlord's Banner",
      why: "Reduced mana reservation twice, then the notable with reservation, armour and mana: the Vanguard's standards, as a chain from the north hub toward the Zealot. The Wall's only reservation lines, and the Cathedral's way in.",
      at: [-1170, -60],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [reducedReservation(3)], at: [-1080, 80] },
        { id: 'b', kind: 'small', lines: [reducedReservation(3)], at: [-1160, -80] },
        {
          id: 'n',
          kind: 'notable',
          name: "Warlord's Banner",
          lines: [reducedReservation(5), armour(16), manaFlat(30)],
          at: [-1250, -230],
          why: '1.7 + 1.3 + 1.5 units.',
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
      from: 'star.c',
      to: 'wall.rampart.toWind.a',
      why: "The chaos spoke lands on the rampart road's node, straight on from the star (G2, 2026-10-22; it landed on Second Wind, which went south).",
    },
    {
      from: 'wall.rampart.j1.a',
      to: 'hammer.a',
      why: "The rampart's junction north onto Hallowed Hammer.",
    },
    {
      from: 'wall.rampart.j1.a',
      to: 'wall.rampart.toStar.a',
      why: 'Strength once between the rampart junction and the resist star.',
    },
    { from: 'wall.rampart.toStar.a', to: 'wall.resists.star.f', why: 'The far end of the road.' },
    { from: 'star.w', to: 'scarTissue.a', why: 'The cold spoke lands on Scar Tissue.' },
    { from: 'star.l', to: 'j.a', why: 'The lightning spoke lands on the crossing junction.' },
    {
      from: 'j.a',
      to: 'scarTissue.a',
      why: 'Junction to the maximum-resistance room: its second door.',
    },
    {
      from: 'hammer.c',
      to: 'cathedral.rods.toWall.a',
      why: "Maces and sceptres (a near crossing; G1-brief.md §2.3, laid in the G2 border pass): Hallowed Hammer's far small onto the Cathedral's Vestry road, in the chain's own line. The sceptre fighter reaches Hallowed Hammer's elemental attacks; the mace player reaches the Vestry road and Gilded Rod. Hallowed Hammer stops being a dead-end pocket. It is 6 steps from the Zealot's armoured sceptre cluster (G3), which lands on the Battlements junction instead.",
    },
  ],
};
