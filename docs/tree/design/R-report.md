# The attrition rework of the tree: the unattended run's log (2026-10-31)

Written as the work goes, region by region, so the final report is built from it rather than from memory. The final
report for the owner is the last section (and its Artifact page).

## Decisions taken in the owner's absence (owner decisions needed)

- The Spire: the Mystic with a shield (spell block) stays in the Spire or goes to the Cathedral's shields (decided in the
  Spire's notables pass). Minions stay in the Spire only at the west, two homes, facing the Cathedral's. Insight stays one
  Spire home beside the Knife's two; growing it toward charge play with engine work was not done unless noted below.

- The Bow: cold arrows in the Bow (the reviewer asked for them; cold attacks otherwise exist only in the Cathedral).
- The Yard: whether two-handed weapons have a real home in the Yard (carried on: the Paired Steel / Full Swing choice wheel
  plus a two-handed stun payoff) or are left to the Wall; whether the Yard's west start node should be "global defences
  with life" instead of the skeleton's armour (carried on: global defences, §16.8); whether the Yard should hold elemental
  melee at all, given the Bow and the Cathedral (carried on: Elemental Edge only with a melee hook).

- The Yard: sustain leans leech and block, kill recovery left to the Bow and the Knife (for the flask-stats pass).
- The Wall: Grave Host was kept under the owner's ruling of 2026-10-20 ("Grave Host stays every summoner's farthest
  minion notable") although minions now have deliberate homes in the Spire's west and the Cathedral: does the ruling
  hold? Strongarm (strength's melee bonus applies to projectile attacks; dexterity gives no evasion): does any Vanguard
  take it, or should it be rethought with its rename? The reference's strength sector has five keystones and the Wall
  four: does the Wall want a fifth? Rooted Stance and Blood Rite each share a word with a reference keystone of the
  same mechanic (the Yard renamed its two on that ground): rename them too (left for the naming pass)? The Wall's
  45/35/20 split against the reference's 53/33/14 was accepted as identity (grit lines): agree?

## Engine additions

- The Spire: maximum mana as a `per` stat (`src/calc/character.ts` statValue `maxMana`), for spell damage per 100 mana
  and mana as extra energy shield; auras reserving life (`auraReserveLife`, the aura loop in `character.ts`); a
  `killIgnited` event for gains and recovery (`src/data/buffs.ts`, `killActor` in `src/sim/combat.ts`); energy shield
  recharge starting on a kill (`esRechargeOnKill`, `killActor`); chilled enemies dealing less damage
  (`chilledLessDamage`, before a monster's hit lands, at most 50%). New lines in `lines.ts` under "The Spire's rule
  benders". None is covered by a test yet (no tests while iterating); the sheet's handling of the new conditions
  (standing still, leeching energy shield, hit recently) was not audited against the sim.

## Regions

### The Spire

- Stage 1 (plan): R-spire.md written. Review round 1: REVISE (elements all at the rim; wands on one spoke; Pain Conduit
  among wand attackers; no full placement table; strays; each half one-sided; east start half-useful to wand users; mana
  piling near home). Revised with element ladders (first rungs at 9-10), wands split, Pain Conduit west, the table.
  Round 2: approved.
- Stage 2 (structure): round 1 REVISE (west seam behind a wheel at step 8; damage over time chained behind other
  archetypes; crowding; no pair links). Round 2: three clusters out past step 8 (mana piling). Done: Frugal and Flashes
  of Insight cut, 13 own notables within 8 steps (Knife 11), 8 pair links. Approved.
- Stage 3 (notables): round 1 REVISE (three copies of Knife notables; no hook at home; ES leech on every payoff; flat
  second notables; generic wand lines; too few true rule benders). Revision 2 adds five engine pieces (above) and eleven
  rule benders.
  Round 2: approved with two fixes (Draught's flask trigger re-keyed to mana on kill; utility raised to 17%).
- Stage 4 (final review): approved after three fixes (three hooks priced up to 4+ units; the per-stat cap shown to the
  player, "up to 40%", in `src/mods/text.ts`; the new lines registered in the editor's vocabulary, `vocab.ts`).
  **The Spire is done** (2026-10-31): 64 notables, 5 keystones; notables 58/25/17 offence/defence/utility (reference
  55/23/22); 14 own notables within 8 steps (the Knife 11). For the centre pass: the west seam reaches the unmoved
  centre ring at step 4, so three centre notables sit at 7 from the Mystic; the redrawn centre should sit about as far
  from every start. Label overlaps on second notables go to the tidy pass.
- Owner questions from the Spire: shields with spell block (sent to the Cathedral's shields, Spirit Ward replaced);
  minions only at the west; insight left to the Knife (Flashes of Insight cut); flask charges on killing a rare (an idea
  for Draught, held for the flask stats).

### The Bow

- Stage 1 (plan): R-bow.md. Round 1 REVISE (trap copies of the Knife at the same border; a sweep of north-seam copies;
  axes and a new dual-wield home were strays; cold arrows missing; Hedge Magic and Fleet Foot cut). Round 2 approved.
- Stage 2 (structure): round 1 REVISE. **Names:** several new names were the reference game's own notable names
  (exact or near). All renamed; `scripts/passives/rework/ref-names.ts` now checks every tree name against the reference
  tree's notable and keystone names (the repo's `ip.test.ts` checks gems and uniques only). The same sweep renamed three
  Spire names that `ip.test.ts` flagged as reference gem names (Pyre, Arc, Volley → Kiln Heart, Thunder's Reach, Spray of
  Bolts) and the Knife's Frostbite (→ Bitter Chill). The Wall's old keystone Strongarm matches a reference name: renamed
  in the Wall pass. Two defence homes moved out of the first ring (one folded into Hardy Stock); 11 own notables within 8.
- Stage 3 (notables): round 1 REVISE (the first ring refilled with mana; copies across borders; flat second notables;
  no flask charges; low prices; resistance padding). Round 2 REVISE (too few notables after the cuts: 51). Round 3 adds
  eight hooked notables.
- Engine additions for the Bow: the Long Shot distance rule (`farShot`, `src/calc/skill.ts` distanceMult: up to +30% at
  eight tiles, 20% less point blank); `evade` and `blink` events for gains and recovery (`src/data/buffs.ts`; rolled in
  `evaded()` in `combat.ts` and in `arrive()` in `src/sim/blinks.ts`); lines on existing machinery: flask charges gained
  and used (`flaskCharges`, `flaskChargesUsed`: under attrition the only way a kill refills flasks), evasion and attack
  speed while moving and crit while standing still (the `stationary` condition), attack damage per 200 accuracy,
  Quickened and Elusive gained on events, payoffs while Quickened or Elusive, fervour on crit, attack speed per fervour
  charge, buff duration, traps gaining cold, physical attack damage converted to cold, regeneration if hit recently.
- Stage 4 (final review): approved after one fix (an escape blink now rolls the blink gains too, `escapeCast` in
  `src/sim/blinks.ts`). **The Bow is done** (2026-10-31): 57 notables, 4 keystones (the reference 67: thirteen flat
  notables were cut rather than kept to hold the count); notables 59/24/18 (reference 55/24/21); 11 own notables within 8.
  Its identity: moving against standing still (Wayfarer, Wind Rider, Far Reach against Steadfast Aim, Telling Shot,
  Close Quarters), Quickened and Elusive with a payoff, flask charges as the attrition lever, cold and fire arrows.
  For the tidy pass: crowding and label collisions round the Yard seam's mid ring junction; Lingering Momentum could
  sit nearer Pursuit's End. Owner question: cold arrows in the Bow (carried on).

### The Yard

- Stage 1 (plan): R-yard.md. Round 1 REVISE (copies at the Bow border checked against real positions: Darting Steel,
  Red Harvest, Stormstruck; false placement reasons; bleed and shield one-stop shops; strays; the count; the west start
  node a defence only some take). Round 2 approved.
- Stage 2 (structure): round 1 REVISE (armour piled on the west first ring; the dual-wield corner crowded; shields
  regrouped on one road; collisions with the unrebuilt Wall). Fixed. The Strider and Reaver starts were 8 steps apart
  (both paths straight to the shared seam); the Yard's east path now runs through Killing Pace (10). **For the joins
  pass:** bring the Bow side's path to the Yard seam through a cluster too (~12), and check every neighbouring pair's
  start distance. **For the Wall and centre passes:** through the old west seam the Reaver reaches centre notables at
  step 7 and the Wall's Second Wind (7), Greatblade (9) and Cleaver (10), weapon picks near the start.
- Keystones renamed (borrowed words from reference keystones of the same mechanic): Wound Dance → Hundred Cuts, Crimson
  Pact → Blood Bargain, in `src/data/tree/keystones.ts` too (mechanics bind by name).
- Stage 3 (notables): round 1 REVISE (Fortified on every melee hit underpriced; copies inside the region; Hot Blood's
  trigger was the Bow's; sustain lines lost; east bleed thin; flat swords; 49 too few). Round 2 approved with four fixes
  (two copies; leech as padding; utility; prices).
- Stage 4 (final review): approved. **The Yard is done** (2026-10-31): 52 notables, 3 keystones (reference 57);
  notables 50/35/15 against the reference's 56/27/17: **a reviewer-accepted deviation**, the surplus being the block,
  stun and leech lines that are the region's identity (candidates to shave if wanted: Four Winds, Scarred Hide). Its
  identity: the duel up close (block → Quickened and fervour for the dual wielder; the parrying swordsman; the stun loop
  for two-handers and shields; impale; bleed split east and west). Sustain leans leech and block, kill recovery left to
  the Bow and the Knife (owner question). For the tidy pass: melee physical damage repeats as a second line near the
  start; about 13 kept notables are two flat lines.
- Engine additions for the Yard: event gains asked under the fight's conditions (`src/sim/buffs.ts` rollGains: before,
  a conditional gain never applied); lines on existing events and conditions: Fortified on stun, fervour on block,
  Elusive on evade, Quickened on block while dual wielding, damage per fervour charge while dual wielding, damage after
  a block / against stunned / while leeching / while Fortified, crit against bleeding or stunned enemies, melee area on
  kill, impale chance and effect, armour against elemental hits (`armourVsEle`), melee physical gained as extra fire.
  Condition texts added for Elusive and leeching energy shield (the Bow's Pursuit's End had shown a raw id).

### The Wall

- Stage 1 (plan): R-wall.md. Round 1 REVISE (shields copying the Yard's ideas; axes beside the Yard's; the south rim a
  dumping ground facing the Yard's payoffs; two area notables in one pocket; the grit diagnosis wrong: grit pays off by
  itself, what lacked was ways to gain it; stun piled; the north exit all defence; nine own notables within 8). Round 2
  approved. Grave Host kept under the owner's ruling of 2026-10-20.
- Stage 2 (structure): round 1 REVISE (the near ground lopsided north; look-alike pairs side by side; one southern
  junction crowded; overlaps). Round 2 approved (11 within 8: 5/5/1; maces all 6+ steps apart).
- Stage 3 (notables): round 1 REVISE (45 too few; sustain fell a third; three internal copies). Round 2 approved with
  three fixes (grit sliding into every second line: Heavy Hands copied Plunder of Iron; regeneration per grit on three
  notables; a price).
- Stage 4 (final review): approved. **The Wall is done** (2026-10-31): 49 notables, 4 keystones (reference 49 and 5);
  notables 45/35/20 against the reference's 53/33/14: **a reviewer-accepted deviation** (the grit lines, counted as
  utility, are the region's identity). Identity: standing ground. The grit loop: gained on block, stun (twice), kill
  (Plunder of Iron), mace hits, warcries, hits taken; spent on block per charge (Shield Ram), melee damage per charge
  (Grit and Gravel), two-handed speed per charge (Heavy Hands), regeneration per charge (Scar Tissue, Bulwark Spirit).
  Estimated fill: 1-2 charges with grit on stun and block, full only in pack fights with the kill and warcry sources.
  Standing Iron's armour while standing still: a melee character stands for every swing, so most of a pack fight
  (estimate; the joins pass or play should confirm). Renamed: Strongarm → Unbowed Arm (keystones.ts too), Quartermaster →
  Camp Stores, Second Wind → Old Wounds. Cut: Grim Oath, Iron Liturgy, Two Fists, Stone Ward, Unhurried, Bracing,
  Cleaver, Unbloodied, War Drums. For the tidy pass: label overlaps listed in the final review; Grave Host's long spur.
- Engine additions for the Wall: a `warcry` charge event rolled when a warcry is used (`src/calc/charges.ts`,
  `src/sim/utility.ts`, player text); lines on existing machinery: grit on stun, block, kill, warcry and mace hits
  (charges are rolled under the fight's conditions), block per grit charge with a shield, melee damage per grit, two-handed
  attack speed per grit, armour and stun avoidance while standing still, melee physical per 10 strength (`str` per stat),
  one more totem (the deploy count), strikes hit one more enemy (`extraTargets`).

### The Cathedral

- Stage 1 (plan): R-cathedral.md. Round 1 REVISE (placements on both border roads inward of the mid ring, in the
  neighbours' near ground; three look-alikes of the neighbours' seam notables: Litany, Homily, Vigil's recharge; archetypes
  each in one place; cold with no early rung). Both borders were already built by the neighbours: the Cathedral built no
  seam or border road and links into the Wall's and the Spire's.
- Stage 2 (structure, with the plan's revision): approved with two layout fixes (six notables pressed within 300 units
  of the neighbours' notables, moved inward; label overlaps). Two dead links in the Wall (into nodes its own rebuild
  removed) were dropped. 9 own notables within 8 (accepted: the home also shares Vigil and Bright Omen with the
  neighbours' players); start distances 10 (Vanguard) and 11 (Mystic).
- Stage 3 (notables): round 1 REVISE (48 too few, about 20 flat; staves, block and totems with no rule; Kneeling Stone
  copying the Wall's stun and regeneration; aura effect sliding onto five notables; mana piling near home; prices).
  Round 2 approved with two fixes (reduced reservation had slid onto five notables instead; Hymn of War doubled Battle
  Hymn's warcry line).
- Stage 4 (final review): approved. **The Cathedral is done** (2026-10-31): 54 notables, 5 keystones (reference 57 and
  7); notables 52/28/19 against the reference's 53/26/21. Its identity: **the consecrated ground**, what the Zealot plants
  works for it: one more brand (Many Sigils), regeneration and damage per aura held (Chorus, Choir of Wrath; a fork
  against Lone Vow), regeneration and damage while a servant stands (Sexton, Ossuary), servants that recover (Shepherd's
  Crook), regeneration and damage while a totem stands (Reliquary, Hallowed Ground). Faith turned to an element: every hit
  gains physical as fire (Faith Aflame, toward Searing Avatar), physical spells turned to lightning (Faith Unleashed, from
  Shattering Rite). Staves gain insight on block (Whirling Ward), shields recover life on block (Steadfast Faith),
  channelling is a line with its defence (Plainsong). Renamed: Tithe → Alms (a relic's name), Consecrated Plate →
  Pilgrim's Mantle. Cut: Living Ward (the skeleton). For the tidy pass: label overlaps between the second notables and
  their hosts (eight pairs listed in the final review). For the naming pass: Searing Avatar; three "Hymn" names; Litany
  beside Ember Litany and the Spire's Iron Litany. Optional, not done: Ember Litany's hook (recover on killing an ignited
  enemy) is also the Spire's Warm Hearth's, 18 steps apart.
- Engine additions for the Cathedral: conditions `channelling`, `minionsOut` and `totemOut` (`src/sim/combat.ts`,
  `src/mods/types.ts`, player text); the calc's `auras` per stat (auras active, `src/calc/character.ts`); `recoverOn`
  takes `block`; lines `minionRegen`, `minionRes`, `brandLimit`, `physGainFire`, `spellPhysToLightning`,
  `damageWithMinion`, `regenWithMinion`, `channelGuard`, `regenPerAura`, `damagePerAura`, `insightOnStaffBlock`,
  `insightOnWarcry`, `regenWithTotem`, `damageWithTotem`. The sheet's handling of the three new conditions was not
  audited against the sim.
- Owner questions from the Cathedral: the start sides (mana regeneration with life, damage with life) differ from the
  approved skeleton's (elemental damage, armour); the Cathedral as one minion partner among three rather than "the main
  minion region"; insight charges now also in the Cathedral (staff block, warcry), not the Knife's alone.

### The centre

- Stage 1 (plan): R-centre.md. Round 1 REVISE: the plan's steps were wrong (start to seam was 4 on the side that built
  the seam and 6-7 on the other, so the middle would have sat 8 from three classes and 11 from two); two placements
  copied the neighbours (Shelter by the Knife's Ward of Smoke, Waste Not by the Wall's Iron Lungs); a false placement
  reason; inner roads laid through region nodes.
- Stage 2 (structure, with the revision): approved. **The six bare paths to a seam now run through a home cluster**
  (CONSTRAINTS §16.9), in the regions: the Spire's Draught and Hale Scribe, the Bow's Clear Head and Quick Sip, the
  Yard's Guarded, the Wall's Camp Stores, each a two-node run-through (a small or two trimmed). Every start is now 6 or 7
  steps from both its seams. The frame: an inner road along each border from the seam to a junction at 950 (five bent a
  few degrees clear of region nodes), a hexagon joining the junctions, three spokes to the middle. The old ring road (24
  nodes, built for starts at 1,000) is gone.
- Stage 3 (notables): round 1 REVISE (prices set for when they sat 7 steps from some starts; now 10 to 15 from every
  start, so a home generalist at step 5 beat them). Repriced to 4.0-4.9 units. Approved.
- Stage 4 (final review): approved. **The centre is done** (2026-10-31): eight generic notables, no keystones. Each pair
  of neighbours has its junction notable, placed where neither home sells it by that seam: Firm Footing (-60, Mystic and
  Shade), Hard Living (0, Shade and Strider), Waste Not (60, Strider and Reaver), Sound Body (120, Reaver and Vanguard),
  Quick March (180, Vanguard and Zealot), Shelter (240, Zealot and Mystic); Well Rounded and Provisions at the middle.
  Steps: every class reaches its two junction notables at 10-11, the middle's at 12-13, the others at 12-15 (the Shade
  one step further throughout). Provisional until the flask stats: Hard Living, Provisions, Waste Not's mana on kill.
  For the joins pass: Well Rounded is now stronger than the Bow's Wanderer, two steps from the 60 seam. For the tidy
  pass: three side rooms run close beside a spoke or hexagon side.
- Owner questions from the centre: notables per pair of classes (as built) or all eight equally far at the middle (a
  literal reading of skeleton §8); keep the hexagon and the three spokes (beyond the skeleton's six inner roads); amend
  CONSTRAINTS §3 item 8 ("the centre ring between neighbouring homes"), now that the ring is gone; more than eight
  notables in the centre (more flask notables as the attrition lever).

## The joins pass (review of the borders, the links and the archetypes across regions)

A fresh reviewer measured the six borders, the 32 links between regions, the keystones from every start, every
archetype's homes and the names (its scratch output: `scratchpad/joins/`). Baseline: no crossings, nothing drawn over,
both rings continuous across every border, the centre never a shortcut between neighbours.

**Fixed (the reviewer's MUSTs 1-8):**

- **Every path to a seam is two nodes.** The Knife's Spoils and Soft Step, the Wall's Ringing Blows and the Cathedral's
  Bright Omen lost one small each, so every neighbouring pair of starts is 12 apart (it was 12-13) and no neighbour
  reaches an owner's border notables first (twelve did, among them both Knife border keystones). The Knife's area file
  was edited by hand (its generator reads a removed snapshot) and `knife-gen.ts` updated to match.
- **Axes:** a second home. The Wall's Headsman (two-handed damage and grit on stun) became axe damage with grit on stun;
  axes' only other home was the Yard's rim pair, Hewing and Wide Arc.
- **Copies across borders, re-lined:** Quick Sip (the Bow) now flask charges gained (the Yard's Field Dressing by the
  same seam sells recovery and duration); Withering (the Spire) now damage against cursed enemies and curse effect (it
  combined the Knife's Rotting Word and Lingering Malice); Tripwire (the Bow) now cold for traps, chill and freeze (it
  opened on trap damage like the Knife's Venom Snare on the same node); Familiars (the Spire) now minion damage per 100
  maximum mana, a new line `minionDamagePerMana` (it copied the Cathedral's Shepherd); Sharp Tongue (the Spire) now
  dagger spell crit (it copied the Knife's Quiet Knife); Wanderer (the Bow) now movement, life and strength (the centre's
  Well Rounded sells all attributes).

**Left for later (tidy pass, naming pass, flask stats, owner):**

- MUST 9, moving Honed Mind (physical spells on the Knife's border road toward the Bow) and Standing Cairns (totems on
  the Yard's border road, by the Wall) off their border roads: held for the owner's answer on the border-road standard
  (below), since under the skeleton's seam themes many other placements stand as built.
- Leech on the first node of three neighbouring border roads (Thirsty Quiver, Vampiric Strikes, Alms); five flask
  notables at step 5-6 with near-identical lines (flask stats pass); Light Hand against Light Blades; the Bow's shields
  (Round Shield, Braced Guard) copying the Yard's; Ember Litany against Warm Hearth (18 steps apart).
- Reach: warcries all at the rim (Zealot 13, Vanguard 14), insight 17 from the Mystic, staves and physical spells 15-16
  from the Mystic, curses never within 15 of a strength class, cold and lightning never within 16 of one; claws two
  homes; three of six damage-over-time notables at the Mystic-Shade mid ring; 6 of 10 minion notables round the
  Zealot-Mystic border.
- Links between regions: 4-6 per border (CONSTRAINTS §17 records 7-9 before the rework, the reference 10-13); the
  Shade-Strider border has 4.
- Names: three Hymns, three Litanies, large word families (Ward ×9, Iron ×9, Guard ×7), pairs across borders (Withering
  and Withering Word, Bulwark ×3, Hallowed ×2, Blood Rite and Blood Bargain, Crushing ×2, Steadfast ×2, Glass ×2).
- Label overlaps: about 27 pairs listed (none across a region).

**Owner questions from the joins pass:** which standard governs a border road inward of the mid ring, the skeleton's
seam themes (the first five regions) or generic notables only (held for the Cathedral; about 16 placements and 4
keystones would move); axes as an archetype with a second home (now the Wall's Headsman) or a line only; the Knife, the
Wall and the Cathedral each lost a small on the path to their seams (done, reversible); 4-6 links per border intended;
insight at 17 for the Mystic and warcries at 14 for the Vanguard; both minion regions facing each other at the
Zealot-Mystic border.
