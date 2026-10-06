import type { MonsterModId, MonsterRarity } from './monsters';

/** How an enemy affix is shown: a coloured shape (map pips, inspect chips) and a plain-language effect. */
export type ModShape = 'circle' | 'diamond' | 'square' | 'triUp' | 'triDown' | 'ring';

export type ModMark = {
  color: number;
  shape: ModShape;
  /** Draws a faint aura on the ground under the monster. */
  aura: boolean;
  desc: string;
};

export const MOD_MARKS: Record<MonsterModId, ModMark> = {
  hasted: {
    color: 0xffe040,
    shape: 'triUp',
    aura: false,
    desc: '+25% movement, attack and cast speed.',
  },
  armoured: {
    color: 0xb8c0d0,
    shape: 'square',
    aura: false,
    desc: '+200% armour: physical hits are heavily reduced.',
  },
  elusive: {
    color: 0x70e8a8,
    shape: 'diamond',
    aura: false,
    desc: '+200% evasion: many attacks miss it.',
  },
  prismatic: {
    color: 0xff88ff,
    shape: 'ring',
    aura: true,
    desc: '+30% to all elemental resistances.',
  },
  fireBound: {
    color: 0xff6a28,
    shape: 'circle',
    aura: true,
    desc: 'Gains 50% of physical damage as extra fire.',
  },
  frostBound: {
    color: 0x6ac8ff,
    shape: 'circle',
    aura: true,
    desc: 'Gains 50% of physical damage as extra cold.',
  },
  stormBound: {
    color: 0xfff060,
    shape: 'diamond',
    aura: true,
    desc: 'Gains 50% of physical damage as extra lightning.',
  },
  vampiric: {
    color: 0xc01838,
    shape: 'triDown',
    aura: false,
    desc: 'Leeches 10% of damage dealt as life.',
  },
  regenerating: {
    color: 0x58d858,
    shape: 'square',
    aura: false,
    desc: 'Regenerates 1% of its life per second.',
  },
  fortified: {
    color: 0xe0a830,
    shape: 'square',
    aura: true,
    desc: '100% more life.',
  },
  volatile: {
    color: 0xff3030,
    shape: 'triDown',
    aura: true,
    desc: 'Explodes when it dies.',
  },
  raiser: {
    color: 0xa868e8,
    shape: 'diamond',
    aura: true,
    desc: 'Periodically raises more monsters.',
  },
  frenzied: {
    color: 0xff9040,
    shape: 'triUp',
    aura: false,
    desc: '50% more damage while on low life.',
  },
  rimeAura: {
    color: 0xa8f4ff,
    shape: 'ring',
    aura: true,
    desc: 'Chills nearby enemies with a freezing aura.',
  },
  unshakable: {
    color: 0x9098a8,
    shape: 'circle',
    aura: false,
    desc: 'Cannot be stunned.',
  },
};

export const RARITY_COLOR: Record<MonsterRarity, number> = {
  normal: 0xcfcfcf,
  magic: 0x8888ff,
  rare: 0xffd860,
  miniboss: 0xff9040,
  boss: 0xff4a40,
};

export function hex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}
