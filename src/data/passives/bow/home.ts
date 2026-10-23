/**
 * The Bow's home: the Strider's first points, written from the player's seat.
 *
 * The reference's dexterity start, read as a walk (reference/tree/ref-tree.json): the start touches two +10 dexterity
 * nodes, each one step from a bare dexterity hub of degree five to seven; the first notable (frenzy charges) sits on a
 * loop between the two hubs; the hubs' other exits are three-node pockets (accuracy and attack speed, crit, evasion and
 * resistances, life), the bow road and the centre. Nothing within three steps names a weapon: the first notables are
 * about attacks, not bows, because a dexterity character may be a bow, a dagger or a sword.
 *
 * So here: the start touches two dexterity hubs, north (toward the Shade) and south (toward the Reaver). The first point
 * is a side, not a stat; the second is a real pick from four or five things; the third can be the signature, a pocket's
 * second node, or a road. Nothing in the home is about bows or projectiles: the Strider's skills are bows, dexterity
 * blades, thrown steel, traps and totems, and the home serves them all. The signature is the attacker's notable (attack
 * damage, attack speed, dexterity) on the loop between the hubs, outward of the start, and the way onto the
 * string. Each hub has one pocket here (life north, crit south, since the user's editor pass), drawn as a tight orbit beside the hub as the reference
 * draws its pockets; the other pockets of the first ten points hang off the roads, so that a hub is a crossroads and not
 * a bouquet.
 */
import {
  attackDamage,
  attackSpeed,
  critChance,
  critMulti,
  dex,
  evasion,
  life,
  lifeRegen,
  mana,
  reducedReservation,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const START = {
  classId: 'strider',
  region: 'strider' as const,
  id: 'start.strider',
  at: [866, 500] as [number, number],
};

export const home: AreaSpec = {
  id: 'bow.home',
  region: 'strider',
  name: 'The Bow Gate',
  why: 'Two hubs flanking the start, the signature loop between them, one pocket per hub, and the three roads out: the bows (north), the string (east), the physical end (south).',
  at: [1099, 360], // Where the area's name is drawn: clear of every other area's name (label pass, round 4).
  clusters: [
    {
      id: 'hubs',
      name: 'The hubs',
      why: 'The two dexterity hubs the start touches. North leads to the bows, Long Breath and the ring toward the Shade (the link to Hedge Magic went in G4 fix 2: one pocket per hub); south to the physical end, Vital Aim, Wayfarer and the ring toward the Reaver. Point one is a side.',
      at: P(8, 58),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n',
          kind: 'attribute',
          lines: [dex(20)],
          at: P(60, -200),
          why: 'The north hub: four ways out (the start side, the ring, the bows road, Long Breath).',
        },
        {
          id: 's',
          kind: 'attribute',
          lines: [dex(20)],
          at: P(-45, 315),
          why: 'The south hub: five ways out.',
        },
      ],
      links: [],
    },
    {
      id: 'sig',
      name: "Hawk's Eye",
      why: "The signature loop between the hubs, outward of the start: attack speed on the north side, evasion on the south, the attacker's notable (attack damage, attack speed, dexterity) at the tip. Three steps from the start by either hub, as the reference places every class's first notable, and the only way onto the string without a road.",
      at: P(226, 0),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [attackSpeed(5)],
          at: P(228, -47),
          why: 'The north side of the loop: offence.',
        },
        {
          id: 'n',
          kind: 'notable',
          name: "Hawk's Eye",
          lines: [attackDamage(14), attackSpeed(5), dex(20)],
          at: P(280, 0),
          why: "The attacker's notable, and nothing about a weapon: 1.4 + 1 + 1.3 units. G4 fix 2 (2026-10-23, the starts audit F3): its 10% evasion went (4.7 units were the richest notable in the network, and an evasion stop for the neighbours' attackers); the loop's south side still sells evasion. The string leaves from here.",
        },
        {
          id: 'b',
          kind: 'small',
          lines: [evasion(10)],
          at: P(229, 49),
          why: 'The south side of the loop: defence.',
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
    {
      id: 'crit',
      name: 'Vital Aim',
      why: "The south hub's crit pocket: two crit chance smalls up to the multiplier notable, then two more past it (the user's editor nodes, re-homed here in G4 fix 1) on to Weathered's cold spoke, so the pocket is a bridge from the hub to the resist star. The crit Strider's first three points after the hub.",
      at: P(221, 435),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [critChance(15)],
          at: P(211, 428),
          why: 'The entrance, facing the hub.',
        },
        { id: 'b', kind: 'small', lines: [critChance(15)], at: P(264, 451) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Vital Aim',
          lines: [critMulti(30), critChance(15)],
          at: P(328, 480),
          why: '2.5 + 1 units.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [critChance(15)],
          at: P(398, 476),
          why: "Past the notable, on its line toward Weathered's cold spoke (the user's editor node n413; G4 fix 1 re-homed it and laid it on the line).",
        },
        {
          id: 'd',
          kind: 'small',
          lines: [critChance(15)],
          at: P(453, 472),
          why: "The far door, toward the cold spoke (the editor's n414: it hung off c as a one-node dead end until G4 fix 1, the discipline audit F5).",
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
        ['c', 'd'],
      ],
    },
    {
      id: 'life',
      name: 'Long Breath',
      why: "Two life smalls and a life-and-regeneration notable, a bridge from the north hub (b) to the string's second node (a), with Elemental Fletching off the notable and Round Shield's chain off a. The first life a Strider can buy, four points out since G4 fix 1 (it hung off the start's own side node, the starts audit F3).",
      at: P(444, -179),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [life(5)],
          at: P(486, -154),
          why: 'The entrance, facing the hub.',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [life(5)],
          at: P(386, -214),
          why: 'The north hub side, on the line from the hub (G4 fix 1).',
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Long Breath',
          lines: [life(10), lifeRegen(0.8)],
          at: P(456, -217),
          why: '2 + 2 units.',
        },
      ],
      links: [
        ['a', 'n'],
        ['b', 'n'],
      ],
    },
    {
      id: 'clearHead',
      name: 'Clear Head',
      why: "Mana with reduced reservation, the aura carrier's porch: a mana small from the string's second node, the notable, and one more mana small past it. The user's editor nodes (2026-10-19, BigMana), re-homed in G4 fix 1 and re-lined (the Strider sold no reservation line, the starts audit F4). Its link to the start's south side node was cut (F3), so it is six steps out, by the string.",
      at: P(424, 286),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [mana(8)],
          at: P(459, 226),
          why: "The door from the string (the editor's n402): 12% mana regeneration → 8% mana, one unit of the notable's lead (G4 fix 1).",
        },
        {
          id: 'n',
          kind: 'notable',
          name: 'Clear Head',
          lines: [mana(16), reducedReservation(6)],
          at: P(424, 286),
          why: '2 + 2 units. Added in the editor (2026-10-19) as BigMana; G4 fix 1 (2026-10-22): 25% mana and 15% regeneration → 16% mana and 6% reduced reservation (4.6 units came down to 4).',
        },
        {
          id: 'b',
          kind: 'small',
          lines: [mana(8)],
          at: P(389, 347),
          why: "The end small past the notable (the editor's n404, linked to the start's south side until G4 fix 1).",
        },
      ],
      links: [
        ['a', 'n'],
        ['n', 'b'],
      ],
    },
  ],
  links: [
    { from: 'hubs.n', to: 'sig.a', why: "The loop's north side." },
    {
      from: 'hubs.n',
      to: 'centre.ring.road.r7',
      why: 'The north hub joins the ring one node toward the Shade: a Strider going that way, or a Shade coming here, never passes through the start.',
    },
    {
      from: 'hubs.n',
      to: 'bow.bows.road.jb3',
      why: "The north hub's road to the bows: one long link (the user's editor link), shortened in G4 fix 1 by pulling the junction in rather than laying road nodes on it, which would add a step to everything north of it.",
    },
    {
      from: 'hubs.n',
      to: 'life.b',
      why: "Long Breath hangs off the north hub (G4 fix 1, 2026-10-22): it hung off the start's own side node, three steps out, and the start fanned straight into two rich pockets (the starts audit, F3). Four steps now, off the hub as the other homes hang their pockets.",
    },
    { from: 'hubs.s', to: 'sig.b', why: "The loop's south side." },
    {
      from: 'hubs.s',
      to: 'centre.ring.road.r9',
      why: 'The south hub joins the ring one node toward the Reaver, for the same reason.',
    },
    { from: 'hubs.s', to: 'bow.steel.road.jt1', why: "The south hub's road." },
    {
      from: 'hubs.s',
      to: 'crit.a',
      why: "The south hub's pocket, Vital Aim (the user's editor link).",
    },
    {
      from: 'hubs.s',
      to: 'bow.steel.wayfarer.a',
      why: "The south hub onto Wayfarer, the evasion-and-resistances pocket (the user's editor link).",
    },
    {
      from: 'sig.a',
      to: 'start.strider',
      why: "The start touches the loop's north side (the user's editor link).",
    },
    { from: 'sig.n', to: 'bow.string.road.s1', why: 'The signature opens the string.' },
    {
      from: 'sig.b',
      to: 'start.strider',
      why: "The start touches the loop's south side (the user's editor link).",
    },
    {
      from: 'life.a',
      to: 'bow.string.road.s2',
      why: "Long Breath's other door, from the string's second node: the pocket is a bridge (the user's editor link).",
    },
    {
      from: 'life.a',
      to: 'bow.flight.roundShield.c',
      why: "Round Shield's block chain leaves Long Breath's small toward the north-east (the user's editor link); since G4 fix 1 its only spoke there, Light Hand's long spoke having gone to Round Shield's other side (the looks audit, L1 item 4).",
    },
    {
      from: 'life.n',
      to: 'bow.bows.elements.a',
      why: "Long Breath's notable onto Elemental Fletching's loop, the elemental bow's first door (the user's editor link).",
    },
    {
      from: 'crit.d',
      to: 'bow.steel.weathered.k2',
      why: "Vital Aim's crit run reaches Weathered's cold spoke: the crit pocket is a bridge to the resist star (the user's editor link, through n414 since G4 fix 1).",
    },
    {
      from: 'clearHead.a',
      to: 'bow.string.road.s2',
      why: "Clear Head's door, from the string's second node (the user's editor link).",
    },
  ],
};
