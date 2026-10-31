/**
 * The Column: The axis at the mid ring.
 * Written for the attrition rework from docs/tree/design/R-spire.md (2026-10-31).
 */
import { avoidAilments, burnDamage, castSpeed, chillEffect, chilledLessDamage, coldDot, crossElement, eleDamage, eleDamageAll, es, int, projectileSpeed, resAll, resOne, skillDuration, spellArea, spellAreaDamage, spellProjectile } from '../lines';
import type { AreaSpec } from '../types';

export const column: AreaSpec = {
  id: "spire.column",
  region: "mystic",
  name: "The Column",
  why: "The axis at the mid ring.",
  at: [0, -3000],
  clusters: [
    {
      id: "ring",
      name: "The mid ring, centre",
      why: "The mid ring's stretch across the axis between the two spokes.",
      at: [-326, -2826],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [int(7)], at: [-326, -2826] },
        { id: "b", kind: "attribute", lines: [int(7)], at: [0, -2826] },
        { id: "c", kind: "attribute", lines: [int(7)], at: [326, -2826] },
      ],
      links: [["a", "b"], ["b", "c"]],
    },
    {
      id: "star",
      name: "Prism Ward",
      why: "Resistances, in from the mid ring at the axis.",
      at: [0, -2610],
      shape: { kind: 'hand' },
      nodes: [
        { id: "n", kind: "notable", name: "Prism Ward", lines: [resAll(8), avoidAilments(20)], at: [0, -2610], why: "2 + 2 units." },
        { id: "s", kind: "small", lines: [resOne("fire", 10)], at: [0, -2680] },
        { id: "w", kind: "small", lines: [resOne("cold", 10)], at: [70, -2610] },
        { id: "e", kind: "small", lines: [resOne("lightning", 10)], at: [-70, -2610] },
        { id: "f", kind: "small", lines: [resOne("chaos", 10)], at: [0, -2540] },
      ],
      links: [["n", "s"], ["n", "w"], ["n", "e"], ["n", "f"]],
    },
    {
      id: "hoarfrost",
      name: "Hoarfrost",
      why: "Cold's first rung, out from the mid ring at the axis.",
      at: [-82, -3149],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [eleDamage("cold", 10)], at: [-68, -3095] },
        { id: "n", kind: "notable", name: "Hoarfrost", lines: [eleDamage("cold", 16), chillEffect(15), es(8)], at: [-136, -3135], why: "1.6 + 1.5 + 1.6 units." },
        { id: "b", kind: "small", lines: [eleDamage("cold", 10)], at: [-96, -3203] },
        { id: "c", kind: "small", lines: [eleDamage("cold", 10)], at: [-28, -3163] },
        { id: "n2", kind: 'notable', name: "Rime", lines: [chillEffect(15), chilledLessDamage(10)], at: [-218, -3114], why: "The chill as a defence: chilled enemies hit softer." },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"], ["c", "a"], ["n", "n2"]],
    },
    {
      id: "broadWeave",
      name: "Broad Weave",
      why: "Spell area, out from the mid ring west of the axis.",
      at: [-496, -3131],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [spellArea(8)], at: [-469, -3082] },
        { id: "n", kind: "notable", name: "Broad Weave", lines: [spellArea(16), spellAreaDamage(12), int(10)], at: [-545, -3104], why: "2 + 1.5 + 0.7 units." },
        { id: "b", kind: "small", lines: [spellArea(8)], at: [-523, -3180] },
        { id: "c", kind: "small", lines: [spellArea(8)], at: [-447, -3158] },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"], ["c", "a"]],
    },
    {
      id: "dartingBolts",
      name: "Darting Bolts",
      why: "Spell projectiles, out from the mid ring east of the axis.",
      at: [520, -3107],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [spellProjectile(10)], at: [488, -3061] },
        { id: "n", kind: "notable", name: "Darting Bolts", lines: [spellProjectile(20), projectileSpeed(10), castSpeed(4)], at: [474, -3139], why: "2 + 1 + 1 units." },
        { id: "b", kind: "small", lines: [spellProjectile(10)], at: [552, -3153] },
        { id: "c", kind: "small", lines: [spellProjectile(10)], at: [566, -3075] },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"], ["c", "a"]],
    },
    {
      id: "lingering",
      name: "Slow Burn",
      why: "Elemental damage over time, out from the mid ring along the axis; a dearer link across to Hoarfrost.",
      at: [150, -3427],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [skillDuration(10)], at: [160, -3393] },
        { id: "n", kind: "notable", name: "Slow Burn", lines: [burnDamage(20), coldDot(10), skillDuration(10)], at: [140, -3461] },
      ],
      links: [["a", "n"]],
    },
    {
      id: "meet",
      name: "Fire and Frost",
      why: "The two-element path, between fire's road and cold's axis.",
      at: [-404, -2735],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [eleDamageAll(8)], at: [-569, -2796] },
        { id: "s2", kind: "small", lines: [eleDamageAll(8)], at: [-487, -2765] },
        { id: "n", kind: "notable", name: "Fire and Frost", lines: [eleDamage('fire', 12), eleDamage('cold', 12), crossElement(20)], at: [-404, -2735] },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "spire.column.ring.c", to: "spire.craft.spE.m", why: "The mid ring meets the east spoke." },
    { from: "spire.column.star.s", to: "spire.column.ring.b", why: "The way in." },
    { from: "spire.column.hoarfrost.a", to: "spire.column.ring.b", why: "The way in." },
    { from: "spire.column.broadWeave.a", to: "spire.column.ring.a", why: "The way in." },
    { from: "spire.column.dartingBolts.a", to: "spire.column.ring.c", why: "The way in." },
    { from: "spire.column.lingering.a", to: "spire.column.ring.c", why: "The way in." },
    { from: "spire.column.meet.s1", to: "spire.well.spW.m", why: "The way in." },
    { from: "spire.column.lingering.a", to: "spire.column.hoarfrost.c", why: "A way across between neighbouring clusters, dearer than the roads." },
  ],
};
