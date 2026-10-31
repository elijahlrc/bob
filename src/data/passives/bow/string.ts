/**
 * The Meadow: The axis: evasion and speed.
 * Written for the attrition rework from docs/tree/design/R-bow.md (2026-10-31).
 */
import { accuracy, attackDamagePerAccuracy, attackSpeed, attackSpeedWhileMoving, bowDamage, bowSpeed, cooldownRecovery, critWhileStationary, evasion, quickenedOn, recoverOn } from '../lines';
import type { AreaSpec } from '../types';

export const string: AreaSpec = {
  id: "bow.string",
  region: "strider",
  name: "The Meadow",
  why: "The axis: evasion and speed.",
  at: [2165, 1250],
  clusters: [
    {
      id: "rapid",
      name: "Rapid Fire",
      why: "Bow speed, in from the mid ring at the axis.",
      at: [2269, 1310],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [bowDamage(10)], at: [2322, 1341] },
        { id: "b", kind: "small", lines: [bowDamage(10)], at: [2273, 1312] },
        { id: "n", kind: "notable", name: "Rapid Fire", lines: [bowDamage(20), bowSpeed(12)], at: [2212, 1277], why: "Bow speed (its movement line went)." },
      ],
      links: [["a", "b"], ["b", "n"]],
    },
    {
      id: "arrowWeave",
      name: "Arrow Weave",
      why: "The evasion keystone, a spur in from the rim ring at the axis.",
      at: [3507, 1818],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [evasion(10)], at: [3545, 1837] },
        { id: "k", kind: "keystone", name: "Arrow Weave", lines: [], at: [3469, 1799] },
      ],
      links: [["a", "k"]],
    },
    {
      id: "tallGrass",
      name: "Tall Grass",
      why: "Evasion and regeneration, in from the rim ring.",
      at: [3672, 1483],
      shape: { kind: 'hand' },
      nodes: [
        { id: "e1", kind: "small", lines: [evasion(10)], at: [3780, 1531] },
        { id: "e2", kind: "small", lines: [evasion(10)], at: [3735, 1498] },
        { id: "n", kind: "notable", name: "Tall Grass", lines: [evasion(20), recoverOn('evade', 'life', 2)], at: [3680, 1456], why: "Evasion’s rule: each attack evaded closes a wound." },
      ],
      links: [["e1", "e2"], ["e2", "n"]],
    },
    {
      id: "aim",
      name: "Sure Aim",
      why: "Accuracy as a theme, on the axis.",
      at: [2410, 1029],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [accuracy(10)], at: [2468, 863] },
        { id: "s2", kind: "small", lines: [accuracy(10)], at: [2439, 946] },
        { id: "n", kind: "notable", name: "Sure Aim", lines: [attackDamagePerAccuracy(3, 10), accuracy(25)], at: [2410, 1029], why: "Accuracy as a theme, on the axis." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
    {
      id: "crystal",
      name: "Wind Rider",
      why: "The kiter shoots faster on the move: against Steadfast Aim’s archer who stands.",
      at: [2719, 188],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [attackSpeed(4)], at: [2798, 345] },
        { id: "s2", kind: "small", lines: [attackSpeed(4)], at: [2759, 266] },
        { id: "n", kind: "notable", name: "Wind Rider", lines: [attackSpeedWhileMoving(16), evasion(15)], at: [2719, 188], why: "The kiter shoots faster on the move: against Steadfast Aim’s archer who stands." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
    {
      id: "rush",
      name: "Hunter's Rush",
      why: "A speed buff from killing, off the south spoke toward the axis.",
      at: [1940, 1412],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [attackSpeed(4)], at: [1799, 1517] },
        { id: "s2", kind: "small", lines: [attackSpeed(4)], at: [1870, 1464] },
        { id: "n", kind: "notable", name: "Hunter's Rush", lines: [quickenedOn('kill', 40), attackSpeed(8)], at: [1940, 1412], why: "A speed buff from killing, off the south spoke toward the axis." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
    {
      id: "elusive",
      name: "Steadfast Aim",
      why: "The archer who holds ground crits more: against Wind Rider’s kiter.",
      at: [3107, 2470],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [accuracy(10)], at: [3261, 2555] },
        { id: "s2", kind: "small", lines: [accuracy(10)], at: [3184, 2512] },
        { id: "n", kind: "notable", name: "Steadfast Aim", lines: [critWhileStationary(40), accuracy(20)], at: [3107, 2470], why: "The archer who holds ground crits more: against Wind Rider’s kiter." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
    {
      id: "leap",
      name: "Skirmisher's Leap",
      why: "For a build with a blink skill: each blink, the kiting one included, may start a burst of speed.",
      at: [2994, 992],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [cooldownRecovery(5)], at: [2847, 896] },
        { id: "s2", kind: "small", lines: [cooldownRecovery(5)], at: [2920, 944] },
        { id: "n", kind: "notable", name: "Skirmisher's Leap", lines: [quickenedOn('blink', 50), cooldownRecovery(10)], at: [2994, 992], why: "For a build with a blink skill: each blink, the kiting one included, may start a burst of speed." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "bow.string.rapid.a", to: "bow.flight.ring.b", why: "The way in." },
    { from: "bow.string.arrowWeave.a", to: "bow.rim.ring.q4", why: "The way in." },
    { from: "bow.string.tallGrass.e1", to: "bow.rim.ring.q3", why: "The way in." },
    { from: "bow.string.aim.s1", to: "bow.bows.spN.b", why: "The way in." },
    { from: "bow.string.crystal.s1", to: "bow.bows.ring.a", why: "The way in." },
    { from: "bow.string.rush.s1", to: "bow.steel.spS.a", why: "The way in." },
    { from: "bow.string.elusive.s1", to: "bow.rim.ring.q6", why: "The way in." },
    { from: "bow.string.leap.s1", to: "bow.bows.spN.m", why: "The way in." },
    { from: "bow.string.rapid.n", to: "bow.string.rush.n", why: "A way across between neighbouring clusters, dearer than the roads." },
  ],
};
