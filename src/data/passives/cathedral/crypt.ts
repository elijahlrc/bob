/**
 * The Undercroft: The Spire's border: brands and totems.
 * Written for the attrition rework from docs/tree/design/R-cathedral.md (2026-10-31).
 */
import {
  areaDamage,
  brandDamage,
  damageWithTotem,
  es,
  globalDefences,
  regenWithTotem,
  skillDuration,
  spellBlock,
  totemDamage,
  totemDuration,
} from '../lines';
import type { AreaSpec } from '../types';

export const crypt: AreaSpec = {
  id: 'cathedral.crypt',
  region: 'zealot',
  name: 'The Undercroft',
  why: "The Spire's border: brands and totems.",
  at: [-1362, -2097],
  clusters: [
    {
      id: 'rood',
      name: 'Rood Screen',
      why: "Energy shield and spell block, off the Spire's border road (generic ground: the Mystic's near ground).",
      at: [-1208, -1693],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [es(5)], at: [-1130, -1721] },
        { id: 'b', kind: 'small', lines: [es(5)], at: [-1178, -1692] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Rood Screen',
          lines: [spellBlock(6), es(6)],
          at: [-1237, -1655],
          why: 'Spell block first, a little energy shield (the Spire sells wand crit close by, at Damning Point, since 2026-11-05): 3 + 1.2 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'shrine',
      name: 'Reliquary',
      why: "Totems or brands, out from where the Spire's border road meets the mid ring (past the Mystic's near ground). Since the revision (2026-10-31) a crossroads of the planted things: its door small runs straight through to the far small (past Reliquary), and from there Hallowed Ground's totem small leads to Hallowed Ground and on into Hymn (the totem-planting caster's lightning); from Runecarver two duration smalls cross the Spire border into Bound Host, the Mystic's spell servants (what is planted lasts).",
      at: [-1884, -2411],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'h',
          kind: 'small',
          lines: [totemDamage(12)],
          at: [-2025, -2393],
          why: "Hallowed Ground's own way in (2026-10-31), by the totem's line.",
        },
        {
          id: 'r1',
          kind: 'small',
          lines: [skillDuration(10)],
          at: [-1793, -2675],
          why: "Runecarver on toward the Spire's spell servants (2026-10-31), by the room's duration line.",
        },
        {
          id: 'r2',
          kind: 'small',
          lines: [skillDuration(10)],
          at: [-1684, -2843],
          why: "The duration run's second small, just inside the Spire border (2026-10-31).",
        },
        { id: 'w', kind: 'small', lines: [skillDuration(10)], at: [-1811, -2428] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Reliquary',
          lines: [totemDamage(24), regenWithTotem(0.8), totemDuration(10)],
          at: [-1867, -2338],
          why: 'The casting totem that lasts, and the Zealot mends while one stands on the consecrated ground: 2 + 1.6 + 0.7 units.',
        },
        { id: 'e', kind: 'small', lines: [skillDuration(10)], at: [-1957, -2394] },
        {
          id: 's',
          kind: 'notable',
          name: 'Runecarver',
          lines: [brandDamage(24), skillDuration(10), areaDamage(10)],
          at: [-1901, -2484],
          why: 'Brands: damage, duration and area. 2 + 1 + 1 units.',
        },
        {
          id: 'hallowed',
          kind: 'notable',
          name: 'Hallowed Ground',
          lines: [damageWithTotem(25), globalDefences(12)],
          at: [-2115, -2387],
          why: 'What the Zealot plants works for it: while a totem stands, it hits harder and holds firmer: 2.5 + 1.5 units.',
        },
      ],
      links: [
        ['w', 'n'],
        ['n', 'e'],
        ['e', 's'],
        ['s', 'w'],
        ['w', 'e'],
        ['e', 'h'],
        ['h', 'hallowed'],
        ['s', 'r1'],
        ['r1', 'r2'],
      ],
    },
    {
      id: 'sigilWarden',
      name: 'Sigil Warden',
      why: 'The brand keystone, a spur off the north-east spoke past the mid ring.',
      at: [-2094, -2990],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [brandDamage(12)], at: [-2141, -2943] },
        { id: 'b', kind: 'small', lines: [brandDamage(12)], at: [-2101, -2984] },
        { id: 'k', kind: 'keystone', name: 'Sigil Warden', lines: [], at: [-2040, -3043] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'k'],
      ],
    },
  ],
  links: [
    { from: 'cathedral.crypt.rood.a', to: 'spire.well.radW.a', why: 'The way in.' },
    { from: 'cathedral.crypt.shrine.w', to: 'spire.well.radW.m', why: 'The way in.' },
    { from: 'cathedral.crypt.sigilWarden.a', to: 'cathedral.choir.spS.c', why: 'The way in.' },
    {
      from: 'cathedral.crypt.shrine.hallowed',
      to: 'cathedral.choir.hymn.n',
      why: "Hallowed Ground joins Hymn (2026-10-31), lightning's first home, so it stands on a way between the shrine and Hymn, entered from either end: the caster who plants a totem and calls lightning beside it. With the shrine, a way from the mid ring at the border out to the spoke's rim junction, slower than the road.",
    },
    {
      from: 'cathedral.crypt.shrine.r2',
      to: 'spire.well.familiars.n2',
      why: "Across the Spire border, outside the mid ring where no road runs (2026-10-31): the brands' duration smalls into Bound Host, the Mystic's spell servants on the border climb. The caster who lays brands and binds spell servants wants duration for both, and walks from Runecarver to Bound Host by it.",
    },
  ],
};
