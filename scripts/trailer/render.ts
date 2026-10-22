/**
 * Renders the trailer animatic (docs/trailer/animatic.html) to a video with its score.
 *
 *   npx tsx scripts/trailer/render.ts            (or: npm run trailer:render)
 *
 * 1. Runs docs/trailer/audio/chip_score.py, which writes the score and sound effects (needs Python 3 with numpy;
 *    set PYTHON to pick the interpreter).
 * 2. Opens the animatic in headless Chromium at 1280×720 and screenshots every frame at 30 fps through the page's
 *    `window.seek(t)`. Needs playwright-core, which the project does not install: `npm i --no-save playwright-core`.
 *    Chromium is the one Playwright installs (`npx playwright install chromium`), or set CHROME_PATH to another.
 * 3. Joins the frames and the score with ffmpeg (on PATH) into docs/trailer/animatic.mp4, and writes
 *    docs/trailer/animatic.mp3 for the page's own player.
 *
 * Frames go to a temporary folder that is removed at the end. `--frames-only` skips the audio and keeps the old score.
 *
 * `--cut` renders docs/trailer/cut.html, the cut with the game's footage (film it first: scripts/trailer/capture.ts), to
 * docs/trailer/cut.mp4 over the same score (written afresh, as for the animatic).
 *
 * `--from <s> --to <s>` renders only that part, to `<name>-section.mp4`, with the score cut to match (to look at one section
 * while it is worked on).
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DIR = path.join(ROOT, 'docs/trailer');
const FPS = 30;
const SECONDS = 31;
/** `TRAILER_SCALE=2` renders 2560×1440 (and reads footage filmed with the same setting): the layout is the same, the pixels twice as many. */
const Q = Number(process.env.TRAILER_SCALE ?? 1);
const EXT = Q > 1 ? 'jpg' : 'png';

function run(cmd: string, args: string[]): void {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0)
    throw new Error(`${cmd} ${args.join(' ')} failed (${r.error?.message ?? r.status})`);
}

async function main(): Promise<void> {
  const cut = process.argv.includes('--cut');
  const framesOnly = process.argv.includes('--frames-only');
  const name = cut ? 'cut' : 'animatic';
  const arg = (k: string) => {
    const i = process.argv.indexOf(k);
    return i < 0 ? null : Number(process.argv[i + 1]);
  };
  const from = arg('--from') ?? 0;
  const to = arg('--to') ?? SECONDS;
  const section = from > 0 || to < SECONDS;
  const outName = (Q > 1 ? `${name}-${720 * Q}p` : name) + (section ? '-section' : '');
  const work = mkdtempSync(path.join(tmpdir(), 'bob-trailer-'));
  const wav = path.join(work, 'score.wav');
  try {
    if (!framesOnly) {
      const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
      run(python, [path.join(DIR, 'audio/chip_score.py'), wav]);
      run('ffmpeg', [
        '-y',
        '-loglevel',
        'error',
        '-i',
        wav,
        '-b:a',
        '256k',
        path.join(DIR, 'animatic.mp3'),
      ]);
    }

    // playwright-core is not a dependency of the game; load it by name so the type-check does not need it
    const lib = 'playwright-core';
    const { chromium } = await import(lib);
    const browser = await chromium.launch(
      process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
    );
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: Q,
    });
    const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push(String(e)));
    await page.goto('file://' + path.join(DIR, `${name}.html`) + '?render');
    await page.waitForTimeout(1500); // the fonts
    const stage = await page.$('#stage');
    for (let i = 0; i < Math.round(FPS * (to - from)); i++) {
      // (the cut's seek is async: it resolves once the frame's footage has loaded)
      await page.evaluate(
        (t: number) => (window as unknown as { seek: (t: number) => unknown }).seek(t),
        from + i / FPS,
      );
      await stage.screenshot({
        path: path.join(work, `f${String(i).padStart(4, '0')}.${EXT}`),
        ...(EXT === 'jpg' ? { type: 'jpeg', quality: 97 } : {}),
      });
      if (i % FPS === 0) process.stdout.write(`\r${i / FPS} s`);
    }
    await browser.close();
    process.stdout.write('\n');
    if (errors.length) throw new Error('page errors: ' + errors.join('; '));

    const audio = framesOnly ? path.join(DIR, 'animatic.mp3') : wav;
    if (!existsSync(audio)) throw new Error('no score: run without --frames-only first');
    // prettier-ignore
    run('ffmpeg', [
      '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(work, `f%04d.${EXT}`),
      ...(section ? ['-ss', String(from), '-t', String(to - from)] : []), '-i', audio,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', Q > 1 ? '18' : '20', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart', path.join(DIR, `${outName}.mp4`),
    ]);
    console.log(`wrote docs/trailer/${outName}.mp4`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
