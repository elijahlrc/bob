/**
 * VFX inventory (docs/VFX-AUDIT.md): runs every gallery skill in the training arena for a few seconds and records what the sim
 * emits for the renderer to draw (explode radii, beams, chains, swings, projectiles and where they fly from), so the audit
 * can say which skills have no projectile, which areas have no outline, and where a flight does not follow its description.
 *
 *   npx tsx scripts/vfx/inventory.ts [--json out.json] [skillId...]
 */
import { writeFileSync } from 'node:fs';
import { galleryEntries, galleryRun, galleryWorld } from '../../src/run/gallery';
import { ACTIVE_GEMS, GRANTED_GEMS, type ActiveGemDef } from '../../src/data/gems';
import { stepWorld } from '../../src/sim/world';
import type { SimEvent } from '../../src/sim/types';

type Track = {
  id: number;
  pts: [number, number][];
  speed: number;
  kind?: string;
  er: number;
  dtype: number;
};

export type Row = {
  id: string;
  name: string;
  delivery: string;
  behaviour: string;
  uses: number;
  explodes: { r: number; n: number; dtype: number }[];
  beams: number;
  beamLen: number[];
  chains: number;
  swings: { radius: number; arc: number }[];
  thrusts: number;
  projectiles: number;
  /** From the player's position at the cast: how far from the caster a projectile first appears. */
  spawnOffset: number[];
  maxSpeed: number;
  lifetime: number[];
  /** Largest sideways drift from the straight line start to end, in tiles. */
  curve: number;
  /** The distance a projectile flew, and the straight distance start to end. */
  flown: number[];
  zones: { radius: number; strip: boolean; n: number }[];
  deployables: number;
  kinds: string[];
};

function run(id: string, seconds = 8): Row {
  const entry = galleryEntries().find((e) => e.id === id)!;
  const g = [...ACTIVE_GEMS, ...GRANTED_GEMS].find((x) => x.id === id) as ActiveGemDef | undefined;
  const w = galleryWorld(galleryRun(entry, 1), entry);
  const row: Row = {
    id,
    name: entry.name,
    delivery: entry.look.delivery,
    behaviour: g ? g.behaviour.kind : 'aura',
    uses: 0,
    explodes: [],
    beams: 0,
    beamLen: [],
    chains: 0,
    swings: [],
    thrusts: 0,
    projectiles: 0,
    spawnOffset: [],
    maxSpeed: 0,
    lifetime: [],
    curve: 0,
    flown: [],
    zones: [],
    deployables: 0,
    kinds: [],
  };
  const tracks = new Map<number, Track>();
  const zoneSeen = new Map<number, { radius: number; strip: boolean }>();
  const ex = new Map<string, { r: number; n: number; dtype: number }>();
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps && w.status === 'running'; i++) {
    stepWorld(w);
    for (const e of w.events as SimEvent[]) {
      if (e.t === 'use' && e.src === w.player.id) row.uses++;
      else if (e.t === 'explode') {
        const k = `${e.r.toFixed(2)}/${e.dtype}`;
        const cur = ex.get(k) ?? { r: e.r, n: 0, dtype: e.dtype };
        cur.n++;
        ex.set(k, cur);
      } else if (e.t === 'beam') {
        row.beams++;
        row.beamLen.push(Math.hypot(e.x2 - e.x, e.y2 - e.y));
      } else if (e.t === 'chain') row.chains++;
      else if (e.t === 'swing') row.swings.push({ radius: e.radius, arc: e.arc });
      else if (e.t === 'thrust') row.thrusts++;
    }
    for (const p of w.projectiles) {
      let t = tracks.get(p.id);
      if (!t) {
        t = { id: p.id, pts: [], speed: 0, kind: p.kind, er: p.explodeRadius, dtype: p.dtype };
        tracks.set(p.id, t);
        row.spawnOffset.push(Math.hypot(p.x - w.player.x, p.y - w.player.y));
      }
      t.pts.push([p.x, p.y]);
      t.speed = Math.max(t.speed, Math.hypot(p.vx, p.vy));
    }
    for (const z of w.zones)
      if (!zoneSeen.has(z.id)) zoneSeen.set(z.id, { radius: z.radius, strip: z.x2 !== undefined });
    row.deployables = Math.max(row.deployables, w.deployables.length);
  }
  row.explodes = [...ex.values()].sort((a, b) => b.n - a.n).slice(0, 4);
  row.projectiles = tracks.size;
  const kinds = new Set<string>();
  for (const t of tracks.values()) {
    if (t.kind) kinds.add(t.kind);
    row.maxSpeed = Math.max(row.maxSpeed, t.speed);
    row.lifetime.push(t.pts.length / 60);
    const [a, b] = [t.pts[0], t.pts[t.pts.length - 1]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    row.flown.push(len);
    if (len > 0.5) {
      const ux = (b[0] - a[0]) / len;
      const uy = (b[1] - a[1]) / len;
      let worst = 0;
      for (const p of t.pts)
        worst = Math.max(worst, Math.abs((p[0] - a[0]) * uy - (p[1] - a[1]) * ux));
      row.curve = Math.max(row.curve, worst);
    }
  }
  row.kinds = [...kinds];
  const zs = new Map<string, { radius: number; strip: boolean; n: number }>();
  for (const z of zoneSeen.values()) {
    const k = `${z.radius.toFixed(2)}/${z.strip}`;
    const cur = zs.get(k) ?? { ...z, n: 0 };
    cur.n++;
    zs.set(k, cur);
  }
  row.zones = [...zs.values()];
  return row;
}

const args = process.argv.slice(2);
const jsonAt = args.indexOf('--json');
const out = jsonAt >= 0 ? args[jsonAt + 1] : undefined;
const ids = args.filter((a, i) => !a.startsWith('--') && i !== jsonAt + 1);
const all = galleryEntries().map((e) => e.id);
const rows: Row[] = [];
for (const id of ids.length ? ids : all) {
  try {
    rows.push(run(id));
  } catch (err) {
    console.error(id, (err as Error).message);
  }
}
if (out) writeFileSync(out, JSON.stringify(rows, null, 1));
else for (const r of rows) console.log(JSON.stringify(r));
