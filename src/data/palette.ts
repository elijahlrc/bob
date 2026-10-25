/**
 * The game's colour ramps (docs/mockups/style/STYLE-GUIDE.md 3), shared by the menus (`src/ui/leaf`, which snaps every
 * painted pixel to them) and the map (`src/render`, which draws its marks in them; docs/WORLD-LEAF.md). Each ramp runs
 * from dark to light. Pure constants, so both sides may import them.
 */
export const RAMPS = {
  gold: ['#4a3616', '#634a21', '#7e622c', '#977835', '#ad8b40', '#c09d4e', '#d1b062', '#e2c681'],
  bole: ['#2e140d', '#431f15', '#5a2b1d', '#703826'],
  plaster: ['#4b463b', '#655f50', '#807866', '#9b927c', '#b3aa92'],
  ink: ['#0b0805', '#17110b', '#251c13'],
  lapis: ['#0c1129', '#11183a', '#172049', '#1d2958', '#24336a', '#2f417e', '#3f5291'],
  pearl: ['#7a7262', '#9a917c', '#b6ad95', '#cec6ad', '#e0d9c2', '#eee8d6'],
  vermilion: ['#3b120c', '#541a12', '#702418', '#8a3020', '#a23f2b', '#b6553d', '#c87257'],
  green: ['#112118', '#193022', '#23422d', '#2f5639', '#3f6c48', '#55845a', '#709c71'],
  teal: ['#122a31', '#1a3c46', '#25515c', '#326773', '#447f8b', '#6098a3', '#84b2b9'],
  porphyry: ['#1b0d14', '#28131e', '#381a2a', '#492337', '#5b2e46', '#713c58', '#88506d'],
  straw: ['#675b35', '#827444', '#9d8f57', '#b6a86e', '#ccbf8a', '#ddd2a8'],
  violet: ['#221930', '#312445', '#433359', '#57456f', '#6d5a87', '#8672a0', '#a08db8'],
  sky: ['#485564', '#617081', '#7c8d9f', '#99a9b9', '#b7c4d1', '#d3dce5'],
  azure: ['#1d3672', '#264993', '#335fb2', '#4877cb', '#6893dd', '#93b4ec'],
  // The dark material (the owner, 2026-10-24): an umber-black glaze leaning to oxblood, worn to a red bole, its
  // craquelure opening onto red. Only a painting of it snaps to these (DARK in src/ui/leaf/ramps.ts).
  bitumen: ['#0e0907', '#160d0a', '#1f120d', '#291711', '#341c15', '#412318', '#4f2a1e'],
  blood: ['#2e140d', '#5a2414', '#7a2e18', '#93391f'],
  crackred: ['#2c0f0a', '#431710', '#561a10'],
} as const;
export type Ramp = keyof typeof RAMPS;

/** A step of a ramp as a number (for Phaser), clamped to its ends. */
export function tone(ramp: Ramp, i: number): number {
  const r = RAMPS[ramp];
  return parseInt(r[Math.max(0, Math.min(r.length - 1, i))].slice(1), 16);
}

/**
 * The rarity colours of the map: a drop's label and beam, a monster's life bar and ground ring. They are the drops'
 * colours, which players learn the loot by (the owner kept the drops as they were, docs/WORLD-LEAF.md 4), so a rare
 * monster and a rare drop agree. The menus keep their own quieter text colours on lapis.
 */
export const MAP_RARITY = {
  normal: 0xdddddd,
  magic: 0x6a8cff,
  rare: 0xffd84a,
  unique: 0xff9a2a,
  miniboss: 0xff9a2a,
  boss: 0xe8452c,
  gem: 0x40e0c0,
  flask: 0xff6090,
  currency: 0xe8d8a0,
} as const;
