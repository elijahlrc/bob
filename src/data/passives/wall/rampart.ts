/**
 * The Rampart: The north spoke: armour, accuracy, stun.
 * Written for the attrition rework from docs/tree/design/R-wall.md (2026-10-31).
 */
import { accuracy, armour, armourWhileStationary, attackSpeed, physReduction, str, stunAvoidStationary } from '../lines';
import type { AreaSpec } from '../types';

export const rampart: AreaSpec = {
  id: "wall.rampart",
  region: "vanguard",
  name: "The Rampart",
  why: "The north spoke: armour, accuracy, stun.",
  at: [-2674, 376],
  clusters: [
    {
      id: "spS",
      name: "The south spoke, outer",
      why: "The south spoke from the cross-road junction out to the mid ring and on toward the rim.",
      at: [-2222, 712],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(7)], at: [-2222, 712] },
        { id: "b", kind: "attribute", lines: [str(7)], at: [-2497, 780] },
        { id: "m", kind: "attribute", lines: [str(7)], at: [-2773, 848] },
        { id: "c", kind: "attribute", lines: [str(7)], at: [-3442, 1053] },
      ],
      links: [["a", "b"], ["b", "m"], ["m", "c"]],
    },
    {
      id: "ring",
      name: "The mid ring, south",
      why: "The mid ring's stretch between the north spoke and the north border road.",
      at: [-2836, 424],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(7)], at: [-2836, 424] },
      ],
      links: [],
    },
    {
      id: "steadyHands",
      name: "Steady Hands",
      why: "Accuracy and speed, off the north spoke toward the axis (drawn in toward the spoke in the revision, 2026-10-31, to make room for Ox Hide's way out).",
      at: [-2225, 846],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [accuracy(10)], at: [-2178, 819] },
        { id: "n", kind: "notable", name: "Steady Hands", lines: [accuracy(23), attackSpeed(9)], at: [-2262, 800] },
        { id: "b", kind: "small", lines: [accuracy(10)], at: [-2290, 875] },
        { id: "c", kind: "small", lines: [accuracy(10)], at: [-2205, 892] },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"], ["c", "a"]],
    },
    {
      id: "bulwark",
      name: "The Bulwark",
      why: "Armour, off the north spoke toward the axis. Since the revision (2026-10-31) Ox Hide's armour joins its smalls (at d), so the defender's tower runs on from Ox Hide through this room to the spoke, or through Mortar and Stone to Locked Shields and the mid ring.",
      at: [-2439, 1035],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(7)], at: [-2464, 927] },
        { id: "c", kind: "small", lines: [armour(12)], at: [-2401, 971] },
        { id: "d", kind: "small", lines: [armour(12)], at: [-2389, 1047] },
        { id: "n2", kind: "notable", name: "Mortar and Stone", lines: [armour(30), physReduction(2)], at: [-2433, 1109], why: "The armour notable: a flat 2% physical reduction on top, which armour alone never gives against a big hit. 4.5 units. The road to the tower leaves from it." },
        { id: "e", kind: "small", lines: [armour(12)], at: [-2509, 1122] },
      ],
      links: [["a", "c"], ["c", "d"], ["d", "n2"], ["n2", "e"]],
    },
    {
      id: "unerring",
      name: "Unerring Discipline",
      why: "The accuracy keystone, a spur where the north spoke meets the mid ring.",
      at: [-2953, 764],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [accuracy(10)], at: [-2874, 801] },
        { id: "b", kind: "small", lines: [accuracy(10)], at: [-2945, 768] },
        { id: "k", kind: "keystone", name: "Unerring Discipline", lines: [], at: [-3040, 723] },
      ],
      links: [["a", "b"], ["b", "k"]],
    },
    {
      id: "stand",
      name: "Standing Iron",
      why: "The armour rule: armour that grows while the Vanguard holds still.",
      at: [-3352, 1301],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [armour(10)], at: [-3412, 1136] },
        { id: "s2", kind: "small", lines: [armour(10)], at: [-3382, 1219] },
        { id: "n", kind: "notable", name: "Standing Iron", lines: [armourWhileStationary(45), stunAvoidStationary(35)], at: [-3352, 1301], why: "The armour rule: armour that grows while the Vanguard holds still." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "wall.rampart.spS.c", to: "wall.grit.ring.s1", why: "The south spoke reaches the rim ring." },
    { from: "wall.rampart.spS.m", to: "wall.rampart.ring.a", why: "The mid ring on toward the south border." },
    { from: "wall.rampart.ring.a", to: "wall.resists.radW.m", why: "The mid ring meets the south border road." },
    { from: "wall.rampart.steadyHands.a", to: "wall.rampart.spS.a", why: "The way in." },
    { from: "wall.rampart.bulwark.a", to: "wall.rampart.spS.b", why: "The way in." },
    { from: "wall.rampart.unerring.a", to: "wall.rampart.spS.m", why: "The way in." },
    { from: "wall.rampart.stand.s1", to: "wall.rampart.spS.c", why: "The way in." },
  ],
};
