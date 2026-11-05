// The frame sweep (docs/UI-FRAMES.md): every screen at three real sizes in a headless Chrome, `__dev.frames()` on each
// and a screenshot of each. Needs the dev server (`npm run dev`). node scripts/ui-sweep.mjs <outDir> [size] [screen]
/* global window, document, localStorage, process, console, setTimeout, structuredClone, __s */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const out = process.argv[2];
const onlySize = process.argv[3] ?? '';
const onlyScreen = process.argv[4] ?? '';
const sizes = [
  { name: '1920', viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  { name: '1440', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  {
    name: 'phone',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
].filter((s) => s.name.includes(onlySize));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// In the page: helpers the steps use.
const HELPERS = () => {
  window.__s = {
    tab(name) {
      const t = [...document.querySelectorAll('.tab')].find((b) =>
        b.textContent.trim().startsWith(name),
      );
      t?.click();
      return !!t;
    },
    click(sel, i = 0) {
      const e = document.querySelectorAll(sel)[i];
      e?.click();
      return !!e;
    },
    button(text) {
      const b = [...document.querySelectorAll('button')].find((x) =>
        x.textContent.trim().startsWith(text),
      );
      b?.click();
      return !!b;
    },
    camp(map) {
      const d = window.__dev;
      d.campAt(map);
    },
    // The first map at or after `from` whose offers hold a stop of kind `id` (or a respite), and its slot.
    findOffer(pred, from = 2, to = 120) {
      const d = window.__dev;
      for (let m = from; m < to; m++) {
        d.campAt(m);
        const i = d.controller.run.offers.findIndex(pred);
        if (i >= 0) return { m, i };
      }
      return null;
    },
  };
};

const fresh = (page) =>
  page.evaluate(() => {
    const d = window.__dev;
    d.controller.startRun('vanguard', 1234);
    d.gearUp();
    d.loot(30, 40);
    d.campAt(12);
  });

// The Awlsmith is cut (the owner, 2026-11-05): never offered.
const STOPS = [
  'gemHoard',
  'shrine',
  'quartermaster',
  'ferryman',
  'surgeon',
  'knucklebone',
  'enviousDead',
  'remains',
];
const steps = [
  ['title', async () => {}],
  ['classSelect', (p) => p.evaluate(() => window.__dev.controller.goTo('classSelect'))],
  ['codex', (p) => p.evaluate(() => window.__dev.controller.goTo('codex'))],
  ['patchNotes', (p) => p.evaluate(() => window.__dev.controller.goTo('patchNotes'))],
  ['camp-next', async (p) => (await fresh(p), p.evaluate(() => __s.tab('Next map')))],
  ['camp-character', (p) => p.evaluate(() => __s.tab('Character'))],
  ['camp-tree', (p) => p.evaluate(() => __s.tab('Passive tree'))],
  ['camp-items', (p) => p.evaluate(() => __s.tab('Items'))],
  ['camp-items-picked', (p) => p.evaluate(() => __s.click('.ix-row', 2))],
  ['camp-items-compare', (p) => p.evaluate(() => __s.button('Compare'))],
  ['camp-skills', (p) => p.evaluate(() => __s.tab('Skills'))],
  ['camp-skills-picked', (p) => p.evaluate(() => __s.click('.sk-gem, .gem-stone, [data-gem]', 0))],
  ['camp-strategy', (p) => p.evaluate(() => __s.tab('Strategy'))],
  [
    'confirm-abandon',
    (p) =>
      p.evaluate(() => (__s.tab('Next map'), setTimeout(() => __s.button('Abandon run'), 300))),
  ],
  ...STOPS.map((id) => [
    `stop-${id}`,
    (p) =>
      p.evaluate((id) => {
        document.querySelector('.modal-card .btn:not(.danger)')?.click();
        const f = __s.findOffer((o) => o.kind === 'stop' && o.stop === id);
        if (!f) return 'none';
        __s.tab('Next map');
        setTimeout(() => __s.click('.theme-choice .theme-wrap > button', f.i), 400);
        return f.m;
      }, id),
  ]),
  // The rivals stops with a fallen player found (the sweep plays offline, so none would be): a run whose schedule has
  // the stop, at its level, with the character's own build standing in for the shade.
  ...['enviousDead', 'remains'].map((id) => [
    `stop-${id}-ready`,
    (p) =>
      p.evaluate(async (id) => {
        document.querySelector('.modal-card .btn:not(.danger)')?.click();
        const offers = await import('/src/run/offers.ts');
        const shades = await import('/src/run/shades.ts');
        const d = window.__dev;
        const c = d.controller;
        let seed = 1;
        while (seed < 1000 && !offers.stopSchedule(seed).includes(id)) seed++;
        const m = offers.stopSchedule(seed).indexOf(id);
        c.startRun('vanguard', seed);
        d.gearUp();
        d.loot(30, 40);
        d.campAt(m);
        const run = c.run;
        const i = run.offers.findIndex((o) => o.kind === 'stop' && o.stop === id);
        if (i < 0) return 'none';
        const shade = {
          name: 'Brother Ash',
          classId: 'zealot',
          level: 30,
          map: m,
          build: structuredClone(run.build),
        };
        const key = shades.shadeKey(run, run.offers[i].id);
        c.setShade(key, { state: 'ready', shade });
        __s.tab('Next map');
        setTimeout(() => {
          c.setShade(key, { state: 'ready', shade });
          __s.click('.theme-choice .theme-wrap > button', i);
        }, 800);
        return `seed ${seed} map ${m}`;
      }, id),
  ]),
  [
    'respite',
    (p) =>
      p.evaluate(() => {
        const f = __s.findOffer((o) => o.kind === 'respite');
        if (!f) return 'none';
        __s.tab('Next map');
        setTimeout(() => __s.click('.theme-choice .theme-wrap > button', f.i), 400);
        return f.m;
      }),
  ],
  [
    'map-hud',
    async (p) => (
      await fresh(p),
      p.evaluate(() => (window.__dev.controller.startMap(0), window.__dev.step(120)))
    ),
  ],
  [
    'summary',
    (p) => p.evaluate(() => (window.__dev.controller.abandonMap(), window.__dev.step(30))),
  ],
  ['highScores', (p) => p.evaluate(() => window.__dev.controller.goTo('highScores'))],
].filter(([n]) => n.includes(onlyScreen));

const report = {};
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
for (const s of sizes) {
  const ctx = await browser.newContext(s);
  await ctx.addInitScript(() => {
    for (const k of ['filters', 'map', 'run', 'support', 'tree'])
      localStorage.setItem(`bob.pref.intro.${k}`, 'true');
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(s.name, 'PAGE ERROR', e.message.slice(0, 200)));
  await page.goto('http://localhost:5173/');
  await page.waitForFunction(() => window.__dev, null, { timeout: 30000 });
  await page.evaluate(HELPERS);
  if (
    onlyScreen &&
    !onlyScreen.startsWith('title') &&
    !['classSelect', 'codex', 'patchNotes'].includes(onlyScreen)
  )
    await fresh(page);
  for (const [name, act] of steps) {
    let note;
    try {
      note = String((await act(page)) ?? '');
    } catch (e) {
      note = 'ERR ' + e.message.slice(0, 120);
    }
    await sleep(2200);
    await page.screenshot({ path: `${out}/${s.name}-${name}.png` });
    const faults = await page.evaluate(() =>
      window.__dev
        .frames()
        .map((f) => `${f.panel.replace(/^[^/]*\//, '')} | ${f.what} | over ${f.over} [${f.sides}]`),
    );
    (report[name] ??= {})[s.name] = { note, faults };
    console.log(`${s.name} ${name} ${note} -> ${faults.length}`);
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1));
