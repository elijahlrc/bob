/**
 * The itch.io page's promotional images, drawn by docs/trailer/promo.html from the trailer's footage (film the `endgame` clip
 * first, with TRAILER_SCALE=2):
 *
 *   npx tsx scripts/trailer/promo.ts [out dir]      (default docs/trailer/promo, git-ignored with the footage)
 *
 * social.png 1200 × 630 (shown when the page is linked), wide.png 2520 × 1080 (21:9, home page featuring), favicon.png
 * 512 × 512, logo.png (transparent, for light and dark backgrounds); for the page's theme, banner.png 960 × 300,
 * background.png a 560 × 560 tile (repeat both ways) and embed.png 2560 × 1130 (behind the game before it is run: pixel
 * fire and smoke, drawn rather than filmed, with nothing bright in the middle, cropped to any frame).
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, 'docs/trailer/promo'));

async function main(): Promise<void> {
  const lib = 'playwright-core';
  const { chromium } = await import(lib);
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    args: ['--allow-file-access-from-files'],
  });
  mkdirSync(OUT, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 2600, height: 1200 } });
  for (const kind of ['social', 'wide', 'favicon', 'logo', 'banner', 'background', 'embed']) {
    await page.goto(
      pathToFileURL(path.join(ROOT, 'docs/trailer/promo.html')).href + `?kind=${kind}`,
    );
    await page.waitForFunction(() => document.title === 'ready', null, { timeout: 20000 });
    await page
      .locator('#c')
      .screenshot({ path: path.join(OUT, `${kind}.png`), omitBackground: true });
    console.log(`wrote ${path.join(OUT, `${kind}.png`)}`);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
