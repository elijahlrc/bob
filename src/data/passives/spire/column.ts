/**
 * The column (the Spire's middle): the junction where the well and the craft meet, the resist star as the column's
 * spine (its south spoke on the junction, its west and east spokes on the two shape clusters, its north spoke on the
 * fork), the area and projectile clusters either side, and two bridges into the arms that skip the fork: the Withering
 * chain (damage over time, chaos) from the area cluster to the west arm, and the Lingering chain (duration, cold damage
 * over time) from the projectile cluster to the east arm.
 */
import {
  avoidAilments,
  castSpeed,
  chaosDot,
  dotDamage,
  int,
  projectileSpeed,
  resAll,
  resOne,
  skillDuration,
  spellArea,
  spellAreaDamage,
  spellProjectile,
} from '../lines';
import type { AreaSpec } from '../types';

export const column: AreaSpec = {
  id: 'spire.column',
  region: 'mystic',
  name: 'The Column',
  why: 'Every spell is an area or a projectile; the column sells the shape before the fork sells the element, and the resist star up its middle is the plain way through for a caster who wants neither yet.',
  at: [0, -3101], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'j1',
      name: 'Junction',
      why: 'Where the well and the craft meet above the base: a loop, so neither road is a dead choice. Forks to the two shape clusters and to the star.',
      at: [0, -2560],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [0, -2560] }],
      links: [],
    },
    {
      id: 'star',
      name: 'Prism Ward',
      why: "The resist star: all resistances and ailment avoidance in the notable, one single-node spoke per element, each landing somewhere else: south on the junction, west on the area cluster, east on the projectile cluster, north on the fork. The column's spine: a caster who wants resistances walks straight up it.",
      at: [0, -2850],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n',
          kind: 'notable',
          name: 'Prism Ward',
          lines: [resAll(8), avoidAilments(20)],
          at: [0, -2850],
          why: '2 + 2 units.',
        },
        {
          id: 's',
          kind: 'small',
          lines: [resOne('fire', 10)],
          at: [0, -2700],
          why: 'The fire spoke, to the junction.',
        },
        {
          id: 'w',
          kind: 'small',
          lines: [resOne('cold', 10)],
          at: [-120, -2800],
          why: 'The cold spoke, to the area cluster.',
        },
        {
          id: 'e',
          kind: 'small',
          lines: [resOne('lightning', 10)],
          at: [120, -2800],
          why: 'The lightning spoke, to the projectile cluster.',
        },
        {
          id: 'f',
          kind: 'small',
          lines: [resOne('chaos', 10)],
          at: [0, -3000],
          why: 'The chaos spoke, to the fork.',
        },
      ],
      links: [
        ['n', 's'],
        ['n', 'w'],
        ['n', 'e'],
        ['n', 'f'],
      ],
    },
    {
      id: 'broadWeave',
      name: 'Broad Weave',
      why: "Spell area: radius and area damage, tagged spell so the Wall's slams do not shop here. West of the column, reached from the junction, the star's cold spoke and the Siphon chain; passed through to the fork and onto the Withering chain.",
      at: [-300, -2850],
      shape: { kind: 'ring', r: 105, a0: 60 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [spellArea(8)],
          why: "The entrance, south-east, where the Siphon chain and the star's spoke also arrive.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Broad Weave',
          lines: [spellArea(16), spellAreaDamage(12), int(10)],
          why: '2 + 1.5 + 0.7 units.',
        },
        { id: 'b', kind: 'small', lines: [spellArea(8)], why: 'Where the Withering chain leaves.' },
        { id: 'c', kind: 'small', lines: [spellArea(8)], why: 'The north exit, to the fork.' },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
        ['b', 'c'],
        ['c', 'a'],
      ],
    },
    {
      id: 'dartingBolts',
      name: 'Darting Bolts',
      why: "Spell projectiles: damage, speed, cast speed. East of the column, reached from the junction and the star's lightning spoke; passed through to the fork and onto the Lingering chain.",
      at: [330, -2850],
      shape: { kind: 'ring', r: 120, a0: 90 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [spellProjectile(10)],
          why: "The entrance, south, where the star's spoke also arrives.",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Darting Bolts',
          lines: [spellProjectile(20), projectileSpeed(10), castSpeed(4)],
          why: '2 + 1 + 1 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [spellProjectile(10)],
          why: 'Where the Lingering chain leaves.',
        },
        { id: 'c', kind: 'small', lines: [spellProjectile(10)], why: 'The east side.' },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
        ['b', 'c'],
        ['c', 'a'],
      ],
    },
    {
      id: 'withering',
      name: 'Withering',
      why: "Damage over time, then the notable with damage over time and the chaos damage over time multiplier: for the Mystic's plague spells, as a chain from the area cluster to the west arm's first cluster. A second way into the west arm. Cold over time is on the other side of the column (Lingering), so the frost-ground caster and the plague caster do not share a chain.",
      at: [-520, -3130],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [dotDamage(10)], at: [-470, -3060] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Withering',
          lines: [dotDamage(20), chaosDot(10)],
          at: [-560, -3200],
          why: '2 + 1.6 units.',
        },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'lingering',
      name: 'Lingering',
      why: "Skill effect duration, then the notable with duration and the cold damage over time multiplier: for the Mystic's frozen ground and other duration spells, as a chain from the projectile cluster to the east arm's first cluster. A second way into the east arm.",
      at: [520, -3130],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [skillDuration(10)], at: [470, -3060] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Lingering',
          lines: [skillDuration(16), dotDamage(16)],
          at: [560, -3200],
          why: "Longer effects and the damage that ticks through them: 1.6 + 1.6 units. Cold's own lines are on the arms.",
        },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'fork',
      name: 'The parting',
      why: 'The element decision: fire north-west, cold north, lightning north-east. An attribute node; the arms are joined again a few steps up (brief §2), and the bridges from the shape clusters reach the outer arms without it, so the choice is a cost, not a wall.',
      at: [0, -3130],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [0, -3130] }],
      links: [],
    },
    {
      id: 'roadW',
      name: 'The west climb',
      why: 'Intelligence twice: the road from the fork up to the Lantern arm.',
      at: [-186, -3209],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [int(7)], at: [-186, -3209] },
        { id: 'b', kind: 'attribute', lines: [int(7)], at: [-373, -3288] },
      ],
      links: [['a', 'b']],
    },
    {
      id: 'roadE',
      name: 'The east climb',
      why: 'Intelligence twice: the road from the fork up to the Gallery arm.',
      at: [186, -3209],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [int(7)], at: [186, -3209] },
        { id: 'b', kind: 'attribute', lines: [int(7)], at: [373, -3288] },
      ],
      links: [['a', 'b']],
    },
  ],
  links: [
    { from: 'j1.a', to: 'star.s', why: "Junction to the star's fire spoke: the spine." },
    { from: 'star.w', to: 'broadWeave.a', why: "The star's cold spoke to the area cluster." },
    {
      from: 'star.e',
      to: 'dartingBolts.a',
      why: "The star's lightning spoke to the projectile cluster.",
    },
    {
      from: 'star.f',
      to: 'fork.a',
      why: "The star's chaos spoke to the fork: the spine reaches the arms.",
    },
    { from: 'j1.a', to: 'broadWeave.a', why: 'Junction to the area cluster.' },
    { from: 'j1.a', to: 'dartingBolts.a', why: 'Junction to the projectile cluster.' },
    { from: 'broadWeave.c', to: 'fork.a', why: 'The area cluster to the fork.' },
    {
      from: 'dartingBolts.n',
      to: 'fork.a',
      why: 'The projectile cluster to the fork, from its notable.',
    },
    { from: 'broadWeave.b', to: 'withering.a', why: 'The area cluster onto the Withering chain.' },
    {
      from: 'withering.n',
      to: 'spire.fire.hoarfrost.a',
      why: 'The Withering chain lands on the west arm.',
    },
    {
      from: 'dartingBolts.b',
      to: 'lingering.a',
      why: 'The projectile cluster onto the Lingering chain.',
    },
    {
      from: 'lingering.n',
      to: 'spire.storm.flashpoint.a',
      why: 'The Lingering chain lands on the east arm.',
    },
    {
      from: 'spire.column.fork.a',
      to: 'spire.column.roadW.a',
      why: 'Intelligence twice: the road from the fork up to the Lantern arm.',
    },
    { from: 'spire.column.roadW.b', to: 'spire.fire.hoarfrost.a', why: 'The far end of the road.' },
    { from: 'fork.a', to: 'spire.frost.thunderhead.a', why: 'The middle arm.' },
    {
      from: 'spire.column.fork.a',
      to: 'spire.column.roadE.a',
      why: 'Intelligence twice: the road from the fork up to the Gallery arm.',
    },
    {
      from: 'spire.column.roadE.b',
      to: 'spire.storm.flashpoint.a',
      why: 'The far end of the road.',
    },
  ],
};
