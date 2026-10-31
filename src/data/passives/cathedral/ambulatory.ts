/**
 * The Ambulatory: The Wall's border: sceptres with armour, fire attacks, leech, warcries.
 * Written for the attrition rework from docs/tree/design/R-cathedral.md (2026-10-31).
 */
import { armour, avoidAilments, brandDamage, critChance, eleAttackOne, eleDamageAll, igniteChance, igniteDuration, int, leechLife, life, lifeOnHit, manaOnHit, recoverOn, str, weaponDamage } from '../lines';
import type { AreaSpec } from '../types';

export const ambulatory: AreaSpec = {
  id: "cathedral.ambulatory",
  region: "zealot",
  name: "The Ambulatory",
  why: "The Wall's border: sceptres with armour, fire attacks, leech, warcries.",
  at: [-2497, -131],
  clusters: [
    {
      id: "tithe",
      name: "Alms",
      why: "Leech, off the Wall's border road (generic ground: the Vanguard's near ground).",
      at: [-2070, -199],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [leechLife(0.4, ["attack"])], at: [-2043, -56] },
        { id: "n", kind: "notable", name: "Alms", lines: [leechLife(1, ['attack']), lifeOnHit(6, ['attack'])], at: [-2056, -126], why: "Leech and life on hit with attacks, generic ground on the Wall's border road (renamed: Tithe is a relic): 2.5 + 1.5 units." },
        { id: "b", kind: "small", lines: [leechLife(0.4, ["attack"])], at: [-2070, -193] },
        { id: "c", kind: "attribute", lines: [str(6), int(6)], at: [-2110, -421] },
      ],
      links: [["a", "n"], ["n", "b"], ["b", "c"]],
    },
    {
      id: "plate",
      name: "Pilgrim's Mantle",
      why: "Armour and stun recovery, off the Wall's border road (generic ground).",
      at: [-2476, -260],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [armour(12)], at: [-2474, -213] },
        { id: "n", kind: "notable", name: "Pilgrim's Mantle", lines: [avoidAilments(20), life(10)], at: [-2510, -274], why: "Ailments shrugged off and life, generic ground on the Wall's border road (the Wall sells armour, stun and grit there): 2 + 2 units." },
        { id: "b", kind: "small", lines: [armour(12)], at: [-2443, -293] },
      ],
      links: [["a", "n"], ["n", "b"]],
    },
    {
      id: "kindled",
      name: "Kindled Steel",
      why: "Fire attacks, off the south-west spoke past the mid ring. Since the revision (2026-10-31) a way from the spoke's junction to the rim: Ember Litany has its own two fire-attack smalls in from the rim node, so the fire striker walks Kindled Steel, Ember Litany and on to the rim's fire (Brazier, Censer), slower than the spoke between the two.",
      at: [-3557, -1020],
      shape: { kind: 'hand' },
      nodes: [
        { id: "e1", kind: "small", lines: [eleAttackOne("fire", 12)], at: [-4029, -1102], why: "Ember Litany's way in from the rim (2026-10-31)." },
        { id: "e2", kind: "small", lines: [eleAttackOne("fire", 12)], at: [-3877, -1026], why: "Ember Litany's way in from the rim (2026-10-31)." },
        { id: "a", kind: "small", lines: [eleAttackOne("fire", 12)], at: [-3497, -1037] },
        { id: "b", kind: "small", lines: [eleAttackOne("fire", 12)], at: [-3553, -1021] },
        { id: "n", kind: "notable", name: "Kindled Steel", lines: [eleAttackOne("fire", 24), igniteChance(10), igniteDuration(15)], at: [-3621, -1002], why: "Fire with attacks and the ignite a fire strike leaves: 2 + 1 + 1 units." },
        { id: "ember", kind: 'notable', name: "Ember Litany", lines: [recoverOn('killIgnited', 'life', 4), eleAttackOne('fire', 12)], at: [-3703, -979], why: "The fire striker feeds on the burning: killing an ignited enemy mends 4% of life: 3.2 + 1 units." },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "ember"], ["e1", "e2"], ["e2", "ember"]],
    },
    {
      id: "brand",
      name: "Brandwright",
      why: "Brand crit, off the south-west spoke past the mid ring (brands spread).",
      at: [-3114, -1485],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [brandDamage(12)], at: [-3174, -1406] },
        { id: "b", kind: "small", lines: [brandDamage(12)], at: [-3161, -1464] },
        { id: "n", kind: "notable", name: "Brandwright", lines: [brandDamage(24), critChance(30, ["brand"])], at: [-3147, -1532], why: "Brand damage and crit chance with brands: 2 + 2 units (G3 round 2; it was brand damage, elemental damage and cast speed, which drew every caster)." },
        { id: "c", kind: "small", lines: [brandDamage(12)], at: [-3071, -1517] },
        { id: "d", kind: "small", lines: [brandDamage(12)], at: [-3017, -1506] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"], ["c", "d"]],
    },
    {
      id: "verger",
      name: "Verger",
      why: "Sceptres with armour, out from where the Wall's border road meets the mid ring (past 8 from the Vanguard).",
      at: [-3513, -215],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [armour(12)], at: [-3452, -194] },
        { id: "b", kind: "small", lines: [armour(12)], at: [-3500, -222] },
        { id: "n", kind: "notable", name: "Verger", lines: [weaponDamage('sceptre', 24), manaOnHit(6), eleDamageAll(8)], at: [-3560, -256], why: "The sceptre-bearing caster-warrior: sceptre damage, mana back on every hit, and elemental damage (its armour line went: one armour line near the Vanguard): 2 + 1.5 + 0.8 units." },
        { id: "c", kind: "small", lines: [armour(12)], at: [-3540, -189] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"]],
    },
  ],
  links: [
    { from: "cathedral.ambulatory.tithe.a", to: "wall.resists.radW.a", why: "The way in." },
    { from: "cathedral.ambulatory.plate.a", to: "wall.resists.radW.b", why: "The way in." },
    { from: "cathedral.ambulatory.kindled.a", to: "cathedral.rods.spN.c", why: "The way in." },
    { from: "cathedral.ambulatory.kindled.e1", to: "cathedral.walk.ring.n1", why: "Ember Litany's door on the rim (2026-10-31), where Brazier's sceptre fire goes out." },
    { from: "cathedral.ambulatory.brand.a", to: "cathedral.rods.spN.c", why: "The way in." },
    { from: "cathedral.ambulatory.verger.a", to: "wall.resists.radW.m", why: "The way in." },
  ],
};
