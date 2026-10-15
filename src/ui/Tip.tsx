import type { ComponentChildren } from 'preact';
import type { Controller } from '../run/controller';
import { waysideOf } from '../run/wayside';

/** What the first-use explainers say, by id (docs/WAYSIDE.md 9.1). Each shows once per run, until it is dismissed. */
export const TIPS = {
  stop: "A stop takes a map's place and gives you a service instead.",
  satchel:
    'Your pouch holds three provisions. Arm any of them before a map; they are used up when it starts. Staples are small and safe, bets are strong and cost something.',
  reprieve:
    'A reprieve needs no arming. It fires if you would die, refills your flasks and is used up. A retreat pulls you out of the map; a revive stands you up where you fell.',
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
