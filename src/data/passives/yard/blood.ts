/**
 * The Pits: The axis at the mid ring: bleed, leech, the paired blades or the two-handed swing.
 * Written for the attrition rework from docs/tree/design/R-yard.md (2026-10-31).
 */
import { bleedChance, costReduction, damageAfterBlock, dex, dualDamage, enemyStunThreshold, leechLife, leechRate, life, maxResAll, meleePhys, resAll, resOne, str, twoHandDamage } from '../lines';
import type { AreaSpec } from '../types';

export const blood: AreaSpec = {
  id: "yard.blood",
  region: "reaver",
  name: "The Pits",
  why: "The axis at the mid ring: bleed, leech, the paired blades or the two-handed swing.",
  at: [0, 3100],
  clusters: [
    {
      id: "ring",
      name: "The mid ring, centre",
      why: "The mid ring's stretch across the axis between the two spokes.",
      at: [326, 2826],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(6), dex(6)], at: [326, 2826] },
        { id: "b", kind: "attribute", lines: [str(6), dex(6)], at: [0, 2826] },
        { id: "c", kind: "attribute", lines: [str(6), dex(6)], at: [-326, 2826] },
      ],
      links: [["a", "b"], ["b", "c"]],
    },
    {
      id: "swing",
      name: "Full Swing",
      why: "The paired blades or the two-handed swing, the two sides of one wheel: a choice, out from the mid ring at the axis.",
      at: [0, 3170],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [twoHandDamage(12)], at: [0, 3070] },
        { id: "b", kind: "small", lines: [twoHandDamage(12)], at: [-87, 3120] },
        { id: "n1", kind: "notable", name: "Full Swing", lines: [twoHandDamage(24), life(10)], at: [-87, 3220], why: "A big weapon swung from the shoulders, by a body that can take the hits back: 2 + 2 units." },
        { id: "c", kind: "small", lines: [dualDamage(10)], at: [0, 3270] },
        { id: "d", kind: "small", lines: [dualDamage(10)], at: [87, 3220] },
        { id: "n2", kind: "notable", name: "Paired Steel", lines: [dualDamage(20), leechLife(0.6), bleedChance(10)], at: [87, 3120], why: "The paired blades: blood both ways, leech and bleed, against the two-handed swing." },
        { id: "n3", kind: 'notable', name: "Momentum Swing", lines: [twoHandDamage(20), enemyStunThreshold(20)], at: [-161, 3262], why: "The two-handed swing that sets up the stun Crushing Swing pays off." },
      ],
      links: [["a", "b"], ["b", "n1"], ["n1", "c"], ["c", "d"], ["d", "n2"], ["n2", "a"], ["n1", "n3"]],
    },
    {
      id: "star",
      name: "Four Winds",
      why: "Resistances, in from the mid ring at the axis.",
      at: [0, 2610],
      shape: { kind: 'hand' },
      nodes: [
        { id: "n", kind: "notable", name: "Four Winds", lines: [resAll(8), maxResAll(1)], at: [-3, 2610], why: "2 + 2 units." },
        { id: "f", kind: "small", lines: [resOne("fire", 10)], at: [9, 2541] },
        { id: "w", kind: "small", lines: [resOne("cold", 10)], at: [-73, 2610] },
        { id: "e", kind: "small", lines: [resOne("lightning", 10)], at: [67, 2609] },
        { id: "s", kind: "small", lines: [resOne("chaos", 10)], at: [0, 2680] },
      ],
      links: [["n", "f"], ["n", "w"], ["n", "e"], ["n", "s"]],
    },
    {
      id: "redHarvest",
      name: "Red Harvest",
      why: "Leech, out from the mid ring west of the Bow border (moved off it).",
      at: [469, 3135],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [leechLife(0.4, ["attack"])], at: [444, 3081] },
        { id: "n", kind: "notable", name: "Red Harvest", lines: [leechLife(1.2, ["attack"]), leechRate(10)], at: [513, 3114], why: "3 + 1 units." },
        { id: "b", kind: "small", lines: [leechLife(0.4, ["attack"])], at: [494, 3189] },
        { id: "c", kind: "small", lines: [leechLife(0.4, ["attack"])], at: [425, 3156] },
        { id: "n2", kind: 'notable', name: "Crimson Reaping", lines: [leechLife(0.8), leechRate(20)], at: [590, 3077], why: "Leech that flows faster: the Yard’s sustain is blood drawn, not kills counted." },
      ],
      links: [["a", "n"], ["n", "b"], ["a", "c"], ["c", "b"], ["n", "n2"]],
    },
    {
      id: "riposte",
      name: "Answering Steel",
      why: "Damage after a block, for shield and dual-wield blockers alike: on the axis, in reach of both.",
      at: [-322, 2562],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [meleePhys(8)], at: [-325, 2738] },
        { id: "s2", kind: "small", lines: [meleePhys(8)], at: [-323, 2650] },
        { id: "n", kind: "notable", name: "Answering Steel", lines: [damageAfterBlock(30), costReduction(8)], at: [-322, 2562], why: "Damage after a block, for shield and dual-wield blockers alike: on the axis, in reach of both." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "yard.blood.ring.c", to: "yard.blades.spS.m", why: "The mid ring meets the south spoke." },
    { from: "yard.blood.swing.a", to: "yard.blood.ring.b", why: "The way in." },
    { from: "yard.blood.star.s", to: "yard.blood.ring.b", why: "The way in." },
    { from: "yard.blood.redHarvest.a", to: "yard.blood.ring.a", why: "The way in." },
    { from: "yard.blood.riposte.s1", to: "yard.blood.ring.c", why: "The way in." },
  ],
};
