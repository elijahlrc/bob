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
 * damage, attack speed, evasion, dexterity) on the loop between the hubs, outward of the start, and the way onto the
 * string. Each hub has one pocket here (crit north, life south), drawn as a tight orbit beside the hub as the reference
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
  manaRegen,
  oneHandMelee,
  resOne,
  shieldBlock,
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
      why: 'The two dexterity hubs the start touches. North leads to the bows, the crit pocket and the ring toward the Shade; south to the physical end, the life pocket and the ring toward the Reaver. Point one is a side.',
      at: P(8, 58),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n',
          kind: 'attribute',
          lines: [dex(20)],
          at: P(60, -200),
          why: 'The north hub: five ways out.',
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
      why: "The signature loop between the hubs, outward of the start: attack speed on the north side, evasion on the south, the attacker's notable at the tip. Three steps from the start by either hub, as the reference places every class's first notable, and the only way onto the string without a road.",
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
          lines: [attackDamage(14), attackSpeed(5), evasion(10), dex(20)],
          at: P(280, 0),
          why: 'The class in one node, and nothing about a weapon: 1.4 + 1 + 1 + 1.3 units. The string leaves from here.',
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
      why: "The north hub's pocket, a tight orbit beside the hub pointing at the Shade: two crit chance nodes and a multiplier notable. The crit Strider's first three points after the hub; a dead end, as the reference's is.",
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
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
      ],
    },
    {
      id: 'life',
      name: 'Long Breath',
      why: "The south hub's pocket, a tight orbit beside the hub pointing at the Reaver: two life nodes and a life-and-regeneration notable. The first life a Strider can buy, three points after the hub; a dead end.",
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
        { id: 'b', kind: 'small', lines: [life(5)], at: P(399, -175) },
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
      id: 'added',
      name: 'Added in the editor',
      why: 'Nodes added by the user in the tree editor (2026-10-19); names and reasons provisional.',
      at: P(547, 240),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'n400',
          kind: 'notable',
          name: 'Clear Head',
          lines: [mana(25), manaRegen(15)],
          at: P(424, 286),
          why: 'Added in the editor (2026-10-19) as BigMana; named 2026-10-19, lines theirs.',
        },
        {
          id: 'n404',
          kind: 'small',
          lines: [manaRegen(12)],
          at: P(380, 232),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n413',
          kind: 'small',
          lines: [critChance(15)],
          at: P(331, 550),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n414',
          kind: 'small',
          lines: [critChance(15)],
          at: P(332, 609),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n424',
          kind: 'small',
          lines: [resOne('cold', 10)],
          at: P(747, 451),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n423',
          kind: 'small',
          lines: [resOne('cold', 10)],
          at: P(803, 437),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n435',
          kind: 'small',
          lines: [oneHandMelee(15)],
          at: P(990, -417),
          why: 'Added in the editor (2026-10-19).',
        },
        {
          id: 'n437',
          kind: 'small',
          lines: [shieldBlock(2)],
          at: P(856, -162),
          why: "Added in the editor (2026-10-19). G3 round 2 (2026-10-22, approved after round 1): +4% block and 10% shield defences → +2% block with a shield, one stat at a small's size (CONSTRAINTS §8.1), the same as Round Shield's north small, so the shield chain is one section.",
        },
        {
          id: 'n438',
          kind: 'small',
          lines: [shieldBlock(2)],
          at: P(914, -163),
          why: 'Added in the editor (2026-10-19). G3 round 2 (2026-10-22): as n437, +2% block with a shield.',
        },
      ],
      links: [
        ['n423', 'n424'],
        ['n400', 'n404'],
        ['n413', 'n414'],
        ['n413', 'n424'],
        ['n437', 'n438'],
      ],
    },
  ],
  links: [
    { from: 'added.n423', to: 'bow.steel.added.n416', why: 'Added in the editor (2026-10-19).' },
    { from: 'hubs.n', to: 'sig.a', why: "The loop's north side." },
    {
      from: 'hubs.n',
      to: 'centre.ring.road.r7',
      why: 'The north hub joins the ring one node toward the Shade: a Strider going that way, or a Shade coming here, never passes through the start.',
    },
    { from: 'hubs.n', to: 'bow.bows.road.jb3', why: 'Added in the editor (2026-10-19).' },
    { from: 'hubs.s', to: 'sig.b', why: "The loop's south side." },
    {
      from: 'hubs.s',
      to: 'centre.ring.road.r9',
      why: 'The south hub joins the ring one node toward the Reaver, for the same reason.',
    },
    { from: 'hubs.s', to: 'bow.steel.road.jt1', why: "The south hub's road." },
    { from: 'hubs.s', to: 'crit.a', why: 'Added in the editor (2026-10-19).' },
    { from: 'hubs.s', to: 'bow.steel.wayfarer.a', why: 'Added in the editor (2026-10-19).' },
    { from: 'sig.a', to: 'start.strider', why: 'Added in the editor (2026-10-19).' },
    { from: 'sig.a', to: 'life.b', why: 'Added in the editor (2026-10-19).' },
    { from: 'sig.n', to: 'bow.string.road.s1', why: 'The signature opens the string.' },
    { from: 'sig.b', to: 'start.strider', why: 'Added in the editor (2026-10-19).' },
    { from: 'sig.b', to: 'added.n404', why: 'Added in the editor (2026-10-19).' },
    { from: 'crit.n', to: 'added.n413', why: 'Added in the editor (2026-10-19).' },
    { from: 'life.a', to: 'bow.string.road.s2', why: 'Added in the editor (2026-10-19).' },
    { from: 'life.a', to: 'added.n435', why: 'Added in the editor (2026-10-19).' },
    { from: 'life.a', to: 'added.n437', why: 'Added in the editor (2026-10-19).' },
    { from: 'life.n', to: 'bow.bows.elements.a', why: 'Added in the editor (2026-10-19).' },
    { from: 'added.n400', to: 'bow.string.added.n402', why: 'Added in the editor (2026-10-19).' },
  ],
};
