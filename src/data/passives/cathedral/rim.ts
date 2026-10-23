/**
 * The Churchyard (phase G2 of docs/tree/design/G-growth.md, 2026-10-22; G1/zealot.md §3, "the outer walk"): a road of
 * four attribute nodes round the back of the Bell Tower, outside the Searing Avatar spur, from Censer to Thunder Peal.
 * Both pockets become bridges, and the tower gets a loop round its back. It runs in three straight legs that turn at its
 * two junctions, where G3 hangs energy shield with life (Wake, round 2) and burning with the sceptre (Brazier, round 3)
 * inward, and spell block (Buttress, round 3) outward off its middle node; the leg into Thunder Peal is the pocket's own
 * line carried on. Since G3 round 3 the far south-west's bridge
 * from Censer to the Vanguard's Grim Oath (Procession, auras with life) lives here too. The export keeps the name
 * index.ts imports.
 */
import {
  auraEffect,
  burnDamage,
  es,
  igniteChance,
  int,
  life,
  resAll,
  spellBlock,
  str,
  weaponDamage,
} from '../lines';
import type { AreaSpec } from '../types';
import { P } from './frame';

export const outerWalk: AreaSpec = {
  id: 'cathedral.rim',
  region: 'zealot',
  name: 'The Churchyard',
  why: "The ground outside the Bell Tower: the outer walk from Censer to Thunder Peal and the clusters that hang inward off it (the fire caster's two pools, the sceptre's burning beside Searing Avatar), spell block out on the rim, and the bridge from Censer to the Vanguard's Grim Oath (auras with life).",
  at: [-4960, -1290], // Where the area's name is drawn: outside the walk, clear of the Bell Tower's name and every notable.
  clusters: [
    {
      id: 'walk',
      name: 'The outer walk',
      why: 'Four attribute nodes: out from Censer along the rim, a corner, along the rim past the keystone, a corner, and in to Thunder Peal on its own line.',
      at: P(3300, -1250),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'o1',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(2923, -1292),
          why: 'The first leg, out from Censer.',
        },
        {
          id: 'o2',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3300, -1250),
          why: 'The outer corner: Wake (energy shield with life, G3 round 2) hangs inward from here, between Censer and Searing Avatar.',
        },
        {
          id: 'o3',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3382, -858),
          why: 'The leg along the rim, outside the Searing Avatar keystone (which keeps its one link); Buttress (spell block, G3 round 3) hangs outward from here.',
        },
        {
          id: 'o4',
          kind: 'attribute',
          lines: [str(6), int(6)],
          at: P(3463, -465),
          why: "The far corner, on Thunder Peal's line: Brazier (burning with the sceptre, G3 round 3) hangs inward from here.",
        },
      ],
      links: [
        ['o1', 'o2'],
        ['o2', 'o3'],
        ['o3', 'o4'],
      ],
    },
    {
      id: 'wake',
      name: 'Wake',
      why: "G3 round 2 (2026-10-22; ledger ZE-10, folding ZE-s2): a pocket inward off the outer corner, on the corner's bisector, between Censer and the Searing Avatar spur: energy shield three times, then the notable with energy shield and life. The hybrid caster's defence where the fire caster goes (Censer's burning, Searing Avatar): a fire caster who comes west for its burning finds its two pools here, and gives up the Mystic's east, where its spell damage is. ES-led because the inside's energy shield is spread thin and far (Vigil, Litany, Tomb Dust, Rood Screen); Warm Blood, in the Spire, is the life-led twin. No spell damage here (the convergence rule). A dead-end pocket: the Churchyard it hangs from has two ways in.",
      at: P(3113, -1042),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [es(5)],
          at: P(3233, -1176),
          why: 'The entrance from the outer corner.',
        },
        { id: 'b', kind: 'small', lines: [es(5)], at: P(3196, -1135) },
        { id: 'c', kind: 'small', lines: [es(5)], at: P(3159, -1094) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Wake',
          lines: [es(10), life(10)],
          at: P(3113, -1042),
          why: 'Energy shield and life: 2 + 2 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'n'],
      ],
    },
    {
      id: 'brazier',
      name: 'Brazier',
      why: "G3 round 3 (2026-10-22; ledger ZE-6): a pocket inward off the far corner, on the corner's bisector, into the ground between Thunder Peal's chain and the Searing Avatar spur: burning damage three times, then the notable with sceptre damage, the chance to ignite and burning. The fire sceptre's burn, beside the keystone that makes everything fire, and the sceptre's fourth place (Verger with armour at the Wall border, Gilded Rod with crit on the Vestry wheel, Hallowed Hammer with elemental strikes across the border), each with a different partner. The smalls carry the burning, not the sceptre: the fire caster's fire stood flat from 120 to 160 points, and the burning serves the caster and the striker alike, while the sceptre on the notable is the striker's alone. The fire caster who comes west now finds burning twice (Censer, eight steps back, with area and long ignites; this, with the sceptre it does not hold), its two pools (Wake) and the keystone, all against the Mystic's east. A dead-end tip: the Churchyard has two ways in.",
      at: P(3236, -628),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [burnDamage(12)],
          at: P(3382, -523),
          why: 'The entrance from the far corner.',
        },
        { id: 'b', kind: 'small', lines: [burnDamage(12)], at: P(3338, -555) },
        { id: 'c', kind: 'small', lines: [burnDamage(12)], at: P(3293, -587) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Brazier',
          lines: [weaponDamage('sceptre', 20), igniteChance(10), burnDamage(12)],
          at: P(3236, -628),
          why: 'Sceptre damage, the chance to ignite and burning: 2 + 1 + 1 units.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'n'],
      ],
    },
    {
      id: 'procession',
      name: 'Procession',
      why: "G3 round 3 (2026-10-22; ledger ZE-8): the bridge from Censer to the Vanguard's Grim Oath, aura effect twice, the notable with aura effect and life, aura effect once more. The support build's auras on life, at the far south-west where Battle Hymn's shouts and Grim Oath's curses are (the support corner). Aura-led, not life-led as the brief had it: the aura build's auras stood flat from 120 to 160 points (its other aura notables, Choirmaster, Benediction, Lone Vow's spur and the Banner, are all taken by 120), while its life still climbed, and life is spread over every region. Aura twins: Choirmaster (reservation, mana) north-east, Benediction (shield, regeneration) on the tower wheel, Battle Hymn (warcries) seven steps away by the Rampart road. The bridge turns at the notable to clear Battle Hymn, which sits on the straight line from Censer to Grim Oath.",
      at: P(2641, -1814),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [auraEffect(6)],
          at: P(2617, -1691),
          why: 'The entrance from Censer, on the straight line to the notable.',
        },
        { id: 'b', kind: 'small', lines: [auraEffect(6)], at: P(2628, -1745) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Procession',
          lines: [auraEffect(12), life(10)],
          at: P(2641, -1814),
          why: 'Aura effect and life: 2 + 2 units.',
        },
        {
          id: 'c',
          kind: 'small',
          lines: [auraEffect(6)],
          at: P(2590, -1862),
          why: 'The far node, onto Grim Oath.',
        },
      ],
      links: [
        ['a', 'b'],
        ['b', 'n'],
        ['n', 'c'],
      ],
    },
    {
      id: 'buttress',
      name: 'Buttress',
      why: "G3 round 3 (2026-10-22), beyond the brief (CONSTRAINTS §1.1, what more points would still buy; the round's instructions on far supply for flat specializations): a pocket outward off the outer walk's middle node, square to the walk, out on the rim: spell block three times, then the notable with spell block and all resistances. Block without a shield, for the staff blocker, whose block stood flat from 60 points on (Quarterstaff and Warding Staff, both by the Vestry, were all it had). Spell block's third direction from the Zealot start (Warding Staff with a staff south-west, Glass Wall behind a shield and Rood Screen with energy shield north-east and north), with a partner none of them has; Stone Ward, in the Wall, is spell block with life on block. Going here costs the staff blocker the Mystic's east, where its spell damage is. The only node of the walk that had nothing off it; inward is the Searing Avatar spur, so it hangs outward and the region grows by a step at the rim. A dead-end tip: the Churchyard has two ways in.",
      at: P(3656, -915),
      shape: { kind: 'hand' },
      nodes: [
        {
          id: 'a',
          kind: 'small',
          lines: [spellBlock(2)],
          at: P(3480, -879),
          why: 'The entrance from the walk.',
        },
        { id: 'b', kind: 'small', lines: [spellBlock(2)], at: P(3534, -889) },
        { id: 'c', kind: 'small', lines: [spellBlock(2)], at: P(3588, -901) },
        {
          id: 'n',
          kind: 'notable',
          name: 'Buttress',
          lines: [spellBlock(4), resAll(10)],
          at: P(3656, -915),
          why: 'Spell block and all resistances: 2 + 2.5 units.',
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
      from: 'walk.o3',
      to: 'buttress.a',
      why: "The outer walk's middle node onto spell block (G3 round 3), outward, square to the walk.",
    },
    {
      from: 'cathedral.ambulatory.censer.n',
      to: 'walk.o1',
      why: 'Censer onto the outer walk: the burning pocket becomes a bridge.',
    },
    {
      from: 'walk.o2',
      to: 'wake.a',
      why: "The outer corner onto the fire caster's two pools (G3 round 2), on the corner's bisector.",
    },
    {
      from: 'walk.o4',
      to: 'cathedral.ambulatory.peal.n',
      why: 'The outer walk lands on Thunder Peal, straight through its chain: the lightning pocket becomes a bridge.',
    },
    {
      from: 'walk.o4',
      to: 'brazier.a',
      why: "The far corner onto the sceptre's burning (G3 round 3), on the corner's bisector.",
    },
    {
      from: 'cathedral.ambulatory.censer.n',
      to: 'procession.a',
      why: 'Censer onto the auras with life (G3 round 3): Censer is a junction of three, its links about evenly spread (its own chain east, the outer walk north-west, this south-west).',
    },
    {
      from: 'procession.c',
      to: 'wall.maces.oath.n',
      why: "Two-handed fire (a near crossing at the rim; G1-brief.md §2.3, deferred to G3 by G2/borders.md §4): Procession's far node lands on the Vanguard's Grim Oath, so the Zealot's outer walk and the Vanguard's west rim road are one road through the support corner: Censer's burning, Searing Avatar and Brazier for the Vanguard's fire two-hander, Grim Oath's curses for the Zealot's support build.",
    },
  ],
};
