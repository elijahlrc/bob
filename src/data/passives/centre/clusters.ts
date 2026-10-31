/**
 * The centre's generic notables (docs/tree/design/R-centre.md, written by scripts/passives/rework/centre-gen.ts): one at
 * each junction for the pair of classes either side, two at the middle for every class. Generic sustain and utility
 * only (the owner's decision 7 of 2026-10-19), no keystones. They sit 10 to 15 steps from every start, so each is priced as
 * a home generalist (about 4 units): a build walks this far only for a notable worth the points.
 */
import {
  allAttr,
  avoidAilments,
  cooldownRecovery,
  costReduction,
  flaskEffect,
  flaskRecovery,
  life,
  lifeOnHit,
  lifeOnKill,
  manaOnKill,
  manaRegen,
  moveSpeed,
  resAll,
  resOne,
  stunAvoid,
  stunRecovery,
} from '../lines';
import type { AreaSpec } from '../types';

export const clusters: AreaSpec = {
  id: 'centre.inner',
  region: 'centre',
  name: 'The common ground',
  why: 'Eight generic notables: one at each junction for the pair of classes either side, two at the middle for every class.',
  at: [0, 620],
  clusters: [
    {
      id: 'firmFooting',
      name: "Firm Footing",
      why: "At the junction of the Mystic and the Shade, a side room toward the middle.",
      at: [410,-424],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [stunAvoid(15)], at: [443,-567], why: "Stun avoidance on the way in." },
        { id: 'n', kind: 'notable', name: "Firm Footing", lines: [stunAvoid(50), stunRecovery(30)], at: [410,-424], why: "Stun protection, which neither home sells by this seam (Hale Scribe, Spoils, Hoarded Breath and Low Tide sell life, mana and energy shield): priced as a home generalist (it sits 10 to 15 steps from every start)." },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'hardLiving',
      name: "Hard Living",
      why: "At the junction of the Shade and the Strider, a side room toward the middle.",
      at: [572,143],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [lifeOnKill(8)], at: [713,100], why: "Life on kill on the way in." },
        { id: 'n', kind: 'notable', name: "Hard Living", lines: [lifeOnHit(10), lifeOnKill(20)], at: [572,143], why: "Life on hit and on kill, which neither home sells by this seam (Clear Head, Soft Step, Grey Cloak and Ward of Smoke sell mana, evasion and resistances): priced as a home generalist (it sits 10 to 15 steps from every start)." },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'wasteNot',
      name: "Waste Not",
      why: "At the junction of the Strider and the Reaver, a side room toward the middle.",
      at: [163,567],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [costReduction(3)], at: [270,668], why: "Cheaper skills on the way in." },
        { id: 'n', kind: 'notable', name: "Waste Not", lines: [costReduction(10), manaOnKill(15)], at: [163,567], why: "Cheaper skills and mana on kill, which neither home sells by this seam (Quick Sip, Killing Pace, Wanderer and Thirsty Quiver sell flasks, speed, attributes and leech): priced as a home generalist (it sits 10 to 15 steps from every start)." },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'soundBody',
      name: "Sound Body",
      why: "At the junction of the Reaver and the Vanguard, a side room toward the middle.",
      at: [-410,424],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [resOne('chaos', 8)], at: [-443,567], why: "Chaos resistance on the way in." },
        { id: 'n', kind: 'notable', name: "Sound Body", lines: [resOne('chaos', 25), avoidAilments(20)], at: [-410,424], why: "Chaos resistance and ailments shrugged off, which neither home sells by this seam (Ringing Blows, Guarded and Vampiric Strikes sell melee damage, armour, evasion and leech): priced as a home generalist (it sits 10 to 15 steps from every start)." },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'quickMarch',
      name: "Quick March",
      why: "At the junction of the Vanguard and the Zealot, a side room toward the middle.",
      at: [-572,-143],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [moveSpeed(3)], at: [-713,-100], why: "Movement on the way in." },
        { id: 'n', kind: 'notable', name: "Quick March", lines: [moveSpeed(10), cooldownRecovery(15)], at: [-572,-143], why: "Movement and cooldowns, which neither home sells by this seam (Camp Stores, Vigil, Alms and Iron Lungs sell flasks, regeneration, leech and mana): priced as a home generalist (it sits 10 to 15 steps from every start)." },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'shelter',
      name: "Shelter",
      why: "At the junction of the Zealot and the Mystic, a side room toward the middle.",
      at: [-163,-567],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [resAll(4)], at: [-270,-668], why: "Resistances on the way in." },
        { id: 'n', kind: 'notable', name: "Shelter", lines: [resAll(12), life(8)], at: [-163,-567], why: "Resistances, which neither home sells by this seam (Draught, Bright Omen, Kept Vows and Quickening sell flasks, damage, auras and recharge): priced as a home generalist (it sits 10 to 15 steps from every start)." },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'wellRounded',
      name: "Well Rounded",
      why: 'At the middle, shared by every class.',
      at: [-280,0],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [allAttr(3)], at: [-150,0], why: "Attributes on the way in." },
        { id: 'n', kind: 'notable', name: "Well Rounded", lines: [allAttr(12), life(8)], at: [-280,0], why: "Attributes every build needs for its gear, at the middle: as far from every start: priced as a home generalist (it sits 10 to 15 steps from every start)." },
      ],
      links: [['a', 'n']],
    },
    {
      id: 'provisions',
      name: "Provisions",
      why: 'At the middle, shared by every class.',
      at: [140,242],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [flaskRecovery(8)], at: [75,130], why: "Flask recovery on the way in." },
        { id: 'n', kind: 'notable', name: "Provisions", lines: [flaskEffect(12), flaskRecovery(15), manaRegen(10)], at: [140,242], why: "Flasks, the attrition lever, at the middle: as far from every start: priced as a home generalist; provisional until the flask stats (CONSTRAINTS §16.2)." },
      ],
      links: [['a', 'n']],
    },
  ],
  links: [
    { from: 'centre.ring.road.j0', to: 'firmFooting.a', why: "The junction of the Mystic and the Shade opens onto its notable." },
    { from: 'centre.ring.road.j1', to: 'hardLiving.a', why: "The junction of the Shade and the Strider opens onto its notable." },
    { from: 'centre.ring.road.j2', to: 'wasteNot.a', why: "The junction of the Strider and the Reaver opens onto its notable." },
    { from: 'centre.ring.road.j3', to: 'soundBody.a', why: "The junction of the Reaver and the Vanguard opens onto its notable." },
    { from: 'centre.ring.road.j4', to: 'quickMarch.a', why: "The junction of the Vanguard and the Zealot opens onto its notable." },
    { from: 'centre.ring.road.j5', to: 'shelter.a', why: "The junction of the Zealot and the Mystic opens onto its notable." },
    { from: 'centre.ring.road.m', to: 'wellRounded.a', why: "The middle opens onto its notable." },
    { from: 'centre.ring.road.m', to: 'provisions.a', why: "The middle opens onto its notable." },
  ],
};
