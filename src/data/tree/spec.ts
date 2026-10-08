/**
 * Passive tree spec (DESIGN.md §9.2, docs/TREE.md), authored at the cluster level. The generated clusters
 * (clustersGen.ts) fill the rings of each region; `buildClusterSpecs` places them on a polar layout of our own design
 * and links them. `build.ts` turns clusters into nodes and travel paths.
 */
import { GEN_CLUSTERS } from './clustersGen';
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
  /** Polar centre: radius (layout units) and angle (degrees). */
  r: number;
  a: number;
  kind: ClusterKind;
  /** A theme of notableThemes.ts: the small nodes (hub and keystone clusters) and the notable of a hand-made cluster. */
  theme: string;
  smallCount: number;
  notable?: { name: string; strength: number };
  /** A generated cluster: its own notable and small nodes. */
  gen?: GenCluster;
  keystone?: string;
  links: string[];
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
  themes: ['allAttr', 'hubLife', 'hubDamage', 'ailmentEffect', 'hubFlask', 'hubCast', 'hubMana'],
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

/** Layout constants. */
export const START_RADIUS = 800;
export const HUB_RADIUS = 420;
/** The first ring of a region, the gap between rings, and the arc a cluster needs along its ring (layout units). */
export const RING_START = 1050;
export const RING_STEP = 240;
const SLOT_ARC = 340;
const SECTOR = 60;
/** The share of a region's sector its rings use; the rest is a gap between regions. */
const SPREAD = 0.92;

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

/** The order families sit in around a region: related ones side by side. */
const FAMILY_ORDER = [
  'life',
  'armour',
  'block',
  'res',
  'evasion',
  'es',
  'mana',
  'attr',
  'leech',
  'stun',
  'melee',
  'attack',
  'dmg.physical',
  'accuracy',
  'speed',
  'crit',
  'pen',
  'projectile',
  'ranged',
  'dot',
  'ailment',
  'dmg.fire',
  'dmg.cold',
  'dmg.lightning',
  'dmg.chaos',
  'damage',
  'spell',
  'aoe',
  'curse',
  'aura',
  'minion',
  'totem',
  'trap',
  'mine',
  'brand',
  'channelling',
  'warcry',
  'charges',
  'flask',
  'misc',
];
const familyIndex = (f: string): number => {
  const i = FAMILY_ORDER.indexOf(f);
  return i < 0 ? FAMILY_ORDER.length : i;
};

/** How many clusters fit on ring `ring` of a region. */
function ringSlots(ring: number): number {
  const r = RING_START + ring * RING_STEP;
  const arc = ((r * Math.PI) / 180) * SECTOR * SPREAD;
  return Math.max(2, Math.floor(arc / SLOT_ARC));
}
const ringRadius = (ring: number): number => RING_START + ring * RING_STEP;

function slotAngle(region: RegionDef, ring: number, slot: number): number {
  const n = ringSlots(ring);
  const step = (SECTOR * SPREAD) / n;
  // Stagger alternate rings by a quarter step so links don't line up radially.
  const stagger = ring % 2 ? step * 0.25 : -step * 0.25;
  return region.angle + (slot - (n - 1) / 2) * step + stagger;
}

/** A number from 0 to 99 for a name, to choose the same way every time. */
function pct(key: string): number {
  let h = 11;
  for (let i = 0; i < key.length; i++) h = (h * 33 + key.charCodeAt(i)) >>> 0;
  return h % 100;
}
/** The share of ring neighbours that are joined, and the share of the clusters in a stretch that also have their own way inward. */
const RING_LINKED = 50;
const SPOKE_CHANCE = 12;

const kindFor = (n: number): ClusterKind => (n >= 4 ? 'wheel' : n === 3 ? 'chain' : 'spur');

type Pending = {
  id: string;
  family: string;
  depth: number;
  smallCount: number;
  gen?: GenCluster;
  extra?: { name: string; theme: string };
};

/** Generate the cluster list (deterministic). */
export function buildClusterSpecs(): ClusterSpec[] {
  const out: ClusterSpec[] = [];
  // Hub: a centre wheel and one cluster per region between the start and the centre.
  out.push({
    id: 'hub_c',
    region: 'hub',
    r: 0,
    a: 0,
    kind: 'wheel',
    theme: HUB.themes[0],
    smallCount: 7,
    notable: { name: HUB.notables[0], strength: 1 },
    links: [],
    attrs: ['str', 'dex', 'int'],
  });
  REGIONS.forEach((reg, i) => {
    out.push({
      id: `hub_${reg.id}`,
      region: 'hub',
      r: HUB_RADIUS,
      a: reg.angle,
      kind: 'chain',
      theme: HUB.themes[1 + (i % (HUB.themes.length - 1))],
      smallCount: 4,
      notable: { name: HUB.notables[1 + i], strength: 1 },
      links: ['hub_c', `start_${reg.id}`],
      attrs: reg.attrs,
    });
  });
  // Hub keystones sit between hub clusters, at alternate region boundaries.
  HUB.keystones.forEach((k, i) => {
    const reg = REGIONS[i * 2];
    out.push({
      id: `hubks_${i}`,
      region: 'hub',
      r: 640,
      a: reg.angle + 30,
      kind: 'keystone',
      theme: 'allAttr',
      smallCount: 2,
      keystone: k,
      links: [`hub_${reg.id}`],
      attrs: reg.attrs,
    });
  });
  for (const reg of REGIONS) {
    const pending: Pending[] = [
      ...GEN_CLUSTERS.filter((g) => g.region === reg.id).map((g) => ({
        id: g.id,
        family: g.family,
        depth: g.depth,
        smallCount: g.smallCount,
        gen: g,
      })),
      ...EXTRA_NOTABLES.filter((e) => e.region === reg.id).map((e, i) => ({
        id: `${reg.id}_x${i}`,
        family: 'charges',
        depth: 0.5 + 0.2 * i,
        smallCount: 3,
        extra: e,
      })),
    ].sort((a, b) => a.depth - b.depth || (a.id < b.id ? -1 : 1));
    // Rings out to where every cluster and keystone has a slot.
    let rings = 0;
    for (let have = 0; have < pending.length + reg.keystones.length; rings++)
      have += ringSlots(rings);
    // Keystones sit towards the rim, one on each of the outer rings, in the middle of the ring.
    const ksSlot = new Map<number, number>();
    reg.keystones.forEach((_, k) => {
      const ring = Math.max(2, rings - 1 - k * 2);
      ksSlot.set(ring, Math.floor(ringSlots(ring) / 2));
    });
    const isKs = (ring: number, slot: number) => ksSlot.get(ring) === slot;
    // Fill the rings from the middle out with clusters by depth; within a ring they sit by family.
    let next = 0;
    let ksIdx = 0;
    const ringIds: (string | null)[][] = [];
    for (let ring = 0; ring < rings; ring++) {
      const n = ringSlots(ring);
      const free: number[] = [];
      for (let slot = 0; slot < n; slot++) if (!isKs(ring, slot)) free.push(slot);
      const take = pending.slice(next, next + free.length);
      next += take.length;
      take.sort((a, b) => familyIndex(a.family) - familyIndex(b.family) || a.depth - b.depth);
      ringIds[ring] = new Array(n).fill(null);
      for (let slot = 0; slot < n; slot++) {
        const a = slotAngle(reg, ring, slot);
        const id = isKs(ring, slot) ? `${reg.id}_k${ring}` : (take[free.indexOf(slot)]?.id ?? null);
        ringIds[ring][slot] = id;
        if (!id) continue;
        // Inward link: nearest non-keystone slot on the previous ring (or the class start).
        const links: string[] = [];
        if (ring === 0) links.push(`start_${reg.id}`);
        else {
          let best = -1;
          let bd = Infinity;
          for (let j = 0; j < ringSlots(ring - 1); j++) {
            if (isKs(ring - 1, j) || !ringIds[ring - 1][j]) continue;
            const d = Math.abs(slotAngle(reg, ring - 1, j) - a);
            if (d < bd) {
              bd = d;
              best = j;
            }
          }
          links.push(ringIds[ring - 1][best] as string);
        }
        if (isKs(ring, slot)) {
          out.push({
            id,
            region: reg.id,
            r: ringRadius(ring),
            a,
            kind: 'keystone',
            theme: reg.keystoneTheme,
            smallCount: 2,
            keystone: reg.keystones[ksIdx++],
            links,
            attrs: reg.attrs,
          });
          continue;
        }
        // Some neighbours on a ring are joined, in stretches (an arc of road through several clusters); keystones stand off it.
        const nextSlot = slot + 1;
        if (nextSlot < n && !isKs(ring, nextSlot) && pct(`${reg.id}:${ring}:${slot}`) < RING_LINKED)
          links.push(`@${ring}:${nextSlot}`);
        const p = take[free.indexOf(slot)];
        const spec: ClusterSpec = {
          id,
          region: reg.id,
          r: ringRadius(ring),
          a,
          kind: kindFor(p.smallCount),
          theme: p.extra?.theme ?? reg.keystoneTheme,
          smallCount: p.smallCount,
          links,
          attrs: reg.attrs,
        };
        if (p.gen) spec.gen = p.gen;
        else spec.notable = { name: (p.extra as { name: string }).name, strength: 1 };
        out.push(spec);
      }
    }
    // A stretch of linked neighbours needs only one way inward, and a few more now and then (the spokes of the region).
    const where = new Map<string, [number, number]>();
    ringIds.forEach((row, ring) => row.forEach((id, slot) => id && where.set(id, [ring, slot])));
    for (const c of out) {
      if (c.region !== reg.id || c.kind === 'keystone') continue;
      const [ring, slot] = where.get(c.id)!;
      const joinedBefore =
        slot > 0 &&
        out.some((o) => o.id === ringIds[ring][slot - 1] && o.links.includes(`@${ring}:${slot}`));
      if (joinedBefore && pct(`${c.id}:spoke`) >= SPOKE_CHANCE) c.links.shift();
    }
    // Resolve the same-ring neighbour links to ids.
    for (const c of out)
      if (c.region === reg.id)
        c.links = c.links
          .map((l) => {
            if (!l.startsWith('@')) return l;
            const [ring, slot] = l.slice(1).split(':').map(Number);
            return ringIds[ring]?.[slot] ?? '';
          })
          .filter(Boolean);
  }
  // Cross-region links at sector boundaries on odd rings: the last slot of a region and the first of the next.
  const find = (id: string | undefined) => out.find((c) => c.id === id);
  REGIONS.forEach((reg, i) => {
    const nextReg = REGIONS[(i + 1) % REGIONS.length];
    for (let ring = 1; ring < 12; ring += 3) {
      const ringOf = (r: RegionDef, slot: 'first' | 'last') => {
        const cands = out.filter(
          (c) =>
            c.region === r.id &&
            c.kind !== 'keystone' &&
            Math.round((c.r - RING_START) / RING_STEP) === ring,
        );
        if (!cands.length) return undefined;
        cands.sort((a, b) => a.a - b.a);
        return slot === 'first' ? cands[0] : cands[cands.length - 1];
      };
      const a = ringOf(reg, 'last');
      const b = ringOf(nextReg, 'first');
      if (a && b && find(a.id) && find(b.id)) a.links.push(b.id);
    }
  });
  return out;
}
