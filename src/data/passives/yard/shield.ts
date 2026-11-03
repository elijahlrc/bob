/**
 * The Muster: The west border: shields, block and stun, the Wall seam.
 * Written for the attrition rework from docs/tree/design/R-yard.md (2026-10-31).
 */
import {
  attackSpeed,
  costReduction,
  dex,
  flaskLowLifeRecovery,
  life,
  lifeOnBlock,
  manaOnBlock,
  shieldBlock,
  shieldDef,
  str,
  stunThreshold,
} from '../lines';
import type { AreaSpec } from '../types';

export const shield: AreaSpec = {
  id: 'yard.shield',
  region: 'reaver',
  name: 'The Muster',
  why: 'The west border: shields, block and stun, the Wall seam.',
  at: [-1135, 2228],
  clusters: [
    {
      id: 'radW',
      name: 'The south border road',
      why: 'From the Wall seam out along the border to the mid ring: the ground between the two regions beyond the starts.',
      at: [-1017, 1761],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'attribute', lines: [str(6), dex(6)], at: [-1017, 1761] },
        { id: 'b', kind: 'attribute', lines: [str(6), dex(6)], at: [-1233, 2136] },
        { id: 'm', kind: 'attribute', lines: [str(6), dex(6)], at: [-1450, 2511] },
      ],
      links: [
        ['a', 'b'],
        ['b', 'm'],
      ],
    },
    {
      id: 'block',
      name: 'Buckler',
      why: 'Shields, the Wall seam’s theme, off the west border road (step 9).',
      at: [-1013, 2275],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [shieldBlock(2)], at: [-1066, 2242] },
        { id: 'b', kind: 'small', lines: [shieldBlock(2)], at: [-1016, 2273] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Buckler',
          lines: [shieldBlock(5), attackSpeed(8)],
          at: [-957, 2310],
          why: 'The light shield of the quick duellist, at the Wall seam.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'steelRim',
      name: 'Steel Rim',
      why: 'Shield defence or stun, the two sides of one wheel, out from where the west border road meets the mid ring.',
      at: [-1385, 2840],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [shieldBlock(2)], at: [-1405, 2737] },
        { id: 'b', kind: 'small', lines: [shieldBlock(2)], at: [-1306, 2771] },
        {
          id: 'n1',
          kind: 'notable',
          name: 'Steel Rim',
          lines: [shieldBlock(5), shieldDef(30)],
          at: [-1286, 2874],
          why: 'Block and shield defences: 2.5 + 2 units.',
        },
        { id: 'c', kind: 'small', lines: [life(5)], at: [-1365, 2943] },
        {
          id: 'e',
          kind: 'small',
          lines: [life(5)],
          at: [-1720, 2700],
          why: "Across the border (2026-10-31), outside the mid ring where no road runs: Scarred Hide's life on into the Wall's Sledge and Sinew, the shieldless brawler's way toward the mace and its life on hit. It sits just across the angle of the border.",
        },
        {
          id: 'n2',
          kind: 'notable',
          name: 'Scarred Hide',
          lines: [life(10), stunThreshold(16)],
          at: [-1484, 2806],
          why: "2 + 2 units: what a fighter without a shield wears. Life with stun threshold since G3 (2026-10-22): it was life with armour and less physical damage taken, 8 steps from the start, which handed a strength build two of its main wants on one node (the ledger's convergence rule); the armour went to the Practice Ground's Mended Mail and to Guarded.",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n1'],
        ['n1', 'c'],
        ['c', 'n2'],
        ['n2', 'a'],
        ['n2', 'e'],
      ],
    },
    {
      id: 'shieldwall',
      name: 'Shieldwall',
      why: 'The shield keystone, a spur in from the mid ring’s west stretch.',
      at: [-1128, 2475],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [shieldBlock(2)], at: [-1107, 2583] },
        { id: 'd', kind: 'small', lines: [shieldBlock(2)], at: [-1123, 2488] },
        { id: 'k', kind: 'keystone', name: 'Shieldwall', lines: [], at: [-1137, 2394] },
      ],
      links: [['d', 'k']],
    },
    {
      id: 'blockMana',
      name: 'Steady Guard',
      why: 'Mana on block, by the shields (past step 8).',
      at: [-1260, 2399],
      shape: { kind: 'hand' },
      nodes: [
        { id: 's1', kind: 'small', lines: [manaOnBlock(4)], at: [-1242, 2224] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Steady Guard',
          lines: [manaOnBlock(15), shieldBlock(4)],
          at: [-1260, 2399],
          why: 'Mana on block, by the shields (past step 8).',
        },
      ],
      links: [['s1', 'n']],
    },
    {
      id: 'mending',
      name: 'Bulwark Mending',
      why: "Shield sustain: the block heals, and each blow costs less to answer. Since the flask-lines pass (2026-11-01) its small forks: on to Bulwark Mending, or to Bitter Dregs, the guard's last resort when the block fails.",
      at: [-1238, 2668],
      shape: { kind: 'hand' },
      nodes: [
        { id: 's1', kind: 'small', lines: [lifeOnBlock(8)], at: [-1379, 2563] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Bulwark Mending',
          lines: [lifeOnBlock(35), costReduction(8)],
          at: [-1238, 2668],
          why: 'Shield sustain: the block heals, and each blow costs less to answer.',
        },
        {
          id: 'n2',
          kind: 'notable',
          name: 'Bitter Dregs',
          lines: [flaskLowLifeRecovery(50)],
          at: [-1335, 2652],
          why: "The Reaver's emergency flask, further out (the flask-lines pass, 2026-11-01): flasks drunk below 30% life recover more, so the belt's last two slots become the duellist's last stand. Beside Bulwark Mending, off its small and not behind it: the guard picks the block that heals or the flask that saves, and pays points for both (step 10). 50 / 12 = 4.2 units, about the region's regeneration notable (Stout Heart 4.2); the line alone.",
        },
      ],
      links: [
        ['s1', 'n'],
        ['s1', 'n2'],
      ],
    },
  ],
  links: [
    {
      from: 'yard.shield.shieldwall.a',
      to: 'yard.shield.shieldwall.d',
      why: 'The spur to the keystone (the old file left it cut off).',
    },
    { from: 'yard.shield.block.a', to: 'yard.shield.radW.b', why: 'The way in.' },
    { from: 'yard.shield.steelRim.a', to: 'yard.shield.radW.m', why: 'The way in.' },
    { from: 'yard.shield.shieldwall.a', to: 'yard.blades.ring.a', why: 'The way in.' },
    { from: 'yard.shield.blockMana.s1', to: 'yard.shield.radW.b', why: 'The way in.' },
    { from: 'yard.shield.mending.s1', to: 'yard.shield.radW.m', why: 'The way in.' },
    {
      from: 'yard.shield.steelRim.e',
      to: 'wall.slams.sledge.c',
      why: "Across the Wall border (2026-10-31), outside the mid ring: Scarred Hide into Sledge and Sinew. The build: the shieldless brawler who stacks life and stun threshold and swings a mace, walking from the Yard's life room into the Wall's mace and its life on hit.",
    },
  ],
};
