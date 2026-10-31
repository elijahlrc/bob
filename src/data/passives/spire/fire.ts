/**
 * The Lantern: The west toward the rim.
 * Written for the attrition rework from docs/tree/design/R-spire.md (2026-10-31).
 */
import { burnDamage, curseArea, curseEffect, damageVsIgnited, eleDamage, eleDamageAll, es, esFlat, esLeech, igniteChance, manaAsEs, manaLeech, manaOnHit, manaRegen, minionDamage, minionLife, minionSpeed, penetration, recoverOn, resAll, wandAttack, wandSpellDamage } from '../lines';
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
      why: "Energy shield and resistances, in from the rim ring at the border.",
      at: [-1816, -3564],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [es(5)], at: [-1866, -3588] },
        { id: "n", kind: "notable", name: "High Veil", lines: [es(15), resAll(6)], at: [-1841, -3514], why: "3 + 1.5 units. The outer side of the ring." },
        { id: "b", kind: "small", lines: [es(5)], at: [-1766, -3539] },
        { id: "c", kind: "small", lines: [es(5)], at: [-1791, -3615] },
        { id: "n2", kind: 'notable', name: "Moonward", lines: [esFlat(30), recoverOn('crit', 'es', 2)], at: [-1879, -3438], why: "Crits restore the shield." },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"], ["c", "a"], ["n", "n2"]],
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
      why: "Fire's ignite payoff, out from the rim ring where the west spoke meets it.",
      at: [-1065, -4434],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [burnDamage(12)], at: [-1044, -4382] },
        { id: "n", kind: "notable", name: "Cinder", lines: [igniteChance(15), burnDamage(25), damageVsIgnited(20)], at: [-1117, -4413] },
        { id: "b", kind: "small", lines: [burnDamage(12)], at: [-1086, -4486] },
        { id: "c", kind: "small", lines: [burnDamage(12)], at: [-1013, -4455] },
        { id: "n2", kind: 'notable', name: "Warm Hearth", lines: [recoverOn('killIgnited', 'life', 3), recoverOn('killIgnited', 'es', 3), eleDamage('fire', 10)], at: [-1196, -4381], why: "The burning dead feed the caster: fire’s own defence." },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"], ["c", "a"], ["n", "n2"]],
    },
    {
      id: "badCompany",
      name: "Bad Company",
      why: "Minions with curses, out from the rim ring at the border.",
      at: [-2141, -4026],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [minionDamage(12)], at: [-2143, -3970] },
        { id: "b", kind: "small", lines: [minionDamage(12)], at: [-2197, -4028] },
        { id: "n", kind: "notable", name: "Bad Company", lines: [minionDamage(24), curseEffect(16)], at: [-2139, -4082], why: "2 + 2 units. The far side of the ring." },
        { id: "c", kind: "small", lines: [minionDamage(12)], at: [-2085, -4024] },
        { id: "n2", kind: 'notable', name: "Hexed Pack", lines: [curseArea(20), minionLife(15), minionSpeed(5)], at: [-2136, -4167], why: "The cursing minion master’s reach." },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"], ["c", "a"], ["n", "n2"]],
    },
    {
      id: "spiritWard",
      name: "Overflow",
      why: "Spell block with a shield, out from the rim ring.",
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
        { id: "n", kind: "notable", name: "Kiln Heart", lines: [eleDamage('fire', 20), penetration('fire', 6), esLeech(0.3)], at: [-1436, -4288] },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "spire.fire.highVeil.a", to: "spire.rim.ring.w0", why: "The way in." },
    { from: "spire.fire.manaTap.a", to: "spire.rim.ring.q1", why: "The way in." },
    { from: "spire.fire.brightWand.a", to: "spire.rim.ring.q2", why: "The way in." },
    { from: "spire.fire.cinder.a", to: "spire.rim.ring.w1", why: "The way in." },
    { from: "spire.fire.badCompany.a", to: "spire.rim.ring.w0", why: "The way in." },
    { from: "spire.fire.spiritWard.a", to: "spire.rim.ring.q1", why: "The way in." },
    { from: "spire.fire.pyre.s1", to: "spire.rim.ring.q2", why: "The way in." },
  ],
};
