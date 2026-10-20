# Third round: one-stop shops, and a late game for casters and summoners (2026-10-20)

What you asked for:

- Fix the one-stop shops the second round's walks found: the Vanguard's mace and shield, the Zealot's fire sceptre
  line, the poison claw, the Reaver's leech, and minions.
- Give casters and summoners build-specific notables after points 30 to 50: a late cluster per element, a chaos-spell
  notable (there was none), and a second wand-attack cluster.
- Then audit for similar problems, especially specializations without enough clusters to be fully supported (the last
  section).

Checks: audit 0 problems, 0 edge crossings, names test passing, `tsc` clean, ids registered. Nothing is committed.

Maps (redrawn): `D-all-nodes.png`, `D-all-nodes-text-north.png` and `D-all-nodes-text-south.png`, `D-<class>.png` and
`D-<class>-text.png`.

---

## The one-stop shops

### The Vanguard's mace and shield: fixed

Bracing, Mortar and Stone, Iron Lungs, Weight of Iron and Stone Heart were one chain, each about four steps from the
next, so the build took all five by point 19 without a decision.

- **Bracing and Thick Skin traded places.**
  - Bracing (shield block) is now on the slam road, at the Yard border, a step from Thunderstep (two-handed). The
    shield and the two-hander are now neighbours that compete.
  - Thick Skin (armour) is a pocket off the tower road, on the way to the maces.
  - The link from the Bulwark wheel to the block pocket is gone.
- **Iron Lungs no longer joins the armour notable to the maces.** Its two smalls run on to the tower junction, and the
  notable hangs off the second one. Its link to the mace wheel is gone.

The result: the shield leaves the start south-east, the mace west, and armour and life north-west. A mace-and-shield
build now chooses which way to go first and pays roads to go the other way.

| Steps between                       | Before | After |
| ----------------------------------- | ------ | ----- |
| Bracing and Mortar and Stone        | 4      | 15    |
| Bracing and Weight of Iron          | 8      | 14    |
| Mortar and Stone and Weight of Iron | 4      | 5     |
| Iron Lungs and Weight of Iron       | 3      | 4     |

Still open: the Bulwark wheel's two sides (life and armour) are both wanted by an armour build. Weight of Iron and
Greatweight sell the same stun pairing five steps apart.

### The Zealot's fire sceptre: fixed

Gilded Rod, Kindled Steel and Searing Avatar sat on one eleven-node corridor.

- **Kindled Steel and Rimed Steel traded places.**
  - Kindled Steel (fire strikes that ignite) is now the pocket off the Ambulatory's sixth node, on the Cathedral's
    north-west.
  - Rimed Steel (cold strikes that chill) is on the Bell Tower wheel, against Benediction (aura).

The fire sceptre now has three destinations: the Vestry's sceptre, the Ambulatory's fire strike, and the keystone at
the tower's tip. The corridor to Searing Avatar passes a cold-strike notable, which the keystone half undoes: a fair
price, with a way round by the back road.

| Steps between                    | Before | After |
| -------------------------------- | ------ | ----- |
| Gilded Rod and Kindled Steel     | 6      | 13    |
| Kindled Steel and Searing Avatar | 6      | 12    |
| Gilded Rod and Searing Avatar    | 11     | 11    |

### The poison claw: fixed (in two steps)

Talon, Barbed Point, Carrion Claws, Festering and Cruel Agony were all within six steps of the Rookery junction.

- **Festering left the Knife.** It is now poison with bleeding, at the end of the Pits' east chain in the Yard, where a
  Strider coming up the dear road from the Bow finds it first.
- **The Stair wheel's west side is Rotting Word,** the first chaos-spell notable (below).
- **Carrion Claws went out to the Rooftops,** the Knife's new outer road (below). This came after the audit: with only
  Festering moved, Talon, Barbed Point, Carrion Claws and Cruel Agony were still 6 to 8 steps apart. Black Flock, the
  minion notable first placed on the Rooftops, took Carrion Claws' side of the Docks wheel, which is now traps or
  minions.

The poison claw now takes its core near the start (Talon 6, Barbed Point 12, Cruel Agony 18 points out), then chooses a
direction for the rest.

| From the core                                             | Steps                               |
| --------------------------------------------------------- | ----------------------------------- |
| Carrion Claws (the second claw, with chaos), the Rooftops | 14 from Barbed Point, 17 from Talon |
| Venom Fletching (chaos attacks with poison), the Strider  | 11                                  |
| Festering (poison with bleeding), the Yard                | 25                                  |

### The Reaver's leech: fixed

Red Harvest, Crimson Pact and Thirsting Blade all hung off one junction in the Pits. Thirsting Blade (mana leech and
mana on hit) was also a copy of Fighting Breath's pairing.

- **Thirsting Blade moved west and changed partner.** It is now life leech with attack speed, a pocket off the road
  from Elemental Edge to Headsman.
- Festering took its old chain in the Pits.

The leech Reaver now chooses a direction: the Pits for Red Harvest and Crimson Pact, or the west road for Thirsting
Blade.

| Steps between                    | Before | After |
| -------------------------------- | ------ | ----- |
| Red Harvest and Thirsting Blade  | 5      | 15    |
| Crimson Pact and Thirsting Blade | 7      | 21    |

### Minions: fixed by adding late clusters

A summoner had every minion notable by point 35. The minion clusters were already apart (9, 9 and 14 steps); there were
just too few for 17 minion gems.

- **Black Flock** (minion damage and speed, with movement speed) is the south side of the Knife's Docks wheel, 12
  steps from the Shade start. It was first placed on the Rooftops, 21 from the Shade start; the audit pointed out that
  the Knife's own summoner should not have to walk past Shepherd's distance for it.
- **Grave Host** (minion life, with the summoner's armour) is in the Barrows, the Wall's far south.

Each has a partner no other minion cluster has.

| From the Zealot start        | Steps |
| ---------------------------- | ----- |
| Shepherd                     | 8     |
| Familiars                    | 16    |
| Volatile Servants (keystone) | 20    |
| Ossuary                      | 22    |
| Black Flock                  | 23    |
| Grave Host                   | 31    |

---

## A late game for casters and summoners

Each new cluster has a partner that differs from the existing clusters of its specialization.

| Cluster      | Where                                          | Lines                                               | Its twins and their partners                                                           |
| ------------ | ---------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Sleet        | the Knife's Rooftops                           | cold, spell projectile damage, projectile speed     | Hoarfrost (chill, energy shield) and Shatter (freeze, penetration), Spire              |
| Thunder Peal | Cathedral, off the Ambulatory's first node     | lightning, mana regeneration, shock duration        | Thunderhead (cast speed), Overcharge (shock effect), Spire; Static Edge (crit), Knife  |
| Censer       | Cathedral, off the Rampart road                | burning damage, area damage, ignite duration        | Cinder (ignite chance, faster burning), Spire; Kindled Steel (fire strikes), Cathedral |
| Rotting Word | the Knife's Stair wheel (Festering's old side) | chaos spell damage, damage over time, cast speed    | Withering (damage-over-time multiplier), Spire                                         |
| Tomb Dust    | Cathedral, off the crossing road to the Spire  | chaos spell damage, energy shield, spell area       | as above                                                                               |
| Deft Wand    | Spire, six steps from the start                | wand attack damage, wand accuracy, projectile speed | Wand Volley (wand speed and crit), 13 steps out on the east side                       |

**A new line, `chaosSpell`,** in `lines.ts`. There was no way to say "chaos damage with spells". The tree's chaos
spells are all damage-over-time skills, so the line was checked to reach their damage over time.

Rotting Word first carried a curse line, but Hexwright's crossing landed a step from it and Second Curse is five steps
away, so the curse line came off. Even without it, the audit found that a chaos hexer (chaos curses exist) had Rotting
Word, Hexwright and Second Curse by point 17. **Hexwright and Devotion traded places** in the Spire's Scriptorium:
Hexwright is now the pocket up the east road, 7 steps from Rotting Word and 11 from Second Curse, and the crossing to the
Knife leaves from Devotion's chain.

### The Rooftops (new area, `knife/roofs.ts`)

- **What it is:** an outer road of nine attribute nodes round the Knife's north-east, with Carrion Claws and Sleet
  hanging off it.
- **Where it runs:** from the Static Edge pocket's small, round the outside of Hollow Vessel and Cruel Agony, down to the
  trap wheel. A middle link comes in from the Quiet Shot pocket.
- **Why:** the Knife's north-east was all keystone spurs and leaves. The road joins that ground and has three ways in.
- **Side effect:** Static Edge is now a leaf off the road.

### Where a Mystic now finds each element

| Element      | Clusters and steps from the Mystic start                           |
| ------------ | ------------------------------------------------------------------ |
| Cold         | Hoarfrost 17, Shatter 20, Sleet 26 (Rimed Steel, cold strikes, 23) |
| Lightning    | Thunderhead 16, Static Edge 18, Overcharge 20, Thunder Peal 29     |
| Fire         | Hearthfire 13, Flashpoint 18, Cinder 21, Censer 25                 |
| Chaos        | Rotting Word 14, Withering 15, Tomb Dust 23                        |
| Wand attacks | Deft Wand 6, Wand Volley 13                                        |

The far twins are 21 to 45 steps from the first ones, so a caster's points 60 to 120 have somewhere to go.

---

## Measured

|                                                  | Round 2 | Round 3                                                       |
| ------------------------------------------------ | ------- | ------------------------------------------------------------- |
| Nodes                                            | 922     | 955                                                           |
| Notables                                         | 179     | 187                                                           |
| Edge crossings                                   | 0       | 0                                                             |
| Places where one node strands more than a pocket | 6       | 6 (the same places; Festering joined Crimson Pact's junction) |
| Median steps to the nearest notable              | 3       | 3 overall; 4 in the Knife and the Cathedral                   |

Per region: Mystic 178 nodes and 35 notables, Vanguard 184 and 36, Reaver 134 and 29, Shade 130 and 24, Zealot 149 and
27, Strider 144 and 32 (untouched).

---

## The audit

Two agents audited the tree after the fixes above; both were read-only. Their full reports are in `audit/round3/`:

- `specializations.md` measures every specialization against the skill gems that want it. It walked a build for each thin
  one and proposes a placement and a partner.
- `one-stop-shops.md` walked eleven builds, at least one per class, on the new layout.

I checked their claims against CONSTRAINTS before listing them here. Routes that pass an unwanted notable with a way
round (§5.5) are left out.

### Acted on during this round

The one-stop-shop audit found four problems in this round's own work, so I fixed them before writing this up:

- **The poison claw was still a one-stop shop.** Carrion Claws went out to the Rooftops, and Black Flock took its place
  on the Docks wheel. Described above.
- **Rotting Word created a chaos-hexer shop:** it sat 3 steps from Hexwright and 5 from Second Curse. Hexwright and Devotion
  traded places (described above).
- **Black Flock was 21 steps from the Shade start,** farther than Shepherd. It is now 12.
- **Rotting Word repeated Lingering's pairing** (duration with damage over time, 10 steps apart). It is now chaos spell
  damage, damage over time and cast speed.

Both reports describe the tree just before these changes. Read their claw, curse and minion numbers with that in mind.

### Specializations without enough clusters

Ranked by gems served times clusters missing. For weapons, a gem that several weapons can use counts as a fraction for
each, so shared melee gems do not make every weapon look thin.

| #   | Specialization    | Gems                        | Clusters                                              | The gap                                                                                                                         | Proposed fix                                                                                                                                                            |
| --- | ----------------- | --------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Curses            | 14 (6 int, 4 str, 4 dex)    | 2, both on the int side                               | A Mystic hexer has both by about point 23, then nothing. A str or dex character who curses finds nothing within 15 to 24 steps. | Two clusters: curse effect with armour on the Wall's west road, and curse effect with damage against cursed enemies (new line) on the Yard's road to the Pits           |
| 2   | Channelling       | 13 (9 spells, 4 attacks)    | 0, and no line                                        | Choosing a channelling skill costs and buys nothing in the tree                                                                 | A new `channelDamage` line; a spell cluster on the Spire's north rim (with cost reduction) and an attack cluster on the Rooftops (with attack speed and stun avoidance) |
| 3   | Physical spells   | 13                          | 0, and no line                                        | The physical lines reach attacks only. Every other damage type has a spell line now.                                            | A new `physSpell` line; clusters on the Rooftops (with duration) and by the crypt stair (with elemental damage, for the spells that convert)                            |
| 4   | Elemental attacks | 20 (12 of them dex, 7 bows) | Fire 1 and cold 1, both in the Cathedral; lightning 0 | A Reaver with a lightning sword finds its first lightning notable at point 69                                                   | A lightning-attack cluster (with attack speed) south of the Pits; a fire-attack bow cluster in your Strider                                                             |
| 5   | Traps             | 9                           | 2 with the same pairing                               | Tripwire and Trapper both sell trap damage with throwing speed; a trapper is done at point 21                                   | Re-line Trapper to trap damage with area; add a third cluster (the proposed spot, on the Spire's north-east rim, is the report's weakest)                               |
| 6   | Daggers           | 19 usable, about 5 weighted | 2, both in the Knife                                  | Done at point 17. Quiet Knife's spell half does nothing for a dagger attacker.                                                  | A late dagger cluster (with dagger speed and accuracy) off the Rooftops                                                                                                 |
| 7   | Spell block       | a defence                   | 2, both shield-only and int-side                      | The Wall's and the Yard's shield builds have none within 18 steps                                                               | Spell block with life on block in the Barrows                                                                                                                           |
| 8   | Dual wield        | all one-handers             | 3                                                     | Two of the three pair it with crit; none on the strength side                                                                   | Dual-wield damage with armour on the Wall's west road                                                                                                                   |

Claws were on the list too (2 clusters, done at point 19). Moving Carrion Claws to the Rooftops puts them 17 steps apart
with different partners, so the report's extra claw cluster is now optional. Staves are thin (2 clusters) but covered by
the five two-handed clusters; a Zealot warstaff walk never runs out.

**New lines the proposals need:**

- `channelDamage`, `physSpell` and `damageVsCursed`. None needs engine work.
- Each still needs the sheet-and-fight check (§10.3) before a node carries it.
- Unverified: whether physical increases reach the part of a spell that converts to an element.

**Two of these need your call:**

- **Channelling.** CONSTRAINTS §14 records "channelled" among the delivery categories you struck as section ideas. This
  would be a line on two notables, not a section, but it is close to that line.
- **The fire-attack bow cluster.** It is in your Strider.

**Checked and adequately supplied:**

- **Weapons:** swords, axes, maces, sceptres, bows, wand attacks (now 2 clusters for 4 gems), one- and two-handed.
- **Deliveries:** totems, mines, brands, warcries, minions (now 5 clusters for 17 gems), auras.
- **Damage types:** chaos spells and chaos attacks, the elemental spells, physical attacks.
- **Ailments:** bleed, poison, ignite, freeze and chill, shock, damage over time.
- **Wand spells:** Wandwork reaches every spell, so it is a weapon choice for casters, not a skill specialization.
- **No line needed:** slams, strikes, novas, guard and movement skills are served by existing lines, so no new ones are
  proposed (§14).

### One-stop shops still open

| Where                               | The problem                                                                                                                                                                                       | Proposed fix                                                                                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The two-handed mace in the Barbican | Six wanted notables in 21 points: Weight of Iron to Greatweight 6, Greatweight to Crushing Blow 4, Crushing Blow to Stagger 4. Greatweight repeats Weight of Iron's stun pairing, and Headsman's. | Give Greatweight a partner other than stun (not armour, area or crit, which its neighbours sell). Cut `greatweight.d` to `crushing.b`: Greatweight to Crushing Blow goes from 4 to 10, no start distance changes, nothing stranded. |
| Sword and board in the Muster       | Keen Edge and Light Blades are still 3 apart. Round 2's cut missed, because both link the blades junction.                                                                                        | Cut `yard.blades.lightBlades.a` to `yard.blades.j1.a`: 8 apart, no start distance changes. The rest waits for the Yard re-lay (§16).                                                                                                |
| The Shieldwall keystone spur (§9.1) | Still a road between Elemental Edge and Executioner. The leech two-hander's cheapest way from Headsman to Red Harvest runs through it.                                                            | A road node from `yard.shield.j2.a` to Elemental Edge, leaving the spur a dead end. Placement not yet checked.                                                                                                                      |
| The Barrows' two-hander row         | Headsman, Greatblade and Heavy Hands hang off three adjacent road nodes.                                                                                                                          | Move the Greatblade pocket from `e2` to `e7`: Headsman to Greatblade becomes 10. Placement not yet checked.                                                                                                                         |
| Grave Host                          | 23 steps from the Vanguard start, against Shepherd's 15.                                                                                                                                          | **Your call.** Keep it as every summoner's farthest destination, or bring it nearer the Vanguard as the strength summoner's own door.                                                                                               |
| Mist Walk and Tumble                | Identical lines, 17 apart (§5.1).                                                                                                                                                                 | Re-partner Tumble.                                                                                                                                                                                                                  |

**In your Strider, as proposals:**

- **The projectile rim:** eight build notables in 28 points, with pairs 2 to 4 steps apart.
- **Close Quarters' spur is a road.** Keystone spurs should be dead ends (§9.1).
- **Same pairings:** True Aim and Quick Hands; Vital Aim and Killing Eye; Tripwire and Trapper (the Trapper re-line
  above fixes this one); Hatchet Work and Hewing.

**To watch:** Rimed Steel is now on the Vestry–Bell Tower line, 6 steps from Gilded Rod. That gives a cold sceptre the
shape the fire sceptre used to have. With one cold-attack cluster in the tree, it belongs with item 4 above.

### Next

The specialization gaps and the open one-stop shops are not fixed. They are proposals, waiting for your go-ahead.

- **Specialization fixes, cheapest first:** the trap re-line, then curses, the lightning-attack cluster, daggers, spell
  block and dual wield. All use existing lines except the curse cluster's `damageVsCursed`.
- **The new lines:** physical spells, and channelling if you want it, each need the sheet-and-fight check first.
- **Two of the shop fixes are single link cuts:** the two-handed mace and sword and board.
