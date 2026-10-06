import { FLOOR } from '../gen/labyrinth';

/** Tile grid queries: walls, line of sight, A*, flow fields and circle collision. */
export class Grid {
  readonly w: number;
  readonly h: number;
  readonly tiles: Uint8Array;
  private stamp: Uint32Array;
  private gen = 1;
  private gScore: Float64Array;
  private parent: Int32Array;
  // Flow field (BFS distances from the player tile).
  readonly flowDist: Int16Array;
  private flowStamp: Uint32Array;
  private flowGen = 1;
  flowOrigin = -1;

  constructor(w: number, h: number, tiles: Uint8Array) {
    this.w = w;
    this.h = h;
    this.tiles = tiles;
    const n = w * h;
    this.stamp = new Uint32Array(n);
    this.gScore = new Float64Array(n);
    this.parent = new Int32Array(n);
    this.flowDist = new Int16Array(n);
    this.flowStamp = new Uint32Array(n);
  }

  isFloor(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.tiles[y * this.w + x] === FLOOR;
  }

  /** Line of sight between two points (tile DDA). */
  los(x0: number, y0: number, x1: number, y1: number): boolean {
    let tx = Math.floor(x0);
    let ty = Math.floor(y0);
    const ex = Math.floor(x1);
    const ey = Math.floor(y1);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    let tMaxX = dx > 0 ? (tx + 1 - x0) * tDeltaX : dx < 0 ? (x0 - tx) * tDeltaX : Infinity;
    let tMaxY = dy > 0 ? (ty + 1 - y0) * tDeltaY : dy < 0 ? (y0 - ty) * tDeltaY : Infinity;
    for (let i = 0; i < 512; i++) {
      if (!this.isFloor(tx, ty)) return false;
      if (tx === ex && ty === ey) return true;
      if (tMaxX < tMaxY) {
        tMaxX += tDeltaX;
        tx += stepX;
      } else {
        tMaxY += tDeltaY;
        ty += stepY;
      }
    }
    return false;
  }

  /** A* on the tile grid (8-way, no corner cutting). Returns tile centres excluding the start. */
  astar(sx: number, sy: number, tx: number, ty: number): { x: number; y: number }[] | null {
    const w = this.w;
    const s = Math.floor(sy) * w + Math.floor(sx);
    const t = Math.floor(ty) * w + Math.floor(tx);
    if (!this.isFloor(t % w, Math.floor(t / w))) return null;
    if (s === t) return [];
    const gen = ++this.gen;
    const heapF: number[] = [];
    const heapN: number[] = [];
    const push = (f: number, n: number) => {
      heapF.push(f);
      heapN.push(n);
      let i = heapF.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heapF[p] <= heapF[i]) break;
        [heapF[p], heapF[i]] = [heapF[i], heapF[p]];
        [heapN[p], heapN[i]] = [heapN[i], heapN[p]];
        i = p;
      }
    };
    const pop = (): number => {
      const top = heapN[0];
      const lf = heapF.pop()!;
      const ln = heapN.pop()!;
      if (heapF.length) {
        heapF[0] = lf;
        heapN[0] = ln;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const r = l + 1;
          let m = i;
          if (l < heapF.length && heapF[l] < heapF[m]) m = l;
          if (r < heapF.length && heapF[r] < heapF[m]) m = r;
          if (m === i) break;
          [heapF[m], heapF[i]] = [heapF[i], heapF[m]];
          [heapN[m], heapN[i]] = [heapN[i], heapN[m]];
          i = m;
        }
      }
      return top;
    };
    const txi = t % w;
    const tyi = Math.floor(t / w);
    const hfn = (n: number) => {
      const dx = Math.abs((n % w) - txi);
      const dy = Math.abs(Math.floor(n / w) - tyi);
      return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
    };
    this.stamp[s] = gen;
    this.gScore[s] = 0;
    this.parent[s] = -1;
    push(hfn(s), s);
    let found = false;
    let iter = 0;
    while (heapN.length && iter++ < 40000) {
      const n = pop();
      if (n === t) {
        found = true;
        break;
      }
      const nx = n % w;
      const ny = Math.floor(n / w);
      const g = this.gScore[n];
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const mx = nx + dx;
          const my = ny + dy;
          if (!this.isFloor(mx, my)) continue;
          if (dx && dy && (!this.isFloor(nx + dx, ny) || !this.isFloor(nx, ny + dy))) continue;
          const m = my * w + mx;
          const ng = g + (dx && dy ? 1.414 : 1);
          if (this.stamp[m] === gen && ng >= this.gScore[m]) continue;
          this.stamp[m] = gen;
          this.gScore[m] = ng;
          this.parent[m] = n;
          push(ng + hfn(m), m);
        }
    }
    if (!found) return null;
    const out: { x: number; y: number }[] = [];
    for (let n = t; n !== s; n = this.parent[n])
      out.push({ x: (n % w) + 0.5, y: Math.floor(n / w) + 0.5 });
    out.reverse();
    return out;
  }

  /** Rebuild the BFS flow field from a tile, up to `maxDist` steps. */
  buildFlow(x: number, y: number, maxDist = 30): void {
    const w = this.w;
    const origin = Math.floor(y) * w + Math.floor(x);
    if (origin === this.flowOrigin) return;
    this.flowOrigin = origin;
    const gen = ++this.flowGen;
    const q: number[] = [origin];
    this.flowStamp[origin] = gen;
    this.flowDist[origin] = 0;
    for (let head = 0; head < q.length; head++) {
      const n = q[head];
      const d = this.flowDist[n];
      if (d >= maxDist) continue;
      const nx = n % w;
      const ny = (n - nx) / w;
      for (let k = 0; k < 4; k++) {
        const mx = nx + (k === 0 ? 1 : k === 1 ? -1 : 0);
        const my = ny + (k === 2 ? 1 : k === 3 ? -1 : 0);
        if (!this.isFloor(mx, my)) continue;
        const m = my * w + mx;
        if (this.flowStamp[m] === gen) continue;
        this.flowStamp[m] = gen;
        this.flowDist[m] = d + 1;
        q.push(m);
      }
    }
  }

  /** Flow distance at a tile, or -1 if outside the field. */
  flowAt(x: number, y: number): number {
    if (!this.isFloor(x, y)) return -1;
    const i = y * this.w + x;
    return this.flowStamp[i] === this.flowGen ? this.flowDist[i] : -1;
  }

  /** Direction (unit vector) downhill on the flow field from a position, or null. */
  flowDir(px: number, py: number): { x: number; y: number } | null {
    const x = Math.floor(px);
    const y = Math.floor(py);
    const here = this.flowAt(x, y);
    if (here < 0) return null;
    let best = here;
    let bx = 0;
    let by = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        if (dx && dy && (!this.isFloor(x + dx, y) || !this.isFloor(x, y + dy))) continue;
        const d = this.flowAt(x + dx, y + dy);
        if (d >= 0 && d < best) {
          best = d;
          bx = dx;
          by = dy;
        }
      }
    if (best === here) return null;
    // Aim at the centre of the chosen tile for smoother motion.
    const tx = x + bx + 0.5 - px;
    const ty = y + by + 0.5 - py;
    const len = Math.hypot(tx, ty) || 1;
    return { x: tx / len, y: ty / len };
  }

  /** Push a circle out of wall tiles. Returns the corrected position. */
  collide(x: number, y: number, r: number): { x: number; y: number } {
    for (let pass = 0; pass < 2; pass++) {
      const x0 = Math.floor(x - r);
      const x1 = Math.floor(x + r);
      const y0 = Math.floor(y - r);
      const y1 = Math.floor(y + r);
      for (let ty = y0; ty <= y1; ty++)
        for (let tx = x0; tx <= x1; tx++) {
          if (this.isFloor(tx, ty)) continue;
          const cx = Math.max(tx, Math.min(x, tx + 1));
          const cy = Math.max(ty, Math.min(y, ty + 1));
          const dx = x - cx;
          const dy = y - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 >= r * r) continue;
          if (d2 > 1e-9) {
            const d = Math.sqrt(d2);
            x = cx + (dx / d) * r;
            y = cy + (dy / d) * r;
          } else {
            // Centre inside the wall: push toward the tile's nearest open side.
            const ox = x - (tx + 0.5);
            const oy = y - (ty + 0.5);
            if (Math.abs(ox) > Math.abs(oy)) x = ox > 0 ? tx + 1 + r : tx - r;
            else y = oy > 0 ? ty + 1 + r : ty - r;
          }
        }
    }
    return { x, y };
  }
}
