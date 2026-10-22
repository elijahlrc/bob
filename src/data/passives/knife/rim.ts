/**
 * The Seawall (phase G2 of docs/tree/design/G-growth.md, 2026-10-22): the Knife's east rim road, from the Rooftops'
 * fifth node straight out to the rim and then down the east edge toward the Strider's outer road. The Knife's inside
 * holds room for about eight of its fifteen new clusters (G1/shade.md §5); the rest hang off this road, which stays
 * inside the map's circle. Sleet and Whetted Will (the Rooftops' two east pockets) become bridges onto it.
 */
import {
  attackSpeed,
  curseEffect,
  reducedReservation,
  dex,
  dodgeAttack,
  dualDamage,
  insightOnCrit,
  int,
  poisonDamage,
  poisonFaster,
  spellCrit,
} from '../lines';
import type { AreaSpec } from '../types';

export const seawall: AreaSpec = {
  id: 'knife.rim',
  region: 'shade',
  name: 'The Seawall',
  why: "The Knife's east rim road: the far east of the region, where the Rooftops end and the Strider's outer road begins. One road from the Rooftops to the Fosse, for the late Shade and for the bow builds coming north.",
  at: [3950, -1850], // Where the area's name is drawn: over the road's first legs, clear of Sleet, Whetted Will and the Rooftops' name.
  clusters: [
    {
      id: 'wall',
      name: 'The seawall road',
      why: "Six attribute nodes: one leg straight out from the rooftop road, then a gentle arc down the east rim. Every node has something off it (G1/shade.md §3.1): Glint (spell crit) at the first, the curse pocket (Long Grudge) at the second, Sleet at the third, Whetted Will and the two-knife dodge rung (Feint and Cut) at the fourth, the cold-and-crit rung and the poison pocket (Rat Bite) at the fifth, the life-and-dodge rung and the Strider's outer road at the sixth (G3 round 3).",
      at: [4100, -1100],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 's1',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [3760, -2148],
          why: 'The corner: straight out from the rooftop road, then south along the rim. The spell crit pocket (Glint, G3) leaves straight out to the rim here, square to the road.',
        },
        {
          id: 's2',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [3990, -1830],
          why: 'The curse pocket (Long Grudge) leaves straight out to the rim, square to the road (G3 round 3).',
        },
        {
          id: 's3',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [4150, -1500],
          why: 'Sleet arrives from the rooftop road.',
        },
        {
          id: 's4',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [4250, -1050],
          why: 'Whetted Will arrives from the rooftop road, and the two-knife dodge rung (Feint and Cut) from its eighth node.',
        },
        {
          id: 's5',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [4250, -600],
          why: 'A cross: the road north and south, the cold-and-crit rung from Tumble west, the poison pocket (Rat Bite) east to the rim.',
        },
        {
          id: 's6',
          kind: 'attribute',
          lines: [dex(6), int(6)],
          at: [4100, -150],
          why: "The south end: the life-and-dodge rung from Veiled Herald lands here (G3 round 3), and the Strider's outer road begins one link on (its first junction, the border pass's link).",
        },
      ],
      links: [
        ['s1', 's2'],
        ['s2', 's3'],
        ['s3', 's4'],
        ['s4', 's5'],
        ['s5', 's6'],
      ],
    },
    {
      id: 'glint',
      name: 'Glint',
      why: "Spell crit with insight (G3 round 1, 2026-10-22; the ledger's SH-3): a pocket straight out from the seawall road's corner toward the rim, spell crit three times, then spell crit with insight charges on a crit. Insight comes on crits, so the pair belongs. Insight's second home, seventeen steps from the Spire's Flashes of Insight; the Shade's other spell crit is Athame's, with a dagger, in the Knife's middle. A dead end, square to the road, so the corner becomes a clean junction; the road's second node stays a plain step on the way to Sleet's bridge (the brief had the cluster bridging the first two nodes, which would have left both at 45° to the road).",
      at: [3812, -2393],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [spellCrit(15)],
          at: [3775, -2217],
          why: 'The entrance, from the corner.',
        },
        { id: 'b', kind: 'small', lines: [spellCrit(15)], at: [3786, -2271] },
        { id: 'c', kind: 'small', lines: [spellCrit(15)], at: [3797, -2325] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Glint',
          lines: [spellCrit(30), insightOnCrit(20)],
          at: [3812, -2393],
          why: '2 + 2 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'n'],
      ],
    },
    {
      id: 'feint',
      name: 'Feint and Cut',
      why: "Damage while dual wielding with the chance to dodge attacks (G3 round 3, 2026-10-22; the ledger's SH-9): the top rung of the Docks' east, a bridge from the rooftop road's eighth node across to the seawall road's fourth. Dual wield twice on the rooftop side, the notable, attack dodge twice on the seawall side. The Shade starts with two knives, and dual wield had no Shade cluster but Fine Point's crit line by the start; this is the two-knife dodger's (the Yard's Twin Fangs and Crossed Blades and the Wall's Two Fists are far away). Not by Nimble Gambit near the start, where it would sit two steps from Fine Point's crit while dual wielding, the dual dagger build's one stop (G1/shade.md §1.2), nor between Quiet Shot and the rooftop road, where the brief had it: that ground went to the cursed-spell cluster, which the Shade's casters walk past. Here it is the south-east, nine steps round from Tumble (dodge with stun avoidance) and farther from Sea Legs (dodge with life). The Docks' east is a ladder of three rungs between the rooftop road and the seawall (this, the cold-and-crit rung from Tumble, the life-and-dodge rung from Veiled Herald), offence and defence mixed (CONSTRAINTS §4.8). The notable is the corner where the two sections meet: it bends so the dodge side arrives at the seawall node square between Whetted Will's link and the road south.",
      at: [3957, -867],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'w2',
          kind: 'small',
          lines: [dualDamage(10)],
          at: [3836, -899],
          why: 'The entrance, from the rooftop road.',
        },
        { id: 'w1', kind: 'small', lines: [dualDamage(10)], at: [3889, -885] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Feint and Cut',
          lines: [dualDamage(20), dodgeAttack(6)],
          at: [3957, -867],
          why: '2 + 2 units: one knife draws the blow, the other answers it.',
        },
        { id: 'g1', kind: 'small', lines: [dodgeAttack(3)], at: [4017, -904] },
        {
          id: 'g2',
          kind: 'small',
          lines: [dodgeAttack(3)],
          at: [4063, -933],
          why: 'The exit, to the seawall road.',
        },
      ],
      links: [
        ['w2', 'w1'],
        ['w1', 'n'],
        ['n', 'g1'],
        ['g1', 'g2'],
      ],
    },
    {
      id: 'grudge',
      name: 'Long Grudge',
      why: "Curse effect with reduced mana reservation (G3 round 3, 2026-10-22; beyond the brief, for CONSTRAINTS §1.1: with Salt in the Wound in, the curser still took every curse cluster it could reach by point 60 and 40 more points at 120 added nothing to its curses): a pocket straight out from the seawall road's second node to the rim, curse effect twice, then the notable with curse effect and reduced reservation, for the hexer who keeps a curse up as an aura. The curser's far curse supply, in the one direction its curses did not go: Second Curse and the Spire's Hexwright are north, Ill Wish north-east, Salt in the Wound in the middle east, this the east rim, about twenty-four steps out, where a curser gives up the Mystic's shield and spells to come. Its partner is one the curser does not want for itself (reservation is the aura builder's), so it pays half a notable for the curse. It also gives the seawall road's second node, a plain step since G2, something to branch to (§7.3).",
      at: [4157, -1930],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [curseEffect(8)],
          at: [4050, -1866],
          why: 'The entrance, from the seawall road.',
        },
        { id: 'b', kind: 'small', lines: [curseEffect(8)], at: [4097, -1894] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Long Grudge',
          lines: [curseEffect(16), reducedReservation(6)],
          at: [4157, -1930],
          why: '2 + 2 units: a curse held for as long as the grudge is.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'rot',
      name: 'Rat Bite',
      why: "Poison with attack speed (G3 round 3, 2026-10-22; the ledger's SH-7): a pocket straight out from the seawall road's fifth node to the rim, poisons faster three times, then the notable with poison damage and attack speed. The poison specialist's far tip: Barbed Point (poison with crit) is in the Rookery twelve steps from the start, Smeared Edge (poison with a dagger) on the Docks' south road, Carrion Claws (claws against the poisoned) the far north-east, the Strider's Venom Fletching (chaos arrows) south; this one is the far south-east, about twenty-four steps out, where the poison claw gives up the north-east's Carrion Claws to come. A dead end on purpose, square to the road, so the fifth node becomes a cross (the road north and south, the cold-and-crit rung west, this east); the brief's bridge between the fourth and fifth nodes would have left both at about 45° to the road (Glint's case in round 1).",
      at: [4497, -561],
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [poisonFaster(10)],
          at: [4319, -589],
          why: 'The entrance, from the seawall road.',
        },
        { id: 'b', kind: 'small', lines: [poisonFaster(10)], at: [4373, -580] },
        { id: 'c', kind: 'small', lines: [poisonFaster(10)], at: [4428, -572] },
        {
          id: 'n',
          kind: 'notable',
          name: 'Rat Bite',
          lines: [poisonDamage(20), attackSpeed(10)],
          at: [4497, -561],
          why: '1.7 + 2 units: small, quick bites that rot.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'n'],
      ],
    },
  ],
  links: [
    {
      from: 'knife.roofs.walk.r8',
      to: 'feint.w2',
      why: "The rooftop road's eighth node east onto the two-knife dodge rung (G3 round 3): the node becomes a junction of four, the rung leaving between the road north and the road south.",
    },
    {
      from: 'feint.g2',
      to: 'wall.s4',
      why: "The rung lands on the seawall road's fourth node, square between Whetted Will's link and the road south.",
    },
    {
      from: 'wall.s2',
      to: 'grudge.a',
      why: "The seawall road's second node onto the curse pocket, straight out to the rim (G3 round 3).",
    },
    {
      from: 'wall.s5',
      to: 'rot.a',
      why: "The seawall road's fifth node onto the poison pocket, straight out to the rim (G3 round 3).",
    },
    {
      from: 'wall.s1',
      to: 'glint.a',
      why: "The seawall road's corner onto the spell crit pocket, outward to the rim (G3).",
    },
    {
      from: 'knife.roofs.walk.r5',
      to: 'wall.s1',
      why: "The rooftop road's fifth node, which had nothing off it, onto the seawall road: straight out to the rim.",
    },
    {
      from: 'knife.roofs.sleet.n',
      to: 'wall.s3',
      why: 'Sleet becomes a bridge between the rooftop road and the seawall road (G1/shade.md §3.1).',
    },
    {
      from: 'knife.roofs.whet.n',
      to: 'wall.s4',
      why: 'Whetted Will becomes a bridge between the rooftop road and the seawall road (G1/shade.md §3.1).',
    },
    {
      from: 'wall.s6',
      to: 'bow.rim.road.j1',
      why: "The east rim highway (a dear crossing; G1-brief.md §2.6, laid in the G2 border pass): the seawall road runs on into the Strider's outer road, one rim road from the Rooftops to the Fosse. Bows reach Quiet Shot and the Shade's far east; the Shade reaches the Strider's outer road. Both ends turn here (27° and 40°), and both become junctions in G3, where the life-and-dodge cluster (SH-10) and the life-and-resistances cluster (ST-9) hang.",
    },
  ],
};
