import type Phaser from 'phaser';
import { Rng } from './core/rng';
import { MONSTER_TYPES, type MonsterTypeId } from './data/monsters';
import { spawnMonster } from './sim/world';
import { ITEM_BASES } from './data/bases';
import type { InventoryItem } from './data/types';
import { rollFlask, rollGem, rollItemOf } from './gen/loot';
import { noteFound } from './run/found';
import type { Controller } from './run/controller';
import { uidSource } from './run/run';

/**
 * Dev-only helpers on `window.__dev` for driving the game from the browser console or an automation
 * tool. Useful because background tabs throttle animation frames: `step` advances the game manually.
 */
export function installDevTools(controller: Controller, game: Phaser.Game): void {
  const recent: string[] = [];
  controller.bus.on('ticked', ({ events }) => {
    for (const e of events) recent.push(e.t);
    if (recent.length > 600) recent.splice(0, 300);
  });
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const dev = {
    controller,
    game,
    /** Advance `n` rendered frames of `dtMs` each. */
    async step(n: number, dtMs = 16.7): Promise<void> {
      for (let i = 0; i < n; i++) {
        game.step(performance.now(), dtMs);
        if (i % 20 === 0) await sleep(0);
      }
    },
    /** Step until a frame produced one of the sim event types; returns the frames it took, or -1. */
    async until(types: string[], max = 1500): Promise<number> {
      for (let i = 0; i < max; i++) {
        recent.length = 0;
        game.step(performance.now(), 16.7);
        if (recent.some((t) => types.includes(t))) return i;
        if (i % 30 === 0) await sleep(0);
      }
      return -1;
    },
    /** Start the crypt showcase on class index `idx`. */
    async showcase(idx = 0, warm = 120): Promise<string> {
      controller.startShowcase(false);
      controller.setSpeed(2);
      for (let i = 0; i < idx; i++) controller.nextShowcaseClass();
      await dev.step(warm);
      return controller.run!.classId;
    },
    /** Start the boss showcase and fast-forward until the boss is close. */
    async boss(idx = 0): Promise<number> {
      controller.startShowcase(true);
      for (let i = 0; i < idx; i++) controller.nextShowcaseClass();
      controller.setSpeed(8);
      let n = 0;
      for (; n < 7000; n++) {
        game.step(performance.now(), 16.7);
        const w = controller.world;
        if (!w) break;
        const b = w.actors.find((a) => a.rarity === 'boss' && a.alive);
        if (b && Math.hypot(b.x - w.player.x, b.y - w.player.y) < 7) break;
        if (n % 40 === 0) await sleep(0);
      }
      controller.setSpeed(1);
      await dev.step(40);
      return n;
    },
    /**
     * Put one of each of the monster types in `ids` in front of a frozen, deathless character, to look at them in the
     * real renderer (docs/ROSTER.md 4.5). They stand still by default; with `fight` they walk up and attack.
     */
    async monsters(
      ids: MonsterTypeId[] = Object.keys(MONSTER_TYPES) as MonsterTypeId[],
      opts: { level?: number; fight?: boolean; warm?: number; cols?: number } = {},
    ): Promise<number> {
      controller.startShowcase(false);
      controller.setSpeed(1);
      await dev.step(5);
      const w = controller.world;
      if (!w) return 0;
      w.opts.godMode = true;
      w.player.stunT = 1e9;
      for (const a of w.actors) if (!a.isPlayer) a.alive = false;
      const cols = opts.cols ?? 4;
      ids.forEach((id, i) => {
        // Spread round the character, each pushed to the nearest open floor.
        const ang = (i / ids.length) * Math.PI * 2;
        const ring = 2.5 + (i % cols) * 0.5;
        const spot = w.grid.collide(
          w.player.x + Math.cos(ang) * ring,
          w.player.y + Math.sin(ang) * ring,
          0.5,
        );
        const x = spot.x;
        const y = spot.y;
        const spec = {
          type: id,
          variant: 'none' as const,
          rarity: 'normal' as const,
          level: opts.level ?? 30,
          mods: [],
        };
        const m = spawnMonster(w, spec, x, y, 0, 0, MONSTER_TYPES[id].name);
        if (opts.fight) m.state = 'chase';
        else m.dummy = true;
      });
      await dev.step(opts.warm ?? 10);
      return ids.length;
    },
    /** Put `n` random items, gems and flasks in the camp inventory (for looking at the Items screen). */
    loot(n = 30, ilvl = 20): number {
      const run = controller.run;
      if (!run) return 0;
      const rng = new Rng(n * 7919 + ilvl);
      const uid = uidSource(run);
      const added: InventoryItem[] = [];
      for (let i = 0; i < n; i++) {
        const k = i % 6;
        if (k === 5) added.push(rollGem(rng, uid, { classId: run.classId, ilvl }));
        else if (k === 4) added.push(rollFlask(rng, uid, ilvl));
        else {
          const base = rng.pick(ITEM_BASES.filter((b) => b.level <= ilvl));
          added.push(rollItemOf(rng, uid, base, ilvl, rng.pick(['normal', 'magic', 'rare'])));
        }
      }
      // Found on levels spread over the last 30, and not yet looked at.
      added.forEach((it, i) => {
        noteFound(run, it);
        run.acquired[it.uid] = Math.max(1, run.map - ((i * 7) % 30));
      });
      // A new array, because the screens memoise on the identity of the inventory.
      run.inventory = run.inventory.concat(added);
      controller.bus.emit('state', null);
      return run.inventory.length;
    },
    sleep,
  };
  (window as unknown as { __dev: typeof dev }).__dev = dev;
}
