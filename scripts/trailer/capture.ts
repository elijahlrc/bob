/**
 * Films the trailer's footage from the real game (docs/trailer/README.md).
 *
 *   npm run dev                                   (in another terminal: the clips are staged through the dev server)
 *   npx tsx scripts/trailer/capture.ts [clip ...] [--peek]
 *
 * Each clip is staged by `src/trailer/stage.ts` in headless Chromium, and every frame is stepped by hand (the game's own loop is
 * stopped), so a clip is the same every time and takes as long as it takes to draw (milliseconds a frame on a GPU, about a
 * second in software WebGL). Frames go to docs/trailer/footage/<clip>/f0000.jpg (git-ignored), with `events.json`, the sim events of each
 * frame (to find where the hits land). `--peek` saves four stills of each clip to footage/peek/ instead.
 * Needs playwright-core (`npm i --no-save playwright-core`) and Chromium (CHROME_PATH, or the one Playwright installs).
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CLIPS, type Clip } from './clips';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'docs/trailer/footage');
const DEV = process.env.BOB_DEV ?? 'http://localhost:5173/';
/** Filming at `TRAILER_SCALE=2` draws each clip at twice the pixels (2560×1440 for a 1280×720 clip) with the same layout. */
const QUALITY = Number(process.env.TRAILER_SCALE ?? 1);

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Page = any;

async function open(browser: any, clip: Clip): Promise<{ page: Page; cdp: any }> {
  const phone = clip.viewport?.phone ?? false;
  const ctx = await browser.newContext({
    viewport: { width: clip.viewport?.w ?? 1280, height: clip.viewport?.h ?? 720 },
    deviceScaleFactor: (clip.viewport?.scale ?? 1) * QUALITY,
    isMobile: phone,
    hasTouch: phone,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e: Error) => console.error(`  [${clip.name}] page error: ${e.message}`));
  // No network: the rivals and high-score calls get what the clip serves, or nothing.
  await page.route('**/rest/v1/**', (r: any) => r.fulfill({ json: [] }));
  if (clip.routes) await clip.routes(page);
  await page.addInitScript(
    (prefs: Record<string, unknown>) => {
      // tsx names functions with a helper; the functions sent to the page as text need it there too
      (window as any).__name = (f: unknown) => f;
      if (prefs.__zoom) (window as any).__zoom = prefs.__zoom;
      for (const [k, v] of Object.entries(prefs)) localStorage.setItem(k, JSON.stringify(v));
    },
    { ...clip.prefs, ...(clip.zoom ? { __zoom: clip.zoom } : {}) },
  );
  await page.goto(DEV);
  await page.waitForFunction(() => (window as any).__dev);
  // The game's own loop stops: every frame is stepped by hand from here.
  await page.evaluate(() => (window as any).__game.loop.sleep());
  await page.addStyleTag({ content: (clip.css ?? '') + CSS });
  return { page, cdp: await ctx.newCDPSession(page) };
}

/** Hidden in every clip: the showcase bar, the speed buttons and the dev overlays. */
const CSS = `.hud-showcase, .speed-row, .hud-speed { display: none !important; }`;

/** What a clip's script gets: the page, and a recorder of frames. */
export type Take = {
  page: Page;
  /** Run a function of the stage module (and the controller and game) in the page. */
  stage<T>(fn: (S: any, c: any, game: any, arg: any) => T | Promise<T>, arg?: unknown): Promise<T>;
  /**
   * Draw and save `n` frames, each `dtMs` of game time apart; `each` runs in the page before each frame. `film: false` draws
   * them without saving them (so what the drawing queued while the sim was warmed without it plays out first).
   */
  rec(
    n: number,
    opts?: { dtMs?: number; each?: (S: any, c: any, i: number) => void; film?: boolean },
  ): Promise<void>;
  /** Save one frame of the page as it is now (for UI screens), repeated `n` times. */
  still(n?: number): Promise<void>;
  /** Film what follows into another folder (a second clip from the same staging). */
  cut(name: string): void;
};

async function film(browser: any, clip: Clip, peek: boolean): Promise<void> {
  const { page, cdp } = await open(browser, clip);
  let name = clip.name;
  let dir = '';
  let frame = 0;
  let gameT = 0;
  let log: string[][] = [];
  const flush = () => {
    if (dir && !peek) writeFileSync(path.join(dir, 'events.json'), JSON.stringify(log));
    if (dir) process.stdout.write(`\r  ${name}: ${frame} frames\n`);
  };
  const begin = (n: string) => {
    if (!/^[a-z0-9-]+$/.test(n)) throw new Error(`bad clip name ${n}`);
    flush();
    name = n;
    dir = peek ? path.join(OUT, 'peek') : path.join(OUT, n);
    if (!peek) rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    frame = 0;
    log = [];
  };
  begin(clip.name);
  const shoot = async () => {
    // At a device scale other than 1 the screenshot is asked for at that scale (it comes back in CSS pixels otherwise).
    const dpr = (clip.viewport?.scale ?? 1) * QUALITY;
    const vp = page.viewportSize();
    const r = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      ...(dpr !== 1
        ? { clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: dpr } }
        : {}),
    });
    const file = peek ? `${name}-${frame}.jpg` : `f${String(frame).padStart(4, '0')}.jpg`;
    writeFileSync(path.join(dir, file), Buffer.from(r.data, 'base64'));
  };
  await page.evaluate(async () => {
    const S = await import(/* @vite-ignore */ '/src/trailer/stage.ts' as string);
    const w = window as any;
    w.__S = S;
    w.__tap = S.tapEvents(w.__bob);
  });
  const take: Take = {
    page,
    stage: (fn, arg) =>
      page.evaluate(
        ([src, a]: [string, unknown]) => {
          const w = window as any;
          return new Function('S', 'c', 'game', 'arg', `return (${src})(S, c, game, arg)`)(
            w.__S,
            w.__bob,
            w.__game,
            a,
          );
        },
        [fn.toString(), arg],
      ),
    async rec(n, opts = {}) {
      const dt = opts.dtMs ?? 1000 / 30;
      for (let i = 0; i < n; i++) {
        gameT += dt;
        const ev: string[] = await page.evaluate(
          ([t, d, each, i2]: [number, number, string | null, number]) => {
            const w = window as any;
            if (each) new Function('S', 'c', 'i', `(${each})(S, c, i)`)(w.__S, w.__bob, i2);
            w.__tap();
            w.__game.step(t, d);
            return w.__tap();
          },
          [gameT, dt, opts.each ? opts.each.toString() : null, i],
        );
        if (opts.film === false) continue;
        log.push(ev);
        if (!peek || i % Math.max(1, Math.floor(n / 4)) === 0) await shoot();
        frame++;
        if (i % 30 === 29) process.stdout.write(`\r  ${name} ${frame}`);
      }
    },
    async still(n = 1) {
      await page.waitForTimeout(50);
      for (let i = 0; i < n; i++) {
        if (!peek || i === 0) await shoot();
        log.push([]);
        frame++;
      }
    },
    cut: begin,
  };
  await clip.film(take);
  flush();
  await page.context().close();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const peek = args.includes('--peek');
  const names = args.filter((a) => !a.startsWith('--'));
  const lib = 'playwright-core';
  const { chromium } = await import(lib);
  // The GPU by default (a frame takes milliseconds). TRAILER_SOFTWARE_GL=1 draws on the CPU instead, for a machine with no
  // GPU (a cloud container: about a second a frame). TRAILER_HEADED=1 opens a visible window, if headless gets no GPU.
  const software = !!process.env.TRAILER_SOFTWARE_GL;
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
    headless: !process.env.TRAILER_HEADED,
    args: software
      ? [
          '--use-gl=angle',
          '--use-angle=swiftshader',
          '--enable-unsafe-swiftshader',
          '--ignore-gpu-blocklist',
        ]
      : ['--ignore-gpu-blocklist', '--enable-gpu'],
  });
  try {
    for (const clip of CLIPS) {
      if (names.length && !names.includes(clip.name)) continue;
      const t0 = Date.now();
      await film(browser, clip, peek);
      console.log(`  (${Math.round((Date.now() - t0) / 1000)} s)`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
