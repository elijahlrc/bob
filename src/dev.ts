import type Phaser from 'phaser';
import type { Controller } from './run/controller';
import type { StyleChoice } from './run/controller';

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
    /** Start the crypt showcase on class index `idx` in a style. */
    async showcase(idx = 0, style: StyleChoice = 'grim', warm = 120): Promise<string> {
      controller.startShowcase(false);
      controller.setSpeed(2);
      controller.setStyle(style);
      for (let i = 0; i < idx; i++) controller.nextShowcaseClass();
      await dev.step(warm);
      return controller.run!.classId;
    },
    /** Start the boss showcase and fast-forward until the boss is close. */
    async boss(style: StyleChoice = 'grim', idx = 0): Promise<number> {
      controller.startShowcase(true);
      controller.setStyle(style);
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
    sleep,
  };
  (window as unknown as { __dev: typeof dev }).__dev = dev;
}
