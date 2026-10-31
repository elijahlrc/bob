/**
 * The Thicket: The axis at and beyond the mid ring: more projectiles, fervour.
 * Written for the attrition rework from docs/tree/design/R-bow.md (2026-10-31).
 */
import { allDamage, attackSpeed, attackSpeedPerFervour, bleedDamage, bleedFaster, bowDamage, critMulti, critMultiWhileElusive, damageStationary, damageWhileQuickened, doubleDamage, eleAttack, elePenetration, extraProjectile, fervourOnCrit, fervourOnKill, physAttack, projectileDamage } from '../lines';
import type { AreaSpec } from '../types';

export const quiver: AreaSpec = {
  id: "bow.quiver",
  region: "strider",
  name: "The Thicket",
  why: "The axis at and beyond the mid ring: more projectiles, fervour.",
  at: [2621, 1835],
  clusters: [
    {
      id: "wheel",
      name: "Split Volley and Deep Cuts",
      why: "More projectiles or deeper bleeding, out from the mid ring east of the axis.",
      at: [2431, 2004],
      shape: { kind: 'hand' },
      nodes: [
        { id: "e", kind: "small", lines: [bowDamage(10)], at: [2372, 1820] },
        { id: "a1", kind: "small", lines: [projectileDamage(10)], at: [2517, 1775] },
        { id: "a2", kind: "small", lines: [projectileDamage(10)], at: [2622, 1782] },
        { id: "n1", kind: "notable", name: "Split Volley", lines: [extraProjectile(1)], at: [2709, 1814], why: "An extra projectile: 4 units by the table, and the line a thrown or bow build reshapes itself around." },
        { id: "n2", kind: "notable", name: "Deep Cuts", lines: [bleedDamage(30), physAttack(12), bleedFaster(10)], at: [2384, 2223], why: "2.5 + 1.2 + 1 units." },
        { id: "c2", kind: "small", lines: [bleedDamage(12)], at: [2363, 2113] },
        { id: "c1", kind: "small", lines: [bleedDamage(12)], at: [2366, 1972] },
      ],
      links: [["e", "c1"], ["a1", "a2"], ["a2", "n1"], ["n2", "c2"], ["c2", "c1"]],
    },
    {
      id: "hotPursuit",
      name: "Hot Pursuit",
      why: "Fervour on kill, in from the rim ring, beside the Knife’s fervour.",
      at: [3321, 2157],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a2", kind: "small", lines: [attackSpeed(5)], at: [3349, 2171] },
        { id: "a3", kind: "small", lines: [attackSpeed(5)], at: [3300, 2147] },
        { id: "n", kind: "notable", name: "Hot Pursuit", lines: [fervourOnKill(25), attackSpeedPerFervour(3)], at: [3237, 2115], why: "Fervour from kills, and speed for every charge held." },
        { id: "n2", kind: 'notable', name: "Hunter's Fervour", lines: [fervourOnCrit(20), critMulti(15)], at: [3161, 2077], why: "Fervour from crits as well as kills, so a crit build feeds Hot Pursuit’s speed." },
      ],
      links: [["a2", "a3"], ["a3", "n"], ["n", "n2"]],
    },
    {
      id: "tellingShot",
      name: "Telling Shot",
      why: "Bows with double damage, out from the rim ring at the axis.",
      at: [4048, 2099],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s2", kind: "small", lines: [bowDamage(10)], at: [4021, 2084] },
        { id: "s3", kind: "small", lines: [bowDamage(10)], at: [4069, 2111] },
        { id: "n", kind: "notable", name: "Telling Shot", lines: [bowDamage(16), doubleDamage(6), damageStationary(20)], at: [4130, 2144], why: "The archer who stands and shoots, against Wayfarer’s kiter." },
      ],
      links: [["s2", "s3"], ["s3", "n"]],
    },
    {
      id: "forces",
      name: "Storm-Feathered",
      why: "Elemental attacks’ payoff, out from the rim ring at the axis.",
      at: [3756, 2403],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [eleAttack(10)], at: [3607, 2310] },
        { id: "s2", kind: "small", lines: [eleAttack(10)], at: [3681, 2356] },
        { id: "n", kind: "notable", name: "Storm-Feathered", lines: [eleAttack(16), elePenetration(4)], at: [3756, 2403], why: "Elemental attacks’ payoff, out from the rim ring at the axis." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
    {
      id: "pursuit",
      name: "Pursuit's End",
      why: "The payoff of the two buffs the region hands out: Quickened (kills, blinks) and Elusive (bow crits).",
      at: [2616, 1616],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [allDamage(8)], at: [2503, 1481] },
        { id: "s2", kind: "small", lines: [allDamage(8)], at: [2560, 1548] },
        { id: "n", kind: "notable", name: "Pursuit's End", lines: [damageWhileQuickened(25), critMultiWhileElusive(30)], at: [2616, 1616], why: "The payoff of the two buffs the region hands out: Quickened (kills, blinks) and Elusive (bow crits)." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "bow.quiver.wheel.e", to: "bow.quiver.wheel.a1", why: "The wheel's other side (the old file joined it from outside)." },
    { from: "bow.quiver.wheel.e", to: "bow.flight.ring.c", why: "The way in." },
    { from: "bow.quiver.hotPursuit.a2", to: "bow.rim.ring.q5", why: "The way in." },
    { from: "bow.quiver.tellingShot.s2", to: "bow.rim.ring.q4", why: "The way in." },
    { from: "bow.quiver.forces.s1", to: "bow.rim.ring.q5", why: "The way in." },
    { from: "bow.quiver.pursuit.s1", to: "bow.flight.ring.b", why: "The way in." },
    { from: "bow.quiver.hotPursuit.a3", to: "bow.string.elusive.n", why: "A way across between neighbouring clusters, dearer than the roads." },
  ],
};
