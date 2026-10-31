/**
 * The Choir: The north-east spoke: servants and auras.
 * Written for the attrition rework from docs/tree/design/R-cathedral.md (2026-10-31).
 */
import { auraEffect, castSpeed, chillEffect, eleDamage, eleDamageAll, freezeChance, int, mana, minionDamage, minionLife, minionRegen, minionRes, minionSpeed, physSpell, reducedReservation, shieldBlock, shockEffect, str } from '../lines';
import type { AreaSpec } from '../types';

export const choir: AreaSpec = {
  id: "cathedral.choir",
  region: "zealot",
  name: "The Choir",
  why: "The north-east spoke: servants and auras.",
  at: [-1662, -2128],
  clusters: [
    {
      id: "spS",
      name: "The south spoke, outer",
      why: "The south spoke from the cross-road junction out to the mid ring and on toward the rim.",
      at: [-1728, -1569],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(6), int(6)], at: [-1728, -1569] },
        { id: "b", kind: "attribute", lines: [str(6), int(6)], at: [-1924, -1773] },
        { id: "m", kind: "attribute", lines: [str(6), int(6)], at: [-2121, -1978] },
        { id: "c", kind: "attribute", lines: [str(6), int(6)], at: [-2633, -2455] },
      ],
      links: [["a", "b"], ["b", "m"], ["m", "c"]],
    },
    {
      id: "ring",
      name: "The mid ring, south",
      why: "The mid ring's stretch between the north-east spoke and the Spire's border road.",
      at: [-1785, -2244],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(6), int(6)], at: [-1785, -2244] },
      ],
      links: [],
    },
    {
      id: "rite",
      name: "Shattering Rite",
      why: "Physical and elemental spells, off the north-east spoke toward the axis. Since the revision (2026-10-31) it runs out beside the spoke instead of back toward the start, and Shattering Rite leads on into the last small of the nave's shield aisle: the warded priest, spells behind a shield.",
      at: [-1683, -1463],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [physSpell(12)], at: [-1804, -1515] },
        { id: "b", kind: "small", lines: [physSpell(12)], at: [-1894, -1520] },
        { id: "n", kind: "notable", name: "Shattering Rite", lines: [physSpell(24), eleDamageAll(16), int(10)], at: [-1978, -1534], why: "Physical spells with elemental damage, and the intelligence a caster’s gear asks: the first step toward Faith Unleashed, which turns those spells to lightning: 2 + 1.6 + 1 units." },
      ],
      links: [["a", "b"], ["b", "n"]],
    },
    {
      id: "wheel",
      name: "Choirmaster",
      why: "Auras or minions, the two sides of one wheel, off the north-east spoke.",
      at: [-1784, -2053],
      shape: { kind: 'hand' },
      nodes: [
        { id: "c1", kind: "small", lines: [mana(8)], at: [-1829, -1963] },
        { id: "c2", kind: "small", lines: [reducedReservation(3)], at: [-1879, -2022] },
        { id: "c3", kind: "notable", name: "Choirmaster", lines: [reducedReservation(6), auraEffect(12)], at: [-1874, -2098], why: "Auras held cheaper and stronger, the choir master (its mana line went: one mana notable near home): 2 + 2 units." },
        { id: "c4", kind: "small", lines: [mana(8)], at: [-1739, -2143] },
        { id: "c5", kind: "notable", name: "Shepherd", lines: [minionLife(24), minionDamage(12), minionSpeed(5)], at: [-1695, -2008], why: "Minions that last: 2 + 1 + 1 units. The near crossing to the Spire's flasks leaves here." },
        { id: "c6", kind: "small", lines: [minionLife(12)], at: [-1752, -1958] },
        { id: "c7", kind: "small", lines: [reducedReservation(3)], at: [-1815, -2148] },
        { id: "c8", kind: "small", lines: [minionLife(12)], at: [-1689, -2084] },
      ],
      links: [["c1", "c2"], ["c2", "c3"], ["c3", "c7"], ["c7", "c4"], ["c4", "c8"], ["c8", "c5"], ["c5", "c6"], ["c6", "c1"]],
    },
    {
      id: "font",
      name: "Frozen Font",
      why: "Cold's first rung, off the north-east spoke toward the axis (cold apart from its payoff at the rim). Since the revision (2026-10-31) its three shield-block smalls (left from when the notable carried a shield line) are the head of the nave's shield aisle: they run straight on past Frozen Font (beside them) to Steadfast Faith and the Iron Faith wheel. Kept, not re-lined: the cold caster with a shield takes the font on the way.",
      at: [-2116, -1595],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [shieldBlock(2)], at: [-2047, -1659] },
        { id: "b", kind: "small", lines: [shieldBlock(2)], at: [-2100, -1593] },
        { id: "n", kind: "notable", name: "Frozen Font", lines: [eleDamage('cold', 20), chillEffect(15), freezeChance(8)], at: [-2192, -1635], why: "Cold's first rung, spell and attack alike, chill and freeze (its shield line went: shields have their own homes): 2 + 1.5 + 1 units." },
        { id: "c", kind: "small", lines: [shieldBlock(2)], at: [-2153, -1532] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"], ["b", "c"]],
    },
    {
      id: "loneVow",
      name: "Lone Vow",
      why: "The aura keystone, a spur where the north-east spoke meets the mid ring.",
      at: [-2138, -2175],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [auraEffect(6)], at: [-2132, -2104] },
        { id: "b", kind: "small", lines: [auraEffect(6)], at: [-2137, -2166] },
        { id: "k", kind: "keystone", name: "Lone Vow", lines: [], at: [-2145, -2255] },
      ],
      links: [["a", "b"], ["b", "k"]],
    },
    {
      id: "hymn",
      name: "Hymn",
      why: "Lightning's first home, out from the mid ring's north-east stretch.",
      at: [-2163, -2532],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [eleDamage("lightning", 10)], at: [-2218, -2523] },
        { id: "n", kind: "notable", name: "Hymn", lines: [eleDamage('lightning', 20), shockEffect(15), castSpeed(4)], at: [-2146, -2501], why: "Lightning's first home, the caster's: damage, a deeper shock and faster casting: 2 + 1.5 + 1 units." },
      ],
      links: [["a", "n"]],
    },
    {
      id: "minionSustain",
      name: "Shepherd’s Crook",
      why: "Servants that recover: they regenerate and resist the elements (Shepherd and the Spire’s Familiars sell their life): 2 + 1.9 units.",
      at: [-1435, -2168],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [minionRes(8)], at: [-1666, -2251] },
        { id: "n", kind: "notable", name: "Shepherd’s Crook", lines: [minionRegen(1), minionRes(15)], at: [-1435, -2168], why: "Servants that recover: they regenerate and resist the elements (Shepherd and the Spire’s Familiars sell their life): 2 + 1.9 units." },
      ],
      links: [["s1", "n"]],
    },
  ],
  links: [
    { from: "cathedral.choir.spS.c", to: "cathedral.walk.ring.s1", why: "The south spoke reaches the rim ring." },
    { from: "cathedral.choir.spS.m", to: "cathedral.choir.ring.a", why: "The mid ring on toward the south border." },
    { from: "cathedral.choir.ring.a", to: "spire.well.radW.m", why: "The mid ring meets the Spire's border road." },
    { from: "cathedral.choir.rite.a", to: "cathedral.choir.spS.a", why: "The way in." },
    { from: "cathedral.choir.wheel.c1", to: "cathedral.choir.spS.b", why: "The way in." },
    { from: "cathedral.choir.font.a", to: "cathedral.choir.spS.b", why: "The way in." },
    { from: "cathedral.choir.loneVow.a", to: "cathedral.choir.spS.m", why: "The way in." },
    { from: "cathedral.choir.hymn.a", to: "cathedral.choir.spS.c", why: "The way in." },
    { from: "cathedral.choir.minionSustain.s1", to: "cathedral.choir.ring.a", why: "The way in." },
    { from: "cathedral.choir.wheel.c4", to: "cathedral.choir.minionSustain.s1", why: "A way across between neighbouring clusters, dearer than the roads." },
    { from: "cathedral.choir.font.c", to: "cathedral.nave.wheel.steadfast", why: "The shield aisle (2026-10-31): the Zealot who carries a shield walks the font's shield-block smalls into Steadfast Faith's block recovery, and on into the Iron Faith wheel's shield side (it replaces the font's old link straight to Iron Faith)." },
    { from: "cathedral.choir.rite.n", to: "cathedral.choir.font.c", why: "Shattering Rite leads on (2026-10-31) into the shield aisle's last small: the priest who casts behind a shield takes the rite's spells and walks on to Steadfast Faith's block recovery. Into the last small, not the first, so the rite stays a way on and not a meeting point." },
    { from: "cathedral.choir.font.n", to: "cathedral.nave.wheel.n1", why: "Frozen Font leads on (finalization, 2026-10-31) into the Iron Faith wheel's door small, two steps from Hearthfire: the elemental caster who casts cold and fire takes the font's chill and freeze and walks on to Hearthfire's fire and cast speed. From the spoke to the mid ring it is five steps against the road's three." },
  ],
};
