/**
 * The Battlements: The north border: totems, resistances, auras, elemental maces, the Cathedral seam.
 * Written for the attrition rework from docs/tree/design/R-wall.md (2026-10-31).
 */
import {
  auraEffect,
  costReduction,
  eleAttack,
  lifeRegenPerGrit,
  maceDamage,
  manaFlat,
  manaOnHit,
  reducedReservation,
  resAll,
  str,
  stunAvoid,
  totemDamage,
} from '../lines';
import type { AreaSpec } from '../types';

export const resists: AreaSpec = {
  id: 'wall.resists',
  region: 'vanguard',
  name: 'The Battlements',
  why: "The north border: totems, resistances, auras, elemental maces, the Cathedral seam. (The Unbroken and Tempered wheel, the keep, moved to the axis cell in the revision and is written in the Bulwark's file since the finalization, 2026-10-31.)",
  at: [-2497, 131],
  clusters: [
    {
      id: 'radW',
      name: 'The south border road',
      why: 'From the Cathedral seam out along the border to the mid ring: the ground between the two regions beyond the starts.',
      at: [-2033, 0],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [str(7)], at: [-2033, 0] },
        { id: 'b', kind: 'attribute', lines: [str(7)], at: [-2467, 0] },
        { id: 'm', kind: 'attribute', lines: [str(7)], at: [-2900, 0] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'm'],
      ],
    },
    {
      id: 'ironLungs',
      name: 'Deep Lungs',
      why: 'Mana from melee, off the north border road.',
      at: [-2070, 199],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [manaOnHit(4, ['melee'])], at: [-2057, 129] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Deep Lungs',
          lines: [manaOnHit(8), costReduction(8)],
          at: [-2089, 198],
          why: 'Mana from melee and cheaper blows (unlike the Yard’s mana on hit with leech).',
        },
        { id: 'b', kind: 'small', lines: [manaOnHit(4, ['melee'])], at: [-2064, 270] },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'banner',
      name: "Warlord's Banner",
      why: 'Auras, shared with the Cathedral, off the north border road (step 9).',
      at: [-2476, 260],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [reducedReservation(3)], at: [-2474, 200] },
        { id: 'b', kind: 'small', lines: [reducedReservation(3)], at: [-2476, 255] },
        {
          id: 'n',
          kind: 'notable',
          name: "Warlord's Banner",
          lines: [reducedReservation(5), auraEffect(8), manaFlat(30)],
          at: [-2479, 325],
          why: '1.7 + 1.3 + 1.5 units: what an aura carrier wants from a banner, reserving less and the aura stronger.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'posts',
      name: 'Graven Posts',
      why: 'Totems with resistances, out from the mid ring’s north stretch, toward the Cathedral’s totems.',
      at: [-3173, 418],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [totemDamage(12)], at: [-3113, 419] },
        { id: 'b', kind: 'small', lines: [totemDamage(12)], at: [-3168, 418] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Graven Posts',
          lines: [totemDamage(29), resAll(7)],
          at: [-3238, 417],
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'hammer',
      name: 'Hallowed Hammer',
      why: 'Elemental maces, the Cathedral seam’s theme, in from the mid ring’s north stretch.',
      at: [-2692, 212],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [maceDamage(14)], at: [-2745, 289] },
        { id: 'b', kind: 'small', lines: [maceDamage(14)], at: [-2714, 244] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Hallowed Hammer',
          lines: [maceDamage(24), eleAttack(24)],
          at: [-2674, 186],
        },
        { id: 'c', kind: 'small', lines: [maceDamage(14)], at: [-2635, 128] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
      ],
    },
    {
      id: 'spirit',
      name: 'Bulwark Spirit',
      why: 'Grit-shaped sustain at the Cathedral border: every charge mends.',
      at: [-2903, 264],
      shape: { kind: 'hand' },
      nodes: [
        { id: 's1', kind: 'small', lines: [stunAvoid(10)], at: [-2901, 88] },
        { id: 's2', kind: 'small', lines: [stunAvoid(10)], at: [-2902, 176] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Bulwark Spirit',
          lines: [lifeRegenPerGrit(0.4), stunAvoid(30)],
          at: [-2903, 264],
          why: 'Grit-shaped sustain at the Cathedral border: every charge mends.',
        },
      ],
      links: [
        ['s1', 's2'],
        ['s2', 'n'],
      ],
    },
  ],
  links: [
    { from: 'wall.resists.ironLungs.a', to: 'wall.resists.radW.a', why: 'The way in.' },
    { from: 'wall.resists.banner.a', to: 'wall.resists.radW.b', why: 'The way in.' },
    {
      from: 'wall.resists.banner.n',
      to: 'wall.resists.hammer.c',
      why: "A way across inside the mid ring (2026-10-31): Warlord's Banner into Hallowed Hammer's far small, the holy warrior's kit at the Cathedral border, slower than the road between their doors. Who walks it: the aura bearer who swings an elemental mace, Vanguard or Zealot.",
    },
    { from: 'wall.resists.posts.a', to: 'wall.rampart.ring.a', why: 'The way in.' },
    { from: 'wall.resists.hammer.a', to: 'wall.rampart.ring.a', why: 'The way in.' },
    { from: 'wall.resists.spirit.s1', to: 'wall.resists.radW.m', why: 'The way in.' },
  ],
};
