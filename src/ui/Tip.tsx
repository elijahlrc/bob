import type { ComponentChildren } from 'preact';
import type { Controller } from '../run/controller';
import { waysideOf } from '../run/wayside';

/** What the first-use explainers say, by id (docs/WAYSIDE.md 9.1). Each shows once per run, until it is dismissed. */
export const TIPS = {
  stop: 'A stop takes the place of a map. The level passes with no loot, no XP and no clear rewards, as with a Respite, and you are given a service a map cannot give. You can always take a map instead.',
  satchel:
    'Your pouch holds three provisions. Arm any or all of them before a map: they are used up when it starts, cleared or not. Staples are small and safe, bets are strong and cost something. The cards below count what you have armed. A cleared map sometimes leaves you another.',
  reprieve:
    'A reprieve sits in your pouch with the other provisions and needs no arming. It fires by itself if you would die, refills your flasks, and is used up. A retreat pulls you out of the map as an abandon (the level is spent and you keep what you picked up) and does nothing on a boss level; a revive stands you up again where you fell.',
} as const;

export type TipId = keyof typeof TIPS;

/** A one-time explainer: shown until the player says "Got it" (saved with the run). */
export function Tip({ c, id, extra }: { c: Controller; id: TipId; extra?: ComponentChildren }) {
  if (!c.run || waysideOf(c.run).seen[id]) return null;
  return (
    <div class="tip">
      <div>{TIPS[id]}</div>
      {extra}
      <button class="btn small" onClick={() => c.see(id)}>
        Got it
      </button>
    </div>
  );
}
