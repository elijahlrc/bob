import { makeGem } from '../gen/items';
import type { RunState } from './run';

/**
 * The gems a character used to start with (a skill and a support in the body armour). A run now starts with no gems, so
 * this exists for tests and tools that want a character with a working skill from the first map.
 */
export const STARTER_GEMS: Record<string, [string, string]> = {
  vanguard: ['crushingBlow', 'bruteForce'],
  strider: ['splitVolley', 'swiftAssault'],
  mystic: ['flameBolt', 'echoingCast'],
  reaver: ['reapingArc', 'bruteForce'],
  zealot: ['arcChain', 'channelledElements'],
  shade: ['venomCut', 'swiftAssault'],
};

/** Socket the old starting skill and support into the body armour and make the skill primary. */
export function withStarterGems(run: RunState): RunState {
  const [skill, support] = STARTER_GEMS[run.classId];
  const body = run.build.equipment.body!;
  body.sockets = [makeGem(() => run.nextUid++, skill), makeGem(() => run.nextUid++, support)];
  run.build.primaryGem = body.sockets[0]!.uid;
  return run;
}
