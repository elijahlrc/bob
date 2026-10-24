/**
 * The itch.io page's screenshots: the real game's screens, staged with the trailer's helpers (src/trailer/stage.ts) and shot
 * whole, as a player sees them (no trailer zooms, nothing hidden but the dev overlays). Through the dev server
 * (`npm run dev` in another terminal):
 *
 *   npx tsx scripts/trailer/screenshots.ts [shot ...]      (to docs/trailer/promo/screenshots/, git-ignored)
 *
 * Desktop shots are 1280 × 720 drawn at 1.25× (1600 × 900); the phone shot is 390 × 844 drawn at 2.25× (878 × 1899).
 * Needs playwright-core (`npm i --no-save playwright-core`) and Chrome or Chromium (CHROME_PATH).
 */
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'docs/trailer/promo/screenshots');
const DEV = process.env.BOB_DEV ?? 'http://localhost:5173/';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Page = any;
type View = { w: number; h: number; scale: number; phone?: boolean };
const DESKTOP: View = { w: 1280, h: 720, scale: 1.25 };
const PHONE: View = { w: 390, h: 844, scale: 2.25, phone: true };

/** What a shot's script gets: the page, a runner of stage functions in it, and a stepper of drawn frames. */
type Shoot = {
  page: Page;
  /** Run `fn` in the page with the stage module, the controller and the game (sent as text: it uses only its arguments). */
  stage<T>(fn: (S: any, c: any, game: any, arg: any) => T | Promise<T>, arg?: unknown): Promise<T>;
  /** Step and draw `n` frames of the map. */
  frames(n: number, each?: (S: any, c: any, i: number) => void): Promise<void>;
  tab(label: string): Promise<void>;
};

type Shot = {
  name: string;
  view: View;
  css?: string;
  /** The map's pixel zoom (the game picks its own when unset). */
  zoom?: number;
  /** Leave the page scrolled as the shot left it (else everything is scrolled to its top). */
  keepScroll?: boolean;
  take: (s: Shoot) => Promise<void>;
};

/** Easy monsters, so packs stand around a late build long enough to be seen. */
const SOFT = { scaling: 0.6, base: 0.3, variance: 0 };

/**
 * Fill every empty gear slot from the bag (the best-rolled piece that fits and can be worn), so the camp screens show a
 * character dressed as at that level, then keep the bag to a few dozen. Runs in the page, after `__dev.loot` has stocked
 * the bag with plenty to choose from.
 */
async function dress(_S: any, c: any): Promise<void> {
  const inv = await import(/* @vite-ignore */ '/src/run/inventory.ts' as string);
  const run = c.run;
  const rank = (it: any) => ({ rare: 3, magic: 2, normal: 1 })[it.rarity as string] ?? 0;
  const eq = { ...run.build.equipment };
  for (const slot of ['helmet', 'gloves', 'boots', 'amulet', 'ring1', 'ring2', 'belt']) {
    if (eq[slot]) continue;
    const fits = run.inventory
      .filter((it: any) => it.kind === 'item' && inv.slotsFor(it).includes(slot))
      .filter((it: any) => inv.canEquip(run, it, slot).ok)
      .sort((a: any, b: any) => rank(b) - rank(a));
    if (!fits.length) continue;
    eq[slot] = fits[0];
    run.inventory = run.inventory.filter((x: any) => x !== fits[0]);
  }
  run.build = { ...run.build, equipment: eq };
  // A bag of a few dozen, as a player's is: what was looted to dress from is mostly let go.
  run.inventory = run.inventory.slice(-36);
  c.bus.emit('state', null);
}

const SHOTS: Shot[] = [
  /* The passive tree: a Vanguard's whole level 100 build (the trailer's, tree-build.json). */
  {
    name: '01-tree',
    view: DESKTOP,
    async take(s) {
      const plan = JSON.parse(
        readFileSync(path.join(import.meta.dirname, 'tree-build.json'), 'utf8'),
      );
      await s.stage((S, c, _g, a) => {
        const run = S.stagedRun({ classId: 'vanguard', level: 100, seed: 3 }, 60);
        S.checkNodes(a.ids, a.names);
        S.toCamp(c, run);
        // The plan's last node is one point past level 100's.
        S.setAllocated(c, a.ids.slice(0, -1));
      }, plan);
      await s.tab('Passive tree');
    },
  },
  /* Items: a dressed Shade, a full bag, and a rare amulet just found, picked to compare with the one worn. */
  {
    name: '02-items',
    view: DESKTOP,
    async take(s) {
      const name = await s.stage(async (S, c, _g, dress) => {
        const run = S.stagedRun(
          {
            classId: 'shade',
            level: 70,
            weapon: 'dagger_l70',
            offHand: 'dagger_l70',
            body: ['spireTrap', 'wiredHarm', 'swiftSnares'],
            helmet: ['orbitingBlades'],
          },
          45,
        );
        S.wornAmulet(run);
        S.toCamp(c, run);
        (window as any).__dev.loot(150, 68);
        await new Function('S', 'c', `return (${dress})(S, c)`)(S, c);
        const uid = S.rareAmulet(c.run, 70);
        c.run.lastDrops = [uid];
        c.bus.emit('state', null);
        return c.run.inventory.find((i: any) => i.uid === uid).name;
      }, dress.toString());
      await s.tab('Items');
      await s.page.click(`text=${name}`);
    },
  },
  /* Skills: a Mystic with linked gems in four pieces and spare gems in the bag. */
  {
    name: '03-skills',
    view: DESKTOP,
    async take(s) {
      await s.stage(async (S, c, _g, dress) => {
        const run = S.stagedRun(
          {
            classId: 'mystic',
            level: 84,
            weapon: 'wand_l72',
            body: ['skyfall', 'echoingCast', 'channelledElements', 'kindle'],
            helmet: ['orbitingBlades', 'channelledElements'],
            gloves: ['flameBolt', 'echoingCast'],
            boots: ['creepingPlague', 'kindle'],
            primary: 'skyfall',
          },
          70,
        );
        // The wand's socket holds a skill of its own.
        run.build.equipment.mainHand.sockets = [
          { kind: 'gem', uid: run.nextUid++, gemId: 'arcChain' },
        ];
        S.toCamp(c, run);
        (window as any).__dev.loot(150, 70);
        await new Function('S', 'c', `return (${dress})(S, c)`)(S, c);
      }, dress.toString());
      await s.tab('Skills');
    },
  },
  /* A late Mystic's Skyfall through a pack of rot brutes and ember creatures, the whole map screen. */
  {
    name: '04-fight',
    view: DESKTOP,
    async take(s) {
      await s.stage(
        (S, c, game, a) => {
          const run = S.stagedRun(a.loadout, 84);
          S.playMap(c, run, {
            theme: 'mix:charnelPits+kilnHall',
            biome: 'ruins',
            density: 'packed',
          });
          S.holdEnd(c);
          S.warm(c, 45);
          S.warmUntil(c, (w: any) => S.near(w, 6) >= 6, 4000);
          S.settle(game, c);
        },
        {
          loadout: {
            classId: 'mystic',
            level: 92,
            weapon: 'wand_l72',
            body: ['skyfall', 'echoingCast', 'wiredHarm'],
            helmet: ['orbitingBlades'],
            difficulty: SOFT,
          },
        },
      );
      await s.frames(24);
    },
  },
  /* The Tollkeeper's bell, mid-fight, on a Shade with traps. */
  {
    name: '05-boss',
    view: DESKTOP,
    zoom: 3,
    async take(s) {
      await s.stage((S, c, game) => {
        const run = S.stagedRun(
          {
            classId: 'shade',
            level: 72,
            weapon: 'dagger_l70',
            offHand: 'dagger_l70',
            body: ['spireTrap', 'wiredHarm', 'swiftSnares'],
            seed: 9,
          },
          63,
        );
        S.pastMaps(run);
        S.bossFight(c, run, 'tollkeeper', { biome: 'warren', dist: 5 });
        S.holdEnd(c);
        S.untilTolls(c, 2, 0.6);
        S.settle(game, c);
        // Hit after hit he would flash white: the bell and his robes are what the shot is of.
        S.calmFlash(game, S.boss(c.world).m.id, Infinity);
      });
      await s.frames(50, (S, c) => S.keepBoss(c.world));
    },
  },
  /* The next map: three offers in their niches, and a stop. */
  {
    name: '06-next-map',
    view: DESKTOP,
    keepScroll: true,
    async take(s) {
      await s.stage(async (S, c, _g, dress) => {
        const run = S.stagedRun(
          { classId: 'reaver', level: 40, body: ['haloSweep', 'bruteForce'], seed: 4 },
          // More than five maps short of the next boss, so its warning card is not up yet.
          33,
        );
        S.toCamp(c, run);
        // The first-use explainers, as a player who has seen them once.
        for (const id of ['stop', 'satchel', 'reprieve']) c.see(id);
        (window as any).__dev.loot(150, 40);
        await new Function('S', 'c', `return (${dress})(S, c)`)(S, c);
      }, dress.toString());
      await s.tab('Next map');
      // Down to the offers: their niches whole at the foot of the screen.
      await s.page.evaluate(() =>
        document
          .querySelector('.offer-info')
          ?.closest('[data-paint]')
          ?.scrollIntoView({ block: 'end' }),
      );
      await s.page.waitForTimeout(300);
    },
  },
  /* On a phone: the late Mystic's Skyfall through a pack in the ruins, the whole phone screen. */
  {
    name: '07-phone',
    view: PHONE,
    zoom: 2,
    async take(s) {
      await s.stage(
        (S, c, game, loadout) => {
          const run = S.stagedRun(loadout, 84);
          S.playMap(c, run, {
            theme: 'mix:charnelPits+kilnHall',
            biome: 'ruins',
            density: 'packed',
          });
          S.holdEnd(c);
          S.warm(c, 45);
          S.warmUntil(c, (w: any) => S.near(w, 5) >= 6, 4000);
          S.settle(game, c);
        },
        {
          classId: 'mystic',
          level: 92,
          weapon: 'wand_l72',
          body: ['skyfall', 'echoingCast', 'wiredHarm'],
          helmet: ['orbitingBlades'],
          difficulty: SOFT,
        },
      );
      await s.frames(20);
    },
  },
];

async function shoot(browser: any, shot: Shot): Promise<void> {
  const v = shot.view;
  const ctx = await browser.newContext({
    viewport: { width: v.w, height: v.h },
    deviceScaleFactor: v.scale,
    isMobile: !!v.phone,
    hasTouch: !!v.phone,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e: Error) => console.error(`  [${shot.name}] page error: ${e.message}`));
  // No network: the rivals and high-score calls get nothing.
  await page.route('**/rest/v1/**', (r: any) => r.fulfill({ json: [] }));
  await page.addInitScript((zoom: number | null) => {
    // tsx names functions with a helper; the functions sent to the page as text need it there too
    (window as any).__name = (f: unknown) => f;
    if (zoom) (window as any).__zoom = zoom;
  }, shot.zoom ?? null);
  await page.goto(DEV);
  await page.waitForFunction(() => (window as any).__dev);
  await page.evaluate(() => (window as any).__game.loop.sleep());
  await page.addStyleTag({
    content: `.hud-showcase { display: none !important; }${shot.css ?? ''}`,
  });
  await page.evaluate(async () => {
    (window as any).__S = await import(/* @vite-ignore */ '/src/trailer/stage.ts' as string);
  });
  let t = 0;
  const s: Shoot = {
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
    async frames(n, each) {
      for (let i = 0; i < n; i++) {
        t += 1000 / 30;
        await page.evaluate(
          ([tt, e, ii]: [number, string | null, number]) => {
            const w = window as any;
            if (e) new Function('S', 'c', 'i', `(${e})(S, c, i)`)(w.__S, w.__bob, ii);
            w.__game.step(tt, 1000 / 30);
          },
          [t, each ? each.toString() : null, i],
        );
      }
    },
    async tab(label) {
      await page.click(`.tabs .tab:has-text("${label}")`);
      await page.waitForTimeout(400);
    },
  };
  await shot.take(s);
  // Nothing hovered or scrolled; the painter has caught up with the last change.
  await page.mouse.move(2, v.h - 2);
  if (!shot.keepScroll)
    await page.evaluate(() => document.querySelectorAll('*').forEach((e) => (e.scrollTop = 0)));
  await page.waitForTimeout(500);
  const file = path.join(OUT, `${shot.name}.png`);
  await page.screenshot({ path: file, type: 'png' });
  console.log(`wrote ${file}`);
  await ctx.close();
}

async function main(): Promise<void> {
  const names = process.argv.slice(2);
  const lib = 'playwright-core';
  const { chromium } = await import(lib);
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
    args: ['--ignore-gpu-blocklist', '--enable-gpu'],
  });
  mkdirSync(OUT, { recursive: true });
  try {
    for (const shot of SHOTS)
      if (!names.length || names.includes(shot.name)) await shoot(browser, shot);
    // The phone shot again at 4:3, framed on the wall (docs/trailer/promo.html, `phone`): itch.io's gallery shows a tall
    // picture badly.
    if (!names.length || names.includes('07-phone')) {
      const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
      await page.goto(new URL('docs/trailer/promo.html?kind=phone', DEV).href);
      await page.waitForFunction(() => document.title === 'ready', null, { timeout: 30000 });
      const file = path.join(OUT, '07-phone-43.png');
      await page.locator('#c').screenshot({ path: file });
      console.log(`wrote ${file}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
