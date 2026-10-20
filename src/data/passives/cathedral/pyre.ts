/**
 * The Bell Tower (the tip, out toward the Wall past the vestry): the wheel (cold with attacks on its north side since
 * round 3, an aura on its south since 2026-10-20, elemental damage at the ends), the tower junction, and Searing Avatar
 * at the tip, the farthest keystone of the region. The id `cathedral.pyre` predates the change and is kept. Round 3
 * (2026-10-20): Kindled Steel (fire strikes) went out to the Ambulatory and Rimed Steel (cold strikes) came here, because
 * Gilded Rod, Kindled Steel and Searing Avatar were one corridor that the fire sceptre walked without a choice.
 */
import {
  auraEffect,
  chillEffect,
  eleAttackOne,
  eleDamage,
  eleDamageAll,
  es,
  int,
  lifeRegen,
  str,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const pyre: AreaSpec = {
  id: 'cathedral.pyre',
  region: 'zealot',
  name: 'The Bell Tower',
  why: 'The tip toward the Wall: cold attacks or an aura on one wheel, and Searing Avatar.',
  at: [-3321, -1139], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'wheel',
      name: 'Rimed Steel',
      why: "The wheel of eight at the tower: cold with attacks on the north side (Rimed Steel), an aura on the south (Benediction, the Zealot's second aura; Choirmaster is the first), elemental damage at the ends. The fire sceptre walks through on its way to Searing Avatar and finds cold strikes here, which the keystone half undoes: its fire strike (Kindled Steel) is out on the Ambulatory, a separate trip. The fire spell is back at the nave.",
      at: P(2250, -550),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'f1',
          kind: 'small',
          lines: [eleDamageAll(10)],
          at: P(2029, -550),
          why: 'The west entrance; the dear road from the Wall also arrives.',
        },
        {
          id: 'f2',
          kind: 'small',
          lines: [eleAttackOne('cold', 12)],
          at: P(2140, -741),
          why: 'The attack side.',
        },
        {
          id: 'f3',
          kind: 'notable',
          name: 'Rimed Steel',
          lines: [eleAttackOne('cold', 24), chillEffect(15)],
          at: P(2361, -741),
          why: 'Cold strikes that chill: 2 + 1.5 units. The first cold home outside the Spire, whose cold is all spells.',
        },
        {
          id: 'f4',
          kind: 'small',
          lines: [eleDamageAll(10)],
          at: P(2471, -550),
          why: 'The east exit, to the tower junction.',
        },
        {
          id: 'f5',
          kind: 'notable',
          name: 'Benediction',
          lines: [auraEffect(12), es(8), lifeRegen(0.4)],
          at: P(2361, -359),
          why: 'Aura effect with shield and regeneration: 2 + 1.6 + 1 units.',
        },
        {
          id: 'f6',
          kind: 'small',
          lines: [auraEffect(6)],
          at: P(2140, -359),
          why: 'The aura side.',
        },
        { id: 'f7', kind: 'small', lines: [eleAttackOne('cold', 12)], at: P(2458, -670) },
        { id: 'f8', kind: 'small', lines: [auraEffect(6)], at: P(2458, -430) },
      ],
      links: [
        ['f1', 'f2'],
        ['f2', 'f3'],
        ['f3', 'f7'],
        ['f7', 'f4'],
        ['f4', 'f8'],
        ['f8', 'f5'],
        ['f5', 'f6'],
        ['f6', 'f1'],
      ],
    },
    {
      id: 'jF',
      name: 'Tower junction',
      why: 'The tip of the tower: the Searing Avatar spur.',
      at: P(2600, -550),
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [str(6), int(6)], at: P(2600, -550) }],
      links: [],
    },
    {
      id: 'searingAvatar',
      name: 'Searing Avatar',
      why: "Two nodes of fire damage, then the trade: half of physical, cold and lightning damage becomes fire, and nothing else is dealt. The tip of the bell tower, the farthest keystone of the region, on the Wall side where the fire two-hander reaches it (brief §6 puts it at the tower's tip; the cost table agrees).",
      at: P(2920, -750),
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [eleDamage('fire', 10)], at: P(2760, -650) },
        { id: 'b', kind: 'small', lines: [eleDamage('fire', 10)], at: P(2920, -750) },
        { id: 'k', kind: 'keystone', name: 'Searing Avatar', lines: [], at: P(3080, -850) },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
  ],
  links: [
    { from: 'wheel.f4', to: 'jF.a', why: 'Through the wheel to the tower junction.' },
    { from: 'jF.a', to: 'searingAvatar.a', why: 'Junction to the keystone spur.' },
  ],
};
