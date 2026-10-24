/* Passive tree (style study, Gold Leaf only): the game's own tree (imported from src/ through the dev server) drawn as a
   starry vault: a worn lapis sky, your passives a constellation of gold, the rest enamel in the colour of what it gives.
   The view is drawn each frame onto a canvas at half resolution and scaled up with hard pixels (nodes are sprites painted
   once by the Gold Leaf painter, lines are one art pixel); the words sit on top, smooth, placed where they fit.
   Tap a node to look at it (the panel shows it and the path to it), tap it again or press Take to take it. */
import { getTree, isLive } from '/src/data/tree/index.ts';
import {
  toneOf,
  TONE_GLYPH,
  TONE_LABEL,
  edgePath,
  NODE_RADIUS,
  shapeScale,
} from '/src/ui/treeStyle.ts';
import { modsText } from '/src/mods/text.ts';

const L = window.leaf;
const P = L.P;
const { col } = L;
const tree = getTree();
const N = tree.nodes;
const LIVE = N.filter(isLive);
const CLASS = 'mystic';
const START = tree.starts[CLASS];
// The level 42 Mystic's passives, copied from the live save; three points to spend (for the mockup).
const ALLOC0 = [
  504, 503, 506, 502, 505, 861, 513, 1077, 510, 514, 875, 876, 877, 516, 7, 588, 587, 586, 8, 9, 10,
  871, 632, 629, 630, 640, 641, 642, 11, 631, 633, 637, 638, 639, 12, 254, 235, 1591, 1590, 243,
  241, 213, 242, 211, 212, 1600, 1599, 1597, 1598, 509,
];

/** A colour family per tone: the colour says the family, the glyph on a notable says exactly what. */
const TONE_RAMP = {
  life: ['vermilion', 4],
  str: ['vermilion', 3],
  fire: ['vermilion', 5],
  dex: ['green', 4],
  evasion: ['green', 5],
  int: ['azure', 3],
  mana: ['azure', 2],
  spell: ['violet', 5],
  es: ['sky', 4],
  defence: ['sky', 2],
  cold: ['teal', 4],
  minion: ['teal', 5],
  lightning: ['straw', 4],
  crit: ['straw', 5],
  attack: ['straw', 2],
  physical: ['straw', 1],
  chaos: ['porphyry', 5],
  curse: ['porphyry', 6],
  utility: ['pearl', 2],
  damage: ['pearl', 4],
  all: ['pearl', 3],
};
const CLASS_RAMP = {
  mystic: ['azure', 3],
  shade: ['violet', 5],
  strider: ['green', 4],
  reaver: ['straw', 4],
  vanguard: ['vermilion', 4],
  zealot: ['gold', 5],
};

// ---- What each node says, long and short ----
const info = new Map();
const SHORT = [
  [/^\+(\d+) to Strength$/, '+$1 Str'],
  [/^\+(\d+) to Dexterity$/, '+$1 Dex'],
  [/^\+(\d+) to Intelligence$/, '+$1 Int'],
  [/^\+(\d+) to all Attributes$/, '+$1 all attributes'],
  [/^\+(\d+) to maximum (Life|Mana|Energy Shield)$/, (m, a, b) => `+${a} ${b.toLowerCase()}`],
  [/^\+(\d+)% to (\w+) Resistance$/, (m, a, b) => `+${a}% ${b.toLowerCase()} res`],
  [
    /^(\d+(?:\.\d+)?)% increased (.*)$/,
    (m, a, b) => `+${a}% ${b.replace(/ Rating$/, '').toLowerCase()}`,
  ],
  [/^(\d+(?:\.\d+)?)% reduced (.*)$/, (m, a, b) => `−${a}% ${b.toLowerCase()}`],
];
const short = (line) => {
  for (const [re, to] of SHORT) if (re.test(line)) return line.replace(re, to);
  return line.length > 26 ? line.slice(0, 24) + '…' : line;
};
for (const n of LIVE) {
  const lines = modsText(n.mods);
  info.set(n.id, {
    tone: n.kind === 'start' ? 'start' : toneOf(n),
    lines,
    short: lines.map(short).join(', '),
  });
}
// Edges, once each, as canvas paths in tree units (arcs where the tree draws arcs).
const EDGES = [];
for (const n of LIVE)
  for (const m of n.links)
    if (m > n.id && isLive(N[m])) EDGES.push([n.id, m, new Path2D(edgePath(n, N[m]))]);
// Runs of small nodes that say the same thing get one label ("+6 Dex, +6 Int ×3").
const RUNS = [];
{
  const seen = new Set();
  for (const n of LIVE) {
    if (seen.has(n.id) || !['small', 'travel'].includes(n.kind) || !info.get(n.id).short) continue;
    const text = info.get(n.id).short;
    const run = [];
    const q = [n.id];
    seen.add(n.id);
    while (q.length) {
      const id = q.pop();
      run.push(id);
      for (const m of N[id].links)
        if (
          !seen.has(m) &&
          isLive(N[m]) &&
          ['small', 'travel'].includes(N[m].kind) &&
          info.get(m)?.short === text
        ) {
          seen.add(m);
          q.push(m);
        }
    }
    // Anchor at the member nearest the run's middle.
    const cx = run.reduce((a, id) => a + N[id].x, 0) / run.length,
      cy = run.reduce((a, id) => a + N[id].y, 0) / run.length;
    run.sort((a, b) => Math.hypot(N[a].x - cx, N[a].y - cy) - Math.hypot(N[b].x - cx, N[b].y - cy));
    RUNS.push({ ids: run, anchor: run[0], text: run.length > 1 ? `${text} ×${run.length}` : text });
  }
}

// ---- State (kept across re-renders of the study) ----
let alloc = new Set(ALLOC0);
let points = 3;
const history = [];
let sel = null;
let hover = null;
let lightTone = '';
let query = '';
let showAll = false;
let view = null;

const linkedToAlloc = (id) => N[id].links.some((m) => alloc.has(m) || m === START);
function pathTo(target) {
  if (alloc.has(target) || target === START) return [];
  const prev = new Map();
  const q = [START, ...alloc];
  q.forEach((id) => prev.set(id, -1));
  for (let h = 0; h < q.length; h++) {
    const n = q[h];
    if (n === target) break;
    for (const m of N[n].links) {
      if (prev.has(m) || !isLive(N[m]) || N[m].kind === 'start') continue;
      prev.set(m, n);
      q.push(m);
    }
  }
  if (!prev.has(target)) return null;
  const path = [];
  for (let n = target; !alloc.has(n) && n !== START; n = prev.get(n)) path.push(n);
  return path.reverse();
}
function canRemove(id) {
  if (!alloc.has(id)) return false;
  const rest = new Set([...alloc].filter((n) => n !== id));
  const seen = new Set([START]);
  const q = [START];
  for (let h = 0; h < q.length; h++)
    for (const m of N[q[h]].links)
      if (rest.has(m) && !seen.has(m)) {
        seen.add(m);
        q.push(m);
      }
  return seen.size - 1 === rest.size;
}
/** Sum mods that differ only in value, then write them out. */
function totals(ids) {
  const sum = new Map();
  for (const id of ids)
    for (const m of N[id].mods) {
      const { value, source, ...rest } = m;
      const k = JSON.stringify(rest);
      const had = sum.get(k);
      if (had) had.value += value;
      else sum.set(k, { ...m });
    }
  return modsText([...sum.values()]);
}
const searchHits = () => {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return null;
  return new Set(
    LIVE.filter(
      (n) =>
        n.name?.toLowerCase().includes(q) ||
        info.get(n.id).lines.some((l) => l.toLowerCase().includes(q)),
    ).map((n) => n.id),
  );
};

// ---- Sprites: painted once per kind, colour, state and size ----
const sprites = new Map();
function crisp(cv) {
  const ctx = cv.getContext('2d');
  const img = ctx.getImageData(0, 0, cv.width, cv.height);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] < 110 ? 0 : 255;
  ctx.putImageData(img, 0, 0);
  return cv;
}
function sprite(kind, tone, state, d) {
  const key = `${kind}|${tone}|${state}|${d}`;
  let s = sprites.get(key);
  if (s) return s;
  const pad = kind === 'keystone' ? 6 : 3;
  const S = d + pad * 2,
    cv = L.canvas(S, S),
    ctx = cv.getContext('2d'),
    c = S / 2,
    R = d / 2;
  const disc = (r, style, x = c, y = c) => {
    if (r <= 0) return;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = style;
    ctx.fill();
  };
  const [ramp, from] =
    tone === 'start' ? (CLASS_RAMP[state.cls] ?? ['lapis', 4]) : (TONE_RAMP[tone] ?? ['pearl', 3]);
  const on = state.s === 'on' || state.s === 'path';
  const dim = state.s === 'dim';
  const ring = (r, step) => {
    const n = Math.max(8, Math.round((2 * Math.PI * r) / 2));
    for (let i = 0; i < n; i += step) {
      const a = (i / n) * Math.PI * 2;
      ctx.fillStyle = col('pearl', 5);
      ctx.fillRect(
        Math.round(c + Math.cos(a) * r - 0.5),
        Math.round(c + Math.sin(a) * r - 0.5),
        1,
        1,
      );
    }
  };
  if (kind === 'small' || kind === 'travel' || kind === 'hub') {
    if (state.s === 'on') {
      // a gold star with the enamel at its heart
      const r = R + 1;
      ctx.fillStyle = col('gold', 6);
      ctx.beginPath();
      ctx.moveTo(c, c - r - 1);
      ctx.lineTo(c + r * 0.35, c - r * 0.35);
      ctx.lineTo(c + r + 1, c);
      ctx.lineTo(c + r * 0.35, c + r * 0.35);
      ctx.lineTo(c, c + r + 1);
      ctx.lineTo(c - r * 0.35, c + r * 0.35);
      ctx.lineTo(c - r - 1, c);
      ctx.lineTo(c - r * 0.35, c - r * 0.35);
      ctx.fill();
      disc(R * 0.75, col('gold', 7));
      if (d >= 4) disc(R * 0.45, col(ramp, from + 1));
    } else {
      disc(
        R,
        dim
          ? col('lapis', 3)
          : state.s === 'path'
            ? col('pearl', 4)
            : col(ramp, from - (state.s === 'lit' ? 0 : 2)),
      );
      if (state.s === 'lit') disc(Math.max(1, R * 0.4), col('pearl', 5));
      if (state.s === 'can') ring(R + 1.5, d >= 5 ? 2 : 1);
    }
    s = crisp(cv);
  } else {
    const rimHi = on ? 6 : dim ? 1 : 3;
    if (kind === 'keystone') {
      const wr = R + 3;
      const n = Math.max(10, Math.round((2 * Math.PI * wr) / 4));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        ctx.save();
        ctx.translate(c + Math.cos(a) * wr, c + Math.sin(a) * wr);
        ctx.rotate(a + Math.PI / 2 + 0.75);
        ctx.beginPath();
        ctx.ellipse(0, -1.5, 1, 2.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = col('green', dim ? 1 : on ? 5 : 3);
        ctx.fill();
        ctx.restore();
      }
    }
    disc(R, col('gold', rimHi - 1));
    disc(R - 1, col('gold', rimHi));
    disc(R - 2, col('ink', 0));
    disc(
      R - 3,
      dim
        ? col('lapis', 2)
        : L.lit(
            ctx,
            ramp,
            c - R * 0.35,
            c - R * 0.4,
            R * 1.4,
            from - (on || state.s === 'lit' ? 0 : 2),
          ),
    );
    if (d >= 14 && TONE_GLYPH[tone]) {
      ctx.save();
      ctx.translate(c, c);
      const k = ((R - 3) * 0.72) / 11;
      ctx.scale(k, k);
      ctx.fillStyle = col('ink', 0);
      ctx.translate(1 / k, 1 / k);
      ctx.fill(new Path2D(TONE_GLYPH[tone]));
      ctx.translate(-1 / k, -1 / k);
      ctx.fillStyle = col('pearl', on ? 5 : dim ? 1 : 3);
      ctx.fill(new Path2D(TONE_GLYPH[tone]));
      ctx.restore();
    }
    if (on && kind !== 'notable') {
      const n = Math.round((2 * Math.PI * (R - 2.5)) / 3);
      for (let i = 0; i < n; i++)
        L.pearl(
          ctx,
          Math.round(c + Math.cos((i / n) * 6.283) * (R - 2.5)),
          Math.round(c + Math.sin((i / n) * 6.283) * (R - 2.5)),
          false,
          i % 2,
        );
    }
    if (state.s === 'can' || state.s === 'lit') ring(R + 1.5, 2);
    L.age(cv, L.rng(L.seedOf(key)), {
      loss: 0.02,
      cracks: 0,
      texture: 0.35,
      grime: 0.4,
      edgeBias: 0.6,
      edgeReach: 2,
      goldLoss: on ? 0.03 : 0.1,
      shadow: true,
    });
    s = cv;
  }
  sprites.set(key, s);
  return s;
}
/** How big a node is drawn at this zoom, in art pixels across. */
const MIN_D = { travel: 2, hub: 3, small: 3, notable: 8, keystone: 12, start: 14 };
const MAX_D = { travel: 5, hub: 7, small: 9, notable: 24, keystone: 34, start: 38 };
const diam = (kind, k) =>
  Math.max(
    MIN_D[kind],
    Math.min(MAX_D[kind], Math.round((2 * NODE_RADIUS[kind] * k * shapeScale(kind, k)) / P)),
  );

// ---- The sky: painted once per size, worn lapis with a gold rim ----
const skies = new Map();
function sky(w, h) {
  const key = `${w}x${h}`;
  if (skies.has(key)) return skies.get(key);
  const cv = L.canvas(w, h),
    ctx = cv.getContext('2d');
  ctx.fillStyle = col('gold', 5);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = col('gold', 6);
  ctx.fillRect(1, 1, w - 2, h - 2);
  ctx.fillStyle = col('ink', 0);
  ctx.fillRect(3, 3, w - 6, h - 6);
  const g = ctx.createRadialGradient(
    w * 0.45,
    h * 0.4,
    0,
    w * 0.45,
    h * 0.4,
    Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, col('lapis', 2));
  g.addColorStop(0.6, col('lapis', 1));
  g.addColorStop(1, col('lapis', 0));
  ctx.fillStyle = g;
  ctx.fillRect(4, 4, w - 8, h - 8);
  const r = L.rng(91);
  for (let i = 0; i < (w * h) / 900; i++) {
    ctx.fillStyle = col('gold', 2 + Math.floor(r() * 2));
    ctx.fillRect(4 + Math.floor(r() * (w - 8)), 4 + Math.floor(r() * (h - 8)), 1, 1);
  }
  const url = L.age(cv, L.rng(77), {
    loss: 0.012,
    blotch: 6,
    cracks: Math.round((w * h) / 5000),
    crackLen: 24,
    texture: 0.7,
    grime: 0.7,
    edgeBias: 0.2,
    goldLoss: 0.1,
  });
  skies.set(key, url);
  return url;
}

// ---- Drawing ----
let tv,
  art,
  actx,
  edgeCv,
  labelsEl,
  W = 0,
  H = 0,
  w = 0,
  h = 0,
  queued = false;
const draw = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    frame();
  });
};
function nodeState(id, path, hits) {
  const n = N[id];
  if (n.kind === 'start') return id === START ? 'on' : 'off';
  if (alloc.has(id)) return 'on';
  if (path?.has(id)) return 'path';
  const filtering = hits || lightTone;
  if (filtering) {
    const match = (hits && hits.has(id)) || (lightTone && info.get(id).tone === lightTone);
    return match ? 'lit' : 'dim';
  }
  return linkedToAlloc(id) ? 'can' : 'off';
}
function frame() {
  if (!art) return;
  const k = view.k,
    s = k / P;
  const ox = Math.round(w / 2 - view.x * s),
    oy = Math.round(h / 2 - view.y * s);
  const X = (n) => Math.round(n.x * s) + ox,
    Y = (n) => Math.round(n.y * s) + oy;
  actx.clearRect(0, 0, w, h);
  const looking = hover ?? sel;
  const path = looking != null && !alloc.has(looking) ? new Set(pathTo(looking) ?? []) : null;
  const hits = searchHits();
  // Lines: dim threads, gold where taken, pearl along the path being looked at. Drawn crisp on their own layer.
  const ec = edgeCv.getContext('2d');
  ec.setTransform(1, 0, 0, 1, 0, 0);
  ec.clearRect(0, 0, w, h);
  ec.setTransform(s, 0, 0, s, ox, oy);
  const taken = (id) => alloc.has(id) || id === START;
  const pass = (pick, style, width) => {
    ec.strokeStyle = style;
    ec.lineWidth = width / s;
    for (const [a, b, p] of EDGES) if (pick(a, b)) ec.stroke(p);
  };
  pass((a, b) => !(taken(a) && taken(b)), col('gold', 2), 1);
  pass((a, b) => taken(a) && taken(b), col('gold', 3), 3);
  pass((a, b) => taken(a) && taken(b), col('gold', 6), 1.6);
  if (path?.size)
    pass(
      (a, b) =>
        (path.has(a) || taken(a)) && (path.has(b) || taken(b)) && (path.has(a) || path.has(b)),
      col('pearl', 4),
      1.6,
    );
  crisp(edgeCv);
  actx.drawImage(edgeCv, 0, 0);
  // Nodes, smallest first, so a notable sits over the lines and dots near it.
  const order = ['travel', 'hub', 'small', 'notable', 'keystone', 'start'];
  const vis = [];
  for (const kind of order) {
    const d = diam(kind, k);
    for (const n of LIVE) {
      if (n.kind !== kind) continue;
      const x = X(n),
        y = Y(n);
      if (x < -40 || y < -40 || x > w + 40 || y > h + 40) continue;
      const st = nodeState(n.id, path, hits);
      const sp = sprite(
        kind,
        info.get(n.id).tone,
        {
          s: st,
          cls: n.classStart,
          toString() {
            return st + (n.classStart ?? '');
          },
        },
        d,
      );
      actx.drawImage(sp, x - Math.floor(sp.width / 2), y - Math.floor(sp.height / 2));
      vis.push({ n, x, y, d, st });
    }
  }
  if (sel != null) {
    const n = N[sel];
    const x = X(n),
      y = Y(n),
      r = Math.ceil(diam(n.kind, k) / 2) + 4;
    actx.fillStyle = col('pearl', 5);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      actx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
    }
  }
  placeLabels(vis, k, X, Y, path, hits);
}

// ---- Words: placed where they fit, most wanted first ----
const meas = L.canvas(1, 1).getContext('2d');
const widthCache = new Map();
const textW = (t, font) => {
  const k = font + t;
  if (!widthCache.has(k)) {
    meas.font = font;
    widthCache.set(k, meas.measureText(t).width);
  }
  return widthCache.get(k);
};
const F_NOTE = '600 17px Grenze, Georgia, serif';
const F_SMALL = '400 17px Grenze, Georgia, serif';
const F_KEY = "400 24px 'Jacquard 24', Georgia, serif";
function placeLabels(vis, k, X, Y, path, hits) {
  const out = [];
  const boxes = [];
  const free = (b) =>
    b.x >= 6 &&
    b.y >= 6 &&
    b.x + b.w <= W - 6 &&
    b.y + b.h <= H - 6 &&
    !boxes.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
  // The panel, the search bar, the points and the zoom buttons are obstacles for words; so are big nodes.
  const tr = tv.getBoundingClientRect(),
    sc = tr.width / W || 1;
  for (const el of tv.querySelectorAll('.tv-ledger:not([hidden]), .tv-hud > *')) {
    const r = el.getBoundingClientRect();
    if (r.width)
      boxes.push({
        x: (r.left - tr.left) / sc - 4,
        y: (r.top - tr.top) / sc - 4,
        w: r.width / sc + 8,
        h: r.height / sc + 8,
      });
  }
  for (const v of vis)
    if (v.d >= 8) {
      const r = (v.d / 2 + 2) * P;
      boxes.push({ x: v.x * P - r, y: v.y * P - r, w: 2 * r, h: 2 * r });
    }
  const want = [];
  const visById = new Map(vis.map((v) => [v.n.id, v]));
  const pri = (v) =>
    v.n.id === sel
      ? 0
      : path?.has(v.n.id)
        ? 1
        : v.st === 'lit'
          ? 2
          : v.st === 'on'
            ? 3
            : v.st === 'can'
              ? 4
              : 5;
  for (const v of vis) {
    const { n } = v;
    if (n.kind === 'start')
      want.push({
        v,
        text: n.classStart[0].toUpperCase() + n.classStart.slice(1),
        font: F_KEY,
        cls: 'tv-key',
        p: -1,
      });
    else if (n.kind === 'keystone' && k >= 0.1)
      want.push({ v, text: n.name, font: F_KEY, cls: 'tv-key', p: pri(v) });
    else if (n.kind === 'notable' && k >= 0.2)
      want.push({ v, text: n.name, font: F_NOTE, cls: `tv-note ${v.st}`, p: pri(v) + 0.5 });
  }
  if (k >= 0.26)
    for (const r of RUNS) {
      const v = visById.get(r.anchor);
      if (!v) continue;
      const st = r.ids.some((id) => alloc.has(id))
        ? 'on'
        : r.ids.some((id) => path?.has(id))
          ? 'path'
          : '';
      want.push({
        v,
        text: r.text,
        font: F_SMALL,
        cls: `tv-small ${st}`,
        p:
          (st === 'path' ? 1 : st === 'on' ? 3.6 : 6) +
          0.001 * Math.hypot(v.x - w / 2, v.y - h / 2),
      });
    }
  want.sort((a, b) => a.p - b.p);
  let placed = 0;
  for (const it of want) {
    if (placed > 170) break;
    const tw = textW(it.text, it.font) + 4,
      th = it.font === F_KEY ? 26 : 21;
    const cx = it.v.x * P,
      cy = it.v.y * P,
      r = (it.v.d / 2 + 1.5) * P;
    const tries = [
      { x: cx - tw / 2, y: cy + r },
      { x: cx - tw / 2, y: cy - r - th },
      { x: cx + r + 2, y: cy - th / 2 },
      { x: cx - r - 2 - tw, y: cy - th / 2 },
      { x: cx + r, y: cy + r - 4 },
      { x: cx - r - tw, y: cy + r - 4 },
      { x: cx + r, y: cy - r - th + 4 },
      { x: cx - r - tw, y: cy - r - th + 4 },
    ];
    for (const t of tries) {
      const b = { x: t.x, y: t.y, w: tw, h: th };
      if (!free(b)) continue;
      boxes.push(b);
      out.push(
        `<span class="${it.cls}" style="left:${Math.round(b.x)}px;top:${Math.round(b.y)}px">${it.text}</span>`,
      );
      placed++;
      break;
    }
  }
  // Area names, large and faint, when zoomed out, wherever the node names left room.
  const aAlpha = k <= 0.14 ? 1 : k >= 0.3 ? 0 : 1 - (k - 0.14) / 0.16;
  if (aAlpha > 0)
    for (const a of tree.areas ?? []) {
      const x = X(a) * P,
        y = Y(a) * P;
      const px = phone() ? 32 : 48;
      const tw = textW(a.name, `400 ${px}px 'Jacquard 24', Georgia, serif`),
        b = { x: x - tw / 2, y: y - px / 2, w: tw, h: px };
      if (!free(b)) continue;
      boxes.push(b);
      out.push(
        `<span class="tv-area" style="left:${x}px;top:${y}px;opacity:${(aAlpha * 0.85).toFixed(2)}">${a.name}</span>`,
      );
    }
  labelsEl.innerHTML = out.join('');
}

// ---- The panel: the node being looked at, then what your passives give ----
function ledger() {
  const n = sel != null ? N[sel] : null;
  let look = '';
  if (n) {
    const inf = info.get(n.id);
    const path = pathTo(n.id);
    const kindName = {
      small: 'Passive',
      travel: 'Passive',
      hub: 'Passive',
      notable: 'Notable',
      keystone: 'Keystone',
      start: 'Start',
    }[n.kind];
    let act = '';
    if (n.kind === 'start') act = '<p class="tv-why">Where the Mystic begins.</p>';
    else if (alloc.has(n.id))
      act = canRemove(n.id)
        ? '<button class="btn" data-paint="panel" data-thin data-tv="refund">Refund</button><p class="tv-why">Tap it again to refund.</p>'
        : '<p class="tv-why">Other passives hang from this one.</p>';
    else if (path) {
      const on = path.slice(0, -1);
      const way = on.length ? totals(on) : [];
      act = `${way.length ? `<div class="tv-way"><span class="muted">On the way (${on.length}):</span> ${way.join(', ')}</div>` : ''}
        <button class="btn primary" data-paint="panel" data-thin data-field="vermilion" data-tv="take" ${path.length > points ? 'disabled' : ''}>Take · ${path.length} point${path.length === 1 ? '' : 's'}</button>
        <p class="tv-why">${path.length > points ? `You have ${points}.` : 'Or tap it again.'}</p>`;
    }
    look = `<section class="tv-look">
      <div class="tv-lookhead"><span class="tv-name">${n.kind === 'start' ? 'Mystic' : n.name || inf.short}</span><button class="btn sq" data-paint="panel" data-thin data-tv="close" aria-label="Close">×</button></div>
      <div class="muted">${kindName}</div>
      <ul class="tv-lines">${inf.lines.map((l) => `<li>${l}</li>`).join('')}</ul>
      <div class="tv-act">${act}</div></section>`;
  }
  const all = totals([...alloc]);
  const list = showAll ? all : all.slice(0, 12);
  return `${look}<section class="tv-sum">
    <h4 class="lf-h">Your passives</h4>
    <ul class="tv-lines">${list.map((l) => `<li>${l}</li>`).join('')}</ul>
    ${all.length > 12 ? `<button class="btn small" data-paint="panel" data-thin data-tv="all">${showAll ? 'Fewer' : `All ${all.length}`}</button>` : ''}
  </section>`;
}
function hud() {
  const hits = searchHits();
  return `<div class="medal tv-points" data-field="azure,2" data-medal="stars"><span>Points</span><b>${points}</b><i class="lf-note" data-paint="panel" data-thin>No refunds</i></div>
    <div class="tv-find">
      <span class="ix-search" data-paint="panel" data-thin><input class="tv-q" placeholder="Find: mana, fire, spell crit…" value="${query.replace(/"/g, '&quot;')}" /></span>
      ${hits ? `<span class="tv-count" data-paint="panel" data-thin>${hits.size} found</span>` : ''}
      <span class="sel" data-paint="panel" data-thin><select class="tv-light"><option value="">Light up…</option>${TONE_LABEL.map(([t, l]) => `<option value="${t}"${t === lightTone ? ' selected' : ''}>${l}</option>`).join('')}</select></span>
    </div>
    <div class="tv-zoom"><button class="btn sq" data-paint="panel" data-thin data-tv="in" aria-label="Zoom in">+</button><button class="btn sq" data-paint="panel" data-thin data-tv="out" aria-label="Zoom out">−</button><button class="btn sq" data-paint="panel" data-thin data-tv="home" aria-label="Centre on your passives">◎</button></div>
    <button class="btn small tv-sumbtn" data-paint="panel" data-thin data-tv="sum">${tv?.dataset.sum ? 'Hide totals' : 'Your passives'}</button>`;
}

const phone = () => document.documentElement.dataset.width === 'phone';
function refreshUi() {
  if (!tv) return;
  tv.querySelector('.tv-hud').innerHTML = hud();
  const led = tv.querySelector('.tv-ledger');
  led.innerHTML = ledger();
  led.hidden = phone() && sel == null && !tv.dataset.sum;
  bindUi();
  window.studyPaint();
}
function take(id) {
  const path = pathTo(id);
  if (!path || !path.length || path.length > points) return;
  history.push([new Set(alloc), points]);
  path.forEach((p) => alloc.add(p));
  points -= path.length;
}
function act(a) {
  if (a === 'take') take(sel);
  if (a === 'refund' && canRemove(sel)) {
    history.push([new Set(alloc), points]);
    alloc.delete(sel);
    points++;
  }
  if (a === 'close') sel = null;
  if (a === 'sum') tv.dataset.sum ? delete tv.dataset.sum : (tv.dataset.sum = '1');
  if (a === 'all') showAll = !showAll;
  if (a === 'in' || a === 'out') zoomAt(W / 2, H / 2, a === 'in' ? 1.4 : 1 / 1.4);
  if (a === 'home') home();
  refreshUi();
  draw();
}
function bindUi() {
  tv.querySelectorAll('[data-tv]').forEach((b) => (b.onclick = () => act(b.dataset.tv)));
  const q = tv.querySelector('.tv-q');
  q.oninput = () => {
    query = q.value;
    draw();
    const c = searchHits();
    let el = tv.querySelector('.tv-count');
    if (c && !el)
      (refreshUi(),
        tv.querySelector('.tv-q').focus(),
        tv.querySelector('.tv-q').setSelectionRange(query.length, query.length));
    else if (el) c ? (el.textContent = `${c.size} found`) : refreshUi();
  };
  tv.querySelector('.tv-light').onchange = (e) => {
    lightTone = e.target.value;
    draw();
  };
}

// ---- Moving about ----
function home() {
  const ids = [START, ...alloc];
  const xs = ids.map((id) => N[id].x),
    ys = ids.map((id) => N[id].y);
  view.x = (Math.min(...xs) + Math.max(...xs)) / 2;
  view.y = (Math.min(...ys) + Math.max(...ys)) / 2;
  view.k = Math.min(
    0.42,
    Math.max(
      0.16,
      Math.min(
        W / (Math.max(...xs) - Math.min(...xs) + 900),
        H / (Math.max(...ys) - Math.min(...ys) + 700),
      ),
    ),
  );
}
function zoomAt(sx, sy, f) {
  const k2 = Math.max(0.06, Math.min(1.3, view.k * f));
  const tx = view.x + (sx - W / 2) / view.k,
    ty = view.y + (sy - H / 2) / view.k;
  view.k = k2;
  view.x = tx - (sx - W / 2) / k2;
  view.y = ty - (sy - H / 2) / k2;
}
function nodeAt(sx, sy, coarse) {
  const k = view.k;
  let best = null,
    bd = Infinity;
  for (const n of LIVE) {
    const x = (n.x - view.x) * k + W / 2,
      y = (n.y - view.y) * k + H / 2;
    const d = Math.hypot(x - sx, y - sy);
    const reach = Math.max((diam(n.kind, k) / 2) * P + 3, coarse ? 22 : 9);
    if (d < reach && d < bd) ((bd = d), (best = n.id));
  }
  return best;
}
function bindView() {
  const ptrs = new Map();
  let drag = null,
    pinch = null;
  const pos = (e) => {
    const r = art.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  art.onpointerdown = (e) => {
    try {
      art.setPointerCapture(e.pointerId);
    } catch {}
    ptrs.set(e.pointerId, pos(e));
    if (ptrs.size === 1) drag = { start: pos(e), last: pos(e), moved: false };
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: view.k };
    }
  };
  art.onpointermove = (e) => {
    const p = pos(e);
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, p);
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      const f = Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d;
      zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (pinch.k * f) / view.k);
      draw();
      return;
    }
    if (drag && ptrs.size === 1) {
      if (
        Math.hypot(p[0] - drag.start[0], p[1] - drag.start[1]) >
        (e.pointerType === 'mouse' ? 5 : 10)
      )
        drag.moved = true;
      if (drag.moved) {
        view.x -= (p[0] - drag.last[0]) / view.k;
        view.y -= (p[1] - drag.last[1]) / view.k;
        drag.last = p;
        draw();
      }
      return;
    }
    if (e.pointerType === 'mouse') {
      const id = nodeAt(p[0], p[1], false);
      if (id !== hover) {
        hover = id;
        art.style.cursor = id != null ? 'pointer' : 'grab';
        draw();
      }
    }
  };
  art.onpointerup = art.onpointercancel = (e) => {
    const p = pos(e);
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (drag && !drag.moved && e.type === 'pointerup') {
      const id = nodeAt(p[0], p[1], e.pointerType !== 'mouse');
      // Tap to look; tap the same node again to take it (or refund it).
      if (id != null && id === sel) {
        if (alloc.has(id)) act('refund');
        else act('take');
      } else {
        sel = id;
        refreshUi();
        draw();
      }
    }
    if (!ptrs.size) drag = null;
  };
  art.onpointerleave = () => {
    if (hover != null) ((hover = null), draw());
  };
  art.onwheel = (e) => {
    e.preventDefault();
    const p = pos(e);
    zoomAt(p[0], p[1], e.deltaY < 0 ? 1.15 : 1 / 1.15);
    draw();
  };
}

function size() {
  const r = tv.getBoundingClientRect();
  W = Math.round(r.width);
  H = Math.round(r.height);
  w = Math.ceil(W / P);
  h = Math.ceil(H / P);
  art.width = w;
  art.height = h;
  art.style.width = `${w * P}px`;
  art.style.height = `${h * P}px`;
  edgeCv.width = w;
  edgeCv.height = h;
  actx = art.getContext('2d');
  actx.imageSmoothingEnabled = false;
  tv.querySelector('.tv-sky').style.background = `url(${sky(w, h)}) 0 0 / ${w * P}px ${h * P}px`;
}

window.STUDY = window.STUDY || {};
window.STUDY.tree = {
  next: 'Next: Items ▸',
  html: () =>
    `<div class="tv"><div class="tv-sky"></div><canvas class="tv-art"></canvas><div class="tv-labels"></div><div class="tv-hud"></div><aside class="tv-ledger" data-paint="panel"></aside></div>`,
  mount(frame) {
    tv = frame.querySelector('.tv');
    art = tv.querySelector('.tv-art');
    labelsEl = tv.querySelector('.tv-labels');
    edgeCv = L.canvas(1, 1);
    size();
    if (!view) {
      view = { x: 0, y: 0, k: 0.3 };
      home();
    }
    bindView();
    refreshUi();
    draw();
    new ResizeObserver(() => {
      if (!tv.isConnected) return;
      const r = tv.getBoundingClientRect();
      if (Math.round(r.width) !== W || Math.round(r.height) !== H) (size(), draw());
    }).observe(tv);
    document.fonts.ready.then(() => (widthCache.clear(), draw()));
  },
};
if (document.documentElement.dataset.screen === 'tree') window.studyRender?.();
