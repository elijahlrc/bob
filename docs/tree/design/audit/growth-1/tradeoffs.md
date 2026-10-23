# G4 audit round 1: specializations and trade-offs

Auditor: specializations and trade-offs (CONSTRAINTS §1.1, §5, §8.3, §13). Read-only: nothing in `src/`, `scripts/` or
the plan docs changed. Measured 2026-10-22 on the live network (1,389 nodes, the tree of commit 3b2affe) with
`npm run passives:supply`, `npm run passives:builds` (27 + 1 archetypes) and scratch scripts outside the repository
(pairwise steps, same-pairing search, wheel sides taken by each archetype, the share of each plan's value by area).
Steps are nodes bought, as the supply tool counts them.

Pictures (`audit/growth-1/tradeoffs/`):

- `dagger-crit.png`: the Shade's dagger crit build. Yellow is its best 60 points, orange what 120 adds, red what 40
  more would add. Its first 60 points run south into the Strider's home and the Reaver's Lists.
- `caster-es.png`: the classic caster, for comparison.
- `strider-string.png`: the Meadow, where Quick Hands, True Aim, Hard Target and Fleet Foot sit.
- `dex-middle.png`: the ground between the Shade, Strider and Reaver starts.
- `zealot-nave.png`: the Nave, where Hearthfire, Vigil, Litany and Choirmaster sit.

**Counts:** 2 must fix, 6 should fix, 6 consider. Proposals for the five seam clusters are in §2.

---

## 1. Findings, most important first

### F1. The Meadow: four wanted notables one or two steps apart, and a loop whose two sides everyone takes. **Must fix.**

**Where (Strider, The Meadow, 6 to 8 steps from the Strider start):**

- Quick Hands (`bow.string.speed.qh`: 10% attack speed, 5% cast speed)
- True Aim (`bow.string.aim.n`: 15% accuracy, 8% attack speed, +20 dexterity)
- Fleet Foot (`bow.string.speed.ff`: 8% movement, 13% evasion, 5% attack speed)
- Hard Target (`bow.string.hardTarget.n`: 17% evasion, 10% life, 10% avoid stun)

**What is wrong:**

- Quick Hands and True Aim are 2 steps apart, joined through `speed.m`. Both are attack-speed notables.
- Fleet Foot and Hard Target are linked directly, notable to notable. Both carry evasion.
- The "loop" named Quick Hands and Fleet Foot (`bow.string.speed`) is described as a choice, but every dexterity
  attacker takes both sides. At 60 points and again at 120, both sides are in the plans of all eight dexterity
  attackers: bow-crit, bow-elemental, bow-poison, dual-wield, dagger-crit, claw-poison, dodge-blades, and wand-attack
  at 120. No archetype takes only one side.
- The pairs Quick Hands + True Aim and Fleet Foot + Hard Target are the two most common "both bought, two steps or
  less apart" pairs on the whole network: each is in 16 of the 56 plans (28 archetypes at 60 and at 120). The next
  pair is in 15, the Zealot's Nave (F7).

**The player's view:** a Strider who reaches the Meadow buys attack speed, accuracy, evasion and life in eight points,
in any order, without giving anything up. The rogue from the Shade does the same thing at 12 to 14 steps.

**Rules broken:**

- §5.5: two clusters one build wants both of should not sit a step apart.
- §8.3: both sides of the loop are things every build of the theme wants, which makes it a fake choice. The user's
  allowance ("not every choice must be interesting for every build") does not cover this case, because here no build
  chooses.
- §14: fake micro-choices are a rejected idea.

**Already tried:** round 4 re-partnered Quick Hands, which used to sell accuracy and dexterity like True Aim
(CONSTRAINTS §16). That fixed the same pairing but left two attack-speed notables two steps apart, so the
neighbour problem stayed.

**Proposed fix:**

1. **Take True Aim out of the Meadow.** Make it the far attack-speed twin with a partner the near ones lack.
   - Accuracy with projectile speed, on the Strider's outer road (the Water Meadows or the Far Pasture road between
     J6 and J7), at 15 or more steps.
   - Or remove it outright: Hawk's Eye (step 2), Quick Hands and Fleet Foot already sell attack speed near home, and
     §12.1 allows removal.
   - Its node `aim.a` and the link `speed.m`–`aim.n` go with it. `speed.m` keeps its link to `added.n420`, so the
     Meadow keeps its two ways in.
2. **Make the loop a choice.** Re-line Fleet Foot as movement with evasion only (drop its 5% attack speed). Then the
   loop's west side sells attack speed (the attacker's side) and its east side sells evasion and movement (the
   kiter's side).
3. **Separate Fleet Foot and Hard Target.** Cut the direct notable-to-notable link. Hang Hard Target off the evasion
   run instead (`speed.b`–`hardTarget.a`), placed so that its life chain toward Round Shield stays its second way
   in. The looks auditor has to check the geometry. A line straight from Hard Target to `hardTarget.a` would pass
   over Fleet Foot, so Hard Target must move a little north first.

**Must not break:**

- §3.5: the Meadow keeps two ways in.
- §6.5: the start still fans out. Hawk's Eye and Long Breath at 2 to 3 steps are untouched.
- §11.5: no new bends at two-link nodes.

### F2. Evasion is one destination around the Strider start, and the Shade's attackers live there. **Must fix.**

**Where:** the ground between the three dexterity starts (`dex-middle.png`).

- The supply map counts 12 evasion notables. Seven of them are within 8 steps of the Strider start: Hawk's Eye (2),
  Wayfarer (5), Soft Step (6), Hard Target (7), Weaving (7), Footwork (7) and Keen Instinct (8). Wanderer (7) and
  Fleet Foot (8) carry evasion too.
- The rest are far: Field Kit (15), Grey Cloak (16 from the Shade), Veiled Herald (17), Wiry Frame (16) and Tall Grass
  (20).
- Three of the near ones are the same pairing, evasion with life, each 7 steps from the Strider start in a different
  direction:
  - Hard Target (17% evasion, 10% life)
  - Weaving (`yard.dual.twinFangs.n2`: 20% evasion, 5% life)
  - Wanderer (`bow.flight.added.n428`: 8% evasion, 8% life, +10 all attributes)
  - Two more evasion-with-life notables are far: Wiry Frame (Shade, 16) and Tall Grass (Strider rim, 20; evasion
    with regeneration).

**How the builds use it:**

- The Shade's three attackers take more of their 60-point value from the Strider and the Reaver than from the Shade:
  - dagger-crit: Strider 48% and Reaver 17%, against Shade 35%
  - claw-poison: Strider 50% and Reaver 15%, against Shade 36%
  - dodge-blades: Strider 44% and Reaver 12%, against Shade 44%
- dagger-crit's 60-point plan holds ten Strider and Reaver notables (Hawk's Eye, Long Breath, Vital Aim, Wayfarer,
  Quick Hands, Hard Target, Fleet Foot, True Aim, Footwork, Weaving) against eight of its own.
- The path the Shade's attackers walk: the Shade start → its south hub → `knife.home.toHedge.r1` → Hedge Magic's
  small → the Strider hub → Hawk's Eye, 8 steps.
- At 120, evasion barely climbs for the Shade's attackers: dagger-crit +16% and dodge-blades +13% for 40 more points.

**The player's view:** a Shade who wants to attack spends the first map's points in the Strider's garden. The two
regions do not feel different, and the evasion choice is "which of three identical evasion-and-life notables first".

**Rules broken:**

- §5.1: same pairings spread are not a choice.
- §5.3 and §13.2: concentration must never become one destination.
- §4.6 is the cause rather than my subset, so the starts and discipline auditors should see it too. The Shade sells
  6.8 units of attack lines in all, all of them weapon-specific and far, so its attackers have no reason to stay
  home.

**Proposed fix (re-partner first; no new supply near any start):**

1. **Wanderer** (the user's editor node; §15.9 asks no deference): drop its evasion. It becomes the traveller's
   notable: all attributes with life, or all attributes with movement. It keeps its place on the Strider's flight
   road.
2. **Weaving** (the Twin Fangs wheel's non-dual side): re-partner its evasion away from life. Evasion with avoid
   elemental ailments, or with avoid stun, keeps the wheel's two sides different in kind (dual wield or a defence).
3. **The Shade's own attack speed:** re-line one existing Shade cluster near its home, on the side away from the
   Strider border, in the Shade's voice. Attack speed with dodge, or with crit multiplier, would make the Shade
   attacker's first choice "my home or the Strider's" instead of "the Strider's".
   - This is a re-line, not new supply. Candidates are the Spoils pocket (mana regeneration with flask recovery) or
     the Alleys' side of the edge wheel.
   - Raking Hand already sells claw attack speed, so the candidate must not be in the claw cluster.
4. **The far evasion twin** comes from the Strider–Shade seam cluster (§2, seam 4): evasion with attack speed, 20 or
   more steps out. It gives evasion a far direction with its own partner.

**Must not break:**

- §4.5: varied defences per region. The Strider keeps Hawk's Eye, Wayfarer, Hard Target and Fleet Foot.
- §6.2: starts not too prescriptive.
- §4.8: the Strider's home stays a mix of offence and defence.

### F3. Flat because it is out of reach, not because it is finished: the far specializations no build reaches. **Should fix.**

The targets summary reads a main stat that 40 more points barely raise as "the build has all it wants". For three
specializations the supply exists, but no plan reaches it even at 160 points, so the stat looks finished when it is
really cut off by distance.

| specialization                        | stat at 120 → 160                                           | notables that no plan or gave-up list reaches                                          |
| ------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| elemental attacks (the elemental bow) | elemental attack damage 10 → 10 units (0%); bow damage +9%  | Bright Shafts (23 from the Strider), Live Wire (23), Stormstruck (16)                  |
| traps and mines                       | trap and mine damage 13.7 → 13.7 (0%); evasion flat as well | Hair Trigger and Shaped Charge (the ST-6 fork: 20 from the Strider, 24 from the Shade) |
| traps (a third copy)                  | (as above)                                                  | Snare Line (Mystic, 24 from the Shade)                                                 |

In all, 32 notables appear in no plan or gave-up list. Most have no archetype of their own (shield attacks,
channelled attacks, stun), and that is fine. These three groups do have one.

**The player's view:** an elemental archer's second and third elemental clusters are 23 steps out on a road that
connects to nothing it wants. That is a long path with little off it, not a trade-off.

**Rules broken:**

- §1.1: a stat that cannot be reached makes no decision.
- §3.3 and §14: long paths that connect to nothing.
- G-growth §4, the first risk: tension by tax.

**Proposed fix:**

- **The far south.** Make it a loop. The Strider round-3 report's option (a): a bridge from Bright Shafts or Live Wire
  back to the outer road at `j5`/`j6`, so the band has two ways in and the far elemental clusters cost a direction
  instead of a dead-end walk. The network auditor owns the link; my subset asks only that the elemental bow's far
  twin becomes a real second direction.
- **The trap fork** gets a second way in from the Shade side through the Strider–Shade seam cluster (§2, seam 4).
- **Snare Line** stays where it is. It is the Mystic's trap cluster, not the Shade's.

The missing rule this shows is in §3.

### F4. The sword build takes every sword cluster; Greatblade's partner does not bite. **Should fix (Greatblade); consider (the rest).**

**Where:** six sword notables within 16 steps of the Reaver start:

- Keen Edge (7)
- Darting Steel (13)
- Sword and Board (13)
- Fleet Blade (15, the Strider's Longbow wheel)
- Bloodied Edge (16)
- Greatblade (`wall.grit.greatblade.n`, 16, the Vanguard's Barrows)

**What the measure shows:** sword-str's 120-point plan takes all six, and sword damage then gains 4% for 40 more
points. The build does trade: life climbs 81% and armour 56% past 120. So the user's example ("should not be able to
take all the life, all the armour and all the sword damage") holds in the letter, because it gives up life and armour.

**What is wrong:** one partner fails. Greatblade is meant as the two-handed sword's cluster (16% sword, 16% two-handed,
+12% crit multiplier, with two 10% sword smalls), but its sword half is worth as much to a one-handed sword-and-board
build as to a two-hander. The one-handed build buys it as more sword, and the two-handed partner never matters.

**The player's view:** a sword-and-shield player walks into the two-hander's notable and loses nothing by doing so.
The Reaver round-3 report and the Vanguard round-3 report (§9 item 4) both name Greatblade's sword half as the lever.

**Rules broken:** §5.1, picking the cluster is picking the partner.

**Proposed fix:**

- Re-line Greatblade's two smalls (`wall.grit.greatblade.a`, `.b`) from 10% sword damage to two-handed melee damage.
  The cluster becomes two-handed-led with the sword on the notable alone. A one-handed sword build then pays 3 points
  for 1.6 units of sword, and a two-handed sword build still finds its home.
- Do not add a sword cluster (Reaver round-3 report §3; adding one would be supply for the number's sake).

**Must not break:** §8.2 (Greatblade's smalls stay uniform) and §5.4 (it stays on the Vanguard–Reaver border, which
supplies strength and dexterity; checked, the path from the Reaver start is all +6/+6 roads).

### F5. Same pairings near the dexterity starts: Killing Eye and Mercy Stroke, Sidestep and Soft Step. **Should fix.**

| pairing                                                        | notables                                                                     | steps apart | from the starts                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------: | ----------------------------------------------------------------------------------------------------- |
| crit multiplier with damage against low life (identical lines) | Killing Eye (`bow.quiver.added.n440`), Mercy Stroke (`knife.snares.mercy.n`) |          12 | Killing Eye: Strider 12. Mercy Stroke: Strider 9, Shade 13, so nearer the Strider than its own start. |
| dodge, evasion, movement (identical lines)                     | Sidestep (`yard.dual.sidestep.n`), Soft Step (`knife.home.softStep.n`)       |          13 | Sidestep: Strider 7, Reaver 9. Soft Step: Shade 4, Strider 6.                                         |

**What is wrong:**

- Killing Eye was re-partnered in round 4 to end a same pairing, and the same pair now exists with the Shade's Mercy
  Stroke. Killing Eye is in no plan at all. Mercy Stroke is taken by dagger-crit, so the bow's crit multiplier is
  being sold by a Shade notable on the Strider border.
- Sidestep and Soft Step are both within 7 steps of the Strider start. dagger-crit and dodge-blades take both.

**Rules broken:** §5.1.

**Proposed fix:**

- Mercy Stroke keeps crit multiplier and takes a Shade partner: crit multiplier with poison damage, or with dagger and
  claw crit. Killing Eye stays the bow's.
- Sidestep keeps dodge but swaps movement and evasion for something the Lists sell: dodge with dual-wield block, or
  dodge with accuracy (the Lists' own voice). Soft Step stays the Shade home's evasion notable.

### F6. The Cloister is every int caster's first stop, from two starts. **Should fix.**

**Where:** The Cloister (`spire.well`), west of the Mystic start. It holds Glass Skin (energy shield with mana, 7),
the Deep Well wheel's energy-shield smalls (8), Composure (energy shield with avoid stun, 13), Quickening (energy
shield recharge, 16), Quiet Pulse (life, 13), Living Verse (spell damage with life, 20), Wandwork, Spirit Ward and
Mana Tap.

**The numbers (share of the 60-point plan's value from this one area):**

- Mystic builds: caster-es 46%, channeller 49%, wand-attack 35%, summoner 33%.
- Zealot builds: block-caster 45%, aura-brand 42%, spell-totem 37%, fire-burn 30%, storm-caster 25%.
- The aura-and-brand build, a Zealot, gets more of its first 60 points from the Mystic's Cloister than from all of its
  own Nave and Choir together.
- Parts of the Cloister are cheaper from the Zealot start than from the Mystic start: Quickening 14 against 16, Quiet
  Pulse 11 against 13, Mind Bulwark 11 against 13, Wandwork 7 against 10.
- No other area reaches more than 36% of any archetype's 60-point value.

**What is wrong:**

- The user's first example is the caster who wants all the spell damage and all the energy shield. The Mystic's three
  energy-shield-led notables sit 6 to 7 steps apart in one direction, so "energy shield" is one direction instead of
  two or three with different partners.
- The Zealot's own casters have no energy shield direction of their own near home. The Zealot's energy shield is
  Hymn's 5%, Vigil's recharge, Litany's 5%, then Wake and Rood Screen at 23 and 26 steps.

At 120 points the classic caster still climbs (energy shield +21%, spell damage +29%), so the build is not finished.
The problem is that the first half of every int caster's build, from either start, is the same walk west.

**Rules broken:**

- §5.1 and §5.3: one destination.
- §13.2: identity against spread.
- §4.6 for the Zealot (its casters' energy shield in its own voice).

**Proposed fix:**

1. **Move Quickening** (`spire.well.recharge`) out of the Cloister to the Mystic's north spine, near Siphon (energy
   shield on hit) on the Belfry. The pure-recharge notable then sits in a second direction, 15 or more steps from the
   Zealot, and Siphon and Quickening become the spine's energy shield. Keep 5 or more steps between them, or
   re-partner one.
2. **Give the Zealot one energy-shield cluster in its own voice,** on the side of its home away from the Cloister:
   energy shield with spell block, or with life regeneration. Do it by re-lining an existing pocket, not by adding
   supply near the start.
   - The Glass Wall side of the Homily wheel already sells energy shield with spell block at 14 steps.
   - Making that the Zealot's energy-shield side (F11) is the cheapest version of this fix.

**Must not break:**

- §4.5: the Mystic keeps energy shield near home in Glass Skin.
- §6: the Mystic's first notables are unchanged.
- §3.7: the Mystic–Zealot links stay.

### F7. The Nave knot: Hearthfire is a four-way hub with Vigil, Litany and Choirmaster each two steps off it. **Should fix.**

**Where (`zealot-nave.png`):** Hearthfire (`cathedral.nave.wheel.n5`: fire, cast speed, maximum fire resistance, 7
from the Zealot start) has four links:

- its wheel's two fire smalls
- Vigil's regeneration small, 2 steps to Vigil (life regeneration, energy shield recharge, 8)
- Litany's cold resistance spoke, 2 steps to Litany (the resistance star, 9)

Choirmaster (auras, mana, 8) is 2 steps from Vigil.

**The numbers:**

- Hearthfire with Vigil, and Hearthfire with Litany, are each in 15 plans. Choirmaster with Vigil is in 14.
- Every Zealot caster's 60-point plan contains all four, and the storm caster (lightning) buys the fire notable to get
  through.

**The player's view:** a Zealot caster's first 15 points are the same four notables whatever the build. The Iron
Faith / Hearthfire fork is the only choice, and the fire side wins because the defences hang off it.

**Rules broken:**

- §5.5: neighbours compete.
- §6.2: the first points should not commit. That one belongs to the starts auditor too.

**Proposed fix:**

- Hang Vigil and Litany off road nodes instead of off Hearthfire. Litany's cold spoke moves to the Nave road junction
  between Litany and the Vestry (the attribute node south-west of Litany in the picture). Vigil's regeneration small
  moves to the Narthex–Choir road junction east of it.
- Hearthfire becomes the fire side of its wheel and nothing more. The shield side (Iron Faith) then competes on equal
  terms, and the defences are a third direction.

**Must not break:** §3.5 (Vigil and Litany each keep two ways in) and §4.8 (the home stays a mix of offence and
defence).

### F8. Spell damage with cast speed, three times. **Should fix (Hasty Words); consider (the others).**

The same pairing appears three times:

- Arcane Focus (`spire.craft.focus`: 20% spell, 6% cast; Mystic 8)
- Hedge Magic (`bow.bows.hedgeMagic`: 16% spell, 6% cast; Strider 4, Mystic 12)
- Hasty Words (`knife.roofs.hasty`: 20% spell, 6% cast; Shade 24)

Arcane Focus to Hedge Magic is 16 steps; to Hasty Words, 18. Spellsword (16% spell, 6% cast, mana regeneration) is a
near-copy in the Reaver.

**How the builds use it:** Hasty Words, new in G3, is the gave-up notable worth the most to three Zealot casters
(fire-burn, block-caster, storm-caster: 4 units each). Its pull is that it is the same notable as Arcane Focus, only
farther.

**Rules broken:** §5.1. Mitigated because spell damage is generic and each region should sell some (§4.6, §5.3), but
§4.6 asks for each region's own voice.

**Proposed fix:**

- Re-partner Hasty Words in the Shade's voice: spell damage with spell crit (the Shade has Glint's spell crit 9 steps
  away, so keep 5 or more), or spell damage with dodge spells. Keep the notable at 4 to 5 units.
- Hedge Magic and Spellsword can stay. They are the Strider's and the Reaver's one spell notable each, near home, for
  their off-builds. If a later round re-partners them: Hedge Magic with mana, Spellsword with melee and spell
  ("spellblade").

### F9. Same pairing in two strength homes: Scarred Hide and Stone Heart. **Consider.**

Scarred Hide (`yard.shield.steelRim.n2`: 10% life, 16% stun threshold; Reaver 8) and Stone Heart
(`wall.rampart.stoneHeart.n`: 12% life, 16% stun threshold; Vanguard 8) are the same notable, 21 steps apart. Three
builds take both: sword-str at 60, mace-shield at 60, and mace-slam at 120.

**Proposed fix:** Scarred Hide becomes life with chaos resistance, or life with avoid ailments. It stays the life side
of the Steel Rim wheel. It must not take life on block, which the G1 brief rejected because both sides would be
shield notables. Stone Heart stays the Vanguard's stun voice.

### F10. Flasks with life, twice, five steps apart between two homes. **Consider.**

Quartermaster (`wall.home.quartermaster`: flask effect and recovery, 5% life; Vanguard 4) and Field Dressing
(`yard.home.fieldDressing`: flask recovery and duration, 5% life; Reaver 7) are 5 steps apart. mace-slam and
mace-shield take both at 60.

**Proposed fix:** drop Field Dressing's life line for a Reaver partner, such as flask recovery with leech or flask
duration with movement. Flasks are generic (§5.3), so this is a voice question, not a rule failure.

### F11. Homily and Glass Wall: the route takes one side, and every caster also buys the other. **Consider.**

The Homily wheel (`cathedral.crypt.wheel`; Zealot 14, Mystic 20) is taken on both sides by seven casters at 60 points.

- Glass Wall's side is the route from the Zealot to the Spire: `m6` links `spire.well.toCrypt.r4`, and Glass Wall
  links `crypt.toSpire.a` to Living Verse.
- Homily's side (16% spell damage with two 8% spell smalls) is a three-node detour that every caster pays.
- Both ends (`m1`, `m4`) are 5% energy shield smalls, so spell damage and energy shield come in one cluster.

This is §8.3's second form working as written (the route takes one side and the other costs a detour), and it is 14
steps from the Zealot start, so the convergence rule's "near a home" is not clearly broken.

**Proposed fix:** if F6 is taken up, make the ends spell block (`spellBlock(2)`) instead of energy shield. The wheel
then reads spell damage north and spell block with flat energy shield south, and its energy shield belongs to the
Glass Wall side only.

### F12. Zeal, the Zealot's signature, carries life and armour at step 2. **Consider.**

Zeal (`cathedral.home.sig`: 10% elemental damage, 8% global defences, 5% life, with a 12% armour small) puts life with
armour at step 2. The G1 brief's convergence check (§4.3) named First Light and Oathbound as the two exceptions and
missed this third one.

It is small (one unit of life), and the Zealot is not the strength sword build's home.

**Proposed fix:** either name it as the third exception in the convergence list, or swap its 5% life for 5% mana or
energy shield (the int half of a str-int start).

### F13. Darting Steel inside the sword build's 60-point plan. **Consider (already open).**

The Reaver round-3 report's open item, unchanged. Darting Steel (sword with sword attack speed, 13 from the Reaver) is
only movable along with its border link, and Fleet Blade (sword with sword attack speed and evasion, Strider 8) is
nearly the same pairing, 18 steps away.

**Proposed fix:** when Darting Steel's link is next touched, re-partner Darting Steel to sword with accuracy and crit
chance with swords. Fencer's Eye, 12 from the Reaver, is in no plan, so its crit with swords and axes could fold into
this one.

### F14. The elemental attack pairing, twice. **Consider.**

Ardour (`cathedral.home.ardour`: elemental attack damage, attack speed, accuracy; Zealot 5) and Elemental Edge
(`yard.blades.elementalEdge`: elemental attack damage, accuracy; Reaver 10) are 21 steps apart. They are far enough
apart that no build takes both.

Accuracy is overused as a partner across the attack clusters: Keen Edge, Light Blades, Footwork, Steady Hands, True
Aim, Heavy Hands, Elemental Edge and Ardour. A later round could vary it.

---

## 2. The seam clusters (the coordinator's question)

**The method**, applied with the same tools:

1. List the families that already have a notable within about 7 steps of the seam's two anchors, and exclude them
   (§5.2).
2. Require that archetypes on both sides of the seam weight the candidate's lines at 0.5 or more (`archetypes.ts`).
3. Check that the cluster does not become a third wanted notable in an existing group of wanted notables within 5
   steps of each other (a one-stop shop).

Each seam below names its lead, its partner, and why. Run the third check with the allocator once the cluster is
placed.

| seam                                                                     | excluded (a notable within about 7 steps)                                                                                                                                                                                                                                                                                                                                                                                 | proposal                                                                 | why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reaver–Strider**, between Festering and Pitch Arrows (10 steps apart)  | poison (Fouled Tips 2 from Pitch Arrows), fire, sword (Bloodied Edge 4, Darting Steel 5), totems (Sentry Post 5), leech (Red Harvest 6, Thirsty Quiver 7), lightning attacks (Stormstruck 7), dual wield (Crossed Blades 7), fervour (Hot Blood 6)                                                                                                                                                                        | **Physical attack damage with crit multiplier**                          | Weighted by sword-str (1 / 0), axe-bleed (0.8), dual-wield (1) and bow-crit (1 / 0.8): the strength-dexterity melee builds and the physical archer both want it. The nearest physical attack notables are Heavy Draw and Deep Cuts, far east; the nearest crit notable is Crossed Blades (dual crit chance, 7; a different partner) and then Fencer's Eye (13). Not elemental attacks: Pitch Arrows and Stormstruck are each 7 away, and a third elemental attack notable there would make an elemental-attack shop. A second choice is an axe cluster with crit (axe's third home after Hewing and Cleaver; Hatchet Work is 10 to 14 away), but fewer builds would want it.                                                        |
| **Mystic–Zealot**, between the crypt road and the far loop               | spells (Living Verse, Shattering Rite, Tomb Dust, Homily), elemental, minions (Familiars), fire (Cinder), channelling (Plainsong), energy shield (Tomb Dust, Glass Wall)                                                                                                                                                                                                                                                  | **Spell crit chance with mana regeneration** (or with reduced mana cost) | This seam is already the casters' crossroads: seven casters take Living Verse, Homily or Glass Wall. Another spell damage or energy shield notable would make it a shop. Spell crit is flat for the life caster (13.4 → 13.4 at 120 → 160) and weighted 0.4 to 1 by every caster on both sides. Its nearest twin is Cold Light (9 to 11 steps). The partner is sustain, not damage or energy shield, so the convergence rule is not touched. A second choice is auras with energy shield recharge (aura-brand 1, summoner 0.6; Choirmaster is 9 to 10 away).                                                                                                                                                                        |
| **Mystic–Shade**, around Pinpoint and Black Powder (5 steps apart)       | crowded: wand (Pinpoint), mines (Black Powder), traps (Snare Line 4 to 5), lightning (Overcharge 5), minions and curses (Bad Company 5 to 6), dodge (Mist Walk 5 to 7), dagger spells (Ritual Blade, Sharp Tongue), energy shield (Shifting Ward)                                                                                                                                                                         | **Attack speed with projectile damage**                                  | The thin family on both sides is attack speed. The Mystic sells 0 units of attack lines, and the Shade 6.8, all weapon-specific. wand-attack (0.8 / 0.6; its attack speed is flat at 17 and comes from the Strider) and the Shade's attackers (0.8) want it. The nearest projectile notables are the Strider's, more than 20 steps away. It also gives the int and dexterity attackers a reason not to walk to the Strider (F2).                                                                                                                                                                                                                                                                                                    |
| **Strider–Shade**, near the trap and mine fork                           | traps and mines (Hair Trigger and Shaped Charge, 6 apart), crit (Hair Trigger, Kill Shot), bow (Kill Shot), life with resistances (Hardy Stock), life with dodge (Sea Legs), reservation with evasion (Veiled Herald)                                                                                                                                                                                                     | **Evasion with attack speed**                                            | Evasion is weighted 1 by trap-mine, the bows and the Shade's attackers; attack speed 0.8 by the bows and the attackers. It is the far evasion twin F2 asks for (the near evasion is all within 8 of the Strider start), with a partner none of the far ones has (Field Kit: flasks; Tall Grass: regeneration; Grey Cloak: energy shield). As a bridge from the Shade's rim road to the fork node, it gives the fork the second way in from the Shade side that F3 asks for. Not energy shield with evasion: that is Grey Cloak's pairing. Not area damage: only trap-mine weights it.                                                                                                                                               |
| **Zealot–Vanguard**, around Idle Hands and Graven Posts (10 steps apart) | totems (Graven Posts, Idle Hands), stun (Stagger 2), mace (Crushing Blow 4, Hallowed Hammer 4 to 6), elemental attacks (Hallowed Hammer), block (Locked Shields 5, Warding Staff 6, Frozen Font 6), mana (Iron Lungs), charges (Scar Tissue), leech (Tithe 6), cold and auras (Rimed Steel and Benediction 7). Warcries were checked first, as asked: Battle Hymn is 8 to 10 from both anchors, so they are excluded too. | **Fire damage with attacks, with life**, placed at the Idle Hands end    | Both sides' strength-intelligence strikers want it: sceptre-fire (Zealot: fire attack flat at 20 → 20) and two-hand-fire (Vanguard: fire attack flat at 21.4 → 21.4) weight fire attacks and life at 1. Hot Iron is 15 from Idle Hands and Kindled Steel 16. The partner is life, not stun, ignite, area or a weapon, which those twins already use. The risk: Hallowed Hammer (mace and sceptre damage with elemental attack damage) is 6 from Idle Hands, so the sceptre striker would find two elemental-attack notables within about 6 steps. Place it 6 or more from Hallowed Hammer and run the third check. If that fails, the fallback is maximum resistances with life regeneration (every archetype weights both at 0.4). |

---

## 3. What is good in this subset (keep it)

- **Twin distances.** Across the supply map's specializations, the only twins under 5 steps are wheel sides built as variants and the
  pairs named above:
  - Wheel sides: Athame / Long Knives (dagger caster or attacker), Reliquary / Runecarver (totems or brands), Broad
    Weave / Darting Bolts (spell area or spell projectiles), Deep Well / Glass Skin (the user's call).
  - The Meadow pairs (F1).
  - Two home pairs: Keen Instinct / Soft Step at the Shade home, and Oathbound / Ringing Blows at the Vanguard home.
  - Weapons sit 7 to 16 apart: bow 13 to 16, wand 10 to 13, mace 8 to 10, dagger 7 to 9 apart from the Athame wheel,
    claw 8 and 17, axe 12, curses 9 or more.
- **Wheels that work** (by the allocator, both sides almost never taken by one build):
  - Longbow / Fleet Blade (bows take Longbow, swords take Fleet Blade)
  - Far Flight / Barbed Arrows
  - Split Volley / Deep Cuts
  - Talon / Fine Point
  - Gilded Rod / Quarterstaff
  - Rimed Steel / Benediction
  - Trapper / Black Flock
  - Rotting Word / Sapper
  - Full Swing / Paired Steel
  - Arcane Focus / Warded Mind
  - Iron Faith / Hearthfire (the shield caster alone takes both)
  - Steel Rim / Scarred Hide (only mace-shield takes both)
  - Choirmaster / Shepherd (only the summoner takes both, as §8.3 allows)
  - Twin Fangs / Weaving (dual wielders take both; seven others take Weaving only)

  The only wheel every builder of its theme takes whole is the Quick Hands / Fleet Foot loop (F1).

- **Weapons where their attributes are (§5.4):** holds everywhere.
  - Cleaver and Greatblade sit on all-strength-and-dexterity roads from the Reaver start.
  - Hallowed Hammer and Gilded Rod are on the strength-and-intelligence border.
  - Wands are all in the Mystic, daggers and claws in the Shade, and the dagger spell (Sharp Tongue) in the Mystic.
  - Two Fists is on strength roads.
- **The convergence rule:** no new cluster pairs spell damage with energy shield, life with armour, or a sword with
  either, near a home. The exceptions are the named signatures and Zeal (F12).
- **One-stop shops by the whole-network measure:** no group of wanted notables within 5 steps of each other holds
  more than 22% of any archetype's wanted value, and most hold 10 to 18%. The shops this audit finds are directions
  and areas (F2, F6), not single clumps.
- **The user's two examples face real choices at 120 points.**
  - The classic caster: 7 near-equal plans; 40 more points add spell damage +29%, energy shield +21%, cold +71%.
  - The strength sword build: 3 plans; life +81%, armour +56%, sword +4%. It chose sword over life and armour.
- **The G3 placements that kept twins apart:** Festering and Fouled Tips at 12, Cold Light and Tomb Dust at 5 (different
  kinds), the poison spread, and Salt in the Wound moved onto the casters' road. The user's decision against a
  Festering–Pitch Arrows link (poison twins about 3 apart) is consistent with this audit.

## 4. Missing rules (CONSTRAINTS §15.4)

1. **For G-growth §1 (the measure), a reading note, not a new restriction:**

   > A main stat that 40 more points barely raise is finished only if the plan could have reached more of it. When the
   > stat's other clusters are in no plan even at 160 points, it is out of reach, and the fix is a second way in or a
   > nearer twin, not a verdict that the build is satisfied.

   F3 is the case. Without the note, the targets read an unreachable specialization as one the network already makes
   choose.

2. **For §5.1, one sentence:**

   > A same pairing also counts across a border when both copies are within reach of one start (for example, both
   > within about 10 steps of it). Different home regions do not make two copies of one pairing a choice.

   F2 (evasion with life, three times around the Strider start) and F5 (Mercy Stroke on the Strider side of the
   border) are the cases. The G1 brief's "kept: different starts" let them through.

3. **Not proposed:** a numeric cap on a single area's share of a plan. F6's numbers say where to look, but a cap would
   be a rule placed to satisfy a number (§14).

## 5. Checklist of this subset

| item                                                                                                     | verdict                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §1.1 the tree forces trade-offs                                                                          | holds with exceptions: the dexterity attackers' first 60 points (F1, F2); the Zealot casters' first 15 (F7); the far specializations that look finished but are cut off (F3)                                                                                                                  |
| §5.1 two or three clusters per specialization, each with a different partner                             | holds with exceptions: evasion with life ×5, three of them near the Strider (F2); Killing Eye = Mercy Stroke, Sidestep = Soft Step (F5); spell damage with cast speed ×3 (F8); Scarred Hide = Stone Heart (F9); Quartermaster ≈ Field Dressing (F10); Greatblade's partner does not bite (F4) |
| §5.2 twins about 5 or more steps apart                                                                   | holds with exceptions: Quick Hands and True Aim, 2 (F1); home pairs Keen Instinct / Soft Step and Oathbound / Ringing Blows, 4 (acceptable at a home); wheel variants by design                                                                                                               |
| §5.3 concentration by intent; generic stats never one destination                                        | fails for evasion around the Strider start (F2) and energy shield in the Cloister (F6); holds for weapons, elements, life and armour                                                                                                                                                          |
| §5.4 weapon clusters where their attributes are supplied                                                 | holds                                                                                                                                                                                                                                                                                         |
| §5.5 neighbours compete                                                                                  | fails in the Meadow (F1); holds with an exception at the Nave knot (F7)                                                                                                                                                                                                                       |
| §5.6 specific paths are fine if optional                                                                 | holds                                                                                                                                                                                                                                                                                         |
| §5.7 named builds exist (minions, spirit shield, wand attacks in the Spire)                              | holds (minions in four regions, Spirit Ward, five wand clusters)                                                                                                                                                                                                                              |
| §8.3 micro choices are real                                                                              | fails for the Quick Hands / Fleet Foot loop (F1); every other two-notable wheel passes the user's "all builds of the theme take both" test                                                                                                                                                    |
| §13.1 connections against trade-offs                                                                     | holds with an exception: the Shade's south hub reaches the Strider home in 8 steps (F2). The proposed fix re-partners instead of cutting the link, so §3.7's crossings are kept                                                                                                               |
| §13.2 identity against spread                                                                            | holds with exceptions F2 and F6                                                                                                                                                                                                                                                               |
| convergence (G1 §4.3: spell damage with energy shield, life with armour, sword with either, near a home) | holds with exceptions: Zeal unnamed (F12); the Homily wheel's energy shield ends (F11, 14 steps, borderline)                                                                                                                                                                                  |

Area labels were not checked, as the user asked. The reference game is not named in this report.
