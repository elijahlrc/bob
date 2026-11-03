/**
 * The Lantern: The west toward the rim.
 * Written for the attrition rework from docs/tree/design/R-spire.md (2026-10-31).
 */
import { burnDamage, curseArea, curseEffect, damageVsIgnited, eleDamage, eleDamageAll, es, esFlat, esLeech, flaskChargesKilledBy, igniteChance, manaAsEs, manaLeech, manaOnHit, manaRegen, minionDamage, minionLife, minionSpeed, penetration, recoverOn, resAll, spellBlock, wandAttack, wandSpellDamage } from '../lines';
import type { AreaSpec } from '../types';

export const fire: AreaSpec = {
  id: "spire.fire",
  region: "mystic",
  name: "The Lantern",
  why: "The west toward the rim.",
  at: [-1424, -3523],
  clusters: [
    {
      id: "highVeil",
      name: "High Veil",
      why: "Energy shield and resistances, in from the rim ring at the border: the top of the west border's climb (the revision, 2026-10-31), Moonward standing on the climb below it.",
      at: [-1816, -3564],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [es(5)], at: [-1866, -3588] },
        { id: "n", kind: "notable", name: "High Veil", lines: [es(15), resAll(6)], at: [-1841, -3514], why: "3 + 1.5 units. The outer side of the ring." },
        { id: "b", kind: "small", lines: [es(5)], at: [-1766, -3539] },
        { id: "c", kind: "small", lines: [es(5)], at: [-1791, -3615] },
        { id: "n2", kind: 'notable', name: "Moonward", lines: [esFlat(30), recoverOn('crit', 'es', 2)], at: [-1790, -3410], why: "Crits restore the shield. Since the revision (2026-10-31) a crossroads of the climb: in from High Veil's ring by a small (not through High Veil), down the border by mana to Bound Host, and across the border by a spell block small to the Cathedral's Twofold Guard." },
        { id: "x", kind: "small", lines: [spellBlock(2)], at: [-2025, -3290], why: "Across the border: spell block, the warded caster's half of a shield, toward Twofold Guard's block with one." },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"], ["c", "a"], ["b", "n2"], ["n2", "x"]],
    },
    {
      id: "manaTap",
      name: "Mana Tap",
      why: "Mana leech, in from the rim ring.",
      at: [-1483, -3672],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [manaLeech(0.4, ["spell"])], at: [-1533, -3710] },
        { id: "b", kind: "small", lines: [manaLeech(0.4, ["spell"])], at: [-1486, -3674] },
        { id: "n", kind: "notable", name: "Mana Tap", lines: [manaLeech(0.8, ["spell"]), manaOnHit(6, ["spell"])], at: [-1430, -3633], why: "2 + 1.5 units." },
      ],
      links: [["a", "b"], ["b", "n"]],
    },
    {
      id: "brightWand",
      name: "Bright Wand",
      why: "Elemental wand attacks and wand spells, beside fire, in from the rim ring.",
      at: [-1136, -3835],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [wandAttack(12)], at: [-1178, -3872] },
        { id: "n", kind: "notable", name: "Bright Wand", lines: [wandAttack(18), wandSpellDamage(18), eleDamageAll(10)], at: [-1099, -3877] },
        { id: "b", kind: "small", lines: [wandAttack(12)], at: [-1094, -3798] },
        { id: "c", kind: "small", lines: [wandAttack(12)], at: [-1173, -3793] },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"], ["c", "a"]],
    },
    {
      id: "cinder",
      name: "Cinder",
      why: "Fire's ignite payoff, out from the rim ring where the west spoke meets it. Since the revision (2026-10-31) fire's ladder's top rung: Warm Hearth joins it to Kiln Heart, so the two fire rooms past the rim are one way across, slower than the rim ring.",
      at: [-1065, -4434],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [burnDamage(12)], at: [-1044, -4382] },
        { id: "n", kind: "notable", name: "Cinder", lines: [igniteChance(15), burnDamage(25), damageVsIgnited(20)], at: [-1117, -4413] },
        { id: "b", kind: "small", lines: [burnDamage(12)], at: [-1086, -4486] },
        { id: "c", kind: "small", lines: [burnDamage(12)], at: [-1013, -4455] },
        { id: "n2", kind: 'notable', name: "Warm Hearth", lines: [recoverOn('killIgnited', 'life', 1.8), recoverOn('killIgnited', 'es', 3), eleDamage('fire', 10)], at: [-1230, -4505], why: "The burning dead feed the caster: fire’s own defence. Between the two fire rooms, reached round Cinder's ring without taking Cinder." },
        { id: "h", kind: "small", lines: [burnDamage(12)], at: [-1335, -4395], why: "Burning, the thread between ignite (Cinder) and the fire payoff (Kiln Heart)." },
        { id: "n3", kind: "notable", name: "Ember Tithe", lines: [flaskChargesKilledBy('ignite', 50)], at: [-900, -4500], why: "The Spire's charges-on-kill notable (the flask-lines pass, 2026-11-01): flasks fill only from enemies the burning itself kills, so it pays the igniter who lets the fire finish the work. Off Cinder's ring by a burning small, not through Cinder, at step 12 (12 or more from every start). 50 / 12 = 4.2 units, about a regeneration notable of the region (Quiet Pulse 4.3); the line alone, as a far notable may." },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"], ["c", "a"], ["b", "n2"], ["n2", "h"], ["c", "n3"]],
    },
    {
      id: "badCompany",
      name: "Bad Company",
      why: "Minions with curses, out from the rim ring at the border: past the rim, the west border's climb goes on through it (the revision, 2026-10-31), by Hexed Pack into Overflow.",
      at: [-2141, -4026],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [minionDamage(12)], at: [-2143, -3970] },
        { id: "b", kind: "small", lines: [minionDamage(12)], at: [-2197, -4028] },
        { id: "n", kind: "notable", name: "Bad Company", lines: [minionDamage(24), curseEffect(16)], at: [-2139, -4082], why: "2 + 2 units. The far side of the ring." },
        { id: "c", kind: "small", lines: [minionDamage(12)], at: [-2085, -4024] },
        { id: "n2", kind: 'notable', name: "Hexed Pack", lines: [curseArea(20), minionLife(15), minionSpeed(5)], at: [-2230, -4150], why: "The cursing minion master’s reach. Off the ring's small, not its notable, and on toward Overflow: the summoner who wants the reach need not take Bad Company." },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"], ["c", "a"], ["b", "n2"]],
    },
    {
      id: "spiritWard",
      name: "Overflow",
      why: "Mana as energy shield, out from the rim ring: the top of the west border's climb, where the mana that fed the minions at its foot becomes shield.",
      at: [-1818, -4182],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [manaRegen(10)], at: [-1810, -4143] },
        { id: "n", kind: "notable", name: "Overflow", lines: [manaRegen(20), manaAsEs(6)], at: [-1788, -4209] },
        { id: "b", kind: "small", lines: [manaRegen(10)], at: [-1857, -4195] },
      ],
      links: [["a", "n"], ["n", "b"]],
    },
    {
      id: "pyre",
      name: "Kiln Heart",
      why: "Fire's payoff, out from the rim ring.",
      at: [-1436, -4288],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [eleDamage('fire', 10)], at: [-1386, -4119] },
        { id: "s2", kind: "small", lines: [eleDamage('fire', 10)], at: [-1411, -4204] },
        { id: "n", kind: "notable", name: "Kiln Heart", lines: [eleDamage('fire', 20), penetration('fire', 6), esLeech(0.2)], at: [-1436, -4288], why: "Fire's payoff, out from the rim ring." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "spire.fire.highVeil.a", to: "spire.rim.ring.w0", why: "The way in." },
    { from: "spire.fire.manaTap.a", to: "spire.rim.ring.q1", why: "The way in." },
    { from: "spire.fire.brightWand.a", to: "spire.rim.ring.w1", why: "The way in (finalization, 2026-10-31: the rim's straight run from the border to the west spoke went from two nodes to one; Bright Wand now opens where the spoke meets the rim)." },
    { from: "spire.fire.cinder.a", to: "spire.rim.ring.w1", why: "The way in." },
    { from: "spire.fire.badCompany.a", to: "spire.rim.ring.w0", why: "The way in." },
    { from: "spire.fire.spiritWard.a", to: "spire.rim.ring.q1", why: "The way in." },
    { from: "spire.fire.pyre.s1", to: "spire.rim.ring.q1", why: "The way in (finalization, 2026-10-31: q1 moved to the middle of the straight run)." },
    { from: "spire.fire.cinder.h", to: "spire.fire.pyre.n", why: "Fire's ladder's top rung (the revision, 2026-10-31): Warm Hearth's burning small into Kiln Heart. Walked by the igniter, who wants Cinder's ignites, Warm Hearth's recovery from the burning dead and Kiln Heart's penetration, in one walk past the rim." },
    { from: "spire.fire.badCompany.n2", to: "spire.fire.spiritWard.b", why: "The border climb past the rim (the revision, 2026-10-31): Hexed Pack on into Overflow. Walked by the cursing summoner who stacks mana for his minions (Familiars) and turns it to shield at the top. Since finalization Hexed Pack meets Overflow's small itself (the mana small between them went)." },
    { from: "spire.fire.highVeil.x", to: "cathedral.walk.guard.b", why: "Across the border into the Cathedral's Twofold Guard (the revision, 2026-10-31), outside the mid ring where no road runs. Walked by the warded caster who carries a shield, Mystic or Zealot: Moonward's shield, then block and spell block, a slower way between the regions than the rim ring." },
  ],
};
