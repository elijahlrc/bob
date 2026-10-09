/** The minion supports' effects, read from the summoning skill's profile when the minion is made (src/sim/minionFx.ts). */
export type MinionSup = {
  res: number;
  maxRes: number;
  eleMore: number;
  exposure: number;
  burn: number;
  selfBurn: number;
};

export const NO_SUP: MinionSup = {
  res: 0,
  maxRes: 0,
  eleMore: 0,
  exposure: 0,
  burn: 0,
  selfBurn: 0,
};
