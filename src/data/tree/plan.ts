import type { RegionId } from './spec';

/**
 * The geometry of the district layout (docs/TREE-REDESIGN.md, T3 to T5), authored by hand beside the charter's content: where each
 * district stands and which way it points, and which roads join the districts of a region. Read with the pictures of
 * `npm run tree:pic`; nothing here is derived, so moving a district is a matter of changing a number and looking again.
 *
 * A district's centre is `r` from the middle of the tree and `a` degrees round from the axis of its region (positive is
 * clockwise on the screen); its own axis turns `turn` degrees from pointing straight out. A road's ends are named
 * `start` (the region's class start) or `district:gate` (a gate of a district's template).
 */
export type Placement = { r: number; a: number; turn: number };

export const PLACEMENT: Record<string, Placement> = {
  // int
  wellspring: { r: 2350, a: 12, turn: 45 },
  spellforge: { r: 3150, a: -20, turn: 0 },
  conflux: { r: 3950, a: 4, turn: 45 },
  boneCourt: { r: 3850, a: 24, turn: -45 },
  quillwork: { r: 4350, a: -20, turn: 90 },
  // dexint
  veil: { r: 2300, a: -16, turn: 0 },
  knifeAlley: { r: 2200, a: 16, turn: 0 },
  venomQuarter: { r: 3450, a: -8, turn: 90 },
  snareRow: { r: 4200, a: 16, turn: -45 },
  // dex
  windwalk: { r: 2300, a: -16, turn: 0 },
  longbowReach: { r: 2350, a: 16, turn: 0 },
  moonwell: { r: 3550, a: -16, turn: 90 },
  thornwood: { r: 3800, a: 20, turn: -45 },
  parryYard: { r: 4300, a: 0, turn: -45 },
  // strdex
  bulwark: { r: 2500, a: -12, turn: 0 },
  bladework: { r: 3250, a: 20, turn: 0 },
  bloodrun: { r: 4000, a: -20, turn: 45 },
  standards: { r: 4050, a: 0, turn: 45 },
  // str
  ironhold: { r: 2350, a: 12, turn: 45 },
  hammerfall: { r: 3200, a: -20, turn: 135 },
  embers: { r: 4050, a: 20, turn: 90 },
  cairn: { r: 3950, a: -4, turn: -45 },
  // strint
  cassock: { r: 2000, a: -12, turn: 90 },
  pyreAndStorm: { r: 2650, a: 16, turn: 90 },
  sanctum: { r: 3050, a: -16, turn: 0 },
  reliquary: { r: 3650, a: 8, turn: 90 },
  crozierHall: { r: 4300, a: -16, turn: 90 },
};

export const REGION_LINKS: Partial<Record<RegionId, [string, string][]>> = {
  int: [
    ['start', 'wellspring:in'],
    ['wellspring:left', 'spellforge:right'],
    ['wellspring:left', 'conflux:in'],
    ['conflux:arm2', 'boneCourt:out'],
    ['wellspring:out', 'boneCourt:in'],
    ['spellforge:out', 'quillwork:inB'],
    ['conflux:in', 'quillwork:outB'],
  ],
  dexint: [
    ['start', 'veil:in'],
    ['veil:in', 'knifeAlley:in'],
    ['knifeAlley:out', 'venomQuarter:arm2'],
    ['veil:out', 'venomQuarter:arm3'],
    ['knifeAlley:outB', 'snareRow:in'],
  ],
  dex: [
    ['start', 'windwalk:in'],
    ['windwalk:right', 'longbowReach:arm0'],
    ['longbowReach:arm0', 'moonwell:outB'],
    ['windwalk:out', 'moonwell:inB'],
    ['longbowReach:arm2', 'thornwood:in'],
    ['moonwell:outB', 'thornwood:arm0'],
    ['thornwood:arm0', 'parryYard:in'],
    ['moonwell:out', 'parryYard:out'],
  ],
  strdex: [
    ['start', 'bulwark:in'],
    ['bulwark:right', 'bladework:in'],
    ['bulwark:out', 'bloodrun:in'],
    ['bulwark:out', 'standards:inB'],
    ['bladework:arm0', 'standards:outB'],
  ],
  str: [
    ['start', 'ironhold:in'],
    ['ironhold:left', 'hammerfall:arm1'],
    ['ironhold:out', 'embers:right'],
    ['hammerfall:arm0', 'cairn:in'],
  ],
  strint: [
    ['start', 'cassock:out'],
    ['cassock:out', 'pyreAndStorm:in'],
    ['pyreAndStorm:in', 'sanctum:right'],
    ['cassock:in', 'sanctum:in'],
    ['pyreAndStorm:arm0', 'reliquary:out'],
    ['sanctum:right', 'reliquary:in'],
    ['reliquary:in', 'crozierHall:outB'],
  ],
};
