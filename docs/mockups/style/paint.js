/* Gold Leaf painter (style study only). Every surface is drawn at 1/P of screen resolution with plain canvas shapes,
   snapped to a palette of colour ramps (edges and shading come out as hard pixel steps), mottled along its ramp, then
   aged: grime at the edges, flakes of gold lost to the red bole beneath, paint worn through to plaster, cracks, a few
   glints. The result is scaled back up with hard pixels; the text on top stays smooth. */
(function () {
  const P = 2;
  const RAMPS = {
    gold: ['#4a3616', '#634a21', '#7e622c', '#977835', '#ad8b40', '#c09d4e', '#d1b062', '#e2c681'],
    bole: ['#2e140d', '#431f15', '#5a2b1d', '#703826'],
    plaster: ['#4b463b', '#655f50', '#807866', '#9b927c', '#b3aa92'],
    ink: ['#0b0805', '#17110b', '#251c13'],
    lapis: ['#0c1129', '#11183a', '#172049', '#1d2958', '#24336a', '#2f417e', '#3f5291'],
    pearl: ['#7a7262', '#9a917c', '#b6ad95', '#cec6ad', '#e0d9c2', '#eee8d6'],
    vermilion: ['#3b120c', '#541a12', '#702418', '#8a3020', '#a23f2b', '#b6553d', '#c87257'],
    green: ['#112118', '#193022', '#23422d', '#2f5639', '#3f6c48', '#55845a', '#709c71'],
    teal: ['#122a31', '#1a3c46', '#25515c', '#326773', '#447f8b', '#6098a3', '#84b2b9'],
    porphyry: ['#1b0d14', '#28131e', '#381a2a', '#492337', '#5b2e46', '#713c58', '#88506d'],
    straw: ['#675b35', '#827444', '#9d8f57', '#b6a86e', '#ccbf8a', '#ddd2a8'],
    violet: ['#221930', '#312445', '#433359', '#57456f', '#6d5a87', '#8672a0', '#a08db8'],
    sky: ['#485564', '#617081', '#7c8d9f', '#99a9b9', '#b7c4d1', '#d3dce5'],
    azure: ['#1d3672', '#264993', '#335fb2', '#4877cb', '#6893dd', '#93b4ec'],
  };
  const NAMES = Object.keys(RAMPS);
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const RGB = NAMES.map((n) => RAMPS[n].map(rgb));
  const RI = Object.fromEntries(NAMES.map((n, i) => [n, i]));
  const col = (n, i) => RAMPS[n][Math.max(0, Math.min(RAMPS[n].length - 1, i))];
  // Each ramp loses to what lies under it; ink, bole and plaster do not flake.
  const LOSS_TO = {
    gold: 'bole',
    lapis: 'plaster',
    pearl: 'plaster',
    vermilion: 'plaster',
    green: 'plaster',
    teal: 'plaster',
    porphyry: 'plaster',
    straw: 'plaster',
    sky: 'plaster',
    violet: 'plaster',
    azure: 'plaster',
  };

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const seedOf = (s) => {
    let h = 2166136261;
    for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0;
  };
  /** Smooth value noise in 0..1 that tiles over W x H. */
  function noise(r, W, H, cell) {
    const gw = Math.max(1, Math.round(W / cell)),
      gh = Math.max(1, Math.round(H / cell));
    const g = Float32Array.from({ length: gw * gh }, r);
    const at = (x, y) => g[(((y % gh) + gh) % gh) * gw + (((x % gw) + gw) % gw)];
    const s = (t) => t * t * (3 - 2 * t);
    return (x, y) => {
      const fx = (x / W) * gw,
        fy = (y / H) * gh,
        ix = Math.floor(fx),
        iy = Math.floor(fy);
      const tx = s(fx - ix),
        ty = s(fy - iy);
      const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * tx;
      const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * tx;
      return a + (b - a) * ty;
    };
  }
  const canvas = (W, H) => Object.assign(document.createElement('canvas'), { width: W, height: H });

  const nearCache = new Map();
  function nearest(r, g, b) {
    const k = (r << 16) | (g << 8) | b;
    let hit = nearCache.get(k);
    if (hit !== undefined) return hit;
    let best = 1e9;
    for (let ri = 0; ri < RGB.length; ri++)
      for (let i = 0; i < RGB[ri].length; i++) {
        const c = RGB[ri][i],
          e = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
        if (e < best) ((best = e), (hit = ri * 16 + i));
      }
    nearCache.set(k, hit);
    return hit;
  }

  /** Snap to the ramps, mottle, age. o: loss (share of flaking pixels), cracks, texture, grime, wrapX, wrapY. */
  function age(cv, r, o = {}) {
    const W = cv.width,
      H = cv.height,
      ctx = cv.getContext('2d');
    const img = ctx.getImageData(0, 0, W, H),
      d = img.data,
      N = W * H;
    const ramp = new Int8Array(N).fill(-1),
      idx = new Int8Array(N);
    for (let p = 0; p < N; p++) {
      if (d[p * 4 + 3] < 128) continue;
      const h = nearest(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]);
      ramp[p] = h >> 4;
      idx[p] = h & 15;
    }
    const at = (x, y) => {
      if (o.wrapX) x = (x + W) % W;
      else if (x < 0 || x >= W) return -1;
      if (o.wrapY) y = (y + H) % H;
      else if (y < 0 || y >= H) return -1;
      return y * W + x;
    };
    const opaque = (x, y) => {
      const p = at(x, y);
      return p >= 0 && ramp[p] >= 0;
    };
    const bc = o.blotch ?? 4;
    const n1 = noise(r, W, H, 10),
      n2 = noise(r, W, H, 3),
      n3 = noise(r, W, H, 16),
      n4 = noise(r, W, H, bc),
      n5 = noise(r, W, H, bc * 5);
    const tex = o.texture ?? 1,
      grime = o.grime ?? 1;
    // Mottle along the ramp; darken grimy patches and the pixels near an edge.
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (ramp[p] < 0 || ramp[p] === RI.ink) continue;
        let s = ((n1(x, y) - 0.5) * 2.2 + (n2(x, y) - 0.5) * 1.4 + (r() - 0.5) * 1.1) * tex;
        if (n3(x, y) > 0.66) s -= grime;
        let edge = false;
        for (let k = 1; k <= 2 && !edge; k++)
          edge = !opaque(x - k, y) || !opaque(x + k, y) || !opaque(x, y - k) || !opaque(x, y + k);
        if (edge) s -= 0.9 * grime;
        idx[p] = Math.max(0, Math.min(RGB[ramp[p]].length - 1, idx[p] + Math.round(s)));
      }
    // Flakes: the most exposed share of each flaking pixel, by blotchy noise, more of it near the edges.
    const loss = o.loss ?? 0.08;
    if (loss > 0) {
      const v = new Float32Array(N).fill(-1),
        list = [];
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const p = y * W + x;
          if (ramp[p] < 0 || !LOSS_TO[NAMES[ramp[p]]]) continue;
          let e = 0;
          const reach = o.edgeReach ?? 4;
          for (let k = 1; k <= reach && !e; k++)
            if (!opaque(x - k, y) || !opaque(x + k, y) || !opaque(x, y - k) || !opaque(x, y + k))
              e = (reach + 1 - k) / reach;
          v[p] = n4(x, y) * 0.5 + n5(x, y) * 0.5 + e * (o.edgeBias ?? 0.12) + r() * 0.04;
          list.push(v[p]);
        }
      list.sort((a, b) => a - b);
      const cut = list[Math.floor(list.length * (1 - loss))] ?? 2;
      const lost = new Uint8Array(N);
      for (let p = 0; p < N; p++)
        if (
          v[p] >= cut &&
          !(o.goldLoss !== undefined && ramp[p] === RI.gold && r() >= o.goldLoss)
        ) {
          const to = LOSS_TO[NAMES[ramp[p]]];
          ramp[p] = RI[to];
          idx[p] = to === 'bole' ? 1 + Math.floor(r() * 3) : 1 + Math.floor(r() * 3);
          lost[p] = 1;
        }
      // The broken edge of a flake: a dark lip along its top, a lit one along its bottom.
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const p = y * W + x;
          if (!lost[p]) continue;
          const up = at(x, y - 1),
            dn = at(x, y + 1);
          if (up >= 0 && !lost[up] && ramp[up] >= 0) idx[p] = 0;
          if (dn >= 0 && !lost[dn] && ramp[dn] >= 0 && ramp[dn] !== RI.ink)
            idx[dn] = Math.min(RGB[ramp[dn]].length - 1, idx[dn] + 1);
        }
    }
    // Cracks: short wandering walks to the darkest step of whatever they cross.
    const DIRS = [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
    ];
    for (let c = 0; c < (o.cracks ?? 0); c++) {
      let x = Math.floor(r() * W),
        y = Math.floor(r() * H),
        dir = Math.floor(r() * 8);
      const len = 6 + Math.floor(r() * (o.crackLen ?? 26));
      for (let s = 0; s < len; s++) {
        const p = at(x, y);
        if (p >= 0 && ramp[p] >= 0 && ramp[p] !== RI.ink) idx[p] = ramp[p] === RI.gold ? 1 : 0;
        if (r() < 0.35) dir = (dir + (r() < 0.5 ? 1 : 7)) % 8;
        x += DIRS[dir][0];
        y += DIRS[dir][1];
        if (r() < 0.04) {
          // a branch
          const bx = x,
            by = y,
            bd = (dir + 2) % 8;
          for (let k = 0, xx = bx, yy = by; k < 5; k++, xx += DIRS[bd][0], yy += DIRS[bd][1]) {
            const q = at(xx, yy);
            if (q >= 0 && ramp[q] >= 0 && ramp[q] !== RI.ink) idx[q] = 0;
          }
        }
      }
    }
    // A few glints where the leaf still catches the light.
    for (let p = 0; p < N; p++)
      if (ramp[p] === RI.gold && r() < (o.glint ?? 0.006)) idx[p] = RGB[RI.gold].length - 1;
    const shade = new Uint8Array(N);
    if (o.shadow)
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const p = y * W + x;
          if (ramp[p] >= 0) continue;
          if (opaque(x - 1, y - 2) || opaque(x, y - 2) || opaque(x - 1, y - 1)) shade[p] = 120;
          else if (
            (x + y) % 2 === 0 &&
            (opaque(x - 2, y - 3) || opaque(x - 1, y - 3) || opaque(x - 2, y - 2))
          )
            shade[p] = 70;
        }
    for (let p = 0; p < N; p++) {
      if (ramp[p] < 0) {
        d[p * 4] = 10;
        d[p * 4 + 1] = 6;
        d[p * 4 + 2] = 3;
        d[p * 4 + 3] = shade[p];
        continue;
      }
      const c = RGB[ramp[p]][idx[p]];
      d[p * 4] = c[0];
      d[p * 4 + 1] = c[1];
      d[p * 4 + 2] = c[2];
      d[p * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return cv.toDataURL();
  }

  // ---- Shapes ----
  function shape(ctx, W, H, inset, archRy) {
    ctx.beginPath();
    const x0 = inset,
      x1 = W - inset,
      y1 = H - inset;
    if (archRy) {
      const rx = (x1 - x0) / 2,
        ry = Math.max(1, archRy - inset),
        cy = inset + ry;
      ctx.moveTo(x0, y1);
      ctx.lineTo(x0, cy);
      ctx.ellipse(x0 + rx, cy, rx, ry, 0, Math.PI, 2 * Math.PI);
      ctx.lineTo(x1, y1);
      ctx.closePath();
    } else ctx.rect(x0, inset, x1 - x0, y1 - inset);
  }
  /** A soft light from the top left across a field, which the ramps turn into hard steps. */
  function lit(ctx, field, x, y, rad, from = 4) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, col(field, from + 1));
    g.addColorStop(0.45, col(field, from));
    g.addColorStop(1, col(field, from - 2));
    return g;
  }
  /** A running wave scroll in gold on lapis, h pixels tall, then a gold and an ink line under it. */
  function wave(ctx, x0, x1, y, h) {
    ctx.fillStyle = col('lapis', 1);
    ctx.fillRect(x0, y, x1 - x0, h);
    const k = h / 7,
      per = Math.round(14 * k);
    ctx.strokeStyle = col('gold', 6);
    ctx.lineWidth = 1.2 * Math.max(1, k * 0.8);
    for (let x = x0 - per; x < x1; x += per) {
      ctx.beginPath();
      ctx.moveTo(x, y + h - 1.5 * k);
      ctx.bezierCurveTo(
        x + 5 * k,
        y + h - 1.5 * k,
        x + 6 * k,
        y + 1.5 * k,
        x + 9.5 * k,
        y + 1.5 * k,
      );
      ctx.bezierCurveTo(
        x + 13 * k,
        y + 1.5 * k,
        x + 13 * k,
        y + h - 2.5 * k,
        x + 10.5 * k,
        y + h - 3 * k,
      );
      ctx.bezierCurveTo(
        x + 9 * k,
        y + h - 3.2 * k,
        x + 8.6 * k,
        y + h - 4.6 * k,
        x + 10 * k,
        y + h - 4.8 * k,
      );
      ctx.stroke();
    }
    ctx.fillStyle = col('gold', 5);
    ctx.fillRect(x0, y + h, x1 - x0, 1);
    ctx.fillStyle = col('ink', 0);
    ctx.fillRect(x0, y + h + 1, x1 - x0, 1);
  }
  function tileRow(ctx, x0, x1, y) {
    const C = [
      col('vermilion', 5),
      col('pearl', 4),
      col('lapis', 5),
      col('gold', 6),
      col('green', 5),
      col('pearl', 4),
    ];
    ctx.fillStyle = col('ink', 0);
    ctx.fillRect(x0, y, x1 - x0, 5);
    for (let x = x0 + 1, i = 0; x < x1 - 1; x += 4, i++) {
      ctx.fillStyle = C[i % C.length];
      ctx.fillRect(x, y + 1, Math.min(3, x1 - 1 - x), 3);
    }
  }
  function pearl(ctx, x, y, big, gold) {
    const n = gold ? 'gold' : 'pearl';
    ctx.fillStyle = col(n, gold ? 6 : 4);
    if (big) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
      ctx.fillStyle = col(n, gold ? 7 : 5);
      ctx.fillRect(x - 1, y - 1, 1, 1);
    } else ctx.fillRect(x, y, 1, 1);
  }

  /** A framed field: ink edge, gold rim, ink, then the field lit from the top left; maybe arched, maybe with wave
   *  scroll along top and bottom, pearls inside the arch and a tile row along the foot. */
  function panel(W0, H0, o) {
    const m = o.thin ? 2 : 3,
      W = W0 - 2 * m,
      H = H0 - 2 * m;
    const out = canvas(W0, H0);
    out.getContext('2d').drawImage(panelCore(W, H, o), m, m);
    return out;
  }
  function panelCore(W, H, o) {
    const cv = canvas(W, H),
      ctx = cv.getContext('2d');
    const ar = o.arch ? Math.min(Math.round(W / 2), 84) : 0;
    const t = o.thin ? 3 : 5;
    const fill = (inset, style) => {
      ctx.fillStyle = style;
      shape(ctx, W, H, inset, ar);
      ctx.fill();
    };
    fill(0, col(o.rim ?? 'gold', 5));
    if (!o.thin) fill(1, col(o.rim ?? 'gold', 6));
    fill(t, col('ink', 0));
    fill(
      t + 1,
      lit(
        ctx,
        o.field,
        W * 0.3,
        ar ? ar * 0.5 : H * 0.1,
        Math.max(W, H) * 1.1,
        o.field === 'gold' ? 5 : 4,
      ),
    );
    if (o.wave) {
      wave(ctx, t + 1, W - t - 1, t + 1, 7);
      ctx.save();
      ctx.translate(0, H);
      ctx.scale(1, -1);
      wave(ctx, t + 1, W - t - 1, t + 1, 7);
      ctx.restore();
    }
    if (o.foot) tileRow(ctx, t + 1, W - t - 1, H - t - 6);
    if (o.pearls && ar) {
      const ins = t + 3,
        rx = (W - 2 * ins) / 2,
        ry = ar - ins,
        cy = ins + ry,
        footY = H - t - 9;
      const n = Math.round((Math.PI * (rx + ry)) / 2 / 4);
      for (let i = 0; i <= n; i++) {
        const a = Math.PI + (i / n) * Math.PI;
        pearl(
          ctx,
          Math.round(W / 2 + Math.cos(a) * rx),
          Math.round(cy + Math.sin(a) * ry),
          true,
          i % 2 === 1,
        );
      }
      for (let y = cy + 4, k = 0; y < footY; y += 4, k++) {
        pearl(ctx, ins, Math.round(y), true, k % 2 === 1);
        pearl(ctx, W - ins, Math.round(y), true, k % 2 === 1);
      }
    }
    return cv;
  }

  /** The damage-type bar: a gold-rimmed strip of small tiles, each run of tiles in its damage type's colour. */
  const MIX_RAMP = [
    ['pearl', 4],
    ['violet', 5],
    ['teal', 5],
    ['vermilion', 5],
    ['green', 5],
  ];
  function mixBar(W, H, mix) {
    const cv = canvas(W, H),
      ctx = cv.getContext('2d');
    ctx.fillStyle = col('ink', 0);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = col('gold', 5);
    ctx.fillRect(1, 1, W - 2, H - 2);
    ctx.fillStyle = col('ink', 0);
    ctx.fillRect(2, 2, W - 4, H - 4);
    const x0 = 3,
      inner = W - 6,
      total = mix.reduce((a, b) => a + b, 0) || 1;
    const cells = Math.floor(inner / 4);
    let acc = 0,
      at = 0;
    const ends = mix.map((m) => Math.round(((acc += m) / total) * cells));
    for (let c = 0; c < cells; c++) {
      while (c >= ends[at] && at < ends.length - 1) at++;
      const [n, i] = MIX_RAMP[at];
      ctx.fillStyle = col(n, i);
      ctx.fillRect(x0 + c * 4, 3, 3, H - 6);
    }
    return cv;
  }

  /** A medallion: the field lit from the top left, a string of pearls, a gold rim between ink lines, maybe a wreath. */
  function medallion(S, o, r) {
    const cv = canvas(S, S),
      ctx = cv.getContext('2d'),
      c = S / 2,
      R = o.R;
    const disc = (rad, style) => {
      ctx.beginPath();
      ctx.arc(c, c, rad, 0, Math.PI * 2);
      ctx.fillStyle = style;
      ctx.fill();
    };
    if (o.wreath) {
      const wr = R + 8;
      ctx.beginPath();
      ctx.arc(c, c, wr, 0, Math.PI * 2);
      ctx.strokeStyle = col('green', 1);
      ctx.lineWidth = 2;
      ctx.stroke();
      const n = Math.round((2 * Math.PI * wr) / 7);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(c + Math.cos(a) * wr, c + Math.sin(a) * wr);
          ctx.rotate(a + Math.PI / 2 + side * 0.75);
          ctx.beginPath();
          ctx.ellipse(0, -3, 1.6, 3.4, 0, 0, Math.PI * 2);
          ctx.fillStyle = col('ink', 0);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, -3, 1, 2.7, 0, 0, Math.PI * 2);
          ctx.fillStyle = col('green', side < 0 ? 5 : 4);
          ctx.fill();
          ctx.restore();
        }
        if (k % 2 === 0) {
          ctx.beginPath();
          ctx.arc(
            c + Math.cos(a + 0.14) * (wr + 3.5),
            c + Math.sin(a + 0.14) * (wr + 3.5),
            1.4,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = col('vermilion', 5);
          ctx.fill();
        }
      }
    }
    disc(R + 5, col('gold', 5));
    disc(R + 4, col('gold', 6));
    disc(R + 2, col('ink', 0));
    disc(R, lit(ctx, o.field, c - R * 0.35, c - R * 0.4, R * 1.5, o.from ?? 4));
    if (o.stars)
      for (let y = 3; y < S; y += 5)
        for (let x = (y / 5) % 2 ? 3 : 5.5; x < S; x += 5)
          if ((x - c) ** 2 + (y - c) ** 2 < (R - 2) ** 2) {
            ctx.fillStyle = col('gold', 7);
            ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
          }
    const n = o.plain ? 0 : Math.round((2 * Math.PI * (R + 1)) / (o.big ? 4 : 3));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pearl(
        ctx,
        Math.round(c + Math.cos(a) * (R + 1)),
        Math.round(c + Math.sin(a) * (R + 1)),
        o.big,
      );
    }
    return cv;
  }

  // ---- Tiles and strips (repeating), made once ----
  function flat(W, H, field, idx) {
    const cv = canvas(W, H),
      ctx = cv.getContext('2d');
    ctx.fillStyle = col(field, idx);
    ctx.fillRect(0, 0, W, H);
    return cv;
  }
  function tile(W, H, field, idx, seed, o) {
    const cv = canvas(W, H),
      ctx = cv.getContext('2d');
    ctx.fillStyle = col(field, idx);
    ctx.fillRect(0, 0, W, H);
    return age(cv, rng(seed), { wrapX: true, wrapY: true, ...o });
  }
  function strip(W, H, draw, seed, o) {
    const cv = canvas(W, H),
      ctx = cv.getContext('2d');
    draw(ctx, W, H);
    return age(cv, rng(seed), {
      wrapX: true,
      loss: 0.04,
      cracks: 1,
      crackLen: 8,
      goldLoss: 0.15,
      ...o,
    });
  }
  const STRIPS = {
    beads: [
      'Pearls and gems',
      48,
      7,
      (ctx, W) => {
        ctx.fillStyle = col('gold', 5);
        ctx.fillRect(0, 3, W, 1);
        for (let x = 0; x < W; x += 12) {
          ctx.fillStyle = col('ink', 0);
          ctx.beginPath();
          ctx.arc(x + 3, 3.5, 2.6, 0, 7);
          ctx.fill();
          ctx.fillStyle = col('pearl', 4);
          ctx.beginPath();
          ctx.arc(x + 3, 3.5, 1.8, 0, 7);
          ctx.fill();
          ctx.fillStyle = col('pearl', 5);
          ctx.fillRect(x + 2, 2, 1, 1);
          const gx = x + 9,
            gc = (x / 12) % 2 ? col('lapis', 5) : col('vermilion', 5);
          ctx.fillStyle = col('ink', 0);
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx + 3.4, 3.5);
          ctx.lineTo(gx, 7);
          ctx.lineTo(gx - 3.4, 3.5);
          ctx.fill();
          ctx.fillStyle = gc;
          ctx.beginPath();
          ctx.moveTo(gx, 1.2);
          ctx.lineTo(gx + 2.2, 3.5);
          ctx.lineTo(gx, 5.8);
          ctx.lineTo(gx - 2.2, 3.5);
          ctx.fill();
        }
      },
    ],
    wave: [
      'Wave scroll',
      80,
      11,
      (ctx, W) => {
        ctx.fillStyle = col('ink', 0);
        ctx.fillRect(0, 0, W, 1);
        wave(ctx, 0, W, 1, 8);
      },
    ],
    triangles: [
      'Triangles',
      48,
      7,
      (ctx, W) => {
        ctx.fillStyle = col('gold', 5);
        ctx.fillRect(0, 0, W, 7);
        for (let x = 0; x < W; x += 8) {
          ctx.fillStyle = col('ink', 0);
          ctx.beginPath();
          ctx.moveTo(x, 6.5);
          ctx.lineTo(x + 4, 0.5);
          ctx.lineTo(x + 8, 6.5);
          ctx.fill();
          ctx.fillStyle = col('green', 4);
          ctx.beginPath();
          ctx.moveTo(x + 1.3, 6);
          ctx.lineTo(x + 4, 2);
          ctx.lineTo(x + 6.7, 6);
          ctx.fill();
        }
        ctx.fillStyle = col('ink', 0);
        ctx.fillRect(0, 0, W, 1);
        ctx.fillRect(0, 6, W, 1);
      },
    ],
    tiles: ['Tile row', 48, 5, (ctx, W) => tileRow(ctx, 0, W, 0)],
  };

  let made = null;
  function make() {
    if (made) return made;
    made = { strips: {} };
    made.lapis = tile(96, 96, 'lapis', 3, 12, { loss: 0.02, cracks: 2, texture: 0.6 });
    made.green = tile(96, 48, 'green', 3, 13, { loss: 0.05, cracks: 2 });
    for (const [k, [label, W, H, draw]] of Object.entries(STRIPS))
      made.strips[k] = { label, W, H, url: strip(W, H, draw, seedOf(k)) };
    const root = document.documentElement.style;
    root.setProperty('--t-lapis', `url(${made.lapis}) 0 0 / ${96 * P}px ${96 * P}px`);
    root.setProperty('--t-green', `url(${made.green}) 0 0 / ${96 * P}px ${48 * P}px`);
    for (const [k, s] of Object.entries(made.strips))
      root.setProperty(`--s-${k}`, `url(${s.url}) 0 0 / ${s.W * P}px ${s.H * P}px repeat-x`);
    return made;
  }

  // ---- Which element gets which painting ----
  const FIELD = {
    'cs-life': ['vermilion', 4],
    'cs-es': ['sky', 4],
    'cs-mana': ['lapis', 4, true],
    'cs-str': ['vermilion', 3],
    'cs-dex': ['green', 4],
    'cs-int': ['lapis', 5],
    'cs-res-fire': ['vermilion', 5],
    'cs-res-cold': ['teal', 4],
    'cs-res-lightning': ['straw', 4],
    'cs-res-chaos': ['porphyry', 4],
  };
  const JOBS = [
    ['.mixbar', 'mix'],
    ['.cs-tile .cs-raw', 'panel', { field: 'lapis', thin: true, loss: 0.03, cracks: 0 }],
    ['.nextmap', 'panel', { field: 'lapis', thin: true, loss: 0.03, cracks: 1 }],
    ['.tabs', 'field', { field: 'lapis', idx: 2, loss: 0.02, cracks: 4, texture: 0.6 }],
    ['.foot', 'field', { field: 'green', idx: 3, loss: 0.04, cracks: 3 }],
    ['.cs-tile', 'medallion'],
    [
      '.stop-card',
      'panel',
      { field: 'porphyry', arch: true, pearls: true, foot: true, loss: 0.04, cracks: 5 },
    ],
    [
      '.theme',
      'panel',
      { field: 'lapis', arch: true, pearls: true, foot: true, loss: 0.035, cracks: 5 },
    ],
    ['.cs-col', 'panel', { field: 'lapis', loss: 0.03, cracks: 8 }],
    ['.cs-est', 'panel', { field: 'porphyry', thin: true, loss: 0.06, cracks: 2 }],
    ['.weak', 'panel', { field: 'vermilion', thin: true, loss: 0.06, cracks: 1 }],
    ['.btn.primary', 'panel', { field: 'vermilion', thin: true, loss: 0.05, cracks: 1 }],
    ['.btn', 'panel', { field: 'lapis', thin: true, loss: 0.05, cracks: 1 }],
    [
      '.tab.on',
      'panel',
      { field: 'gold', rim: 'ink', thin: true, loss: 0, cracks: 0, texture: 0.45, goldLoss: 0 },
    ],
  ];
  const cache = new Map();
  /** Painters added by other files: kind -> (el, W, H, rng, options) => [canvas, aging options, or false for none]. */
  const KINDS = {};

  function paintEl(el, kind, o, key) {
    let W = Math.ceil(el.offsetWidth / P),
      H = Math.ceil(el.offsetHeight / P);
    if (kind === 'medallion') W = H = Math.min(W, H);
    if (!W || !H) return;
    if (el.dataset.pk) key += `|${el.dataset.pk}`;
    const ck = `${key}|${W}x${H}`;
    let url = cache.get(ck);
    if (!url) {
      const r = rng(seedOf(key));
      if (kind === 'medallion') {
        const cls = Object.keys(FIELD).find((c) => el.classList.contains(c));
        const df = el.dataset.field?.split(',');
        const [field, from, stars] = df
          ? [df[0], +(df[1] ?? 4), el.dataset.medal === 'stars']
          : (FIELD[cls] ?? ['lapis', 4]);
        const wreath = !!el.closest('.cs-trio:first-child') || el.dataset.medal === 'wreath';
        const S = W;
        const R = Math.round(wreath ? S * 0.31 : S * 0.38);
        const plain = el.dataset.medal === 'plain';
        url = age(medallion(S, { field, from, stars, wreath, R, big: wreath, plain }, r), r, {
          loss: 0.035,
          cracks: wreath ? 3 : 1,
          crackLen: 10,
          texture: 0.75,
          edgeBias: 0.5,
          edgeReach: 6,
          goldLoss: 0.08,
          shadow: true,
        });
      } else if (kind === 'mix')
        url = age(mixBar(W, H, el.dataset.mix.split(',').map(Number)), r, {
          loss: 0.02,
          texture: 0.6,
          grime: 0.5,
          goldLoss: 0,
        });
      else if (KINDS[kind]) {
        const [cv, ao] = KINDS[kind](el, W, H, r, o ?? {});
        url = ao === false ? cv.toDataURL() : age(cv, r, ao);
      } else if (kind === 'field')
        url = age(flat(W, H, o.field, o.idx), r, { edgeBias: 0, grime: 0.6, ...o });
      else if (kind === 'wall')
        url = age(flat(W, H, 'gold', 4), r, {
          loss: 0.045,
          blotch: 7,
          cracks: Math.round((W * H) / 2600),
          crackLen: 30,
          texture: 1.1,
          edgeBias: 0.05,
          grime: 0.9,
        });
      else
        url = age(panel(W, H, o), r, {
          texture: 0.55,
          edgeBias: 0.45,
          edgeReach: 12,
          goldLoss: 0.08,
          shadow: true,
          ...o,
        });
      cache.set(ck, url);
    }
    el.style.background = `url(${url}) 0 0 / ${W * P}px ${H * P}px no-repeat`;
  }

  window.paintLeaf = function (root) {
    make();
    paintEl(root, 'wall', {}, 'wall');
    const done = new Set();
    for (const [sel, kind, o] of JOBS)
      root.querySelectorAll(sel).forEach((el, i) => {
        if (done.has(el)) return;
        done.add(el);
        try {
          paintEl(el, kind, o, `${sel}#${i}`);
        } catch (e) {
          console.error(sel, e);
        }
      });
  };
  window.leafStrips = () => make().strips;
  /** For the other screens' painters (paint-more.js and the screen files). */
  window.leaf = {
    P,
    RAMPS,
    col,
    rng,
    seedOf,
    canvas,
    age,
    lit,
    pearl,
    wave,
    tileRow,
    panel,
    medallion,
    /** Add element jobs, matched before the built-in ones. */
    jobs: (list) => JOBS.unshift(...list),
    kind: (name, fn) => (KINDS[name] = fn),
  };
  window.LEAF_P = P;
})();
