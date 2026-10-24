# G3 round 1: the Vanguard (the Wall)

Done 2026-10-22 for phase G3 of [G-growth.md](../../G-growth.md), round 1 of about three, from the joined brief
[G1-brief.md](../../G1-brief.md) (stops 2 and 3), the region brief [G1/vanguard.md](../../G1/vanguard.md) and the
skeleton [G2/vanguard.md](../../G2/vanguard.md). [CONSTRAINTS.md](../../CONSTRAINTS.md) wins over all of them. Files:
`src/data/passives/wall/` only (maces, grit, rampart, resists, slams). Nothing registered, baked or committed.

**Nodes: 203 → 217** (start included): three new clusters of 5, 4 and 5 nodes. No node removed, no id changed or
retired; one node changed kind (`wall.rampart.bulwark.a`, small → attribute).

**Pictures** (this folder, `vanguard/`): `before.png` and `after.png` (the whole network), `before-region.png` and
`after-region.png` (the region), close-ups with every line written: `locked-shields.png`, `hot-iron.png`,
`iron-voice.png`, `battlements.png` (the moved label).

## 1. Re-lines of existing notables (approved at stops 2 and 3)

| Node                                            | Before                                       | After                                                    | Units     |
| ----------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- | --------- |
| Warlord's Banner                                | 5% reduced reservation, 16% armour, +30 mana | 5% reduced reservation, **8% aura effect**, +30 mana     | 4.5 → 4.5 |
| `wall.rampart.bulwark.a` (the wheel's entrance) | small, 5% life                               | **attribute, +7 strength** (a road node, the brief's §4) | 1 → 0.5   |
| Elemental Ward                                  | all resistances, 5% life                     | **unchanged** (stop 3: keeps its resistances and life)   | 3.5       |

- The Banner is now one theme (reservation, aura, mana) and armour is gone from a notable 3 steps from the Zealot start
  and 5 from the Vanguard's.
- `bulwark.a` was the last life small of the wheel's old life side; the armour side's section is now uniform (§8.2).
- **Re-pricing:** none needed. Every Vanguard notable was already 3.0 to 5.0 units, and all still are (audit below).
- The other approved changes (Iron Lungs, Stone Heart, Thick Skin, Second Wind, Cleaver, Hallowed Hammer moved;
  Unerring's spur turned) were done in G2.
- **Elemental Ward's armour, which stop 3 sends "to a farther cluster":** see §5 item 1. In short, the allocator says the
  strength builds now have more armour, not less, so it was not placed anywhere.

## 2. The clusters added (3 of the brief's 7)

| Ledger | Notable (area)                    | Lines and units                                                   | Smalls                              | Where it hangs                                                                                                                                                    | Steps V / R / Z |
| ------ | --------------------------------- | ----------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| VA-2   | **Locked Shields** (the Barbican) | `armour(24)`, `shieldBlock(5)`: 2 + 2.5 = **4.5**                 | four, 12% armour (VA-s1 folded in)  | a regular pentagon (r 66) in Cleaver's old square; doors from the tower junction (`toCleaver.a`), Steady Hands (`steadyHands.b`) and Crushing Blow (`crushing.a`) | 14 / 22 / 19    |
| VA-6   | **Hot Iron** (the Barbican)       | `eleAttackOne('fire', 24)`, `stunDuration(25)`: 2 + 1.7 = **3.7** | three, 12% fire damage with attacks | on the west rim road between `rim.a` and `rim.b` (Grim Oath north, Thick Skin south), third door east to `toHymn.r2`                                              | 19 / 26 / 22    |
| VA-3   | **Iron Voice** (the Barrows)      | `armour(24)`, `warcryEffect(20)`: 2 + 2 = **4**                   | four, 12% armour (VA-s2 folded in)  | a straight chain on the Barrows' middle road, `middle.b` → chain → `east.e2`                                                                                      | 19 / 18 / 27    |

**Twins and steps** (nodes between notables, by the network as it stands):

- Locked Shields (armour, block): Mortar and Stone 7, Broad Back 7, Thick Skin 9, Grim Oath 9, Iron Voice 20; Bracing
  (shield block) 18. Stagger is 5 (a different specialization).
- Iron Voice (armour, warcry): War Drums 9 (the warcry twin), Grave Host 7 (armour partner), Headsman 7, Two Fists 16,
  Broad Back 17, Mortar and Stone 19.
- Hot Iron (fire attacks, stun): Stagger 7 (the stun twin), Weight of Iron 11, Headsman 28; Hallowed Hammer
  (elemental attacks) 14, Kindled Steel 22, Elemental Edge 29. Thick Skin and Grim Oath are 3 either side on the rim
  road: different specializations (armour and stun threshold; curses and armour), neighbours that compete (§5.5).
- Convergence rule: no new cluster pairs life with armour or spell damage with energy shield.

**Names** checked: `npx vitest run src/data/ip.test.ts` passes; "Locked Shields", "Iron Voice" and "Hot Iron" are in
neither `reference/tree/ref-tree.json` nor `ref-phrases.json` ("Battle Cry" was a candidate and is a reference hit, so
it was dropped).

**Layout** (§11.5): Locked Shields is a regular pentagon at radius 66 (sides 78), three corners facing the three roads,
the notable at the far corner so the way across takes smalls and the notable is a one-step detour; `toCleaver.a` moved
from (−2795, 1030) to (−2762, 976), onto the straight line from the junction to the east corner. Hot Iron's and Iron
Voice's chains lie on the straight lines `rim.a`–`rim.b` and `middle.b`–`e2` (smalls 70 then 55 out from the notable),
so every new two-link node is straight; Hot Iron's third small sits 70 out on the line to `toHymn.r2`.

## 3. Deferred border links

**None this round.** The three deferred links on the Vanguard's borders (`G2/borders.md` §4) land on neighbours' G3
clusters: ZE-5 → `wall.resists.j.a`, ZE-8 → `wall.maces.oath.n`, RE-2 → `wall.grit.east.e6`. The Zealot and Reaver agents
write them in their files. No border link was added, cut or re-aimed.

## 4. Other changes, and what changed from the brief

1. **Area labels** (the Battlements' was handed to G3 by G1 and G2; two more were pushed by the new clusters). A scratch
   check of each label's box (`AREA_LABEL` size 150, width by `areaLabelWidth`) against notables, keystones, starts and
   other labels; every Vanguard label is now clear:
   - The Battlements (−2000, −140) → (−2000, 110): off Elemental Ward and Scar Tissue, between the star's south spokes
     and the Rampart (over Hallowed Hammer's small and some links, which §11.2 allows).
   - The Barbican (−3240, 990) → (−3240, 1015): off Locked Shields.
   - The Barrows (−2330, 2886) → (−2405, 2761): off Tempered and Iron Voice.
   - The Quarry (−1250, 1600) → (−1250, 1575): off Unhurried.
2. **Notables priced on the partner side.** The first version had both armour notables at 30% armour (2.5 units) with
   a smaller partner; the round's allocator showed the strength builds' armour doubling at 120 points (§6), so both were
   re-weighted to even halves (Locked Shields 2 + 2.5, Iron Voice 2 + 2) at the same price. That also feeds the
   partners that were flat: block for the mace-and-shield build, warcries for the warcry-totem build.
3. **Hot Iron's third door is `toHymn.r2`**, as the G1 and G2 tables say (Hallowed Hammer's old hook), not Crushing
   Blow's dead-end small: it gives the rim a way in from the tower that does not walk the whole rim.
4. **Round 1 is VA-2, VA-3 and VA-6, not a mace cluster.** See §8 for the order and the reason (the allocator cannot see
   `weaponDamage('mace')` yet).
5. Area-file headers and the `why`s that named a future cluster ("will join it there") now name it.

## 5. Checks

- **Geometry** (`geometry.ts --region vanguard --bends`): crossings 0, drawn over 0 (whole tree too). Bends over 20°:
  18, as before. `steadyHands.b` (90°) left the list, now a junction; `locked.c` (72°) joined it, a pentagon corner.
  Every other entry is the same ring corner or road turn as in G2. No new two-link node bends.
- **Problems:** `buildAll` reports none (no `wall.` problem); `npx tsc --noEmit -p .` clean; prettier clean on the
  five files.
- **Audit** (`passives:audit -- vanguard`): problems 0; 217 nodes (travel 62, small 108, notable 42, keystone 4).
  **Notables in units:** all 42 between 3.0 (Unhurried, Standing Cairns) and 5.0 (Ground Shaker); new ones 4.5, 3.7, 4.
- **Ways in:** every area has three or more links in and out. Locked Shields has three doors, Hot Iron three, Iron Voice
  two. The G2 single ways in are closed: Thick Skin (Rooted Stance junction, the rim) and Grim Oath (the Battle Hymn
  road, the rim) are two-door clusters, and the rim road is a loop. Stubs closed: `toCleaver.a`, `rim.a`, `rim.b`,
  `middle.b`. Still open (round 2): `floor.a`, `floor.b`.
- **Home steps:** no existing notable came nearer to any start. Locked Shields 14 (the brief: 13), Hot Iron 19 (19),
  Iron Voice 19 (18).
- **Keystones:** all four keep one link; distances unchanged (Unerring 11, Strongarm 15, Rooted Stance 18, Blood Rite 24).

## 6. The allocator (indicative: five other regions are mid-edit)

`npm run passives:builds -- --only mace-slam,mace-shield,warcry-totem,two-hand-fire,sword-str`, main stats in units at
120 → 160 points, against [G0/builds.txt](../../G0/builds.txt):

| archetype     | G0 (120 → 160)                                                             | now (120 → 160)                                                                  | choice at 120 G0 → now | tax at 120 |
| ------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------- | ---------- |
| mace-slam     | life 47.6 → 51.2; armour 21.2 → 22.5; 2h mace 22.5 → 27.2                  | life 34.6 → 51; armour **31.2 → 35.2**; 2h mace 22.2 → 26.5                      | 1 → 6                  | 32 → 31%   |
| mace-shield   | life 39.8 → 54.2; armour 17.2 → 21.8; block 31.5 → 31.5; mace 14.2 → 14.2  | life 37.6 → 49.6; armour 21.5 → **31.2**; block 32.5 → 32.5; mace 13.2 → 14.2    | 3 → 4                  | 29 → 29%   |
| warcry-totem  | life 45.8 → 54.2; totems 9 → 9; warcries 0 → 6.8                           | life 32.8 → 44.2; totems 5 → 5; warcries 7.8 → 8.8                               | 3 → 4                  | 38 → 35%   |
| two-hand-fire | life 46.2 → 51.2; armour 21.2 → 24.8; fire attacks 10 → 14.4; 2h 5.8 → 9.5 | life 28.4 → 40.6; armour **42.8 → 44.8**; fire attacks 13.4 → 17.4; 2h 9.5 → 9.5 | 2 → 4                  | 29 → 28%   |
| sword-str     | life 42.8 → 53.2; armour 19.8 → 21.2; sword 29.1 → 32.3                    | life 36.2 → 42.6; armour **10.7 → 34.2**; sword 39.5 → 39.5                      | 2 → 5                  | 33 → 30%   |

What it says:

- **The user's sword example now has to choose its armour.** At 120 it holds 10.7 units and 40 more points add 23.5:
  its gave-up list is Mortar and Stone (4.5), Broad Back (3.7), Steady Hands, Thick Skin, Elemental Ward. In G0 it held
  all of it by 60. Locked Shields is on its gave-up list in the first version of the round.
- **Strength by the back door, for the Vanguard's own builds (G-growth §4): armour.** At 120 points the mace slam holds
  31 armour units (G0 21) and the two-handed fire build 43 (G0 21, about 490% armour), and the fire build's armour is
  flat again at the new level (+2 units for 40 points). Its life fell by about the same (46 → 28): the pair life plus
  armour barely moved (67 → 71 units), so it is substitution more than strength, but one stat at a time it is a jump.
  Why, from its plan: at 60 points it already takes Mortar and Stone, Broad Back, Locked Shields and Thick Skin, and at
  80 Hot Iron and Grim Oath, all in the west tower within 3 to 9 steps of one another, with the neighbours' new armour
  (the Zealot's Verger, the Reaver's Mended Mail) beside them. The armour draw does not depend on Hot Iron: the build holds the four armour notables at 60, before it takes Hot Iron. A test
  cut of Locked Shields' Crushing Blow door changed nothing, so it is the supply, not the route.
- **Mace stays flat (14.2)** because no mace cluster was added this round, and because the archetypes cannot see the
  brief's mace line (§7, question 1).
- **Totems stay flat (5 → 5)**; warcries rise a little (Iron Voice is taken at 120).
- Choice rose for every build (4 to 6 near-equal plans at 120); tax held at 28 to 35%.
- Targets over these five: what 40 points add at 120, typical 18% (target 30%); stats gaining 10% or less 39%; every
  build has a 2.5-unit notable in its gave-up list.

## 7. Walks (by hand on the map, with a scratch path script)

**20 points, the class's main build (mace and shield).** Oathbound (2), Bracing (8: the slam road, the shield
leaves south-east), Unshakable (11), Mortar and Stone (17: through the Bulwark's armour side, the detour), then Weight
of Iron at 22. **Chose:** shield first, armour second, the mace after. **Gave up:** Iron Lungs (on the wheel's other
side), Thunderstep, the flasks. **No-choice stretch:** none; every 3 to 6 points there was a fork. Locked Shields is at
28 by this road, a real "next 6 points" question against Field Dressing or the mace. **Nobody takes:** Unhurried at this
budget.

**20 points, an off-build (warcries and totems).** Oathbound, Quartermaster (6), Standing Cairns (12), Unbloodied
(15), Second Wind (18); Iron Voice is 24 and War Drums 30 by the middle road. **Chose:** the totem and the Quarry's
sustain. **Gave up:** the north entirely. **No-choice stretch:** Stone Ward on the middle road is bought by anyone
heading to Iron Voice that way (the road passes through it, as G2 laid it): a spell-block notable this build half
wants. **Note:** before G3 the warcries were one cluster; now the build chooses War Drums by the west or Iron Voice by
the middle at about 24 to 30 points.

**20 points, a neighbour coming in (the Reaver's sword and armour).** Guarded (9), Bracing (13), Oathbound (19);
Mortar and Stone is 28 and Locked Shields 35 from the Reaver start. **Chose:** the near armour on its own side and the
Wall's shield. **Gave up:** every Vanguard armour notable at this budget, which is the point: armour is a far
destination for the sword build now.

**120 points, mace and shield.** In order, with the points spent: Oathbound 2, Bracing 8, Unshakable 11, Mortar and
Stone 17, Iron Lungs 19, Weight of Iron 24, Locked Shields 28, Steady Hands 31, Hallowed Hammer 35, Elemental Ward 38,
Broad Back 41, Crushing Blow 44, Thick Skin 49, Field Dressing 52, Thunderstep 54, Stout Heart 56, Guarded 59, Buckler
67, Steel Rim 74, Shield Bash 83, Mended Mail 89, Shieldwall 93, Unbroken 104, Tempered 106, Barrow Ward 111.

- **Chose:** the north-west tower whole, then the Reaver's Muster for block and the Shieldwall keystone.
- **Gave up:** Iron Voice and the Barrows' middle (74 points away by that route), Hot Iron and Grim Oath, the Quarry's
  totems, Heavy Hands.
- **Finding, the same as the allocator's:** from Weight of Iron (24 points) the west tower yields a notable every 3 to
  5 points for the next 25 (Locked Shields, Steady Hands, Hallowed Hammer, Elemental Ward, Broad Back, Crushing Blow,
  Thick Skin). The pentagon's three doors put Steady Hands and Crushing Blow 3 points from it. The tower is a dense
  bundle of wanted nodes for any strength build: good for choice inside it, too cheap as a whole.
- **No-choice stretch:** Buckler's 8 points cross the Reaver home loop; nothing to pick on the way.
- **Nobody would take:** Crushing Blow here (a crit mace notable for a block build), bought only because it is 3 points.

## 8. The order: why these three, and rounds 2 and 3

**Round 1 (done): VA-2, VA-3, VA-6.**

- (a) The flattest main want across the Vanguard's four builds and the user's sword example was armour (21 → 22 units
  for every strength build in G0). VA-2 and VA-3 are the brief's two armour clusters, west and south-west. VA-6 is
  the two-handed fire build's flat want (fire attacks).
- (b) Together they close four of G2's seven dangling ends (`toCleaver.a`, `rim.a`, `rim.b`, `middle.b`), and VA-6 ends
  Thick Skin's and Grim Oath's single way in.
- (c) Three areas: the Barbican's middle, the far west rim, the Barrows' middle.
- **Why no mace cluster yet:** the brief writes the new mace clusters with `weaponDamage('mace')` so twins count right,
  but the mace archetypes (`mace-slam`, `mace-shield` in `scripts/passives/archetypes.ts`) weigh only `maceDamage`, so
  the allocator would not see them. Round 2 can measure them once the archetypes count `weaponDamage:mace`.

**Round 2 (proposed):** VA-5 (mace with life, on the Quarry floor: closes `floor.a` and `floor.b`) and VA-4 (the fast
mace in the Barrows' north), the mace pair, measured together; then VA-7 (totem speed and duration), since totems are
the flattest stat this round (5 → 5).

**Round 3 (proposed):** VA-8 (shield attacks with stun, the near porch in space B), and the layout call of the three
spurs off the Barrows road (Barrow Ward, Cleaver, Greatblade).

**Not to add:** the brief's reserve armour ("about 9 units under the ledger", to go in space G or with the neighbours),
and Elemental Ward's armour line that stop 3 sent to "a farther cluster". The allocator now says the opposite: the
Vanguard's builds have too much armour within reach, not too little.

## 9. Open questions

1. **The archetypes and the mace line.** Should `mace-slam` and `mace-shield` count `weaponDamage:mace` (weight 1, and
   in their mace family), so the brief's mace-only clusters register? A related oddity in `lines.ts`: a mace-only small
   is 10% (`weaponDamage`, unit 10), less than the 14% mace-and-sceptre small (`maceDamage`, unit 14), although it is
   the narrower line. Not changed here (lines.ts is out of scope); the Cathedral's sceptre clusters use the same 10%.
2. **The west tower's armour.** Mortar and Stone, Broad Back, Locked Shields and Thick Skin are 7 to 9 steps apart and
   Grim Oath, Two Fists, Iron Liturgy and Grave Host carry armour as a partner; with the neighbours' new armour the
   Vanguard's builds take about twice G0's armour at 120. Options for round 2, for the user to choose: (a) take armour
   off one or two far partners (Grim Oath's or Two Fists' armour, as Warlord's Banner lost its); (b) re-line Broad Back
   (life and armour, 13 steps from the start) to life with something else, since it is the far hybrid the convergence
   rule allows but the allocator takes it at 60; (c) cut one of Locked Shields' three doors; (d) leave it, since the
   pair life plus armour barely moved and the sword build gained tension. I lean to (a) and (b) together.
3. **Elemental Ward's armour from stop 3** was not placed (§8). Confirm that is right.
4. **Stone Ward on the middle road** is bought by anyone using the road (G2's layout): a spell-block notable as a toll.
   Leave it, or let the road pass beside it in round 2?

Nothing here felt like it was losing intent. The one place I was least sure is §6: the round did what the brief asked
and the measure says the brief's armour assumption (too little) has turned over.

## 10. Checklist against CONSTRAINTS.md

- **§1 What the tree is for.** Armour now has four Vanguard directions with different partners; the sword example has
  to choose it (10.7 → 34 units with 40 more points). Tension was weighed against the rest: the over-supply for the
  Vanguard's own builds is reported (§6), not hidden, and the notables were re-weighted toward their partners.
- **§2 The reference.** Twins 7 to 9 steps or more; no names copied; three plain names checked by the test and the
  greps; the reference game is not named.
- **§3 A network.** Every new cluster has two or three ways in; the west rim and the Barrows' middle are loops; the
  four stubs are closed; no border link touched.
- **§4 Regions and areas.** No area named for a build; the defences stay varied (armour in four directions, life,
  stun, block, spell block, resistances, regeneration and leech).
- **§5 Specializations.** Armour with block, with warcries, with stun threshold (Thick Skin), with physical reduction
  (Mortar and Stone), with life (Broad Back); fire attacks with stun here, with burning in the Zealot. Neighbours that
  compete on the rim road (Grim Oath, Hot Iron, Thick Skin). The convergence rule holds.
- **§6 Starts.** The Gate is untouched; no new cluster within 13 steps of any start.
- **§7 Roads and attributes.** One road node moved onto a straight line; `bulwark.a` became a strength road node; no
  new road.
- **§8 Clusters and smalls.** Every new small belongs to its notable and carries its lead (§8.2, §8.7); notables 3.7 to
  4.5 units; the Bulwark's armour side is uniform now.
- **§9 Keystones.** Unchanged, one link each.
- **§10 Vocabulary.** Lines only from `lines.ts`, all live; aura effect added to the Wall (the Banner); fire attacks with
  stun, armour with warcries and armour with shield block are new pairings.
- **§11 Looks.** 0 crossings, 0 drawn over; a regular pentagon and two straight chains; no new bend; four labels moved
  so none covers a notable or another label.
- **§12 Size.** 203 → 217, an outcome; the allocator is a static tool; no bot simulation.
- **§13 Tensions.** Connections against trade-offs (the pentagon's three doors, §9 question 2); identity against spread
  (armour concentrated in the Vanguard and now heavy); a generic start (unchanged).
- **§14 Rejected ideas.** No generation (every position computed by hand from its two ends and looked at); no filler;
  no step-count reach; no new restrictive rule.
- **§15 How the work is done.** CONSTRAINTS and the briefs read first; pictures before and after with close-ups;
  geometry after each batch; the region's folder only; no register, bake, commit or stash.
- **§16 Open.** Labels: the Battlements, Barbican, Barrows and Quarry labels clear now. Armour supply and the mace
  archetypes are new open items (§9).
