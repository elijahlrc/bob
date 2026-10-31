/**
 * The Meadow: The axis: evasion and speed.
 * Written for the attrition rework from docs/tree/design/R-bow.md (2026-10-31).
 */
import { accuracy, attackDamagePerAccuracy, attackSpeed, attackSpeedWhileMoving, bowDamage, bowSpeed, buffDuration, cooldownRecovery, critWhileStationary, evasion, quickenedOn, recoverOn } from '../lines';
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
      why: "Accuracy as a theme, on the axis; since 2026-10-31 the way on from Hawk's Eye, its room running on to the north spoke.",
      at: [2410, 1029],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [accuracy(10)], at: [2468, 863] },
        { id: "s2", kind: "small", lines: [accuracy(10)], at: [2439, 946] },
        { id: "n", kind: "notable", name: "Sure Aim", lines: [attackDamagePerAccuracy(3, 10), accuracy(25)], at: [2375, 1015], why: "Accuracy as a theme, on the axis." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
    {
      id: "crystal",
      name: "Wind Rider",
      why: "The kiter shoots faster on the move: against Steadfast Aim’s archer who stands. The north parting (2026-10-31): out from the mid ring a small where the way parts, Steadfast Aim's archer who stands stopping at a post, Wind Rider's kiter going on, by evasion smalls, to Hare's Pace on the rim and the Knife's evasion run beside it. It was a side room inside the mid ring.",
      at: [3260, 280],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [attackSpeed(4)], at: [2960, 330], why: "The parting small: attack speed, which the archer who stands and the one who runs both use." },
        { id: "s2", kind: "small", lines: [attackSpeed(4)], at: [3110, 300] },
        { id: "n", kind: "notable", name: "Wind Rider", lines: [attackSpeedWhileMoving(16), evasion(15)], at: [3260, 280], why: "The kiter shoots faster on the move: against Steadfast Aim’s archer who stands." },
        { id: "w1", kind: "small", lines: [evasion(10)], at: [3430, 305], why: "The mover's way on (2026-10-31): evasion, the kiter's defence and Hare's Pace's stat." },
        { id: "w2", kind: "small", lines: [evasion(10)], at: [3620, 380] },
      ],
      links: [["s1", "s2"], ["s2", "n"], ["n", "w1"], ["w1", "w2"]],
    },
    {
      id: "rush",
      name: "Hunter's Rush",
      why: "A speed buff from killing, off the south spoke toward the axis; since 2026-10-31 also the way on from Hard Target.",
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
      why: "The archer who holds ground crits more: against Wind Rider’s kiter. Moved (2026-10-31) from the south rim to the north parting beside Wind Rider: the post, where the way stops, as the archer who stands does. Its old place by the rim went to Hunter's Fervour.",
      at: [3060, 140],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [accuracy(10)], at: [3010, 235] },
        { id: "n", kind: "notable", name: "Steadfast Aim", lines: [critWhileStationary(40), accuracy(20)], at: [3060, 140], why: "The archer who holds ground crits more: against Wind Rider’s kiter." },
      ],
      links: [["s1", "n"]],
    },
    {
      id: "leap",
      name: "Skirmisher's Leap",
      why: "For a build with a blink skill: each blink, the kiting one included, may start a burst of speed. The spoke parting (2026-10-31): off Steady Draw's small, so the way parts there, the keystone of the archer who stands and draws slow being the post, the blink going on by buff-duration smalls to Pursuit's End, where the speed it gives is spent.",
      at: [3110, 1000],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [cooldownRecovery(5)], at: [2960, 935] },
        { id: "s2", kind: "small", lines: [cooldownRecovery(5)], at: [3040, 965] },
        { id: "n", kind: "notable", name: "Skirmisher's Leap", lines: [quickenedOn('blink', 50), cooldownRecovery(10)], at: [3110, 1000], why: "For a build with a blink skill: each blink, the kiting one included, may start a burst of speed." },
        { id: "d1", kind: "small", lines: [buffDuration(10)], at: [3180, 1180], why: "The mover's way on (2026-10-31): Quickened lasts longer, the stat between earning the speed and spending it." },
        { id: "d2", kind: "small", lines: [buffDuration(10)], at: [3110, 1380] },
        { id: "d3", kind: "small", lines: [buffDuration(10)], at: [3070, 1580] },
      ],
      links: [["s1", "s2"], ["s2", "n"], ["n", "d1"], ["d1", "d2"], ["d2", "d3"]],
    },
  ],
  links: [
    { from: "bow.string.rapid.a", to: "bow.flight.ring.b", why: "The way in." },
    { from: "bow.string.arrowWeave.a", to: "bow.rim.ring.q4", why: "The way in." },
    { from: "bow.string.tallGrass.e1", to: "bow.rim.ring.q3", why: "The way in." },
    { from: "bow.string.aim.s1", to: "bow.bows.spN.b", why: "The way in." },
    { from: "bow.string.crystal.s1", to: "bow.bows.ring.a", why: "The way in to the north parting, out from the mid ring." },
    { from: "bow.string.crystal.s1", to: "bow.string.elusive.s1", why: "The north parting: the stander's way, to Steadfast Aim's post." },
    { from: "bow.string.crystal.w2", to: "bow.rim.haresPace.s", why: "The mover's way arrives at Hare's Pace (2026-10-31), where the Knife's evasion run also comes in: the kiter's ground on the rim." },
    { from: "bow.string.rush.s1", to: "bow.steel.spS.a", why: "The way in." },
    { from: "bow.string.leap.s1", to: "bow.bows.steadyDraw.a", why: "The spoke parting: the mover's way, past Steady Draw's small to Skirmisher's Leap." },
    { from: "bow.string.leap.d3", to: "bow.quiver.pursuit.n", why: "Skirmisher's Leap's way on arrives at Pursuit's End (2026-10-31): the blink's Quickened spent, and Pursuit's End a way through between the north spoke and the mid ring's axis, slower than the ring." },
    { from: "bow.string.rapid.n", to: "bow.string.rush.n", why: "A way across between neighbouring clusters, dearer than the roads." },
  ],
};
