/**
 * The Practice Ground: The west spoke: swords, axes, one-handed, armour.
 * Written for the attrition rework from docs/tree/design/R-yard.md (2026-10-31).
 */
import { armour, armourVsEle, bleedDamage, bleedDuration, blockRecovery, damageAfterBlock, dex, impaleChance, leechLife, lifeRegen, meleePhys, oneHandMelee, shieldBlock, str, swordDamage } from '../lines';
import type { AreaSpec } from '../types';

export const blades: AreaSpec = {
  id: "yard.blades",
  region: "reaver",
  name: "The Practice Ground",
  why: "The west spoke: swords, axes, one-handed, armour.",
  at: [-1011, 2503],
  clusters: [
    {
      id: "spS",
      name: "The south spoke, outer",
      why: "The south spoke from the cross-road junction out to the mid ring and on toward the rim.",
      at: [-495, 2280],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(6), dex(6)], at: [-495, 2280] },
        { id: "b", kind: "attribute", lines: [str(6), dex(6)], at: [-573, 2553] },
        { id: "m", kind: "attribute", lines: [str(6), dex(6)], at: [-652, 2826] },
        { id: "c", kind: "attribute", lines: [str(6), dex(6)], at: [-809, 3508] },
      ],
      links: [["a", "b"], ["b", "m"], ["m", "c"]],
    },
    {
      id: "ring",
      name: "The mid ring, south",
      why: "The mid ring's stretch between the west spoke and the west border road.",
      at: [-1051, 2669],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(6), dex(6)], at: [-1051, 2669] },
      ],
      links: [],
    },
    {
      id: "mail",
      name: "Mended Mail",
      why: "Armour and regeneration, off the west spoke.",
      at: [-781, 2269],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [lifeRegen(0.4)], at: [-694, 2272] },
        { id: "b", kind: "small", lines: [lifeRegen(0.4)], at: [-752, 2270] },
        { id: "n", kind: "notable", name: "Mended Mail", lines: [armour(24), meleePhys(20)], at: [-810, 2268], why: "Armour that hits back: guard and strike alike." },
        { id: "c", kind: "small", lines: [lifeRegen(0.4)], at: [-868, 2266] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"]],
    },
    {
      id: "keenEdge",
      name: "Keen Edge",
      why: "Swords, west, off the west spoke toward the axis (step 9).",
      at: [-886, 2572],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [swordDamage(10)], at: [-826, 2568] },
        { id: "b", kind: "small", lines: [swordDamage(10)], at: [-889, 2512] },
        { id: "n", kind: "notable", name: "Keen Edge", lines: [swordDamage(24), damageAfterBlock(16)], at: [-946, 2576], why: "The parrying swordsman: a block opens the guard." },
      ],
      links: [["a", "b"], ["b", "n"]],
    },
    {
      id: "lightBlades",
      name: "Light Blades",
      why: "One-handed, west (the Bow’s Light Hand is east), out from the mid ring’s west stretch.",
      at: [-1105, 3035],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [oneHandMelee(10)], at: [-1095, 2968] },
        { id: "n", kind: "notable", name: "Light Blades", lines: [oneHandMelee(24), impaleChance(12)], at: [-1094, 3049], why: "One-handed blades that skewer: impale’s second carrier, unlike the Bow’s Light Hand." },
        { id: "b", kind: "small", lines: [oneHandMelee(10)], at: [-1067, 3113] },
      ],
      links: [["a", "n"], ["n", "b"]],
    },
    {
      id: "crimsonPact",
      name: "Blood Bargain",
      why: "The leech keystone, a spur out from where the west spoke meets the mid ring.",
      at: [-815, 2939],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [leechLife(0.4, ["attack"])], at: [-760, 2901] },
        { id: "b", kind: "small", lines: [leechLife(0.4, ["attack"])], at: [-808, 2934] },
        { id: "k", kind: "keystone", name: "Blood Bargain", lines: [], at: [-877, 2982] },
      ],
      links: [["a", "b"], ["b", "k"]],
    },
    {
      id: "board",
      name: "Sword and Board",
      why: "Swords with a shield, off the west spoke past the mid ring.",
      at: [-1112, 3424],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [swordDamage(10)], at: [-1030, 3447] },
        { id: "b", kind: "small", lines: [swordDamage(10)], at: [-1084, 3432] },
        { id: "n", kind: "notable", name: "Sword and Board", lines: [swordDamage(20), shieldBlock(4), blockRecovery(20)], at: [-1139, 3416], why: "Sword and shield: block, and be ready to block again." },
        { id: "c", kind: "small", lines: [swordDamage(10)], at: [-1195, 3402] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"]],
    },
    {
      id: "lasting",
      name: "Lasting Wounds",
      why: "Bleed duration, off the west spoke past the mid ring, by the bleed payoff and the axes.",
      at: [-439, 3573],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [bleedDamage(12)], at: [-526, 3558] },
        { id: "b", kind: "small", lines: [bleedDamage(12)], at: [-472, 3577] },
        { id: "n", kind: "notable", name: "Lasting Wounds", lines: [bleedDamage(24), bleedDuration(30)], at: [-406, 3601], why: "A cut that will not close: 2 + 2 units." },
      ],
      links: [["a", "b"], ["b", "n"]],
    },
    {
      id: "armour",
      name: "Iron Skin",
      why: "An armour rule, off the west spoke past the mid ring.",
      at: [-1051, 3613],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [armour(10)], at: [-890, 3543] },
        { id: "s2", kind: "small", lines: [armour(10)], at: [-970, 3578] },
        { id: "n", kind: "notable", name: "Iron Skin", lines: [armour(20), armourVsEle(10)], at: [-1051, 3613], why: "An armour rule, off the west spoke past the mid ring." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "yard.blades.spS.c", to: "yard.fosse.ring.s1", why: "The south spoke reaches the rim ring." },
    { from: "yard.blades.spS.m", to: "yard.blades.ring.a", why: "The mid ring on toward the south border." },
    { from: "yard.blades.ring.a", to: "yard.shield.radW.m", why: "The mid ring meets the south border road." },
    { from: "yard.blades.mail.a", to: "yard.blades.spS.a", why: "The way in." },
    { from: "yard.blades.keenEdge.a", to: "yard.blades.spS.b", why: "The way in." },
    { from: "yard.blades.lightBlades.a", to: "yard.blades.ring.a", why: "The way in." },
    { from: "yard.blades.crimsonPact.a", to: "yard.blades.spS.m", why: "The way in." },
    { from: "yard.blades.board.a", to: "yard.blades.spS.c", why: "The way in." },
    { from: "yard.blades.lasting.a", to: "yard.blades.spS.c", why: "The way in." },
    { from: "yard.blades.armour.s1", to: "yard.blades.spS.c", why: "The way in." },
    { from: "yard.blades.keenEdge.n", to: "yard.shield.block.b", why: "Keen Edge to Buckler by its block small (finalization, 2026-10-31). The build: the sword-and-buckler duellist, whose damage after a block wants the light shield's block and speed; Keen Edge led nowhere, and the thinned spoke brought it within eight steps of the start." },
    { from: "yard.blades.lightBlades.b", to: "yard.blades.board.c", why: "Light Blades to Sword and Board (finalization, 2026-10-31). The build: the one-handed sword with a shield, one-hand damage and then the sword that blocks; Sword and Board's far small ended the room." },
    { from: "yard.blades.armour.n", to: "yard.fosse.fortify.s1", why: "Iron Skin to Hold the Line (finalization, 2026-10-31). The build: the armoured stunner, armour against every kind of hit and then fortify earned by the stun, by Hold the Line's armour small." },
  ],
};
