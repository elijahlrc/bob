/**
 * The west arm of the Spire (north-west, toward the Cathedral). Since 2026-10-20 the arms are places, not elements: each
 * element appears twice in the Spire, in two different arms and with a different partner, so an element build picks
 * which partner it wants and pays to cross for the other. Here: cold with energy shield (Hoarfrost), the minion chain
 * from the well, and fire as burning (Cinder) at the arm's end beside the two-element keystone. The other fire cluster
 * (Flashpoint, fire with crit) is in the east arm; the other cold one (Shatter) is at the top.
 * The id `spire.fire` predates the change and is kept (ids are stable).
 */
import {
  burnDamage,
  chillEffect,
  eleDamage,
  es,
  igniteChance,
  igniteFaster,
  int,
  minionDamage,
  minionLife,
  spellDamage,
  str,
} from '../lines';
import type { AreaSpec } from '../types';

export const fire: AreaSpec = {
  id: 'spire.fire',
  region: 'mystic',
  name: 'The Lantern',
  why:
    "The arm toward the Cathedral: a careful cold caster's shield, the Spire's minions, and the slow fire of the burn. " +
    "The dear crossing from the Cathedral's crypt lands on the minion notable.",
  at: [-950, -3630], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'hoarfrost',
      name: 'Hoarfrost',
      why: "Cold with energy shield: the careful cold caster's cluster, who wants the chill to keep things off and a shield for what gets through. The other cold cluster (Shatter, at the top) sells freeze and penetration instead, so a cold build picks safety here or the big hit up there, and both costs a crossing.",
      at: [-650, -3420],
      shape: { kind: 'ring', r: 56, a0: 30 },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [eleDamage('cold', 10)],
          why: 'The entrance, from the fork.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Hoarfrost',
          lines: [eleDamage('cold', 16), chillEffect(15), es(8)],
          why: '1.6 + 1.5 + 1.6 units.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [eleDamage('cold', 10)],
          why: "The west exit, to the arm's junction.",
        },
        {
          id: 'c',
          kind: 'small',
          lines: [eleDamage('cold', 10)],
          why: 'The north exit, to the inter-arm junction.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
        ['b', 'c'],
        ['c', 'a'],
      ],
    },
    {
      id: 'jArm',
      name: 'Junction',
      why: "The arm's junction: the ignite room north-west, the dear crossing from the Cathedral's minions west, and the well's west road arriving from the south.",
      at: [-950, -3600],
      shape: { kind: 'hand' },
      nodes: [{ id: 'a', kind: 'attribute', lines: [int(7)], at: [-950, -3600] }],
      links: [],
    },
    {
      id: 'familiars',
      name: 'Familiars',
      why: "Minions in the Spire (2026-10-19, the user's review: the Mystic can pick a summon like any other gem and the region sold nothing for one). Minion damage twice, then the notable with minion damage, life and speed, as a chain from the west road's mana-leech pocket to the arm's junction: the Spire's half of the dear crossing to the Cathedral's minion tower, which lands on its notable, so a minion Mystic and a fire Zealot pass each other here.",
      at: [-1120, -3300],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [minionDamage(12)],
          at: [-1126, -3256],
          why: 'The entrance, from Mana Tap.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Familiars',
          lines: [minionDamage(24), minionLife(12), spellDamage(8)],
          at: [-1180, -3300],
          why: "The caster's minions: 2 + 1 + 1 units. The Cathedral's minion tower arrives here.",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [minionDamage(12)],
          at: [-1137, -3356],
          why: "The exit, to the arm's junction.",
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'cinder',
      name: 'Cinder',
      why: "Ignite: chance, burning damage, faster burning. Fire as a burn, at the arm's end beside the two-element keystone; the fire caster who wants the hit instead goes east to Flashpoint. The arm's end: a dead end since 2026-10-20, when its link to the Prismatic spur went so the keystone sits on a spur; a bridge again since G2 (2026-10-22), its far side leading on to the north-west rim road.",
      at: [-1150, -3850],
      shape: { kind: 'ring', r: 56, a0: 60 },
      nodes: [
        { id: 'a', kind: 'small', lines: [burnDamage(12)] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Cinder',
          lines: [igniteChance(15), burnDamage(30), igniteFaster(10)],
          why: '1.5 + 2.5 + 1 units.',
        },
        { id: 'b', kind: 'small', lines: [burnDamage(12)] },
        { id: 'c', kind: 'small', lines: [burnDamage(12)] },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
        ['b', 'c'],
        ['c', 'a'],
      ],
    },
    {
      id: 'rim',
      name: 'The north-west rim road',
      why: "Three attribute nodes on one straight run along the Spire's north-west rim (G2, 2026-10-22; G1/mystic.md §3 as joined in G1-brief.md §2.2): from where the shield and resistance cluster (G1/mystic.md MY-4) will hang beside Steady Stream, past the minion-and-curse pocket (MY-7, G3) to the corner over Cinder, where the road turns onto the Zealot's north walk (the far loop, written by the border pass). Cinder stops being a dead end. The north-east rim road is the Eaves (`rim.ts`); the two are joined across the top by the road through Shatter.",
      at: [-1115, -4325],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'attribute',
          lines: [int(7)],
          at: [-850, -4500],
          why: 'The head of the road, where MY-4 hangs (G3), between it and the road.',
        },
        {
          id: 'b',
          kind: 'attribute',
          lines: [int(7)],
          at: [-1115, -4325],
          why: 'Halfway; the near end of the MY-7 pocket (G3), outward.',
        },
        {
          id: 'c',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: [-1380, -4150],
          why: "The corner over Cinder, the last node before the Zealot, so half strength: the far loop leaves here for the Zealot's north walk, and the MY-7 pocket's far end lands here.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
      ],
    },
    {
      id: 'roadS',
      name: 'The lantern stair',
      why: 'Intelligence twice: the road down from the Lantern junction to the well.',
      at: [-884, -3413],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [int(7)], at: [-884, -3413] },
        { id: 'b', kind: 'attribute', lines: [int(7)], at: [-817, -3227] },
      ],
      links: [['a', 'b']],
    },
  ],
  links: [
    { from: 'hoarfrost.b', to: 'jArm.a', why: "Through the cold cluster to the arm's junction." },
    { from: 'jArm.a', to: 'cinder.a', why: 'Junction to the ignite room.' },
    {
      from: 'cinder.b',
      to: 'rim.c',
      why: "The ignite room's far side onto the north-west rim road: Cinder is a bridge from the Lantern to the rim, not the arm's dead end.",
    },
    {
      from: 'spire.well.manaTap.b',
      to: 'familiars.a',
      why: "The mana-leech pocket's far node onto the minion chain: a second way from the well to the arm, beside the one through Mana Tap's notable.",
    },
    { from: 'familiars.b', to: 'jArm.a', why: "The minion chain lands on the arm's junction." },
    { from: 'hoarfrost.c', to: 'spire.frost.jFire.a', why: 'The inter-arm link to the top arm.' },
  ],
};
