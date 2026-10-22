/**
 * The trailer's clips (docs/trailer/README.md): how each is staged and how many frames it films. Names match the footage that
 * docs/trailer/cut.html uses. The functions given to `stage` and `rec` run in the page (sent as text): they use only their
 * arguments (S: src/trailer/stage.ts, c: the controller, game: the Phaser game, arg/i).
 */
import type { Take, Page } from './capture';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Clip = {
  name: string;
  viewport?: { w: number; h: number; phone?: boolean; scale?: number };
  /** The map's pixel zoom (the game picks 2 at this width). */
  zoom?: number;
  /** localStorage prefs set before the game loads (JSON-encoded, as the game's prefs are). */
  prefs?: Record<string, unknown>;
  css?: string;
  routes?: (page: Page) => Promise<void>;
  film: (t: Take) => Promise<void>;
};

/** Easy monsters, so packs die at the pace of a late build. */
const SOFT = { scaling: 0.6, base: 0.3, variance: 0 };

/** The map's own text: the top line, the speed buttons and the biome's title card. */
const BARE = `.hud-top, .speeds, .biome-banner, .hud-abandon { display: none !important; }`;
const PHONE = { w: 390, h: 844, phone: true };
/** The phone's whole map screen (top line, abandon button, bars); only the biome's title card, which fades mid-clip, is hidden. */
const PHONE_UI = `.biome-banner { display: none !important; }`;
/** The camp and title screens: 1280×720 drawn at 1.5× (the text reads at trailer size). */
const UI = { w: 854, h: 480, scale: 1.5 };
/** The Shade that falls at level 72 (the fall and its end screen): two daggers and no skill, so its blows are plain stabs. */
const FALLEN = {
  classId: 'shade',
  level: 72,
  weapon: 'dagger_l70',
  offHand: 'dagger_l70',
  seed: 9,
};

type Where = { theme: string; biome: string; density?: string };

/** A map clip: a character, a place, warmed until a pack is close, then `frames` frames. */
function mapClip(
  name: string,
  loadout: Record<string, unknown>,
  map: number,
  where: Where,
  frames: number,
  opts: {
    pack?: number;
    warm?: number;
    viewport?: Clip['viewport'];
    zoom?: number;
    speed?: number;
    css?: string;
  } = {},
): Clip {
  return {
    name,
    viewport: opts.viewport,
    zoom: opts.zoom ?? (opts.viewport ? 2 : 2.5),
    css: opts.css ?? BARE,
    async film(t) {
      await t.stage(
        (S, c, game, a) => {
          const run = S.stagedRun(a.loadout, a.map);
          S.playMap(c, run, a.where);
          // A map cleared before the clip ends stays on screen.
          S.holdEnd(c);
          S.warm(c, a.warm);
          S.warmUntil(c, (w: any) => S.near(w, 6) >= a.pack, 4000);
          if (a.speed) c.setSpeed(a.speed);
          S.settle(game, c);
        },
        {
          loadout: { difficulty: SOFT, ...loadout },
          map,
          where: { density: 'packed', ...where },
          pack: opts.pack ?? 3,
          warm: opts.warm ?? 45,
          speed: opts.speed,
        },
      );
      await t.rec(frames);
    },
  };
}

/** The camp tabs, by the start of their label (they carry counts). */
const tab = (t: Take, label: string) => t.page.click(`.tabs .tab:has-text("${label}")`);

/** Our character's name on the board and in the duel. */
const ME = 'Morrow';

const BOARD = [
  ['Sin', 'reaver', 100, 'won', 1184, 41, 33],
  ['oostin', 'shade', 97, 'died', 1092, 36, 27],
  ['Gravewick', 'zealot', 91, 'died', 968, 29, 19],
  ['Eli', 'strider', 88, 'died', 901, 24, 15],
  [ME, 'mystic', 84, 'died', 748, 3, 2],
  ['marrowbyte', 'vanguard', 79, 'died', 731, 18, 9],
  ['Tessaly', 'mystic', 74, 'died', 702, 12, 5],
  ['Ninefingers', 'shade', 70, 'died', 655, 9, 3],
] as const;

export const CLIPS: Clip[] = [
  /* 1. Cold open: a late Mystic's Skyfall, lightning columns through a pack of rot brutes and ember creatures, close in. */
  mapClip(
    'endgame',
    {
      classId: 'mystic',
      level: 92,
      weapon: 'wand_l72',
      body: ['skyfall', 'echoingCast', 'wiredHarm'],
      helmet: ['orbitingBlades'],
    },
    84,
    { theme: 'mix:charnelPits+kilnHall', biome: 'ruins' },
    150,
    { zoom: 3, pack: 6 },
  ),

  /* 2. The tree: a whole build growing, level 5 to 100, zoomed out so that it reads as big, and kept in frame. */
  {
    name: 'tree3',
    viewport: UI,
    css: `.tree-bar, .tree-help, .tree-legend { display: none !important; }
      .tree-wrap .tooltip, svg.tree g.preview { display: none !important; }
      #trailer-level { position: fixed; left: 24px; top: 58px; z-index: 9999; font: 600 40px/1 'IM Fell English SC', Georgia, serif;
        color: #d98a3a; text-shadow: 0 2px 6px #000, 0 0 14px #000; pointer-events: none; }`,
    async film(t) {
      const { order } = await t.stage((S, c) => {
        const run = S.stagedRun({ classId: 'vanguard', level: 100, seed: 3 }, 60);
        const ids = S.growBuild('vanguard', 99);
        S.toCamp(c, run);
        S.setAllocated(c, ids.slice(0, 3));
        return { order: ids };
      });
      await tab(t, 'Passive tree');
      await t.page.waitForTimeout(300);
      await t.page.evaluate(() => {
        const el = document.createElement('div');
        el.id = 'trailer-level';
        document.body.appendChild(el);
      });
      // Zoomed out until the finished build sits inside the view with a margin, and centred (the tree opens at a fifth of a pixel
      // a unit, centred on the class start; a wheel step scales by exp(-dy * 0.0015)). The lit edges are measured on screen, so
      // the fit is what the viewer sees, not a sum.
      await t.stage((S, c, _g, ids) => S.setAllocated(c, ids), order);
      await t.page.waitForTimeout(250);
      const svg = (await t.page.locator('svg.tree').first().boundingBox())!;
      const cx = svg.x + svg.width / 2;
      const cy = svg.y + svg.height / 2;
      const lit = async () =>
        t.page.evaluate(() => {
          const r = (document.querySelector('svg.tree') as Element).getBoundingClientRect();
          let x0 = Infinity,
            y0 = Infinity,
            x1 = -Infinity,
            y1 = -Infinity;
          document.querySelectorAll('svg.tree .tn.on .ring, svg.tree .edge.on').forEach((e) => {
            const b = e.getBoundingClientRect();
            x0 = Math.min(x0, b.left);
            y0 = Math.min(y0, b.top);
            x1 = Math.max(x1, b.right);
            y1 = Math.max(y1, b.bottom);
          });
          return { x0, y0, x1, y1, l: r.left, t: r.top, w: r.width, h: r.height };
        });
      // Zoom out with the tree's own button (a fixed step of 1.4, about the middle of the view; a wheel step depends on the device
      // scale) until the build fills at most 80% of the view, then drag it to the middle. Measured on screen each time.
      const zoomOut = () =>
        t.page.evaluate(() =>
          (
            document.querySelector('.tree-zoom button[aria-label="Zoom out"]') as HTMLElement
          ).click(),
        );
      for (let pass = 0; pass < 12; pass++) {
        const m = await lit();
        const w = m.x1 - m.x0;
        const h = m.y1 - m.y0;
        const dx = m.l + m.w / 2 - (m.x0 + m.x1) / 2;
        const dy = m.t + m.h / 2 - (m.y0 + m.y1) / 2;
        const tooBig = w > m.w * 0.8 || h > m.h * 0.8;
        if (!tooBig && Math.abs(dx) < 6 && Math.abs(dy) < 6) break;
        if (tooBig) {
          await zoomOut();
          await t.page.waitForTimeout(150);
          continue;
        }
        await t.page.mouse.move(cx, cy);
        await t.page.mouse.down();
        await t.page.mouse.move(cx + dx, cy + dy, { steps: 6 });
        await t.page.mouse.up();
        await t.page.waitForTimeout(150);
      }
      const done = await lit();
      if (
        done.x0 < done.l ||
        done.y0 < done.t ||
        done.x1 > done.l + done.w ||
        done.y1 > done.t + done.h
      )
        throw new Error('the build is not in frame');
      await t.stage((S, c, _g, ids) => S.setAllocated(c, ids), order.slice(0, 3));
      await t.page.mouse.move(5, 470);
      const N = 90;
      for (let i = 0; i < N; i++) {
        const k = i / (N - 1);
        const e = 1 - Math.pow(1 - k, 2);
        const n = Math.max(3, Math.round(e * order.length));
        const level = Math.round(5 + e * 95);
        await t.stage((S, c, _g, a) => S.setAllocated(c, a), order.slice(0, n));
        await t.page.evaluate((l: number) => {
          const el = document.getElementById('trailer-level');
          if (el) el.textContent = `Level ${l}`;
        }, level);
        await t.still(1);
      }
    },
  },

  /* 3b. The Vanguard's payoff: Magma Crack in a Forge. */
  mapClip(
    'vanguard',
    {
      classId: 'vanguard',
      level: 70,
      weapon: 'mace2_l69',
      offHand: null,
      body: ['magmaCrack', 'bruteForce'],
    },
    40,
    { theme: 'kilnHall', biome: 'forge' },
    150,
  ),

  /* 4a. The Shade's skills: Wired Harm into the trap's link, the damage jumps. */
  {
    name: 'skills',
    viewport: UI,
    // Only the body's row and the gem list, so the gem, its socket and the number that moves are all on screen at once. The gem
    // and the socket it goes to are lit, and an arrow runs from one to the other, before the gem is placed.
    css: `
      .socket-row:not([data-slot="body"]), .skill-summary.muted, .skills-help { display: none !important; }
      .skill-summary { font-size: 1.25em; }
      .trailer-lit { box-shadow: 0 0 0 2px #d98a3a, 0 0 22px rgba(217,138,58,.75) !important; border-color: #d98a3a !important; }
      .skill-summary.trailer-flash b, .skill-summary.trailer-flash .muted { color: #ffd27a !important; }
    `,
    async film(t) {
      await t.stage((S, c) => {
        const run = S.stagedRun(
          { classId: 'shade', level: 60, body: ['spireTrap', 'swiftSnares'], seed: 5 },
          30,
        );
        const body = run.build.equipment.body;
        body.sockets = body.sockets.concat([null]);
        const uid = () => run.nextUid++;
        run.inventory = run.inventory.concat({ kind: 'gem', uid: uid(), gemId: 'wiredHarm' });
        S.toCamp(c, run);
      });
      await tab(t, 'Skills');
      await t.page.waitForTimeout(200);
      // 2 s: the gem and the empty socket (0.4 s), both lit with the arrow between them (0.6 s), placed, the DPS up (1 s).
      for (let i = 0; i < 60; i++) {
        if (i === 12)
          await t.page.evaluate(() => {
            const chip = document.querySelector('.gem-chip') as HTMLElement;
            const slot = [...document.querySelectorAll('.socket.empty')].pop() as HTMLElement;
            chip.classList.add('trailer-lit');
            slot.classList.add('trailer-lit');
            const a = chip.getBoundingClientRect();
            const b = slot.getBoundingClientRect();
            const x1 = a.left + a.width * 0.25;
            const y1 = a.bottom;
            const x2 = b.right + 4;
            const y2 = b.top + b.height / 2;
            const ns = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            svg.setAttribute('id', 'trailer-arrow');
            svg.setAttribute(
              'style',
              'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:9999',
            );
            svg.innerHTML =
              '<defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#d98a3a"/></marker></defs>' +
              `<path d="M${x1} ${y1} C ${x1} ${y2}, ${x2 + 80} ${y2}, ${x2} ${y2}" fill="none" stroke="#d98a3a" stroke-width="3" stroke-dasharray="7 5" marker-end="url(#ah)"/>`;
            document.body.appendChild(svg);
          });
        if (i === 30) {
          await t.page.evaluate(() => document.getElementById('trailer-arrow')?.remove());
          await t.page.click('.gem-chip:has-text("Wired Harm")');
          await t.page.locator('.socket.empty').last().click();
          await t.page.mouse.move(5, 470);
          // The click scrolls the tab; the skill's line, with its DPS, is at the top.
          await t.page.evaluate(() => {
            document.querySelectorAll('*').forEach((e) => (e.scrollTop = 0));
            document.querySelector('.skill-summary')?.classList.add('trailer-flash');
          });
        }
        await t.still(1);
      }
    },
  },

  /* 4b. The Shade's payoff: Spire Traps in Ruins; then the drop for the build, and its card and Equip. */
  {
    name: 'shade',
    zoom: 2.5,
    css: BARE,
    async film(t) {
      await t.stage(
        (S, c, game, a) => {
          const run = S.stagedRun(a, 45);
          (window as any).__run = run;
          S.playMap(c, run, { theme: 'hollowVigil', biome: 'ruins', density: 'packed' });
          S.warm(c, 45);
          S.warmUntil(c, (w: any) => S.near(w, 4) >= 3, 4000);
          S.settle(game, c);
        },
        {
          classId: 'shade',
          level: 70,
          body: ['spireTrap', 'wiredHarm', 'swiftSnares'],
          difficulty: SOFT,
        },
      );
      await t.rec(150);
      t.cut('drop');
      await t.stage((S, c) => {
        const run = (window as any).__run;
        const uid = S.rareAmulet(run, 70);
        (window as any).__amulet = run.inventory.find((i: any) => i.uid === uid);
        S.dropNear(c.world, run, uid, 3, 1);
        run.inventory = run.inventory.filter((i: any) => i.uid !== uid);
      });
      await t.rec(30);
    },
  },

  /* 4c. The amulet's card in the bag, and Equip on 10.2 s. */
  {
    name: 'equip',
    viewport: UI,
    async film(t) {
      const name = await t.stage((S, c) => {
        const run = S.stagedRun(
          { classId: 'shade', level: 70, body: ['spireTrap', 'wiredHarm', 'swiftSnares'] },
          45,
        );
        S.wornAmulet(run);
        const uid = S.rareAmulet(run, 70);
        run.lastDrops = [uid];
        S.toCamp(c, run);
        return run.inventory.find((i: any) => i.uid === uid).name;
      });
      await tab(t, 'Items');
      await t.page.waitForTimeout(200);
      await t.page.click(`text=${name}`);
      await t.page.mouse.move(5, 470);
      await t.page.evaluate(() =>
        [...document.querySelectorAll('button')]
          .find((x) => /^(Equip|Swap)/.test(x.textContent ?? ''))
          ?.scrollIntoView({ block: 'nearest' }),
      );
      await t.page.waitForTimeout(200);
      // 1.5 s: the new amulet beside the worn one (0.7 s), the button pressed (0.3 s), the swap done (0.5 s).
      for (let i = 0; i < 45; i++) {
        if (i === 21)
          await t.page.evaluate(() => {
            const b = [...document.querySelectorAll('button')].find((x) =>
              /^(Equip|Swap)/.test(x.textContent ?? ''),
            );
            (b as HTMLElement | undefined)?.classList.add('trailer-press');
          });
        if (i === 30)
          await t.page.evaluate(() =>
            (document.querySelector('.trailer-press') as HTMLElement | null)?.click(),
          );
        await t.still(1);
      }
    },
    css: `.trailer-press { filter: brightness(1.5); transform: scale(0.96); }`,
  },

  /* 5. Three more builds, in phone-shaped panels. */
  mapClip(
    'strider',
    { classId: 'strider', level: 60, weapon: 'bow_l53', body: ['quiverRush', 'toxinCoat'] },
    35,
    { theme: 'gnawingWarrens', biome: 'cavern' },
    90,
    { viewport: PHONE, pack: 4, css: PHONE_UI },
  ),
  mapClip(
    'reaver',
    {
      classId: 'reaver',
      level: 60,
      weapon: 'sword2_l57',
      offHand: null,
      body: ['haloSweep', 'bruteForce'],
    },
    35,
    { theme: 'giltHall', biome: 'shrine' },
    90,
    { viewport: PHONE, css: PHONE_UI },
  ),
  mapClip(
    'zealot',
    { classId: 'zealot', level: 60, body: ['cleansingBlaze', 'standingCast'] },
    35,
    { theme: 'lamplitCloister', biome: 'hollow' },
    90,
    { viewport: PHONE, css: PHONE_UI },
  ),

  /* 6. The climb: five builds, five places, a half second each; then level 72, the boss fight (7). */
  mapClip(
    'climb1',
    { classId: 'reaver', level: 12, body: ['reapingArc', 'bruteForce'] },
    4,
    { theme: 'ashenCrypt', biome: 'crypt' },
    45,
  ),
  mapClip(
    'climb2',
    { classId: 'mystic', level: 20, weapon: 'wand_l35', body: ['flameBolt', 'echoingCast'] },
    12,
    { theme: 'bonePits', biome: 'forge' },
    45,
  ),
  mapClip(
    'climb4',
    { classId: 'zealot', level: 42, body: ['arcChain', 'channelledElements'] },
    31,
    { theme: 'hollowVigil', biome: 'ruins' },
    45,
  ),
  mapClip(
    'climb5',
    { classId: 'mystic', level: 52, weapon: 'wand_l35', body: ['creepingPlague'] },
    41,
    { theme: 'gnawingWarrens', biome: 'marsh' },
    45,
  ),
  mapClip(
    'climb6',
    {
      classId: 'vanguard',
      level: 62,
      weapon: 'mace2_l34',
      offHand: null,
      body: ['blessedTrail', 'bruteForce'],
    },
    52,
    { theme: 'giltHall', biome: 'shrine' },
    45,
  ),
  /* 7. The fall, level 72: the Shade fights the Tollkeeper, and his whole toll runs: the bell hoisted over his head through the
        tell, brought down, and the rings of lightning going out from it, the first of which kills. The body is held. The shot
        is kept plain so the bell is what is seen: the Shade only stabs with its daggers (no skill and its effects), and no
        damage numbers are drawn. It opens on blows a moment before the tell; the frames the tell starts on and the ring lands
        on are printed, for the cut. */
  {
    name: 'fall',
    zoom: 3.2,
    css: BARE,
    async film(t) {
      await t.stage((S, c, game, fallen) => {
        const run = S.stagedRun(fallen, 63);
        S.pastMaps(run);
        S.bossFight(c, run, 'tollkeeper', { biome: 'warren', dist: 5 });
        S.holdEnd(c);
        S.warmUntil(
          c,
          (w: any) => {
            const b = S.boss(w);
            return !!b && b.st.begun && b.st.clock <= 0.3;
          },
          1200,
        );
        S.settle(game, c);
        // Hit after hit, he would flash white end to end: his flash is kept to a flicker, so the bell can be seen rising.
        S.calmFlash(game, S.boss(c.world).m.id);
        S.quietNumbers(game);
      }, FALLEN);
      await t.rec(150, {
        each: (S, c, i) => {
          const w = c.world;
          const win = window as any;
          const b = S.boss(w);
          if (b && b.st.tellT > 0 && win.__tell == null) win.__tell = i;
          // Deathless until a ring that will catch it lands.
          if (S.blastDue(w, 'Toll')) {
            S.mortal(w);
            if (win.__ring == null) win.__ring = i;
          }
        },
      });
      const at = await t.page.evaluate(() => [(window as any).__tell, (window as any).__ring]);
      console.log(
        `  the tell starts on frame ${at[0]}; the ring that kills lands on frame ${at[1]}`,
      );
    },
  },

  /* 7b. The end screen of that fall, filmed on its own at 3× (854×480 drawn at 1.5× and sampled at 2×, so the cut can zoom in
        on the text), the duel button pressed. */
  {
    name: 'summary',
    viewport: { w: 854, h: 480, scale: 3 },
    css: `.duel-cta.trailer-press { filter: brightness(1.5); transform: scale(0.97); }`,
    async film(t) {
      await t.stage((S, c, _game, fallen) => {
        const run = S.stagedRun(fallen, 63);
        S.pastMaps(run);
        S.bossFight(c, run, 'tollkeeper', { biome: 'warren', dist: 5 });
        if (S.warmUntil(c, (w: any) => S.blastDue(w, 'Toll'), 3000) < 0)
          throw new Error('no toll caught the Shade');
        S.mortal(c.world);
        for (let i = 0; i < 300 && c.screen === 'map'; i++) c.bus.emit('frame', { dtMs: 33 });
      }, FALLEN);
      await t.page.waitForTimeout(400);
      for (let i = 0; i < 36; i++) {
        if (i === 12)
          await t.page.evaluate(() =>
            document.querySelector('.duel-cta')?.classList.add('trailer-press'),
          );
        if (i === 16)
          await t.page.evaluate(() =>
            document.querySelector('.duel-cta')?.classList.remove('trailer-press'),
          );
        await t.still(1);
      }
    },
    prefs: { 'bob.pref.rivalName': ME, 'bob.pref.rivals': true },
  },

  /* 8. The duel: our Mystic against Sin's Reaver, the whole fight: they trade blows from the first second and the Mystic lands the
        deciding blow on 3.25 s, with the frames after it filmed; then the rating. The duel's own rules are turned up (the damage
        each takes is multiplied by 5, not 0.3) so a fight is a few seconds, not over a minute. */
  {
    name: 'duel',
    zoom: 3.2,
    css: `.hud-top .muted, .speeds, .biome-banner { display: none !important; }`,
    async film(t) {
      const RULES = { damageScale: 5 };
      const n = await t.stage(
        (S, c, _g, a) => {
          const mk = (l: any) => S.stagedRun(l, 80).build;
          const x = mk({
            classId: 'mystic',
            level: 84,
            weapon: 'wand_l72',
            body: ['flameBolt', 'echoingCast'],
          });
          const y = mk({ classId: 'reaver', level: 84, body: ['reapingArc', 'bruteForce'] });
          (window as any).__builds = [x, y];
          // A seed the Mystic wins with a third of its life left, in a fight of 3.3 to 4.2 s.
          for (let seed = 1; seed < 60; seed++) {
            S.duel(c, x, y, seed, [a.me, 'Sin'], { before: 712, after: 748 }, a.rules);
            let f = 0;
            while (c.screen === 'map' && f < 30 * 30) {
              c.bus.emit('frame', { dtMs: 1000 / 30 });
              f++;
            }
            const out = c.lastDuel;
            const left = out ? out.result.sides[0].lifeLeft : 0;
            if (out && out.result.winner === 0 && out.result.how === 'death') {
              if (f >= 100 && f <= 126 && left > 0.2 && left < 0.5) {
                (window as any).__seed = seed;
                return f;
              }
            }
          }
          return -1;
        },
        { me: ME, rules: RULES },
      );
      if (n < 0) throw new Error('no duel the Mystic wins');
      // Start so that the last blow is the 98th frame of the clip (3.25 s), then film a few frames more.
      await t.stage(
        (S, c, game, a) => {
          const [x, y] = (window as any).__builds;
          S.duel(
            c,
            x,
            y,
            (window as any).__seed,
            [a.me, 'Sin'],
            { before: 712, after: 748 },
            a.rules,
          );
          S.holdDuelEnd(c);
          S.warm(c, a.skip);
          S.settle(game, c);
        },
        { me: ME, rules: RULES, skip: n - 98 },
      );
      await t.rec(106);
      t.cut('result');
      await t.stage((S, c) => {
        S.releaseDuelEnd(c);
        c.bus.emit('frame', { dtMs: 33 });
      });
      await t.page.waitForTimeout(300);
      for (let i = 0; i < 30; i++) {
        const k = Math.min(1, Math.max(0, (i - 4) / 18));
        const v = Math.round(712 + (748 - 712) * (1 - Math.pow(1 - k, 3)));
        await t.page.evaluate((x: number) => {
          const el = document.querySelector('.duel-standing');
          if (el) el.textContent = `Rated · 712 → ${x}`;
        }, v);
        await t.still(1);
      }
    },
  },

  /* 9. The board: Sin on top; our row climbs past two. */
  {
    name: 'board',
    viewport: UI,
    routes: async (page) => {
      await page.route('**/rest/v1/rpc/high_scores', (r: any) =>
        r.fulfill({
          json: BOARD.map(([name, cls, level, outcome, rating, fights, wins], i) => ({
            id: String(100 + i),
            name,
            class_id: cls,
            level,
            map: level,
            outcome,
            rating,
            fights,
            wins,
            posted_on: '2026-10-' + String(20 - i).padStart(2, '0'),
          })),
        }),
      );
      await page.route('**/rest/v1/rpc/my_snapshots', (r: any) => r.fulfill({ json: [] }));
    },
    css: `tr.trailer-me td { background: #d98a3a !important; color: #0f1016 !important; font-weight: 700; }`,
    async film(t) {
      await t.stage((_S, c) => c.goTo('highScores'));
      await t.page.waitForTimeout(800);
      for (let i = 0; i < 45; i++) {
        // Our row starts two places down and rises to its place between 0.3 s and 0.9 s.
        const k = Math.min(1, Math.max(0, (i - 9) / 18));
        const e = 1 - Math.pow(1 - k, 3);
        await t.page.evaluate(
          ([e2, me]: [number, string]) => {
            const rows = [...document.querySelectorAll('tbody tr')] as HTMLElement[];
            const at = rows.findIndex((r) => r.textContent?.includes(me));
            if (at < 0) return;
            const h = rows[at].getBoundingClientRect().height;
            rows[at].classList.add('trailer-me');
            rows[at].style.transform = `translateY(${(1 - e2) * 2 * h}px)`;
            rows[at].style.position = 'relative';
            rows[at].style.zIndex = '2';
            // The rank shown follows the row's place on screen.
            const rank = (r: HTMLElement, slot: number) => {
              const td = r.querySelector('td');
              if (td) td.textContent = String(Math.round(slot) + 1);
            };
            const pos = 2 * (1 - e2);
            rank(rows[at], at + pos);
            for (const j of [at + 1, at + 2]) {
              if (!rows[j]) continue;
              const m = Math.min(1, Math.max(0, pos - (j - at - 1)));
              rows[j].style.transform = `translateY(${-m * h}px)`;
              rank(rows[j], j - m);
            }
          },
          [e, ME],
        );
        await t.still(1);
      }
    },
  },

  /* 10. Footage for the Autobattler panel: a fight at 8×. */
  mapClip(
    'auto',
    { classId: 'zealot', level: 70, body: ['arcChain', 'channelledElements'] },
    45,
    { theme: 'ashenCrypt', biome: 'crypt' },
    60,
    { speed: 8, zoom: 2 },
  ),
];
