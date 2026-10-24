/**
 * The itch.io page's promotional images in Gold Leaf, drawn by docs/trailer/promo.html with the game's own painter, so
 * through the dev server (`npm run dev` in another terminal). The shots are stills of the trailer's clips at 1600 × 900:
 * film them with `TRAILER_SCALE=1.25 npx tsx scripts/trailer/capture.ts tree3 endgame --peek` and copy the frames wanted
 * to docs/trailer/footage/stills/ (tree.jpg, fight.jpg; git-ignored with the footage).
 *
 *   npx tsx scripts/trailer/promo.ts [out dir] [kind ...]      (default docs/trailer/promo, git-ignored)
 *
 * social.png 1200 × 630 (shown when the page is linked), wide.png 2520 × 1080 (21:9, home page featuring), cover.png
 * 630 × 500 (the cover on itch.io's lists), favicon.png 512 × 512, logo.png (transparent, for light and dark backgrounds);
 * for the page's theme, banner.png 960 × 300, background.png a 560 × 560 tile (repeat both ways) and embed.png 1280 × 720
 * (behind the game before it is run; a smaller frame crops the middle); fire.png, the fire the embed was before.
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DEV = process.env.BOB_DEV ?? 'http://localhost:5173/';
const KINDS = [
  'social',
  'wide',
  'cover',
  'favicon',
  'logo',
  'banner',
  'background',
  'embed',
  'fire',
];

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const out = path.resolve(
    args.find((a) => !KINDS.includes(a)) ?? path.join(ROOT, 'docs/trailer/promo'),
  );
  const kinds = args.filter((a) => KINDS.includes(a));
  const lib = 'playwright-core';
  const { chromium } = await import(lib);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
  mkdirSync(out, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 2600, height: 1200 } });
  page.on('pageerror', (e: Error) => console.error(`  page error: ${e.message}`));
  for (const kind of kinds.length ? kinds : KINDS) {
    await page.goto(new URL(`docs/trailer/promo.html?kind=${kind}`, DEV).href);
    await page.waitForFunction(() => document.title === 'ready', null, { timeout: 30000 });
    await page
      .locator('#c')
      .screenshot({ path: path.join(out, `${kind}.png`), omitBackground: true });
    console.log(`wrote ${path.join(out, `${kind}.png`)}`);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
