/**
 * The Hedgerows: The north spoke: bows, accuracy, elemental attacks, the Knife seam.
 * Written for the attrition rework from docs/tree/design/R-bow.md (2026-10-31).
 */
import { accuracy, attackSpeed, bowDamage, bowSpeed, chain, chillEffect, dex, eleAttack, eleAttackOne, elePenetration, evasionWhileMoving, freezeChance, projectileDamage, projectileSpeed, trapDamage, trapGainCold, trapSpeed } from '../lines';
import type { AreaSpec } from '../types';

export const bows: AreaSpec = {
  id: "bow.bows",
  region: "strider",
  name: "The Hedgerows",
  why: "The north spoke: bows, accuracy, elemental attacks, the Knife seam.",
  at: [2674, 376],
  clusters: [
    {
      id: "spN",
      name: "The north spoke, outer",
      why: "The north spoke from the cross-road junction out to the mid ring and on toward the rim.",
      at: [2222, 712],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [dex(7)], at: [2222, 712] },
        { id: "b", kind: "attribute", lines: [dex(7)], at: [2497, 780] },
        { id: "m", kind: "attribute", lines: [dex(7)], at: [2773, 848] },
        { id: "c", kind: "attribute", lines: [dex(7)], at: [3443, 1053] },
      ],
      links: [["a", "b"], ["b", "m"], ["m", "c"]],
    },
    {
      id: "ring",
      name: "The mid ring, north",
      why: "The mid ring's stretch between the Knife's border road and the north spoke.",
      at: [2837, 424],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [dex(7)], at: [2837, 424] },
      ],
      links: [],
    },
    {
      id: "tripwire",
      name: "Tripwire",
      why: "Traps that chill, for the kiting bow user, off the Knife's border road beside the Knife's traps.",
      at: [2474, 173],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [trapDamage(12)], at: [2471, 111] },
        { id: "b", kind: "small", lines: [trapDamage(12)], at: [2474, 169] },
        { id: "n", kind: "notable", name: "Tripwire", lines: [trapGainCold(12), chillEffect(15), freezeChance(8)], at: [2477, 239], why: "Traps that chill and freeze, for the kiting bow user (the Knife’s Venom Snare on the same road sells trap damage and poison)." },
        { id: "n2", kind: 'notable', name: "Kiting Snares", lines: [trapSpeed(12), evasionWhileMoving(20)], at: [2481, 324], why: "Traps laid on the run: the trapper who kites." },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "n2"]],
    },
    {
      id: "longbow",
      name: "Longbow and Fleet Blade",
      why: "The first bows, out from the mid ring between the Knife border and the north spoke (step 10).",
      at: [3173, 418],
      shape: { kind: 'hand' },
      nodes: [
        { id: "e", kind: "small", lines: [attackSpeed(5)], at: [3100, 419] },
        { id: "a1", kind: "small", lines: [bowSpeed(5)], at: [3124, 358] },
        { id: "a2", kind: "small", lines: [bowSpeed(5)], at: [3185, 333] },
        { id: "n1", kind: "notable", name: "Longbow", lines: [bowDamage(16), bowSpeed(12), accuracy(10)], at: [3244, 356], why: "1.6 + 2.4 + 1 units. G3 round 1 (2026-10-22, the brief's ST-p2): bow attack speed 13 → 12, so it is 5 units, not 5.3." },
      ],
      links: [["e", "a1"], ["a1", "a2"], ["a2", "n1"]],
    },
    {
      id: "steadyDraw",
      name: "Steady Draw",
      why: "Keystone, a spur out from where the north spoke meets the mid ring (step 10; it was 7).",
      at: [2953, 764],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [bowDamage(10)], at: [2914, 782] },
        { id: "k", kind: "keystone", name: "Steady Draw", lines: [], at: [2992, 746] },
      ],
      links: [["a", "k"]],
    },
    {
      id: "ricochet",
      name: "Ricochet",
      why: "Chain, off the north spoke past the mid ring.",
      at: [3540, 656],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [projectileDamage(10)], at: [3529, 702] },
        { id: "n", kind: "notable", name: "Ricochet", lines: [chain(1), projectileSpeed(5)], at: [3511, 635], why: "4 + 0.5 units: a chain is worth a notable on its own." },
        { id: "b", kind: "small", lines: [projectileDamage(10)], at: [3581, 631] },
      ],
      links: [["a", "n"], ["n", "b"]],
    },
    {
      id: "elements",
      name: "Elemental Fletching",
      why: "Elemental attacks in general, off the north spoke past the mid ring toward the axis.",
      at: [3314, 1407],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [eleAttack(10)], at: [3335, 1351] },
        { id: "b", kind: "small", lines: [eleAttack(10)], at: [3267, 1370] },
        { id: "n", kind: "notable", name: "Elemental Fletching", lines: [eleAttack(20), elePenetration(3)], at: [3264, 1440], why: "2 + 2 units." },
        { id: "c", kind: "small", lines: [eleAttack(10)], at: [3331, 1465] },
        { id: "d", kind: "small", lines: [eleAttack(10)], at: [3373, 1410] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"], ["c", "d"], ["d", "a"]],
    },
    {
      id: "frost",
      name: "Frost Fletching",
      why: "Cold arrows' first rung, off the north spoke: chilled enemies close in slower.",
      at: [2629, 551],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [eleAttackOne('cold', 10)], at: [2541, 704] },
        { id: "s2", kind: "small", lines: [eleAttackOne('cold', 10)], at: [2585, 628] },
        { id: "n", kind: "notable", name: "Frost Fletching", lines: [eleAttackOne('cold', 24), chillEffect(20)], at: [2629, 551], why: "Cold arrows' first rung, off the north spoke: chilled enemies close in slower." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "bow.bows.spN.c", to: "bow.rim.ring.n1", why: "The north spoke reaches the rim ring." },
    { from: "bow.bows.ring.a", to: "knife.snares.radS.m", why: "The mid ring meets the Knife's border road." },
    { from: "bow.bows.ring.a", to: "bow.bows.spN.m", why: "The mid ring meets the north spoke." },
    { from: "bow.bows.spN.m", to: "bow.flight.ring.a", why: "The mid ring on toward the axis." },
    { from: "bow.bows.tripwire.a", to: "knife.snares.radS.b", why: "The way in." },
    { from: "bow.bows.longbow.e", to: "bow.bows.ring.a", why: "The way in." },
    { from: "bow.bows.steadyDraw.a", to: "bow.bows.spN.m", why: "The way in." },
    { from: "bow.bows.ricochet.a", to: "bow.bows.spN.c", why: "The way in." },
    { from: "bow.bows.elements.a", to: "bow.bows.spN.c", why: "The way in." },
    { from: "bow.bows.frost.s1", to: "bow.bows.spN.b", why: "The way in." },
    { from: "bow.bows.tripwire.n", to: "bow.bows.frost.n", why: "A way across between neighbouring clusters, dearer than the roads." },
    { from: "bow.bows.longbow.n1", to: "bow.bows.ricochet.n", why: "A way across between neighbouring clusters, dearer than the roads." },
  ],
};
