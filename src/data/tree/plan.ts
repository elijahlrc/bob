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
  wellspring: { r: 2000, a: 0, turn: 135 },
  conflux: { r: 3450, a: -16, turn: 45 },
  boneCourt: { r: 3200, a: 20, turn: -45 },
  spellforge: { r: 4200, a: 4, turn: 0 },
  quillwork: { r: 4500, a: 24, turn: 0 },
  // dexint
  snareRow: { r: 1650, a: -12, turn: -45 },
  venomQuarter: { r: 2250, a: 12, turn: -45 },
  knifeAlley: { r: 3450, a: -12, turn: 90 },
  veil: { r: 3800, a: 20, turn: 0 },
  // dex
  longbowReach: { r: 1550, a: 0, turn: 45 },
  windwalk: { r: 3050, a: 16, turn: 0 },
  thornwood: { r: 3050, a: -16, turn: 45 },
  parryYard: { r: 4100, a: 24, turn: -45 },
  moonwell: { r: 4450, a: -20, turn: 90 },
  // strdex
  bladework: { r: 1550, a: 0, turn: 45 },
  bulwark: { r: 3150, a: 12, turn: 135 },
  bloodrun: { r: 2450, a: -24, turn: 0 },
  standards: { r: 3700, a: -16, turn: -45 },
  // str
  ironhold: { r: 2000, a: 0, turn: 135 },
  hammerfall: { r: 3450, a: -16, turn: 45 },
  embers: { r: 3500, a: 20, turn: 0 },
  cairn: { r: 3850, a: 4, turn: 0 },
  // strint
  sanctum: { r: 1750, a: -12, turn: 0 },
  reliquary: { r: 2200, a: 20, turn: 180 },
  pyreAndStorm: { r: 3050, a: -16, turn: 45 },
  crozierHall: { r: 3600, a: 16, turn: 90 },
  cassock: { r: 4100, a: -8, turn: -45 },
};

export const REGION_LINKS: Partial<Record<RegionId, [string, string][]>> = {
  int: [
    ['start', 'wellspring:out'],
    ['wellspring:in', 'conflux:in'],
    ['wellspring:left', 'boneCourt:in'],
    ['conflux:arm1', 'spellforge:left'],
    ['boneCourt:out', 'spellforge:in'],
    ['boneCourt:out', 'quillwork:in'],
  ],
  dexint: [
    ['start', 'snareRow:in'],
    ['snareRow:in', 'venomQuarter:in'],
    ['venomQuarter:arm1', 'knifeAlley:outB'],
    ['snareRow:out', 'knifeAlley:inB'],
    ['venomQuarter:arm2', 'veil:in'],
    ['knifeAlley:outB', 'veil:left'],
  ],
  dex: [
    ['start', 'longbowReach:in'],
    ['longbowReach:arm1', 'windwalk:in'],
    ['longbowReach:arm0', 'thornwood:arm2'],
    ['windwalk:left', 'thornwood:arm1'],
    ['windwalk:out', 'parryYard:in'],
    ['thornwood:arm1', 'moonwell:outB'],
  ],
  strdex: [
    ['start', 'bladework:in'],
    ['bladework:arm0', 'bulwark:right'],
    ['bladework:in', 'bloodrun:in'],
    ['bulwark:right', 'bloodrun:out'],
    ['bloodrun:out', 'standards:in'],
    ['bulwark:in', 'standards:inB'],
  ],
  str: [
    ['start', 'ironhold:out'],
    ['ironhold:in', 'hammerfall:in'],
    ['ironhold:left', 'embers:in'],
    ['hammerfall:arm3', 'cairn:in'],
    ['embers:left', 'cairn:out'],
  ],
  strint: [
    ['start', 'sanctum:in'],
    ['sanctum:right', 'reliquary:out'],
    ['sanctum:out', 'pyreAndStorm:in'],
    ['reliquary:in', 'pyreAndStorm:arm2'],
    ['reliquary:in', 'crozierHall:outB'],
    ['pyreAndStorm:arm2', 'crozierHall:inB'],
    ['crozierHall:inB', 'cassock:in'],
    ['pyreAndStorm:arm0', 'cassock:out'],
  ],
};

/**
 * Where the ring road of the middle meets a region besides its class start: the ring's junctions either side of the class's
 * (numbered round from the right, thirty degrees each). A road from each goes to the nearest gate of the region's districts that
 * it can reach. A class start cannot be walked through, so without these a region would be shut behind its own start.
 */
export const HUB_LINKS: Partial<Record<RegionId, number[]>> = {
  int: [8, 10],
  dexint: [0, 11],
  dex: [0, 2],
  strdex: [2, 4],
  str: [4, 6],
  strint: [6, 8],
};
