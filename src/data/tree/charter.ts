import type { RegionId } from './spec';

/**
 * The charter of the passive tree (docs/TREE-REDESIGN.md, T1): which cluster belongs to which district, and what each district is.
 * A district is a theme with a shape: groups of clusters of one subject, maybe a nexus (a cluster that pairs two of its groups),
 * and the keystones at its tip. A cluster named in no district is a **wayside** cluster on purpose: it has no theme to keep and
 * stands beside a road. Cluster ids are the ids of `clustersGen.ts` (`g0`..).
 *
 * Authored by hand from the generated clusters (`npm run tree:charter` checks it and prints the supply). Names are working titles
 * of ours; nothing here is drawn on the tree screen (the wedges stay as they are).
 */
export type Template = 'avenue' | 'ring' | 'fork' | 'knot' | 'ladder';

export type District = {
  id: string;
  name: string;
  region: RegionId;
  /** One sentence: what the district is for. */
  theme: string;
  /** The district's layout (section 5.2); no two districts of a region share one. */
  template: Template;
  /** Groups of clusters of one subject. */
  groups: Record<string, string[]>;
  /** Clusters that pair two or more groups of the district (placed where the groups meet). */
  nexus: string[];
  /** Keystones that sit at the district's tip. */
  keystones: string[];
};

export const DISTRICTS: District[] = [
  // --- int (Mystic) ----------------------------------------------------------------------------------------------------
  {
    id: 'wellspring',
    name: 'The Wellspring',
    region: 'int',
    theme: 'Mana and energy shield: the well a caster draws on.',
    template: 'knot',
    groups: {
      es: ['g16', 'g225', 'g267', 'g334', 'g86'],
      mana: ['g289', 'g143', 'g126', 'g145', 'g91', 'g49'],
    },
    nexus: ['g150'],
    keystones: ['mindBulwark', 'manaBastion'],
  },
  {
    id: 'conflux',
    name: 'The Conflux',
    region: 'int',
    theme:
      'Fire, cold and lightning, each in its own arm, with the clusters that pair them where the arms meet.',
    template: 'fork',
    groups: {
      fire: ['g182', 'g325', 'g64'],
      cold: ['g237', 'g43', 'g110'],
      lightning: ['g156', 'g61', 'g307', 'g138'],
    },
    nexus: ['g222', 'g240'],
    keystones: ['feverPitch'],
  },
  {
    id: 'boneCourt',
    name: 'The Bone Court',
    region: 'int',
    theme: 'Minions, and the hex that outlasts them.',
    template: 'avenue',
    groups: { minion: ['g132', 'g148', 'g154', 'g101', 'g38'] },
    nexus: ['g116'],
    keystones: ['volatileServants'],
  },
  {
    id: 'spellforge',
    name: 'The Spellforge',
    region: 'int',
    theme:
      'Spell damage, critical strikes with spells, and the sigils (brands, totems, mines) a caster leaves behind.',
    template: 'ring',
    groups: {
      spell: ['g197', 'g335', 'g60', 'g55', 'g287'],
      crit: ['g204', 'g247', 'g52'],
      sigils: ['g155', 'g234'],
    },
    nexus: ['g286'],
    keystones: [],
  },
  {
    id: 'quillwork',
    name: 'Quillwork',
    region: 'int',
    theme: 'Wands and staves.',
    template: 'ladder',
    groups: { wand: ['g276', 'g118', 'g343', 'g85', 'g336'], staff: ['g354', 'g39'] },
    nexus: [],
    keystones: [],
  },

  // --- dexint (Shade) --------------------------------------------------------------------------------------------------
  {
    id: 'snareRow',
    name: 'Snare Row',
    region: 'dexint',
    theme: 'Traps and mines: what they do, how they are set off, how many there are.',
    template: 'avenue',
    groups: {
      trap: ['g319', 'g144', 'g318', 'g298', 'g35'],
      trigger: ['g331', 'g177'],
      mines: ['g230', 'g46', 'g105', 'g27', 'g111'],
    },
    nexus: ['g245'],
    keystones: [],
  },
  {
    id: 'venomQuarter',
    name: 'The Venom Quarter',
    region: 'dexint',
    theme: 'Poison, chaos and slow damage, and the ailments that ride along.',
    template: 'fork',
    groups: {
      poison: ['g161', 'g50', 'g53', 'g271'],
      chaos: ['g93', 'g282', 'g241'],
      ailment: ['g242', 'g223', 'g312'],
    },
    nexus: [],
    keystones: ['cruelAgony'],
  },
  {
    id: 'knifeAlley',
    name: 'Knife Alley',
    region: 'dexint',
    theme: 'Daggers, claws and the critical strike: quick, close, and unforgiving.',
    template: 'ladder',
    groups: {
      daggers: ['g238', 'g304', 'g190', 'g44'],
      claws: ['g306', 'g151', 'g296', 'g81'],
      crit: ['g178', 'g45', 'g152', 'g332'],
    },
    nexus: ['g249'],
    keystones: ['shadeLeech'],
  },
  {
    id: 'veil',
    name: 'The Veil',
    region: 'dexint',
    theme: 'Evasion with energy shield, and the curses that make the dark safer.',
    template: 'ring',
    groups: { evasion: ['g255', 'g218', 'g164'], es: ['g95', 'g94'], hex: ['g210', 'g65'] },
    nexus: [],
    keystones: ['spellslip', 'hollowVessel'],
  },

  // --- dex (Strider) ---------------------------------------------------------------------------------------------------
  {
    id: 'longbowReach',
    name: 'Longbow Reach',
    region: 'dex',
    theme: 'Bows and projectiles, and the elements an arrow can carry.',
    template: 'fork',
    groups: {
      bow: ['g191', 'g353', 'g250', 'g262', 'g275', 'g213'],
      projectile: ['g269', 'g308', 'g42', 'g99'],
      elemental: ['g18', 'g309', 'g88', 'g228'],
    },
    nexus: ['g189'],
    keystones: ['closeQuarters', 'steadyDraw'],
  },
  {
    id: 'windwalk',
    name: 'Windwalk',
    region: 'dex',
    theme: 'Evasion and speed: never where the blow lands.',
    template: 'ring',
    groups: {
      evasion: ['g215', 'g284', 'g79', 'g123', 'g89'],
      speed: ['g290', 'g13', 'g264', 'g162'],
    },
    nexus: ['g15'],
    keystones: ['arrowWeave', 'nimbleGambit'],
  },
  {
    id: 'thornwood',
    name: 'The Thornwood',
    region: 'dex',
    theme: 'Poison and the blades that deliver it, and the critical strike behind them.',
    template: 'fork',
    groups: {
      poison: ['g84', 'g1', 'g36'],
      blades: ['g165', 'g9', 'g321', 'g10', 'g199'],
      crit: ['g158', 'g356'],
    },
    nexus: [],
    keystones: [],
  },
  {
    id: 'parryYard',
    name: 'The Parry Yard',
    region: 'dex',
    theme: 'Block, with a shield or a second weapon.',
    template: 'avenue',
    groups: { block: ['g201', 'g34', 'g63', 'g317'], shield: ['g83', 'g33'] },
    nexus: [],
    keystones: [],
  },
  {
    id: 'moonwell',
    name: 'The Moonwell',
    region: 'dex',
    theme: 'Flasks, life and the mana that keeps a ranger moving.',
    template: 'ladder',
    groups: {
      flask: ['g303', 'g100', 'g220', 'g112', 'g272'],
      mana: ['g239', 'g130', 'g32'],
      life: ['g352', 'g96'],
    },
    nexus: [],
    keystones: [],
  },

  // --- strdex (Reaver) -------------------------------------------------------------------------------------------------
  {
    id: 'bladework',
    name: 'Bladework',
    region: 'strdex',
    theme: 'Swords, axes, maces and heavy two-handers: the melee weapons, each with its own arm.',
    template: 'fork',
    groups: {
      axes: ['g323', 'g136', 'g277'],
      swords: ['g349', 'g310'],
      twoHand: ['g183', 'g54', 'g259', 'g163'],
      maces: ['g128', 'g266'],
    },
    nexus: ['g77'],
    keystones: [],
  },
  {
    id: 'bulwark',
    name: 'The Bulwark',
    region: 'strdex',
    theme: 'Armour and evasion together, the shield and the block.',
    template: 'knot',
    groups: {
      armour: ['g98', 'g252', 'g109', 'g261'],
      shield: ['g311', 'g263', 'g69', 'g232'],
      block: ['g134', 'g176', 'g291'],
    },
    nexus: [],
    keystones: ['platedHide', 'shieldwall'],
  },
  {
    id: 'bloodrun',
    name: 'Bloodrun',
    region: 'strdex',
    theme: 'Leech, bleeding and the charges a fight feeds.',
    template: 'avenue',
    groups: {
      leech: ['g8', 'g206', 'g115'],
      charges: ['g19', 'g120', 'g316', 'g347'],
      bleed: ['g137', 'g320', 'g257'],
    },
    nexus: [],
    keystones: ['woundDance'],
  },
  {
    id: 'standards',
    name: 'The Standards',
    region: 'strdex',
    theme: 'Totems, auras and the line that holds.',
    template: 'ladder',
    groups: { totems: ['g342', 'g2', 'g328', 'g288'], aura: ['g175'], channelling: ['g337'] },
    nexus: [],
    keystones: ['loneVow'],
  },

  // --- str (Vanguard) --------------------------------------------------------------------------------------------------
  {
    id: 'ironhold',
    name: 'Ironhold',
    region: 'str',
    theme: 'Life and armour, and what keeps a fighter standing.',
    template: 'knot',
    groups: {
      life: ['g299', 'g329', 'g127', 'g285', 'g29', 'g280'],
      armour: ['g66', 'g219', 'g58', 'g71', 'g171'],
    },
    nexus: ['g203'],
    keystones: ['bloodRite'],
  },
  {
    id: 'hammerfall',
    name: 'Hammerfall',
    region: 'str',
    theme: 'Two-handers, maces, one-handers and axes: the heavy end of melee, and the stun.',
    template: 'fork',
    groups: {
      twoHand: ['g146', 'g72', 'g184'],
      maces: ['g300', 'g21', 'g87', 'g211'],
      oneHand: ['g185', 'g141'],
      axes: ['g135', 'g20', 'g119', 'g131'],
    },
    nexus: ['g205'],
    keystones: ['unerringDiscipline'],
  },
  {
    id: 'embers',
    name: 'The Embers',
    region: 'str',
    theme: 'Fire, bleeding and the melee critical strike.',
    template: 'ring',
    groups: { fire: ['g12', 'g23'], bleed: ['g305', 'g170'], crit: ['g315', 'g200'] },
    nexus: [],
    keystones: [],
  },
  {
    id: 'cairn',
    name: 'The Cairn',
    region: 'str',
    theme: 'Endurance, shields and the standing stones.',
    template: 'avenue',
    groups: { grit: ['g198', 'g4', 'g160', 'g292'], deploy: ['g339'] },
    nexus: [],
    keystones: ['rootedStance', 'idleHands'],
  },

  // --- strint (Zealot) -------------------------------------------------------------------------------------------------
  {
    id: 'sanctum',
    name: 'The Sanctum',
    region: 'strint',
    theme: 'Auras and curses, and the mana that pays for them.',
    template: 'ring',
    groups: {
      aura: ['g169', 'g196', 'g80'],
      mana: ['g344', 'g270', 'g25', 'g202', 'g235', 'g251'],
    },
    nexus: [],
    keystones: ['sigilWarden'],
  },
  {
    id: 'reliquary',
    name: 'The Reliquary',
    region: 'strint',
    theme: 'Minions that march together, and the hymns that speed them.',
    template: 'avenue',
    groups: {
      minion: ['g147', 'g195', 'g229', 'g186', 'g97', 'g114'],
      hymn: ['g76', 'g258', 'g17'],
    },
    nexus: [],
    keystones: [],
  },
  {
    id: 'pyreAndStorm',
    name: 'Pyre and Storm',
    region: 'strint',
    theme: 'Fire, cold and lightning, spell critical strikes, and the balance between them.',
    template: 'fork',
    groups: {
      fire: ['g125', 'g153', 'g70', 'g233'],
      storm: ['g73', 'g168'],
      spellcraft: ['g293', 'g243', 'g253', 'g159'],
    },
    nexus: ['g172'],
    keystones: ['searingAvatar', 'prismaticBalance'],
  },
  {
    id: 'crozierHall',
    name: 'Crozier Hall',
    region: 'strint',
    theme: 'Staves, maces and sceptres, and the block that goes with them.',
    template: 'ladder',
    groups: {
      staff: ['g346', 'g345', 'g193', 'g273', 'g302'],
      crit: ['g117', 'g209', 'g207'],
      block: ['g103', 'g227'],
    },
    nexus: [],
    keystones: [],
  },
  {
    id: 'cassock',
    name: 'The Cassock',
    region: 'strint',
    theme: 'Armour, energy shield and life in one robe.',
    template: 'avenue',
    groups: {
      armour: ['g140', 'g108', 'g142', 'g188'],
      life: ['g216', 'g351', 'g313', 'g106'],
    },
    nexus: [],
    keystones: ['livingWard'],
  },
];

/** The district a cluster belongs to, if it belongs to one. */
export function districtOf(clusterId: string): District | undefined {
  return DISTRICTS.find(
    (d) =>
      d.nexus.includes(clusterId) || Object.values(d.groups).some((g) => g.includes(clusterId)),
  );
}
