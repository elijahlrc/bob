/**
 * Passive tree spec (DESIGN.md §9.2), authored at the cluster level. Each region lists its
 * themes, keystones and notable names; `buildClusterSpecs` places clusters on a polar layout
 * of our own design and links them. `build.ts` turns clusters into nodes and travel paths.
 */

export type RegionId = 'str' | 'strdex' | 'dex' | 'dexint' | 'int' | 'strint';
export type Attr = 'str' | 'dex' | 'int';
export type ClusterKind = 'wheel' | 'chain' | 'spur' | 'keystone';

export type RegionDef = {
  id: RegionId;
  classId: string;
  /** Centre angle of the region's sector, degrees (0 = right, 90 = down). */
  angle: number;
  attrs: Attr[];
  themes: string[];
  keystones: string[];
  notables: string[];
};

export type ClusterSpec = {
  id: string;
  region: RegionId | 'hub';
  /** Polar centre: radius (layout units) and angle (degrees). */
  r: number;
  a: number;
  kind: ClusterKind;
  theme: string;
  smallCount: number;
  notable?: { name: string; strength: number };
  keystone?: string;
  links: string[];
  attrs: Attr[];
};

export const REGIONS: RegionDef[] = [
  {
    id: 'int',
    classId: 'mystic',
    angle: -90,
    attrs: ['int'],
    themes: ['spell', 'es', 'mana', 'castSpeed', 'elemental', 'wand', 'reservation', 'esRecharge'],
    keystones: ['mindBulwark', 'manaBastion', 'overload'],
    notables: [
      'Candlewick Mind',
      'Inkwell of Stars',
      'Cold Library',
      'Starlit Lattice',
      'Sigil Weaver',
      'Lantern Saint',
      'Wellspring of Ash',
      'Ember Syntax',
      'Reliquary Halo',
      'Quicksilver Tongue',
      'Glyph and Gutter',
      'Thousand Margins',
      'Aether Lung',
      'Vellum Skin',
      'Whispering Chalk',
      'Moth to Flame',
      'Prism Scholar',
      'Stillwater Focus',
      'Echoing Vault',
      'Hush of Embers',
      'Owl-Eyed Vigil',
      'Silver Thread Ward',
      'Lamplighter',
      'Scriptorium',
    ],
  },
  {
    id: 'dexint',
    classId: 'shade',
    angle: -30,
    attrs: ['dex', 'int'],
    themes: [
      'dagger',
      'claw',
      'poison',
      'critChance',
      'critMulti',
      'esEvasion',
      'chaos',
      'lifeOnHit',
    ],
    keystones: ['cruelAgony', 'shadeLeech', 'hollowVessel'],
    notables: [
      'Nightshade Kiss',
      'Needle and Thread',
      'Witherbloom',
      'Glass Fang',
      'Cutthroat Arithmetic',
      'Moonless Edge',
      'Venom Ledger',
      'Silent Tally',
      'Black Orchid Tea',
      'Mirrorshade Veil',
      'Gutter Saint',
      "Spider's Patience",
      'Ratcatcher',
      'Rust in the Wound',
      'Ichor Drip',
      'Velvet Garrote',
      'Fading Silhouette',
      'Bitter Almond',
      'Sharp Intent',
      'Grave Dust Tincture',
      'Coil and Strike',
      'Pale Hand',
      'Smoke Mantle',
      'Hemlock Waltz',
    ],
  },
  {
    id: 'dex',
    classId: 'strider',
    angle: 30,
    attrs: ['dex'],
    themes: [
      'bow',
      'projectile',
      'evasion',
      'moveSpeed',
      'bowCrit',
      'flaskEffect',
      'projSpeed',
      'flaskCharges',
    ],
    keystones: ['closeQuarters', 'arrowWeave', 'steadyDraw'],
    notables: [
      "Fletcher's Patience",
      'Windborne Shafts',
      'Gloaming Step',
      'Mothwing Dodge',
      'Hawk Under Moon',
      'Quiver of Teeth',
      'Taut Sinew',
      'Distant Thunder',
      "Wayfarer's Draught",
      'Brimming Gourd',
      'Long Shadow Stride',
      'Whistling Shot',
      'Feather and Flint',
      'Scattered Starlings',
      'Ghostlight Aim',
      'Thistledown Feet',
      "Hunter's Moon Vigil",
      'Skipping Stone',
      'Dust Devil',
      'Copse Runner',
      'Bramble Hide',
      'Hollow Reed Volley',
      "Plover's Feint",
      'Cork and Ember',
    ],
  },
  {
    id: 'strdex',
    classId: 'reaver',
    angle: 90,
    attrs: ['str', 'dex'],
    themes: [
      'sword',
      'axe',
      'attackSpeed',
      'block',
      'bleed',
      'dualWield',
      'accuracy',
      'lifeLeech',
      'stunAvoid',
    ],
    keystones: ['platedHide', 'woundDance', 'shieldwall'],
    notables: [
      'Twin Fangs of Ash',
      'Riposte of Bone',
      'Hacksaw Grin',
      'Crimson Notch',
      'Lacquered Buckler',
      'Red Ledger',
      'Edge Whisperer',
      'Splinterguard',
      'Feint and Fall',
      'Hilt and Hollow',
      "Woodsman's Ire",
      'Gash Merchant',
      'Swaying Reed',
      'Nimble Ribs',
      'Steelsong',
      'Parry the Grave',
      'Wolfsbane Edge',
      'Ledger of Cuts',
      "Butcher's Rhythm",
      'Spurred Heel',
      'Bloodlatch',
      'Notched Tally',
      'Sure Footing',
      'Brass Knuckle Pact',
    ],
  },
  {
    id: 'str',
    classId: 'vanguard',
    angle: 150,
    attrs: ['str'],
    themes: [
      'lifePct',
      'armour',
      'twoHand',
      'mace',
      'lifeRegen',
      'meleePhys',
      'physReduction',
      'stunThreshold',
      'stunDuration',
    ],
    keystones: ['bloodRite', 'unerringDiscipline', 'rootedStance'],
    notables: [
      'Barrowheart',
      'Cairnstone Hide',
      'Marrowsteel Grip',
      'Kneecap Breaker',
      'Gravebound Vigor',
      'Ossified Will',
      'Ironbone Plating',
      'Unbowed Spine',
      'Rattled Skull',
      "Tombwarden's Bulk",
      'Hammerfall Rite',
      'Slagblood',
      'Anvil Chest',
      'Mausoleum Wall',
      'Thudding Cadence',
      'Cracked Earth',
      'Shattering Swing',
      'Bonemeal Feast',
      'Sepulchre Stance',
      'Hearthstone Lungs',
      'Grinding Molars',
      'Bellows Breath',
      "Quarryman's Back",
      'Knuckles of the Barrow',
    ],
  },
  {
    id: 'strint',
    classId: 'zealot',
    angle: 210,
    attrs: ['str', 'int'],
    themes: [
      'sceptre',
      'staff',
      'eleRes',
      'auraEffect',
      'ignite',
      'armourEs',
      'maxRes',
      'fireDamage',
    ],
    keystones: ['searingAvatar', 'prismaticBalance', 'livingWard'],
    notables: [
      'Censer Bearer',
      'Hymn of Cinders',
      'Bellringer',
      'Gilded Rebuke',
      'Pyre Psalm',
      'Vestment of Wardings',
      'Choir of Ash',
      'Crozier Guard',
      'Absolution Flame',
      "Saint's Ballast",
      'Votive Kindling',
      'Tolling Rite',
      'Hallowed Brazier',
      "Pilgrim's Plate",
      'Litany of Shields',
      'Cathedral Bones',
      'Sunken Chapel',
      'Reliquary Knight',
      "Martyr's Spark",
      'Font of Rebuke',
      'Ossuary Choir',
      'Catechism of Iron',
      'Incense Smoke',
      'Vigil Lantern',
    ],
  },
];

export const HUB = {
  themes: ['allAttr', 'hubLife', 'hubDamage', 'ailmentEffect', 'hubFlask', 'hubCast', 'hubMana'],
  notables: [
    'Crossroads Bones',
    "Pilgrim's Rest",
    'Compass of Marrow',
    "Wanderer's Tithe",
    'Common Grave',
    'Hollow Heart',
    'Shared Sorrow',
  ],
  keystones: ['crimsonPact', 'painConduit', 'strongarm'],
};

/** Layout constants. */
export const START_RADIUS = 800;
export const HUB_RADIUS = 420;
export const RING_RADII = [1150, 1450, 1750, 2050, 2350, 2650];
export const RING_SLOTS = [2, 3, 4, 5, 5, 6];
/** Keystone slots per region: [ring, slot]. */
export const KEYSTONE_SLOTS: [number, number][] = [
  [2, 0],
  [3, 4],
  [5, 2],
];
const SECTOR = 60;
const SPREAD = 0.84;

const SMALLS: Record<ClusterKind, number> = { wheel: 7, chain: 5, spur: 4, keystone: 2 };

function slotAngle(region: RegionDef, ring: number, slot: number): number {
  const n = RING_SLOTS[ring];
  const step = (SECTOR * SPREAD) / n;
  // Stagger alternate rings by a quarter step so links don't line up radially.
  const stagger = ring % 2 ? step * 0.25 : -step * 0.25;
  return region.angle + (slot - (n - 1) / 2) * step + stagger;
}

/** Generate the cluster list (deterministic). */
export function buildClusterSpecs(): ClusterSpec[] {
  const out: ClusterSpec[] = [];
  const kinds: ClusterKind[] = ['wheel', 'chain', 'spur', 'chain', 'wheel', 'spur'];
  // Hub: a centre wheel and one cluster per region between the start and the centre.
  out.push({
    id: 'hub_c',
    region: 'hub',
    r: 0,
    a: 0,
    kind: 'wheel',
    theme: HUB.themes[0],
    smallCount: SMALLS.wheel,
    notable: { name: HUB.notables[0], strength: 1 },
    links: [],
    attrs: ['str', 'dex', 'int'],
  });
  REGIONS.forEach((reg, i) => {
    out.push({
      id: `hub_${reg.id}`,
      region: 'hub',
      r: HUB_RADIUS,
      a: reg.angle,
      kind: 'chain',
      theme: HUB.themes[1 + (i % (HUB.themes.length - 1))],
      smallCount: 4,
      notable: { name: HUB.notables[1 + i], strength: 1 },
      links: ['hub_c', `start_${reg.id}`],
      attrs: reg.attrs,
    });
  });
  // Hub keystones sit between hub clusters, at alternate region boundaries.
  HUB.keystones.forEach((k, i) => {
    const reg = REGIONS[i * 2];
    out.push({
      id: `hubks_${i}`,
      region: 'hub',
      r: 640,
      a: reg.angle + 30,
      kind: 'keystone',
      theme: 'allAttr',
      smallCount: SMALLS.keystone,
      keystone: k,
      links: [`hub_${reg.id}`],
      attrs: reg.attrs,
    });
  });
  for (const reg of REGIONS) {
    let notableIdx = 0;
    let themeIdx = 0;
    let kindIdx = 0;
    let ksIdx = 0;
    for (let ring = 0; ring < RING_RADII.length; ring++) {
      for (let slot = 0; slot < RING_SLOTS[ring]; slot++) {
        const id = `${reg.id}_${ring}_${slot}`;
        const isKs = KEYSTONE_SLOTS.some(([kr, ks]) => kr === ring && ks === slot);
        const a = slotAngle(reg, ring, slot);
        // Inward link: nearest non-keystone slot on the previous ring (or the class start).
        const links: string[] = [];
        if (ring === 0) links.push(`start_${reg.id}`);
        else {
          let best = -1;
          let bd = Infinity;
          for (let j = 0; j < RING_SLOTS[ring - 1]; j++) {
            if (KEYSTONE_SLOTS.some(([kr, ks]) => kr === ring - 1 && ks === j)) continue;
            const d = Math.abs(slotAngle(reg, ring - 1, j) - a);
            if (d < bd) {
              bd = d;
              best = j;
            }
          }
          links.push(`${reg.id}_${ring - 1}_${best}`);
        }
        if (isKs) {
          out.push({
            id,
            region: reg.id,
            r: RING_RADII[ring],
            a,
            kind: 'keystone',
            theme: reg.themes[0],
            smallCount: SMALLS.keystone,
            keystone: reg.keystones[ksIdx++],
            links,
            attrs: reg.attrs,
          });
          continue;
        }
        // Same-ring neighbour links on alternating pairs (skipping keystones).
        const next = slot + 1;
        if (
          next < RING_SLOTS[ring] &&
          (ring + slot) % 2 === 0 &&
          !KEYSTONE_SLOTS.some(([kr, ks]) => kr === ring && ks === next)
        )
          links.push(`${reg.id}_${ring}_${next}`);
        const kind = kinds[kindIdx++ % kinds.length];
        out.push({
          id,
          region: reg.id,
          r: RING_RADII[ring],
          a,
          kind,
          theme: reg.themes[themeIdx++ % reg.themes.length],
          smallCount: SMALLS[kind],
          notable: {
            name: reg.notables[notableIdx++],
            strength: ring === RING_RADII.length - 1 ? 1.5 : 1,
          },
          links,
          attrs: reg.attrs,
        });
      }
    }
  }
  // Cross-region links at sector boundaries on odd rings: last slot of a region ↔ first of the next.
  REGIONS.forEach((reg, i) => {
    const nextReg = REGIONS[(i + 1) % REGIONS.length];
    for (const ring of [1, 3, 5]) {
      const last = RING_SLOTS[ring] - 1;
      const a = out.find((c) => c.id === `${reg.id}_${ring}_${last}`);
      const bId = `${nextReg.id}_${ring}_0`;
      const b = out.find((c) => c.id === bId);
      if (a && b && a.kind !== 'keystone' && b.kind !== 'keystone') a.links.push(bId);
    }
  });
  return out;
}
