import { gemDef } from '../data/gems';
import { factionOfSpec } from '../data/monsters';
import { getTree } from '../data/tree';
import { EQUIP_SLOTS, type AnyItem, type Build } from '../data/types';
import { DAMAGE_TYPES } from '../mods/types';
import type { Actor, World } from '../sim/types';
import type { RunState } from './run';

/**
 * Depth metrics for the headless players (EXPANSION section 10): who killed the player, which
 * uniques a run found and wore, and what build it ended up with.
 */

export type KillerInfo = {
  /** The monster's faction. Every monster is Ossuary (skeletons) until the new factions land. */
  faction: string;
  /** Monster type id: warrior, brute, archer or mage. */
  type: string;
  variant: string;
  rarity: string;
  mods: string[];
  /** Damage type of the last hit taken. */
  dtype: string;
  name: string;
};

/** One line: "Frozen Skeleton Brute (rare: hasted, armoured), cold". */
export function killerText(k: KillerInfo): string {
  return `${k.name} (${k.rarity}${k.mods.length ? ': ' + k.mods.join(', ') : ''}), ${k.dtype}`;
}

export function factionOf(a: Actor): string {
  return a.mon ? factionOfSpec(a.mon.spec) : 'ossuary';
}

/** Remember the last monster that hit the player. Pass `tick` to `runMap` as its `onTick`. */
export function killerTracker(): { tick: (w: World) => void; get: () => KillerInfo | null } {
  let killer: KillerInfo | null = null;
  return {
    tick(w) {
      for (const e of w.events) {
        if (e.t !== 'hit' || e.dst !== w.player.id) continue;
        const a = w.actors.find((x) => x.id === e.src);
        if (!a?.mon) continue;
        killer = {
          faction: factionOf(a),
          type: a.mon.spec.type,
          variant: a.mon.spec.variant,
          rarity: a.rarity,
          mods: [...a.modIds],
          dtype: DAMAGE_TYPES[e.dtype] ?? 'physical',
          name: a.name,
        };
      }
    },
    get: () => killer,
  };
}

/** What a run looked like at one map. */
export type BuildSnapshot = {
  map: number;
  /** Unique items picked up so far. */
  found: number;
  /** Ids of the uniques being worn. */
  worn: string[];
  /** Primary skill, keystones and uniques worn: two builds with the same signature play alike. */
  signature: string;
};

export const SNAPSHOT_MAPS = [25, 50, 75, 100];

/** Ids of the uniques worn: items in their slots and unique flasks in the flask belt. */
export function wornUniques(build: Build): string[] {
  const out: string[] = [];
  for (const slot of EQUIP_SLOTS) {
    const it = build.equipment[slot];
    if (it?.uniqueId) out.push(it.uniqueId);
  }
  for (const f of build.flasks) if (f?.uniqueId) out.push(f.uniqueId);
  return out.sort();
}

export function buildSignature(build: Build): string {
  const gems = EQUIP_SLOTS.flatMap((s) => build.equipment[s]?.sockets ?? []).filter(
    (g) => g !== null,
  );
  const active =
    gems.find((g) => g.uid === build.primaryGem) ??
    gems.find((g) => gemDef(g.gemId).kind === 'active');
  const tree = getTree();
  const keystones = build.allocated
    .filter((id) => tree.nodes[id].kind === 'keystone')
    .map((id) => tree.nodes[id].name)
    .sort();
  const uniques = wornUniques(build);
  return [
    active ? active.gemId : 'default',
    keystones.join(',') || '-',
    uniques.join(',') || '-',
  ].join(' | ');
}

export function countUniques(items: AnyItem[]): number {
  return items.filter((it) => it.kind === 'item' && it.rarity === 'unique').length;
}

/** Collects the snapshots of one run. Call `afterMap` with the picked-up items of each cleared map. */
export class RunTally {
  found = 0;
  /** Gems picked up over the run. */
  gems = 0;
  snapshots: BuildSnapshot[] = [];

  afterMap(run: RunState, picked: AnyItem[]): void {
    this.found += countUniques(picked);
    this.gems += picked.filter((it) => it.kind === 'gem').length;
    if (SNAPSHOT_MAPS.includes(run.map))
      this.snapshots.push({
        map: run.map,
        found: this.found,
        worn: wornUniques(run.build),
        signature: buildSignature(run.build),
      });
  }
}
