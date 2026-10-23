# G4 audit round 2: starts, homes and the late game

Auditor's subset: CONSTRAINTS §4.5–4.8, §6, §9 (the whole document at hand). Measured 2026-10-23 on the network as it
stands after G4 fix pass 1 (1,398 live nodes, `passives:audit` 0 problems, `edits.json` empty). Nothing in `src/`,
`scripts/` or the plan docs was changed.

**Tools.** `passives:audit` (first steps, keystone distances), `passives:builds` (28 archetypes, with `--json`),
`passives:supply`, `passives:list`, `passives:pic`, and scratch scripts outside the repo: every node within ten steps of
each start with its lines; offence / defence / utility by units per step band; units and notables within 4–6 steps;
keystone spurs; each 120-point plan's last 40 points; the 60-point openings per start; and a copy of the allocator
that applies a trial cut, link or re-line in memory (`TRIAL=…`), so a proposed fix could be measured without editing
the network. "Trial" below always means that copy, never a change to the repo.

**Pictures** (`starts/`): `home-<class>.png` (each home, 2,600 tree units square, names), `zealot-mystic-text.png` (Hymn,
the Mystic crossing and the Cloister, every node's lines), `strider-lists-text.png` (the Strider's south hub and the
Reaver's Lists, every node's lines).

Steps are points bought from a start, never through another start. Region tags: My, Sh, St, Re, Va, Ze, Ce (centre).
"O / D / U" is offence, defence and utility (mana, flasks, movement, cost, reservation, auras) by units.

---

## 1. Findings, most important first

### F1. Hymn is the Zealot caster's door out of the Zealot: must fix

**Where:** `cathedral.home.hymn.n` (Hymn, Ze4), its far small `cathedral.home.hymn.b`, and the border link
`cathedral.home.hymn.b`–`spire.well.toCathedral.b` (the Mystic crossing). Picture: `zealot-mystic-text.png`.

**What is wrong.** Z-1 did what round 1 asked: Hymn is now spell damage with lightning, the casting Zealot's first
spell notable, 4 steps out. But Hymn's far small is also the Zealot's end of the near crossing into the Mystic's
Cloister. From `hymn.b` the road runs `spire.well.toCathedral.b` (5) → `toCathedral.a` (6) → Wandwork (7) → the
Cloister junction `spire.well.j1.a` (8) → Deep Well and Draught (9), Glass Skin and Quiet Pulse (11), Mind Bulwark (the
Mystic's keystone, 11). The Cloister is as near the Zealot as the Mystic (Deep Well My8 / Ze9). So "take my class's
first spell notable" and "leave my class" are now the same purchase, and the allocator shows every caster doing both:

| Zealot build | 60-point plan by region, now | before fix 1 (same tool, `G4/builds-start.json`) |
| ------------ | ---------------------------- | ------------------------------------------------ |
| staff-block  | Ze22 My39                    | Ze61                                             |
| fire-burn    | Ze23 My38                    | Ze44 My17                                        |
| block-caster | Ze26 My35                    | Ze23 My32                                        |
| storm-caster | Ze11 My50                    | Ze11 My50                                        |
| spell-totem  | Ze42 My19                    | Ze56 My5                                         |

Five different Zealot casters now open Zeal, Hymn, then the Mystic's Deep Well, Glass Skin and Quiet Pulse (four of them
also Warm Blood, Ready Wit, Living Verse). The staff-blocker takes no Zealot staff or block notable by 60. Round 1's F1
convergence (Zeal, Hearthfire, Vigil, Choirmaster) has moved, not gone: it is now a convergence on the neighbour's
Cloister, through the Zealot's own spell porch. §6.2 (a real choice, not committing), §13.8 (a generic start against
early direction), §4.6 (the Zealot sells its casters what they want, in its own voice).

**Proposed fix (trialled).** Keep Hymn and its lines; move the crossing off it. Cut `cathedral.home.hymn.b`–
`spire.well.toCathedral.b` and link `cathedral.home.roadE.b`–`spire.well.toCathedral.b` instead (the east road's second
node, the same 4 steps from the start, so the Mystic is no farther). Hymn keeps two ways in (`hubs.e` by `hymn.a`,
`roadE.a` by `hymn.b`) and becomes the porch it was meant to be. Trial, ten archetypes:

- staff-block back to Ze61 (Quarterstaff, Warding Staff, Crozier, Lectern), spell-totem Ze56, fire-burn Ze30 My31, storm
  Ze28 My33 (Hearthfire and Vigil come back into its opening). block-caster still goes to the Cloister (Ze24 My37), which
  is its build: one build crossing is fine (§8.3's "most of the time").
- Choice holds: 60 / 120 for spell-totem 5/5 (now 6/6), fire-burn 2/6 (2/6), staff-block 3/5 (4/6), aura-brand 3/4
  (2/4), block-caster 4/5 (4/3), storm 3/4 (3/4). The three Mystic builds are unchanged.
- A bare cut (no new link) was also trialled and rejected: it brings the casters home but drops storm-caster to one
  plan at 60, and takes a crossing off the border (§3.7).
- Re-aiming to `cathedral.home.jT.a` instead was trialled and does not work (fire-burn, staff-block and storm stay
  Cloister-first).

**A fix must not break:** §3.7 (the Mystic–Zealot border keeps its count; the link moves one node, it is not removed);
§3.5 (Hymn two ways in); §11.2/§11.5 (run `geometry.ts --region zealot` and `--region mystic`: the new link must cross
nothing and leave `roadE.b` at a clean angle; if it cannot, `toCathedral.b` may move a little toward `roadE.b`); §5.1
(Hymn's lines unchanged). The link is written once, in `spire/well.ts` (the link `from: 'toCathedral.b'` to
`cathedral.home.hymn.b`, about line 410), so the Mystic's file holds the edit; `toCathedral.b` keeps two links
(`toCathedral.a` and `roadE.b`) and must stay on a straight line between them (§11.5). Afterwards, check that at least the staff and storm casters' 60-point openings differ from
the fire caster's.

### F2. Thick Blood is the network's last stop for most builds: should fix

**Where:** `knife.edge.thickBlood.n` (Thick Blood, `10% life, +20 life, 5% energy shield`, 4.0 units; Sh7, My13, St11).

**What is wrong.** It is in **11 other classes' 120-point plans** and 4 more builds' "gave up at 120" lists (spell-totem,
bow-crit, bow-poison, summoner, wand-attack, dual-wield, fire-burn, aura-brand, storm-caster, staff-block,
block-caster, channeller, …). No other notable comes close (next: Hawk's Eye and Long Breath, 6 other-class plans each).
Generic life plus flat life plus a little shield is wanted by every build, sits 7 from one start and 11–13 from two
more, and so becomes the same late decision for half the network. §9.3 (good late-build decisions) and §5.3 ("generic
stats ... as lines on many notables, never as one destination").

**Proposed fix.** Re-line, not move (it is the Alleys' life notable and its position serves the Shade): drop the
`+20 maximum life` (4.0 → about 3.2 units, still within §8.6), which is the simplest version; or, beyond that, swap the
5% energy shield for a line the Shade's own builds weigh and casters passing through do not. The fixer chooses the
partner, with these exclusions: not evasion (Wiry Frame pairs life with evasion, Sh16), not energy shield (Hoarded
Breath, Shroud), not dodge (Soft Step and Quick Wrists at Sh4, Nimble Gambit at Sh8 already sell it near home; a third
here is the §5.5 neighbour problem). The Shade keeps a life notable near home (§4.5).

**Must not break:** §4.5 (the Shade's life supply: Thick Blood, Wiry Frame, Sea Legs), §8.6 (3 to 5 units), §6.2 (the
Shade's first ten points stay mixed: Keen Instinct, Soft Step, Quick Wrists, Spoils are unchanged).

### F3. The Strider's home is still twice as rich as the others, and its signature is what neighbours walk to: should fix

**Where:** `bow/home.ts`, the two hubs `bow.home.hubs.n`, `bow.home.hubs.s`; Hawk's Eye `bow.home.sig.n`. Picture:
`home-strider.png`.

**What is wrong.** S-7 took the two pockets off the start's side nodes (good, and the sides now have three links like
every other start), but it moved Long Breath onto `hubs.n`, which already held Hedge Magic. Each Strider hub now carries
**two** notable pockets (north: Long Breath, Hedge Magic; south: Vital Aim, Wayfarer); the other hubs carry one, except
the Vanguard's north hub, where Ringing Blows and the Banner share a small.
What lies near the start barely changed:

| start    | units within 5 | within 6 | notables within 6 (own) |
| -------- | -------------: | -------: | ----------------------: |
| Strider  |             49 |   **85** |              **12 (8)** |
| Reaver   |             41 |       61 |                  10 (7) |
| Vanguard |             34 |       53 |                   8 (6) |
| Shade    |             26 |       46 |                   8 (5) |
| Zealot   |             28 |       46 |                   8 (4) |
| Mystic   |             24 |       43 |                   8 (5) |

(Round 1: 92 against 43–64.) A bow-crit build's first 10 points buy Hawk's Eye, the Steady Draw keystone and Long
Breath (§2 walk); its 60-point plan holds two keystones. And the Strider's signature is the other dexterity builds'
stop: Hawk's Eye and Long Breath are in 6 other classes' 120-point plans each, and in all three Shade attackers' 60-point
plans at St8 (dagger-crit, claw-poison, dodge-blades each still spend more of their first 60 points in the Strider than
at home: 28/24, 30/25, 31/28). A trial that cut `hubs.n`–`bow.bows.hedgeMagic.a` and removed Footwork's evasion together
left those three plans holding Hawk's Eye and Long Breath: the pull is the home's own kit. §12.1 ("high-value nodes
packed too densely"), §6.2, §9.3.

**Proposed fix (two parts, both re-lines or moves, no new nodes):**

1. **Hawk's Eye** (4.7 units, the richest notable in the network): drop its `10% evasion` (the start's evasion side
   `sig.b` already sells it), about 4.7 → 3.7, the R-8 pattern applied to the last of round 1's rich start notables. It
   stays the bow attacker's natural first notable (attack damage, attack speed, dexterity) and stops being an evasion
   stop for the Shade.
2. **One pocket per hub.** Move Hedge Magic off `hubs.n`: cut `bow.home.hubs.n`–`bow.bows.hedgeMagic.a`; Hedge Magic is
   then reached by `hedgeMagic.b` off `bow.bows.toKnife.a` (St6) and by `hedgeMagic.a` off the Shade's
   `knife.home.toHedge.r1` (Sh6), a bridge between the two homes' roads, which is what its reason already calls it.
   `hubs.n` goes to four links (start side, ring, `jb3`, Long Breath). The trial above combined this cut with a Footwork
   re-line and the bows' 60-point choice fell (bow-crit 3 → 1, bow-elemental 2 → 1), which cannot be split between the
   two: the fixer re-measures the bows' choice after this cut alone, and if it falls, leaves Hedge Magic where it is and
   takes only part 1.

**Must not break:** §6.5 (the start still fans to the signature, two hubs, the ring and three roads; first notables at
2–4); §3.5 (Hedge Magic two ways in); §4.8 (the home stays mixed: Long Breath, Vital Aim, Wayfarer, Clear Head);
§11.5 (`hedgeMagic.a` then has links only to its notable and the Shade's road: check its line is straight, re-lay the
two smalls on the line between `toHedge.r1` and `toKnife.a` if not); T8's deferral (Hedge Magic stays the Strider's one
spell notable near home, one step farther).

### F4. Footwork is every dexterity build's first stop: U4's condition is met: should fix

**Where:** `yard.dual.footwork.n` (Footwork, `25% evasion, 15% accuracy`, 4.0 units), St7 / Re12, hung off the Strider's
south crossing (`bow.steel.road.jt1`–`yard.dual.j2.a`). Picture: `strider-lists-text.png`.

**What is wrong.** Fix-1 §5 U4 (the user's answer): "Re-measure after this round's evasion re-partners ... if it is still
every dexterity build's first stop, re-partner it then." It is in **seven of eight** dexterity builds' 60-point plans:
bow-crit, bow-elemental, bow-poison (all at St7), dagger-crit, claw-poison, dodge-blades (Re14), and the trap-mine's 120
plan; dual-wield gives it up only for Twin Fangs. It is the Reaver's notable, 5 steps nearer the Strider start than its
own. §6.2 (the dexterity starts' first points converge on a neighbour's notable), §5.1.

**Proposed fix.** Keep accuracy as its lead (its smalls are accuracy) and replace the evasion with a line the Reaver's
dual wielder wants and the bow does not. Not dual-wield speed (Twin Fangs, 5 steps away, has it; §5.5), not dodge
(Sidestep, 6), and not dual-wield crit (Crossed Blades, 9 steps away, is already crit with accuracy while dual
wielding: §5.1). The candidate: `accuracy(20), stunAvoid(20)` (about 3 units; a Reaver defence the Strider does not sell
near home), or another Reaver line the fixer prefers within those exclusions. **Not** accuracy with movement: that was trialled (`accuracy(25), moveSpeed(4)`) and Footwork dropped out of
every plan, which only trades one fault for a notable nobody takes (§15.2).

**Must not break:** §5.5 (Twin Fangs 5, Sidestep and Weaving 6 steps away, Crossed Blades 9, keep different partners); §4.5 (the
Reaver keeps its evasion on Weaving and Buckler); the near crossing's link stays (§3.7).

### F5. Neighbours' start notables are still common late picks; the fix pass made one more: consider

**What 120-point plans of other classes hold** (count of other-class plans / other-class "gave up at 120" lists):

- Long Breath 6/2, Hawk's Eye 6/1 (Strider; F3)
- Stout Heart 5/1 (Reaver), Zeal 5/0 (Zealot)
- Keen Instinct 5/0 and **Quick Wrists 5/0** (Shade: K-1's new notable at Sh4, taken late by bow-crit, bow-poison,
  wand-attack, dual-wield; it is also St10)
- Soft Step 4/0, Warm Blood 2/5
- Thick Blood 11/4 (F2)

Round 1's F6 asked to bring the start notables above about 4.4 units down. R-8 (Quickened Steel, Buckler) and S-4
(Clear Head) did; Hawk's Eye 4.7, First Light 4.6, Warlord's Banner 4.5 are unchanged (First Light is in no other
class's plan, so leave it; Hawk's Eye is F3). Quick Wrists (3.0 units) is cheap and pure offence, so its being taken by
attackers that pass the Shade's blade road is not wrong; watch it, no change proposed. Zeal's 5 are the strength
builds walking the Zealot's west hub (sword-str, mace-shield, warcry-totem, two-hand-fire, caster-life): a near crossing
doing its job. **Proposal:** only F3's Hawk's Eye line; the rest is a reading for stop 4, not a fault.

### F6. The Strider's keystones are early-game picks, not late ones: consider

**Distances** (own start / nearest start; working values 8 to 18, §16):

| region   | keystones                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| Strider  | Steady Draw **7**, Close Quarters 9, Plated Hide 10, Arrow Weave 11                                                   |
| Shade    | Nimble Gambit 8, Shade Leech 13, Spellslip 16, Cruel Agony 18, Hollow Vessel 18                                       |
| Reaver   | Shieldwall 12, Wound Dance 15, Crimson Pact 15/14                                                                     |
| Vanguard | Unerring Discipline 11, Strongarm 15/10, Rooted Stance 18, Blood Rite **24/22**                                       |
| Mystic   | Mind Bulwark 13/**11 (Ze)**, Mana Bastion 13/12, Prismatic Balance **19**, Pain Conduit **21/20**, Fever Pitch **23** |
| Zealot   | Idle Hands 14, Lone Vow 14, Living Ward 14, Searing Avatar **20**, Volatile Servants **20**, Sigil Warden **22**      |

Unchanged from round 1 but Prismatic Balance (20 → 19, M-6). Seven beyond 18, one under 8. Fix-1 §2.8 deferred these to
G5's keystone-distance pass, which stands.

**New observation for that pass (§9.3: "the late game lives in ... second keystones").** bow-crit holds **two keystones
at 60 points and three at 120** (Steady Draw 7, Arrow Weave 11, Close Quarters 9), all within 11 steps of home; the
three bows all take Arrow Weave by 60. For the bow, keystones are a first-hour decision and no part of the late game,
while the Mystic's elemental keystones are 19–23 out. Mind Bulwark (a Mystic keystone) is nearer the Zealot (11) than
the Mystic (13), through the Cloister F1 describes.

**Proposed for G5** (not now unless the fixer is already in `bow/bows.ts`): re-hang Steady Draw (with its one spur small) off the next junction
on the bows road past `bow.bows.road.jb4`, about 10–11 steps out, as round 1 proposed; no new spur small.
Close Quarters stays where the user put it (§16).

### F7. The centre's arches are in no plan: consider (a reading, not a fault)

None of the eight centre notables (Shelter, Firm Footing, Quick March, Hard Living, Sound Body, Provisions, Waste Not,
Well Rounded) is in any of the 28 archetypes' 60- or 120-point plans; Shelter and Waste Not appear in one or two
"gave up" lists. Fix-1 §2.7 asked for this re-measure (N9). Most of what they sell (resistances, chaos resistance, stun
avoidance, movement, flasks, mana cost) is lightly weighed or unweighed by the archetypes, so this says little about a
player, who needs resistances by map 20. §4.7 holds: every arch is generic sustain or utility. **No change proposed**;
in particular no offence in the centre. Worth a line at stop 4 so the user reads the zero correctly.

### F8. Two homes still lean to defence in their first steps: consider

From the offence / defence / utility count (§4.8, a guide, not a rule):

- **Reaver, steps 1–4: 64% defence, 0% utility**, the most of any start (Vanguard 26%, Strider 46%). Its three ways out
  each begin with defence: the middle road's three life smalls, Stout Heart's life pocket west, Buckler's block pocket
  east. Offence comes at 4–5 (Killing Pace's small at 4, Drill Call and Killing Pace at 5), so a player turning off at
  the right node is not in a corridor. Round 1 passed it. A pre-existing lean: R-8 made the signature pure offence, so the 64% is lower than it
  was before fix 1, not higher. No change proposed; noted so a later fix does not add more
  defence here.
- **Mystic, steps 5–6: 57% defence** (Warm Blood, Shelter, Firm Footing), as in round 1 (F7 there). M-4 made Ready Wit's
  side read spell first. A lean, unchanged.

The Vanguard–Reaver band of round 1 is gone (Vanguard steps 5–8 now 31% offence, was 23%; Weak Spot at Va8).

### F9. Small notes (not counted)

- **The Zealot's movement** is Procession at Ze20, its flasks the centre's Provisions at Ze6. §4.6 holds region-wide
  (the round-1 fix), but a Zealot wanting movement walks 20. Fine for a far trade.
- **Clear Head** (Strider, St6) is a one-door pocket after S-7. Allowed (§3.5–6); it is in no plan.
- **Field Dressing** is now the tip of a bridge from Stout Heart to Bracing (one link on the notable); its reason says so.

---

## 2. The first ten points, walked by hand

**Mystic** (`home-mystic.png`). Unchanged since round 1 but for M-4. Point 1: energy shield or crit side; 2: First Light
or a hub. West hub: Still Mind (mana, 4), Deft Wand (wand attacks, 6), Warm Blood (6), the Cloister (Glass Skin 7, Deep
Well 8). East hub: Sharp Mind (spell crit, 4), Ready Wit (spell damage, cast speed, 8), Warded Mind (7).

- Caster: side, First Light, east hub, Sharp Mind's pocket, two roads, Ready Wit's wheel: First Light, Sharp Mind,
  Ready Wit. **Gave up:** the west's mana and Deft Wand. **No-choice stretch:** the three attribute nodes of each hub
  road. **Nobody skips:** First Light.
- Wand attacker: west hub, Deft Wand at 6, Warm Blood. Sustain caster: Still Mind, Glass Skin, Deep Well.
- Verdict: real choice, coherent, not committing; spell damage thin from 2 to 8 (F8).

**Shade** (`home-shade.png`). Sides evasion and crit; Keen Instinct at 2.

- Attacker: Keen Instinct, the blade road to **Quick Wrists** (attack speed, dodge, 4), on to the claw/dagger wheel
  (Talon 6, Fine Point 7). **Chose:** a weapon. **Gave up:** Soft Step, Spoils.
- Dagger caster: north hub, Spoils (4) or the road to Quiet Knife (dagger spells with mana, 7).
- Evasion: south hub, Soft Step (4), then Snakeskin (7), Nimble Gambit (keystone, 8) or Hedge Magic (St6).
- Thick Blood (life, 7) sits beside the wheel and is what everyone, at home and away, ends up buying (F2).
- Verdict: the best home after fix 1. Three real directions by step 4, mixed (O 26% / D 40% / U 34% at 1–4), the
  attacker has its own notable now.

**Strider** (`home-strider.png`). Sides attack speed and evasion (three links each now). Hawk's Eye at 2.

- North hub: Long Breath (life, 4), Hedge Magic (spells, 4), the bows road (Elemental Fletching 6, Steady Draw 7), the
  ring (Quick March 5).
- South hub: Vital Aim (crit, 5), Wayfarer (evasion, resistances, 5), the Reaver's Lists (Twin Fangs 6, Footwork,
  Weaving, Sidestep 7), the ring (Hard Living 5).
- The signature's road: Clear Head (6), Quick Hands (6), Hard Target, Weathered (7).
- Bow crit, 10 points: side, Hawk's Eye, north hub, `jb3`, `hub.b`, `jb4`, the spur small, **Steady Draw**, `life.b`,
  Long Breath. Three notables and a keystone. **Gave up:** Vital Aim and Wayfarer for a few points more. **No-choice
  stretch:** none; the choice is too cheap to bite (F3).
- Verdict: varied and coherent, but the density means the first ten points take most of what is near, and a keystone.

**Reaver** (`home-reaver.png`). Sides melee physical and attack speed; Quickened Steel (offence now) at 2.

- West: life pocket to Stout Heart (4), Killing Pace (5), Keen Edge (swords, 7).
- East: Buckler (block, 4), Fighting Breath (5), Weaving and Twin Fangs (6–7).
- Middle: three life smalls; Drill Call (warcries, 5) off the first.
- Sword build: Quickened Steel, west hub, Stout Heart, Killing Pace's road, Keen Edge. **Gave up:** Buckler, Drill Call.
- Verdict: real choice, coherent; defence-led in steps 1–4 (F8).

**Vanguard** (`home-vanguard.png`). Sides armour and melee physical; Oathbound at 2.

- North: Ringing Blows (melee, enemy stun, 4), Banner (5), Shield Ram (6), Iron Lungs and Elemental Ward (7).
- South: Quartermaster (flasks, 4), Bracing (block, 6), Thunderstep (two-handed, 7), Unhurried (8).
- Middle: three life smalls, then **Weak Spot** (melee crit, 8) or the maces (10).
- Mace slammer: Oathbound, Quartermaster, Thunderstep, then Weak Spot. **Gave up:** Ringing Blows, the Banner.
- Verdict: fixed since round 1. Every direction mixes kinds by step 8 (O 31–35% in each band); the life road now ends in
  offence.

**Zealot** (`home-zealot.png`, `zealot-mystic-text.png`). Sides armour and elemental damage; Zeal at 2.

- West: Warlord's Banner (the Vanguard's, 3), Ardour (elemental attacks, 5), the nave wheel's block side (Iron Faith 6).
- East: **Hymn** (spell, lightning, 4), whose far small is the Mystic crossing (Wandwork 7, Deep Well 9); the east road
  to `jT.a` (5), then Hearthfire (fire, cast speed, 7), Vigil (7), Choirmaster and Shepherd (8).
- Middle: three life smalls to the nave wheel.
- Striker: Zeal, west hub, Ardour, Iron Faith or the Banner. Real choice.
- Storm caster: Zeal, east hub, Hymn, then straight on into the Mystic (Wandwork, Deep Well). Fire caster: the same,
  or Hearthfire. Staff caster: the same. **No choice** between Zealot spell directions: the first spell notable is the
  door out (F1).
- Verdict: the striker and the aura carrier are served; the caster has a first notable of its own now, but it leads away.

---

## 3. What is good (keep it when fixing)

- **Every start fans out**: signature at 2, two hubs at 2, each hub with a pocket, the ring and one or two roads. First
  notables at 3–4 everywhere (§6.5); no start is a chain.
- **The start sides.** All six starts' side nodes now have three links (start, signature, hub); the Strider's lost its
  pockets (S-7).
- **No weapon is named within three steps** of any start (§6.3); the nearest are wand smalls at My4, claw and dagger at
  Sh5, sword at Re5, block at Re3 (Buckler, an optional porch).
- **Weak Spot** (Va8): the Vanguard's life road ends in offence, melee crit near home (§4.6), and the Vanguard–Reaver
  defence band is gone.
- **Quick Wrists** (Sh4): the Shade attacker's home notable on its signature's road; Quiet Knife is now the dagger
  caster's alone.
- **Clear Head** sells the Strider's first reservation; **Procession** the Zealot's movement; **Field Dressing** movement
  instead of life (§4.6 gaps of round 1 closed).
- **Hymn's lines** (spell with lightning): the storm caster's lightning at 120 doubled. Only its link is the problem.
- **Bright Shafts at St12** (U3): the elemental archer's identity stat climbs past 120 again.
- **Varied defences** (§4.5): every region sells life, resistances, its class defence and at least two of block, dodge,
  stun, recovery and maximum resistances.
- **The centre** holds only generic sustain and utility (§4.7); the four newer arches each sell what both their homes lack
  near the start.
- **Keystones:** all 27 are dead ends; 24 hang off a road junction one or two smalls out.
- **The late game** lives where §9.3 says for most builds: the median late node (120 plan less the 80 plan) is 10 to 24
  steps out, and 23 of 28 builds take a third or more of their late nodes in a neighbour's region (the classic caster's
  in the Zealot's far north, the sceptre striker's in the Vanguard, the dagger caster's in the Mystic). Builds that stay
  home late (mace-slam 95%, dagger-crit 88%, dodge-blades 80%) do so because their region still has wanted nodes past
  120, which is the hunger G0 asked for.

## 4. Round 1 follow-up (must and should findings in this subset)

| round 1                                    | now                                                                                                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1 Zealot casters share one opening (must) | **partly**: Hymn gives the caster a home spell notable and the storm caster its lightning, but it is the door to the Mystic, and five casters now share a Cloister opening (F1)            |
| F2 Vanguard–Reaver defence band (should)   | **fixed**: Weak Spot, Field Dressing's movement; Vanguard 5–8 is 31% offence                                                                                                               |
| F3 Strider start pockets, density (should) | **partly**: the side pockets are gone (Long Breath 3 → 4, Clear Head → 6), but the density within 6 is 85 units against 43–61 (round 1: 92) and the north hub now carries two pockets (F3) |
| F4 §4.6 gaps (should)                      | **fixed**: Strider reservation (Clear Head), Zealot movement (Procession), Vanguard melee crit (Weak Spot); the Zealot's flasks are the centre's Provisions, by the brief's decision       |
| F5–F8 (consider)                           | F5 keystone distances deferred to G5 (Prismatic 20 → 19); F6 partly (two of the rich start notables trimmed, Hawk's Eye not); F7 a lean, unchanged; F8 Prismatic's spur shortened          |

## 5. Checklist

| item                                                                    | verdict                                                                                                                                                                                                               |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §4.5 varied defences in every region                                    | holds                                                                                                                                                                                                                 |
| §4.6 every region sells what most builds want                           | holds with exceptions: the Zealot's flasks only through the centre (Ze6) and its movement only at Ze20; the Zealot sells little plain attack speed (Ardour)                                                           |
| §4.7 the centre holds generic nodes only                                | holds (in no plan, F7, a weighting reading)                                                                                                                                                                           |
| §4.8 no large all-defence or all-offence stretch near a start (a guide) | holds with exceptions: the Reaver's steps 1–4 (64% defence), the Mystic's 5–6 (57%) (F8)                                                                                                                              |
| §6.2 first points: real choice, coherent, not committing                | holds with exceptions: the Zealot caster's first spell notable leads out of the region (F1); the Strider's density blunts its choice (F3); dexterity starts converge on Footwork (F4)                                 |
| §6.3 starts interesting, not prescriptive                               | holds; no weapon within three steps; every start's sides now have three links                                                                                                                                         |
| §6.4 specific porches optional                                          | holds (Deft Wand, Buckler, Quiet Knife, the Banner, Hymn)                                                                                                                                                             |
| §6.5 first notables 3–4 out, fanning out before then                    | holds (signatures at 2, as §6.3 allows)                                                                                                                                                                               |
| §9.1 keystones: 27, spurs off a junction, dead ends, distances 8–18     | holds with exceptions: seven beyond 18, Steady Draw at 7 (working values, G5); Close Quarters has no spur (the user's); Blood Rite and Sigil Warden hang off smalls; Cruel Agony and Hollow Vessel share one junction |
| §9.2 a keystone is a trade the sheet shows                              | not re-checked (the three without a cost are in §16)                                                                                                                                                                  |
| §9.3 good late-build decisions                                          | holds with exceptions: Thick Blood is half the network's last stop (F2); the Strider's keystones are bought by 60, not late (F6)                                                                                      |
