/**
 * Proposes where the districts of each region stand (docs/TREE-REDESIGN.md, T3): each in turn is put as near the middle of its
 * wedge as it will go without overlapping the ones before it or crossing the wedge's edge, and the roads between them are the
 * shortest between gates. The output is plan.ts's two tables; it is a start for a person with the pictures, not an answer.
 *
 *   npx tsx scripts/tree/pack.ts [region ...]
 */
import { DISTRICTS } from '../../src/data/tree/charter';
import { frameOf, shapeOfDistrict } from '../../src/data/tree/layout';
import { PLACEMENT } from '../../src/data/tree/plan';
import { REGIONS, START_RADIUS } from '../../src/data/tree/spec';

type Vec = [number, number];
/** How far a district's clusters reach from its junctions, and what to leave between two districts and at the wedge's edges. */
const REACH = 290;
const GAP = 60;
const EDGE = 150;

const only = process.argv.slice(2);
const out: string[] = [];
const links: string[] = [];
for (const reg of REGIONS) {
  if (only.length && !only.includes(reg.id)) continue;
  const axis = (reg.angle * Math.PI) / 180;
  const start: Vec = [START_RADIUS * Math.cos(axis), START_RADIUS * Math.sin(axis)];
  const placed: { id: string; pts: Vec[]; gates: Record<string, Vec> }[] = [];
  const lines: string[] = [];
  for (const d of DISTRICTS.filter((x) => x.region === reg.id)) {
    const shape = shapeOfDistrict(d);
    // The attempt order: nearest the middle first, the districts of the pinned table keep theirs.
    let pick: { r: number; a: number; turn: number } | null = null;
    if (PLACEMENT[d.id] && process.env.KEEP) pick = PLACEMENT[d.id];
    for (let r = 1100; r <= 7000 && !pick; r += 50)
      for (const a of [0, 4, -4, 8, -8, 12, -12, 16, -16, 20, -20, 24, -24, 28, -28])
        for (const turn of [0, 90, 45, -45, 135, 180]) {
          const f = frameOf(reg, { r, a, turn });
          const pts = shape.junctions.map((p) => f.to(p));
          const fits = pts.every((p) => {
            const rp = Math.hypot(p[0], p[1]);
            const th = Math.atan2(p[1], p[0]) - axis;
            const dth = Math.abs(Math.atan2(Math.sin(th), Math.cos(th)));
            return (
              rp >= 1050 &&
              rp * Math.sin(Math.PI / 6 - Math.min(dth, Math.PI / 6)) >= EDGE &&
              dth < Math.PI / 6
            );
          });
          if (!fits) continue;
          const clear =
            pts.every((p) => Math.hypot(p[0] - start[0], p[1] - start[1]) >= 520) &&
            placed.every((q) =>
              q.pts.every((u) =>
                pts.every((p) => Math.hypot(u[0] - p[0], u[1] - p[1]) >= 2 * REACH + GAP),
              ),
            );
          if (clear) {
            pick = { r, a, turn };
            break;
          }
        }
    if (!pick) {
      lines.push(`  // ${d.id}: no room found`);
      continue;
    }
    const f = frameOf(reg, pick);
    placed.push({
      id: d.id,
      pts: shape.junctions.map((p) => f.to(p)),
      gates: Object.fromEntries(
        Object.entries(shape.gates).map(([g, j]) => [g, f.to(shape.junctions[j])]),
      ),
    });
    lines.push(`  ${d.id}: { r: ${pick.r}, a: ${pick.a}, turn: ${pick.turn} },`);
  }
  out.push(`  // ${reg.id}`, ...lines);
  // The roads: the start to the first district, then each district to the nearest one before it, and one more where it is close.
  const dist = (p: Vec, q: Vec) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const rl: string[] = [];
  placed.forEach((p, i) => {
    const targets: { name: string; at: Vec }[] =
      i === 0
        ? [{ name: 'start', at: start }]
        : placed
            .slice(0, i)
            .flatMap((q) =>
              Object.entries(q.gates).map(([g, at]) => ({ name: `${q.id}:${g}`, at })),
            );
    const mine = Object.entries(p.gates).map(([g, at]) => ({ name: `${p.id}:${g}`, at }));
    const pairs = mine
      .flatMap((m) => targets.map((t) => ({ m, t, d: dist(m.at, t.at) })))
      .sort((x, y) => x.d - y.d);
    const first = pairs[0];
    rl.push(`    ['${first.t.name}', '${first.m.name}'],`);
    const other = pairs.find(
      (x) =>
        x.t.name.split(':')[0] !== first.t.name.split(':')[0] &&
        x.m.name !== first.m.name &&
        x.d < 1300,
    );
    if (other && i > 1) rl.push(`    ['${other.t.name}', '${other.m.name}'],`);
  });
  links.push(`  ${reg.id}: [`, ...rl, '  ],');
}
console.log('export const PLACEMENT: Record<string, Placement> = {\n' + out.join('\n') + '\n};\n');
console.log(
  'export const REGION_LINKS: Partial<Record<RegionId, [string, string][]>> = {\n' +
    links.join('\n') +
    '\n};',
);
