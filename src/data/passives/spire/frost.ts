/**
 * The middle arm of the Spire (straight up): Thunderhead (lightning with cast speed), then Shatter (cold as freeze and
 * penetration), then Fever Pitch at the top (critical strike multiplier fixed at 100%; 40% more elemental damage for 8 s
 * after a critical strike), the farthest keystone of the region. The two inter-arm junctions hang off the first cluster,
 * and Prismatic Balance (the two-element keystone) runs from the west one toward the burning room.
 * Harsh Weather is a dead-end chain off Shatter, and the Prismatic spur is a spur (both 2026-10-20). Since 2026-10-20 the arm
 * is a place, not the cold arm (see `fire.ts`); the id `spire.frost` is kept. G2 (2026-10-22): Siphon moved here from
 * the Cloister as a bridge from the east join to the arm's junction, and Snare Line became a bridge onto the Eaves (`rim.ts`).
 */
import {
  ailmentEffect,
  castSpeed,
  channelDamage,
  costReduction,
  eleDamage,
  eleDamageAll,
  esLeech,
  esOnHit,
  freezeChance,
  freezeDuration,
  int,
  manaOnKill,
  penetration,
  shockChance,
  shockDuration,
  skillDuration,
  trapDamage,
} from '../lines';
import type { AreaSpec } from '../types';

export const frost: AreaSpec = {
  id: 'spire.frost',
  region: 'mystic',
  name: 'The Belfry',
  why:
    'The middle arm, the one both others are joined to, and the top of the Spire: lightning for the quick caster first, cold as the big ' +
    'frozen hit second, and the crit keystone above them. The two-element keystone sits on the west join.',
  at: [-120, -3920], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'thunderhead',
      name: 'Thunderhead',
      why: "Lightning with cast speed and a chance to shock: the quick lightning caster's cluster, the first of the middle arm, with the two inter-arm junctions off its sides. The other lightning cluster (Overcharge, east) sells shock effect and penetration; this one sells speed.",
      at: [0, -3450],
      shape: { kind: 'ring', r: 56, a0: 90 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [eleDamage('lightning', 10)],
          why: 'The entrance, from the fork.',
        },
        {
          id: 'w',
          kind: 'small',
          lines: [eleDamage('lightning', 10)],
          why: 'The west side, to the west join.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Thunderhead',
          lines: [eleDamage('lightning', 16), castSpeed(5), shockChance(10)],
          why: '1.6 + 1.25 + 1 units. The north exit.',
        },
        {
          id: 'e',
          kind: 'small',
          lines: [eleDamage('lightning', 10)],
          why: 'The east side, to the east join.',
        },
      ],
      links: [
        ['a', 'w'],
        ['w', 'n'],
        ['n', 'e'],
        ['e', 'a'],
      ],
    },
    {
      id: 'jFire',
      name: 'West join',
      why: 'The inter-arm junction to the west arm, and the foot of the Prismatic Balance spur.',
      at: [-330, -3620],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [-330, -3620] }],
      links: [],
    },
    {
      id: 'jStorm',
      name: 'East join',
      why: 'The inter-arm junction to the east arm.',
      at: [330, -3620],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [330, -3620] }],
      links: [],
    },
    {
      id: 'prismatic',
      name: 'Prismatic Balance',
      why: "Three nodes of elemental damage, then the trade: hits give +25% to the hit's elements and -50% to the others for 5 s. Only a two-element rotation profits, which is why it runs from the fire join toward the ignite room, with a way in from each.",
      at: [-480, -3780],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [eleDamageAll(8)], at: [-745, -3962] },
        { id: 'b', kind: 'small', lines: [eleDamageAll(8)], at: [-790, -3999] },
        {
          id: 'c',
          kind: 'small',
          lines: [eleDamageAll(8)],
          at: [-834, -4036],
          why: 'Where the ignite room arrives.',
        },
        { id: 'k', kind: 'keystone', name: 'Prismatic Balance', lines: [], at: [-900, -4090] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'k'],
      ],
    },
    {
      id: 'jArm',
      name: 'Junction',
      why: "The arm's junction above the first cluster: the shatter room, and the top spur.",
      at: [0, -3800],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [0, -3800] }],
      links: [],
    },
    {
      id: 'shatter',
      name: 'Shatter',
      why: 'Freeze chance, cold penetration and cold damage: cold as the big hit that stops a rare, under the crit keystone. The other cold cluster (Hoarfrost, west) is the safe one with a shield; this one is the dangerous one. Passed through, up to the top spur.',
      at: [0, -4080],
      shape: { kind: 'ring', r: 56, a0: 90 },
      nodes: [
        { id: 'a', kind: 'small', lines: [freezeChance(5)], why: 'The entrance, south.' },
        { id: 'b', kind: 'small', lines: [freezeChance(5)] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Shatter',
          lines: [eleDamage('cold', 12), freezeChance(10), penetration('cold', 4)],
          why: '1.2 + 1.25 + 2 units. The north exit.',
        },
        { id: 'c', kind: 'small', lines: [freezeChance(5)] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
        ['c', 'a'],
      ],
    },
    {
      id: 'harshWeather',
      name: 'Harsh Weather',
      why: "Effect of non-damaging ailments twice, then the notable with effect, freeze duration and shock duration: the chill, freeze and shock caster, as a dead-end chain off the shatter room's east side. Until 2026-10-20 it ran on to Overcharge, which put two notables a shock caster wants both of a step apart.",
      at: [480, -4000],
      shape: { kind: 'ring', r: 90, a0: 180 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [ailmentEffect(10)],
          why: 'The entrance, facing the shatter room.',
          at: [407, -3972],
        },
        { id: 'b', kind: 'small', lines: [ailmentEffect(10)], at: [461, -3949] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Harsh Weather',
          lines: [ailmentEffect(20), freezeDuration(15), shockDuration(15)],
          why: '2 + 1 + 1 units. The tip of the chain.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'feverPitch',
      name: 'Fever Pitch',
      why: 'Two nodes of elemental damage, then the trade: critical strike multiplier fixed at 100%, and 40% more elemental damage for 8 s after a critical strike. The top of the Spire, the farthest keystone of the region (it was three smalls; the walk from the start was already twenty points).',
      at: [0, -4330],
      shape: { kind: 'line', heading: -90, gap: 145 },
      nodes: [
        { id: 'a', kind: 'small', lines: [eleDamageAll(8)], at: [56, -4489] },
        { id: 'b', kind: 'small', lines: [eleDamageAll(8)], at: [33, -4542] },
        { id: 'k', kind: 'keystone', name: 'Fever Pitch', lines: [] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
    {
      id: 'toShatter',
      name: 'The west climb to Shatter',
      why: "Two intelligence nodes from the Lantern junction up to Shatter's west side: the top of the Spire, Shatter and Fever Pitch had one way in, through Thunderhead.",
      at: [-255, -3773],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'r1', kind: 'attribute', lines: [int(7)], at: [-255, -3773] },
        { id: 'r2', kind: 'attribute', lines: [int(7)], at: [-180, -3927] },
      ],
      links: [['r1', 'r2']],
    },
    {
      id: 'toOvercharge',
      name: 'The east climb to Overcharge',
      why: "One intelligence node from the tip of Harsh Weather to Overcharge's far small: Harsh Weather is a bridge again, four steps from Overcharge, not one.",
      at: [743, -4041],
      shape: { kind: 'hand' },
      nodes: [{ id: 'r1', kind: 'attribute', lines: [int(7)], at: [743, -4041] }],
      links: [],
    },
    {
      id: 'toHarsh',
      name: 'A road',
      why: 'Intelligence once between Shatter and Harsh Weather.',
      at: [248, -4040],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [248, -4040] }],
      links: [],
    },
    {
      id: 'snare',
      name: 'Snare Line',
      why: "A chain outward off Harsh Weather's climb to Overcharge: trap damage twice, then traps with duration. The caster's trap, for a spell set as a trap and the traps that last; the Docks' Trapper sells traps with area and the Strider's Tripwire traps with throwing speed and cooldown. Round 4 (2026-10-20). Since G2 (2026-10-22) its notable leads on to the Eaves road (`rim.ts`), so the chain is a bridge from Harsh Weather's climb to the rim.",
      at: [960, -4225],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [trapDamage(12)], at: [982, -4243] },
        { id: 'b', kind: 'small', lines: [trapDamage(12)], at: [1026, -4280] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Snare Line',
          lines: [trapDamage(24), skillDuration(15)],
          at: [1080, -4325],
          why: '2 + 1.5 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'siphon',
      name: 'Siphon',
      why: "Energy shield on hit, then the notable with shield leech, shield on hit and mana on kill: the caster's recovery from hitting, which no other Spire node sells. Moved here from the Cloister in G2 (2026-10-22, G1/mystic.md MY-m2): it sat three steps from Glass Skin and Quickening, a one-stop for the shield caster; here it is a bridge from the east join to the Belfry's junction, beside Thunderhead's cast speed and under the shock and freeze: the casters who hit often. Laid on the straight line between its two ends, the notable in the middle, so the small G3 adds on the junction side mirrors this one.",
      at: [165, -3710],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [esOnHit(4)],
          at: [226, -3676],
          why: 'The entrance, from the east join.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Siphon',
          lines: [esLeech(0.8), esOnHit(6), manaOnKill(10)],
          at: [165, -3710],
          why: "2 + 1.5 + 1 units. The exit, to the arm's junction.",
        },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'stream',
      name: 'Steady Stream',
      why: "A pocket outward off the road to Shatter: damage with channelling skills twice, then channelling with cheaper mana. The channelled spell drinks mana for as long as it is held; the Fosse's Ceaseless Blades sells channelling to attackers, with speed and footing. Round 4 (the user approved channelling as two notables, 2026-10-20).",
      at: [-326, -4166],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [channelDamage(10)], at: [-337, -4185] },
        { id: 'b', kind: 'small', lines: [channelDamage(10)], at: [-368, -4234] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Steady Stream',
          lines: [channelDamage(20), costReduction(6)],
          at: [-404, -4294],
          why: '2 + 1.5 units.',
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
      from: 'toShatter.r2',
      to: 'stream.a',
      why: 'The road to Shatter onto the channelled spells.',
    },
    {
      from: 'toOvercharge.r1',
      to: 'snare.a',
      why: "Harsh Weather's climb onto the caster's trap.",
    },
    {
      from: 'feverPitch.a',
      to: 'toHarsh.a',
      why: 'Fever Pitch hangs off the road node between Shatter and Harsh Weather, so a lightning or fire crit build reaches it without buying Shatter (build audit 2026-10-20).',
    },
    {
      from: 'spire.frost.harshWeather.b',
      to: 'spire.frost.toOvercharge.r1',
      why: "One intelligence node from the tip of Harsh Weather to Overcharge's far small: Harsh Weather is a bridge again, four steps from Overcharge, not one.",
    },
    {
      from: 'spire.frost.toOvercharge.r1',
      to: 'spire.storm.overcharge.b',
      why: 'The far end of the road.',
    },
    {
      from: 'spire.frost.jFire.a',
      to: 'spire.frost.toShatter.r1',
      why: "Two intelligence nodes from the Lantern junction up to Shatter's west side: the top of the Spire, Shatter and Fever Pitch had one way in, through Thunderhead.",
    },
    {
      from: 'spire.frost.toShatter.r2',
      to: 'spire.frost.shatter.b',
      why: 'The far end of the road.',
    },
    {
      from: 'thunderhead.w',
      to: 'jFire.a',
      why: "The first cluster's west side to the west join.",
    },
    {
      from: 'thunderhead.e',
      to: 'jStorm.a',
      why: "The first cluster's east side to the east join.",
    },
    { from: 'jFire.a', to: 'prismatic.a', why: 'The fire join to the Prismatic Balance spur.' },
    {
      from: 'jStorm.a',
      to: 'spire.storm.flashpoint.c',
      why: 'The inter-arm link to the east arm.',
    },
    { from: 'thunderhead.n', to: 'jArm.a', why: "Up through the notable to the arm's junction." },
    {
      from: 'jStorm.a',
      to: 'siphon.a',
      why: 'The east join onto Siphon (G2, MY-m2): the quick caster coming up the east arm reaches the recovery from hitting without Thunderhead.',
    },
    {
      from: 'siphon.n',
      to: 'jArm.a',
      why: "Siphon onto the arm's junction: a bridge, so the junction has a way in from the east join that is not Thunderhead's notable.",
    },
    { from: 'jArm.a', to: 'shatter.a', why: 'Junction to the shatter room.' },
    {
      from: 'spire.frost.shatter.c',
      to: 'spire.frost.toHarsh.a',
      why: 'Intelligence once between Shatter and Harsh Weather.',
    },
    {
      from: 'spire.frost.toHarsh.a',
      to: 'spire.frost.harshWeather.a',
      why: 'The far end of the road.',
    },
  ],
};
