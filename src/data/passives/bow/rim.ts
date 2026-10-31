/**
 * The Far Pasture: North toward the rim: bow crit, traps, the long shot.
 * Written for the attrition rework from docs/tree/design/R-bow.md (2026-10-31).
 */
import { attackPhysToCold, attackSpeed, bowDamage, chillEffect, critChance, dex, eleAttackOne, elusiveOn, evasion, farShot, projectileDamage, weaponCrit, weaponCritMulti } from '../lines';
import type { AreaSpec } from '../types';

export const farPasture: AreaSpec = {
  id: "bow.rim",
  region: "strider",
  name: "The Far Pasture",
  why: "North toward the rim: bow crit, traps, the long shot.",
  at: [3939, 695],
  clusters: [
    {
      id: "ring",
      name: "The rim ring",
      why: "The rim ring across the Bow, from the Knife's border to the Yard's. Thinned in the finalization (2026-10-31): q6 and q8 went from straight runs, and the nodes between the spoke corners were spaced evenly again; their rooms moved to the next node.",
      at: [4237, 419],
      shape: { kind: 'hand' },
      nodes: [
        { id: "q1", kind: "attribute", lines: [dex(7)], at: [4237, 419] },
        { id: "q2", kind: "attribute", lines: [dex(7)], at: [4175, 838] },
        { id: "n1", kind: "attribute", lines: [dex(7)], at: [4112, 1257] },
        { id: "q3", kind: "attribute", lines: [dex(7)], at: [3870, 1676] },
        { id: "q4", kind: "attribute", lines: [dex(7)], at: [3629, 2095] },
        { id: "q5", kind: "attribute", lines: [dex(7)], at: [3387, 2514] },
        { id: "s1", kind: "attribute", lines: [dex(7)], at: [3145, 2933] },
        { id: "q7", kind: "attribute", lines: [dex(7)], at: [2648, 3329] },
        { id: "s0", kind: "attribute", lines: [dex(7)], at: [2150, 3724] },
      ],
      links: [["q1", "q2"], ["q2", "n1"], ["n1", "q3"], ["q3", "q4"], ["q4", "q5"], ["q5", "s1"], ["s1", "q7"], ["q7", "s0"]],
    },
    {
      id: "killShot",
      name: "Kill Shot",
      why: "Bow crit, out from the rim ring at the north spoke.",
      at: [4372, 1295],
      shape: { kind: 'hand' },
      nodes: [
        { id: "c", kind: "small", lines: [bowDamage(10)], at: [4250, 1290] },
        { id: "a", kind: "small", lines: [bowDamage(10)], at: [4320, 1330], why: "Two bow smalls in from the rim (three before the finalization)." },
        { id: "n", kind: "notable", name: "Kill Shot", lines: [weaponCrit('bow', 30), weaponCritMulti('bow', 20), elusiveOn('crit', 15)], at: [4391, 1368], why: "A bow crit makes the archer Elusive: the shot and the slip away." },
        { id: "k1", kind: "small", lines: [critChance(15)], at: [4426, 1309] },
      ],
      links: [["c", "a"], ["a", "n"], ["n", "k1"]],
    },
    {
      id: "haresPace",
      name: "Hare's Pace",
      why: "Evasion and attack speed, in from the rim ring.",
      at: [3930, 483],
      shape: { kind: 'hand' },
      nodes: [
        { id: "e", kind: "small", lines: [evasion(10)], at: [3998, 469] },
        { id: "n", kind: "notable", name: "Hare's Pace", lines: [evasion(20), attackSpeed(10)], at: [3930, 483], why: "2 + 2 units." },
        { id: "s", kind: "small", lines: [attackSpeed(5)], at: [3862, 497] },
      ],
      links: [["e", "n"], ["n", "s"]],
    },
    {
      id: "winter",
      name: "Rime Shafts",
      why: "Cold arrows' payoff, out from the rim ring.",
      at: [4438, 866],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [eleAttackOne('cold', 10)], at: [4263, 847] },
        { id: "s2", kind: "small", lines: [eleAttackOne('cold', 10)], at: [4350, 857] },
        { id: "n", kind: "notable", name: "Rime Shafts", lines: [eleAttackOne('cold', 16), attackPhysToCold(25), chillEffect(15)], at: [4438, 866], why: "Cold arrows' payoff, out from the rim ring." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
    {
      id: "longShot",
      name: "Far Reach",
      why: "Projectiles hit harder the farther they fly: the counterpart of Close Quarters, out from the rim ring.",
      at: [4500, 400],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [projectileDamage(10)], at: [4325, 413] },
        { id: "s2", kind: "small", lines: [projectileDamage(10)], at: [4413, 406] },
        { id: "n", kind: "notable", name: "Far Reach", lines: [farShot(30), projectileDamage(10)], at: [4500, 400], why: "Projectiles hit harder the farther they fly: the counterpart of Close Quarters, out from the rim ring." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "bow.rim.ring.q1", to: "knife.rim.ring.s0", why: "The rim ring meets the Knife's." },
    { from: "bow.rim.killShot.c", to: "bow.rim.ring.n1", why: "The way in." },
    { from: "bow.rim.haresPace.e", to: "bow.rim.ring.q1", why: "The way in." },
    { from: "bow.rim.winter.s1", to: "bow.rim.ring.q2", why: "The way in." },
    { from: "bow.rim.longShot.s1", to: "bow.rim.ring.q1", why: "The way in." },
  ],
};
