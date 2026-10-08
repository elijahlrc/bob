import type { World } from './types';
import { spawnMonster } from './world';

/**
 * Holdout (docs/MAPS.md 9.2): the monsters come in waves. Each wave appears at its time, already chasing; when every
 * monster of a wave is dead it pays out a chest beside the character.
 */
export function tickHoldout(w: World): void {
  const waves = w.plan.pop.waves;
  if (w.plan.type !== 'holdout' || !waves) return;
  const h = w.holdout;
  while (h.spawned < waves.length && w.t >= waves[h.spawned].t) {
    const wave = waves[h.spawned];
    h.ids.push(
      wave.monsters.map((s) => {
        const a = spawnMonster(w, s.spec, s.x, s.y, s.room, s.pack, s.name);
        a.state = 'chase';
        return a.id;
      }),
    );
    h.done.push(false);
    h.spawned++;
  }
  if (w.tick % 10 !== 0) return;
  for (let i = 0; i < h.spawned; i++) {
    if (h.done[i]) continue;
    const alive = new Set(w.actors.filter((a) => a.alive).map((a) => a.id));
    if (h.ids[i].some((id) => alive.has(id))) continue;
    h.done[i] = true;
    h.cleared++;
    // The wave is survived: a chest's worth of loot drops by the character.
    const p = w.player;
    const chest = { id: -1 - i, x: p.x, y: p.y, room: 0, opened: true };
    for (const item of w.opts.chestLoot?.(w, chest) ?? []) {
      const id = w.nextId++;
      w.drops.push({
        id,
        x: p.x + w.rngLoot.float(-1.2, 1.2),
        y: p.y + w.rngLoot.float(-1.2, 1.2),
        item,
      });
      w.events.push({ t: 'drop', id });
    }
  }
}
