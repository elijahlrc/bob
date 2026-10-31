/**
 * The Battlements: The north border: totems, resistances, auras, elemental maces, the Cathedral seam.
 * Written for the attrition rework from docs/tree/design/R-wall.md (2026-10-31).
 */
import { armour, auraEffect, costReduction, eleAttack, gritDuration, life, lifeRegenPerGrit, maceDamage, manaFlat, manaOnHit, maxGrit, maxResAll, reducedReservation, resAll, str, stunAvoid, totemDamage } from '../lines';
import type { AreaSpec } from '../types';

export const resists: AreaSpec = {
  id: "wall.resists",
  region: "vanguard",
  name: "The Battlements",
  why: "The north border: totems, resistances, auras, elemental maces, the Cathedral seam. (Since the revision, 2026-10-31, its Unbroken and Tempered wheel stands apart from it, as the keep in the axis cell.)",
  at: [-2497, 131],
  clusters: [
    {
      id: "radW",
      name: "The south border road",
      why: "From the Cathedral seam out along the border to the mid ring: the ground between the two regions beyond the starts.",
      at: [-2033, 0],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "attribute", lines: [str(7)], at: [-2033, 0] },
        { id: "b", kind: "attribute", lines: [str(7)], at: [-2467, 0] },
        { id: "m", kind: "attribute", lines: [str(7)], at: [-2900, 0] },
      ],
      links: [["a", "b"], ["b", "m"]],
    },
    {
      id: "ironLungs",
      name: "Iron Lungs",
      why: "Mana from melee, off the north border road.",
      at: [-2070, 199],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [manaOnHit(4, ["melee"])], at: [-2057, 129] },
        { id: "n", kind: "notable", name: "Iron Lungs", lines: [manaOnHit(8), costReduction(8)], at: [-2089, 198], why: "Mana from melee and cheaper blows (unlike the Yard’s mana on hit with leech)." },
        { id: "b", kind: "small", lines: [manaOnHit(4, ["melee"])], at: [-2064, 270] },
      ],
      links: [["a", "n"], ["n", "b"]],
    },
    {
      id: "banner",
      name: "Warlord's Banner",
      why: "Auras, shared with the Cathedral, off the north border road (step 9).",
      at: [-2476, 260],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [reducedReservation(3)], at: [-2474, 200] },
        { id: "b", kind: "small", lines: [reducedReservation(3)], at: [-2476, 255] },
        { id: "n", kind: "notable", name: "Warlord's Banner", lines: [reducedReservation(5), auraEffect(8), manaFlat(30)], at: [-2479, 325], why: "1.7 + 1.3 + 1.5 units: what an aura carrier wants from a banner, reserving less and the aura stronger." },
      ],
      links: [["a", "b"], ["b", "n"]],
    },
    {
      id: "unbroken",
      name: "Unbroken",
      why: "The keep (the revision, 2026-10-31): resistances or one more grit charge, the two sides of one wheel, moved from the border road's mid ring junction into the empty middle of the axis cell between the mid ring and the rim. It has no road door: it is entered through the rooms round it, the grit loop drawn in rooms. On its west pair of smalls (a, d) the rooms that earn grit from the rim (Hammer Rhythm's mace hits, Iron Voice's warcries); on its east pair (b, c) the rooms that spend it (Shield Ram's block per charge, Heavy Hands' speed per charge). Going from an earning room to a spending room crosses the wheel by one of its notables: Unbroken (hold more grit, longer) or Tempered (hold against the elements). Going between two earning rooms, or two spending rooms, takes neither.",
      at: [-2990, 1800],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [life(5)], at: [-3064, 1757] },
        { id: "n1", kind: "notable", name: "Unbroken", lines: [maxGrit(1), gritDuration(25)], at: [-2990, 1715], why: "One more grit charge, and the charges last longer: the keep's grit side." },
        { id: "b", kind: "small", lines: [life(5)], at: [-2916, 1757] },
        { id: "c", kind: "small", lines: [resAll(4)], at: [-2916, 1843] },
        { id: "n2", kind: "notable", name: "Tempered", lines: [maxResAll(1), resAll(4), armour(16)], at: [-2990, 1885], why: "+1% to maximum resistances (2 units by the table, more in play), 1 unit of resistance and 1.3 of armour: 4.3. The keep's other side (2026-10-31): the grit build that crosses the keep this way holds against the elements instead of holding more. (Its armour came from Elemental Ward in G3: a strength build that comes here for it leaves the home's armour behind.)" },
        { id: "d", kind: "small", lines: [resAll(4)], at: [-3064, 1843] },
        { id: "g1", kind: "small", lines: [gritDuration(15)], at: [-3245, 1822], why: "The approach from Iron Voice (2026-10-31): the keep's approaches are grit held longer." },
        { id: "g2", kind: "small", lines: [gritDuration(15)], at: [-3436, 1560], why: "The approach from Hammer Rhythm, first of two (2026-10-31)." },
        { id: "g3", kind: "small", lines: [gritDuration(15)], at: [-3250, 1659], why: "The approach from Hammer Rhythm, second of two (2026-10-31)." },
        { id: "g4", kind: "small", lines: [gritDuration(15)], at: [-3040, 2068], why: "The approach to Heavy Hands (2026-10-31)." },
      ],
      links: [["a", "n1"], ["n1", "b"], ["b", "c"], ["c", "n2"], ["n2", "d"], ["d", "a"], ["d", "g1"], ["a", "g3"], ["g3", "g2"], ["c", "g4"]],
    },
    {
      id: "posts",
      name: "Graven Posts",
      why: "Totems with resistances, out from the mid ring’s north stretch, toward the Cathedral’s totems.",
      at: [-3173, 418],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [totemDamage(12)], at: [-3113, 419] },
        { id: "b", kind: "small", lines: [totemDamage(12)], at: [-3168, 418] },
        { id: "n", kind: "notable", name: "Graven Posts", lines: [totemDamage(29), resAll(7)], at: [-3238, 417] },
      ],
      links: [["a", "b"], ["b", "n"]],
    },
    {
      id: "hammer",
      name: "Hallowed Hammer",
      why: "Elemental maces, the Cathedral seam’s theme, in from the mid ring’s north stretch.",
      at: [-2692, 212],
      shape: { kind: 'hand' },
      nodes: [
        { id: "a", kind: "small", lines: [maceDamage(14)], at: [-2745, 289] },
        { id: "b", kind: "small", lines: [maceDamage(14)], at: [-2714, 244] },
        { id: "n", kind: "notable", name: "Hallowed Hammer", lines: [maceDamage(24), eleAttack(24)], at: [-2674, 186] },
        { id: "c", kind: "small", lines: [maceDamage(14)], at: [-2635, 128] },
      ],
      links: [["a", "b"], ["b", "n"], ["n", "c"]],
    },
    {
      id: "spirit",
      name: "Bulwark Spirit",
      why: "Grit-shaped sustain at the Cathedral border: every charge mends.",
      at: [-2903, 264],
      shape: { kind: 'hand' },
      nodes: [
        { id: "s1", kind: "small", lines: [stunAvoid(10)], at: [-2901, 88] },
        { id: "s2", kind: "small", lines: [stunAvoid(10)], at: [-2902, 176] },
        { id: "n", kind: "notable", name: "Bulwark Spirit", lines: [lifeRegenPerGrit(0.4), stunAvoid(30)], at: [-2903, 264], why: "Grit-shaped sustain at the Cathedral border: every charge mends." },
      ],
      links: [["s1", "s2"], ["s2", "n"]],
    },
  ],
  links: [
    { from: "wall.resists.ironLungs.a", to: "wall.resists.radW.a", why: "The way in." },
    { from: "wall.resists.banner.a", to: "wall.resists.radW.b", why: "The way in." },
    { from: "wall.resists.banner.n", to: "wall.resists.hammer.c", why: "A way across inside the mid ring (2026-10-31): Warlord's Banner into Hallowed Hammer's far small, the holy warrior's kit at the Cathedral border (an aura carried, an elemental mace swung), slower than the road between their doors." },
    { from: "wall.resists.unbroken.g1", to: "wall.grit.ironVoice.d", why: "The keep's west gate: Iron Voice's warcries earn the grit (2026-10-31), its far small on into the keep." },
    { from: "wall.resists.unbroken.g2", to: "wall.grit.rhythm.c", why: "The keep's west gate: Hammer Rhythm's mace hits earn the grit (2026-10-31), its far small on into the keep." },
    { from: "wall.resists.unbroken.b", to: "wall.maces.ram.b", why: "The keep's east gate: Shield Ram spends the grit as block (2026-10-31), its far small straight onto the wheel." },
    { from: "wall.resists.unbroken.g4", to: "wall.grit.heavyHands.b", why: "The keep's east gate: Heavy Hands spends the grit as two-handed speed (2026-10-31)." },
    { from: "wall.resists.posts.a", to: "wall.rampart.ring.a", why: "The way in." },
    { from: "wall.resists.hammer.a", to: "wall.rampart.ring.a", why: "The way in." },
    { from: "wall.resists.spirit.s1", to: "wall.resists.radW.m", why: "The way in." },
  ],
};
