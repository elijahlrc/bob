# G3 round 2: the centre's four new arches (CE-1 to CE-4)

2026-10-22. The four arches of G1-brief §3, added to `src/data/passives/centre/clusters.ts` (area `centre.inner`).
`ring.ts` is unchanged: no ring link moved, and every new link lands on an existing ring node. Not registered, not baked.

Pictures: `centre/before.png`, `centre/after.png` (box −900,−900 to 900,900), `centre/after-ne.png` (close-up of Firm
Footing, box 100,−800 to 600,−300).

## The arches

Each is laid exactly like the four old arches (Shelter, Quick March, Well Rounded, Provisions), rotated onto its
diagonal: the notable 612 out on the angle of the even ring node between two homes' ring links, linked to it; two smalls
650 out at 5.4° either side, each linked to the notable and to the odd ring node on its side, which is that home's own
ring link. The chain ring node → small → notable is straight (the geometry check lists no bend at any of the eight
smalls). Every notable is 2 + 1 = 3 units, like the four old arches; every small is one unit of the arch's lead.

| arch | name         | between          | notable at   | notable lines                                       | units | smalls (both)        | links                                       |
| ---- | ------------ | ---------------- | ------------ | --------------------------------------------------- | ----- | -------------------- | ------------------------------------------- |
| CE-1 | Firm Footing | Mystic, Shade    | (306, −530)  | 40% avoid stun; 15% reduced stun duration on you    | 2 + 1 | 20% avoid stun       | r2–n; r1–a (271,−591); b (376,−530)–r3      |
| CE-2 | Hard Living  | Strider, Reaver  | (306, 530)   | +8 life on hit; +10 life on kill                    | 2 + 1 | +4 life on hit       | r10–n; r9–a (376,530); b (271,591)–r11      |
| CE-3 | Sound Body   | Reaver, Vanguard | (−306, 530)  | +16% chaos resistance; 10% avoid elemental ailments | 2 + 1 | +8% chaos resistance | r14–n; r13–a (−271,591); b (−376,530)–r15   |
| CE-4 | Waste Not    | Zealot, Mystic   | (−306, −530) | 8% reduced mana cost; +10 mana on kill              | 2 + 1 | 4% reduced mana cost | r22–n; r21–a (−376,−530); b (−271,−591)–r23 |

Line functions: `stunAvoid`, `stunRecovery`, `lifeOnHit`, `lifeOnKill`, `resOne('chaos', …)`, `avoidAilments`,
`costReduction`, `manaOnKill`, all existing in `lines.ts` and all read by the sheet and the fight
(`calc/defence.ts`, `calc/skill.ts`, `sim/combat.ts`).

Judgement calls:

- **3 units, not more.** The task allows 3 to 5; the ledger's reason for the centre (anything this close to two starts is
  cheap for everyone, so it must not be strong) and the four old arches both say 3.
- **Life on hit is untagged** in Hard Living. Every region's life on hit is tagged attack or melee; here it is left plain
  so a spell or totem build crossing the ring gets it too, which keeps the centre generic (CONSTRAINTS §4.7). Written in
  the cluster's `why`.
- **Chaos-resistance smalls at +8 (one unit)**, not the +10 most regions' resist stars use, so the small is exactly one
  unit like every other arch small.
- **Ring nodes r1, r11, r13 and r23 now carry five links** (two ring neighbours, the home's link, a foot of the old arch,
  a foot of the new one). The brief accepted this; in `after.png` each fans cleanly (out, along the ring both ways, and
  inward to either side), with no crossing.

Names are our own plain words: none is found by a case-insensitive grep of `reference/tree/ref-tree.json`, none appears
elsewhere in `src/`, and `src/data/ip.test.ts` passes.

## Steps from each start

Points to reach the notable (the audit's measure: never through a start). The old four in the last columns for
comparison.

| start    | Firm Footing | Hard Living | Sound Body | Waste Not | Shelter | Quick March | Well Rounded | Provisions |
| -------- | ------------ | ----------- | ---------- | --------- | ------- | ----------- | ------------ | ---------- |
| Mystic   | **6**        | 14          | 14         | **6**     | 6       | 10          | 16           | 10         |
| Shade    | **6**        | 10          | 14         | 10        | 8       | 6           | 12           | 14         |
| Strider  | 9            | **5**       | 9          | 13        | 11      | 5           | 7            | 13         |
| Reaver   | 14           | **6**       | **6**      | 14        | 16      | 10          | 6            | 10         |
| Vanguard | 13           | 10          | **6**      | 9         | 11      | 14          | 8            | 5          |
| Zealot   | 10           | 14          | 10         | **6**     | 8       | 14          | 12           | 6          |

Each arch is 5 or 6 from both of its homes, as the brief said. The paths run start signature small → hub → the home's
ring road (attribute nodes) → the notable through the ring node or the small.

## Do any start's first steps read as all defence or all offence?

Notables within six points of each start, with the arches added (from the scratch steps script):

- **Mystic:** First Light (spell damage, mana, ES), Still Mind (mana), Sharp Mind (spell crit), Shelter, Warm Blood (life,
  ES), Deft Wand (wand attacks), Firm Footing, Waste Not. Mixed; the two arches are utility.
- **Shade:** Keen Instinct (crit, evasion), Spoils (mana sustain), Soft Step (evasion, movement), Quick March, Hedge
  Magic (spell damage), Talon (claws), Firm Footing. Mixed.
- **Strider:** Hawk's Eye, Long Breath, Clear Head, Hedge Magic, Vital Aim, Wayfarer, Quick March, Hard Living, Twin
  Fangs, Quick Hands, Elemental Fletching, Soft Step. Mixed, offence well represented.
- **Reaver:** Quickened Steel (attack speed, melee), Stout Heart, Buckler, Fighting Breath, Killing Pace (offence), Weaving,
  Well Rounded, Hard Living, Sound Body. Mixed; it already leaned to defence and sustain, and the two arches add one
  sustain and one defence pick at six.
- **Vanguard: leans defence, and Sound Body adds to it.** Oathbound (life, melee physical), Unshakable (stun), Quartermaster
  (flasks, life), Warlord's Banner (auras), Provisions (flasks), Bracing (block, stun), Sound Body (chaos resistance). Only
  Oathbound and the Banner carry anything offensive. The lean was there before (it is the Wall's home, not the centre),
  and Sound Body sits on the ring road toward the Reaver, beside the home rather than on its first steps, but it is one
  more defensive notable at six. The brief chose chaos resistance here because the Vanguard already sells stun four steps
  out; the arch must stay utility, so the remedy, if one is wanted, is an offence notable in the Wall's home (the Wall
  agent's area), not a different arch.
- **Zealot:** Zeal (elemental damage, defences), Warlord's Banner, Hymn (mana), Alms (flasks), Unshakable, Provisions,
  Iron Faith (shield), Waste Not. Leans defence and resource; Waste Not is resource (cost), not defence, and adds no
  offence. Also a home matter, not the centre's.

None of the four arches is offence, by design (ledger §3.1), so none can fix a lean; none is a main stat, so none
narrows a start toward one build.

## Checks

| check                                                       | result                                                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                                          | exit 0                                                                                                   |
| `npx tsx scripts/passives/geometry.ts --bends` (whole tree) | crossings 0, drawn over 0; none of the 82 listed bends is in the centre                                  |
| `geometry.ts --region centre --bends`                       | crossings 0, drawn over 0, bends 0                                                                       |
| `npm run passives:audit`                                    | problems 0; Firm Footing, Hard Living, Sound Body, Waste Not each 3.0 units; every new link has a reason |
| ways in                                                     | each arch is a loop with the ring: three ring nodes reach it (the even one and both odd ones)            |
| `npx vitest run src/data/ip.test.ts`                        | 5 passed                                                                                                 |
| grep of `ref-tree.json` for the four names                  | nothing                                                                                                  |

## CONSTRAINTS checklist

- **§1.1, §13.8 tension and a generic start:** utility and sustain only, 3 units, never a main stat; nothing here makes a
  build's first points a destination.
- **§3.5, §3.6 ways in, bridges:** each arch is a small loop with the ring, reachable from three ring nodes; not a
  shortcut across the ring.
- **§3.7, §3.8 crossings:** every neighbouring pair of homes now shares an arch on the ring between them; no ring link
  changed.
- **§4.5 varied defences:** adds stun avoidance (scarce near the Mystic and Shade) and chaos resistance (the scarcest
  resistance) to the centre.
- **§4.7 the centre holds generic nodes:** yes; untagged life on hit for the same reason.
- **§4.8 offence and defence near a start:** see the section above; the Vanguard and, less so, the Zealot lean defence at
  home, and the arches cannot correct that without breaking §4.7 and the ledger.
- **§8.1, §8.2, §8.6, §8.7:** smalls are one unit of the lead and the same in each arch; notables 3 units; every small
  belongs to its notable.
- **§10.1, §10.2 vocabulary:** four lines new to the centre (avoid stun, life on hit and on kill, chaos resistance and
  avoid ailments, cost and mana on kill), each cluster on one theme.
- **§10.3 live lines:** every line is read by the sheet and obeyed by the fight.
- **§11.2, §11.5 looks:** no crossings or overlaps; the shape is the old arches' exactly, the chains straight, the area
  label clear.
- **§2.2, §2.4 names:** our own plain words, checked.
