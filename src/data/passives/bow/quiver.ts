/**
 * The Thicket: The axis at and beyond the mid ring: more projectiles, fervour.
 * Written for the attrition rework from docs/tree/design/R-bow.md (2026-10-31).
 */
import { allDamage, attackSpeed, attackSpeedPerFervour, bleedDamage, bleedFaster, bowDamage, critMulti, critMultiWhileElusive, damageStationary, damageWhileQuickened, doubleDamage, eleAttack, elePenetration, extraProjectile, fervourDuration, fervourOnCrit, fervourOnKill, physAttack, projectileDamage } from '../lines';
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
      why: "Fervour on kill, in from the rim ring, beside the Knife’s fervour. Split in two rooms (2026-10-31; Hunter's Fervour was hung one step past Hot Pursuit): Hunter's Fervour stands on its own crit smalls from the next rim node, where Steadfast Aim was, and leads on by a fervour-duration small into Hot Pursuit, so a crit build earns its fervour in one room and spends it in the other.",
      at: [3321, 2157],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a2", kind: "small", lines: [attackSpeed(5)], at: [3349, 2171] },
        { id: "a3", kind: "small", lines: [attackSpeed(5)], at: [3300, 2147] },
        { id: "n", kind: "notable", name: "Hot Pursuit", lines: [fervourOnKill(25), attackSpeedPerFervour(3)], at: [3237, 2115], why: "Fervour from kills, and speed for every charge held." },
        { id: "c", kind: "small", lines: [fervourDuration(15)], at: [3172, 2292], why: "Between earning fervour and spending it: the charges last longer (2026-10-31)." },
        { id: "n2", kind: 'notable', name: "Hunter's Fervour", lines: [fervourOnCrit(20), critMulti(15)], at: [3107, 2470], why: "Fervour from crits as well as kills, so a crit build feeds Hot Pursuit’s speed." },
        { id: "f2", kind: "small", lines: [critMulti(12)], at: [3184, 2512], why: "Hunter's Fervour's own way in (2026-10-31): crit multiplier, for the crit build it serves." },
        { id: "f1", kind: "small", lines: [critMulti(12)], at: [3261, 2555] },
      ],
      links: [["a2", "a3"], ["a3", "n"], ["n", "c"], ["c", "n2"], ["n2", "f2"], ["f2", "f1"]],
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
      why: "The payoff of the two buffs the region hands out: Quickened (kills, blinks) and Elusive (bow crits). Moved out past Close Quarters' tip (2026-10-31) so Skirmisher's Leap's way on can reach it: entered from the mid ring at the axis, where Hunter's Rush's room also comes out through Rapid Fire, or from the blink.",
      at: [2949, 1772],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [allDamage(8)], at: [2572, 1566] },
        { id: "s2", kind: "small", lines: [allDamage(8)], at: [2757, 1684] },
        { id: "n", kind: "notable", name: "Pursuit's End", lines: [damageWhileQuickened(25), critMultiWhileElusive(30)], at: [2949, 1772], why: "The payoff of the two buffs the region hands out: Quickened (kills, blinks) and Elusive (bow crits)." },
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
    { from: "bow.quiver.hotPursuit.f1", to: "bow.rim.ring.q6", why: "Hunter's Fervour's way in, from the rim ring (2026-10-31)." },
  ],
};
