/**
 * The centre's generic notables (docs/tree/design/R-centre.md): one at each junction for the pair of classes either
 * side, two at the middle for every class. Generic sustain and utility only (the owner's decision 7 of 2026-10-19), no
 * keystones. They sit 10 to 15 steps from every start, so each is priced as a home generalist (about 4 units): a build
 * walks this far only for a notable worth the points.
 * First written by scripts/passives/rework/centre-gen.ts; edited by hand since the revision of 2026-10-31 (R-revise.md
 * §7): every junction room opens inward. The three rooms at the junctions without a spoke are yokes (their junction
 * outside, an arm to each spoke beside them inside); the three at the spoked junctions open onto their own spoke.
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
      why: "At the junction of the Mystic and the Shade, which has no spoke to the middle. A yoke since the revision (2026-10-31): the room's door is on its junction, and from the notable an arm of stun avoidance runs inward to each spoke beside it (s1, s5), so the room is the Mystic's and the Shade's way in to the middle through their own junction, a step dearer than the road round by the next junction (4 against 3) and paying a notable on the way.",
      at: [410,-424],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [stunAvoid(15)], at: [443,-567], why: "Stun avoidance on the way in." },
        { id: 'n', kind: 'notable', name: "Firm Footing", lines: [stunAvoid(50), stunRecovery(30)], at: [410,-424], why: "Stun protection, which neither home sells by this seam (Hale Scribe, Spoils, Hoarded Breath and Low Tide sell life, mana and energy shield): priced as a home generalist (it sits 10 to 15 steps from every start)." },
        { id: 's1', kind: 'small', lines: [stunAvoid(15)], at: [442,-212], why: "The yoke's arm to the spoke at the Shade–Strider junction (2026-10-31): the room's own stat, one small, so the arm is slower than the road round." },
        { id: 's5', kind: 'small', lines: [stunAvoid(15)], at: [86,-418], why: "The yoke's arm to the spoke at the Zealot–Mystic junction (2026-10-31), across the cell under the Mystic's start: the room's own stat." },
      ],
      links: [['a', 'n'], ['n', 's1'], ['n', 's5']],
    },
    {
      id: 'hardLiving',
      name: "Hard Living",
      why: "At the junction of the Shade and the Strider, a side room toward the middle. Since the revision (2026-10-31) its notable opens on the spoke beside it (s1), and so on into both yokes' arms there: a way in, not a tip.",
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
      why: "At the junction of the Strider and the Reaver, which has no spoke to the middle. A yoke since the revision (2026-10-31): the room's door is on its junction, and from the notable an arm of cheaper skills runs inward to each spoke beside it (s1, s3), so the room is the Strider's and the Reaver's way in to the middle through their own junction, a step dearer than the road round (4 against 3) and paying a notable on the way.",
      at: [163,567],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [costReduction(3)], at: [270,668], why: "Cheaper skills on the way in." },
        { id: 'n', kind: 'notable', name: "Waste Not", lines: [costReduction(10), manaOnKill(15)], at: [163,567], why: "Cheaper skills and mana on kill, which neither home sells by this seam (Quick Sip, Killing Pace, Wanderer and Thirsty Quiver sell flasks, speed, attributes and leech): priced as a home generalist (it sits 10 to 15 steps from every start)." },
        { id: 's1', kind: 'small', lines: [costReduction(3)], at: [319,284], why: "The yoke's arm to the spoke at the Shade–Strider junction (2026-10-31), across the cell under the Strider's start: the room's own stat." },
        { id: 's3', kind: 'small', lines: [costReduction(3)], at: [-37,489], why: "The yoke's arm to the spoke at the Reaver–Vanguard junction (2026-10-31): the room's own stat, one small, so the arm is slower than the road round." },
      ],
      links: [['a', 'n'], ['n', 's1'], ['n', 's3']],
    },
    {
      id: 'soundBody',
      name: "Sound Body",
      why: "At the junction of the Reaver and the Vanguard, a side room toward the middle. Since the revision (2026-10-31) its notable opens on the spoke beside it (s3), and so on into both yokes' arms there: a way in, not a tip.",
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
      why: "At the junction of the Vanguard and the Zealot, which has no spoke to the middle. A yoke since the revision (2026-10-31): the room's door is on its junction, and from the notable an arm of movement runs inward to each spoke beside it (s3, s5), so the room is the Vanguard's and the Zealot's way in to the middle through their own junction, a step dearer than the road round (4 against 3) and paying a notable on the way.",
      at: [-572,-143],
      shape: { kind: 'hand' },
      nodes: [
        { id: 'a', kind: 'small', lines: [moveSpeed(3)], at: [-713,-100], why: "Movement on the way in." },
        { id: 'n', kind: 'notable', name: "Quick March", lines: [moveSpeed(10), cooldownRecovery(15)], at: [-572,-143], why: "Movement and cooldowns, which neither home sells by this seam (Camp Stores, Vigil, Alms and Iron Lungs sell flasks, regeneration, leech and mana): priced as a home generalist (it sits 10 to 15 steps from every start)." },
        { id: 's3', kind: 'small', lines: [moveSpeed(3)], at: [-405,134], why: "The yoke's arm to the spoke at the Reaver–Vanguard junction (2026-10-31), across the cell under the Vanguard's start: the room's own stat." },
        { id: 's5', kind: 'small', lines: [moveSpeed(3)], at: [-405,-277], why: "The yoke's arm to the spoke at the Zealot–Mystic junction (2026-10-31): the room's own stat, one small, so the arm is slower than the road round." },
      ],
      links: [['a', 'n'], ['n', 's3'], ['n', 's5']],
    },
    {
      id: 'shelter',
      name: "Shelter",
      why: "At the junction of the Zealot and the Mystic, a side room toward the middle. Since the revision (2026-10-31) its notable opens on the spoke beside it (s5), and so on into both yokes' arms there: a way in, not a tip.",
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
    { from: 'firmFooting.s1', to: 'centre.ring.road.s1', why: "Firm Footing's yoke reaches the spoke on the Shade's side (2026-10-31): from j0, 4 steps against the road's 3 by h0 and j1." },
    { from: 'firmFooting.s5', to: 'centre.ring.road.s5', why: "Firm Footing's yoke reaches the spoke on the Mystic's side (2026-10-31): from j0, 4 steps against the road's 3 by h5 and j5." },
    { from: 'wasteNot.s1', to: 'centre.ring.road.s1', why: "Waste Not's yoke reaches the spoke on the Strider's side (2026-10-31): from j2, 4 steps against the road's 3 by h1 and j1." },
    { from: 'wasteNot.s3', to: 'centre.ring.road.s3', why: "Waste Not's yoke reaches the spoke on the Reaver's side (2026-10-31): from j2, 4 steps against the road's 3 by h2 and j3." },
    { from: 'quickMarch.s3', to: 'centre.ring.road.s3', why: "Quick March's yoke reaches the spoke on the Vanguard's side (2026-10-31): from j4, 4 steps against the road's 3 by h3 and j3." },
    { from: 'quickMarch.s5', to: 'centre.ring.road.s5', why: "Quick March's yoke reaches the spoke on the Zealot's side (2026-10-31): from j4, 4 steps against the road's 3 by h4 and j5." },
    { from: 'hardLiving.n', to: 'centre.ring.road.s1', why: "Hard Living opens on its own spoke (2026-10-31): the junction's room becomes a way from the junction to the spoke, 3 steps against the road's 1, and on into the yokes of Firm Footing and Waste Not. Each spoked room opens only on its own spoke, so every class's two junction notables cost the same to take together." },
    { from: 'soundBody.n', to: 'centre.ring.road.s3', why: "Sound Body opens on its own spoke (2026-10-31): 3 steps from j3 against the road's 1, and on into the yokes of Waste Not and Quick March." },
    { from: 'shelter.n', to: 'centre.ring.road.s5', why: "Shelter opens on its own spoke (2026-10-31): 3 steps from j5 against the road's 1, and on into the yokes of Quick March and Firm Footing. Resistances are the centre's most wanted notable, and now it leads on." },
  ],
};
