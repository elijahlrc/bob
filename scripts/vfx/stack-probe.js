/* eslint-disable no-undef */
/**
 * How much of the screen does an effect light up when many go off at once? (docs/VFX-AUDIT.md, pass 4.)
 *
 * Paste into the console of a dev build (`npm run dev`, any map or the gallery), or load with a script tag. Then:
 *
 *   await stackProbe({ skill: 'spireTrap', dtype: 1 })                  // 1, 3 and 6 at once
 *   await stackProbe({ skill: 'furnaceRoar', dtype: 3, counts: [6] })
 *   await stackProbe({ skill: 'skyfall', dtype: 1, noLights: true })    // the same with the flash() lights taken away
 *
 * It starts the skill gallery, fires synthetic `explode` events through the controller bus a few tiles from the character,
 * steps the game frame by frame and reads the canvas back. It reports, for the median of `reps` runs, the peak share of
 * the screen that is visibly brighter than before the event (`lit`, in percent, with the noise floor of an empty run
 * taken off: torch flicker alone is about 0.3) and the share that is near white (`white`).
 */
async function stackProbe({
  skill,
  dtype = 0,
  counts = [1, 3, 6],
  reps = 3,
  r = 1.6,
  strip = false,
  noLights = false,
} = {}) {
  const c = window.__bob;
  const game = window.__dev.game;
  const cv = game.canvas;
  const scene = game.scene.getScenes(true).find((s) => s.lights);
  const sw = Math.round(cv.width / 4);
  const sh = Math.round(cv.height / 4);
  const off = document.createElement('canvas');
  off.width = sw;
  off.height = sh;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  const grab = () => {
    ctx.drawImage(cv, 0, 0, sw, sh);
    return ctx.getImageData(0, 0, sw, sh).data;
  };
  const step = (n) => {
    for (let i = 0; i < n; i++) game.step(performance.now(), 16.7);
  };
  const measure = (d, base) => {
    let lit = 0;
    let white = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] + d[i + 1] + d[i + 2] - (base[i] + base[i + 1] + base[i + 2]) > 150) lit++;
      if (Math.min(d[i], d[i + 1], d[i + 2]) > 200) white++;
    }
    return [(lit / (sw * sh)) * 100, (white / (sw * sh)) * 100];
  };
  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  if (!c.gallery) c.startGallery();
  const out = {};
  for (const n of counts) {
    const lits = [];
    const whites = [];
    const floors = [];
    for (let rep = 0; rep < reps; rep++) {
      c.galleryGo(0);
      step(35);
      const w = c.world;
      const p = w.player;
      const base = grab();
      let floor = 0;
      for (let f = 0; f < 24; f++) {
        step(1);
        if (f % 2 === 0) floor = Math.max(floor, measure(grab(), base)[0]);
      }
      const before = new Set(scene.lights.lights);
      const events = [];
      for (let i = 0; i < n; i++) {
        const a = i * 2.4;
        const x = p.x + 4 + Math.cos(a) * 0.8;
        const y = p.y + Math.sin(a) * 0.8;
        const e = { t: 'explode', x, y, r, dtype, skill };
        if (strip) e.strip = [x - 2, y, x + 2, y];
        events.push(e);
      }
      c.bus.emit('ticked', { world: w, events });
      step(1);
      if (noLights)
        for (const l of scene.lights.lights.filter((l) => !before.has(l)))
          scene.lights.removeLight(l);
      let lit = 0;
      let white = 0;
      for (let f = 0; f < 48; f++) {
        step(1);
        if (f % 2 === 0) {
          const [a, b] = measure(grab(), base);
          lit = Math.max(lit, a);
          white = Math.max(white, b);
        }
      }
      lits.push(lit);
      whites.push(white);
      floors.push(floor);
    }
    out[n] = { lit: +(med(lits) - med(floors)).toFixed(2), white: +med(whites).toFixed(2) };
  }
  return out;
}
window.stackProbe = stackProbe;
