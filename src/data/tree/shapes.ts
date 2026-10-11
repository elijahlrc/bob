/**
 * The shapes of a cluster in the district layout (docs/TREE-REDESIGN.md 3.2): a loop of the small nodes and the notable, a short
 * line of small nodes with the notable on a stalk, or a dead end of two small nodes and a keystone. Each has exactly one
 * **entrance**, the node a road joins, so that a road never runs through a cluster. The notable (or keystone) faces away from the
 * road.
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

/** The name of a small node as shown: "Lesser armour" reads as "Armour". */
export function tidyName(name: string): string {
  const bare = name.replace(/^Lesser /, '');
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

export type ClusterShape = 'loop' | 'stalk' | 'spur';

/** Which shape a cluster takes: the same rule as before (loops for big clusters, half of the small ones). */
export function shapeOf(c: ClusterSpec): ClusterShape {
  if (c.kind === 'keystone') return 'spur';
  return c.smallCount >= 4 || hashOf(c.id) % 2 === 0 ? 'loop' : 'stalk';
}

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
  const theme = THEMES[c.theme];
  if (!theme) throw new Error(`unknown theme ${c.theme}`);
  const smallMods = c.gen ? c.gen.small.mods : theme.small;
  const smallName = tidyName(c.gen ? c.gen.small.name : theme.smallName);
  const small = () => smallMods.map((m) => ({ ...m }));
  const n = c.smallCount;
  const ids: number[] = [];
  const add = (
    kind: 'small' | 'notable' | 'keystone',
    name: string,
    mods: ReturnType<typeof small>,
    x: number,
    y: number,
  ) => {
    const id = addNode(b, kind, name, mods, x, y, c.id, district);
    ids.push(id);
    return id;
  };
  const final = (x: number, y: number): number => {
    if (c.keystone) {
      const k = keystoneDef(c.keystone);
      return add(
        'keystone',
        k.name,
        k.mods.map((m) => ({ ...m })),
        x,
        y,
      );
    }
    if (c.gen)
      return add(
        'notable',
        c.gen.notable.name,
        c.gen.notable.mods.map((m) => ({ ...m })),
        x,
        y,
      );
    return add('notable', c.notable!.name, theme.notable(c.notable!.strength), x, y);
  };

  switch (shapeOf(c)) {
    case 'loop': {
      const m = n + 1;
      const radius = Math.max(LOOP_MIN_RADIUS, LOOP_CHORD / (2 * Math.sin(Math.PI / m)));
      const ring: number[] = [];
      for (let i = 0; i < m; i++) {
        const th = a + (2 * Math.PI * i) / m;
        const x = cx + radius * Math.cos(th);
        const y = cy + radius * Math.sin(th);
        const id = i === 0 ? final(x, y) : add('small', smallName, small(), x, y);
        b.nodes[id].orbit = [Math.round(cx), Math.round(cy)];
        ring.push(id);
      }
      for (let i = 0; i < m; i++) link(b, ring[i], ring[(i + 1) % m]);
      return { entrance: ring[Math.floor(m / 2)], ids };
    }
    case 'stalk': {
      const line: number[] = [];
      for (let j = 0; j < n; j++) {
        const o = (j - (n - 1) / 2) * CHAIN_STEP;
        line.push(add('small', smallName, small(), cx + tx * o, cy + ty * o));
        if (j > 0) link(b, line[j - 1], line[j]);
      }
      const root = line[Math.floor(n / 2)];
      link(b, final(b.nodes[root].x + ux * STALK, b.nodes[root].y + uy * STALK), root);
      const near = (id: number) => Math.hypot(b.nodes[id].x - toward[0], b.nodes[id].y - toward[1]);
      const entrance = near(line[0]) <= near(line[n - 1]) ? line[0] : line[n - 1];
      return { entrance, ids };
    }
    case 'spur': {
      // A dead end leaving the road: the small nodes, then the keystone. The entrance is the innermost small node.
      const line: number[] = [];
      for (let i = 0; i < n; i++) {
        const o = -40 + i * SPUR_STEP;
        line.push(add('small', smallName, small(), cx + ux * o, cy + uy * o));
        if (i > 0) link(b, line[i - 1], line[i]);
      }
      const o = -40 + n * SPUR_STEP + 10;
      link(b, final(cx + ux * o, cy + uy * o), line[n - 1]);
      return { entrance: line[0], ids };
    }
  }
}
