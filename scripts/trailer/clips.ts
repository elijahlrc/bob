/**
 * The trailer's clips (docs/trailer/README.md): how each is staged and how many frames it films. Names match the footage that
 * docs/trailer/cut.html uses. The functions given to `stage` and `rec` run in the page (sent as text): they use only their
 * arguments (S: src/trailer/stage.ts, c: the controller, game: the Phaser game, arg/i).
 */
import type { Take, Page } from './capture';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { treeCamera } from './camera';

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
    /** Runs in the page before each filmed frame. */
    each?: (S: any, c: any, i: number) => void;
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
      await t.rec(frames, { each: opts.each });
    },
  };
}

/** The camp tabs, by the start of their label (they carry counts). */
const tab = (t: Take, label: string) => t.page.click(`.tabs .tab:has-text("${label}")`);

/** The map's zoom of the climb, the fall and the duel, so that the cuts between them keep one scale. */
const CLOSE = 3.2;

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
    {
      zoom: 3,
      pack: 6,
      // The strike that lands with the crash (frame 81, cut in so it is on 1.5 s) falls on the pack around the Mystic and kills
      // it: from frame 73, after the strike before it, the markers are kept on the pack.
      each: (S, c, i) => {
        if (i < 73) return;
        S.aimMarkers(c.world);
        S.doomMarked(c.world);
      },
    },
  ),

  /* 1b. The same fight pulled right back (a game pixel is 2 of its pixels), for the store page's embed background (scripts/trailer/promo.ts): not used in the cut. */
  mapClip(
    'promo',
    {
      classId: 'mystic',
      level: 92,
      weapon: 'wand_l72',
      body: ['skyfall', 'echoingCast', 'wiredHarm'],
      helmet: ['orbitingBlades'],
    },
    84,
    { theme: 'mix:charnelPits+kilnHall', biome: 'ruins' },
    80,
    { zoom: 1, pack: 6 },
  ),

  /* 2. The tree: a whole build growing, level 5 to 100, zoomed out so that it reads as big, and kept in frame. */
  {
    name: 'tree3',
    viewport: UI,
    css: `.tree-bar, .tree-help, .tree-legend { display: none !important; }
      .tree-wrap .tooltip, svg.tree g.preview { display: none !important; }
      * { user-select: none !important; -webkit-user-select: none !important; }
      #trailer-level { position: fixed; left: 24px; top: 58px; z-index: 9999; font: 400 44px/1 'Jacquard 24', Georgia, serif;
        color: #d98a3a; text-shadow: 0 2px 6px #000, 0 0 14px #000; pointer-events: none; }`,
    async film(t) {
      // The build a two-handed mace Vanguard plans (tree-build.json, written by treeBuild.ts), in the order it is taken.
      const plan = JSON.parse(readFileSync(join(import.meta.dirname, 'tree-build.json'), 'utf8'));
      const { order, start, pts } = await t.stage((S, c, _g, a) => {
        const run = S.stagedRun({ classId: 'vanguard', level: 100, seed: 3 }, 60);
        S.checkNodes(a.ids, a.names);
        S.toCamp(c, run);
        S.setAllocated(c, a.ids.slice(0, 3));
        return { order: a.ids, ...S.nodePoints('vanguard', a.ids) };
      }, plan);
      await tab(t, 'Passive tree');
      await t.page.waitForTimeout(300);
      await t.page.evaluate(() => {
        const el = document.createElement('div');
        el.id = 'trailer-level';
        document.body.appendChild(el);
      });
      // The camera (scripts/trailer/camera.ts): one smooth zoom out from a part-way close view of the class start to the whole
      // build, the middle following what is lit. The view is driven the way a hand does it (a wheel step about the view's
      // top-left corner, then a drag), so the tree's own text and sizes follow the zoom.
      const svg = (await t.page.locator('svg.tree').first().boundingBox())!;
      const W = svg.width;
      const H = svg.height;
      const N = 90;
      const cams = treeCamera(start, pts, W, H, N, {
        first: 0.2,
        around: 8,
        lead: 1,
        pace: 1.5,
      });
      const setView = async (k: number, cx: number, cy: number) => {
        const cur = await t.page.evaluate(() => {
          const g = document.querySelector('svg.tree g[transform^="translate("]')!;
          const m = /translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)\)/.exec(
            g.getAttribute('transform')!,
          )!;
          return { x: +m[1], y: +m[2], k: +m[3] };
        });
        if (Math.abs(k / cur.k - 1) > 1e-6)
          await t.page.evaluate((f: number) => {
            const el = document.querySelector('svg.tree') as SVGElement;
            const r = el.getBoundingClientRect();
            el.dispatchEvent(
              new WheelEvent('wheel', {
                deltaY: -Math.log(f) / 0.0015,
                clientX: r.left,
                clientY: r.top,
                cancelable: true,
                bubbles: true,
              }),
            );
          }, k / cur.k);
        // The zoom was about the top-left corner: the view's origin scaled with it.
        const f = k / cur.k;
        const dx = W / 2 - cx * k - cur.x * f;
        const dy = H / 2 - cy * k - cur.y * f;
        if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) return;
        const ox = svg.x + W / 2;
        const oy = svg.y + H / 2;
        await t.page.mouse.move(ox, oy);
        await t.page.mouse.down();
        await t.page.mouse.move(ox + 20, oy); // past the drag threshold, so that the release is not a click
        await t.page.mouse.move(ox + dx, oy + dy, { steps: 2 });
        await t.page.mouse.up();
      };
      for (let i = 0; i < N; i++) {
        const { k, cx, cy, lit } = cams[i];
        const level = Math.round(5 + (95 * lit) / order.length);
        await t.stage((S, c, _g, a2) => S.setAllocated(c, a2), order.slice(0, lit));
        await setView(k, cx, cy);
        await t.page.mouse.move(5, 470);
        await t.page.evaluate((l: number) => {
          window.getSelection()?.removeAllRanges();
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
      // A big monster walks into the shot (frame 100) and is held up through the fight. From frame 120 the traps leave it alone,
      // so nothing is lit over it; from 135 a trap thrown at it is let be, and the first hit after that throw fells it: the
      // amulet drops where it stood, and the Shade stands still (no more throws, no walk to the loot) while it lies there. The
      // frames of the throw and the fall are printed, for the cut.
      await t.rec(210, {
        each: (S, c, i) => {
          const win = window as any;
          const w = c.world;
          if (i === 100) win.__big = S.bigOne(w, win.__run);
          if (win.__big == null) return;
          // The strike that felled it plays for a fifth of a second; then nothing is lit over the item.
          if (win.__fell != null) {
            if (i >= win.__fell + 6) S.calmBig(w, win.__big);
            return;
          }
          const m = w.actors.find((a: any) => a.id === win.__big);
          if (i < 135) {
            S.keepBig(w, win.__big);
            if (i >= 120) S.calmBig(w, win.__big);
            win.__had = new Set(w.sides[0].deployables.map((d: any) => d.id));
            return;
          }
          if (win.__toss == null) {
            const near = w.sides[0].deployables.some(
              (d: any) => !win.__had.has(d.id) && Math.hypot(d.x - m.x, d.y - m.y) < 2.5,
            );
            if (near) win.__toss = i - 1;
            S.keepBig(w, win.__big);
            win.__life = m.life;
            return;
          }
          if (m.life < win.__life - 1e-6) {
            const uid = S.rareAmulet(win.__run, 70);
            S.fellBig(w, win.__run, win.__big, uid);
            win.__run.inventory = win.__run.inventory.filter((x: any) => x.uid !== uid);
            S.standStill(c, win.__game);
            win.__fell = i;
            return;
          }
          S.keepBig(w, win.__big);
          win.__life = m.life;
        },
      });
      const at = await t.page.evaluate(() => [(window as any).__toss, (window as any).__fell]);
      console.log(`  the trap is thrown on frame ${at[0]}; the big one falls on frame ${at[1]}`);
    },
  },

  /* 4c. The amulet's card in the bag, and Equip on 10.2 s. */
  {
    name: 'equip',
    // Taller than the other camp screens (1280×990 drawn), so that both cards show whole with the Swap button under them.
    viewport: { w: 854, h: 660, scale: 1.5 },
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
      // Both cards from their titles down: nothing scrolled.
      await t.page.evaluate(() => document.querySelectorAll('*').forEach((e) => (e.scrollTop = 0)));
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
        if (i === 30) {
          await t.page.evaluate(() =>
            (document.querySelector('.trailer-press') as HTMLElement | null)?.click(),
          );
          await t.page.waitForTimeout(100);
          // The game selects the old amulet after a swap (is it worth keeping?); the shot is about the new one: its slot is
          // selected and lit, so the card shows the Night Locket worn. (The old one is let go first: a slot clicked with a bag
          // item selected wears that item.)
          await t.page.click('.ix-close');
          await t.page.waitForTimeout(50);
          await t.page.evaluate(() => {
            const slot = [...document.querySelectorAll('.ix-slot')].find(
              (s) => s.querySelector('.ix-slot-name')?.textContent === 'Night Locket',
            ) as HTMLElement | undefined;
            slot?.click();
            slot?.classList.add('trailer-lit');
          });
          await t.page.mouse.move(5, 470);
        }
        // Nothing scrolls: the screen stays as it was, only what changed moves.
        if (i >= 30)
          await t.page.evaluate(() =>
            document.querySelectorAll('*').forEach((e) => (e.scrollTop = 0)),
          );
        await t.still(1);
      }
    },
    css: `.trailer-press { filter: brightness(1.5); transform: scale(0.96); }
      .trailer-lit { box-shadow: 0 0 0 2px #d98a3a, 0 0 22px rgba(217,138,58,.75) !important; border-color: #d98a3a !important; }`,
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

  /* 6. The climb: four builds, four places, a half second each, as close in as the boss fight that follows (7). */
  mapClip(
    'climb1',
    { classId: 'reaver', level: 12, body: ['reapingArc', 'bruteForce'] },
    4,
    { theme: 'ashenCrypt', biome: 'crypt' },
    45,
    { zoom: CLOSE },
  ),
  mapClip(
    'climb2',
    { classId: 'mystic', level: 20, weapon: 'wand_l35', body: ['flameBolt', 'echoingCast'] },
    12,
    { theme: 'bonePits', biome: 'forge' },
    45,
    { zoom: CLOSE },
  ),
  mapClip(
    'climb4',
    { classId: 'zealot', level: 42, body: ['arcChain', 'channelledElements'] },
    31,
    { theme: 'hollowVigil', biome: 'ruins' },
    45,
    { zoom: CLOSE },
  ),
  mapClip(
    'climb5',
    { classId: 'mystic', level: 52, weapon: 'wand_l35', body: ['creepingPlague'] },
    41,
    { theme: 'gnawingWarrens', biome: 'marsh' },
    45,
    { zoom: CLOSE },
  ),
  /* 7. The fall, level 72: the Shade fights the Tollkeeper, and his whole fourth toll runs: the bell hoisted over his head
        through the tell and held while its six rings show, then brought down as the first ring strikes and kills. The body
        is held. The shot
        is kept plain so the bell is what is seen: the Shade only stabs with its daggers (no skill and its effects), and no
        damage numbers are drawn. It opens on blows a moment before the tell; the frames the tell starts on and the ring lands
        on are printed, for the cut. */
  {
    name: 'fall',
    zoom: CLOSE,
    css: BARE,
    async film(t) {
      await t.stage((S, c, game, fallen) => {
        const run = S.stagedRun(fallen, 63);
        S.pastMaps(run);
        S.bossFight(c, run, 'tollkeeper', { biome: 'warren', dist: 5 });
        S.holdEnd(c);
        // Three tolls pass (the deathless Shade takes them); the shot is the fourth, six rings and the hardest yet.
        S.untilTolls(c, 3, 2.3);
        S.settle(game, c);
        // Hit after hit, he would flash white end to end: his flash is kept off, so the bell is always seen.
        S.calmFlash(game, S.boss(c.world).m.id, Infinity);
        S.quietNumbers(game);
      }, FALLEN);
      // A second and a half drawn and not kept: what the drawing queued through the warm-up (the earlier tolls' call-outs, dust)
      // plays out before the shot.
      await t.rec(45, { film: false, each: (S, c) => S.keepBoss(c.world) });
      await t.rec(170, {
        each: (S, c, i) => {
          const w = c.world;
          const win = window as any;
          S.keepBoss(w);
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
        S.untilTolls(c, 3);
        const caught = S.warmUntil(
          c,
          (w: any) => {
            S.keepBoss(w);
            return S.blastDue(w, 'Toll');
          },
          900,
        );
        if (caught < 0) throw new Error('the fourth toll did not catch the Shade');
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
    zoom: CLOSE,
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
