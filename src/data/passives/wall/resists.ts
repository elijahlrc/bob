/**
 * The Battlements (the Wall's north, on the Cathedral border): the resist star, a notable with four single-node spokes
 * that land in four different places (the rampart's junction, the rampart road, Scar Tissue, the Cathedral crossing
 * junction); Scar Tissue (grit when hit; it swapped with Tempered on 2026-10-20) at the end of a short chain beside the
 * dear crossing from the fire tower; the crossing junction; the Warlord's Banner chain (reservation, aura effect, mana)
 * from the north hub toward the Zealot; and, since G2 (2026-10-22), Hallowed Hammer off the rampart's junction. G3
 * (2026-10-22): the Banner traded its armour for aura effect, so it is the standard its name says and nothing more.
 * G3 round 3: Graven Posts (totem damage, resistances), a chain from Hallowed Hammer's middle small west to Stagger.
 */
import {
  auraEffect,
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
  totemDamage,
} from '../lines';
import type { AreaSpec } from '../types';

export const resists: AreaSpec = {
  id: 'wall.resists',
  region: 'vanguard',
  name: 'The Battlements',
  why: "The Wall's north, on the Cathedral border: the resist star as the connector, the Warlord's Banner chain toward the Zealot, Scar Tissue at the tip where the Cathedral's fire two-hander arrives, and Hallowed Hammer on the west, where maces meet the Cathedral's sceptres.",
  at: [-2000, 110], // Where the area's name is drawn: clear of every other area's name (label pass, round 4); moved south in G3 (2026-10-22) off Elemental Ward and Scar Tissue, between the star's south spokes and the Rampart.
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
          lines: [maceDamage(14)],
          at: [-2527, 104],
          why: "The entrance, from the rampart's junction.",
        },
        { id: 'b', kind: 'small', lines: [maceDamage(14)], at: [-2533, 50] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Hallowed Hammer',
          lines: [maceDamage(20), eleAttack(20)],
          at: [-2540, -20],
          why: '1.4 + 2 units. Its smalls are one unit each, 14% (12% until G4 fix 1, 2026-10-22).',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [maceDamage(14)],
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
      id: 'posts',
      name: 'Graven Posts',
      why: "Totem damage twice, then the notable with totem damage and all resistances: a chain west off Hallowed Hammer's middle small, under the battlements, that goes on to Stagger at the tower's top (G3 round 3, 2026-10-22; added beyond the brief because the warcry and totem build held both Vanguard totem clusters by 120 points: the specialization ran out of supply, not of reach). The third direction for the Vanguard's totems: Standing Cairns (damage with area) is south-east by the Quarry, Long Watch (speed and duration) west-south-west by Iron Liturgy, and this is north-west, on the side of the Cathedral's totem keystone across the border, so a totem build that comes here leaves the Barrows' warcries behind. The way from the home passes Iron Lungs or Elemental Ward, notables of other kinds. The partner is the totem player's ward, standing back while the posts fight.",
      at: [-2670, 70],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [totemDamage(12)],
          at: [-2610, 63],
          why: "The entrance, from Hallowed Hammer's middle small.",
        },
        { id: 'b', kind: 'small', lines: [totemDamage(12)], at: [-2664, 72] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Graven Posts',
          lines: [totemDamage(24), resAll(6)],
          at: [-2733, 83],
          why: "2 + 1.5 units: 3.5. On the straight line from Hallowed Hammer's small to Stagger's, so the chain is a bridge between the mace chain and the tower's top.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'banner',
      name: "Warlord's Banner",
      why: "Reduced mana reservation twice, then the notable with reservation, aura effect and mana: the Vanguard's standards, as a chain from the north hub toward the Zealot, its two smalls beside the notable on the line toward the hub (G4 fix 1, 2026-10-22: they were strung 180 apart along the seam and read as a road). The Wall's only reservation lines, and the Cathedral's way in. Its armour went in G3 (2026-10-22): a notable three steps from the Zealot start and five from the Vanguard's sold reservation, armour and mana, three themes, and armour this near two starts is strength by the back door.",
      at: [-1170, -60],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [reducedReservation(3)], at: [-1194, -118] },
        { id: 'b', kind: 'small', lines: [reducedReservation(3)], at: [-1219, -167] },
        {
          id: 'n',
          kind: 'notable',
          name: "Warlord's Banner",
          lines: [reducedReservation(5), auraEffect(8), manaFlat(30)],
          at: [-1250, -230],
          why: '1.7 + 1.3 + 1.5 units: what an aura carrier wants from a banner, reserving less and the aura stronger.',
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
    {
      from: 'hammer.b',
      to: 'posts.a',
      why: "Hallowed Hammer's middle small west onto the totem chain, near a right angle to the mace chain: the totems are reached through a mace small, not through the mace notable.",
    },
    {
      from: 'posts.n',
      to: 'wall.rampart.stagger.a',
      why: "Graven Posts on west to Stagger's first small, in the chain's own line: the totems are a bridge, not a dead end, and the tower's top meets Hallowed Hammer without the rampart's junction. Stagger stays 14 steps from the Vanguard start.",
    },
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
