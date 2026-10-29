/**
 * Run rewards (docs/ATTRITION.md): things a roguelike gives and the reference game does not, kept for the rest of the run.
 * A first list, decided 2026-10-29 while the owner was away; the Quartermaster carries them, and where else they come from is
 * open. Every name and text here is ours.
 */
export type RunRewardId = 'deeperPouch' | 'keenEye' | 'waystationCup' | 'thriftyHands';

export type RunRewardDef = {
  id: RunRewardId;
  name: string;
  /** What it does, in a line (its ware card and the effects bar). */
  text: string;
  /** Base price in Bone Dust before the level factor (data/sale.ts). */
  base: number;
  /** How many a run can hold. */
  max: number;
  /** The first level it is for sale on. */
  from: number;
};

export const RUN_REWARDS: RunRewardDef[] = [
  {
    id: 'deeperPouch',
    name: 'Deeper Pouch',
    text: 'Your pouch holds one more provision, and one more can be armed.',
    base: 40,
    max: 2,
    from: 6,
  },
  {
    id: 'keenEye',
    name: 'Keen Eye',
    text: 'Every reward pick offers one more choice.',
    base: 45,
    max: 1,
    from: 6,
  },
  {
    id: 'waystationCup',
    name: 'Waystation Cup',
    text: 'Every stop you take refills your flasks.',
    base: 50,
    max: 1,
    from: 8,
  },
  {
    id: 'thriftyHands',
    name: 'Thrifty Hands',
    text: 'Crafts at a Respite cost half as much Bone Dust.',
    base: 35,
    max: 1,
    from: 6,
  },
];

export const runRewardDef = (id: string): RunRewardDef => {
  const d = RUN_REWARDS.find((r) => r.id === id);
  if (!d) throw new Error(`unknown run reward ${id}`);
  return d;
};
