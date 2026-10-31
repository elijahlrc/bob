/**
 * The Gallery: The east toward the rim.
 * Written for the attrition rework from docs/tree/design/R-spire.md (2026-10-31).
 */
import { castSpeed, costReduction, critChance, critVsShocked, damageVsRare, dodgeAttack, dodgeSpell, eleDamage, es, esOnHit, penetration, reducedReservation, shockDuration, shockEffect, spellExtraProjectile, spellProjectile, wandAttack, wandChain, wandPhysAsLightning, weaponCrit, weaponCritMulti, weaponSpeed } from '../lines';
import type { AreaSpec } from '../types';

export const storm: AreaSpec = {
  id: "spire.storm",
  region: "mystic",
  name: "The Gallery",
  why: "The east toward the rim.",
  at: [1424, -3523],
  clusters: [
    {
      id: "overcharge",
      name: "Live Current",
      why: "Lightning's second rung (shock), off the east spoke past the mid ring.",
      at: [1188, -3451],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [shockEffect(10)], at: [1133, -3459] },
        { id: "n", kind: "notable", name: "Live Current", lines: [eleDamage('lightning', 12), shockEffect(25), shockDuration(20)], at: [1196, -3506] },
        { id: "b", kind: "small", lines: [shockEffect(10)], at: [1243, -3443] },
        { id: "c", kind: "small", lines: [shockEffect(10)], at: [1180, -3396] },
        { id: "n2", kind: 'notable', name: "Conductor", lines: [shockEffect(15), reducedReservation(4), esOnHit(4)], at: [1208, -3590], why: "The shocker’s sustain." },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"], ["c", "a"], ["n", "n2"]],
    },
    {
      id: "wandVolley",
      name: "Wand Volley",
      why: "Wand attack speed, off the east spoke past the mid ring toward the axis.",
      at: [439, -3573],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [wandAttack(12)], at: [507, -3561] },
        { id: "n", kind: "notable", name: "Wand Volley", lines: [wandAttack(24), weaponSpeed("wand", 12)], at: [437, -3566], why: "2 + 2.4 units." },
        { id: "b", kind: "small", lines: [wandAttack(12)], at: [372, -3592] },
        { id: "n2", kind: 'notable', name: "Hail of Sparks", lines: [wandAttack(16), wandChain(1)], at: [417, -3483], why: "Wand attacks spray from target to target." },
      ],
      links: [["a", "n"], ["n", "b"], ["n", "n2"]],
    },
    {
      id: "mistWalk",
      name: "Mist Walk",
      why: "Dodge, in from the rim ring beside the Knife's.",
      at: [1611, -3618],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [dodgeSpell(3)], at: [1641, -3672] },
        { id: "b", kind: "small", lines: [dodgeSpell(3)], at: [1613, -3622] },
        { id: "n", kind: "notable", name: "Mist Walk", lines: [dodgeSpell(6), dodgeAttack(3), es(6)], at: [1579, -3560] },
      ],
      links: [["a", "b"], ["b", "n"]],
    },
    {
      id: "needlework",
      name: "Needlework",
      why: "Crit with attacks, in from the rim ring.",
      at: [1387, -3709],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [critChance(15)], at: [1380, -3802] },
        { id: "b", kind: "small", lines: [critChance(15)], at: [1384, -3747] },
        { id: "n", kind: "notable", name: "Needlework", lines: [wandAttack(16), wandPhysAsLightning(15), critChance(15)], at: [1389, -3678] },
        { id: "c", kind: "small", lines: [critChance(15)], at: [1395, -3608] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"]],
    },
    {
      id: "longChant",
      name: "Recital",
      why: "Spells with mana regeneration, in from the rim ring at the east spoke.",
      at: [1086, -3839],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [castSpeed(4)], at: [1064, -3904] },
        { id: "b", kind: "small", lines: [castSpeed(4)], at: [1092, -3858] },
        { id: "n", kind: "notable", name: "Recital", lines: [costReduction(8), damageVsRare(20)], at: [1129, -3797] },
        { id: "c", kind: "small", lines: [castSpeed(4)], at: [1059, -3797] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"]],
    },
    {
      id: "pinpoint",
      name: "Pinpoint",
      why: "Wand crit, out from the rim ring at the east spoke.",
      at: [1103, -4425],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [wandAttack(12)], at: [1058, -4346] },
        { id: "b", kind: "small", lines: [wandAttack(12)], at: [1091, -4391] },
        { id: "n", kind: "notable", name: "Pinpoint", lines: [wandAttack(20), weaponCrit("wand", 20), weaponCritMulti("wand", 12)], at: [1132, -4447], why: "1.67 + 1.33 + 1 units." },
        { id: "c", kind: "small", lines: [wandAttack(12)], at: [1131, -4516] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"]],
    },
    {
      id: "arc",
      name: "Arc",
      why: "Lightning's payoff, out from the rim ring.",
      at: [1499, -4260],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [eleDamage('lightning', 10)], at: [1407, -4110] },
        { id: "s2", kind: "small", lines: [eleDamage('lightning', 10)], at: [1453, -4185] },
        { id: "n", kind: "notable", name: "Arc", lines: [eleDamage('lightning', 16), penetration('lightning', 5), critVsShocked(30)], at: [1499, -4260] },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
    {
      id: "volley",
      name: "Volley",
      why: "Projectiles' second home, with Darting Bolts.",
      at: [1903, -4098],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [spellProjectile(10)], at: [1805, -3952] },
        { id: "s2", kind: "small", lines: [spellProjectile(10)], at: [1854, -4025] },
        { id: "n", kind: "notable", name: "Volley", lines: [spellProjectile(15), spellExtraProjectile(1)], at: [1903, -4098] },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "spire.storm.overcharge.a", to: "spire.craft.spE.c", why: "The way in." },
    { from: "spire.storm.wandVolley.a", to: "spire.craft.spE.c", why: "The way in." },
    { from: "spire.storm.mistWalk.a", to: "spire.rim.ring.q8", why: "The way in." },
    { from: "spire.storm.needlework.a", to: "spire.rim.ring.q7", why: "The way in." },
    { from: "spire.storm.longChant.a", to: "spire.rim.ring.e1", why: "The way in." },
    { from: "spire.storm.pinpoint.a", to: "spire.rim.ring.e1", why: "The way in." },
    { from: "spire.storm.arc.s1", to: "spire.rim.ring.q7", why: "The way in." },
    { from: "spire.storm.volley.s1", to: "spire.rim.ring.q8", why: "The way in." },
    { from: "spire.storm.needlework.c", to: "spire.storm.mistWalk.n", why: "A way across between neighbouring clusters, dearer than the roads." },
  ],
};
