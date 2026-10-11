/**
 * What the passive tree is made of, at the level of regions and clusters: the six regions (one a class), the hub's names, the
 * hand-made notables, and the cluster record the builders take (docs/TREE-REDESIGN.md). The layout is `layout.ts`, the charter
 * `charter.ts`, the geometry `plan.ts`.
 */
import type { GenCluster } from './types';

export type RegionId = 'str' | 'strdex' | 'dex' | 'dexint' | 'int' | 'strint';
export type Attr = 'str' | 'dex' | 'int';
export type ClusterKind = 'wheel' | 'chain' | 'spur' | 'keystone';

export type RegionDef = {
  id: RegionId;
  classId: string;
  /** Centre angle of the region's sector, degrees (0 = right, 90 = down). */
  angle: number;
  attrs: Attr[];
  /** The theme of the small nodes that lead to a keystone. */
  keystoneTheme: string;
  keystones: string[];
};

export type ClusterSpec = {
  id: string;
  region: RegionId | 'hub';
  kind: ClusterKind;
  /** A theme of notableThemes.ts: the small nodes (hub and keystone clusters) and the notable of a hand-made cluster. */
  theme: string;
  smallCount: number;
  notable?: { name: string; strength: number };
  /** A generated cluster: its own notable and small nodes. */
  gen?: GenCluster;
  keystone?: string;
  attrs: Attr[];
};

export const REGIONS: RegionDef[] = [
  {
    id: 'int',
    classId: 'mystic',
    angle: -90,
    attrs: ['int'],
    keystoneTheme: 'spell',
    keystones: ['mindBulwark', 'manaBastion', 'feverPitch', 'volatileServants'],
  },
  {
    id: 'dexint',
    classId: 'shade',
    angle: -30,
    attrs: ['dex', 'int'],
    keystoneTheme: 'dagger',
    keystones: ['cruelAgony', 'shadeLeech', 'hollowVessel', 'spellslip'],
  },
  {
    id: 'dex',
    classId: 'strider',
    angle: 30,
    attrs: ['dex'],
    keystoneTheme: 'bow',
    keystones: ['closeQuarters', 'arrowWeave', 'steadyDraw', 'nimbleGambit'],
  },
  {
    id: 'strdex',
    classId: 'reaver',
    angle: 90,
    attrs: ['str', 'dex'],
    keystoneTheme: 'sword',
    keystones: ['platedHide', 'woundDance', 'shieldwall', 'loneVow'],
  },
  {
    id: 'str',
    classId: 'vanguard',
    angle: 150,
    attrs: ['str'],
    keystoneTheme: 'lifePct',
    keystones: ['bloodRite', 'unerringDiscipline', 'rootedStance', 'idleHands'],
  },
  {
    id: 'strint',
    classId: 'zealot',
    angle: 210,
    attrs: ['str', 'int'],
    keystoneTheme: 'sceptre',
    keystones: ['searingAvatar', 'prismaticBalance', 'livingWard', 'sigilWarden'],
  },
];

export const HUB = {
  themes: ['allAttr', 'hubLife', 'hubDamage', 'hubRes', 'hubMana', 'hubEs', 'hubDefence'],
  notables: [
    'Crossroads Bones',
    "Pilgrim's Rest",
    'Compass of Marrow',
    "Wanderer's Tithe",
    'Common Grave',
    'Hollow Heart',
    'Shared Sorrow',
  ],
  keystones: ['crimsonPact', 'painConduit', 'strongarm'],
};

/** Where the class starts stand, and the radius of the ring road of the middle. */
export const START_RADIUS = 800;
export const HUB_RADIUS = 520;

/**
 * The hand-made notables of the depth expansion (EXPANSION 6.5): charge sources, hex strength and payoffs that need a
 * condition. They sit among the generated clusters of their region.
 */
export const EXTRA_NOTABLES: { region: RegionId; name: string; theme: string }[] = [
  { region: 'str', name: 'Bulwark of Habit', theme: 'gritBlock' },
  { region: 'str', name: 'Stored Fortitude', theme: 'gritRegen' },
  { region: 'strint', name: 'Deepened Stance', theme: 'maxGrit' },
  { region: 'strint', name: 'Grudge Engine', theme: 'beenHit' },
  { region: 'strdex', name: 'Feast of Frenzy', theme: 'fervourKill' },
  { region: 'strdex', name: 'Red Gait', theme: 'whileLeeching' },
  { region: 'dex', name: 'Quickened Heartbeat', theme: 'maxFervour' },
  { region: 'dex', name: 'Cold Clarity', theme: 'insightCrit' },
  { region: 'dexint', name: "Hexbinder's Tithe", theme: 'hexEffect' },
  { region: 'dexint', name: 'Hunter of the Marked', theme: 'vsHexed' },
  { region: 'int', name: 'Spite-Proof Skin', theme: 'curseWard' },
  { region: 'int', name: 'Marrow Veil', theme: 'chaosEs' },
];
