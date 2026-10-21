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
/** The camp and title screens: 1280×720 drawn at 1.5× (the text reads at trailer size). */
const UI = { w: 854, h: 480, scale: 1.5 };

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
  } = {},
): Clip {
  return {
    name,
    viewport: opts.viewport,
    zoom: opts.zoom ?? (opts.viewport ? 2 : 2.5),
    css: BARE,
    async film(t) {
      await t.stage(
        (S, c, _g, a) => {
          const run = S.stagedRun(a.loadout, a.map);
          S.playMap(c, run, a.where);
          // A map cleared before the clip ends stays on screen.
          S.holdEnd(c);
          S.warm(c, a.warm);
          S.warmUntil(c, (w: any) => S.near(w, 6) >= a.pack, 4000);
          if (a.speed) c.setSpeed(a.speed);
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
  /* 1. Cold open: a late Shade's traps and blades through a packed room. */
  mapClip(
    'endgame',
    {
      classId: 'shade',
      level: 92,
      body: ['spireTrap', 'wiredHarm', 'tripleSnare'],
      helmet: ['orbitingBlades'],
      primary: 'spireTrap',
    },
    84,
    { theme: 'bonePits', biome: 'ruins' },
    150,
    { zoom: 2, pack: 5 },
  ),

  /* 2. The class screen, the highlight stepping across the cards on the eighth notes. */
  {
    name: 'classes',
    viewport: UI,
    css: `.class-card.on { background: var(--panel2) !important; box-shadow: 0 0 0 2px #d98a3a, 0 0 28px rgba(217,138,58,.45); transform: translateY(-3px); }`,
    async film(t) {
      await t.stage((_S, c) => c.goTo('classSelect'));
      await t.page.waitForTimeout(300);
      for (let i = 0; i < 30; i++) {
        const on = [1, 2, 3, 4, 5, 0][Math.min(5, Math.floor(i / 3.75))];
        await t.page.evaluate((k: number) => {
          document
            .querySelectorAll('.class-card')
            .forEach((el, j) => el.classList.toggle('on', j === k));
        }, on);
        await t.still(1);
      }
    },
  },

  /* 3a. The Vanguard's tree: a path to a keystone, a node on each eighth note. */
  {
    name: 'tree',
    viewport: UI,
    css: `.tree-wrap .tooltip, svg.tree g.preview { display: none !important; }`,
    async film(t) {
      const shot = await t.stage((S, c) => {
        const run = S.stagedRun({ classId: 'vanguard', level: 40, seed: 3 }, 20);
        const s = S.treeShot(run, 4);
        S.toCamp(c, run);
        return s;
      });
      if (!shot) throw new Error('no keystone path');
      await tab(t, 'Passive tree');
      await t.page.waitForTimeout(200);
      await t.page.fill('.tree-search input', shot.name);
      await t.page.press('.tree-search input', 'Enter');
      await t.page.fill('.tree-search input', '');
      // Zoom in a little on the keystone, then pan so the whole path is in the middle of the view.
      const at = async (id: number) =>
        (await t.page.locator(`.ring[data-id="${id}"]`).first().boundingBox()) as {
          x: number;
          y: number;
          width: number;
          height: number;
        };
      const key = await at(shot.path[3]);
      await t.page.mouse.move(key.x + key.width / 2, key.y + key.height / 2);
      await t.page.mouse.wheel(0, -150);
      await t.page.waitForTimeout(100);
      const a = await at(shot.path[0]);
      const b = await at(shot.path[3]);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const svg = (await t.page.locator('svg.tree').first().boundingBox())!;
      const cx = svg.x + svg.width / 2;
      const cy = svg.y + svg.height / 2;
      await t.page.mouse.move(cx, cy);
      await t.page.mouse.down();
      await t.page.mouse.move(cx + (cx - mid.x), cy + (cy - mid.y), { steps: 8 });
      await t.page.mouse.up();
      await t.page.mouse.move(5, 470);
      for (let i = 0; i < 30; i++) {
        const k = [0, 8, 15, 23].indexOf(i);
        if (k >= 0) await t.stage((S, c, _g, node) => S.take(c, node), shot.path[k]);
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
      for (let i = 0; i < 30; i++) {
        if (i === 6) {
          await t.page.click('.gem-chip:has-text("Wired Harm")');
          await t.page.mouse.move(5, 470);
        }
        if (i === 12) await t.page.locator('.socket.empty').last().click();
        if (i === 12) {
          await t.page.mouse.move(5, 470);
          // The click scrolls the tab; the skill's line, with its DPS, is at the top.
          await t.page.evaluate(() =>
            document.querySelectorAll('*').forEach((e) => (e.scrollTop = 0)),
          );
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
        (S, c, _g, a) => {
          const run = S.stagedRun(a, 45);
          (window as any).__run = run;
          S.playMap(c, run, { theme: 'hollowVigil', biome: 'ruins', density: 'packed' });
          S.warm(c, 45);
          S.warmUntil(c, (w: any) => S.near(w, 4) >= 3, 4000);
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
      for (let i = 0; i < 30; i++) {
        if (i === 21)
          await t.page.evaluate(() => {
            const b = [...document.querySelectorAll('button')].find((x) =>
              /^(Equip|Swap)/.test(x.textContent ?? ''),
            );
            (b as HTMLElement | undefined)?.classList.add('trailer-press');
          });
        if (i === 24)
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
    { viewport: PHONE, pack: 4 },
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
    { viewport: PHONE },
  ),
  mapClip(
    'zealot',
    { classId: 'zealot', level: 60, body: ['cleansingBlaze', 'standingCast'] },
    35,
    { theme: 'lamplitCloister', biome: 'hollow' },
    90,
    { viewport: PHONE },
  ),

  /* 6. The climb: seven builds, seven places, a half second each. */
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
    'climb3',
    { classId: 'mystic', level: 30, weapon: 'wand_l35', body: ['frostRing'] },
    21,
    { theme: 'chitinGalleries', biome: 'cavern' },
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
  mapClip(
    'climb7',
    { classId: 'shade', level: 72, body: ['orbitingBlades'] },
    63,
    { theme: 'kilnHall', biome: 'warren' },
    45,
  ),

  /* 7. The fall: the Magistrate's Sentence lands on the Shade at map 63; the body held; the end screen. */
  {
    name: 'fall',
    zoom: 2.5,
    css: BARE + ` .duel-cta.trailer-press { filter: brightness(1.5); transform: scale(0.97); }`,
    async film(t) {
      await t.stage((S, c) => {
        const run = S.stagedRun(
          { classId: 'shade', level: 72, body: ['orbitingBlades'], seed: 9 },
          63,
        );
        S.pastMaps(run);
        S.bossFight(c, run, 'magistrate', { biome: 'warren', dist: 5 });
        S.holdEnd(c);
        // The Sentence, with 0.6 s of its countdown left: the shot opens there.
        S.warmUntil(
          c,
          (w: any) => {
            const e = S.effect(w, 'Sentence');
            return !!e && e.t <= 0.6;
          },
          2000,
        );
      });
      await t.rec(64, {
        each: (S, c) => {
          const w = c.world;
          const e = S.effect(w, 'Sentence');
          if (e && e.t < 0.1) S.mortal(w);
        },
      });
      t.cut('summary');
      await t.stage((S, c) => {
        S.releaseEnd(c);
        c.bus.emit('frame', { dtMs: 33 });
      });
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

  /* 8. The duel: our Mystic against Sin's Reaver; the last four seconds up to the deciding blow; then the rating. */
  {
    name: 'duel',
    zoom: 2.5,
    css: `.hud-top .muted, .speeds, .biome-banner { display: none !important; }`,
    async film(t) {
      const n = await t.stage((S, c, _g, me) => {
        const mk = (l: any) => S.stagedRun(l, 80).build;
        const a = mk({
          classId: 'mystic',
          level: 84,
          weapon: 'wand_l72',
          body: ['flameBolt', 'echoingCast'],
        });
        const b = mk({ classId: 'reaver', level: 84, body: ['reapingArc', 'bruteForce'] });
        (window as any).__builds = [a, b];
        // Find a seed the Mystic wins, after a fight of five seconds or more.
        for (let seed = 1; seed < 60; seed++) {
          S.duel(c, a, b, seed, [me, 'Sin'], { before: 712, after: 748 });
          let f = 0;
          while (c.screen === 'map' && f < 30 * 120) {
            c.bus.emit('frame', { dtMs: 1000 / 30 });
            f++;
          }
          const out = c.lastDuel;
          if (out && out.result.winner === 0 && out.result.how === 'death' && f > 150) {
            (window as any).__seed = seed;
            return f;
          }
        }
        return -1;
      }, ME);
      if (n < 0) throw new Error('no duel the Mystic wins');
      await t.stage(
        (S, c, _g, a) => {
          const [x, y] = (window as any).__builds;
          S.duel(c, x, y, (window as any).__seed, [a.me, 'Sin'], { before: 712, after: 748 });
          S.warm(c, a.n - 120);
        },
        { me: ME, n },
      );
      await t.rec(125);
      t.cut('result');
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
