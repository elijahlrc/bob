import type { ComponentChildren } from 'preact';
import type { Controller } from '../run/controller';
import { waysideOf } from '../run/wayside';

/** What the first-use explainers say, by id (docs/WAYSIDE.md 9.1). Each shows once per run, until it is dismissed. */
export const TIPS = {
  stop: 'A stop takes the place of a map. The level passes with no loot, no XP and no clear rewards, as with a Respite, and you are given a service a map cannot give. You can always take a map instead.',
  wares:
    'The Market sells for Bone Dust, which you earn by salvaging items you do not need (Items tab, Clean up). The stock changes every level.',
  satchel:
    'Provisions are armed before a map and used up when it starts, cleared or not. Staples are small and safe, bets are strong and cost something, and specialists pay only against the kind of map they name. The cards below count what you have armed.',
  reprieve:
    'A reprieve fires by itself if you would die, and is used up. A Retreat pulls you out of the map as an abandon (the level is spent and you keep what you picked up); it does nothing on a boss level. A Revive stands you up again where you fell. One is held at a time, and a run allows three.',
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
