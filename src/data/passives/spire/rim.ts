/**
 * The Eaves: the Mystic's north-east rim road (phase G2 of docs/tree/design/G-growth.md, laid 2026-10-22 from
 * docs/tree/design/G1/mystic.md §3 and the joined brief G1-brief.md §2.1). Five intelligence nodes from the road node
 * between Shatter and Harsh Weather, up under the rim and down to the Shade's Rooftops: the top of the Spire gets an
 * outer road with clusters coming off it all along (Long Chant, the far spell cluster, Pinpoint, the crit wand, and Bad
 * Company, the hexing summoner, all G3 round 3; Snare Line, a bridge since G2) and a dear crossing to the Rooftops at its
 * foot (written by the border pass).
 * The north-west rim road is the Lantern's (`fire.ts`); the two are joined across the top by the road through Shatter.
 * The export keeps the name `parapet` that index.ts imports.
 */
import {
  castSpeed,
  curseEffect,
  dex,
  int,
  manaRegen,
  minionDamage,
  spellDamage,
  wandAttack,
  weaponCrit,
  weaponCritMulti,
} from '../lines';
import type { AreaSpec } from '../types';

export const parapet: AreaSpec = {
  id: 'spire.rim',
  region: 'mystic',
  name: 'The Eaves',
  why: "The Spire's north-east rim, under the eaves of the Rooftops next door: an outer road for the casters' far clusters and the Shade's way in from the roofs.",
  at: [1720, -4430], // Where the area's name is drawn: outside the road, in the empty corner under the rim, clear of every node.
  clusters: [
    {
      id: 'road',
      name: 'The eaves road',
      why: "Intelligence five times, in three straight runs that turn at junctions: up from Harsh Weather's road node to the rim, along it, and down to the Rooftops. No stretch goes more than two nodes without something off it: Long Chant between r1 and r2, Snare Line at r3, Pinpoint at r4, Bad Company and the Rooftops at r5.",
      at: [1233, -4454],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'r1',
          kind: 'attribute',
          lines: [int(7)],
          at: [519, -4234],
          why: "On the straight run from Harsh Weather's road node to r2. Long Chant (G3 round 3, G1/mystic.md MY-3) hangs here and at r2, outward, as a pocket bridging the two.",
        },
        {
          id: 'r2',
          kind: 'attribute',
          lines: [int(7)],
          at: [850, -4470],
          why: "The corner where the road meets the rim and turns east, and the far end of Long Chant's pocket: a junction, so the turn is here.",
        },
        {
          id: 'r3',
          kind: 'attribute',
          lines: [int(7)],
          at: [1233, -4454],
          why: "The north-east corner, on the line of Snare Line's chain so the chain runs straight onto it.",
        },
        {
          id: 'r4',
          kind: 'attribute',
          lines: [int(7)],
          at: [1592, -4177],
          why: 'Halfway down the run to the Rooftops. Pinpoint, the crit wand (G3 round 3, G1/mystic.md MY-6), hangs here, bridged to Overcharge.',
        },
        {
          id: 'r5',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [2080, -3900],
          why: "The last node before the Shade, so half dexterity, and the corner where the eaves road drops onto the Rooftops' ridge road beside Black Powder. Nudged east in the border pass (G2, 2026-10-22) so the run from r4 stays straight (8°) and the ridge node takes it as a clean T (75° and 120° from its two road links); on the straight line from r4 it would have met the ridge 31° from Black Powder's link. The turn is here, at the corner between two roads. Bad Company's ring (G3 round 3) hangs off the corner's inner side.",
        },
      ],
      links: [
        ['r1', 'r2'],
        ['r2', 'r3'],
        ['r3', 'r4'],
        ['r4', 'r5'],
      ],
    },
    {
      id: 'longChant',
      name: 'Long Chant',
      why: "Spell damage with mana regeneration, on three cast speed smalls (G3 round 3, 2026-10-22; G1/mystic.md MY-3, the ledger's cast speed section MY-s5 folded in): the far spell cluster, for the caster who casts all fight long, the channeller among them. Spell damage's partners by direction: cast speed (Arcane Focus), crit (Keen Verse), life (Living Verse), penetration (Piercing Word), and here the sustain to keep casting. A V pocket outward of the eaves road's first run, the notable at the tip, in the empty top between Fever Pitch's spur and the corner: a caster on the road pays two cast speed smalls from r1 or one from r2, and walking the road costs none of it. Not beside Steady Stream (channelling with cheaper mana would make the top left a one-stop for the channeller), and seven steps past Piercing Word through Harsh Weather and the road.",
      at: [475, -4645],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [castSpeed(4)],
          at: [488, -4521],
          why: 'The entrance from r1, on the straight line from r1 to the notable.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [castSpeed(4)],
          at: [482, -4575],
          why: 'Beside the notable, on the same leg.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Long Chant',
          lines: [spellDamage(20), manaRegen(15)],
          at: [475, -4645],
          why: '2.5 + 1.5 units. The tip of the V, where the two legs meet.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [castSpeed(4)],
          at: [538, -4615],
          why: 'The exit to r2, on the straight line from the notable.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
      ],
    },
    {
      id: 'pinpoint',
      name: 'Pinpoint',
      why: "Wand attacks with crit chance and crit multiplier with wands (G3 round 3, 2026-10-22; G1/mystic.md MY-6): the crit wand, the fourth wand-attack cluster, each with its own partner and direction (accuracy at home, speed on the Scriptorium (Wand Volley), elements in the Lantern (Bright Wand), crit here). East and up is the Mystic's crit side. A bridge from Overcharge's east small to the eaves road: the wand attacker coming up the Gallery pays the shock ring's smalls to reach it, and an intelligence-and-dexterity Shade from the Rooftops comes down the eaves road. A V with the bend at the notable, so it reaches r4 near the even fan of its three links and leaves Overcharge's ring from its outer side.",
      at: [1359, -3944],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [wandAttack(12)],
          at: [1235, -3928],
          why: "The entrance from Overcharge's east small, on the straight line to the notable.",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [wandAttack(12)],
          at: [1290, -3935],
          why: 'Beside the notable, on the same leg.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Pinpoint',
          lines: [wandAttack(20), weaponCrit('wand', 20), weaponCritMulti('wand', 12)],
          at: [1359, -3944],
          why: '1.67 + 1.33 + 1 units.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [wandAttack(12)],
          at: [1408, -3993],
          why: 'The exit to r4, on the straight line from the notable (the rim road lands on a small, not the notable).',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
      ],
    },
    {
      id: 'badCompany',
      name: 'Bad Company',
      why: "Minion damage with curse effect (G3 round 3, 2026-10-22; G1/mystic.md MY-7): the hexing summoner, whose minions hit what its curses weaken. The Spire's second minion cluster, with a different partner from Familiars (minion life, west) and in the other direction from every other minion cluster a Mystic summoner reaches (Familiars and Volatile Servants north-west, the Zealot's Shepherd, Sexton and Ossuary west): a summoner picks the west's minions or this corner's, and taking both costs a crossing of the whole top. It sits by the Shade's door, a few steps above the Shade's curses (Ill Wish on the Rooftops, Second Curse further in), where the curse class and the summon class meet. The brief put it on the north-west rim road; laid there first, it made the north-west a summoner's one-stop (Familiars, it, High Veil's shield, Volatile Servants and Tomb Dust, all taken by 120 points). A four-node ring pocket off the corner over the Rooftops, its entrance facing the corner, the notable on the far side: a dead end on purpose (CONSTRAINTS §13.5, a far tip), since the corner has no second way in that is not a link across the border.",
      at: [1894, -3812],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [minionDamage(12)],
          at: [1945, -3836],
          why: 'The entrance, facing the corner.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [minionDamage(12)],
          at: [1918, -3761],
          why: 'A side of the ring.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Bad Company',
          lines: [minionDamage(24), curseEffect(16)],
          at: [1843, -3788],
          why: '2 + 2 units. The far side of the ring.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [minionDamage(12)],
          at: [1870, -3863],
          why: 'The other side of the ring.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
        ['c', 'a'],
      ],
    },
  ],
  links: [
    {
      from: 'road.r5',
      to: 'badCompany.a',
      why: "The corner over the Rooftops onto Bad Company's ring, inward, bisecting the corner's free side (about 55° from each road link).",
    },
    {
      from: 'spire.frost.toHarsh.a',
      to: 'road.r1',
      why: "The road node between Shatter and Harsh Weather onto the eaves road: the top of the Spire's two rim roads meet across it, through Shatter.",
    },
    {
      from: 'spire.frost.snare.n',
      to: 'road.r3',
      why: "Snare Line onto the eaves road: a dead-end pocket until G2, now a bridge from Harsh Weather's climb to the rim (G1/mystic.md §4).",
    },
    {
      from: 'road.r1',
      to: 'longChant.a',
      why: "The eaves road's first run onto Long Chant's longer leg, square-ish to the road (about 60° either side of the notable's line).",
    },
    {
      from: 'longChant.c',
      to: 'road.r2',
      why: "Long Chant's short leg onto the corner: the pocket is a bridge, two ways in, and the corner becomes a junction.",
    },
    {
      from: 'spire.storm.overcharge.c',
      to: 'pinpoint.a',
      why: "Overcharge's east small (the ring's outer side) onto the crit wand: the Gallery's way up to the eaves road that is not Harsh Weather's climb.",
    },
    {
      from: 'pinpoint.c',
      to: 'road.r4',
      why: "Pinpoint onto the eaves road at r4, arriving at r4 between its two road links (83° from r3's, 105° from r5's) rather than 31° off the even fan the straight line from Overcharge would give.",
    },
    {
      from: 'road.r5',
      to: 'knife.roofs.ridge.y1',
      why: "The Rooftops road (a dear crossing; G1-brief.md §2.1, laid in the G2 border pass): the eaves road comes down onto the Shade's ridge road one step from Black Powder. Traps and mines (Snare Line, Black Powder), cold (Shatter, Sleet) and the crit wand for an intelligence-and-dexterity Shade; the Mystic's trapper and the far casters reach the Rooftops. Far from both starts (about 20 to 25 steps), so it is a late build's road, not a shortcut.",
    },
  ],
};
