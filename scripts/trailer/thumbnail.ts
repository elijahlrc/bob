/**
 * The YouTube thumbnail: the cut's genre shot (all four words up, 27.95 s) with the words drawn larger, so that they read
 * small (docs/trailer/cut.html, `?thumb`). Needs the footage filmed with TRAILER_SCALE=2:
 *
 *   npx tsx scripts/trailer/thumbnail.ts [out.png]      (default docs/trailer/thumbnail.png, 1280 × 720)
 *   npx tsx scripts/trailer/thumbnail.ts --title [out.png]   the same grid dimmed, with the title across it (default docs/trailer/thumbnail-title.png)
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '../..');
const TITLE = process.argv.includes('--title');
const OUT = path.resolve(
  process.argv.slice(2).find((a) => !a.startsWith('--')) ??
    path.join(ROOT, TITLE ? 'docs/trailer/thumbnail-title.png' : 'docs/trailer/thumbnail.png'),
);
/** After the fourth word has stamped in (27.5 s) and settled, before the title shot. */
const AT = 27.95;
/** The title shot, once the title is in. */
const AT_TITLE = 29.8;

async function main(): Promise<void> {
  const lib = 'playwright-core';
  const { chromium } = await import(lib);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
  // 1280 × 720 drawn at 1×: the thumbnail's own size, from footage filmed at twice that.
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(
    pathToFileURL(path.join(ROOT, 'docs/trailer/cut.html')).href +
      (TITLE ? '?render&thumb&thumbtitle' : '?render&thumb'),
  );
  await page.waitForTimeout(1500); // the fonts
  await page.evaluate(
    (t: number) => (window as unknown as { seek: (t: number) => unknown }).seek(t),
    TITLE ? AT_TITLE : AT,
  );
  await (await page.$('#stage')).screenshot({ path: OUT });
  console.log(`wrote ${OUT}`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
