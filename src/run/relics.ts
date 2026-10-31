import { Rng } from '../core/rng';
import { bossForMap } from '../data/bosses';
import { BOSS_RELIC_CHOICES, ECHO_DUST, HEADSMAN_DUST, THRONE_DRAUGHT } from '../data/runRewards';
import type { RelicCard, RunState } from './run';
import { drawRelics, heldReward } from './wayside';

/**
 * What the run's relics do outside the fight (docs/ATTRITION.md): Bone Dust gained, the bounty on rares, the flasks at a boss
 * level's start, and the pick a fallen boss offers. The relics the character sheet reads are calc/relics.ts; those the fight
 * reads are the sim's.
 */

/** Bone Dust after The Echoing Word's cut (relic 19): what a gain of `n` gives the run. */
export const dustCut = (run: RunState, n: number): number =>
  heldReward(run, 'echoingWord') > 0 ? Math.floor(n * ECHO_DUST) : n;

/** Bone Dust the run gains, after the cut. Every gain of Dust goes through here (salvage reads `dustCut` itself). */
export function gainDust(run: RunState, n: number): number {
  const got = dustCut(run, n);
  run.dust += got;
  return got;
}

/** The Headsman's Tally (relic 2): Bone Dust for the rares slain on a map. */
export function payBounty(run: RunState, rares: number): number {
  if (!rares || !heldReward(run, 'headsmansTally')) return 0;
  return gainDust(run, rares * HEADSMAN_DUST);
}

/**
 * Draught Before the Throne (relic 4): when a boss level starts, every flask holds at least half its charges. `start` is what
 * the map would start with (fractions by uid, a missing uid being full); the result is what it starts with.
 */
export function throneDraught(
  run: RunState,
  map: number,
  start: Record<number, number>,
): Record<number, number> {
  if (!bossForMap(map) || !heldReward(run, 'throneDraught')) return start;
  const out = { ...start };
  for (const [uid, f] of Object.entries(out)) out[Number(uid)] = Math.max(THRONE_DRAUGHT, f);
  return out;
}

/**
 * The relics a boss that falls offers (the owner, 2026-10-30): three the run can still take, drawn from the seed and the level
 * and weighed by the character's attributes as the boss falls (`relicWeight`).
 */
export function rollBossRelics(run: RunState): RelicCard[] {
  const rng = new Rng(run.seed).fork(`bossrelics${run.map}`);
  return drawRelics(run, rng, BOSS_RELIC_CHOICES).map((r) => ({
    kind: 'relic' as const,
    uid: run.nextUid++,
    id: r.id,
  }));
}
