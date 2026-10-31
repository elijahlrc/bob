/**
 * The Vestry: The south-west spoke: staves and sceptres.
 * Written for the attrition rework from docs/tree/design/R-cathedral.md (2026-10-31).
 */
import { areaDamage, blockAttack, costReduction, eleDamageAll, esFlat, int, resAll, shieldDef, shieldSpellBlock, spellBlock, spellDamage, staffDamage, str, totemDamage, weaponCrit, weaponDamage } from '../lines';
import type { AreaSpec } from '../types';

export const rods: AreaSpec = {
  id: "cathedral.rods",
  region: "zealot",
  name: "The Vestry",
  why: "The south-west spoke: staves and sceptres.",
  at: [-2674, -376],
  clusters: [
    {
      id: "spN",
      name: "The north spoke, outer",
      why: "The north spoke from the cross-road junction out to the mid ring and on toward the rim.",
      at: [-2222, -712],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(6), int(6)], at: [-2222, -712] },
        { id: "b", kind: "attribute", lines: [str(6), int(6)], at: [-2497, -780] },
        { id: "m", kind: "attribute", lines: [str(6), int(6)], at: [-2773, -848] },
        { id: "c", kind: "attribute", lines: [str(6), int(6)], at: [-3442, -1052] },
      ],
      links: [["a", "b"], ["b", "m"], ["m", "c"]],
    },
    {
      id: "ring",
      name: "The mid ring, north",
      why: "The mid ring's stretch between the Wall's border road and the south-west spoke.",
      at: [-2836, -424],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(6), int(6)], at: [-2836, -424] },
      ],
      links: [],
    },
    {
      id: "buttress",
      name: "Buttress",
      why: "Spell block and resistances, off the south-west spoke toward the axis. Since the revision (2026-10-31) the head of the nave's staff aisle: its spell-block smalls run straight on past the notable (Buttress beside them, Zeal coming in to it) into the staff smalls toward Whirling Ward and Warding Staff.",
      at: [-2121, -836],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [spellBlock(2)], at: [-2193, -781] },
        { id: "b", kind: "small", lines: [spellBlock(2)], at: [-2171, -861] },
        { id: "n", kind: "notable", name: "Buttress", lines: [spellBlock(4), resAll(10)], at: [-2068, -859], why: "Spell block and all resistances: 2 + 2.5 units." },
        { id: "c", kind: "small", lines: [spellBlock(2)], at: [-2148, -940] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"], ["b", "c"]],
    },
    {
      id: "wheel",
      name: "Gilded Rod",
      why: "Sceptres or staves, the two sides of one wheel, off the south-west spoke (step 9).",
      at: [-2670, -519],
      shape: { kind: 'hand' },
      nodes: [
        { id: "r1", kind: "small", lines: [eleDamageAll(10)], at: [-2615, -602] },
        { id: "r2", kind: "small", lines: [weaponDamage("sceptre", 10)], at: [-2572, -539] },
        { id: "r3", kind: "notable", name: "Gilded Rod", lines: [weaponDamage('sceptre', 24), weaponCrit('sceptre', 15), str(10)], at: [-2586, -464], why: "Sceptre damage and crit, and the strength a sceptre asks: 2 + 1 + 1 units." },
        { id: "r4", kind: "small", lines: [eleDamageAll(10)], at: [-2725, -435] },
        { id: "r5", kind: "notable", name: "Quarterstaff", lines: [staffDamage(24), blockAttack(3), areaDamage(10)], at: [-2754, -574], why: "Staff damage, the block a staff gives, and area for the sweeps: 2 + 1.5 + 1 units." },
        { id: "r6", kind: "small", lines: [staffDamage(12)], at: [-2690, -617] },
        { id: "r7", kind: "small", lines: [weaponDamage("sceptre", 10)], at: [-2650, -421] },
        { id: "r8", kind: "small", lines: [staffDamage(12)], at: [-2768, -499] },
      ],
      links: [["r1", "r2"], ["r2", "r3"], ["r3", "r7"], ["r7", "r4"], ["r4", "r8"], ["r8", "r5"], ["r5", "r6"], ["r6", "r1"]],
    },
    {
      id: "idleHands",
      name: "Idle Hands",
      why: "The staff keystone, a spur where the south-west spoke meets the mid ring.",
      at: [-2953, -764],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [totemDamage(12)], at: [-2892, -792] },
        { id: "b", kind: "small", lines: [totemDamage(12)], at: [-2945, -768] },
        { id: "k", kind: "keystone", name: "Idle Hands", lines: [], at: [-3022, -732] },
      ],
      links: [["a", "b"], ["b", "k"]],
    },
    {
      id: "wheel",
      name: "Homily",
      why: "Spells or spell block with a shield, the two sides of one wheel, out from the mid ring's south-west stretch.",
      at: [-3244, -485],
      shape: { kind: 'hand' },
      nodes: [
        { id: "m1", kind: "small", lines: [spellBlock(2)], at: [-3146, -470] },
        { id: "m2", kind: "small", lines: [spellDamage(8)], at: [-3184, -404] },
        { id: "m3", kind: "notable", name: "Homily", lines: [spellDamage(16), eleDamageAll(10), costReduction(5)], at: [-3258, -386], why: "Elemental spells, cheaper to cast: 2 + 1 + 1.3 units." },
        { id: "m4", kind: "small", lines: [spellBlock(2)], at: [-3343, -499] },
        { id: "m5", kind: "notable", name: "Glass Wall", lines: [shieldSpellBlock(4), shieldDef(15), esFlat(20)], at: [-3229, -584], why: "Spell block behind a shield, shield defences and energy shield: 2 + 1 + 1.3 units." },
        { id: "m6", kind: "small", lines: [spellBlock(2)], at: [-3163, -545] },
        { id: "m7", kind: "small", lines: [spellDamage(8)], at: [-3324, -425] },
        { id: "m8", kind: "small", lines: [spellBlock(2)], at: [-3304, -566] },
      ],
      links: [["m1", "m2"], ["m2", "m3"], ["m3", "m7"], ["m7", "m4"], ["m4", "m8"], ["m8", "m5"], ["m5", "m6"], ["m6", "m1"]],
    },
  ],
  links: [
    { from: "cathedral.rods.spN.c", to: "cathedral.walk.ring.n1", why: "The north spoke reaches the rim ring." },
    { from: "cathedral.rods.ring.a", to: "wall.resists.radW.m", why: "The mid ring meets the Wall's border road." },
    { from: "cathedral.rods.ring.a", to: "cathedral.rods.spN.m", why: "The mid ring meets the north spoke." },
    { from: "cathedral.rods.spN.m", to: "cathedral.nave.ring.a", why: "The mid ring on toward the axis." },
    { from: "cathedral.rods.buttress.a", to: "cathedral.rods.spN.a", why: "The way in." },
    { from: "cathedral.rods.wheel.r1", to: "cathedral.rods.spN.b", why: "The way in." },
    { from: "cathedral.rods.idleHands.a", to: "cathedral.rods.spN.m", why: "The way in." },
    { from: "cathedral.rods.wheel.m1", to: "cathedral.rods.ring.a", why: "The way in." },
  ],
};
