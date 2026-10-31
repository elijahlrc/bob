/**
 * The Bell Tower: The axis toward the rim: cold, auras, fire’s keystone.
 * Written for the attrition rework from docs/tree/design/R-cathedral.md (2026-10-31).
 */
import { auraEffect, buffDuration, chillEffect, damagePerAura, eleAttackOne, eleDamage, es, freezeChance, int, life, mana, minionDamage, physGainFire, reducedReservation, regenWithMinion, skillDuration } from '../lines';
import type { AreaSpec } from '../types';

export const pyre: AreaSpec = {
  id: "cathedral.pyre",
  region: "zealot",
  name: "The Bell Tower",
  why: "The axis toward the rim: cold, auras, fire’s keystone.",
  at: [-3464, -2000],
  clusters: [
    {
      id: "wheel",
      name: "Rimed Steel",
      why: "Cold attacks or auras, the two sides of one wheel, in from the rim ring at the axis (cold's payoff).",
      at: [-3516, -1822],
      shape: { kind: 'hand' },
      nodes: [
        { id: "f1", kind: "small", lines: [eleAttackOne("cold", 12)], at: [-3606, -1867] },
        { id: "f2", kind: "small", lines: [eleAttackOne("cold", 12)], at: [-3547, -1917] },
        { id: "f3", kind: "notable", name: "Rimed Steel", lines: [eleAttackOne('cold', 24), chillEffect(15), freezeChance(8)], at: [-3471, -1912], why: "Cold strikes that chill and freeze, cold’s payoff at the rim: 2 + 1.5 + 1 units." },
        { id: "f4", kind: "small", lines: [auraEffect(6)], at: [-3427, -1777] },
        { id: "f5", kind: "notable", name: "Benediction", lines: [auraEffect(12), es(8), reducedReservation(4)], at: [-3561, -1733], why: "Aura effect, energy shield and auras that cost less to hold: 2 + 1.6 + 1.3 units." },
        { id: "f6", kind: "small", lines: [auraEffect(6)], at: [-3611, -1791] },
        { id: "f7", kind: "small", lines: [eleAttackOne("cold", 12)], at: [-3420, -1853] },
        { id: "f8", kind: "small", lines: [auraEffect(6)], at: [-3485, -1726] },
        { id: "ire", kind: 'notable', name: "Choir of Wrath", lines: [damagePerAura(12), mana(12)], at: [-3599, -1657], why: "Every aura held sharpens the Zealot: damage for each aura standing (2.4 units at two auras), with the mana to keep casting: 2.4 + 1.5 units." },
      ],
      links: [["f1", "f2"], ["f2", "f3"], ["f3", "f7"], ["f7", "f4"], ["f4", "f8"], ["f8", "f5"], ["f5", "f6"], ["f6", "f1"], ["f5", "ire"]],
    },
    {
      id: "sexton",
      name: "Sexton",
      why: "Minions with life, in from the rim ring at the axis (minions spread).",
      at: [-3336, -2134],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [minionDamage(12)], at: [-3414, -2185] },
        { id: "b", kind: "small", lines: [minionDamage(12)], at: [-3368, -2155] },
        { id: "n", kind: "notable", name: "Sexton", lines: [minionDamage(20), regenWithMinion(0.8), life(5)], at: [-3311, -2117], why: "The gravedigger tends the summoner: minion damage, and the Zealot regenerates while a servant stands: 1.7 + 1.6 + 1 units." },
        { id: "c", kind: "small", lines: [minionDamage(12)], at: [-3252, -2078] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"]],
    },
    {
      id: "searingAvatar",
      name: "Searing Avatar",
      why: "Fire's keystone, a tip past the rim ring.",
      at: [-4106, -2183],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [eleDamage("fire", 10)], at: [-4050, -2145] },
        { id: "b", kind: "small", lines: [eleDamage("fire", 10)], at: [-4099, -2178] },
        { id: "k", kind: "keystone", name: "Searing Avatar", lines: [], at: [-4169, -2225] },
      ],
      links: [["a", "b"], ["b", "k"]],
    },
    {
      id: "procession",
      name: "Procession",
      why: "Auras, in from the rim ring (its movement line goes).",
      at: [-3672, -1483],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [auraEffect(6)], at: [-3751, -1518] },
        { id: "b", kind: "small", lines: [auraEffect(6)], at: [-3701, -1495] },
        { id: "c", kind: "small", lines: [auraEffect(6)], at: [-3650, -1474] },
        { id: "n", kind: "notable", name: "Procession", lines: [buffDuration(20), skillDuration(10), int(10)], at: [-3586, -1445], why: "The procession carries its blessings further: buffs and skill effects last longer, with the intelligence a priest's gear asks (its movement and aura lines went): 2.5 + 1 + 0.7 units." },
      ],
      links: [["a", "b"], ["b", "c"], ["c", "n"]],
    },
    {
      id: "fireRule",
      name: "Faith Aflame",
      why: "Fire's rule: every hit, spell or attack, gains part of its physical damage as fire; the holy warrior's road to Searing Avatar: 2.7 + 1.2 units.",
      at: [-4166, -1685],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [eleDamage('fire', 8)], at: [-4001, -1623] },
        { id: "s2", kind: "small", lines: [eleDamage('fire', 8)], at: [-4084, -1654] },
        { id: "n", kind: "notable", name: "Faith Aflame", lines: [physGainFire(8), eleDamage('fire', 12)], at: [-4166, -1685], why: "Fire's rule: every hit, spell or attack, gains part of its physical damage as fire; the holy warrior's road to Searing Avatar: 2.7 + 1.2 units." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "cathedral.pyre.wheel.f1", to: "cathedral.walk.ring.q4", why: "The way in." },
    { from: "cathedral.pyre.sexton.a", to: "cathedral.walk.ring.q5", why: "The way in." },
    { from: "cathedral.pyre.searingAvatar.a", to: "cathedral.walk.ring.q4", why: "The way in." },
    { from: "cathedral.pyre.procession.a", to: "cathedral.walk.ring.q3", why: "The way in." },
    { from: "cathedral.pyre.fireRule.s1", to: "cathedral.walk.ring.q3", why: "The way in." },
  ],
};
