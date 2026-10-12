/**
 * The shapes of a cluster in the district layout (docs/TREE-REDESIGN.md 3.2). One notable (or keystone) with its small nodes takes
 * one of: a **loop** (a ring, a triangle when small), a **stalk** (a line of small nodes with the notable on a short stem), a
 * **crescent** (an open arc with the notable at its apex), a **wing** (a V with the notable at its apex) or, for a keystone, a
 * **spur** (a dead end). Related clusters may be fused (iteration 5, the user: not every notable in a little ring): a **twin** is one
 * ring with two notables, a **string** is a line of two or three, each after its own small nodes. Every shape has exactly one
 * **entrance**, the node a road joins, so that a road never runs through a cluster, and all its nodes carry the cluster's id (the
 * first of the fused ones). The notable (or keystone) faces away from the road.
 */
import { addNode, hashOf, link, type Builder } from './builder';
import { keystoneDef } from './keystones';
import { THEMES } from './notableThemes';
import type { ClusterSpec } from './spec';

/** The spacing of the small nodes of a line, a loop's chord, the least radius of a loop, the length of a stalk, a dead end's step. */
const CHAIN_STEP = 62;
const LOOP_CHORD = 58;
const LOOP_MIN_RADIUS = 62;
const STALK = 74;
const SPUR_STEP = 65;
/** The radius of a crescent's arc, and the angle between the arms of a wing (half of it each side of the way back). */
const ARC_RADIUS = 105;
const WING_HALF = (35 * Math.PI) / 180;

/** The name of a small node as shown: "Lesser armour" reads as "Armour". */
export function tidyName(name: string): string {
  const bare = name.replace(/^Lesser /, '');
  const shown = bare.charAt(0).toUpperCase() + bare.slice(1);
  return OUR_WORDS[shown] ?? shown;
}

/** Labels of small nodes that read exactly as the name of a gem of the reference game: ours say it another way (ip.test.ts). */
const OUR_WORDS: Record<string, string> = {
  'Life Leech': 'Life Leeched',
  'Elemental Damage with Attacks': 'Elemental Attack Damage',
};

export type ClusterShape = 'loop' | 'stalk' | 'spur' | 'crescent' | 'wing' | 'twin' | 'string';

/** Which shape a cluster takes: a fused cluster its own, else by a hash of its id and how many small nodes it has. */
export function shapeOf(c: ClusterSpec): ClusterShape {
  if (c.also?.length) return c.shape ?? 'string';
  if (c.kind === 'keystone') return 'spur';
  if (c.form) return c.form;
  const h = hashOf(c.id) % 10;
  if (c.smallCount >= 4) return h < 5 ? 'loop' : h < 8 ? 'crescent' : 'wing';
  if (c.smallCount === 3) return h < 3 ? 'loop' : h < 5 ? 'stalk' : h < 8 ? 'crescent' : 'wing';
  return h < 6 ? 'stalk' : 'loop';
}

/** The clusters of a shape in order: the cluster and the ones fused with it. */
export const partsOf = (c: ClusterSpec): ClusterSpec[] => [c, ...(c.also ?? [])];

/**
 * Lay out one cluster centred on (cx, cy), its notable facing `face` (a unit vector), and return the entrance: the node nearest
 * `toward`, the place the road it hangs from is.
 */
export function placeCluster(
  b: Builder,
  c: ClusterSpec,
  cx: number,
  cy: number,
  face: [number, number],
  toward: [number, number],
  district?: string,
): { entrance: number; ids: number[] } {
  const [ux, uy] = face;
  const tx = -uy;
  const ty = ux;
  const a = Math.atan2(uy, ux);
  const ids: number[] = [];
  const near = (id: number) => Math.hypot(b.nodes[id].x - toward[0], b.nodes[id].y - toward[1]);
  const smallsOf = (p: ClusterSpec) => {
    const theme = THEMES[p.theme];
    if (!theme) throw new Error(`unknown theme ${p.theme}`);
    const mods = p.smallMods ?? (p.gen ? p.gen.small.mods : theme.small);
    const name = tidyName(p.smallName ?? (p.gen ? p.gen.small.name : theme.smallName));
    return { theme, mods, name };
  };
  /** A small node of a part. */
  const small = (p: ClusterSpec, x: number, y: number): number => {
    const s = smallsOf(p);
    const id = addNode(
      b,
      'small',
      s.name,
      s.mods.map((m) => ({ ...m })),
      x,
      y,
      c.id,
      district,
    );
    ids.push(id);
    return id;
  };
  /** The notable (or keystone) of a part. */
  const final = (p: ClusterSpec, x: number, y: number): number => {
    let id: number;
    if (p.keystone) {
      const k = keystoneDef(p.keystone);
      id = addNode(
        b,
        'keystone',
        k.name,
        k.mods.map((m) => ({ ...m })),
        x,
        y,
        c.id,
        district,
      );
    } else if (p.gen) {
      id = addNode(
        b,
        'notable',
        p.gen.notable.name,
        p.gen.notable.mods.map((m) => ({ ...m })),
        x,
        y,
        c.id,
        district,
      );
    } else {
      id = addNode(
        b,
        'notable',
        p.notable!.name,
        smallsOf(p).theme.notable(p.notable!.strength),
        x,
        y,
        c.id,
        district,
      );
    }
    ids.push(id);
    return id;
  };
  const n = c.smallCount;

  switch (shapeOf(c)) {
    case 'loop': {
      const m = n + 1;
      const radius = Math.max(LOOP_MIN_RADIUS, LOOP_CHORD / (2 * Math.sin(Math.PI / m)));
      const ring: number[] = [];
      for (let i = 0; i < m; i++) {
        const th = a + (2 * Math.PI * i) / m;
        const x = cx + radius * Math.cos(th);
        const y = cy + radius * Math.sin(th);
        const id = i === 0 ? final(c, x, y) : small(c, x, y);
        b.nodes[id].orbit = [Math.round(cx), Math.round(cy)];
        ring.push(id);
      }
      for (let i = 0; i < m; i++) link(b, ring[i], ring[(i + 1) % m]);
      return { entrance: ring[Math.floor(m / 2)], ids };
    }
    case 'twin': {
      // One ring, two notables: each with its own small nodes after it.
      const [A, B] = partsOf(c);
      const nb = B.smallCount;
      const m = n + nb + 2;
      const radius = Math.max(LOOP_MIN_RADIUS, LOOP_CHORD / (2 * Math.sin(Math.PI / m)));
      const ring: number[] = [];
      for (let i = 0; i < m; i++) {
        const th = a + (2 * Math.PI * i) / m;
        const x = cx + radius * Math.cos(th);
        const y = cy + radius * Math.sin(th);
        const id =
          i === 0
            ? final(A, x, y)
            : i <= n
              ? small(A, x, y)
              : i === n + 1
                ? final(B, x, y)
                : small(B, x, y);
        b.nodes[id].orbit = [Math.round(cx), Math.round(cy)];
        ring.push(id);
      }
      for (let i = 0; i < m; i++) link(b, ring[i], ring[(i + 1) % m]);
      const smalls = ring.filter((id) => b.nodes[id].kind === 'small');
      const entrance = smalls.reduce((p, q) => (near(q) < near(p) ? q : p));
      return { entrance, ids };
    }
    case 'string': {
      // A line leaving the road: the small nodes then the notable of each part in turn; a dead end.
      const line: number[] = [];
      let o = -40;
      const put = (id: number) => {
        if (line.length) link(b, line[line.length - 1], id);
        line.push(id);
      };
      for (const p of partsOf(c)) {
        for (let i = 0; i < p.smallCount; i++, o += CHAIN_STEP)
          put(
            small(
              p,
              cx + ux * o + tx * (line.length % 2 ? 7 : -7),
              cy + uy * o + ty * (line.length % 2 ? 7 : -7),
            ),
          );
        put(final(p, cx + ux * o, cy + uy * o));
        o += CHAIN_STEP;
      }
      return { entrance: line[0], ids };
    }
    case 'crescent': {
      // An arc bulging away from the road, the notable at its apex; the end nearer the road is the entrance.
      const m = n + 1;
      const R = ARC_RADIUS;
      const step = 2 * Math.asin(LOOP_CHORD / (2 * R));
      const mid = Math.floor(m / 2);
      const ox = cx - ux * R;
      const oy = cy - uy * R;
      const arc: number[] = [];
      for (let i = 0; i < m; i++) {
        const th = a + (i - mid) * step;
        const x = ox + R * Math.cos(th);
        const y = oy + R * Math.sin(th);
        arc.push(i === mid ? final(c, x, y) : small(c, x, y));
        if (i > 0) link(b, arc[i - 1], arc[i]);
      }
      return { entrance: near(arc[0]) <= near(arc[m - 1]) ? arc[0] : arc[m - 1], ids };
    }
    case 'wing': {
      // A V: the notable at the apex, an arm of small nodes each side going back towards the road.
      const k1 = Math.ceil(n / 2);
      const k2 = n - k1;
      const apex: [number, number] = [cx + ux * 50, cy + uy * 50];
      const hub = final(c, apex[0], apex[1]);
      const arm = (k: number, side: number): number[] => {
        const dir = a + Math.PI + side * WING_HALF;
        const out: number[] = [];
        let prev = hub;
        for (let i = 1; i <= k; i++) {
          const id = small(
            c,
            apex[0] + Math.cos(dir) * CHAIN_STEP * i,
            apex[1] + Math.sin(dir) * CHAIN_STEP * i,
          );
          link(b, prev, id);
          out.push(id);
          prev = id;
        }
        return out;
      };
      const arms = [arm(k1, 1), arm(k2, -1)].filter((x) => x.length);
      const tips = arms.map((x) => x[x.length - 1]);
      const entrance = tips.reduce((p, q) => (near(q) < near(p) ? q : p));
      return { entrance, ids };
    }
    case 'stalk': {
      const line: number[] = [];
      for (let j = 0; j < n; j++) {
        const o = (j - (n - 1) / 2) * CHAIN_STEP;
        line.push(small(c, cx + tx * o, cy + ty * o));
        if (j > 0) link(b, line[j - 1], line[j]);
      }
      const root = line[Math.floor(n / 2)];
      link(b, final(c, b.nodes[root].x + ux * STALK, b.nodes[root].y + uy * STALK), root);
      const entrance = near(line[0]) <= near(line[n - 1]) ? line[0] : line[n - 1];
      return { entrance, ids };
    }
    case 'spur': {
      // A dead end leaving the road: the small nodes, then the keystone. The entrance is the innermost small node.
      const line: number[] = [];
      for (let i = 0; i < n; i++) {
        const o = -40 + i * SPUR_STEP;
        line.push(small(c, cx + ux * o, cy + uy * o));
        if (i > 0) link(b, line[i - 1], line[i]);
      }
      const o = -40 + n * SPUR_STEP + 10;
      link(b, final(c, cx + ux * o, cy + uy * o), line[n - 1]);
      return { entrance: line[0], ids };
    }
  }
}
